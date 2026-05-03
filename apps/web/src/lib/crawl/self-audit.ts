// eslint-disable-next-line @typescript-eslint/no-require-imports
import * as cheerio from 'cheerio'

export interface CrawledPage {
  url: string
  path: string
  statusCode: number
  loadTimeMs: number

  // Meta
  title: string
  titleLength: number
  metaDescription: string
  descriptionLength: number
  lang: string

  // Headings
  h1: string
  h1Count: number
  h2Count: number
  h3Count: number

  // Content
  wordCount: number
  questionCount: number
  listCount: number

  // Links
  internalLinks: number
  externalLinks: number

  // Images
  imageCount: number
  imagesWithoutAlt: number

  // Open Graph
  hasOgImage: boolean
  ogTitle: string
  ogDescription: string

  // Technical
  hasCanonical: boolean
  canonicalUrl: string
  hasSchema: boolean
  schemaTypes: string[]
  hasFaqSchema: boolean
  hasHowToSchema: boolean
  hasBreadcrumbs: boolean
  hasArticleSchema: boolean
  hasOrganizationSchema: boolean
  hasSpeakableSchema: boolean
}

export interface AuditIssue {
  severity: 'critical' | 'warning' | 'info'
  category: 'seo' | 'technical' | 'content' | 'aeo' | 'geo' | 'cro'
  title: string
  description: string
  affectedUrl?: string
  recommendation?: string
}

export interface SelfAuditResult {
  pages: CrawledPage[]
  crawledAt: string
  siteUrl: string
  totalPages: number

  seoScore: number
  technicalScore: number
  contentScore: number
  aeoScore: number
  geoScore: number
  croScore: number

  issues: AuditIssue[]
}

const MARKETING_ROUTES = [
  '/',
  '/pricing',
  '/product',
  '/about',
  '/docs',
  '/changelog',
  '/blog',
  '/login',
  '/signup',
]

async function crawlPage(
  baseUrl: string,
  path: string,
): Promise<CrawledPage> {
  const url = `${baseUrl}${path}`
  const start = performance.now()

  let statusCode = 0
  let html = ''

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'ASO-SelfAudit/1.0' },
      redirect: 'follow',
    })
    statusCode = res.status
    html = await res.text()
  } catch {
    return emptyPage(url, path, 0, performance.now() - start)
  }

  const loadTimeMs = Math.round(performance.now() - start)
  const $ = cheerio.load(html)

  // Meta
  const title = $('title').first().text().trim()
  const metaDescription =
    $('meta[name="description"]').attr('content')?.trim() ?? ''
  const lang = $('html').attr('lang') ?? ''

  // Headings
  const h1 = $('h1').first().text().trim()
  const h1Count = $('h1').length
  const h2Count = $('h2').length
  const h3Count = $('h3').length

  // Content
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim()
  const wordCount = bodyText.split(' ').filter(Boolean).length
  const questionCount = (bodyText.match(/\?/g) ?? []).length
  const listCount = $('ul, ol').length

  // Links
  const links = $('a[href]')
  let internalLinks = 0
  let externalLinks = 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  links.each((_: any, el: any) => {
    const href = $(el).attr('href') ?? ''
    if (
      href.startsWith('/') ||
      href.startsWith(baseUrl) ||
      href.startsWith('#')
    ) {
      internalLinks++
    } else if (href.startsWith('http')) {
      externalLinks++
    }
  })

  // Images
  const images = $('img')
  const imageCount = images.length
  let imagesWithoutAlt = 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  images.each((_: any, el: any) => {
    const alt = $(el).attr('alt')
    if (!alt || !alt.trim()) imagesWithoutAlt++
  })

  // Open Graph
  const ogImage = $('meta[property="og:image"]').attr('content') ?? ''
  const ogTitle = $('meta[property="og:title"]').attr('content') ?? ''
  const ogDescription =
    $('meta[property="og:description"]').attr('content') ?? ''

  // Technical
  const canonicalUrl =
    $('link[rel="canonical"]').attr('href') ?? ''
  const hasCanonical = !!canonicalUrl

  // Schema / Structured Data
  const scripts = $('script[type="application/ld+json"]')
  const schemaTypes: string[] = []
  let hasFaqSchema = false
  let hasHowToSchema = false
  let hasArticleSchema = false
  let hasOrganizationSchema = false
  let hasBreadcrumbs = false
  let hasSpeakableSchema = false

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scripts.each((_: any, el: any) => {
    try {
      const json = JSON.parse($(el).html() ?? '{}')
      const type = json['@type'] ?? ''
      if (type) schemaTypes.push(type)
      if (type === 'FAQPage' || type === 'FAQ') hasFaqSchema = true
      if (type === 'HowTo') hasHowToSchema = true
      if (type === 'Article' || type === 'BlogPosting')
        hasArticleSchema = true
      if (type === 'Organization') hasOrganizationSchema = true
      if (type === 'BreadcrumbList') hasBreadcrumbs = true
      if (json.speakable) hasSpeakableSchema = true
    } catch {
      // ignore parse errors
    }
  })

  return {
    url,
    path,
    statusCode,
    loadTimeMs,
    title,
    titleLength: title.length,
    metaDescription,
    descriptionLength: metaDescription.length,
    lang,
    h1,
    h1Count,
    h2Count,
    h3Count,
    wordCount,
    questionCount,
    listCount,
    internalLinks,
    externalLinks,
    imageCount,
    imagesWithoutAlt,
    hasOgImage: !!ogImage,
    ogTitle,
    ogDescription,
    hasCanonical,
    canonicalUrl,
    hasSchema: schemaTypes.length > 0,
    schemaTypes,
    hasFaqSchema,
    hasHowToSchema,
    hasBreadcrumbs,
    hasArticleSchema,
    hasOrganizationSchema,
    hasSpeakableSchema,
  }
}

