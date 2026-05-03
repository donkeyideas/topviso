import { createClient } from '@supabase/supabase-js'
import type OpenAI from 'openai'

const logClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const INPUT_COST_PER_1K = 0.00014
const OUTPUT_COST_PER_1K = 0.00028

interface LogAPICallParams {
  provider?: string
  endpoint?: string
  method?: string
  statusCode?: number
  responseTimeMs: number
  promptTokens?: number
  completionTokens?: number
  isSuccess: boolean
  errorMessage?: string
  metadata?: Record<string, unknown>
}

export function logAPICall(params: LogAPICallParams): void {
  const {
    provider = 'deepseek',
    endpoint = 'chat.completions',
    method = 'POST',
    statusCode,
    responseTimeMs,
    promptTokens,
    completionTokens,
    isSuccess,
    errorMessage,
    metadata = {},
  } = params

  const tokensUsed = (promptTokens ?? 0) + (completionTokens ?? 0)
  const costUsd =
    ((promptTokens ?? 0) / 1000) * INPUT_COST_PER_1K +
    ((completionTokens ?? 0) / 1000) * OUTPUT_COST_PER_1K

  logClient
    .from('api_call_log')
    .insert({
      provider,
      endpoint,
      method,
      status_code: statusCode ?? (isSuccess ? 200 : 500),
      response_time_ms: Math.round(responseTimeMs),
      tokens_used: tokensUsed || null,
      prompt_tokens: promptTokens ?? null,
      completion_tokens: completionTokens ?? null,
      cost_usd: costUsd > 0 ? costUsd : null,
      is_success: isSuccess,
      error_message: errorMessage ?? null,
      metadata,
    })
    .then(({ error }) => {
      if (error) console.error('[api-logger]', error.message)
    })
}

export async function withAPILogging<T extends OpenAI.ChatCompletion>(
  callFn: () => Promise<T>,
  metadata?: Record<string, unknown>,
): Promise<T> {
  const start = performance.now()
  try {
    const result = await callFn()
    const params: LogAPICallParams = {
      responseTimeMs: performance.now() - start,
      isSuccess: true,
    }
    if (result.usage?.prompt_tokens != null) params.promptTokens = result.usage.prompt_tokens
    if (result.usage?.completion_tokens != null) params.completionTokens = result.usage.completion_tokens
    if (metadata) params.metadata = metadata
    logAPICall(params)
    return result
  } catch (err) {
    const params: LogAPICallParams = {
      responseTimeMs: performance.now() - start,
      isSuccess: false,
      errorMessage: err instanceof Error ? err.message : String(err),
    }
    if (metadata) params.metadata = metadata
    logAPICall(params)
    throw err
  }
}
