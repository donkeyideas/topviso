// ============================================================
// ASO — Shared Type Definitions
// ============================================================

// --- Enums ---

export type PlanTier = 'solo' | 'team' | 'enterprise'
export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer'
export type Platform = 'ios' | 'android'
export type AlertSeverity = 'info' | 'warning' | 'critical'
export type AssetType = 'icon' | 'screenshot' | 'video' | 'subtitle'
export type CreativeTestStatus = 'draft' | 'synthetic' | 'live' | 'completed' | 'rolled_out'
export type AttributionModel = 'last_touch' | 'mmm'
export type ReviewClusterStatus = 'escalated' | 'ticketed' | 'shipped' | 'building' | 'monitoring'

export type Surface =
  | 'app_store'
  | 'play_store'
  | 'chatgpt'
  | 'claude'
  | 'gemini'
  | 'perplexity'
  | 'copilot'

export type LlmEngine = 'chatgpt' | 'claude' | 'gemini' | 'perplexity' | 'copilot' | 'deepseek'

export type AdPlatform = 'meta' | 'tiktok' | 'apple_search_ads' | 'google' | 'pinterest'

export type ChannelType =
  | 'organic'
  | 'paid_asa'
  | 'paid_meta'
  | 'paid_google'
  | 'paid_tiktok'
  | 'paid_linkedin'
  | 'referral'
  | 'llm_referral'
  | 'content'
  | 'creator_ugc'

export type IntegrationProvider =
  | 'linear'
  | 'jira'
  | 'slack'
  | 'segment'
  | 'datadog'
  | 'github'

// --- API Response ---

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }

// --- Plan Limits ---

export interface PlanLimits {
  apps: number
  keywords: number
  llmPrompts: number
  seats: number
  apiCallsPerMonth: number
  scheduledReports: number
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  solo: {
    apps: 1,
    keywords: 500,
    llmPrompts: 25,
    seats: 1,
    apiCallsPerMonth: 10_000,
    scheduledReports: 1,
  },
  team: {
    apps: 10,
    keywords: Infinity,
    llmPrompts: 200,
    seats: 5,
    apiCallsPerMonth: 250_000,
    scheduledReports: 10,
  },
  enterprise: {
    apps: Infinity,
    keywords: Infinity,
    llmPrompts: Infinity,
    seats: Infinity,
    apiCallsPerMonth: Infinity,
    scheduledReports: Infinity,
  },
}
