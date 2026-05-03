import { inngest } from '../lib/inngest'
import { getServiceClient } from '../lib/supabase'
import { lookupAppById, getAppRankForKeyword } from '../scrapers/app-store'

// Runs daily at 6am UTC — scrapes App Store data for all tracked iOS apps
export const scrapeAppStore = inngest.createFunction(
  { id: 'scrape-app-store', name: 'Scrape App Store' },
  { cron: '0 6 * * *' },
  async ({ step }) => {
    const supabase = getServiceClient()

    const apps = await step.run('fetch-ios-apps', async () => {
      const { data } = await supabase
        .from('apps')
        .select('id, store_id, organization_id')
        .eq('platform', 'ios')
        .eq('is_active', true)

      return data ?? []
    })

    if (!apps.length) return { processed: 0 }

    let processed = 0

    for (const app of apps) {
      await step.run(`scrape-app-${app.id}`, async () => {
        const info = await lookupAppById(app.store_id)
        if (!info) return

        await supabase
          .from('apps')
          .update({
            name: info.trackName,
            icon_url: info.artworkUrl512,
            developer: info.artistName,
            category: info.primaryGenreName,
            current_version: info.version,
          })
          .eq('id', app.id)

        await supabase.from('app_metadata_snapshots').insert({
          app_id: app.id,
          title: info.trackName,
          description: info.description,
          version: info.version,
          metadata: {
            score: info.averageUserRating,
            ratings: info.userRatingCount,
            developer: info.artistName,
            genre: info.primaryGenreName,
            genreId: undefined,
            version: info.version,
            updated: new Date(info.currentVersionReleaseDate).getTime(),
          },
        })

        processed++
      })

      await step.run(`ranks-app-${app.id}`, async () => {
        const { data: keywords } = await supabase
          .from('keywords')
          .select('id, text, country')
          .eq('app_id', app.id)
          .eq('is_tracked', true)

        if (!keywords?.length) return

        const today = new Date().toISOString().split('T')[0]!

        for (const kw of keywords) {
          const rank = await getAppRankForKeyword(kw.text, app.store_id, kw.country.toLowerCase())

          await supabase.from('keyword_ranks_daily').upsert(
            {
              keyword_id: kw.id,
              date: today,
              rank,
            },
            { onConflict: 'keyword_id,date' }
          )

          await new Promise((r) => setTimeout(r, 500))
        }
      })
    }

    return { processed }
  }
)
