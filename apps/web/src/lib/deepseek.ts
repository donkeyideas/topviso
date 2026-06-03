import OpenAI from 'openai'
import { withAPILogging } from './api-logger'

let client: OpenAI | null = null

export function getDeepSeekClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY!,
      baseURL: 'https://api.deepseek.com',
      // Fail a hung call fast enough to stay under the route's maxDuration (300s),
      // and let the SDK retry transient 429/5xx/network errors rather than 500ing.
      timeout: 60_000,
      maxRetries: 2,
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
