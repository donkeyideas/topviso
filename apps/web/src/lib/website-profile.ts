import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { loggedChatCompletion } from './deepseek'

/**
 * Structured, first-party understanding of what an app actually is — distilled
 * from the developer's website (or entered manually). This is the grounding
 * anchor that stops the optimizer from rewriting the store listing using only
 * the store listing. Every field is optional so a thin crawl still yields a
 * partial-but-useful profile.
 */
export interface AppProfile {
  one_liner: string
  what_it_does: string
  core_features: string[]
  target_audiences: string[]
  differentiators: string[]
  use_cases: string[]
  competitors_named: string[]
  keywords_seed: string[]
  tone: string
  markets: string[]
  monetization: string
  source: 'website' | 'brief' | 'manual'
  source_url: string | null
  confidence: 'high' | 'medium' | 'low'
}

const EMPTY_PROFILE: Omit<AppProfile, 'source' | 'source_url' | 'confidence'> = {
  one_liner: '',
  what_it_does: '',
  core_features: [],
  target_audiences: [],
  differentiators: [],
  use_cases: [],
  competitors_named: [],
  keywords_seed: [],
  tone: '',
  markets: [],
  monetization: '',
}

const MAX_CONTENT_BYTES = 600_000 // ~600KB of HTML is plenty for a landing page
const MAX_TEXT_CHARS = 12_000 // what we hand to the LLM after stripping
const FETCH_TIMEOUT_MS = 12_000

/** Reject obviously non-public hostnames before we even do DNS. */
function isBlockedHostname(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/\.$/, '')
  if (h === 'localhost' || h.endsWith('.localhost')) return true
  if (h === '0.0.0.0' || h === '::' || h === '[::]') return true
  // .local / .internal mDNS and private TLDs
  if (h.endsWith('.local') || h.endsWith('.internal')) return true
  return false
}

/** True if an IP literal falls in a private / loopback / link-local range. */
function isPrivateIp(ip: string): boolean {
  const v = isIP(ip)
  if (v === 4) {
    const parts = ip.split('.').map(Number)
    const [a, b] = parts as [number, number, number, number]
    if (a === 10) return true
    if (a === 127) return true
    if (a === 0) return true
    if (a === 169 && b === 254) return true // link-local
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 100 && b >= 64 && b <= 127) return true // CGNAT
    return false
  }
  if (v === 6) {
    const lower = ip.toLowerCase()
    if (lower === '::1') return true
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true // unique local
    if (lower.startsWith('fe80')) return true // link-local
    // IPv4-mapped ::ffff:a.b.c.d
    const mapped = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    if (mapped) return isPrivateIp(mapped[1]!)
    return false
  }
  return false
}

export class WebsiteFetchError extends Error {}

/**
 * SSRF-safe fetch of a user-supplied URL: https/http only, no private hosts,
 * DNS resolved and checked against private ranges, hard timeout, byte cap.
 * Returns plain text extracted from the HTML.
 */
export async function fetchWebsiteText(rawUrl: string): Promise<string> {
  let url: URL
  try {
    url = new URL(rawUrl.trim())
  } catch {
    throw new WebsiteFetchError('Invalid URL')
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new WebsiteFetchError('Only http(s) URLs are allowed')
  }
  if (isBlockedHostname(url.hostname)) {
    throw new WebsiteFetchError('Refusing to fetch a local/internal host')
  }

  // Resolve DNS and reject if any resolved address is private. If the hostname
  // is already an IP literal, check it directly.
  const literal = isIP(url.hostname)
  if (literal) {
    if (isPrivateIp(url.hostname)) throw new WebsiteFetchError('Refusing to fetch a private address')
  } else {
    let addrs: { address: string }[]
    try {
      addrs = await lookup(url.hostname, { all: true })
    } catch {
      throw new WebsiteFetchError('Could not resolve host')
    }
    if (addrs.length === 0 || addrs.some((a) => isPrivateIp(a.address))) {
      throw new WebsiteFetchError('Refusing to fetch a private address')
    }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TopVisoBot/1.0; +https://www.topviso.com)',
        Accept: 'text/html,application/xhtml+xml',
      },
    })
  } catch (err) {
    throw new WebsiteFetchError(
      err instanceof Error && err.name === 'AbortError' ? 'Website timed out' : 'Could not reach website',
    )
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok) throw new WebsiteFetchError(`Website returned ${res.status}`)
  const contentType = res.headers.get('content-type') ?? ''
  if (contentType && !contentType.includes('html') && !contentType.includes('text')) {
    throw new WebsiteFetchError('URL is not an HTML page')
  }

  // Read with a byte cap so a giant page can't blow up memory.
  const reader = res.body?.getReader()
  if (!reader) throw new WebsiteFetchError('Empty response')
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) {
      chunks.push(value)
      total += value.length
      if (total > MAX_CONTENT_BYTES) {
        await reader.cancel()
        break
      }
    }
  }
  const html = new TextDecoder('utf-8').decode(concatChunks(chunks, total))
  return htmlToText(html).slice(0, MAX_TEXT_CHARS)
}

