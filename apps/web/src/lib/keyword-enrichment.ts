/**
 * Keyword data enrichment for ASO.
 * Ported from OpticRank — estimates search volume, CPC, difficulty, and intent
 * using heuristic analysis with seeded randomness for consistency.
 */

export interface KeywordMetrics {
  volume: number
  cpc: number
  difficulty: number
  intent: 'navigational' | 'informational' | 'transactional' | 'commercial'
}

/** Seeded hash for deterministic results per keyword */
function seed(str: string): number {
  return str.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
}

/**
 * Estimate keyword metrics using heuristic analysis.
 * Provides reasonable estimates based on keyword characteristics.
 */
export function estimateKeywordMetrics(keyword: string): KeywordMetrics {
  const kw = keyword.toLowerCase().trim()
  const words = kw.split(/\s+/)
  const wordCount = words.length

  const intent = classifyIntent(kw)
  const volume = estimateVolume(kw, wordCount, intent)
  const cpc = estimateCPC(kw, intent)
  const difficulty = estimateDifficulty(kw, wordCount, volume)

  return {
    volume: Math.round(volume),
    cpc: Math.round(cpc * 100) / 100,
    difficulty: Math.round(difficulty),
    intent,
  }
}

/**
 * Batch-enrich an array of keyword strings.
 */
export function enrichKeywords(
  keywords: string[],
): Array<{ keyword: string } & KeywordMetrics> {
  return keywords.map((kw) => ({
    keyword: kw,
    ...estimateKeywordMetrics(kw),
  }))
}

function classifyIntent(
  kw: string,
): 'navigational' | 'informational' | 'transactional' | 'commercial' {
  // Navigational — brand names or app-specific searches
  const navPatterns = [
    /^(go to|open|login|sign in|sign up)/,
    /\.(com|org|net|io|app)$/,
    /(facebook|google|youtube|twitter|instagram|amazon|netflix|espn|reddit|tiktok|snapchat|whatsapp|telegram|discord)/,
  ]
  if (navPatterns.some((p) => p.test(kw))) return 'navigational'

  // Transactional — download/action intent
  const txPatterns = [
    /\b(buy|purchase|order|subscribe|download|sign up|register|book|hire|get|install)\b/,
    /\b(coupon|discount|deal|promo|price|pricing|cost|cheap|affordable|free)\b/,
    /\b(free trial|demo|premium|pro version|upgrade)\b/,
  ]
  if (txPatterns.some((p) => p.test(kw))) return 'transactional'

  // Commercial — research with purchase intent
  const commPatterns = [
    /\b(best|top|review|reviews|comparison|vs|versus|alternative|alternatives)\b/,
    /\b(recommend|recommendation|rated|ranking|rankings)\b/,
    /\b(pros and cons|worth it|should i|compared to)\b/,
  ]
  if (commPatterns.some((p) => p.test(kw))) return 'commercial'

  // Informational
  const infoPatterns = [
    /\b(how|what|why|when|where|who|which|is|are|can|does|do)\b/,
    /\b(guide|tutorial|tips|learn|explain|definition|meaning|example)\b/,
    /\b(history|statistics|facts|data)\b/,
  ]
  if (infoPatterns.some((p) => p.test(kw))) return 'informational'

  return 'informational'
}

function estimateVolume(kw: string, wordCount: number, intent: string): number {
  // Base volume by word count — shorter = higher volume
  let base: number
  if (wordCount === 1) base = 50000
  else if (wordCount === 2) base = 15000
  else if (wordCount === 3) base = 4000
  else if (wordCount === 4) base = 1000
  else base = 300

  // Intent multipliers
  if (intent === 'navigational') base *= 2.0
  else if (intent === 'commercial') base *= 0.7
  else if (intent === 'transactional') base *= 0.5

  // App store niche boosts
  const hotNiches = [
    'game', 'games', 'sports', 'music', 'video', 'photo', 'social',
    'fitness', 'health', 'news', 'weather', 'maps', 'food', 'dating',
    'streaming', 'basketball', 'football', 'soccer', 'nfl', 'nba',
  ]
  if (hotNiches.some((n) => kw.includes(n))) base *= 1.5

  // Very long keywords
  if (kw.length > 40) base *= 0.3

  // Seeded jitter for consistency (same keyword = same volume)
  const s = seed(kw)
  const jitter = 0.7 + (s % 60) / 100 // 0.70–1.29
  base *= jitter

  return Math.max(50, Math.round(base / 10) * 10)
}

function estimateCPC(kw: string, intent: string): number {
  let cpc: number

  switch (intent) {
    case 'transactional':
      cpc = 2.0
      break
    case 'commercial':
      cpc = 1.5
      break
    case 'navigational':
      cpc = 0.8
      break
    default:
      cpc = 0.5
  }

  // Industry multipliers
  const expensive = ['insurance', 'lawyer', 'mortgage', 'loan', 'credit', 'invest', 'finance', 'banking']
  if (expensive.some((n) => kw.includes(n))) cpc *= 3

  const mid = ['software', 'saas', 'marketing', 'vpn', 'security', 'business', 'enterprise']
  if (mid.some((n) => kw.includes(n))) cpc *= 1.5

  // Seeded jitter
  const s = seed(kw)
  const jitter = 0.8 + (s % 40) / 100
  cpc *= jitter

  return Math.max(0.1, cpc)
}

function estimateDifficulty(
  kw: string,
  wordCount: number,
  volume: number,
): number {
  let diff: number

  // Higher volume → higher difficulty
  if (volume > 100000) diff = 75
  else if (volume > 50000) diff = 60
  else if (volume > 10000) diff = 45
  else if (volume > 1000) diff = 30
  else diff = 15

  // Longer keywords → easier
  if (wordCount >= 5) diff -= 15
  else if (wordCount >= 4) diff -= 10
  else if (wordCount >= 3) diff -= 5
  else if (wordCount === 1) diff += 10

  // Brand keywords are harder
  const brands = ['espn', 'nfl', 'nba', 'mlb', 'google', 'amazon', 'facebook', 'youtube', 'apple', 'spotify', 'netflix']
  if (brands.some((b) => kw.includes(b))) diff += 15

  // Seeded jitter
  const s = seed(kw)
  const jitter = (s % 10) - 5
  diff += jitter

  return Math.max(5, Math.min(95, diff))
}
