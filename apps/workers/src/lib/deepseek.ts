import OpenAI from 'openai'
import { logAPICall } from './api-logger'

export function getDeepSeekClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error('Missing DEEPSEEK_API_KEY')
  }

  return new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com',
  })
}

export async function chatCompletion(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const client = getDeepSeekClient()

  const messages: OpenAI.ChatCompletionMessageParam[] = []
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }
  messages.push({ role: 'user', content: prompt })

  const start = performance.now()
  try {
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages,
      temperature: 0.3,
      max_tokens: 2048,
    })
    logAPICall({
      responseTimeMs: performance.now() - start,
      promptTokens: response.usage?.prompt_tokens,
      completionTokens: response.usage?.completion_tokens,
      isSuccess: true,
      metadata: { source: 'workers' },
    })
    return response.choices[0]?.message?.content ?? ''
  } catch (err) {
    logAPICall({
      responseTimeMs: performance.now() - start,
      isSuccess: false,
      errorMessage: err instanceof Error ? err.message : String(err),
      metadata: { source: 'workers' },
    })
    throw err
  }
}
