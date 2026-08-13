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
  const { organization_id, platform, store_id, name, website_url } = body

  if (!organization_id || !platform || !store_id || !name) {
    return NextResponse.json(
      { error: 'Missing required fields: organization_id, platform, store_id, name' },
      { status: 400 }
    )
  }

  if (!['ios', 'android'].includes(platform)) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
  }

  // Optional first-party website — only accept a well-formed http(s) URL.
  let websiteUrl: string | null = null
  if (typeof website_url === 'string' && website_url.trim()) {
    try {
      const u = new URL(website_url.trim())
      if (u.protocol === 'https:' || u.protocol === 'http:') websiteUrl = u.toString()
    } catch {
      // ignore a malformed URL rather than blocking app creation
    }
  }

  // Reactivate/dedupe: if this org already has a row for this store app (active
  // OR soft-deleted), reuse it instead of inserting a duplicate. This restores a
  // soft-deleted app WITH its keyword/rank history rather than starting fresh,
  // and prevents duplicate rows for the same store listing.
  const { data: existingRows } = await supabase
    .from('apps')
    .select('*')
    .eq('organization_id', organization_id)
    .eq('platform', platform)
    .eq('store_id', store_id)
    .order('created_at', { ascending: false })

  const existingApp = existingRows?.find((r) => r.is_active) ?? existingRows?.[0]
  if (existingApp) {
    // Already tracked and active → return it (idempotent), refresh website if given.
    if (existingApp.is_active) {
      const { data: updated } = await supabase
        .from('apps')
        .update({ name, ...(websiteUrl ? { website_url: websiteUrl } : {}) })
        .eq('id', existingApp.id)
        .select()
        .single()
      return NextResponse.json({ data: updated ?? existingApp, existed: true }, { status: 200 })
    }
    // Soft-deleted → reactivating counts against the plan limit.
    const limitCheck = await checkAppLimit(organization_id)
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.message, code: 'LIMIT_EXCEEDED', current: limitCheck.current, limit: limitCheck.limit },
        { status: 403 }
      )
    }
    const { data: reactivated, error: reErr } = await supabase
      .from('apps')
      .update({ is_active: true, name, ...(websiteUrl ? { website_url: websiteUrl } : {}) })
      .eq('id', existingApp.id)
      .select()
      .single()
    if (reErr) return NextResponse.json({ error: reErr.message }, { status: 500 })
    return NextResponse.json({ data: reactivated, reactivated: true }, { status: 200 })
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
    .insert({ organization_id, platform, store_id, name, website_url: websiteUrl })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: app }, { status: 201 })
}
