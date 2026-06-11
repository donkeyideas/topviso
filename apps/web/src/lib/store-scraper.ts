import gplay from 'google-play-scraper'
import { playStoreSearch } from './play-store-scraper'

// --- Types ---

export interface StoreAppData {
  title: string
  description: string
  descriptionHTML?: string | undefined
  summary?: string | undefined
  score: number
  ratings: number
  reviews: number
  installs: string
  minInstalls: number
  maxInstalls?: number | undefined
  developer: string
  developerEmail?: string | undefined
  developerWebsite?: string | undefined
  genre: string
  genreId: string
  icon: string
  headerImage?: string | undefined
  screenshots: string[]
  version: string
  updated: number
  released?: string | undefined
  contentRating?: string | undefined
  price: number
  free: boolean
  currency?: string | undefined
}

export interface StoreReview {
  id: string
  userName: string
  text: string
  score: number
  thumbsUp: number
  date: string
  version?: string | undefined
  replyText?: string | undefined
  replyDate?: string | undefined
}

// status distinguishes three real states that were previously conflated as
// `position === null`:
//   ranked          — scrape succeeded, app is at `position`
//   not_in_top_250  — scrape succeeded, app is not in the top results
//   error           — scrape failed (rate limit, network, parser, etc.).
//                     `position` is null but callers MUST NOT interpret that
//                     as "not ranking" — the rank is unknown.
export type RankStatus = 'ranked' | 'not_in_top_250' | 'error'
export type RankSource = 'gplay' | 'itunes'

export interface KeywordRankResult {
  keyword: string
  position: number | null
  country: string
  status: RankStatus
  source: RankSource
  errorReason?: string | undefined
  topCompetitor?: string | undefined
  topResults?: Array<{ appId: string; title: string; developer?: string; score?: number; installs?: string }> | undefined
}

// Retry policy for transient scrape failures.
//
// In the bulk sync path (~122 keywords) we have a hard 300s Vercel function
// ceiling, so we can't afford the 1s/3s/7s backoff cascade we had earlier —
// even partial rate-limit episodes would time the whole sync out. Two
// attempts with one short retry is enough to absorb single-blip flakes;
// anything persistent gets a real second chance from the staggered cron
// at /api/cron/rank-check on its 8-minute cadence.
const MAX_ATTEMPTS = 2
const BACKOFF_MS = [1500]

async function withRetry<T>(
  label: string,
  fn: (attempt: number) => Promise<T>,
): Promise<T | { __error: string }> {
  let lastErr: unknown = null
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fn(attempt)
    } catch (err) {
      lastErr = err
      if (attempt < MAX_ATTEMPTS) {
        const base = BACKOFF_MS[attempt - 1] ?? 7000
        const jitter = Math.floor(Math.random() * 400)
        await new Promise((r) => setTimeout(r, base + jitter))
      }
    }
  }
  const msg = lastErr instanceof Error ? lastErr.message : String(lastErr)
  console.error(`[store-scraper] ${label} failed after ${MAX_ATTEMPTS} attempts:`, msg)
  return { __error: msg.slice(0, 200) }
}

export function classifyScrapeError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('429') || m.includes('rate') || m.includes('too many')) return 'rate_limit'
  if (m.includes('timeout') || m.includes('etimedout')) return 'timeout'
  if (m.includes('econnreset') || m.includes('socket') || m.includes('network')) return 'network'
  if (m.includes('json') || m.includes('parse') || m.includes('html')) return 'parse_error'
  return 'unknown'
}

export interface SimilarApp {
  appId: string
  title: string
  developer: string
  score: number
  icon: string
}

// --- Google Play ---

export async function fetchGooglePlayData(
  appId: string,
): Promise<StoreAppData | null> {
  try {
    const result = await gplay.app({ appId, lang: 'en', country: 'us' })
    return {
      title: result.title,
      description: result.description,
      descriptionHTML: result.descriptionHTML,
      summary: result.summary,
      score: result.score,
      ratings: result.ratings,
      reviews: result.reviews,
      installs: result.installs,
      minInstalls: result.minInstalls,
      maxInstalls: result.maxInstalls,
      developer: result.developer,
      developerEmail: result.developerEmail,
      developerWebsite: result.developerWebsite,
      genre: result.genre,
      genreId: result.genreId,
      icon: result.icon,
      headerImage: result.headerImage,
      screenshots: result.screenshots ?? [],
      version: result.version,
      updated: result.updated,
      released: result.released,
      contentRating: result.contentRating,
      price: result.price,
      free: result.free,
      currency: result.currency,
    }
  } catch (err) {
    console.error('[store-scraper] fetchGooglePlayData failed:', err)
    return null
  }
}

