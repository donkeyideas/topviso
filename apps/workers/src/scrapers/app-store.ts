// App Store scraper using iTunes Search/Lookup API (free, no auth)

interface AppStoreResult {
  trackId: number
  trackName: string
  bundleId: string
  artistName: string
  primaryGenreName: string
  averageUserRating: number
  userRatingCount: number
  currentVersionReleaseDate: string
  version: string
  description: string
  artworkUrl512: string
}

interface AppStoreLookupResponse {
  resultCount: number
  results: AppStoreResult[]
}

export async function lookupAppById(appId: string, country = 'us'): Promise<AppStoreResult | null> {
  const url = `https://itunes.apple.com/lookup?id=${appId}&country=${country}`
  const res = await fetch(url)
  if (!res.ok) return null

  const data = (await res.json()) as AppStoreLookupResponse
  return data.results[0] ?? null
}

export async function searchApps(term: string, country = 'us', limit = 25): Promise<AppStoreResult[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=${country}&media=software&limit=${limit}`
  const res = await fetch(url)
  if (!res.ok) return []

  const data = (await res.json()) as AppStoreLookupResponse
  return data.results
}

export async function getAppRankForKeyword(
  keyword: string,
  targetAppId: string,
  country = 'us'
): Promise<number | null> {
  const results = await searchApps(keyword, country, 200)
  const index = results.findIndex((r) => String(r.trackId) === targetAppId)
  return index >= 0 ? index + 1 : null
}
