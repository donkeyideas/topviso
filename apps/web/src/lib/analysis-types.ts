// TypeScript interfaces for all 23 analysis JSON shapes returned by /api/generate
// Each interface matches the JSON shape from the corresponding DeepSeek prompt.

// --- Per-app analysis types ---

export interface OverviewData {
  priorities: Array<{
    action: string
    detail: string
    surface: string
    module: string
    lift: string
    liftUnit: string
    effort: 'small' | 'medium' | 'large'
    owner: string
  }>
  surfaces: {
    appStore: { top10: number; categoryRank: string; cvr: string }
    playStore: { top10: number; categoryRank: string; cvr: string }
    ai: { recommended: string; citations: number; referralInstalls: string }
  }
  installTrend?: {
    dates: string[]
    values: number[]
    medianValues?: number[]
    annotations?: Array<{ index: number; label: string }>
  }
  summary: string
  asoScore?: number | null
  realData?: boolean
  storeRating?: number | null
  storeRatings?: number | null
  storeInstalls?: string | null
  storeReviewCount?: number | null
}

export interface KeywordItem {
  keyword: string
  intent: 'navigational' | 'informational' | 'transactional' | 'commercial'
  difficulty: number
  relevance: number
  volume?: number
  cpc?: number
  rank?: number | null
  country?: string
  delta7d?: number | null
  kei?: string
  topCompetitor?: string
  field?: string
  isEstimate?: { volume?: boolean; cpc?: boolean; difficulty?: boolean }
}

// LLM returns a raw array — pages must normalize
export type KeywordsData = KeywordItem[]

export interface OptimizeTitleData {
  titles?: Array<{ title: string; charCount: number; reasoning: string }>
}

export interface OptimizeSubtitleData {
  subtitles?: Array<{ subtitle: string; charCount: number; reasoning: string }>
}

export interface OptimizeDescriptionData {
  shortDescription: string
  fullDescription: string
  keywordsUsed: string[]
}

export interface OptimizeKeywordsFieldData {
  keywordField: string
  charCount: number
  reasoning: string
}

export interface StrategyData {
  quarter: string
  goals: Array<{ goal: string; metric: string; target: string }>
  weeks: Array<{ week: number; focus: string; actions: string[]; expectedOutcome: string }>
  dos?: string[]
  donts?: string[]
  summary: string
}

export interface RecommendationItem {
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  effort: 'high' | 'medium' | 'low'
  category: string
  lift?: string
  owner?: string
}

// LLM returns a raw array
export type RecommendationsData = RecommendationItem[]

export interface MarketOpportunity {
  market: string
  locale: string
  marketSize: 'large' | 'medium' | 'small' | 'very large'
  categoryFit: number
  competition: 'high' | 'medium' | 'low'
  opportunityScore: number
  recommendation: string
  status?: 'localized' | 'ai-draft' | 'not-localized' | 'english-ok'
  completeness?: number
}

export interface MarketPerformance {
  locale: string
  market: string
  estimatedDownloads: string
  keywordsCovered: number
  conversionRate: string
  rating: number | null
  status: 'live' | 'draft' | 'not started'
}

export interface LocalizationData {
  localizations: Array<{
    locale: string
    title: string
    subtitle: string
    shortDescription: string
    keywords: string[]
  }>
  marketOpportunities?: MarketOpportunity[]
  marketPerformance?: MarketPerformance[]
}

export interface CompetitorItem {
  name: string
  reason: string
  strengths: string[]
  weaknesses: string[]
  threatLevel: 'high' | 'medium' | 'low'
  storeId?: string
  overlapCount?: number
  rating?: number | null
  installs?: string | null
  developer?: string | null
  monthlyDownloads?: string | null
  estimatedMRR?: string | null
  activeAds?: number | boolean | null
  keywordGaps?: string[]
  sharedKeywords?: string[]
  llmSov?: string | null
  trend30d?: string | null
}