export async function fetchGooglePlayReviews(
  appId: string,
  count: number = 100,
): Promise<StoreReview[]> {
  try {
    const result = await gplay.reviews({
      appId,
      lang: 'en',
      country: 'us',
      sort: gplay.sort.NEWEST,
      num: count,
    })
    return result.data.map((r) => ({
      id: r.id,
      userName: r.userName,
      text: r.text ?? '',
      score: r.score,
      thumbsUp: r.thumbsUp,
      date: r.date ? new Date(r.date).toISOString() : '',
      version: r.version ?? undefined,
      replyText: r.replyText ?? undefined,
      replyDate: r.replyDate ? new Date(r.replyDate).toISOString() : undefined,
    }))
  } catch (err) {
    console.error('[store-scraper] fetchGooglePlayReviews failed:', err)
    return []
  }
}

export async function checkKeywordRanking(
  keyword: string,
  targetAppId: string,
  country: string = 'us',
): Promise<KeywordRankResult> {
  // We dropped `google-play-scraper` for search because it started returning
  // empty results (Google changed their HTML shape and the library can't
  // parse anymore). Our own playStoreSearch hits play.google.com directly,
  // parses app IDs from the rendered HTML, and matches the live UI exactly.
  //
  // Coverage: the server-rendered SERP contains roughly the top 30 results
  // (Play Store lazy-loads the rest with client JS). For ASO this is the
  // band that matters — anything beyond #30 isn't getting meaningful organic
  // traffic. We call the second status 'not_in_top_250' for consistency
  // with the wire type, but the practical cutoff is ~30.
  const result = await withRetry(`checkKeywordRanking[${keyword}]`, async () => {
    return await playStoreSearch(keyword, country)
  })

  if ('__error' in result) {
    return {
      keyword,
      position: null,
      country,
      status: 'error',
      source: 'gplay',
      errorReason: classifyScrapeError(result.__error),
    }
  }

  const results = result
  const position = results.findIndex((r) => r.appId === targetAppId)
  const topComp = results.find((r) => r.appId !== targetAppId)
  const topResults = results.slice(0, 10).map((r) => ({
    appId: r.appId,
    title: r.title ?? '',
    developer: r.developer ?? '',
    score: r.score ?? 0,
    installs: r.installs ?? '',
  }))

  if (position >= 0) {
    return {
      keyword,
      position: position + 1,
      country,
      status: 'ranked',
      source: 'gplay',
      topCompetitor: topComp?.title ?? undefined,
      topResults,
    }
  }
  return {
    keyword,
    position: null,
    country,
    status: 'not_in_top_250',
    source: 'gplay',
    topCompetitor: topComp?.title ?? undefined,
    topResults,
  }
}

export async function batchCheckKeywordRankings(
  keywords: string[],
  targetAppId: string,
  country: string = 'us',
  delayMs: number = 300,
): Promise<KeywordRankResult[]> {
  const results: KeywordRankResult[] = []
  for (const keyword of keywords) {
    const result = await checkKeywordRanking(keyword, targetAppId, country)
    results.push(result)
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs))
  }
  return results
}

export async function fetchSimilarApps(
  appId: string,
): Promise<SimilarApp[]> {
  try {
    const results = await gplay.similar({ appId, lang: 'en', country: 'us' })
    return results.map((r) => ({
      appId: r.appId,
      title: r.title,
      developer: r.developer,
      score: r.score,
      icon: r.icon,
    }))
  } catch (err) {
    console.error('[store-scraper] fetchSimilarApps failed', {
      appId,
      error: err instanceof Error ? err.message : String(err),
    })
    return []
  }
}

