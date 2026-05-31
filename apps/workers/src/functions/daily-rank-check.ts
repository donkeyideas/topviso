import gplay from 'google-play-scraper'
import { inngest } from '../lib/inngest'
import { getServiceClient } from '../lib/supabase'

// Daily category rank tracking for all apps (iOS + Android)
// Stores top-category and overall rank into app_rankings_daily.
export const dailyRankCheck = inngest.createFunction(
  { id: 'daily-rank-check', name: 'Daily Rank Check' },
  { cron: '0 10 * * *' },
  async ({ step }) => {
    const supabase = getServiceClient()

    const apps = await step.run('fetch-apps', async () => {
      const { data } = await supabase
        .from('apps')
        .select('id, store_id, platform, category')
        .eq('is_active', true)

      return data ?? []
    })

    if (!apps.length) return { checked: 0, errors: 0 }

    const today = new Date().toISOString().split('T')[0]!
    let checked = 0
    let errors = 0

    for (const app of apps) {
      await step.run(`rank-check-${app.id}`, async () => {
        try {
          let rankOverall: number | null = null
          let rankCategory: number | null = null
          let category: string | null = app.category ?? null

          if (app.platform === 'ios') {
            // iTunes RSS feeds expose chart rank
            const overallRes = await fetch(
              'https://itunes.apple.com/us/rss/topfreeapplications/limit=200/json',
            )
            if (overallRes.ok) {
              const j = (await overallRes.json()) as {
                feed?: { entry?: Array<{ id?: { attributes?: { 'im:id'?: string } } }> }
              }
              const entries = j.feed?.entry ?? []
              const idx = entries.findIndex(
                (e) => e.id?.attributes?.['im:id'] === app.store_id,
              )
              if (idx >= 0) rankOverall = idx + 1
            }
          } else if (app.platform === 'android') {
            // google-play-scraper exposes top-grossing/top-free lists per category.
            // Casts are necessary because the package's d.ts declares the constant
            // namespaces as enum *types* rather than value objects.
            const TOP_FREE = 'TOP_FREE' as unknown as Parameters<typeof gplay.list>[0] extends infer T
              ? T extends { collection?: infer C } ? C : never
              : never
            const overall = await gplay
              .list({
                collection: TOP_FREE,
                num: 250,
                country: 'us',
                lang: 'en',
              })
              .catch(() => [] as Array<{ appId: string }>)
            const oi = overall.findIndex((a) => a.appId === app.store_id)
            if (oi >= 0) rankOverall = oi + 1

            if (app.category) {
              const cat = await gplay
                .list({
                  collection: TOP_FREE,
                  category: app.category as unknown as Parameters<typeof gplay.list>[0] extends infer T
                    ? T extends { category?: infer C } ? C : never
                    : never,
                  num: 250,
                  country: 'us',
                  lang: 'en',
                })
                .catch(() => [] as Array<{ appId: string }>)
              const ci = cat.findIndex((a) => a.appId === app.store_id)
              if (ci >= 0) rankCategory = ci + 1
              category = app.category
            }
          } else {
            return
          }

          const { error } = await supabase.from('app_rankings_daily').upsert(
            {
              app_id: app.id,
              date: today,
              country: 'US',
              category,
              rank_overall: rankOverall,
              rank_category: rankCategory,
            },
            { onConflict: 'app_id,date,country' },
          )
          if (error) {
            console.error('[daily-rank-check] upsert failed', {
              app_id: app.id,
              platform: app.platform,
              error: error.message,
            })
            errors++
            return
          }
          checked++
        } catch (err) {
          console.error('[daily-rank-check] rank fetch failed', {
            app_id: app.id,
            platform: app.platform,
            error: err instanceof Error ? err.message : String(err),
          })
          errors++
        }
      })
    }

    return { checked, errors }
  },
)
