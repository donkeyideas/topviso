/**
 * Direct Google Play Store scraper.
 *
 * Why this file exists: the `google-play-scraper` npm package is currently
 * returning zero results for every query (Google changed something in the
 * HTML response and the library can't parse it). Hitting play.google.com
 * directly with a normal browser User-Agent and pulling the app IDs out of
 * the rendered HTML works perfectly — verified live against ArguFight at
 * #9 for "argument", matching what users see on the live Play Store.
 *
 * Coverage: this scrape captures the apps server-rendered on the initial
 * SERP page. Empirically that's roughly the top 30 results — beyond that
 * Play Store lazy-loads with client JS that we'd need a headless browser
 * to drive. For ASO purposes top-30 covers everything that matters
 * (anything > 30 isn't getting meaningful organic traffic anyway).
 *
 * Returns an ordered list of app IDs in SERP order. Errors throw; the
 * retry-with-backoff in store-scraper.ts handles transient failures.
 */

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

export interface PlayStoreSearchResult {
  appId: string
  title?: string
  developer?: string
  score?: number
  installs?: string
}

/**
 * Run a search on the live Play Store and return ordered apps.
 *
 * The HTML contains `/store/apps/details?id=PACKAGE_NAME` references for
 * every app card on the SERP. Iterating in order and de-duplicating gives
 * us SERP rank — verified to match the live UI exactly.
 */
export async function playStoreSearch(
  term: string,
  country: string = 'us',
  lang: string = 'en',
): Promise<PlayStoreSearchResult[]> {
  const url = `https://play.google.com/store/search?q=${encodeURIComponent(term)}&c=apps&hl=${encodeURIComponent(lang)}&gl=${encodeURIComponent(country.toUpperCase())}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)
  let html: string
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': `${lang}-${country.toUpperCase()},${lang};q=0.9`,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`play.google.com returned ${res.status}`)
    html = await res.text()
  } finally {
    clearTimeout(timeout)
  }

  // Detect outright blocks (captcha page, sorry-style interstitial). These
  // are tiny pages compared to a real SERP (>500K chars) and the catch
  // upstairs will retry-with-backoff.
  if (html.length < 50_000) {
    throw new Error(`play.google.com returned suspiciously short body (${html.length} chars) — likely blocked or captcha`)
  }

  // Extract unique app IDs in DOM order. Each `/store/apps/details?id=X`
  // reference points to one app card; the first occurrence is the card's
  // position. Set preserves insertion order in JS.
  const matches = html.match(/\/store\/apps\/details\?id=([a-zA-Z0-9_.]+)/g) ?? []
  const seen = new Set<string>()
  const apps: PlayStoreSearchResult[] = []
  for (const m of matches) {
    const id = m.replace('/store/apps/details?id=', '')
    if (seen.has(id)) continue
    seen.add(id)
    // The title/developer/rating are deep in the serialized JSON blob in
    // the HTML. We could parse them out for richer top-results data but
    // for rank-check we only need the appId list in order. Leaving the
    // other fields undefined keeps this lean and resilient to Play HTML
    // shape changes — only one extraction point to maintain.
    apps.push({ appId: id })
  }
  return apps
}

/**
 * Find a target app's rank in the SERP for a given keyword. Returns the
 * 1-based position, or null if the app isn't found in the parsed results.
 */
export async function findRankInPlayStore(
  keyword: string,
  targetAppId: string,
  country: string = 'us',
): Promise<{ position: number | null; topResults: PlayStoreSearchResult[] }> {
  const results = await playStoreSearch(keyword, country)
  const idx = results.findIndex((r) => r.appId === targetAppId)
  return {
    position: idx >= 0 ? idx + 1 : null,
    topResults: results,
  }
}
