/**
 * Side-by-side rank verification.
 *
 * Hits every available source for one (appId, keyword) pair and prints
 * the results. Use when a user reports a number looks wrong, when adding
 * a new source, or when tuning the fallback chain.
 *
 * Usage:
 *   npx tsx apps/web/scripts/verify-rank.ts <appId> "<keyword>" [country]
 *
 * Example:
 *   npx tsx apps/web/scripts/verify-rank.ts com.donkeyideas.debatearena "social debating"
 *   npx tsx apps/web/scripts/verify-rank.ts 6768122962 "aso tools" us
 *
 * Reads env from apps/web/.env.local — SerpAPI section is skipped silently
 * if SERPAPI_API_KEY is not set.
 */
// Run via Next.js so .env.local loads automatically:
//   pnpm --filter web exec tsx scripts/verify-rank.ts <appId> "<keyword>"
// or hit /api/dev/verify-rank in dev mode.

import {
  checkKeywordRanking,
  checkKeywordRankingIOS,
} from '../src/lib/store-scraper'

async function main() {
  const [, , appId, keyword, countryRaw] = process.argv
  if (!appId || !keyword) {
    console.error('Usage: tsx verify-rank.ts <appId> "<keyword>" [country]')
    process.exit(2)
  }
  const country = (countryRaw ?? 'us').toLowerCase()
  const looksLikeApple = /^\d+$/.test(appId)

  console.log(`\n=== Rank verification ===`)
  console.log(`appId    : ${appId}`)
  console.log(`keyword  : "${keyword}"`)
  console.log(`country  : ${country}`)
  console.log(`platform : ${looksLikeApple ? 'iOS (App Store)' : 'Android (Play Store)'}\n`)

  const rows: Array<{ source: string; status: string; position: string; topComp: string; latencyMs: number; error: string | undefined }> = []

  if (looksLikeApple) {
    const t0 = Date.now()
    const r = await checkKeywordRankingIOS(keyword, appId, country)
    rows.push({
      source: 'itunes',
      status: r.status,
      position: r.position == null ? '—' : `#${r.position}`,
      topComp: r.topCompetitor ?? '—',
      latencyMs: Date.now() - t0,
      error: r.errorReason,
    })
  } else {
    const t0 = Date.now()
    const r = await checkKeywordRanking(keyword, appId, country)
    rows.push({
      source: 'gplay',
      status: r.status,
      position: r.position == null ? '—' : `#${r.position}`,
      topComp: r.topCompetitor ?? '—',
      latencyMs: Date.now() - t0,
      error: r.errorReason,
    })
  }

  const pad = (s: string, n: number) => s.padEnd(n)
  console.log(pad('SOURCE', 10), pad('STATUS', 18), pad('POSITION', 10), pad('LATENCY', 10), 'TOP COMPETITOR')
  console.log('-'.repeat(80))
  for (const row of rows) {
    console.log(
      pad(row.source, 10),
      pad(row.status, 18),
      pad(row.position, 10),
      pad(`${row.latencyMs}ms`, 10),
      row.topComp.slice(0, 30) + (row.error ? `   (err: ${row.error})` : ''),
    )
  }

  // Verdict — flag obvious disagreement so we notice
  const positions = rows.filter(r => r.position !== '—').map(r => r.position)
  if (positions.length >= 2 && new Set(positions).size > 1) {
    console.log(`\n⚠ SOURCES DISAGREE on position: ${positions.join(' vs ')}`)
  } else if (rows.every(r => r.status === 'error' || r.status === 'skipped')) {
    console.log(`\n⚠ NO source returned a usable result.`)
  } else {
    console.log(`\nOK — sources agree.`)
  }
}

main().catch(err => {
  console.error('verify-rank.ts crashed:', err)
  process.exit(1)
})
