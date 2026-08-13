'use client'

import { useState, useEffect, useCallback } from 'react'
import type { AppProfile } from '@/lib/website-profile'

const EMPTY: AppProfile = {
  one_liner: '', what_it_does: '', core_features: [], target_audiences: [],
  differentiators: [], use_cases: [], competitors_named: [], keywords_seed: [],
  tone: '', markets: [], monetization: 'unknown', source: 'manual', source_url: null, confidence: 'medium',
}

const label: React.CSSProperties = {
  display: 'block', marginBottom: 6, fontSize: 10, fontFamily: 'var(--font-mono)',
  color: 'var(--color-ink-3)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500,
}
const input: React.CSSProperties = {
  width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid var(--color-line)',
  borderRadius: 6, background: 'var(--color-card)', outline: 'none', fontFamily: 'inherit', color: 'var(--color-ink)',
}

function toLines(a: string[]): string { return a.join('\n') }
function fromLines(s: string): string[] {
  return s.split('\n').map((x) => x.trim()).filter(Boolean)
}

/**
 * A QUIET control. The website profile is background fuel for listing
 * generation — not a report for the user to read. So by default this shows only
 * a URL input + a status pill. The full extracted profile is stored and used
 * silently; it's tucked behind an optional "details" toggle for anyone who
 * wants to verify or hand-correct what the AI learned.
 */
