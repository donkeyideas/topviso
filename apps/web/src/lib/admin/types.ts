/**
 * Shared type definitions for admin dashboard metrics.
 * All types used across metrics computation, API endpoints, and page components.
 */

/* ---------- plan prices (business config, not mock data) ---------- */

export const PLAN_PRICES: Record<string, number> = {
  solo: 0,
  team: 49,
  enterprise: 199,
}

/* ---------- per-org health & churn ---------- */

export interface HealthScoreResult {
  healthScore: number
  churnRisk: number
  riskFactors: string[]
  lastActivityAt: string | null
}

export interface OrgHealthMap {
  [orgId: string]: HealthScoreResult
}

/* ---------- MRR waterfall ---------- */

export interface WaterfallRow {
  label: string
  newMrr: number
  expansion: number
  contraction: number
  churned: number
}

/* ---------- MRR bridge ---------- */

export interface BridgeRow {
  label: string
  sublabel: string
  value: number
  type: 'start' | 'new' | 'expansion' | 'contraction' | 'churned' | 'end'
  pctWidth: number
}

/* ---------- sparklines ---------- */

export interface SparklineData {
  mrr: number[] | null
  netNewLogos: number[] | null
  trialToPaid: number[] | null
  nrr: number[] | null
  runway: number[] | null
}

/* ---------- SaaS metrics ---------- */

export interface SaasMetrics {
  mrr: number
  arr: number
  nrr: number | null
  grr: number | null
  logoChurn30d: number | null
  cacPayback: number | null
  ruleOf40: number | null
  trialToPaid7d: number | null
  activation72h: number | null
  ttvMedian: string | null
  dauWau: number | null
  featureBreadth: number | null
  grossMargin: number | null
  quickRatio: number | null
  magicNumber: number | null
  expansionPct: number | null
  runway: string | null
  blendedCac: number | null
  blendedLtv: number | null
  ltvCac: number | null
  contribution: number | null
}

/* ---------- geo distribution ---------- */

export interface GeoEntry {
  code: string
  name: string
  customers: number
  mrr: number
  delta: string
}

/* ---------- cohort retention ---------- */

export interface CohortRetentionRow {
  label: string
  size: number
  retention: number[]
}

/* ---------- module retention ---------- */

export interface ModuleRetentionRow {
  modules: string
  retention: number
}

/* ---------- revenue by module ---------- */

export interface RevenueByModuleRow {
  name: string
  tag: string
  value: number
  pct: number
}

/* ---------- channel economics ---------- */

export interface ChannelEconomicsRow {
  channel: string
  visitors: number
  signups: number
  paid: number
  cac: number
  ltv: number
  ltvCac: string
  payback: string
  quality: string
}

/* ---------- health trajectory ---------- */

export interface HealthTrajectoryPoint {
  month: string
  score: number
  avg: number
}

/* ---------- churn explainer ---------- */

export interface ChurnExplainerItem {
  feature: string
  detail: string
  shapValue: number
}

/* ---------- usage heatmap ---------- */

/** Keys are "YYYY-MM-DD", values are 0–4 intensity levels */
export type UsageHeatmap = Record<string, number>
