'use client'

import { useState } from 'react'
import { AdminCard } from '@/components/admin/AdminCard'
import { SectionHead } from '@/components/admin/SectionHead'
import { RadarScoreChart } from '@/components/admin/charts/RadarScoreChart'
import type { SelfAuditResult, AuditIssue } from '@/lib/crawl/self-audit'

const TABS = ['OVERVIEW', 'PAGES', 'ISSUES', 'RECOMMENDATIONS'] as const
type Tab = (typeof TABS)[number]

const SCORE_COLORS: Record<string, string> = {
  SEO: '#27ae60',
  Technical: '#2980b9',
  Content: '#8e44ad',
  AEO: '#d35400',
  GEO: '#16a085',
  CRO: '#c0392b',
}

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 0',
  fontSize: 12,
  borderTop: '1px solid var(--color-line)',
} as const

interface Props {
  audit: SelfAuditResult
}

function ScoreGauge({
  label,
  score,
  color,
}: {
  label: string
  score: number
  color: string
}) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={90} height={90} viewBox="0 0 90 90">
        {/* Background circle */}
        <circle
          cx={45}
          cy={45}
          r={radius}
          fill="none"
          stroke="var(--color-line, #e5e5e0)"
          strokeWidth={6}
        />
        {/* Score arc */}
        <circle
          cx={45}
          cy={45}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 45 45)"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        {/* Score text */}
        <text
          x={45}
          y={45}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontSize: 18,
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            fill: 'var(--color-ink)',
          }}
        >
          {score}
        </text>
      </svg>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.08em',
          color: color,
          fontWeight: 600,
          marginTop: 4,
        }}
      >
        {label.toUpperCase()}
      </div>
    </div>
  )
}

function severityColor(severity: string): string {
  if (severity === 'critical') return 'var(--color-error, #cb2431)'
  if (severity === 'warning') return '#d4a017'
  return 'var(--color-accent, #2980b9)'
}

