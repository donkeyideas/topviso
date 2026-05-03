import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseServerClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function GET(req: NextRequest) {
  const serverClient = await getSupabaseServerClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const appId = req.nextUrl.searchParams.get('appId')
  if (!appId) return NextResponse.json({ error: 'Missing appId' }, { status: 400 })

  // Fetch app to get platform + store_id
  const { data: app } = await supabaseAdmin
    .from('apps')
    .select('platform, store_id')
    .eq('id', appId)
    .single()

  if (!app?.store_id) return NextResponse.json({ headerImage: null, screenshots: [] })

  try {
    if (app.platform === 'android') {
      const { fetchGooglePlayData } = await import('@/lib/store-scraper')
      const store = await fetchGooglePlayData(app.store_id)
      return NextResponse.json({
        headerImage: store?.headerImage ?? null,
        screenshots: store?.screenshots ?? [],
      })
    } else {
      const { fetchAppleAppData } = await import('@/lib/store-scraper')
      const store = await fetchAppleAppData(app.store_id)
      return NextResponse.json({
        headerImage: null,
        screenshots: store?.screenshots ?? [],
      })
    }
  } catch (err) {
    console.error('[store-preview] Failed to fetch store data:', err)
    return NextResponse.json({ headerImage: null, screenshots: [] })
  }
}
