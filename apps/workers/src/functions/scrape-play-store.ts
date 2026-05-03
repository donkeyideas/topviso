import { inngest } from '../lib/inngest'
import { getServiceClient } from '../lib/supabase'
import { lookupPlayStoreApp, checkKeywordRank, fetchPlayStoreReviews } from '../scrapers/play-store'

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
      // Step 1: Scrape app metadata (richer data via google-play-scraper)
      await step.run(`scrape-app-${app.id}`, async () => {
        const info = await lookupPlayStoreApp(app.store_id)
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
        await supabase.from('app_metadata_snapshots').insert({
          app_id: app.id,
          title: info.title,
          description: info.description,
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
          },
        })

        // Store install estimate
        if (info.minInstalls != null) {
          await supabase.from('app_installs_estimate').upsert(
            {
              app_id: app.id,
              date: today,
              country: 'US',
              downloads_low: info.minInstalls,
              downloads_high: info.maxInstalls ?? info.minInstalls * 2,
            },
            { onConflict: 'app_id,date,country' },
          )
        }

        processed++
      })

      // Step 2: Check keyword rankings (same as iOS daily-rank-check)
      await step.run(`keywords-${app.id}`, async () => {
        const { data: keywords } = await supabase
          .from('keywords')
          .select('id, text, country')
          .eq('app_id', app.id)
          .eq('is_tracked', true)
          .limit(30)

        if (!keywords || keywords.length === 0) return

        for (const kw of keywords) {
          const position = await checkKeywordRank(kw.text, app.store_id, kw.country ?? 'us')

          await supabase.from('keyword_ranks_daily').upsert(
            {
              keyword_id: kw.id,
              date: today,
              rank: position,
            },
            { onConflict: 'keyword_id,date' },
          )

          keywordsChecked++
          // Rate limit between keyword checks
          await new Promise(r => setTimeout(r, 500))
        }
      })

      // Step 3: Scrape latest reviews
      await step.run(`reviews-${app.id}`, async () => {
        const reviews = await fetchPlayStoreReviews(app.store_id, 50)
        if (reviews.length === 0) return

        for (const review of reviews) {
          // Upsert with store_review_id to avoid duplicates
          await supabase.from('reviews').upsert(
            {
              app_id: app.id,
              store_review_id: review.id,
              user_name: review.userName,
              title: null,
              body: review.text,
              rating: review.score,
              date: review.date,
              version: review.version ?? null,
            },
            { onConflict: 'app_id,store_review_id', ignoreDuplicates: true },
          )
          reviewsScraped++
        }
      })

      await step.sleep('rate-limit', '2s')
    }

    return { processed, keywordsChecked, reviewsScraped }
  }
)
