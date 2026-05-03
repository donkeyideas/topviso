import { NextRequest } from 'next/server'
import { requireSuperuser, adminResponse, adminError } from '@/lib/admin/middleware'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const auth = await requireSuperuser(request)
  if (!auth.ok) return auth.response

  try {
    const supabase = getSupabaseAdmin()

    // Fetch counts in parallel
    const [
      { count: userCount },
      { count: orgCount },
      { count: appCount },
      { count: keywordCount },
      { count: reviewCount },
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('organizations').select('id', { count: 'exact', head: true }),
      supabase.from('apps').select('id', { count: 'exact', head: true }),
      supabase.from('keywords').select('id', { count: 'exact', head: true }),
      supabase.from('reviews').select('id', { count: 'exact', head: true }),
    ])

    // Fetch recent activity (latest 10 audit log entries)
    const { data: recentActivity } = await supabase
      .from('profiles')
      .select('id, full_name, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    return adminResponse({
      counts: {
        users: userCount ?? 0,
        organizations: orgCount ?? 0,
        apps: appCount ?? 0,
        keywords: keywordCount ?? 0,
        reviews: reviewCount ?? 0,
      },
      recentUsers: recentActivity ?? [],
    })
  } catch {
    return adminError('INTERNAL', 'Failed to fetch overview data', 500)
  }
}
