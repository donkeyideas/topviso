import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import {
  fetchWebsiteText,
  extractAppProfileFromText,
  sanitizeProfile,
  WebsiteFetchError,
} from '@/lib/website-profile'

export const maxDuration = 60

// POST /api/apps/:id/profile — crawl the app's website and (re)generate its
// App Identity profile. Uses body.website_url if provided, else the stored one.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const serverClient = await getSupabaseServerClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = getSupabaseAdmin()

  const { data: app, error } = await supabase
    .from('apps')
    .select('id, name, category, website_url, store_id')
    .eq('id', id)
    .single()
  if (error || !app) return NextResponse.json({ error: 'App not found' }, { status: 404 })

  const body = await request.json().catch(() => ({}))
  const websiteUrl: string | null = (body.website_url ?? app.website_url ?? null)?.toString().trim() || null
  if (!websiteUrl) {
    return NextResponse.json({ error: 'No website URL to analyze' }, { status: 400 })
  }

  // Persist the URL + mark pending so the UI can reflect progress.
  await supabase
    .from('apps')
    .update({ website_url: websiteUrl, profile_status: 'pending' })
    .eq('id', id)

  try {
    const websiteText = await fetchWebsiteText(websiteUrl)
    if (websiteText.trim().length < 40) {
      throw new WebsiteFetchError('Website had too little readable text')
    }

    // Latest store description gives the extractor cross-reference context.
    const { data: snapshot } = await supabase
      .from('app_metadata_snapshots')
      .select('description')
      .eq('app_id', id)
      .order('snapshot_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const profile = await extractAppProfileFromText({
      websiteText,
      appName: app.name,
      category: app.category,
      storeDescription: snapshot?.description ?? null,
      sourceUrl: websiteUrl,
    })

    const { data: updated } = await supabase
      .from('apps')
      .update({
        app_profile: profile as unknown as Record<string, unknown>,
        profile_status: 'ready',
        profile_updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('app_profile, profile_status, website_url')
      .single()

    return NextResponse.json({ data: updated?.app_profile ?? profile, status: 'ready' })
  } catch (err) {
    await supabase.from('apps').update({ profile_status: 'failed' }).eq('id', id)
    const detail = err instanceof Error ? err.message : String(err)
    console.error('[profile] analyze failed', { app_id: id, website: websiteUrl, error: detail })
    // WebsiteFetchError messages are user-safe and specific; for anything else
    // surface the underlying reason so failures are diagnosable, not opaque.
    const message = err instanceof WebsiteFetchError ? err.message : `Analysis failed: ${detail}`
    return NextResponse.json({ error: message, status: 'failed' }, { status: 422 })
  }
}

// PATCH /api/apps/:id/profile — save a user-edited profile (confirmation UX).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const serverClient = await getSupabaseServerClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = getSupabaseAdmin()

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid profile' }, { status: 400 })
  }

  const profile = sanitizeProfile(body.profile ?? body, 'manual')

  const { data: updated, error } = await supabase
    .from('apps')
    .update({
      app_profile: profile as unknown as Record<string, unknown>,
      profile_status: 'ready',
      profile_updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('app_profile, profile_status, website_url')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: updated?.app_profile ?? profile, status: 'ready' })
}
