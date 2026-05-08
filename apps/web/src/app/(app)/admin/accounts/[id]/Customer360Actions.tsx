'use client'

import { useState, useTransition } from 'react'
import { updateOrgPlan } from './actions'

interface OrgData {
  id: string
  name: string
  plan_tier: string
  app_limit: number
  keyword_limit: number
  seat_limit: number
  trial_ends_at: string | null
  members: Array<{ user_id: string; role: string; full_name: string | null; joined: string }>
  apps: Array<{ name: string; platform: string; category: string | null; added: string }>
}

export function Customer360Actions({ org }: { org: OrgData }) {
  const [showEdit, setShowEdit] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const [planTier, setPlanTier] = useState(org.plan_tier)
  const [appLimit, setAppLimit] = useState(org.app_limit)
  const [keywordLimit, setKeywordLimit] = useState(org.keyword_limit)
  const [seatLimit, setSeatLimit] = useState(org.seat_limit)
  const [trialEndsAt, setTrialEndsAt] = useState(
    org.trial_ends_at ? org.trial_ends_at.slice(0, 10) : ''
  )

  function handleSave() {
    startTransition(async () => {
      await updateOrgPlan(org.id, {
        plan_tier: planTier as 'solo' | 'team' | 'enterprise',
        app_limit: appLimit,
        keyword_limit: keywordLimit,
        seat_limit: seatLimit,
        trial_ends_at: trialEndsAt ? new Date(trialEndsAt).toISOString() : null,
      })
      setSaved(true)
      setTimeout(() => { setSaved(false); setShowEdit(false) }, 1200)
    })
  }

  function handleExport() {
    const payload = {
      organization: {
        id: org.id,
        name: org.name,
        plan_tier: org.plan_tier,
        app_limit: org.app_limit,
        keyword_limit: org.keyword_limit,
        seat_limit: org.seat_limit,
        trial_ends_at: org.trial_ends_at,
      },
      members: org.members,
      apps: org.apps,
      exported_at: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${org.name.replace(/\s+/g, '_').toLowerCase()}_export.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const presets: Record<string, { apps: number; keywords: number; seats: number }> = {
    solo: { apps: 1, keywords: 50, seats: 1 },
    team: { apps: 5, keywords: 500, seats: 5 },
    enterprise: { apps: 50, keywords: 5000, seats: 25 },
  }

  function applyPreset(tier: string) {
    setPlanTier(tier)
    const p = presets[tier]
    if (p) { setAppLimit(p.apps); setKeywordLimit(p.keywords); setSeatLimit(p.seats) }
  }

  return (
    <>
      <div className="c360-actions">
        <button className="btn-ghost" onClick={() => setShowEdit(true)}>Edit</button>
        <button className="btn-ghost" onClick={handleExport}>Export</button>
      </div>

      {showEdit && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowEdit(false) }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          }}
        >
          <div style={{
            background: 'var(--color-paper, #fff)', border: '1px solid var(--color-line)',
            borderRadius: 8, padding: 28, width: 420, maxHeight: '80vh', overflow: 'auto',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '-0.02em', marginBottom: 20 }}>
              Edit plan · <em>{org.name}</em>
            </div>

            {/* Plan Tier */}
            <label style={labelStyle}>PLAN TIER</label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {['solo', 'team', 'enterprise'].map(t => (
                <button
                  key={t}
                  onClick={() => applyPreset(t)}
                  className={planTier === t ? 'btn-ink' : 'btn-ghost'}
                  style={{ flex: 1 }}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Limits */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>APPS</label>
                <input type="number" value={appLimit} onChange={e => setAppLimit(+e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>KEYWORDS</label>
                <input type="number" value={keywordLimit} onChange={e => setKeywordLimit(+e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>SEATS</label>
                <input type="number" value={seatLimit} onChange={e => setSeatLimit(+e.target.value)} style={inputStyle} />
              </div>
            </div>

            {/* Access Expiry */}
            <label style={labelStyle}>ACCESS EXPIRES</label>
            <input
              type="date"
              value={trialEndsAt}
              onChange={e => setTrialEndsAt(e.target.value)}
              style={{ ...inputStyle, marginBottom: 4 }}
            />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-ink-3)', letterSpacing: '0.06em', marginBottom: 20 }}>
              Leave empty for no expiration
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setShowEdit(false)} disabled={isPending}>
                Cancel
              </button>
              <button className="btn-ink" onClick={handleSave} disabled={isPending}>
                {saved ? 'SAVED ✓' : isPending ? 'SAVING…' : 'SAVE CHANGES'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  letterSpacing: '0.1em',
  color: 'var(--color-ink-3)',
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  fontFamily: 'var(--font-mono)',
  fontSize: 13,
  border: '1px solid var(--color-line)',
  borderRadius: 4,
  background: 'var(--color-card, #fff)',
}