function emptyPage(
  url: string,
  path: string,
  statusCode: number,
  loadTimeMs: number,
): CrawledPage {
  return {
    url,
    path,
    statusCode,
    loadTimeMs: Math.round(loadTimeMs),
    title: '',
    titleLength: 0,
    metaDescription: '',
    descriptionLength: 0,
    lang: '',
    h1: '',
    h1Count: 0,
    h2Count: 0,
    h3Count: 0,
    wordCount: 0,
    questionCount: 0,
    listCount: 0,
    internalLinks: 0,
    externalLinks: 0,
    imageCount: 0,
    imagesWithoutAlt: 0,
    hasOgImage: false,
    ogTitle: '',
    ogDescription: '',
    hasCanonical: false,
    canonicalUrl: '',
    hasSchema: false,
    schemaTypes: [],
    hasFaqSchema: false,
    hasHowToSchema: false,
    hasBreadcrumbs: false,
    hasArticleSchema: false,
    hasOrganizationSchema: false,
    hasSpeakableSchema: false,
  }
}

function calculateScores(pages: CrawledPage[]) {
  const n = pages.length || 1

  // SEO Score
  const goodTitles = pages.filter(
    (p) => p.titleLength >= 30 && p.titleLength <= 60,
  ).length
  const goodDescs = pages.filter(
    (p) => p.descriptionLength >= 70 && p.descriptionLength <= 160,
  ).length
  const withOg = pages.filter((p) => p.hasOgImage).length
  const seoScore = Math.round(
    (goodTitles / n) * 40 + (goodDescs / n) * 40 + (withOg / n) * 20,
  )

  // Technical Score
  const status200 = pages.filter((p) => p.statusCode === 200).length
  const canonical = pages.filter((p) => p.hasCanonical).length
  const singleH1 = pages.filter((p) => p.h1Count === 1).length
  const schema = pages.filter((p) => p.hasSchema).length
  const fastPages = pages.filter((p) => p.loadTimeMs < 3000).length
  const technicalScore = Math.round(
    (status200 / n) * 25 +
      (canonical / n) * 20 +
      (singleH1 / n) * 20 +
      (schema / n) * 20 +
      (fastPages / n) * 15,
  )

  // Content Score
  const goodContent = pages.filter((p) => p.wordCount >= 300).length
  const withHeadings = pages.filter((p) => p.h2Count >= 2).length
  const withLists = pages.filter((p) => p.listCount >= 1).length
  const goodImages = pages.filter(
    (p) => p.imageCount > 0 && p.imagesWithoutAlt === 0,
  ).length
  const contentScore = Math.round(
    (goodContent / n) * 30 +
      (withHeadings / n) * 25 +
      (withLists / n) * 20 +
      (goodImages / n) * 25,
  )

  // AEO Score
  const faq = pages.filter((p) => p.hasFaqSchema).length
  const questions = pages.filter((p) => p.questionCount >= 3).length
  const speakable = pages.filter((p) => p.hasSpeakableSchema).length
  const richSchema = pages.filter((p) => p.schemaTypes.length >= 2).length
  const aeoScore = Math.round(
    (schema / n) * 20 +
      (faq / n) * 20 +
      (questions / n) * 20 +
      (speakable / n) * 20 +
      (richSchema / n) * 20,
  )

  // GEO Score
  const og = pages.filter(
    (p) => p.hasOgImage && p.ogTitle && p.ogDescription,
  ).length
  const richContent = pages.filter(
    (p) => p.wordCount >= 500 && p.h2Count >= 3,
  ).length
  const breadcrumbs = pages.filter((p) => p.hasBreadcrumbs).length
  const lang = pages.filter((p) => !!p.lang).length
  const geoScore = Math.round(
    (schema / n) * 20 +
      (og / n) * 20 +
      (richContent / n) * 20 +
      (breadcrumbs / n) * 20 +
      (lang / n) * 20,
  )

  // CRO Score
  const healthy = pages.filter((p) => p.statusCode === 200).length
  const fast = pages.filter((p) => p.loadTimeMs < 2000).length
  const goodTitlesCro = pages.filter((p) => p.titleLength > 0).length
  const ctaLinks = pages.filter((p) => p.internalLinks >= 3).length
  const croScore = Math.round(
    (healthy / n) * 25 +
      (fast / n) * 25 +
      (goodTitlesCro / n) * 25 +
      (ctaLinks / n) * 25,
  )

  return { seoScore, technicalScore, contentScore, aeoScore, geoScore, croScore }
}

