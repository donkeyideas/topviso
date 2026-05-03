import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'

// Force dynamic — never cache this route
export const dynamic = 'force-dynamic'

// GET /api/analysis?appId=...&type=...
// Optionally: GET /api/analysis?appId=...&types=keywords,visibility,overview
export async function GET(request: NextRequest) {
  const serverClient = await getSupabaseServerClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const appId = searchParams.get('appId')
  const type = searchParams.get('type')
  const types = searchParams.get('types') // comma-separated list

  if (!appId) {
    return NextResponse.json({ error: 'appId is required' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // Single type query
  if (type) {
    const { data, error } = await supabase
      .from('analysis_results')
      .select('result')
      .eq('app_id', appId)
      .eq('analysis_type', type)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data?.result ?? null })
  }

  // Multiple types query
  if (types) {
    const typeList = types.split(',').map(t => t.trim()).filter(Boolean)
    const { data, error } = await supabase
      .from('analysis_results')
      .select('app_id, analysis_type, result')
      .eq('app_id', appId)
      .in('analysis_type', typeList)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? [] })
  }

  // All analysis for this app
  const { data, error } = await supabase
    .from('analysis_results')
    .select('app_id, analysis_type, result')
    .eq('app_id', appId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] })
}

// DELETE /api/analysis?appId=...&type=...
export async function DELETE(request: NextRequest) {
  const serverClient = await getSupabaseServerClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const appId = searchParams.get('appId')
  const type = searchParams.get('type')

  if (!appId || !type) {
    return NextResponse.json({ error: 'appId and type are required' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('analysis_results')
    .delete()
    .eq('app_id', appId)
    .eq('analysis_type', type)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
