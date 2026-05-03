import { getSupabaseAdmin } from '@/lib/supabase/admin'

interface LimitCheckResult {
  allowed: boolean
  current: number
  limit: number
  message?: string
}

export async function checkAppLimit(organizationId: string): Promise<LimitCheckResult> {
  const supabase = getSupabaseAdmin()

  const [{ data: org }, { count }] = await Promise.all([
    supabase.from('organizations').select('app_limit').eq('id', organizationId).single(),
    supabase.from('apps').select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId).eq('is_active', true),
  ])

  const limit = org?.app_limit ?? 1
  const current = count ?? 0

  return {
    allowed: current < limit,
    current,
    limit,
    ...(current >= limit ? { message: `App limit reached (${current}/${limit}). Upgrade your plan to add more apps.` } : {}),
  }
}

export async function checkKeywordLimit(organizationId: string): Promise<LimitCheckResult> {
  const supabase = getSupabaseAdmin()

  const [{ data: org }, { count }] = await Promise.all([
    supabase.from('organizations').select('keyword_limit').eq('id', organizationId).single(),
    supabase.from('keywords').select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId),
  ])

  const limit = (org as { keyword_limit?: number } | null)?.keyword_limit ?? 50
  const current = count ?? 0

  return {
    allowed: current < limit,
    current,
    limit,
    ...(current >= limit ? { message: `Keyword limit reached (${current}/${limit}). Upgrade your plan to track more keywords.` } : {}),
  }
}

export async function checkSeatLimit(organizationId: string): Promise<LimitCheckResult> {
  const supabase = getSupabaseAdmin()

  const [{ data: org }, { count: memberCount }, { count: pendingCount }] = await Promise.all([
    supabase.from('organizations').select('seat_limit').eq('id', organizationId).single(),
    supabase.from('organization_members').select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId),
    supabase.from('invitations').select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId).is('accepted_at', null)
      .gt('expires_at', new Date().toISOString()),
  ])

  const limit = org?.seat_limit ?? 1
  const current = (memberCount ?? 0) + (pendingCount ?? 0)

  return {
    allowed: current < limit,
    current,
    limit,
    ...(current >= limit ? { message: `Seat limit reached (${current}/${limit}). Upgrade your plan to invite more members.` } : {}),
  }
}
