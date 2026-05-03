import { createClient } from '@supabase/supabase-js'

const INPUT_COST_PER_1K = 0.00014
const OUTPUT_COST_PER_1K = 0.00028

let logClient: ReturnType<typeof createClient> | null = null

function getLogClient() {
  if (!logClient) {
    logClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
  }
  return logClient
}

export function logAPICall(params: {
  provider?: string
  endpoint?: string
  responseTimeMs: number
  promptTokens?: number
  completionTokens?: number
  isSuccess: boolean
  errorMessage?: string
  metadata?: Record<string, unknown>
}): void {
  const tokensUsed = (params.promptTokens ?? 0) + (params.completionTokens ?? 0)
  const costUsd =
    ((params.promptTokens ?? 0) / 1000) * INPUT_COST_PER_1K +
    ((params.completionTokens ?? 0) / 1000) * OUTPUT_COST_PER_1K

  getLogClient()
    .from('api_call_log')
    .insert({
      provider: params.provider ?? 'deepseek',
      endpoint: params.endpoint ?? 'chat.completions',
      method: 'POST',
      status_code: params.isSuccess ? 200 : 500,
      response_time_ms: Math.round(params.responseTimeMs),
      tokens_used: tokensUsed || null,
      prompt_tokens: params.promptTokens ?? null,
      completion_tokens: params.completionTokens ?? null,
      cost_usd: costUsd > 0 ? costUsd : null,
      is_success: params.isSuccess,
      error_message: params.errorMessage ?? null,
      metadata: params.metadata ?? {},
    })
    .then(({ error }) => {
      if (error) console.error('[api-logger]', error.message)
    })
}