export async function searchApps(
  term: string,
  count: number = 30,
  country: string = 'us',
): Promise<SimilarApp[]> {
  try {
    // Same reason as checkKeywordRanking: gplay.search returns empty for
    // every query, so we hit Play Store directly and parse app IDs from
    // the rendered HTML. We don't enrich with title/score here because
    // the discovery flow only uses appIds to find competitors — those
    // are then fetched individually via gplay.app() (which still works).
    const results = await playStoreSearch(term, country)
    return results.slice(0, count).map((r) => ({
      appId: r.appId,
      title: r.title ?? r.appId,
      developer: r.developer ?? '',
      score: r.score ?? 0,
      icon: '',
    }))
  } catch (err) {
    console.error('[store-scraper] searchApps (android) failed', {
      term,
      country,
      error: err instanceof Error ? err.message : String(err),
    })
    return []
  }
}

// --- Google Play Category Leaderboard ---

export interface CategoryApp {
  rank: number
  appId: string
  name: string
  developer: string
  rating: number
  iconUrl: string
}

export async function fetchCategoryTopApps(
  genreId: string,
  count: number = 12,
  country: string = 'us',
): Promise<CategoryApp[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gplayAny = gplay as any

  // Attempt 1: gplay.list with correct collection value
  try {
    const results = await gplayAny.list({
      category: genreId,
      collection: 'TOP_FREE',
      num: count,
      lang: 'en',
      country,
    })
    if (Array.isArray(results) && results.length > 0) {
      return (results as Array<{ appId: string; title: string; developer?: string; score?: number; icon?: string }>).map((r, i) => ({
        rank: i + 1,
        appId: r.appId,
        name: r.title,
        developer: r.developer ?? '',
        rating: r.score ?? 0,
        iconUrl: r.icon ?? '',
      }))
    }
  } catch (err) {
    console.error('[store-scraper] fetchCategoryTopApps list failed:', err)
  }

  // Attempt 2: fallback to search with genre name.
  // Uses our direct Play Store scraper because gplay.search is broken
  // (Google's HTML changed; the library returns empty for every query).
  try {
    const genreName = genreId.replace(/_/g, ' ').replace(/AND/g, '&').toLowerCase()
    const results = await playStoreSearch(genreName, country)
    if (results.length > 0) {
      return results.slice(0, count).map((r, i) => ({
        rank: i + 1,
        appId: r.appId,
        name: r.title ?? r.appId,
        developer: r.developer ?? '',
        rating: r.score ?? 0,
        iconUrl: '',
      }))
    }
  } catch (err) {
    console.error('[store-scraper] fetchCategoryTopApps search fallback failed:', err)
  }

  return []
}

// --- iOS keyword ranking (iTunes Search API) ---

export async function checkKeywordRankingIOS(
  keyword: string,
  targetAppId: string,
  country: string = 'us',
): Promise<KeywordRankResult> {
  const result = await withRetry(`checkKeywordRankingIOS[${keyword}]`, async () => {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(keyword)}&country=${country}&media=software&limit=200`,
    )
    if (!res.ok) throw new Error(`itunes search returned ${res.status}`)
    const data = await res.json()
    return (data.results ?? []) as Array<Record<string, unknown>>
  })

  if ('__error' in result) {
    return {
      keyword,
      position: null,
      country,
      status: 'error',
      source: 'itunes',
      errorReason: classifyScrapeError(result.__error),
    }
  }

  const results = result
  const position = results.findIndex((r) => String(r.trackId) === targetAppId)
  const topComp = results.find((r) => String(r.trackId) !== targetAppId)
  const topResults = results.slice(0, 10).map((r) => ({
    appId: String(r.trackId ?? ''),
    title: String(r.trackName ?? ''),
    developer: String(r.artistName ?? ''),
    score: Number(r.averageUserRating ?? 0),
    installs: '',
  }))

  if (position >= 0) {
    return {
      keyword,
      position: position + 1,
      country,
      status: 'ranked',
      source: 'itunes',
      topCompetitor: topComp ? String(topComp.trackName ?? '') : undefined,
      topResults,
    }
  }
  return {
    keyword,
    position: null,
    country,
    status: 'not_in_top_250',
    source: 'itunes',
    topCompetitor: topComp ? String(topComp.trackName ?? '') : undefined,
    topResults,
  }
}

export async function batchCheckKeywordRankingsIOS(
  keywords: string[],
  targetAppId: string,
  country: string = 'us',
  delayMs: number = 400,
): Promise<KeywordRankResult[]> {
  const results: KeywordRankResult[] = []
  for (const keyword of keywords) {
    const result = await checkKeywordRankingIOS(keyword, targetAppId, country)
    results.push(result)
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs))
  }
  return results
}

// --- iOS search & similar (iTunes Search API) ---

export async function searchAppsIOS(
  term: string,
  count: number = 30,
  country: string = 'us',
): Promise<SimilarApp[]> {
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=${country}&media=software&limit=${count}`,
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.results ?? []).map((r: Record<string, unknown>) => ({
      appId: String(r.trackId ?? ''),
      title: String(r.trackName ?? ''),
      developer: String(r.artistName ?? ''),
      score: Number(r.averageUserRating ?? 0),
      icon: String(r.artworkUrl100 ?? r.artworkUrl60 ?? ''),
    }))
  } catch (err) {
    console.error('[store-scraper] searchAppsIOS failed', {
      term,
      country,
      error: err instanceof Error ? err.message : String(err),
    })
    return []
  }
}