export function SearchAIClient({ audit }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('OVERVIEW')
  const [issueFilter, setIssueFilter] = useState<string>('all')

  const scores = [
    { subject: 'SEO', score: audit.seoScore },
    { subject: 'Technical', score: audit.technicalScore },
    { subject: 'Content', score: audit.contentScore },
    { subject: 'AEO', score: audit.aeoScore },
    { subject: 'GEO', score: audit.geoScore },
    { subject: 'CRO', score: audit.croScore },
  ]

  const criticalIssues = audit.issues.filter((i) => i.severity === 'critical')
  const warningIssues = audit.issues.filter((i) => i.severity === 'warning')
  const infoIssues = audit.issues.filter((i) => i.severity === 'info')

  const filteredIssues =
    issueFilter === 'all'
      ? audit.issues
      : audit.issues.filter((i) => i.category === issueFilter)

  return (
    <>
      {/* Tab Chips */}
      <div className="admin-chip-row" style={{ marginBottom: 20 }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`admin-chip${activeTab === tab ? ' on' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW TAB ═══ */}
      {activeTab === 'OVERVIEW' && (
        <>
          <SectionHead number="01" title="Score Dimensions" />
          <AdminCard
            title={
              <>
                Site <em>scores</em>
              </>
            }
            tag={`${audit.totalPages} PAGES`}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: 12,
                padding: '20px 0',
              }}
            >
              {scores.map((s) => (
                <ScoreGauge
                  key={s.subject}
                  label={s.subject}
                  score={s.score}
                  color={SCORE_COLORS[s.subject] ?? '#333'}
                />
              ))}
            </div>
          </AdminCard>

          <SectionHead number="02" title="Radar Overview" />
          <AdminCard
            title={
              <>
                Dimension <em>radar</em>
              </>
            }
            tag="6 AXES"
          >
            <RadarScoreChart data={scores} />
          </AdminCard>

          <SectionHead number="03" title="Health Summary" />
          <AdminCard
            title={
              <>
                Audit <em>health</em>
              </>
            }
            tag={audit.crawledAt.split('T')[0] ?? ''}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
              }}
            >
              <div style={{ ...rowStyle, borderTop: 'none' }}>
                <span style={{ color: 'var(--color-ink-3)' }}>
                  Pages Crawled
                </span>
                <span
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
                >
                  {audit.totalPages}
                </span>
              </div>
              <div style={rowStyle}>
                <span style={{ color: 'var(--color-ink-3)' }}>
                  Critical Issues
                </span>
                <span
                  className="admin-pill error"
                  style={{
                    background:
                      criticalIssues.length > 0
                        ? 'var(--color-error, #cb2431)'
                        : undefined,
                    color: criticalIssues.length > 0 ? '#fff' : undefined,
                  }}
                >
                  {criticalIssues.length}
                </span>
              </div>
              <div style={rowStyle}>
                <span style={{ color: 'var(--color-ink-3)' }}>Warnings</span>
                <span className="admin-pill draft">
                  {warningIssues.length}
                </span>
              </div>
              <div style={rowStyle}>
                <span style={{ color: 'var(--color-ink-3)' }}>Info</span>
                <span className="admin-pill draft">
                  {infoIssues.length}
                </span>
              </div>
            </div>

            {/* Quick Wins */}
            {criticalIssues.length > 0 && (
              <div
                style={{
                  borderTop: '1px solid var(--color-line)',
                  paddingTop: 12,
                  marginTop: 8,
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    letterSpacing: '0.1em',
                    color: 'var(--color-ink-3)',
                    marginBottom: 8,
                  }}
                >
                  QUICK WINS
                </div>
                {criticalIssues.slice(0, 3).map((issue, idx) => (
                  <div
                    key={idx}
                    style={{
                      fontSize: 12,
                      padding: '4px 0',
                      display: 'flex',
                      gap: 8,
                      alignItems: 'baseline',
                    }}
                  >
                    <span
                      style={{
                        color: severityColor(issue.severity),
                        fontWeight: 700,
                        fontSize: 10,
                      }}
                    >
                      CRITICAL
                    </span>
                    <span>
                      {issue.title}
                      {issue.affectedUrl && (
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            color: 'var(--color-ink-3)',
                            marginLeft: 4,
                          }}
                        >
                          ({issue.affectedUrl})
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </AdminCard>
        </>
      )}

      {/* ═══ PAGES TAB ═══ */}
      {activeTab === 'PAGES' && (
        <>
          <SectionHead number="01" title="Crawled Pages" />
          {audit.pages.length === 0 ? (
            <AdminCard title="Pages" tag="0">
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-display)',
                  fontSize: 20,
                  letterSpacing: '-0.02em',
                }}
              >
                No pages crawled
              </div>
            </AdminCard>
          ) : (
            <AdminCard title="Page Details" tag={`${audit.pages.length} PAGES`}>
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', fontSize: 10, padding: '8px 6px' }}>Path</th>
                      <th style={{ textAlign: 'center', fontSize: 10, padding: '8px 6px' }}>Status</th>
                      <th style={{ textAlign: 'center', fontSize: 10, padding: '8px 6px' }}>Title Len</th>
                      <th style={{ textAlign: 'center', fontSize: 10, padding: '8px 6px' }}>Desc Len</th>
                      <th style={{ textAlign: 'center', fontSize: 10, padding: '8px 6px' }}>Words</th>
                      <th style={{ textAlign: 'center', fontSize: 10, padding: '8px 6px' }}>Load (ms)</th>
                      <th style={{ textAlign: 'center', fontSize: 10, padding: '8px 6px' }}>Schema</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audit.pages.map((page) => (
                      <tr key={page.path}>
                        <td
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            padding: '6px',
                          }}
                        >
                          {page.path}
                        </td>
                        <td style={{ textAlign: 'center', padding: '6px' }}>
                          <span
                            className={`admin-pill ${page.statusCode === 200 ? 'ok' : 'error'}`}
                            style={{ fontSize: 9 }}
                          >
                            {page.statusCode}
                          </span>
                        </td>
                        <td
                          style={{
                            textAlign: 'center',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            padding: '6px',
                            color:
                              page.titleLength >= 30 && page.titleLength <= 60
                                ? 'var(--color-ok, #22863a)'
                                : 'var(--color-error, #cb2431)',
                          }}
                        >
                          {page.titleLength}
                        </td>
                        <td
                          style={{
                            textAlign: 'center',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            padding: '6px',
                            color:
                              page.descriptionLength >= 70 &&
                              page.descriptionLength <= 160
                                ? 'var(--color-ok, #22863a)'
                                : 'var(--color-error, #cb2431)',
                          }}
                        >
                          {page.descriptionLength}
                        </td>
                        <td
                          style={{
                            textAlign: 'center',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            padding: '6px',
                          }}
                        >
                          {page.wordCount}
                        </td>
                        <td
                          style={{
                            textAlign: 'center',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            padding: '6px',
                            color:
                              page.loadTimeMs < 3000
                                ? 'var(--color-ok, #22863a)'
                                : 'var(--color-error, #cb2431)',
                          }}
                        >
                          {page.loadTimeMs}
                        </td>
                        <td style={{ textAlign: 'center', padding: '6px' }}>
                          <span
                            className={`admin-pill ${page.hasSchema ? 'ok' : 'draft'}`}
                            style={{ fontSize: 9 }}
                          >
                            {page.hasSchema ? 'YES' : 'NO'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AdminCard>
          )}
        </>
      )}

      {/* ═══ ISSUES TAB ═══ */}
      {activeTab === 'ISSUES' && (
        <>
          <SectionHead number="01" title="All Issues" />
          {/* Category filter */}
          <div
            style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}
          >
            {['all', 'seo', 'technical', 'content', 'aeo', 'geo', 'cro'].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setIssueFilter(cat)}
                  className={`admin-pill ${issueFilter === cat ? 'ok' : 'draft'}`}
                  style={{ cursor: 'pointer', border: 'none', fontSize: 9 }}
                >
                  {cat.toUpperCase()}
                </button>
              ),
            )}
          </div>

          {filteredIssues.length === 0 ? (
            <AdminCard title="Issues" tag="NONE">
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-display)',
                  fontSize: 20,
                  letterSpacing: '-0.02em',
                }}
              >
                No issues found
              </div>
            </AdminCard>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {filteredIssues.map((issue: AuditIssue, idx: number) => (
                <AdminCard
                  key={idx}
                  title={issue.title}
                  tag={issue.category.toUpperCase()}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0,
                    }}
                  >
                    <div style={{ ...rowStyle, borderTop: 'none' }}>
                      <span style={{ color: 'var(--color-ink-3)' }}>
                        Severity
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          fontWeight: 700,
                          color: severityColor(issue.severity),
                          letterSpacing: '0.08em',
                        }}
                      >
                        {issue.severity.toUpperCase()}
                      </span>
                    </div>
                    <div style={rowStyle}>
                      <span style={{ color: 'var(--color-ink-3)' }}>
                        Description
                      </span>
                      <span style={{ fontSize: 11 }}>
                        {issue.description}
                      </span>
                    </div>
                    {issue.affectedUrl && (
                      <div style={rowStyle}>
                        <span style={{ color: 'var(--color-ink-3)' }}>
                          URL
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                          }}
                        >
                          {issue.affectedUrl}
                        </span>
                      </div>
                    )}
                    {issue.recommendation && (
                      <div style={rowStyle}>
                        <span style={{ color: 'var(--color-ink-3)' }}>
                          Fix
                        </span>
                        <span style={{ fontSize: 11 }}>
                          {issue.recommendation}
                        </span>
                      </div>
                    )}
                  </div>
                </AdminCard>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══ RECOMMENDATIONS TAB ═══ */}
      {activeTab === 'RECOMMENDATIONS' && (
        <>
          <SectionHead number="01" title="Top Recommendations" />
          {audit.issues.length === 0 ? (
            <AdminCard title="Recommendations" tag="NONE">
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-display)',
                  fontSize: 20,
                  letterSpacing: '-0.02em',
                }}
              >
                Your site looks great — no recommendations at this time.
              </div>
            </AdminCard>
          ) : (
            <>
              {/* Group by category and show top recommendation per category */}
              {['seo', 'technical', 'content', 'aeo', 'geo', 'cro'].map(
                (cat) => {
                  const catIssues = audit.issues.filter(
                    (i) => i.category === cat,
                  )
                  if (catIssues.length === 0) return null

                  const critical = catIssues.filter(
                    (i) => i.severity === 'critical',
                  )
                  const warnings = catIssues.filter(
                    (i) => i.severity === 'warning',
                  )
                  const topIssues = [
                    ...critical.slice(0, 2),
                    ...warnings.slice(0, 2),
                  ].slice(0, 3)

                  return (
                    <AdminCard
                      key={cat}
                      title={cat.toUpperCase()}
                      tag={`${catIssues.length} ISSUES`}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0,
                        }}
                      >
                        {topIssues.map((issue, idx) => (
                          <div
                            key={idx}
                            style={{
                              ...rowStyle,
                              borderTop:
                                idx === 0
                                  ? 'none'
                                  : '1px solid var(--color-line)',
                            }}
                          >
                            <div>
                              <span
                                style={{
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: 9,
                                  fontWeight: 700,
                                  color: severityColor(issue.severity),
                                  letterSpacing: '0.08em',
                                  marginRight: 8,
                                }}
                              >
                                {issue.severity.toUpperCase()}
                              </span>
                              <span style={{ fontSize: 12 }}>
                                {issue.title}
                              </span>
                            </div>
                            {issue.recommendation && (
                              <span
                                style={{
                                  fontSize: 11,
                                  color: 'var(--color-ink-3)',
                                  maxWidth: 300,
                                  textAlign: 'right',
                                }}
                              >
                                {issue.recommendation}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </AdminCard>
                  )
                },
              )}
            </>
          )}
        </>
      )}
    </>
  )
}
