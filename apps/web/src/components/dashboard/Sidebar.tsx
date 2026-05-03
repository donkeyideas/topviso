'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useApp } from '@/hooks/useApp'
import { useState, useEffect, useRef } from 'react'
import { ThemeToggle } from './ThemeToggle'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

interface SidebarProps {
  appSlug?: string
  appName?: string
  appIcon?: string
  appIconUrl?: string
  userName?: string
  userInitials?: string
  userRole?: string
}

interface NavItem {
  label: string
  href: string
  count?: string
  isNew?: boolean
}

interface OrgApp {
  id: string
  name: string
  platform: string
  icon_url: string | null
}

export function Sidebar({
  appSlug,
  appName,
  appIcon,
  appIconUrl,
  userName = '',
  userInitials = '',
  userRole = '',
}: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  // Read slug from URL so sidebar always reflects the app being viewed
  const urlAppSlug = pathname.match(/^\/app\/([^/]+)/)?.[1]
  const effectiveSlug = urlAppSlug ?? appSlug

  // Fetch the actual app data for the URL slug so name/icon stay in sync
  const { app: urlApp } = useApp(urlAppSlug ?? null)
  const displayName = urlApp?.name ?? appName
  const displayIconUrl = urlApp?.icon_url ?? appIconUrl
  const displayIcon = urlApp?.name?.charAt(0)?.toUpperCase() ?? appIcon ?? appName?.charAt(0) ?? 'A'
  const base = effectiveSlug ? `/app/${effectiveSlug}` : ''

  // Plan tier
  const [planTier, setPlanTier] = useState<string | null>(null)

  // App switcher dropdown state
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [orgApps, setOrgApps] = useState<OrgApp[]>([])
  const switcherRef = useRef<HTMLDivElement>(null)

  // Fetch plan tier
  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('default_organization_id').eq('id', user.id).single()
        .then(({ data: profile }) => {
          if (!profile?.default_organization_id) return
          supabase.from('organizations').select('plan_tier').eq('id', profile.default_organization_id).single()
            .then(({ data: org }) => { if (org?.plan_tier) setPlanTier(org.plan_tier) })
        })
    })
  }, [])

  // Fetch org apps when dropdown opens
  useEffect(() => {
    if (!switcherOpen || orgApps.length > 0) return
    const fetchId = effectiveSlug ?? appSlug
    if (!fetchId) return
    fetch(`/api/app-data?appId=${encodeURIComponent(fetchId)}&include=siblings`)
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.orgApps) setOrgApps(json.orgApps)
      })
      .catch(err => console.error('[sidebar] Failed to fetch org apps:', err))
  }, [switcherOpen, effectiveSlug, appSlug, orgApps.length])

  // Close dropdown on outside click
  useEffect(() => {
    if (!switcherOpen) return
    function handleClick(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [switcherOpen])

  const coreNav: NavItem[] = [
    { label: 'Overview', href: `${base}/overview-2` },
    { label: 'Optimizer', href: `${base}/optimizer` },
    { label: 'Keywords', href: `${base}/keywords` },
    { label: 'Visibility', href: `${base}/visibility` },
    { label: 'Competitors', href: `${base}/competitors` },
    { label: 'Recommendations', href: `${base}/recommendations` },
    { label: 'Reviews', href: `${base}/reviews` },
    { label: 'Store Intel', href: `${base}/store-intel` },
    { label: 'Discovery Map', href: `${base}/discovery-map` },
    { label: 'Localization', href: `${base}/localization` },
    { label: 'Strategy', href: `${base}/strategy` },
    { label: 'Update Impact', href: `${base}/update-impact` },
  ]

  const discoveryNav: NavItem[] = [
    { label: 'LLM Tracker', href: `${base}/llm-tracker` },
    { label: 'Intent Map', href: `${base}/intent-map` },
    { label: 'Ad Intel', href: `${base}/ad-intel` },
    { label: 'Market Intel', href: `${base}/market-intel` },
  ]

  const conversionNav: NavItem[] = [
    { label: 'Creative Lab', href: `${base}/creative-lab` },
    { label: 'Feature Image', href: `${base}/feature-image-score` },
    { label: 'Keyword Audiences', href: `${base}/cpps` },
  ]

  const measureNav: NavItem[] = [
    { label: 'Growth Insights', href: `${base}/attribution` },
    { label: 'Reviews+', href: `${base}/reviews-plus` },
    { label: 'Agent Ready', href: `${base}/agent-ready` },
  ]

  const systemNav: NavItem[] = [
    { label: 'API & Data', href: `${base}/api-data` },
    { label: 'Pricing', href: '/pricing-page' },
    { label: 'Settings', href: '/settings' },
  ]

  function renderGroup(label: string, items: NavItem[]) {
    return (
      <div className="nav-group">
        <div className="nav-label">{label}</div>
        <ul className="nav-list">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`nav-item${isActive ? ' active' : ''}`}
                >
                  <span>{item.label}</span>
                  {item.count && <span className="nav-count">{item.count}</span>}
                  {item.isNew && <span className="nav-new">NEW</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  async function handleLogout() {
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push('/signin')
  }

  async function handleSwitchToFocused() {
    const supabase = getSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ dashboard_mode: 'focused' }).eq('id', user.id)
    const v1ToV2: Record<string, string> = {
      'overview-2': 'overview', 'llm-tracker': 'llm-discovery', 'attribution': 'growth',
      'visibility': 'overview', 'recommendations': 'overview', 'store-intel': 'overview',
      'discovery-map': 'llm-discovery', 'strategy': 'overview', 'update-impact': 'overview',
      'intent-map': 'keywords', 'ad-intel': 'overview', 'market-intel': 'competitors',
      'cpps': 'keywords', 'reviews-plus': 'reviews', 'agent-ready': 'overview', 'api-data': 'overview',
    }
    const subPage = pathname.match(/^\/app\/[^/]+\/(.+)/)?.[1] ?? 'overview'
    const page = v1ToV2[subPage] ?? subPage
    if (effectiveSlug) {
      router.push(`/focused/app/${effectiveSlug}/${page}`)
    } else {
      router.push('/focused')
    }
  }

  function handleAppSwitch(appId: string) {
    setSwitcherOpen(false)
    // Navigate to the same sub-page for the new app, or default to overview
    const currentSubPage = pathname.match(/^\/app\/[^/]+\/(.+)/)?.[1] ?? 'overview-2'
    router.push(`/app/${appId}/${currentSubPage}`)
  }

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="brand-block">
        <div className="brand-dash">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div style={{ width: 28, height: 28, borderRadius: 7, background: '#fff', border: '1px solid var(--color-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src="/logo.png" alt="Top Viso" width={18} height={18} style={{ objectFit: 'contain' }} />
          </div>
          <div className="brand-name-sm">Top Viso</div>
        </div>
        {planTier && (
          <div style={{
            marginTop: 4,
            fontSize: 9,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: planTier === 'solo' ? 'var(--color-ink-3)' : 'var(--color-accent)',
          }}>
            {planTier === 'solo' ? 'FREE' : planTier === 'team' ? 'TEAM' : 'ENTERPRISE'}
          </div>
        )}
      </div>

      {/* App picker with dropdown */}
      {effectiveSlug && (
        <div ref={switcherRef} style={{ position: 'relative' }}>
          <div className="app-picker-card" onClick={() => setSwitcherOpen(!switcherOpen)} style={{ cursor: 'pointer' }}>
            <div className="app-picker-top">
              {displayIconUrl ? (
                <img src={displayIconUrl} alt="" referrerPolicy="no-referrer" crossOrigin="anonymous" style={{ width: 30, height: 30, borderRadius: 7, flexShrink: 0, objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.removeAttribute('hidden') }} />
              ) : null}
              <div className="app-icon-sm" {...(displayIconUrl ? { hidden: true } : {})}>{displayIcon}</div>
              <div className="app-picker-meta">
                <strong>{displayName ?? 'Select app'}</strong>
                <small>{urlApp?.platform === 'ios' ? 'iOS' : urlApp?.platform === 'android' ? 'ANDROID' : 'iOS + ANDROID'}</small>
              </div>
            </div>
            <div className="app-picker-foot">
              <span>{orgApps.length > 0 ? `${orgApps.length} APPS` : '1 APP'}</span>
              <span>SWITCH {switcherOpen ? '↑' : '↓'}</span>
            </div>
          </div>

          {switcherOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 100,
              background: 'var(--color-paper)',
              border: '1px solid var(--color-line)',
              borderRadius: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              maxHeight: 320,
              overflowY: 'auto',
              marginTop: 4,
            }}>
              {orgApps.length === 0 ? (
                <div style={{ padding: '12px 14px', color: 'var(--color-ink-3)', fontSize: 12 }}>Loading...</div>
              ) : (
                orgApps.map((a) => {
                  const isCurrent = a.id === effectiveSlug
                  return (
                    <div
                      key={a.id}
                      onClick={() => handleAppSwitch(a.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 14px',
                        cursor: 'pointer',
                        background: isCurrent ? 'var(--color-accent-wash)' : 'transparent',
                        borderBottom: '1px solid var(--color-line-soft, var(--color-line))',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.background = 'var(--color-paper-2)' }}
                      onMouseLeave={(e) => { if (!isCurrent) e.currentTarget.style.background = 'transparent' }}
                    >
                      {a.icon_url ? (
                        <img src={a.icon_url} alt="" referrerPolicy="no-referrer" crossOrigin="anonymous" style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.removeAttribute('hidden') }} />
                      ) : null}
                      <div className="app-icon-sm" style={{ width: 28, height: 28, fontSize: 12, lineHeight: '28px', borderRadius: 6, flexShrink: 0 }} {...(a.icon_url ? { hidden: true } : {})}>{a.name.charAt(0).toUpperCase()}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: isCurrent ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-ink-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{a.platform}</div>
                      </div>
                      {isCurrent && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-accent)', letterSpacing: '0.06em' }}>ACTIVE</span>}
                    </div>
                  )
                })
              )}
              <Link
                href="/app"
                onClick={() => setSwitcherOpen(false)}
                style={{
                  display: 'block',
                  padding: '10px 14px',
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-accent)',
                  textDecoration: 'none',
                  letterSpacing: '0.06em',
                  textAlign: 'center',
                }}
              >
                MANAGE APPS →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Navigation groups -- only show per-app tabs if we have an app */}
      {effectiveSlug && renderGroup('Core', coreNav)}
      {renderGroup('Discovery', discoveryNav)}
      {renderGroup('Conversion', conversionNav)}
      {renderGroup('Measure', measureNav)}
      {renderGroup('System', systemNav)}

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ padding: '4px 22px', marginBottom: 4 }}>
          <button onClick={handleSwitchToFocused} style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', letterSpacing: '0.06em', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>TRY FOCUSED &rarr;</button>
        </div>
        <div className="sys-pill">
          <span className="dot-live" />
          ALL SYSTEMS LIVE
        </div>
        <div className="sys-pill" style={{ justifyContent: 'space-between' }}>
          <span>240 POLLS / HR · US-EAST</span>
          <ThemeToggle />
        </div>
        <div className="sidebar-user">
          <div className="user-avatar">{userInitials || 'U'}</div>
          <div className="user-meta">
            <strong>{userName || 'User'}</strong>
            <small>{userRole || 'MEMBER'}</small>
          </div>
          <button onClick={handleLogout} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-ink-3)', letterSpacing: '0.06em' }}>LOGOUT</button>
        </div>
      </div>
    </aside>
  )
}
