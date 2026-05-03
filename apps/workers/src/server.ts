import express from 'express'
import { serve } from 'inngest/express'
import { inngest } from './lib/inngest'
import { scrapeAppStore } from './functions/scrape-app-store'
import { scrapePlayStore } from './functions/scrape-play-store'
import { pollLlmSurfaces } from './functions/poll-llm-surfaces'
import { analyzeReviews } from './functions/analyze-reviews'
import { dailyRankCheck } from './functions/daily-rank-check'

const app = express()
const port = process.env.PORT ?? 3001

app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: '@topviso/workers' })
})

// Inngest endpoint
app.use(
  '/api/inngest',
  serve({
    client: inngest,
    functions: [
      scrapeAppStore,
      scrapePlayStore,
      pollLlmSurfaces,
      analyzeReviews,
      dailyRankCheck,
    ],
  })
)

app.listen(port, () => {
  console.log(`[workers] listening on port ${port}`)
})
