'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const ranges = ['7D', '30D', '90D', 'QTD', 'YTD'] as const

const pageTitles: Record<string, string> = {
  '/admin': 'Executive Overview',
  '/admin/revenue': 'Revenue & Forecast',
  '/admin/unit-economics': 'Unit Economics',
  '/admin/cohort-retention': 'Cohort Retention',
  '/admin/funnel-analytics': 'Funnel Analytics',
  '/admin/channel-performance': 'Channel Performance',
  '/admin/accounts': 'Accounts',
  '/admin/feature-adoption': 'Feature Adoption',
  '/admin/usage-engagement': 'Usage & Engagement',
  '/admin/financials': 'Financials & P&L',
  '/admin/churn-retention': 'Churn & Retention',
  '/admin/infrastructure': 'Infrastructure & SLOs',
  '/admin/incidents': 'Incidents',
  '/admin/audit-log': 'Audit Log',
  '/admin/content': 'Content Manager',
  '/admin/feature-flags': 'Feature Flags',
  '/admin/settings': 'Settings',
  '/admin/health': 'System Health',
  '/admin/users': 'Users',
  '/admin/organizations': 'Organizations',
  '/admin/apps': 'Apps',
  '/admin/subscriptions': 'Subscriptions',
  '/admin/api-keys': 'API Keys',
}

interface AdminTopBarProps {
  onSearchClick?: () => void
}

export function AdminTopBar({ onSearchClick }: AdminTopBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentRange = searchParams.get('range') ?? '7D'

  const pageTitle = pageTitles[pathname] ?? 'Admin'

  const setRange = useCallback(
    (range: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('range', range)
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  return (
    <div className="topbar">
      <div className="tb-crumb">
        Admin <span style={{ color: 'var(--color-ink-4)' }}>/</span>{' '}
        <span className="now">{pageTitle}</span>
      </div>

      <div className="tb-mid">
        <div className="tb-search" onClick={onSearchClick} role="button" tabIndex={0}>
          <span style={{ color: 'var(--color-ink-4)' }}>⌕</span>
          <span className="placeholder">Search accounts, users, events…</span>
          <span className="kbd">⌘K</span>
        </div>
      </div>

      <div className="tb-right">
        <div className="tb-range">
          {ranges.map((r) => (
            <button
              key={r}
              className={currentRange === r ? 'on' : ''}
              onClick={() => setRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
        <button className="tb-ctl">EXPORT ↓</button>
        <div className="tb-live">
          <span className="dot" />
          LIVE
        </div>
      </div>
    </div>
  )
}
