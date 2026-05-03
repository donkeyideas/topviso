import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'

// Force dynamic — never cache this route
export const dynamic = 'force-dynamic'

// GET /api/app-data?appId=... — fetch single app
// GET /api/app-data?orgId=... — fetch all apps in org
// GET /api/app-data?appId=...&include=analysis,snapshot — fetch with related data
export async function GET(request: NextRequest) {
  const serverClient = await getSupabaseServerClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const appId = searchParams.get('appId')
  const orgId = searchParams.get('orgId')
  const include = searchParams.get('include')?.split(',') ?? []

  const supabase = getSupabaseAdmin()

  // Single app by ID
  if (appId) {
    const { data: app, error } = await supabase
      .from('apps')
      .select('*')
      .eq('id', appId)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 })
    }

    const result: Record<string, unknown> = { app }

    // Include related data if requested
    if (include.includes('analysis')) {
      const { data: analysis } = await supabase
        .from('analysis_results')
        .select('app_id, analysis_type, result')
        .eq('app_id', appId)

      result.analysis = analysis ?? []
    }

    if (include.includes('snapshot')) {
      const { data: snapshot } = await supabase
        .from('app_metadata_snapshots')
        .select('*')
        .eq('app_id', appId)
        .order('snapshot_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      result.snapshot = snapshot
    }

    if (include.includes('keywords')) {
      const { data: keywords } = await supabase
        .from('keywords')
        .select('*, keyword_ranks_daily(rank, date, search_volume, difficulty)')
        .eq('app_id', appId)
        .order('created_at', { ascending: false })
        .limit(50)

      result.keywords = keywords ?? []
    }

    if (include.includes('reviews')) {
      const { data: reviews } = await supabase
        .from('reviews')
        .select('*')
        .eq('app_id', appId)
        .order('reviewed_at', { ascending: false })
        .limit(50)

      result.reviews = reviews ?? []
    }

    // Include sibling apps in the same org
    if (include.includes('siblings')) {
      const { data: siblings } = await supabase
        .from('apps')
        .select('id, name, platform, category, icon_url')
        .eq('organization_id', app.organization_id)
        .order('created_at', { ascending: true })

      result.orgApps = siblings ?? []
    }

    return NextResponse.json(result)
  }

  // All apps in an org
  if (orgId) {
    const { data: apps, error } = await supabase
      .from('apps')
      .select('*')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ apps: apps ?? [] })
  }

  // Scope to the authenticated user's organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership) {
    // Auto-create organization for new users who skipped onboarding
    const newOrgId = crypto.randomUUID()
    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'My'
    const orgName = `${userName}'s Team`
    const slug = `${orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${newOrgId.slice(0, 6)}`

    const { error: orgErr } = await supabase
      .from('organizations')
      .insert({ id: newOrgId, name: orgName, slug })

    if (orgErr) {
      return NextResponse.json({ apps: [], organization_id: null })
    }

    await supabase
      .from('organization_members')
      .insert({ organization_id: newOrgId, user_id: user.id, role: 'owner' })

    await supabase
      .from('profiles')
      .update({ default_organization_id: newOrgId })
      .eq('id', user.id)

    return NextResponse.json({ apps: [], organization_id: newOrgId })
  }

  const { data: apps, error } = await supabase
    .from('apps')
    .select('*')
    .eq('organization_id', membership.organization_id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ apps: apps ?? [], organization_id: membership.organization_id })
}