export async function fetchSimilarAppsIOS(
  appId: string,
): Promise<SimilarApp[]> {
  // iTunes has no direct "similar apps" endpoint.
  // Strategy: look up the app to get its genre and artist, then search by genre.
  try {
    const lookupRes = await fetch(
      `https://itunes.apple.com/lookup?id=${encodeURIComponent(appId)}&country=us`,
    )
    if (!lookupRes.ok) return []
    const lookupData = await lookupRes.json()
    const app = lookupData.results?.[0]
    if (!app) return []

    const genreName = String(app.primaryGenreName ?? '')
    if (!genreName) return []

    const searchRes = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(genreName)}&country=us&media=software&limit=20`,
    )
    if (!searchRes.ok) return []
    const searchData = await searchRes.json()
    return (searchData.results ?? [])
      .filter((r: Record<string, unknown>) => String(r.trackId) !== appId)
      .map((r: Record<string, unknown>) => ({
        appId: String(r.trackId ?? ''),
        title: String(r.trackName ?? ''),
        developer: String(r.artistName ?? ''),
        score: Number(r.averageUserRating ?? 0),
        icon: String(r.artworkUrl100 ?? r.artworkUrl60 ?? ''),
      }))
  } catch (err) {
    console.error('[store-scraper] fetchSimilarAppsIOS failed', {
      appId,
      error: err instanceof Error ? err.message : String(err),
    })
    return []
  }
}

// --- iOS reviews (Apple RSS feed) ---

export async function fetchAppleAppReviews(
  appId: string,
  country: string = 'us',
): Promise<StoreReview[]> {
  try {
    const res = await fetch(
      `https://itunes.apple.com/rss/customerreviews/id=${encodeURIComponent(appId)}/sortby=mostrecent/json?l=en&cc=${country}`,
    )
    if (!res.ok) return []
    const data = await res.json()
    const entries = data?.feed?.entry
    if (!Array.isArray(entries)) return []
    return entries
      .filter((e: Record<string, unknown>) => e['im:rating'])
      .map((e: Record<string, unknown>) => ({
        id: String((e.id as Record<string, string>)?.label ?? Math.random().toString(36)),
        userName: String((e.author as Record<string, Record<string, string>>)?.name?.label ?? 'Unknown'),
        text: String((e.content as Record<string, string>)?.label ?? ''),
        score: Number((e['im:rating'] as Record<string, string>)?.label ?? 0),
        thumbsUp: 0,
        date: (e.updated as Record<string, string>)?.label
          ? new Date(String((e.updated as Record<string, string>).label)).toISOString()
          : '',
        version: (e['im:version'] as Record<string, string>)?.label ?? undefined,
      }))
  } catch (err) {
    console.error('[store-scraper] fetchAppleAppReviews failed:', err)
    return []
  }
}

// --- iOS ---

/**
 * Scrape FULL app data from the public App Store page.
 * Apple embeds two reliable data sources in every public app page:
 *   1. LD+JSON (schema.org SoftwareApplication) — title, description, developer, rating, price, category
 *   2. serialized-server-data JSON blob — screenshots, version, content rating
 * This works for ALL apps with a public page, including new apps that the iTunes API doesn't index.
 */
