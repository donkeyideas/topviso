import { inngest } from '../lib/inngest'
import { getServiceClient } from '../lib/supabase'
import { lookupPlayStoreApp, checkKeywordRank, fetchPlayStoreReviews } from '../scrapers/play-store'
import { extractKeywordsField } from '../lib/extract-keywords'

// Runs daily at 7am UTC — scrapes Play Store data for all tracked Android apps
export const scrapePlayStore = inngest.createFunction(
  { id: 'scrape-play-store', name: 'Scrape Play Store' },
  { cron: '0 7 * * *' },
  async ({ step }) => {
    const supabase = getServiceClient()
    const today = new Date().toISOString().split('T')[0]!

    const apps = await step.run('fetch-android-apps', async () => {
      const { data } = await supabase
        .from('apps')
        .select('id, store_id, organization_id')
        .eq('platform', 'android')
        .eq('is_active', true)

      return data ?? []
    })

    if (!apps.length) return { processed: 0, keywords: 0, reviews: 0 }

    let processed = 0
    let keywordsChecked = 0
    let reviewsScraped = 0

    for (const app of apps) {
      // Determine the app's primary country from its tracked keywords (mode);
      // fall back to 'us'. Used for metadata + reviews + install storage so
      // non-US apps see their actual store data.
      const primaryCountry = await step.run(`primary-country-${app.id}`, async () => {
        const { data: kws } = await supabase
          .from('keywords')
          .select('country')
          .eq('app_id', app.id)
          .eq('is_tracked', true)
        const counts = new Map<string, number>()
        for (const k of kws ?? []) {
          const c = (k.country ?? 'us').toLowerCase()
          counts.set(c, (counts.get(c) ?? 0) + 1)
        }
        let best = 'us'
        let bestN = 0
        for (const [c, n] of counts) {
          if (n > bestN) { best = c; bestN = n }
        }
        return best
      })

      // Step 1: Scrape app metadata (richer data via google-play-scraper)
      await step.run(`scrape-app-${app.id}`, async () => {
        const info = await lookupPlayStoreApp(app.store_id, { country: primaryCountry })
        if (!info) return

        // Update app record with latest data
        await supabase
          .from('apps')
          .update({
            name: info.title,
            icon_url: info.icon,
            developer: info.developer || undefined,
            category: info.category || undefined,
          })
          .eq('id', app.id)

        // Store full metadata snapshot (richer than before)
        const derivedKeywords = extractKeywordsField(info.title, info.description)
        await supabase.from('app_metadata_snapshots').insert({
          app_id: app.id,
          title: info.title,
          description: info.description,
          keywords_field: derivedKeywords,
          metadata: {
            score: info.score,
            ratings: info.ratingCount,
            installs: info.installs,
            minInstalls: info.minInstalls,
            maxInstalls: info.maxInstalls,
            developer: info.developer,
            genre: info.category,
            genreId: info.genreId,
            version: info.version,
            updated: info.updated,
            screenshots: info.screenshots,
            reviews: info.reviews,
            country: primaryCountry.toUpperCase(),
          },
        })

        // Store install estimate
        if (info.minInstalls != null) {
          await supabase.from('app_installs_estimate').upsert(
            {
              app_id: app.id,
              date: today,
              country: primaryCountry.toUpperCase(),
              downloads_low: info.minInstalls,
              downloads_high: info.maxInstalls ?? info.minInstalls * 2,
            },
            { onConflict: 'app_id,date,country' },
          )
        }

        processed++
      })

      // Step 2: Check keyword rankings for ALL tracked keywords
      await step.run(`keywords-${app.id}`, async () => {
        const { data: keywords } = await supabase
          .from('keywords')
          .select('id, text, country')
          .eq('app_id', app.id)
          .eq('is_tracked', true)

        if (!keywords || keywords.length === 0) return

        for (const kw of keywords) {
          const country = (kw.country ?? 'us').toLowerCase()
          const position = await checkKeywordRank(kw.text, app.store_id, country)

          const { error } = await supabase.from('keyword_ranks_daily').upsert(
            {
              keyword_id: kw.id,
              date: today,
              rank: position,
            },
            { onConflict: 'keyword_id,date' },
          )
          if (error) {
            console.error('[scrape-play-store] rank upsert failed', {
              keyword_id: kw.id,
              error: error.message,
            })
          }

          keywordsChecked++
          await new Promise(r => setTimeout(r, 500))
        }
      })

      // Step 3: Scrape latest reviews
      await step.run(`reviews-${app.id}`, async () => {
        const reviews = await fetchPlayStoreReviews(app.store_id, 50, { country: primaryCountry })
        if (reviews.length === 0) return

        for (const review of reviews) {
          const { error } = await supabase.from('reviews').upsert(
            {
              app_id: app.id,
              store_review_id: review.id,
              author: review.userName,
              title: null,
              body: review.text,
              rating: review.score,
              reviewed_at: review.date,
              version: review.version ?? null,
            },
            { onConflict: 'app_id,store_review_id', ignoreDuplicates: true },
          )
          if (error) {
            console.error('[scrape-play-store] review upsert failed', {
              app_id: app.id,
              store_review_id: review.id,
              error: error.message,
            })
            continue
          }
          reviewsScraped++
        }
      })

      await step.sleep('rate-limit', '2s')
    }

    return { processed, keywordsChecked, reviewsScraped }
  }
)
