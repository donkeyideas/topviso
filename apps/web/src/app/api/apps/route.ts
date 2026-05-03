import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { checkAppLimit } from '@/lib/plan-limits'

// GET /api/apps — list all active apps
export async function GET() {
  const serverClient = await getSupabaseServerClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseAdmin()

  const { data: apps, error } = await supabase
    .from('apps')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: apps })
}

// POST /api/apps — create a new app
export async function POST(request: Request) {
  const serverClient = await getSupabaseServerClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseAdmin()

  const body = await request.json()
  const { organization_id, platform, store_id, name } = body

  if (!organization_id || !platform || !store_id || !name) {
    return NextResponse.json(
      { error: 'Missing required fields: organization_id, platform, store_id, name' },
      { status: 400 }
    )
  }

  if (!['ios', 'android'].includes(platform)) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
  }

  const limitCheck = await checkAppLimit(organization_id)
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { error: limitCheck.message, code: 'LIMIT_EXCEEDED', current: limitCheck.current, limit: limitCheck.limit },
      { status: 403 }
    )
  }

  const { data: app, error } = await supabase
    .from('apps')
    .insert({ organization_id, platform, store_id, name })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: app }, { status: 201 })
}
