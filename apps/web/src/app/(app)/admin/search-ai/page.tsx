import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { KpiCard, KpiGrid } from '@/components/admin/KpiCard'
import { SearchAIClient } from '@/components/admin/SearchAIClient'
import { crawlOwnSite, type SelfAuditResult } from '@/lib/crawl/self-audit'

export default async function AdminSearchAIPage() {
  let audit: SelfAuditResult

  try {
    audit = await crawlOwnSite()
  } catch (err) {
    console.error('Self-audit failed:', err)
    // Provide a fallback empty result
    audit = {
      pages: [],
      crawledAt: new Date().toISOString(),
      siteUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      totalPages: 0,
      seoScore: 0,
      technicalScore: 0,
      contentScore: 0,
      aeoScore: 0,
      geoScore: 0,
      croScore: 0,
      issues: [],
    }
  }

  const avgScore = Math.round(
    (audit.seoScore +
      audit.technicalScore +
      audit.contentScore +
      audit.aeoScore +
      audit.geoScore +
      audit.croScore) /
      6,
  )

  const criticalIssues = audit.issues.filter(
    (i) => i.severity === 'critical',
  ).length
  const warnings = audit.issues.filter(
    (i) => i.severity === 'warning',
  ).length

  return (
    <>
      <AdminPageHead
        category="Marketing"
        title={
          <>
            Search & <em>AI</em>.
          </>
        }
        subtitle="Self-audit your site for SEO, AEO, GEO, and CRO readiness."
      />

      <div className="admin-content">
        <KpiGrid columns={4}>
          <KpiCard
            label="Overall Score"
            value={`${avgScore}/100`}
            subtitle="Average across 6 dimensions"
            variant={avgScore >= 70 ? 'ok-hl' : avgScore >= 40 ? 'warn-hl' : 'hl'}
          />
          <KpiCard
            label="Pages Crawled"
            value={audit.totalPages.toString()}
            subtitle={audit.siteUrl}
          />
          <KpiCard
            label="Critical Issues"
            value={criticalIssues.toString()}
            subtitle="Must fix"
            variant={criticalIssues > 0 ? 'warn-hl' : 'ok-hl'}
          />
          <KpiCard
            label="Warnings"
            value={warnings.toString()}
            subtitle="Should fix"
          />
        </KpiGrid>

        <SearchAIClient audit={audit} />
      </div>
    </>
  )
}
