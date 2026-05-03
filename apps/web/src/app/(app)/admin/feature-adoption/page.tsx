import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { AdminCard } from '@/components/admin/AdminCard'
import { KpiCard, KpiGrid } from '@/components/admin/KpiCard'
import { SectionHead } from '@/components/admin/SectionHead'
import { FeatureMatrix } from './FeatureMatrix'

const FEATURE_LABELS: Record<string, string> = {
  keywords: 'Keywords',
  competitors: 'Competitors',
  visibility: 'Visibility',
  overview: 'Overview',
  'reviews-analysis': 'Reviews+ · auto-routing',
  recommendations: 'Recommendations',
  'store-intel': 'Store Intel',
  'llm-track': 'LLM Tracker · prompt editor',
  'intent-map': 'Intent Map · clustering',
  'ad-intel': 'Ad Intel',
  conversion: 'Conversion',
  'creative-lab': 'Creative Lab · AI variants',
  'growth-insights': 'Growth Insights',
  'keyword-audiences': 'Keyword Audiences',
  'market-intel': 'Market Intel',
  'optimize-title': 'Optimize Title',
  'optimize-subtitle': 'Optimize Subtitle',
  'update-impact': 'Update Impact',
}

const MODULE_MAP: Record<string, string> = {
  keywords: 'Keywords',
  competitors: 'Competitors',
  visibility: 'Visibility',
  overview: 'Overview',
  'reviews-analysis': 'Reviews+',
  recommendations: 'LLM',
  'store-intel': 'Intel',
  'llm-track': 'LLM',
  'intent-map': 'Intent',
  'ad-intel': 'Ads',
  conversion: 'Conversion',
  'creative-lab': 'Creative',
  'growth-insights': 'Growth',
  'keyword-audiences': 'Keywords',
  'market-intel': 'Intel',
  'optimize-title': 'Creative',
  'optimize-subtitle': 'Creative',
  'update-impact': 'Growth',
}

export interface FeatureRow {
  type: string
  label: string
  module: string
  appCount: number
  adoption: number
  shippedAgo: string
  status: 'HIT' | 'ON TRACK' | 'WATCH' | 'MISS' | 'SUNSET'
}

export default async function FeatureAdoptionPage() {
  const supabase = getSupabaseAdmin()

  // Get all analysis results with dates
  const { data: results } = await supabase
    .from('analysis_results')
    .select('analysis_type, app_id, created_at')

  // Aggregate per type: unique apps & earliest usage
  const typeApps: Record<string, Set<string>> = {}
  const typeFirstSeen: Record<string, Date> = {}
  for (const r of results ?? []) {
    if (!typeApps[r.analysis_type]) typeApps[r.analysis_type] = new Set()
    typeApps[r.analysis_type]!.add(r.app_id)
    const d = new Date(r.created_at)
    if (!typeFirstSeen[r.analysis_type] || d < typeFirstSeen[r.analysis_type]!) {
      typeFirstSeen[r.analysis_type] = d
    }
  }

  const allApps = new Set((results ?? []).map(r => r.app_id))
  const { count: totalApps } = await supabase.from('apps').select('id', { count: 'exact', head: true }).eq('is_active', true)
  const appBase = totalApps ?? (allApps.size || 1)

  // Build feature rows
  const now = Date.now()
  const features: FeatureRow[] = Object.entries(typeApps)
    .map(([type, apps]) => {
      const adoption = Math.round((apps.size / appBase) * 100)
      const firstSeen = typeFirstSeen[type]
      const daysAgo = firstSeen ? Math.floor((now - firstSeen.getTime()) / 86_400_000) : 0

      let status: FeatureRow['status'] = 'WATCH'
      if (adoption >= 60) status = 'HIT'
      else if (adoption >= 40) status = 'ON TRACK'
      else if (adoption >= 20) status = 'WATCH'
      else if (adoption > 0) status = 'MISS'
      else status = 'SUNSET'

      return {
        type,
        label: FEATURE_LABELS[type] ?? type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        module: MODULE_MAP[type] ?? 'Other',
        appCount: apps.size,
        adoption,
        shippedAgo: daysAgo > 0 ? `${daysAgo}d ago` : 'today',
        status,
      }
    })
    .sort((a, b) => b.adoption - a.adoption)

  const totalFeatures = features.length
  const hits = features.filter(f => f.status === 'HIT').length
  const misses = features.filter(f => f.status === 'MISS' || f.status === 'SUNSET').length
  const avgAdoption = features.length > 0 ? Math.round(features.reduce((s, f) => s + f.adoption, 0) / features.length) : 0
  const topFeature = features[0]
  const sunsetCandidates = features.filter(f => f.status === 'MISS' || f.status === 'SUNSET').length

  return (
    <>
      <AdminPageHead
        category="Product"
        title={<>Feature <em>adoption</em> &amp; retention correlation.</>}
        subtitle="Which features keep customers. Which ones don't. Adoption curves, retention correlation, cold features ripe for sunset."
        stamp={<>
          FEATURES ·<br />
          <strong>{totalFeatures} shipped</strong>
          HITS ·<br />
          <strong>{hits}</strong>
          MISSES ·<br />
          <strong>{misses}</strong>
        </>}
      />
      <div className="admin-content">
        <KpiGrid columns={4}>
          <KpiCard label="Shipped" value={totalFeatures.toString()} variant="hl" subtitle={`vs ${appBase} target`} />
          <KpiCard label="Avg Adoption · 30D" value={`${avgAdoption}%`} subtitle="of active users" />
          <KpiCard
            label="Top Retention Driver"
            value={topFeature?.label ?? '—'}
            small
            {...(topFeature ? { subtitle: `adoption ${topFeature.adoption}%` } : {})}
          />
          <KpiCard
            label="Sunset Candidates"
            value={sunsetCandidates.toString()}
            subtitle={sunsetCandidates > 0 ? 'low adoption' : 'none'}
            {...(sunsetCandidates > 0 ? { delta: '→ review', deltaDirection: 'flat' as const } : {})}
          />
        </KpiGrid>

        <SectionHead index="01" title="Feature Adoption Matrix" />
        <FeatureMatrix features={features} />
      </div>
    </>
  )
}
