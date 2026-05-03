import { inngest } from '../lib/inngest'
import { getServiceClient } from '../lib/supabase'
import { chatCompletion } from '../lib/deepseek'

// Polls LLM surfaces daily to check if they recommend tracked apps
export const pollLlmSurfaces = inngest.createFunction(
  { id: 'poll-llm-surfaces', name: 'Poll LLM Surfaces' },
  { cron: '0 8 * * *' },
  async ({ step }) => {
    const supabase = getServiceClient()

    const apps = await step.run('fetch-apps', async () => {
      const { data } = await supabase
        .from('apps')
        .select('id, name, store_id, platform, category')
        .eq('is_active', true)

      return data ?? []
    })

    if (!apps.length) return { polled: 0 }

    let polled = 0

    for (const app of apps) {
      await step.run(`poll-${app.id}`, async () => {
        const prompts = generatePrompts(app.name, app.category ?? 'general')

        for (const prompt of prompts) {
          try {
            const response = await chatCompletion(
              prompt,
              'You are a helpful assistant that recommends mobile apps. Be specific about app names.'
            )

            const mentioned = response.toLowerCase().includes(app.name.toLowerCase())

            // Persist to llm_mentions table
            await supabase.from('llm_mentions').insert({
              app_id: app.id,
              surface: 'DeepSeek',
              prompt,
              mentioned,
              position: mentioned ? 'listed' : 'not listed',
              response_excerpt: response.slice(0, 500),
              polled_at: new Date().toISOString(),
            })

            polled++
          } catch (err) {
            console.error(`[LLM] Error polling for ${app.name}:`, err)
          }

          await new Promise((r) => setTimeout(r, 2000))
        }
      })
    }

    return { polled }
  }
)

function generatePrompts(appName: string, category: string): string[] {
  return [
    `What are the best ${category} apps for iPhone?`,
    `Recommend me an app similar to ${appName}`,
    `What ${category} app should I download in 2026?`,
    `Compare the top ${category} apps available right now`,
  ]
}
