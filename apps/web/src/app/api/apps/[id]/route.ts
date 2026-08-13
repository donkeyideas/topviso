import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'

// GET /api/apps/:id
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const serverClient = await getSupabaseServerClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = getSupabaseAdmin()

  const { data: app, error } = await supabase
    .from('apps')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !app) {
    return NextResponse.json({ error: 'App not found' }, { status: 404 })
  }

  return NextResponse.json({ data: app })
}

// PATCH /api/apps/:id
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const serverClient = await getSupabaseServerClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = getSupabaseAdmin()

  const body = await request.json()
  const updates: {
    name?: string
    is_active?: boolean
    icon_url?: string | null
    category?: string | null
    current_version?: string | null
    optimization_goal?: string
    target_keywords?: string[]
    website_url?: string | null
  } = {}

  if ('name' in body) updates.name = body.name
  if ('is_active' in body) updates.is_active = body.is_active
  if ('icon_url' in body) updates.icon_url = body.icon_url
  if ('category' in body) updates.category = body.category
  if ('current_version' in body) updates.current_version = body.current_version
  if ('optimization_goal' in body) updates.optimization_goal = body.optimization_goal
  if ('website_url' in body) {
    const raw = body.website_url
    if (raw === null || raw === '') {
      updates.website_url = null
    } else if (typeof raw === 'string') {
      try {
        const u = new URL(raw.trim())
        if (u.protocol === 'https:' || u.protocol === 'http:') updates.website_url = u.toString()
      } catch {
        return NextResponse.json({ error: 'Invalid website URL' }, { status: 400 })
      }
    }
  }
  if ('target_keywords' in body && Array.isArray(body.target_keywords)) {
    updates.target_keywords = body.target_keywords
      .map((k: unknown) => String(k ?? '').trim())
      .filter((k: string) => k.length > 0)
      .slice(0, 3)
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data: app, error } = await supabase
    .from('apps')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: app })
}

// DELETE /api/apps/:id
// Soft-delete: flip is_active off instead of hard-deleting the row. A hard
// delete cascades (ON DELETE CASCADE) and destroys all keywords, rank history,
// and analysis for the app — unrecoverable if the app is later re-added. Soft
// delete hides the app (GET filters is_active=true) and frees the plan slot
// (checkAppLimit counts only active rows) while preserving all history, so a
// re-add of the same store app reactivates it with its data intact.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const serverClient = await getSupabaseServerClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('apps')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
