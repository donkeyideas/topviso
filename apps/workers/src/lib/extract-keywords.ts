// Heuristic keywords extractor. We use this to populate
// `app_metadata_snapshots.keywords_field` for both stores so the optimizer can
// surface "current keywords" context. Output is comma-separated, length-capped
// to 100 chars to match Apple's hidden keywords field convention.
//
// This is intentionally simple — no LLM call, no per-app I/O. The real keyword
// strategy is generated separately by sync-pipeline's LLM expansion.

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'should', 'could', 'may', 'might', 'must', 'shall', 'can', 'to', 'of', 'in',
  'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down',
  'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
  'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
  'than', 'too', 'very', 's', 't', 'just', 'don', 'now', 'app', 'apps', 'best',
  'new', 'free', 'get', 'use', 'using', 'your', 'you', 'we', 'our', 'us',
  'this', 'that', 'these', 'those', 'it', 'its', 'their', 'them', 'they',
  'from', 'as', 'if',
])

export function extractKeywordsField(
  title: string | null | undefined,
  description: string | null | undefined,
  maxChars: number = 100,
): string {
  const text = `${title ?? ''} ${(description ?? '').slice(0, 1200)}`.toLowerCase()
  const tokens = text.match(/[a-z][a-z0-9]{2,}/g) ?? []

  const freq = new Map<string, number>()
  for (const t of tokens) {
    if (STOPWORDS.has(t)) continue
    freq.set(t, (freq.get(t) ?? 0) + 1)
  }

  const ranked = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w)

  // Greedily fill within maxChars, comma-separated.
  const out: string[] = []
  let len = 0
  for (const w of ranked) {
    const add = (out.length === 0 ? 0 : 1) + w.length
    if (len + add > maxChars) continue
    out.push(w)
    len += add
    if (out.length >= 20) break
  }
  return out.join(',')
}
