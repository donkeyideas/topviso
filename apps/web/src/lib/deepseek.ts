import OpenAI from 'openai'
import { withAPILogging } from './api-logger'

let client: OpenAI | null = null

export function getDeepSeekClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY!,
      baseURL: 'https://api.deepseek.com',
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
