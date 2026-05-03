// --- Visibility Score ---
// Position-weighted: sum(position_weight) / max_possible * 100

const POSITION_WEIGHTS: Record<number, number> = {
  1: 1.0,
  2: 0.85,
  3: 0.7,
  4: 0.6,
  5: 0.5,
  6: 0.42,
  7: 0.35,
  8: 0.28,
  9: 0.2,
  10: 0.12,
}

export function getPositionWeight(position: number): number {
  if (position <= 10) return POSITION_WEIGHTS[position] ?? 0
  return Math.max(0.01, 0.12 * Math.exp(-0.05 * (position - 10)))
}

export function calculateVisibilityScore(
  rankings: Array<{ position: number | null; searchVolume?: number }>,
): number {
  if (rankings.length === 0) return 0

  const hasVolume = rankings.some((r) => r.searchVolume && r.searchVolume > 0)

  if (hasVolume) {
    // Volume-weighted: Σ(position_weight × volume) / Σ(volume) × 100
    // This matches OpticRank's formula — max possible is all keywords at #1
    const maxPossible = rankings.reduce(
      (sum, r) => sum + (r.searchVolume ?? 0),
      0,
    )
    if (maxPossible === 0) return 0

    const actual = rankings.reduce((sum, r) => {
      if (r.position === null) return sum
      return sum + getPositionWeight(r.position) * (r.searchVolume ?? 0)
    }, 0)

    return Math.min(100, Math.round((actual / maxPossible) * 100))
  }

  // Fallback: equal-weight when no volume data
  const rankedKeywords = rankings.filter((r) => r.position !== null)
  if (rankedKeywords.length === 0) return 0

  const maxPossible = rankings.length * 1.0
  const actual = rankedKeywords.reduce(
    (sum, r) => sum + getPositionWeight(r.position!),
    0,
  )

  return Math.round((actual / maxPossible) * 100)
}

// --- Visibility Trend from Historical Data ---

import { SupabaseClient } from '@supabase/supabase-js'

export async function computeVisibilityTrend(
  supabase: SupabaseClient,
  appId: string,
  weeks: number = 13,
): Promise<{ dates: string[]; scores: number[] }> {
  // Get all keyword IDs for this app
  const { data: appKeywords } = await supabase
    .from('keywords')
    .select('id')
    .eq('app_id', appId)
    .eq('is_tracked', true)

  if (!appKeywords || appKeywords.length === 0) {
    return { dates: [], scores: [] }
  }

  const kwIds = appKeywords.map(k => k.id)
  const results: { date: string; score: number }[] = []

  for (let w = weeks - 1; w >= 0; w--) {
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() - (w * 7))
    const dateStr = targetDate.toISOString().split('T')[0]!

    // Get all keyword ranks on this date
    const { data: ranks } = await supabase
      .from('keyword_ranks_daily')
      .select('rank')
      .in('keyword_id', kwIds)
      .eq('date', dateStr)

    if (ranks && ranks.length > 0) {
      const score = calculateVisibilityScore(
        ranks.map(r => ({ position: r.rank }))
      )
      results.push({ date: dateStr, score })
    }
  }

  return {
    dates: results.map(r => r.date),
    scores: results.map(r => r.score),
  }
}

/**
 * Convert an array of visibility scores (0-100) into an SVG path string.
 * The SVG viewBox is 0 0 800 220, with y=40 for score 100 and y=190 for score 0.
 */
export function scoresToSvgPath(scores: number[]): string {
  if (scores.length === 0) return ''
  const w = 800
  const yMin = 40
  const yMax = 190
  const step = scores.length > 1 ? w / (scores.length - 1) : w / 2
  return scores.map((s, i) => {
    const x = scores.length === 1 ? w / 2 : i * step
    const y = yMax - ((Math.min(s, 100) / 100) * (yMax - yMin))
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')
}

// --- ASO Metadata Score ---

export interface ASOScoreInput {
  title: string
  subtitle?: string | null
  description: string
  keywordsField?: string | null
  rating: number
  ratingsCount: number
  hasScreenshots: boolean
  screenshotCount: number
}

export interface ASOScoreResult {
  overall: number
  breakdown: {
    titleScore: number
    subtitleScore: number
    descriptionScore: number
    keywordsFieldScore: number
    ratingsScore: number
    creativesScore: number
  }
}

export function calculateASOScore(input: ASOScoreInput): ASOScoreResult {
  let titleScore = 50
  if (input.title.length >= 20 && input.title.length <= 30) titleScore += 25
  else if (input.title.length >= 10) titleScore += 15
  if (input.title.length > 15) titleScore += 15
  titleScore = Math.min(100, titleScore)

  let subtitleScore = 0
  if (input.subtitle) {
    subtitleScore = 50
    if (input.subtitle.length >= 15 && input.subtitle.length <= 30)
      subtitleScore += 30
    else if (input.subtitle.length > 0) subtitleScore += 15
    if (input.subtitle.length > 10) subtitleScore += 20
    subtitleScore = Math.min(100, subtitleScore)
  }

  let descriptionScore = 50
  if (input.description.length > 500) descriptionScore += 15
  if (input.description.length > 1000) descriptionScore += 10
  if (input.description.length > 2000) descriptionScore += 10
  if (input.description.includes('\n')) descriptionScore += 8
  if (input.description.includes('•') || input.description.includes('-'))
    descriptionScore += 7
  descriptionScore = Math.min(100, descriptionScore)

  let keywordsFieldScore = 0
  if (input.keywordsField) {
    const used = input.keywordsField.length
    keywordsFieldScore = Math.round((used / 100) * 100)
  }

  let ratingsScore = 0
  if (input.rating >= 4.5 && input.ratingsCount > 1000) ratingsScore = 95
  else if (input.rating >= 4.0 && input.ratingsCount > 100) ratingsScore = 75
  else if (input.rating >= 3.5) ratingsScore = 50
  else ratingsScore = 25

  let creativesScore = 0
  if (input.hasScreenshots) {
    creativesScore = Math.min(
      100,
      Math.round((input.screenshotCount / 8) * 100),
    )
  }

  const overall = Math.round(
    titleScore * 0.25 +
      subtitleScore * 0.15 +
      descriptionScore * 0.2 +
      keywordsFieldScore * 0.1 +
      ratingsScore * 0.15 +
      creativesScore * 0.15,
  )

  return {
    overall,
    breakdown: {
      titleScore,
      subtitleScore,
      descriptionScore,
      keywordsFieldScore,
      ratingsScore,
      creativesScore,
    },
  }
}