function generateIssues(pages: CrawledPage[]): AuditIssue[] {
  const issues: AuditIssue[] = []

  for (const page of pages) {
    // Critical
    if (page.statusCode !== 200 && page.statusCode !== 0) {
      issues.push({
        severity: 'critical',
        category: 'technical',
        title: `HTTP ${page.statusCode} error`,
        description: `Page returned status ${page.statusCode}`,
        affectedUrl: page.path,
        recommendation: 'Fix the page to return a 200 status code.',
      })
    }
    if (!page.title) {
      issues.push({
        severity: 'critical',
        category: 'seo',
        title: 'Missing page title',
        description: 'No <title> tag found.',
        affectedUrl: page.path,
        recommendation: 'Add a descriptive title between 30-60 characters.',
      })
    }
    if (page.h1Count === 0) {
      issues.push({
        severity: 'critical',
        category: 'seo',
        title: 'Missing H1 heading',
        description: 'No H1 tag found on the page.',
        affectedUrl: page.path,
        recommendation: 'Add exactly one H1 heading per page.',
      })
    }

    // Warnings
    if (page.titleLength > 60) {
      issues.push({
        severity: 'warning',
        category: 'seo',
        title: 'Title too long',
        description: `Title is ${page.titleLength} characters (recommended: 30-60).`,
        affectedUrl: page.path,
        recommendation: 'Shorten the title to under 60 characters.',
      })
    }
    if (page.descriptionLength === 0) {
      issues.push({
        severity: 'warning',
        category: 'seo',
        title: 'Missing meta description',
        description: 'No meta description found.',
        affectedUrl: page.path,
        recommendation: 'Add a meta description between 70-160 characters.',
      })
    }
    if (page.h1Count > 1) {
      issues.push({
        severity: 'warning',
        category: 'seo',
        title: 'Multiple H1 tags',
        description: `Found ${page.h1Count} H1 tags (should be exactly 1).`,
        affectedUrl: page.path,
        recommendation: 'Use only one H1 per page.',
      })
    }
    if (!page.hasOgImage) {
      issues.push({
        severity: 'warning',
        category: 'geo',
        title: 'Missing OG image',
        description: 'No Open Graph image meta tag.',
        affectedUrl: page.path,
        recommendation: 'Add an og:image meta tag for social sharing.',
      })
    }
    if (!page.hasCanonical) {
      issues.push({
        severity: 'warning',
        category: 'technical',
        title: 'Missing canonical URL',
        description: 'No canonical link tag found.',
        affectedUrl: page.path,
        recommendation: 'Add a <link rel="canonical"> tag.',
      })
    }
    if (page.imagesWithoutAlt > 0) {
      issues.push({
        severity: 'warning',
        category: 'content',
        title: 'Images without alt text',
        description: `${page.imagesWithoutAlt} image(s) missing alt attributes.`,
        affectedUrl: page.path,
        recommendation: 'Add descriptive alt text to all images.',
      })
    }
    if (page.loadTimeMs > 3000) {
      issues.push({
        severity: 'warning',
        category: 'cro',
        title: 'Slow page load',
        description: `Page took ${page.loadTimeMs}ms to load (target: <3000ms).`,
        affectedUrl: page.path,
        recommendation: 'Optimize page load time.',
      })
    }

    // Info
    if (!page.hasSchema) {
      issues.push({
        severity: 'info',
        category: 'aeo',
        title: 'No structured data',
        description: 'No JSON-LD schema markup found.',
        affectedUrl: page.path,
        recommendation: 'Add relevant schema.org structured data.',
      })
    }
    if (!page.lang) {
      issues.push({
        severity: 'info',
        category: 'geo',
        title: 'Missing lang attribute',
        description: 'No lang attribute on <html> tag.',
        affectedUrl: page.path,
        recommendation: 'Add lang="en" to the HTML element.',
      })
    }
    if (page.wordCount < 300 && page.statusCode === 200) {
      issues.push({
        severity: 'info',
        category: 'content',
        title: 'Thin content',
        description: `Only ${page.wordCount} words (recommended: 300+).`,
        affectedUrl: page.path,
        recommendation: 'Consider adding more substantive content.',
      })
    }
  }

  // Sort: critical first, then warning, then info
  const order = { critical: 0, warning: 1, info: 2 }
  issues.sort((a, b) => order[a.severity] - order[b.severity])

  return issues
}

export async function crawlOwnSite(
  siteUrl?: string,
): Promise<SelfAuditResult> {
  const baseUrl =
    siteUrl ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3000'

  const pages: CrawledPage[] = []

  // Crawl all routes (sequentially to be polite)
  for (const route of MARKETING_ROUTES) {
    const page = await crawlPage(baseUrl, route)
    pages.push(page)
  }

  const scores = calculateScores(pages)
  const issues = generateIssues(pages)

  return {
    pages,
    crawledAt: new Date().toISOString(),
    siteUrl: baseUrl,
    totalPages: pages.length,
    ...scores,
    issues,
  }
}
