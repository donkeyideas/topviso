// Staggered rank-check cron.
//
// Why this exists: doing 164 sequential rank checks every sync trips Google
// Play's rate limit roughly half-way through. The other half come back as
// `error` and look like "not ranking" in the UI. Phase 1 fixed the labeling;
// this is the fix for the underlying rate-limit problem.
//
// Strategy: every 8 minutes, pick the 20 oldest-checked keywords across the
// whole platform and re-check them. 164 keywords × ~12 hours = full coverage,
// no burst, no rate limits.
//
// Auth: Vercel Cron sets the Authorization header to `Bearer ${CRON_SECRET}`.
// We reject anything else. The local dev path also works without a secret
// when NODE_ENV !== 'production' so you can hit it from `curl localhost:3000`.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  checkKeywordRanking,
  checkKeywordRankingIOS,
  type KeywordRankResult,
} from '@/lib/store-scraper'

const BATCH_SIZE = 20
// Vercel hobby/pro function timeout. We cap our own work below this so a slow
// batch doesn't truncate mid-write.
export const maxDuration = 300

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

function authorize(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    // Local dev — allow when no secret is configured. Production MUST set
    // CRON_SECRET; without it Vercel Cron requests are also un-authed but
    // anyone with the URL could trigger the route.
    return process.env.NODE_ENV !== 'production'
  }
  const header = req.headers.get('authorization') ?? ''
  return header === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // Pick the BATCH_SIZE oldest-checked keywords. We join keywords → apps so
  // we know which platform to use and what targetAppId to look for.
  const { data: candidates, error: pickErr } = await supabaseAdmin
    .from('keyword_ranks_daily')
    .select(`
      keyword_id,
      last_checked_at,
      keywords!inner ( id, text, country, app_id, apps!inner ( id, platform, store_id ) )
    `)
    .order('last_checked_at', { ascending: true, nullsFirst: true })
    .limit(BATCH_SIZE)

  if (pickErr) {
    console.error('[cron/rank-check] candidate query failed', pickErr)
    return NextResponse.json({ error: pickErr.message }, { status: 500 })
  }
  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ checked: 0, message: 'no keywords yet' })
  }

  const today = new Date().toISOString().split('T')[0]
  const now = new Date().toISOString()

  type Candidate = {
    keyword_id: string
    keywords: {
      id: string
      text: string
      country: string
      apps: { id: string; platform: 'ios' | 'android'; store_id: string }
    }
  }

  let checked = 0
  let errored = 0
  let ranked = 0

  for (const raw of candidates as unknown as Candidate[]) {
    const kw = raw.keywords
    const app = kw.apps
    const country = (kw.country ?? 'US').toLowerCase()

    let result: KeywordRankResult
    if (app.platform === 'ios') {
      result = await checkKeywordRankingIOS(kw.text, app.store_id, country)
    } else {
      result = await checkKeywordRanking(kw.text, app.store_id, country)
    }

    checked++
    if (result.status === 'ranked') ranked++
    if (result.status === 'error') errored++

    // Same protect-known-good logic as the full sync.
    if (result.status === 'error') {
      const { data: existing } = await supabaseAdmin
        .from('keyword_ranks_daily')
        .select('rank, status')
        .eq('keyword_id', kw.id)
        .eq('date', today)
        .maybeSingle()

      if (existing && existing.status === 'ranked') {
        await supabaseAdmin
          .from('keyword_ranks_daily')
          .update({
            last_checked_at: now,
            error_reason: result.errorReason ?? 'unknown',
          })
          .eq('keyword_id', kw.id)
          .eq('date', today)
        continue
      }
    }

    await supabaseAdmin.from('keyword_ranks_daily').upsert(
      {
        keyword_id: kw.id,
        date: today,
        rank: result.position,
        status: result.status,
        last_checked_at: now,
        error_reason: result.errorReason ?? null,
        source: result.source,
      },
      { onConflict: 'keyword_id,date' },
    )

    // Tiny gap between checks within the same batch to soften any per-IP
    // ramp Google might apply.
    await new Promise((r) => setTimeout(r, 500))
  }

  return NextResponse.json({ checked, ranked, errored })
}
