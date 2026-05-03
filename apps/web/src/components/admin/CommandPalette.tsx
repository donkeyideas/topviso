'use client'

import { Command } from 'cmdk'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const adminPages = [
  { label: 'Executive Overview', href: '/admin' },
  { label: 'Revenue & Forecast', href: '/admin/revenue' },
  { label: 'Unit Economics', href: '/admin/unit-economics' },
  { label: 'Cohort Retention', href: '/admin/cohort-retention' },
  { label: 'Funnel Analytics', href: '/admin/funnel-analytics' },
  { label: 'Channel Performance', href: '/admin/channel-performance' },
  { label: 'Accounts', href: '/admin/accounts' },
  { label: 'Feature Adoption', href: '/admin/feature-adoption' },
  { label: 'Usage & Engagement', href: '/admin/usage-engagement' },
  { label: 'Financials & P&L', href: '/admin/financials' },
  { label: 'Churn & Retention', href: '/admin/churn-retention' },
  { label: 'Infrastructure & SLOs', href: '/admin/infrastructure' },
  { label: 'Incidents', href: '/admin/incidents' },
  { label: 'Audit Log', href: '/admin/audit-log' },
  { label: 'Content Manager', href: '/admin/content' },
  { label: 'Feature Flags', href: '/admin/feature-flags' },
  { label: 'Settings', href: '/admin/settings' },
  { label: 'Users', href: '/admin/users' },
  { label: 'Organizations', href: '/admin/organizations' },
  { label: 'Apps', href: '/admin/apps' },
  { label: 'Subscriptions', href: '/admin/subscriptions' },
  { label: 'API Keys', href: '/admin/api-keys' },
  { label: 'System Health', href: '/admin/health' },
]

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!open) setSearch('')
  }, [open])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '20vh',
        background: 'rgba(14,14,12,0.4)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          background: '#fff',
          borderRadius: 8,
          border: '1px solid var(--color-line)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Command shouldFilter>
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder="Search pages, accounts, actions…"
            style={{
              width: '100%',
              padding: '14px 18px',
              border: 'none',
              borderBottom: '1px solid var(--color-line)',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              outline: 'none',
              background: 'transparent',
            }}
          />
          <Command.List
            style={{
              maxHeight: 320,
              overflowY: 'auto',
              padding: '6px',
            }}
          >
            <Command.Empty
              style={{
                padding: '20px',
                textAlign: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--color-ink-3)',
              }}
            >
              No results found.
            </Command.Empty>
            <Command.Group
              heading="Pages"
              style={{
                padding: '4px 0',
              }}
            >
              {adminPages.map((page) => (
                <Command.Item
                  key={page.href}
                  value={page.label}
                  onSelect={() => {
                    router.push(page.href)
                    onClose()
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>{page.label}</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      color: 'var(--color-ink-4)',
                    }}
                  >
                    {page.href}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  )
}
