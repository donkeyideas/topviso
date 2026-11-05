import OpenAI from 'openai'
import { withAPILogging } from './api-logger'

let client: OpenAI | null = null

export function getDeepSeekClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY!,
      baseURL: 'https://api.deepseek.com',
      // Fail a hung call fast enough to stay under the serverless ceiling
      // (Vercel Hobby caps functions at 60s regardless of route maxDuration).
      // One retry on transient 429/5xx/network errors; worst case ~60s total
      // rather than the old 180s (60s x 3 attempts) that guaranteed a 504.
      timeout: 28_000,
      maxRetries: 1,
    })
  }
  return client
}

export async function loggedChatCompletion(
  params: OpenAI.ChatCompletionCreateParamsNonStreaming,
  metadata?: Record<string, unknown>,
): Promise<OpenAI.ChatCompletion> {
  const c = getDeepSeekClient()
  return withAPILogging(
    () => c.chat.completions.create(params),
    { ...metadata, model: params.model },
  )
}