export function AppIdentityPanel({
  appId,
  initialProfile,
  initialWebsite,
  initialStatus,
  onSaved,
}: {
  appId: string
  initialProfile: AppProfile | null | undefined
  initialWebsite: string | null | undefined
  initialStatus: 'none' | 'pending' | 'ready' | 'failed' | undefined
  onSaved?: (p: AppProfile) => void
}) {
  const [profile, setProfile] = useState<AppProfile | null>(initialProfile ?? null)
  const [website, setWebsite] = useState(initialWebsite ?? '')
  const [status, setStatus] = useState(initialStatus ?? 'none')
  const [showDetails, setShowDetails] = useState(false)
  const [editing, setEditing] = useState(false)
  const [changing, setChanging] = useState(false) // showing the URL input to add/replace the site
  const [draft, setDraft] = useState<AppProfile>(initialProfile ?? EMPTY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialProfile) { setProfile(initialProfile); setDraft(initialProfile) }
    if (initialWebsite != null) setWebsite(initialWebsite)
    if (initialStatus) setStatus(initialStatus)
  }, [initialProfile, initialWebsite, initialStatus])

  const analyze = useCallback(async () => {
    if (!website.trim()) { setError('Enter a website URL first'); return }
    setBusy(true); setError(null); setStatus('pending')
    try {
      const res = await fetch(`/api/apps/${appId}/profile`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website_url: website.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to analyze website')
      setProfile(json.data); setDraft(json.data); setStatus('ready'); setEditing(false); setChanging(false)
      onSaved?.(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to analyze website'); setStatus('failed')
    } finally { setBusy(false) }
  }, [appId, website, onSaved])

  const save = useCallback(async () => {
    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/apps/${appId}/profile`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: draft }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save')
      setProfile(json.data); setStatus('ready'); setEditing(false)
      onSaved?.(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally { setBusy(false) }
  }, [appId, draft, onSaved])

  const hasProfile = !!profile && (!!profile.one_liner || profile.core_features.length > 0)
  const connected = !!website.trim()
  const syncing = busy || status === 'pending'
  const domain = (() => { try { return new URL(website).hostname.replace(/^www\./, '') } catch { return website } })()

  return (
    <div style={{ border: '1px solid var(--color-line)', borderRadius: 10, background: 'var(--color-card)', marginBottom: 20, padding: '14px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>App Identity</span>
        <span style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>Used in the background to ground generated listings in what your app really does.</span>
      </div>

      {error && (
        <div style={{ marginTop: 12, padding: 10, borderRadius: 6, background: 'var(--color-warn-wash)', color: 'var(--color-warn)', border: '1px solid var(--color-warn)', fontSize: 12 }}>{error}</div>
      )}

      {/* CONNECTED — the website was linked when the app was added. Just confirm
          it; don't nag the user with an input box. */}
      {connected && !changing ? (
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {syncing ? (
            <span style={{ fontSize: 13, color: 'var(--color-ink-3)' }}>● Syncing {domain}…</span>
          ) : status === 'failed' ? (
            <>
              <span style={{ fontSize: 13, color: 'var(--color-warn)' }}>● Sync failed for {domain}</span>
              <button onClick={analyze} disabled={busy} style={linkBtn}>Retry</button>
            </>
          ) : (
            <span style={{ fontSize: 13, color: 'var(--color-good)' }}>● Website connected — <span style={{ color: 'var(--color-ink-2)' }}>{domain}</span></span>
          )}
          <span style={{ color: 'var(--color-line)' }}>·</span>
          <button onClick={() => { setChanging(true); setError(null) }} style={linkBtn}>Change</button>
          {hasProfile && (
            <button onClick={() => setShowDetails((s) => !s)} style={linkBtn}>
              {showDetails ? 'Hide details' : 'View what the AI learned'}
            </button>
          )}
        </div>
      ) : (
        /* NOT CONNECTED (or changing) — let them add a website; saving re-syncs. */
        <div style={{ marginTop: 12 }}>
          {!changing && (
            <p style={{ fontSize: 12, color: 'var(--color-ink-3)', marginBottom: 8 }}>
              Connect your website so AI understands what your app does — every generated listing gets stronger.
            </p>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input style={{ ...input, flex: 1, minWidth: 220 }} type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourapp.com" autoFocus={changing} />
            <button className="btn accent" onClick={analyze} disabled={busy || !website.trim()} style={{ whiteSpace: 'nowrap' }}>
              {syncing ? 'Syncing…' : 'Connect & sync'}
            </button>
            {changing && <button className="btn ghost" onClick={() => { setChanging(false); setWebsite(initialWebsite ?? ''); setError(null) }} disabled={busy}>Cancel</button>}
          </div>
          <div style={{ marginTop: 10 }}>
            <button onClick={() => { setEditing(true); setShowDetails(true); setDraft(profile ?? EMPTY) }} style={linkBtn}>
              No website? Describe your app manually
            </button>
          </div>
        </div>
      )}

      {showDetails && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--color-line)' }}>
          {hasProfile && !editing && (
            <div style={{ display: 'grid', gap: 12 }}>
              <Field title="What it is" value={profile!.one_liner} />
              <Field title="What it does" value={profile!.what_it_does} />
              <Chips title="Core features" items={profile!.core_features} />
              <Chips title="Target audience" items={profile!.target_audiences} />
              <Chips title="Differentiators" items={profile!.differentiators} />
              <Chips title="Use cases" items={profile!.use_cases} />
              <Chips title="Named competitors" items={profile!.competitors_named} />
              <Chips title="Value-prop keywords" items={profile!.keywords_seed} />
              <Chips title="Markets" items={profile!.markets} />
              <div style={{ display: 'flex', gap: 20 }}>
                <Field title="Monetization" value={profile!.monetization} inline />
                <Field title="Tone" value={profile!.tone} inline />
                <Field title="Source" value={profile!.source} inline />
              </div>
              <div><button className="btn ghost" onClick={() => { setEditing(true); setDraft(profile!) }}>Edit</button></div>
            </div>
          )}

          {editing && (
            <div style={{ display: 'grid', gap: 12 }}>
              <div><label style={label}>What it is (one line)</label><input style={input} value={draft.one_liner} onChange={(e) => setDraft({ ...draft, one_liner: e.target.value })} /></div>
              <div><label style={label}>What it does</label><textarea style={{ ...input, minHeight: 60, resize: 'vertical' }} value={draft.what_it_does} onChange={(e) => setDraft({ ...draft, what_it_does: e.target.value })} /></div>
              <ListEdit title="Core features (one per line)" value={draft.core_features} onChange={(v) => setDraft({ ...draft, core_features: v })} />
              <ListEdit title="Target audience" value={draft.target_audiences} onChange={(v) => setDraft({ ...draft, target_audiences: v })} />
              <ListEdit title="Differentiators" value={draft.differentiators} onChange={(v) => setDraft({ ...draft, differentiators: v })} />
              <ListEdit title="Use cases" value={draft.use_cases} onChange={(v) => setDraft({ ...draft, use_cases: v })} />
              <ListEdit title="Named competitors" value={draft.competitors_named} onChange={(v) => setDraft({ ...draft, competitors_named: v })} />
              <ListEdit title="Value-prop keywords" value={draft.keywords_seed} onChange={(v) => setDraft({ ...draft, keywords_seed: v })} />
              <ListEdit title="Markets" value={draft.markets} onChange={(v) => setDraft({ ...draft, markets: v })} />
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}><label style={label}>Monetization</label><input style={input} value={draft.monetization} onChange={(e) => setDraft({ ...draft, monetization: e.target.value })} /></div>
                <div style={{ flex: 1 }}><label style={label}>Tone</label><input style={input} value={draft.tone} onChange={(e) => setDraft({ ...draft, tone: e.target.value })} /></div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn accent" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save identity'}</button>
                <button className="btn ghost" onClick={() => { setEditing(false); setDraft(profile ?? EMPTY) }} disabled={busy}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const linkBtn: React.CSSProperties = {
  color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer',
  font: 'inherit', fontSize: 12, textDecoration: 'underline', padding: 0,
}

function Field({ title, value, inline }: { title: string; value: string; inline?: boolean }) {
  if (!value) return null
  return (
    <div>
      <div style={label}>{title}</div>
      <div style={{ fontSize: inline ? 12 : 13, color: 'var(--color-ink)', lineHeight: 1.5, textTransform: title === 'Source' ? 'capitalize' : 'none' }}>{value}</div>
    </div>
  )
}

function Chips({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null
  return (
    <div>
      <div style={label}>{title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map((it, i) => (
          <span key={i} style={{ fontSize: 12, padding: '3px 9px', borderRadius: 20, background: 'var(--color-wash)', border: '1px solid var(--color-line)', color: 'var(--color-ink-2)' }}>{it}</span>
        ))}
      </div>
    </div>
  )
}

function ListEdit({ title, value, onChange }: { title: string; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <label style={label}>{title}</label>
      <textarea
        style={{ ...input, minHeight: 56, resize: 'vertical' }}
        value={toLines(value)}
        onChange={(e) => onChange(fromLines(e.target.value))}
      />
    </div>
  )
}
