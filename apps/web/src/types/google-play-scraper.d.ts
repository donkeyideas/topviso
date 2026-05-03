declare module 'google-play-scraper' {
  interface AppResult {
    appId: string
    title: string
    description: string
    descriptionHTML: string
    summary: string
    score: number
    ratings: number
    reviews: number
    installs: string
    minInstalls: number
    maxInstalls?: number
    developer: string
    developerEmail?: string
    developerWebsite?: string
    genre: string
    genreId: string
    icon: string
    headerImage?: string
    screenshots?: string[]
    version: string
    updated: number
    released?: string
    contentRating?: string
    price: number
    free: boolean
    currency?: string
  }

  interface ReviewResult {
    id: string
    userName: string
    text: string | null
    score: number
    thumbsUp: number
    date: string | null
    version: string | null
    replyText: string | null
    replyDate: string | null
  }

  interface SearchResult {
    appId: string
    title: string
    developer: string
    score: number
    icon: string
  }

  export function app(opts: {
    appId: string
    lang?: string
    country?: string
  }): Promise<AppResult>

  export function reviews(opts: {
    appId: string
    lang?: string
    country?: string
    sort?: number
    num?: number
  }): Promise<{ data: ReviewResult[] }>

  export function search(opts: {
    term: string
    num?: number
    lang?: string
    country?: string
  }): Promise<SearchResult[]>

  export function similar(opts: {
    appId: string
    lang?: string
    country?: string
  }): Promise<SearchResult[]>

  export const sort: {
    NEWEST: number
    RATING: number
    HELPFULNESS: number
  }
}