export interface CompetitorAlert {
  type: 'competitor-move' | 'keyword-shift' | 'opportunity' | 'ad-move'
  competitor: string
  timeAgo: string
  text: string
  action: string
}

// LLM returns a raw array, or object with alerts
export type CompetitorsData = CompetitorItem[] | {
  competitors: CompetitorItem[]
  alerts?: CompetitorAlert[]
}

export interface ReviewsAnalysisData {
  sentimentSummary: string
  praiseThemes: Array<{ theme: string; frequency: 'high' | 'medium' | 'low'; example: string }>
  complaintThemes: Array<{ theme: string; frequency: 'high' | 'medium' | 'low'; example: string; suggestedFix: string }>
  replyTemplates: Array<{ scenario: string; reply: string }>
  keywordsFromReviews: string[]
  realReviewCount?: number
  averageRating?: number
}

export interface StoreIntelData {
  categoryTrends: Array<{ trend: string; impact: 'high' | 'medium' | 'low'; action: string }>
  algorithmFactors: Array<{ factor: string; weight: 'high' | 'medium' | 'low'; currentStatus: string }>
  featuringTips: string[]
  competitiveDensity: 'high' | 'medium' | 'low'
  summary: string
  keywordOpportunities?: Array<{
    keyword: string
    description: string
    volume: 'high' | 'medium' | 'low'
    competition: 'high' | 'medium' | 'low'
    score: number
  }>
  categoryLeaderboard?: Array<{
    rank: number
    name: string
    developer: string
    rating: number
    appId?: string | undefined
    iconUrl?: string | undefined
  }>
  marketTrends?: Array<{
    trend: string
    detail: string
    direction: 'up' | 'down' | 'stable'
    relevance: 'high' | 'medium' | 'low'
  }>
  realData?: boolean
}

export interface VisibilityData {
  overallScore: number
  scoreDelta?: string
  iosScore?: number
  androidScore?: number
  platformDelta?: string
  categoryRank?: string
  categoryRankDelta?: string
  shareOfSearch?: string
  shareOfSearchDelta?: string
  categoryPercentile?: string
  refreshedAt?: string
  surfaces: Array<{ surface: string; score: number; status: 'strong' | 'moderate' | 'weak'; recommendation: string }>
  quickWins: Array<{ action: string; expectedImpact: string }>
  recommendations?: Array<{
    severity: 'easy-win' | 'medium' | 'watch'
    effort: string
    text: string
    action: string
  }>
  trendData?: {
    iosPath?: string
    androidPath?: string
    medianPath?: string
    // Real trend data from historical keyword ranks
    dates?: string[]
    scores?: number[]
  }
  rankingDistribution?: {
    top3: number
    top10: number
    top25: number
    top50: number
    notRanked: number
  }
  keywordBreakdown?: Array<{
    keyword: string
    position: number | null
    volume: number
    weight: number
    contributionPct: number
  }>
  summary: string
}

export interface VersionHistoryItem {
  version: string
  date: string
  changes: string[]
  asoImpact: 'positive' | 'neutral' | 'negative'
  ratingDelta: string
  downloadDelta: string
}

export interface UpdateImpactData {
  versionHistory?: VersionHistoryItem[]
  updateFrequency: string
  nextUpdatePlan: Array<{ change: string; expectedImpact: string; priority: 'high' | 'medium' | 'low' }>
  metadataTests: Array<{ element: string; current: string; suggested: string; hypothesis: string }>
  releaseNotesTips: string[]
  summary: string
}

export interface DiscoveryMapData {
  surfaces: Array<{
    name: string
    type: 'store' | 'llm'
    estimatedTraffic: 'high' | 'medium' | 'low'
    optimizationStatus: 'optimized' | 'partial' | 'unoptimized'
    topQueries: string[]
    recommendation: string
  }>
  gaps: Array<{ surface: string; issue: string; fix: string }>
  summary: string
}

// --- Global page analysis types ---

