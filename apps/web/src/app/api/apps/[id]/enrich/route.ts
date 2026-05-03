import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { fetchGooglePlayData, fetchAppleAppData } from '@/lib/store-scraper'

// POST /api/apps/:id/enrich — fetch metadata from store and update app
export async function POST(
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
    .select('id, platform, store_id')
    .eq('id', id)
    .single()

  if (error || !app) {
    return NextResponse.json({ error: 'App not found' }, { status: 404 })
  }

  try {
    const updates: {
      name?: string
      icon_url?: string | null
      developer?: string | null
      category?: string | null
      current_version?: string | null
    } = {}

    const storeData = app.platform === 'ios'
      ? await fetchAppleAppData(app.store_id)
      : await fetchGooglePlayData(app.store_id)

    if (storeData) {
      updates.name = storeData.title
      updates.icon_url = storeData.icon
      updates.developer = storeData.developer
      updates.category = storeData.genre
      updates.current_version = storeData.version
    }

    if (Object.keys(updates).length > 0) {
      const { data: updated } = await supabase
        .from('apps')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      return NextResponse.json({ data: updated })
    }

    return NextResponse.json({ data: app, enriched: false })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch store metadata' }, { status: 500 })
  }
}
