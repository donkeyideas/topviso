'use server'

import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function updateOrgPlan(orgId: string, data: {
  plan_tier: 'solo' | 'team' | 'enterprise'
  app_limit: number
  keyword_limit: number
  seat_limit: number
  trial_ends_at: string | null
}) {
  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('organizations')
    .update({
      plan_tier: data.plan_tier,
      app_limit: data.app_limit,
      seat_limit: data.seat_limit,
      trial_ends_at: data.trial_ends_at,
    })
    .eq('id', orgId)

  if (error) throw new Error(error.message)

  // keyword_limit added via migration but not in generated types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any
  await client.from('organizations').update({ keyword_limit: data.keyword_limit }).eq('id', orgId)
}