export interface LlmTrackItem {
  surface: string
  mentioned: boolean
  response: string
  position: '1st' | '2nd' | '3rd' | 'not listed'
}

export interface LlmCitation {
  source: string
  quote: string
  meta: string
}

export interface LlmPromptRow {
  prompt: string
  engines: Record<string, number>
  winner: string
}

export interface LlmOptimizationTip {
  title: string
  detail: string
  priority: 'high' | 'medium' | 'low'
}

// LLM returns a raw array, or an object with results + extras
export type LlmTrackData = LlmTrackItem[] | {
  results: LlmTrackItem[]
  citations?: LlmCitation[]
  promptMatrix?: LlmPromptRow[]
  optimizationTips?: LlmOptimizationTip[]
}

export interface IntentKeyword {
  kw: string
  state: 'ours' | 'win' | 'miss'
}

export interface IntentMapData {
  clusters: Array<{
    intent: string
    keywords: (string | IntentKeyword)[]
    optimization: string
    coveragePct?: number
  }>
  gaps: Array<{ intent: string; suggestedKeywords: string[]; reasoning: string }>
}

export interface AdIntelData {
  // REAL DATA
  searchAdKeywords?: Array<{
    keyword: string
    rank: number | null
    volume: number
    difficulty: number
    cpc: number
    intent: string
    bidStrategy: string
  }>
  keywordsTracked?: number
  avgDifficulty?: number
  competitorOverlap?: Array<{ competitor: string; sharedKeywords: string[] }>
  realData?: boolean
  // AI ANALYSIS
  platforms?: Array<{
    platform: string
    fit: 'high' | 'medium' | 'low'
    reasoning: string
  }>
  campaignIdeas?: Array<{ platform: string; type: string; targeting: string; creative: string }>
  topPlatformFit?: string
  summary: string
}

export interface CreativeLabData {
  // REAL DATA
  screenshots?: string[]
  screenshotCount?: number
  iconUrl?: string
  creativeScore?: number
  scoreBreakdown?: {
    titleScore: number
    subtitleScore: number
    descriptionScore: number
    keywordsFieldScore: number
    ratingsScore: number
    creativesScore: number
  }
  competitorCreatives?: Array<{
    name: string
    iconUrl: string
    screenshots: string[]
    rating: number | null
  }>
  competitorCount?: number
  realData?: boolean
  // AI ANALYSIS
  screenshotRecommendations?: Array<{ title: string; detail: string; priority: 'high' | 'medium' | 'low' }>
  iconRecommendations?: Array<{ title: string; detail: string }>
  competitorInsights?: Array<{ insight: string; action: string }>
  summary: string
}

export interface KeywordAudiencesData {
  // REAL DATA + AI CLUSTERING
  audiences?: Array<{
    name: string
    description: string
    keywords: Array<{ keyword: string; state: 'ours' | 'win' | 'miss'; rank: number | null; volume: number }>
    coveragePct: number
    messagingFocus: { title: string; subtitle: string }
  }>
  totalKeywords?: number
  avgCoverage?: number
  // REAL DATA
  uncoveredKeywords?: Array<{ keyword: string; volume: number; difficulty: number }>
  // AI ANALYSIS
  audienceInsights?: Array<{ insight: string; action: string }>
  summary: string
}

export interface GrowthInsightsData {
  // REAL DATA
  installTrend?: { dates: string[]; values: number[] }
  ratingTrend?: { dates: string[]; scores: number[]; counts: number[] }
  currentInstalls?: string
  currentRating?: number
  currentRatings?: number
  visibilityScore?: number
  keywordVisibility?: Array<{
    keyword: string
    rank: number | null
    volume: number
    estimatedTraffic: number
    trend: 'up' | 'down' | 'stable'
  }>
  totalEstimatedTraffic?: number
  isAndroid?: boolean
  realData?: boolean
  // AI ANALYSIS
  growthRecommendations?: Array<{ title: string; detail: string; impact: 'high' | 'medium' | 'low' }>
  summary: string
}

