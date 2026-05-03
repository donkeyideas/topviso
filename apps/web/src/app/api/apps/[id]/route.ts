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
  } = {}

  if ('name' in body) updates.name = body.name
  if ('is_active' in body) updates.is_active = body.is_active
  if ('icon_url' in body) updates.icon_url = body.icon_url
  if ('category' in body) updates.category = body.category
  if ('current_version' in body) updates.current_version = body.current_version
  if ('optimization_goal' in body) updates.optimization_goal = body.optimization_goal

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
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
