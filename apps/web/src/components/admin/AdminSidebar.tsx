'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  label: string
  href: string
  badge?: { text: string; type: 'count' | 'new' | 'hot' }
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Business',
    items: [
      { label: 'Executive Overview', href: '/admin' },
      { label: 'Revenue & Forecast', href: '/admin/revenue' },
      { label: 'Unit Economics', href: '/admin/unit-economics' },
      { label: 'Cohort Retention', href: '/admin/cohort-retention', badge: { text: 'NEW', type: 'new' } },
    ],
  },
  {
    label: 'Acquisition',
    items: [
      { label: 'Funnel Analytics', href: '/admin/funnel-analytics' },
      { label: 'Channel Performance', href: '/admin/channel-performance' },
    ],
  },
  {
    label: 'Customers',
    items: [
      { label: 'Accounts', href: '/admin/accounts' },
      { label: 'Customer 360\u00B0', href: '/admin/accounts/360', badge: { text: 'DEEP', type: 'new' } },
    ],
  },
  {
    label: 'Product',
    items: [
      { label: 'Feature Adoption', href: '/admin/feature-adoption' },
      { label: 'Usage & Engagement', href: '/admin/usage-engagement' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { label: 'Blog & Guides', href: '/admin/blog' },
      { label: 'Social Posts', href: '/admin/social-posts' },
      { label: 'Email Templates', href: '/admin/email-templates' },
      { label: 'Search & AI', href: '/admin/search-ai' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Financials & P&L', href: '/admin/financials' },
      { label: 'Pricing', href: '/admin/pricing' },
      { label: 'Churn & Retention', href: '/admin/churn-retention', badge: { text: 'HOT', type: 'hot' } },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Infrastructure & SLOs', href: '/admin/infrastructure' },
      { label: 'Incidents', href: '/admin/incidents' },
      { label: 'API Management', href: '/admin/api-management' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Audit Log', href: '/admin/audit-log' },
      { label: 'Content Manager', href: '/admin/content' },
      { label: 'Settings', href: '/admin/settings' },
    ],
  },
]

interface AdminSidebarProps {
  userName: string
  userInitials: string
}

export function AdminSidebar({ userName, userInitials }: AdminSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <div style={{ width: 26, height: 26, borderRadius: 6, background: '#fff', border: '1px solid var(--color-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <img src="/logo.png" alt="Top Viso" width={16} height={16} style={{ objectFit: 'contain' }} />
        </div>
        <div className="sb-brand-name">Top Viso</div>
        <div className="sb-brand-tag">ADMIN</div>
      </div>

      <div className="sb-env">
        <div className="sb-env-pill">
          <div>
            <div className="lbl">ENVIRONMENT</div>
            <div className="val">Production</div>
          </div>
          <div className="dot" />
        </div>
      </div>

      <nav className="sb-nav">
        {navGroups.map((group) => (
          <div key={group.label} className="sb-group">
            <div className="sb-group-label">{group.label}</div>
            <ul>
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={isActive(item.href) ? 'active' : ''}
                  >
                    {item.label}
                    {item.badge && (
                      <span
                        className={
                          item.badge.type === 'count'
                            ? 'ct'
                            : item.badge.type === 'hot'
                              ? 'badge-hot'
                              : 'badge-new'
                        }
                      >
                        {item.badge.text}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="sb-footer">
        <div className="sb-avatar">{userInitials}</div>
        <div className="sb-user-meta">
          <strong>{userName}</strong>
          <small>SUPERUSER</small>
        </div>
      </div>

      <div style={{ padding: '0 18px 14px' }}>
        <Link
          href="/app"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--color-ink-3)',
            letterSpacing: '0.06em',
          }}
        >
          ← Back to App
        </Link>
      </div>
    </aside>
  )
}
