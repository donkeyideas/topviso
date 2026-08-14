import gplay from 'google-play-scraper'
import { loggedChatCompletion } from './deepseek'
import { formatProfileForPrompt, type AppProfile } from './website-profile'
import type { StoreAppData } from './store-scraper'

/**
 * Wide-net keyword discovery — the candidate half of keyword generation.
 *
 * The store table only shows phrases we thought of and rank-checked, so coverage
 * is a function of how wide the candidate net is. This casts a broad net in ONE
 * pass (instead of ~20 AI guesses that slowly accumulate) by combining:
 *   1. an exhaustive LLM pass grounded in the app's identity, and
 *   2. real store autocomplete — the actual phrases users type — for the app's
 *      platform (Play Store `suggest` on Android, App Store search hints on iOS).
 * Ranking those candidates is done by the caller.
 */

export interface DiscoverApp {
  name: string
  platform: 'ios' | 'android'
  category?: string | null
  app_profile?: AppProfile | null
  optimization_goal?: string | null
  target_keywords?: string[] | null
}

const AI_SYSTEM = `You are an ASO keyword researcher. Produce an EXHAUSTIVE list of real search phrases (1-4 words) users type to find this kind of app. Be systematic: for each core concept include singular AND plural, with and without "app", and every common modifier (best, free, pro, live, online, ranked, competitive, tournament, community, social, ai, real people, practice, tracker, tool). Include close synonyms and comparison/alternative forms. Return ONLY a JSON array of ~150 lowercase strings — no duplicates, no markdown, no commentary.`

function parseStringArray(raw: string): string[] {
  const cleaned = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
  let arr: unknown = []
  try { arr = JSON.parse(cleaned) } catch {
    const m = cleaned.match(/\[[\s\S]*\]/)
    if (m) { try { arr = JSON.parse(m[0]) } catch { arr = [] } }
  }
  return Array.isArray(arr) ? arr.map((s) => String(s ?? '').toLowerCase().trim()).filter(Boolean) : []
}

/** Exhaustive LLM candidate generation, grounded in the app's identity. */
export async function generateKeywordCandidatesAI(app: DiscoverApp, storeData?: StoreAppData | null): Promise<string[]> {
  const context = [
    `App: ${storeData?.title ?? app.name}`,
    `Platform: ${app.platform === 'ios' ? 'App Store (iOS)' : 'Google Play (Android)'}`,
    (storeData?.genre ?? app.category) ? `Category: ${storeData?.genre ?? app.category}` : '',
    storeData?.description ? `Description: ${storeData.description.slice(0, 400)}` : '',
    formatProfileForPrompt(app.app_profile ?? null),
    app.optimization_goal ? `Optimization goal: ${app.optimization_goal}` : '',
    (app.target_keywords ?? []).length ? `Priority terms: ${(app.target_keywords ?? []).join(', ')}` : '',
  ].filter(Boolean).join('\n')

  // deepseek-chat occasionally returns a malformed/empty body; retry a couple times.
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const c = await loggedChatCompletion(
        {
          model: 'deepseek-chat',
          messages: [{ role: 'system', content: AI_SYSTEM }, { role: 'user', content: context }],
          temperature: 0.6,
          max_tokens: 2200,
        },
        { action: 'discover-keywords' },
      )
      const arr = parseStringArray(c.choices[0]?.message?.content ?? '')
      if (arr.length > 0) return arr
    } catch {
      /* retry */
    }
    if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * attempt))
  }
  return []
}

/** Play Store autocomplete (real Android search suggestions). */
export async function playStoreSuggest(prefix: string, country = 'us'): Promise<string[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const out = await (gplay as any).suggest({ term: prefix, lang: 'en', country })
    return Array.isArray(out) ? out.map((s: unknown) => String(s).toLowerCase().trim()).filter(Boolean) : []
  } catch {
    return []
  }
}

/**
 * App Store search hints (iOS). Best-effort: unlike Google Play, Apple no longer
 * serves this endpoint publicly (it now requires a rotating storefront token),
 * so this usually returns []. iOS keyword breadth therefore comes from the
 * exhaustive AI pass. Kept so iOS autocomplete lights up automatically if Apple
 * re-opens it, and so a token-based source can slot in here later.
 */
export async function appStoreSuggest(prefix: string, country = 'us'): Promise<string[]> {
  try {
    const res = await fetch(
      `https://search.itunes.apple.com/WebObjects/MZSearchHints.woa/wa/hints?clientApplication=Software&term=${encodeURIComponent(prefix)}&country=${country}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' }, signal: AbortSignal.timeout(8000) },
    )
    if (!res.ok) return []
    const body = await res.text()
    const terms: string[] = []
    const re = /<key>term<\/key>\s*<string>([^<]+)<\/string>/gi
    let m: RegExpExecArray | null
    while ((m = re.exec(body)) !== null) terms.push(m[1]!.toLowerCase().trim())
    return terms.filter(Boolean)
  } catch {
    return []
  }
}

/** Expand a set of seed phrases into more via platform autocomplete. */
async function autocompleteExpand(seeds: string[], platform: 'ios' | 'android', country = 'us'): Promise<string[]> {
  const firstWords = [...new Set(seeds.map((s) => s.split(/\s+/)[0]).filter((w): w is string => !!w && w.length >= 3))].slice(0, 20)
  const suggest = platform === 'ios' ? appStoreSuggest : playStoreSuggest
  const out = new Set<string>()
  for (const w of firstWords) {
    for (const s of await suggest(w, country)) out.add(s)
    await new Promise((r) => setTimeout(r, 120))
  }
  return [...out]
}

/**
 * Full wide-net discovery: exhaustive AI + platform autocomplete, deduped against
 * what's already tracked, capped at `maxNew`. Returns candidate phrases only —
 * the caller rank-checks and persists them.
 */
export async function discoverKeywords(
  app: DiscoverApp,
  storeData: StoreAppData | null,
  existing: string[],
  maxNew: number,
): Promise<string[]> {
  const existingSet = new Set(existing.map((k) => k.toLowerCase()))
  const ai = await generateKeywordCandidatesAI(app, storeData)
  let auto: string[] = []
  try { auto = await autocompleteExpand(ai.length ? ai : [app.name], app.platform) } catch { /* best-effort */ }
  return [...new Set([...ai, ...auto])]
    .filter((k) => k && !existingSet.has(k) && k.length <= 40)
    .slice(0, maxNew)
}
