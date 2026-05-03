// Play Store scraper using google-play-scraper npm package
import gplay from 'google-play-scraper'

export interface PlayStoreAppInfo {
  appId: string
  title: string
  developer: string
  category: string
  rating: number | null
  ratingCount: number | null
  icon: string | null
  description: string | null
  installs: string | null
  minInstalls: number | null
  maxInstalls: number | null
  version: string | null
  updated: number | null
  screenshots: string[]
  score: number | null
  reviews: number | null
  genreId: string | null
}

export async function lookupPlayStoreApp(appId: string): Promise<PlayStoreAppInfo | null> {
  try {
    const result = await gplay.app({ appId, lang: 'en', country: 'us' })
    return {
      appId,
      title: result.title,
      developer: result.developer ?? '',
      category: result.genre ?? '',
      rating: result.score ?? null,
      ratingCount: result.ratings ?? null,
      icon: result.icon ?? null,
      description: result.description ?? null,
      installs: result.installs ?? null,
      minInstalls: result.minInstalls ?? null,
      maxInstalls: result.maxInstalls ?? null,
      version: result.version ?? null,
      updated: result.updated ?? null,
      screenshots: result.screenshots ?? [],
      score: result.score ?? null,
      reviews: result.reviews ?? null,
      genreId: result.genreId ?? null,
    }
  } catch (err) {
    console.error(`[play-store] lookupPlayStoreApp failed for ${appId}:`, err)
    return null
  }
}

export async function searchPlayStore(
  query: string,
  country = 'us',
  num = 30,
): Promise<{ appId: string; title: string; developer: string; score: number }[]> {
  try {
    const results = await gplay.search({
      term: query,
      num,
      lang: 'en',
      country,
    })
    return results.map(r => ({
      appId: r.appId,
      title: r.title,
      developer: r.developer ?? '',
      score: r.score ?? 0,
    }))
  } catch {
    return []
  }
}

export async function fetchPlayStoreReviews(
  appId: string,
  count = 100,
): Promise<Array<{ id: string; userName: string; text: string; score: number; date: string; version?: string }>> {
  try {
    const result = await gplay.reviews({
      appId,
      lang: 'en',
      country: 'us',
      sort: 2 as unknown as typeof gplay.sort, // NEWEST
      num: count,
    })
    return result.data.map(r => ({
      id: r.id,
      userName: r.userName,
      text: r.text ?? '',
      score: r.score,
      date: r.date ? new Date(r.date).toISOString() : new Date().toISOString(),
      version: r.version ?? undefined,
    }))
  } catch (err) {
    console.error(`[play-store] fetchPlayStoreReviews failed for ${appId}:`, err)
    return []
  }
}

export async function checkKeywordRank(
  keyword: string,
  targetAppId: string,
  country = 'us',
): Promise<number | null> {
  try {
    const results = await gplay.search({
      term: keyword,
      num: 250,
      lang: 'en',
      country,
    })
    const index = results.findIndex(r => r.appId === targetAppId)
    return index >= 0 ? index + 1 : null
  } catch {
    return null
  }
}