async function scrapeAppleAppPage(appId: string): Promise<StoreAppData | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(
      `https://apps.apple.com/us/app/id${encodeURIComponent(appId)}`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15' },
        signal: controller.signal,
      },
    )
    clearTimeout(timeout)
    if (!res.ok) return null
    const html = await res.text()

    // --- 1. Extract LD+JSON for core metadata ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ldApp: Record<string, any> | null = null
    const ldMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g) ?? []
    for (const block of ldMatches) {
      try {
        const jsonStr = block.replace(/<script[^>]*>/, '').replace(/<\/script>/, '')
        const parsed = JSON.parse(jsonStr)
        if (parsed?.['@type'] === 'SoftwareApplication') {
          ldApp = parsed
          break
        }
      } catch { /* skip */ }
    }

    // --- 2. Extract serialized-server-data for screenshots + version ---
    const screenshots: string[] = []
    let version = ''
    let ratingAvg = 0
    let ratingCount = 0
    let contentRating = ''
    let developerName = ''
    let category = ''

    const serverDataMatch = html.match(/<script[^>]*id="serialized-server-data"[^>]*>([^<]+)<\/script>/)
    if (serverDataMatch?.[1]) {
      try {
        const serverData = JSON.parse(serverDataMatch[1])
        const shelfMapping = serverData?.data?.[0]?.data?.shelfMapping
        if (shelfMapping) {
          // Screenshots from phone + iPad
          for (const shelf of ['product_media_phone_', 'product_media_pad_']) {
            const items = shelfMapping[shelf]?.items ?? []
            for (const item of items) {
              const template = item?.screenshot?.template
              if (typeof template === 'string' && template.includes('mzstatic.com')) {
                screenshots.push(
                  template.replace('{w}', '460').replace('{h}', '0').replace('{c}', 'w').replace('{f}', 'webp'),
                )
              }
            }
          }

          // Rating from productRatings
          const ratingsItem = shelfMapping.productRatings?.items?.[0]
          if (ratingsItem) {
            ratingAvg = ratingsItem.ratingAverage ?? 0
            ratingCount = ratingsItem.totalNumberOfRatings ?? 0
          }

          // Version from mostRecentVersion
          const versionItem = shelfMapping.mostRecentVersion?.items?.[0]
          if (versionItem?.primarySubtitle) {
            version = String(versionItem.primarySubtitle).replace(/^Version\s*/i, '')
          }

          // Information items (developer, category, content rating)
          const infoItems = shelfMapping.information?.items ?? []
          for (const info of infoItems) {
            const title = info?.title ?? ''
            const text = info?.items?.[0]?.text ?? ''
            if (title === 'Seller' && text) developerName = text
            if (title === 'Category' && text) category = text
            if (title === 'Age Rating' && info?.summary) contentRating = info.summary
          }
        }
      } catch { /* continue with whatever we have */ }
    }

    // --- 3. Extract icon from og:image meta tag (always the app icon) ---
    let icon = ''
    const ogImageMatch = html.match(/property="og:image"\s+content="([^"]+)"/)
    if (ogImageMatch?.[1]) {
      icon = ogImageMatch[1]
    }

    // We need at least the LD+JSON or a title from the page
    const title = ldApp?.name ?? ''
    const description = ldApp?.description ?? ''
    if (!title && !ldApp) return null // completely failed to parse

    // Use LD+JSON rating if server-data had none
    if (ratingAvg === 0 && ldApp?.aggregateRating?.ratingValue) {
      ratingAvg = Number(ldApp.aggregateRating.ratingValue) || 0
    }
    if (ratingCount === 0 && ldApp?.aggregateRating?.reviewCount) {
      ratingCount = Number(ldApp.aggregateRating.reviewCount) || 0
    }

    const price = ldApp?.offers?.price ?? 0

    return {
      title,
      description,
      summary: description.slice(0, 170),
      score: ratingAvg,
      ratings: ratingCount,
      reviews: ratingCount,
      installs: '',
      minInstalls: 0,
      developer: ldApp?.author?.name ?? developerName,
      developerWebsite: undefined,
      genre: ldApp?.applicationCategory ?? category,
      genreId: '',
      icon,
      screenshots,
      version,
      updated: Date.now(),
      released: undefined,
      contentRating: contentRating || undefined,
      price: Number(price) || 0,
      free: (Number(price) || 0) === 0,
      currency: 'USD',
    }
  } catch (err) {
    console.error('[store-scraper] scrapeAppleAppPage failed:', err)
    return null
  }
}

