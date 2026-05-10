'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { BillingModal } from '@/components/billing/BillingModal'
import { useGenerateContext } from '@/contexts/GenerateContext'

interface App {
  id: string
  name: string
  platform: 'ios' | 'android'
  store_id: string
  icon_url: string | null
  category: string | null
  created_at: string
}

interface OverviewAppData {
  asoScore?: number | null
  storeRating?: number | null
  storeRatings?: number | null
  storeInstalls?: string | null
  storeReviewCount?: number | null
}

type AppAnalysisData = {
  keywords?: unknown
  competitors?: unknown
  visibility?: unknown
  overview?: unknown
  'reviews-analysis'?: unknown
}

const iconColors = ['ai-1', 'ai-2', 'ai-3', 'ai-4', 'ai-5', 'ai-6']

function fmtNum(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

export default function AppPickerPage() {
  const router = useRouter()
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [appLimit, setAppLimit] = useState<number>(1)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null)
  const [perAppAnalysis, setPerAppAnalysis] = useState<Record<string, AppAnalysisData>>({})
  const [syncing, setSyncing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'ios' | 'android'>('all')
  const { startGeneration, endGeneration } = useGenerateContext()
  const [showBilling, setShowBilling] = useState(false)

  async function fetchAnalysis(appList: App[]) {
    if (appList.length === 0) return
    const types = ['keywords', 'competitors', 'visibility', 'overview', 'reviews-analysis']
    const promises = appList.map((a) =>
      fetch(`/api/analysis?appId=${encodeURIComponent(a.id)}&types=${types.join(',')}`)
        .then(r => r.ok ? r.json() : { data: [] })
    )
    const results = await Promise.all(promises)
    const aMap: Record<string, AppAnalysisData> = {}
    for (let i = 0; i < appList.length; i++) {
      const id = appList[i]!.id
      const rows = results[i]?.data ?? []
      if (!aMap[id]) aMap[id] = {}
      for (const r of rows) {
        const row = r as { analysis_type: string; result: unknown }
        ;(aMap[id] as Record<string, unknown>)[row.analysis_type] = row.result
      }
    }
    setPerAppAnalysis(aMap)
  }

  const syncAllApps = useCallback(async () => {
    if (apps.length === 0) return
    setSyncing(true)
    startGeneration('sync')

    const errors: string[] = []
    await Promise.all(apps.map(async (a) => {
      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sync', appId: a.id }),
        })
        if (!res.ok) errors.push(a.name)
      } catch {
        errors.push(a.name)
      }
    }))

    await fetchAnalysis(apps)
    endGeneration(errors.length > 0 ? `Failed to sync: ${errors.join(', ')}` : null)
    setSyncing(false)
  }, [apps, startGeneration, endGeneration])

  async function confirmRemove() {
    if (!removeTarget) return
    setDeleting(removeTarget.id)
    setRemoveTarget(null)
    try {
      const res = await fetch(`/api/apps/${removeTarget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setApps((prev) => prev.filter((a) => a.id !== removeTarget.id))
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeleting(null)
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/app-data')
        if (!res.ok) { router.push('/signin'); return }
        const json = await res.json()
        const appList = json.apps ?? []
        const oid = json.organization_id ?? (appList.length > 0 ? appList[0].organization_id : null)
        if (oid) {
          setOrgId(oid)
          // Fetch app_limit for the org
          const supabase = getSupabaseBrowserClient()
          const { data: orgData } = await supabase
            .from('organizations')
            .select('app_limit')
            .eq('id', oid)
            .single()
          if (orgData?.app_limit) setAppLimit(orgData.app_limit)
        }
        setApps(appList)
        await fetchAnalysis(appList)
      } catch (err) {
        console.error('[AppPickerPage] Error loading apps:', err)
      }
      setLoading(false)
    }
    load()
  }, [router])

  const filteredApps = filter === 'all' ? apps : apps.filter(a => a.platform === filter)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--color-paper)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink-3)', letterSpacing: '0.08em', fontSize: 12 }}>
          LOADING...
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--color-paper)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-10 py-6"
        style={{ borderBottom: '1px solid var(--color-line)' }}
      >
        <div className="flex items-baseline gap-2.5">
          <div className="relative top-0.5 h-3 w-3 rounded-full" style={{ background: 'var(--color-ink)' }}>
            <div className="absolute left-[3px] top-[3px] h-1.5 w-1.5 rounded-full" style={{ background: 'var(--color-accent)' }} />
          </div>
          <span className="text-2xl leading-none" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>Top Viso</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/settings/profile" className="rounded-md px-4 py-2 text-xs font-medium" style={{ fontFamily: 'var(--font-mono)', border: '1px solid var(--color-line)', color: 'var(--color-ink-3)', letterSpacing: '0.06em' }}>Settings</Link>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="rounded-md px-4 py-2 text-xs font-medium" style={{ fontFamily: 'var(--font-mono)', border: '1px solid var(--color-line)', color: 'var(--color-ink-3)', letterSpacing: '0.06em' }}>Sign out</button>
          </form>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto', padding: '48px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '-0.025em', fontSize: 38, marginBottom: 6 }}>
              Your <em style={{ color: 'var(--color-accent)' }}>apps</em>
            </h1>
            <p style={{ color: 'var(--color-ink-3)', fontSize: 14 }}>
              {apps.length} app{apps.length !== 1 ? 's' : ''} tracked across iOS and Android.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn accent" onClick={syncAllApps} disabled={syncing} style={{ fontSize: 13 }}>
              {syncing ? 'Syncing all...' : 'Sync All Apps'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="chip-row" style={{ marginBottom: 24 }}>
          <span className={`chip${filter === 'all' ? ' on' : ''}`} onClick={() => setFilter('all')}>All</span>
          <span className={`chip${filter === 'ios' ? ' on' : ''}`} onClick={() => setFilter('ios')}>iOS</span>
          <span className={`chip${filter === 'android' ? ' on' : ''}`} onClick={() => setFilter('android')}>Android</span>
        </div>

        {apps.length === 0 ? (
          <div className="empty-state">
            <h2>No apps <em>yet</em></h2>
            <p>Add your first app to start tracking keywords, reviews, and visibility.</p>
            <AddAppButton orgId={orgId} appCount={apps.length} appLimit={appLimit} onAppAdded={(app) => setApps([app, ...apps])} onUpgrade={() => setShowBilling(true)} />
          </div>
        ) : (
          <>
            <div className="grid-3" style={{ marginBottom: 24 }}>
              {filteredApps.map((a, i) => {
                const pa = perAppAnalysis[a.id]
                const kwArr = pa?.keywords
                const kwCount = Array.isArray(kwArr) ? kwArr.length : null
                const compArr = pa?.competitors
                const compCount = Array.isArray(compArr) ? compArr.length : null
                const ovr = pa?.overview as OverviewAppData | undefined
                const vis = pa?.visibility as { overallScore?: number } | undefined
                const rev = pa?.['reviews-analysis'] as { averageRating?: number; realReviewCount?: number } | undefined
                const cardRating = ovr?.storeRating ?? rev?.averageRating ?? null
                const cardReviews = ovr?.storeRatings ?? ovr?.storeReviewCount ?? rev?.realReviewCount ?? null

                return (
                  <div key={a.id} className="app-card" style={{ position: 'relative' }}>
                    <Link href={`/app/${a.id}/overview-2`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                      <div className="app-card-top">
                        {a.icon_url ? (
                          <img src={a.icon_url} alt={a.name} referrerPolicy="no-referrer" crossOrigin="anonymous" style={{ width: 56, height: 56, borderRadius: 12 }} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.removeAttribute('hidden') }} />
                        ) : null}
                        <div className={`app-card-icon ${iconColors[i % iconColors.length] ?? 'ai-1'}`} {...(a.icon_url ? { hidden: true } : {})}>{a.name.charAt(0).toUpperCase()}</div>
                        <div className="app-card-meta">
                          <h4>{a.name}</h4>
                          <small>{[a.category?.toUpperCase(), a.platform.toUpperCase()].filter(Boolean).join(' · ')}</small>
                        </div>
                      </div>
                      <div className="app-card-stats">
                        <div className="acs"><div className="acs-label">Rating</div><div className="acs-val">{cardRating != null ? cardRating.toFixed(1) : '—'}</div></div>
                        <div className="acs"><div className="acs-label">Reviews</div><div className="acs-val">{fmtNum(cardReviews)}</div></div>
                        <div className="acs"><div className="acs-label">Downloads</div><div className="acs-val">{ovr?.storeInstalls ?? '—'}</div></div>
                        <div className="acs"><div className="acs-label">Keywords</div><div className="acs-val">{kwCount ?? '—'}</div></div>
                      </div>
                      <div className="app-card-footer">
                        <div>ASO <span className="score">{ovr?.asoScore != null ? Math.round(ovr.asoScore) : '—'}</span> · VIS <span className="score">{vis?.overallScore != null ? Math.round(vis.overallScore) : '—'}</span></div>
                        <div>{compCount != null ? `${compCount} COMPETITORS` : '— COMPETITORS'}</div>
                      </div>
                    </Link>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRemoveTarget({ id: a.id, name: a.name }) }}
                      disabled={deleting === a.id}
                      style={{
                        position: 'absolute', top: 12, right: 12,
                        padding: '6px', fontSize: 11, borderRadius: 4, lineHeight: 0,
                        border: '1px solid var(--color-line)', color: 'var(--color-ink-4)',
                        background: 'var(--color-card)', cursor: 'pointer', opacity: 0, transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-warn)'; e.currentTarget.style.color = 'var(--color-warn)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-line)'; e.currentTarget.style.color = 'var(--color-ink-4)' }}
                      className="app-card-remove"
                    >
                      {deleting === a.id ? '...' : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>}
                    </button>
                  </div>
                )
              })}
            </div>

            <AddAppButton orgId={orgId} appCount={apps.length} appLimit={appLimit} onAppAdded={(app) => { setApps([app, ...apps]); fetchAnalysis([app, ...apps]) }} onUpgrade={() => setShowBilling(true)} />
          </>
        )}
      </div>

      {/* Billing modal */}
      {showBilling && (
        <BillingModal
          onClose={() => setShowBilling(false)}
          onPlanChange={(newPlan) => {
            // Refresh app limit after plan change
            if (orgId) {
              const supabase = getSupabaseBrowserClient()
              supabase.from('organizations').select('app_limit').eq('id', orgId).single()
                .then(({ data }) => { if (data?.app_limit) setAppLimit(data.app_limit) })
            }
          }}
        />
      )}

      {/* Remove confirmation modal */}
      {removeTarget && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0, 0, 0, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'genFadeIn 0.2s ease-out' }}
          onClick={() => setRemoveTarget(null)}
        >
          <div
            style={{ background: 'var(--color-card)', borderRadius: 14, padding: '36px 40px', minWidth: 340, maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', animation: 'genSlideUp 0.25s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 22, letterSpacing: '-0.02em', marginBottom: 10 }}>
              Remove <em style={{ color: 'var(--color-warn)' }}>{removeTarget.name}</em>?
            </h3>
            <p style={{ fontSize: 14, color: 'var(--color-ink-2)', lineHeight: 1.5, marginBottom: 24 }}>
              This will permanently delete the app and all its analysis data. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setRemoveTarget(null)} className="btn ghost">Cancel</button>
              <button
                onClick={confirmRemove}
                style={{ padding: '9px 18px', background: 'var(--color-warn)', color: 'white', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AddAppButton({ orgId, onAppAdded, appCount, appLimit, onUpgrade }: { orgId: string | null; onAppAdded: (app: App) => void; appCount: number; appLimit: number; onUpgrade: () => void }) {
  const [showForm, setShowForm] = useState(false)
  const [storeUrl, setStoreUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!orgId) return
    setError(null)
    setLoading(true)
    try {
      const { platform, storeId, appName } = parseStoreUrl(storeUrl)
      const createRes = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_id: orgId, platform, store_id: storeId, name: appName }),
      })
      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({ error: 'Failed to create app' }))
        throw new Error(err.error || 'Failed to create app')
      }
      const { data: app } = await createRes.json()
      fetch(`/api/apps/${app.id}/enrich`, { method: 'POST' })
        .then(res => res.json())
        .then(({ data }) => { if (data) onAppAdded(data as App) })
        .catch(() => onAppAdded(app as App))
      setStoreUrl('')
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add app')
    } finally {
      setLoading(false)
    }
  }

  const atLimit = appCount >= appLimit

  if (!showForm) {
    return (
      <div>
        <button
          onClick={() => !atLimit && setShowForm(true)}
          disabled={atLimit}
          style={{
            width: '100%', padding: 16, textAlign: 'center', fontSize: 14, fontWeight: 600,
            border: `2px dashed ${atLimit ? 'var(--color-warn)' : 'var(--color-line)'}`,
            borderRadius: 8, color: atLimit ? 'var(--color-ink-3)' : 'var(--color-ink-3)',
            background: 'none', cursor: atLimit ? 'not-allowed' : 'pointer',
            opacity: atLimit ? 0.6 : 1, transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { if (!atLimit) { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent)' } }}
          onMouseLeave={(e) => { if (!atLimit) { e.currentTarget.style.borderColor = 'var(--color-line)'; e.currentTarget.style.color = 'var(--color-ink-3)' } }}
        >
          + Add app
        </button>
        {atLimit && (
          <p style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: 'var(--color-warn)' }}>
            App limit reached ({appCount}/{appLimit}). <button type="button" onClick={onUpgrade} style={{ color: 'var(--color-accent)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', padding: 0 }}>Upgrade your plan</button> for more.
          </p>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ border: '1px solid var(--color-line)', borderRadius: 8, padding: 16, background: 'var(--color-card)' }}>
      {error && (
        <div style={{ marginBottom: 12, padding: 12, borderRadius: 6, background: 'var(--color-warn-wash)', color: 'var(--color-warn)', border: '1px solid var(--color-warn)', fontSize: 12 }}>
          {error}
        </div>
      )}
      <label style={{ display: 'block', marginBottom: 6, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>
        App Store or Play Store URL
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="url" value={storeUrl} onChange={(e) => setStoreUrl(e.target.value)} required autoFocus
          style={{ flex: 1, padding: '10px 12px', fontSize: 14, border: '1px solid var(--color-line)', borderRadius: 6, background: 'var(--color-card)', outline: 'none' }}
          placeholder="https://apps.apple.com/app/id123456789"
        />
        <button type="submit" disabled={loading || !storeUrl.trim()} className="btn accent">{loading ? 'Adding...' : 'Add'}</button>
        <button type="button" onClick={() => { setShowForm(false); setError(null) }} className="btn ghost">Cancel</button>
      </div>
    </form>
  )
}

function parseStoreUrl(url: string): { platform: 'ios' | 'android'; storeId: string; appName: string } {
  const iosMatch = url.match(/(?:apps\.apple\.com|itunes\.apple\.com).*?\/id(\d+)/)
  if (iosMatch) {
    const nameMatch = url.match(/\/app\/([^/]+)\/id/)
    const appName = nameMatch ? nameMatch[1]!.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : `iOS App ${iosMatch[1]}`
    return { platform: 'ios', storeId: iosMatch[1]!, appName }
  }
  const androidMatch = url.match(/play\.google\.com\/store\/apps\/details\?id=([a-zA-Z0-9._]+)/)
  if (androidMatch) {
    const parts = androidMatch[1]!.split('.')
    const appName = parts[parts.length - 1]!.replace(/([A-Z])/g, ' $1').trim()
    return { platform: 'android', storeId: androidMatch[1]!, appName: appName.charAt(0).toUpperCase() + appName.slice(1) }
  }
  throw new Error('Invalid URL. Paste an App Store or Google Play URL.')
}
