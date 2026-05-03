'use server'

import { getSupabaseAdmin } from '@/lib/supabase/admin'
import OpenAI from 'openai'

export async function testAPIConnection(
  provider: string,
): Promise<{ success: boolean; message: string; latencyMs?: number }> {
  const supabase = getSupabaseAdmin()

  try {
    const client = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: process.env.DEEPSEEK_API_KEY ?? '',
    })

    const start = Date.now()

    await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 5,
    })

    const latencyMs = Date.now() - start

    await supabase
      .from('platform_api_configs')
      .update({
        test_status: 'success',
        last_tested_at: new Date().toISOString(),
      })
      .eq('provider', provider)

    return {
      success: true,
      message: `Connection OK in ${latencyMs}ms`,
      latencyMs,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'

    await supabase
      .from('platform_api_configs')
      .update({
        test_status: 'failed',
        last_tested_at: new Date().toISOString(),
      })
      .eq('provider', provider)

    return { success: false, message: `Connection failed: ${message}` }
  }
}

export async function saveAPIConfig(
  provider: string,
  updates: { is_active?: boolean },
) {
  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('platform_api_configs')
    .update(updates)
    .eq('provider', provider)

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true, message: 'Configuration updated' }
}

export async function saveApiKey(
  provider: string,
  apiKey: string,
): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('platform_api_configs')
    .update({ api_key: apiKey })
    .eq('provider', provider)

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true, message: 'API key updated' }
}