export async function fetchAppleAppData(
  appId: string,
): Promise<StoreAppData | null> {
  // Tier 1: iTunes Lookup API (fast, structured, but unreliable for newer apps)
  try {
    const res = await fetch(
      `https://itunes.apple.com/lookup?id=${encodeURIComponent(appId)}&country=us`,
    )
    if (res.ok) {
      const data = await res.json()
      const app = data.results?.[0]
      if (app) {
        const screenshots = [
          ...(app.screenshotUrls ?? []),
          ...(app.ipadScreenshotUrls ?? []),
        ]

        // If iTunes has screenshots, use it as the primary source
        if (screenshots.length > 0) {
          return {
            title: app.trackName,
            description: app.description ?? '',
            summary: app.description?.slice(0, 170) ?? '',
            score: app.averageUserRating ?? 0,
            ratings: app.userRatingCount ?? 0,
            reviews: app.userRatingCount ?? 0,
            installs: '',
            minInstalls: 0,
            developer: app.artistName,
            developerWebsite: app.sellerUrl,
            genre: app.primaryGenreName,
            genreId: String(app.primaryGenreId),
            icon: app.artworkUrl512 ?? app.artworkUrl100,
            screenshots,
            version: app.version,
            updated: new Date(app.currentVersionReleaseDate).getTime(),
            released: app.releaseDate,
            contentRating: app.contentAdvisoryRating,
            price: app.price ?? 0,
            free: (app.price ?? 0) === 0,
            currency: app.currency,
          }
        }

        // iTunes found the app but has no screenshots — merge with page scrape
        const scraped = await scrapeAppleAppPage(appId)
        return {
          title: app.trackName,
          description: app.description ?? '',
          summary: app.description?.slice(0, 170) ?? '',
          score: app.averageUserRating ?? 0,
          ratings: app.userRatingCount ?? 0,
          reviews: app.userRatingCount ?? 0,
          installs: '',
          minInstalls: 0,
          developer: app.artistName,
          developerWebsite: app.sellerUrl,
          genre: app.primaryGenreName,
          genreId: String(app.primaryGenreId),
          icon: app.artworkUrl512 ?? app.artworkUrl100,
          screenshots: scraped?.screenshots ?? [],
          version: app.version,
          updated: new Date(app.currentVersionReleaseDate).getTime(),
          released: app.releaseDate,
          contentRating: app.contentAdvisoryRating,
          price: app.price ?? 0,
          free: (app.price ?? 0) === 0,
          currency: app.currency,
        }
      }
    }
  } catch (err) {
    console.error('[store-scraper] iTunes API tier-1 lookup failed', {
      appId,
      error: err instanceof Error ? err.message : String(err),
    })
  }

  // Tier 2: Scrape the public App Store page (works for ALL apps with a public page)
  console.log(`[store-scraper] iTunes API failed for ${appId}, falling back to App Store page scrape`)
  return scrapeAppleAppPage(appId)
}

export async function fetchAppleCategoryTopApps(
  genreId: string,
  count: number = 12,
  country: string = 'us',
): Promise<CategoryApp[]> {
  try {
    // iTunes Search API: search within a genre for top results
    const res = await fetch(
      `https://itunes.apple.com/search?term=*&genreId=${encodeURIComponent(genreId)}&country=${country}&media=software&limit=${count}&sort=popular`,
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.results ?? []).map((app: Record<string, unknown>, i: number) => ({
      rank: i + 1,
      appId: String(app.trackId ?? ''),
      name: String(app.trackName ?? ''),
      developer: String(app.artistName ?? ''),
      rating: Number(app.averageUserRating ?? 0),
      iconUrl: String(app.artworkUrl100 ?? app.artworkUrl60 ?? ''),
    }))
  } catch (err) {
    console.error('[store-scraper] fetchAppleCategoryTopApps failed:', err)
    return []
  }
}