function concatChunks(chunks: Uint8Array[], total: number): Uint8Array {
  const out = new Uint8Array(total)
  let offset = 0
  for (const c of chunks) {
    out.set(c.subarray(0, Math.min(c.length, total - offset)), offset)
    offset += c.length
    if (offset >= total) break
  }
  return out
}

/** Crude but dependency-free HTML → text: drop scripts/styles, collapse tags. */
function htmlToText(html: string): string {
  const meta: string[] = []
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
  if (title) meta.push(title)
  for (const m of html.matchAll(/<meta[^>]+name=["'](?:description|keywords)["'][^>]+content=["']([^"']+)["']/gi)) {
    if (m[1]) meta.push(m[1])
  }
  for (const m of html.matchAll(/<meta[^>]+property=["']og:(?:title|description)["'][^>]+content=["']([^"']+)["']/gi)) {
    if (m[1]) meta.push(m[1])
  }

  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim()

  return [meta.join(' — '), body].filter(Boolean).join('\n\n')
}

/**
 * Parse a JSON object out of an LLM response. Mirrors the house pattern: strip
 * markdown fences, try a direct parse, then fall back to the first {...} block.
 * Throws if no JSON object can be recovered so callers surface a real failure
 * instead of silently returning an empty result.
 */
function parseJsonObject(raw: string): Record<string, unknown> {
  const cleaned = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON object found in AI response')
    return JSON.parse(match[0])
  }
}

function asStringArray(v: unknown, cap: number): string[] {
  if (!Array.isArray(v)) return []
  return v
    .map((x) => String(x ?? '').trim())
    .filter((x) => x.length > 0)
    .slice(0, cap)
}

const EXTRACTION_SYSTEM_PROMPT = `You are an ASO analyst building a factual profile of a mobile app from its marketing website. Extract ONLY what the text supports — never invent features, audiences, or competitors. If the text is thin, return fewer items rather than guessing. Marketing copy is aspirational: prefer concrete capabilities over slogans.

Return ONLY minified JSON (no markdown, no preamble) with exactly these keys:
{
  "one_liner": "<=90 char plain-language description of what the app is",
  "what_it_does": "2-3 sentence factual summary of the core function",
  "core_features": ["concrete feature", ...],           // up to 12
  "target_audiences": ["who it's for", ...],            // up to 6
  "differentiators": ["what makes it different", ...],  // up to 6
  "use_cases": ["job the user hires it for", ...],      // up to 8
  "competitors_named": ["competitor if the site names one", ...], // up to 6, [] if none
  "keywords_seed": ["search phrase a user would type", ...],      // up to 20, lowercase
  "tone": "one or two words, e.g. playful, professional",
  "markets": ["region/language if stated", ...],        // up to 6, [] if none
  "monetization": "free | freemium | subscription | paid | ads | unknown",
  "confidence": "high | medium | low"                   // how well the text described the app
}`

interface ExtractInput {
  websiteText: string
  appName?: string | null
  category?: string | null
  storeDescription?: string | null
  sourceUrl: string
}

/** Turn crawled website text into a structured AppProfile via the LLM. */
export async function extractAppProfileFromText(input: ExtractInput): Promise<AppProfile> {
  const context = [
    input.appName ? `App name: ${input.appName}` : '',
    input.category ? `Store category: ${input.category}` : '',
    input.storeDescription ? `Current store description (for reference only):\n${input.storeDescription.slice(0, 800)}` : '',
    `\nWebsite content:\n${input.websiteText}`,
  ]
    .filter(Boolean)
    .join('\n')

  const completion = await loggedChatCompletion(
    {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: context },
      ],
      temperature: 0.3,
      max_tokens: 1200,
    },
    { action: 'extract-app-profile' },
  )

  const parsed = parseJsonObject(completion.choices[0]?.message?.content ?? '{}')
  const confidence = parsed.confidence === 'high' || parsed.confidence === 'low' ? parsed.confidence : 'medium'

  return {
    ...EMPTY_PROFILE,
    one_liner: String(parsed.one_liner ?? '').trim().slice(0, 120),
    what_it_does: String(parsed.what_it_does ?? '').trim().slice(0, 600),
    core_features: asStringArray(parsed.core_features, 12),
    target_audiences: asStringArray(parsed.target_audiences, 6),
    differentiators: asStringArray(parsed.differentiators, 6),
    use_cases: asStringArray(parsed.use_cases, 8),
    competitors_named: asStringArray(parsed.competitors_named, 6),
    keywords_seed: asStringArray(parsed.keywords_seed, 20).map((k) => k.toLowerCase()),
    tone: String(parsed.tone ?? '').trim().slice(0, 40),
    markets: asStringArray(parsed.markets, 6),
    monetization: String(parsed.monetization ?? 'unknown').trim().slice(0, 40),
    source: 'website',
    source_url: input.sourceUrl,
    confidence: confidence as AppProfile['confidence'],
  }
}

/** Coerce an arbitrary object (e.g. a user PATCH body) into a safe AppProfile. */
export function sanitizeProfile(input: unknown, source: AppProfile['source'] = 'manual'): AppProfile {
  const p = (input ?? {}) as Record<string, unknown>
  const existingSource = p.source === 'website' || p.source === 'brief' || p.source === 'manual' ? p.source : source
  const confidence = p.confidence === 'high' || p.confidence === 'low' ? p.confidence : 'medium'
  return {
    ...EMPTY_PROFILE,
    one_liner: String(p.one_liner ?? '').trim().slice(0, 120),
    what_it_does: String(p.what_it_does ?? '').trim().slice(0, 600),
    core_features: asStringArray(p.core_features, 12),
    target_audiences: asStringArray(p.target_audiences, 6),
    differentiators: asStringArray(p.differentiators, 6),
    use_cases: asStringArray(p.use_cases, 8),
    competitors_named: asStringArray(p.competitors_named, 6),
    keywords_seed: asStringArray(p.keywords_seed, 20).map((k) => k.toLowerCase()),
    tone: String(p.tone ?? '').trim().slice(0, 40),
    markets: asStringArray(p.markets, 6),
    monetization: String(p.monetization ?? 'unknown').trim().slice(0, 40),
    source: existingSource as AppProfile['source'],
    source_url: p.source_url ? String(p.source_url).slice(0, 500) : null,
    confidence: confidence as AppProfile['confidence'],
  }
}

/** Compact, prompt-friendly rendering of the profile for LLM context. */
export function formatProfileForPrompt(profile: AppProfile | null | undefined): string {
  if (!profile) return ''
  const lines: string[] = []
  const push = (label: string, val: string | string[]) => {
    const s = Array.isArray(val) ? val.filter(Boolean).join(', ') : val
    if (s && s.trim()) lines.push(`- ${label}: ${s}`)
  }
  push('What it is', profile.one_liner)
  push('What it does', profile.what_it_does)
  push('Core features', profile.core_features)
  push('Target audience', profile.target_audiences)
  push('Differentiators', profile.differentiators)
  push('Use cases', profile.use_cases)
  push('Named competitors', profile.competitors_named)
  push('Value-prop keywords', profile.keywords_seed)
  push('Markets', profile.markets)
  push('Monetization', profile.monetization)
  push('Tone', profile.tone)
  if (lines.length === 0) return ''
  return `App Identity (first-party source of truth${profile.source_url ? ` from ${profile.source_url}` : ''}):\n${lines.join('\n')}`
}
