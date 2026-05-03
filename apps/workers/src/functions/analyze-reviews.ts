import { inngest } from '../lib/inngest'
import { getServiceClient } from '../lib/supabase'
import { chatCompletion } from '../lib/deepseek'

// Analyzes new reviews: sentiment scoring + topic extraction
export const analyzeReviews = inngest.createFunction(
  { id: 'analyze-reviews', name: 'Analyze Reviews' },
  { cron: '0 9 * * *' },
  async ({ step }) => {
    const supabase = getServiceClient()

    const reviews = await step.run('fetch-unscored', async () => {
      const { data } = await supabase
        .from('reviews')
        .select('id, title, body, rating')
        .is('sentiment_score', null)
        .limit(50)

      return data ?? []
    })

    if (!reviews.length) return { analyzed: 0 }

    const batches = chunk(reviews, 10)
    let analyzed = 0

    for (let i = 0; i < batches.length; i++) {
      await step.run(`analyze-batch-${i}`, async () => {
        const batch = batches[i]!

        for (const review of batch) {
          const text = [review.title, review.body].filter(Boolean).join(' - ')
          if (!text.trim()) continue

          try {
            const response = await chatCompletion(
              `Analyze this app review and return ONLY a JSON object with:
- "sentiment": a number from -1.0 (very negative) to 1.0 (very positive)
- "topics": an array of 1-3 topic keywords

Review: "${text.slice(0, 500)}"`,
              'You are a sentiment analysis engine. Return only valid JSON, no explanation.'
            )

            const parsed = JSON.parse(response) as { sentiment: number; topics: string[] }
            const score = Math.max(-1, Math.min(1, parsed.sentiment))

            await supabase
              .from('reviews')
              .update({ sentiment_score: Math.round((score + 1) * 500) / 1000 })
              .eq('id', review.id)

            analyzed++
          } catch {
            // Skip unparseable responses
          }

          await new Promise((r) => setTimeout(r, 1000))
        }
      })
    }

    return { analyzed }
  }
)

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}