export interface ReviewsPlusData {
  newThisWeek: string
  autoReplied: string
  autoTicketed: string
  ratingRisk: string
  clusters: Array<{
    cluster: string
    trend: string
    risk: number
    status: string
  }>
  tickets: Array<{
    source: string
    stars: number
    theme: string
    themeNegative: boolean
    text: string
    routing: string
  }>
  summary: string
}

export interface AgentReadyData {
  overallScore: number
  categoryAvg: number
  etaTo95: string
  checks: Array<{
    check: string
    status: 'pass' | 'partial' | 'draft' | 'fail'
    weight: number
  }>
  profileDescription: string
  projection: string
  manifest: {
    name: string
    description: string
    installUrl: string
    capabilities: string[]
    plans: Array<{ id: string; priceMonthly?: number }>
  }
  summary: string
}

export interface MarketIntelData {
  // REAL DATA
  categoryLeaderboard?: Array<{
    rank: number
    name: string
    developer: string
    rating: number
    appId?: string
    iconUrl?: string
  }>
  competitors?: Array<{
    name: string
    threatLevel: string
    reason: string
    rating?: number | null
    installs?: string | null
    storeId?: string | null
  }>
  competitorsTracked?: number
  keywordsTracked?: number
  categoryPosition?: number | null
  categoryRatingAvg?: number | null
  realData?: boolean
  // AI ANALYSIS
  marketOverview?: { growth: string; saturation: 'high' | 'medium' | 'low'; insight: string }
  trends?: Array<{ trend: string; detail: string; direction: 'up' | 'down' | 'stable'; relevance: 'high' | 'medium' | 'low' }>
  whitespace?: Array<{ gap: string; audience: string; recommendation: string }>
  summary: string
}

// --- Conversion Optimization ---

export interface ConversionData {
  conversionScore: number

  searchCardAudit: {
    iconScore: number
    titleScore: number
    subtitleScore: number
    ratingScore: number
    screenshotScore: number
    issues: Array<{
      element: 'icon' | 'title' | 'subtitle' | 'rating' | 'screenshots' | 'overall'
      issue: string
      fix: string
      impact: 'high' | 'medium' | 'low'
    }>
  }

  competitorComparison: Array<{
    name: string
    storeId: string
    iconUrl: string
    rating: number
    ratingsCount: number
    screenshotCount: number
    advantage: string
  }>

  recommendations: Array<{
    title: string
    detail: string
    expectedLift: string
    effort: 'quick-win' | 'moderate' | 'significant'
    priority: 'high' | 'medium' | 'low'
  }>

  appIcon: string
  appTitle: string
  appSubtitle: string
  appRating: number
  appRatingsCount: number
  screenshotUrls: string[]

  summary: string
  realData?: boolean
}

// --- Feature Image Score ---

export interface FeatureImageScoreCategory {
  name: string
  score: number
  weight: number
  findings: string[]
  suggestions: string[]
}

export interface FeatureImageScoreData {
  // REAL DATA
  featureImageUrl: string | null
  uploadedImageUrl?: string
  platform: 'android' | 'ios'
  realData: boolean

  // SCORING
  overallScore: number
  categories: FeatureImageScoreCategory[]

  // AI ANALYSIS
  strengths: string[]
  weaknesses: string[]
  recommendations: Array<{
    title: string
    detail: string
    priority: 'high' | 'medium' | 'low'
    expectedImpact: string
  }>

  // COMPETITOR DATA
  competitorFeatureImages?: Array<{
    name: string
    imageUrl: string | null
    estimatedScore: number
  }>

  // META
  summary: string
  analyzedAt: string
}

// --- Helper: normalize raw arrays from LLM ---
// Some analysis types return raw arrays. This helper wraps them safely.
export function asArray<T>(data: T | T[] | null): T[] {
  if (data === null || data === undefined) return []
  if (Array.isArray(data)) return data
  return []
}
