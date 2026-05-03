import { inngest } from '../lib/inngest'
import { getServiceClient } from '../lib/supabase'

// Daily category rank tracking for all apps
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

    if (!apps.length) return { checked: 0 }

    const today = new Date().toISOString().split('T')[0]!
    let checked = 0

    for (const app of apps) {
      await step.run(`rank-check-${app.id}`, async () => {
        if (app.platform === 'ios') {
          const url = `https://itunes.apple.com/lookup?id=${app.store_id}&country=us`
          const res = await fetch(url)
          if (!res.ok) return

          const data = await res.json() as { results: Array<{ trackId: number }> }
          if (!data.results[0]) return

          await supabase.from('app_rankings_daily').upsert(
            {
              app_id: app.id,
              date: today,
              country: 'US',
              category: app.category,
            },
            { onConflict: 'app_id,date,country' }
          )
        }

        checked++
      })
    }

    return { checked }
  }
)
