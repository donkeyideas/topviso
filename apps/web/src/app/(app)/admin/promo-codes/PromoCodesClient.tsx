'use client'

import { useEffect, useState } from 'react'
import { AdminCard } from '@/components/admin/AdminCard'
import { KpiCard, KpiGrid } from '@/components/admin/KpiCard'

interface PromoRow {
  id: string
  code: string
  active: boolean
  createdAt: number
  expiresAt: number | null
  maxRedemptions: number | null
  timesRedeemed: number
  firstTimeOnly: boolean
  coupon: {
    id: string
    name: string | null
    percentOff: number | null
    amountOff: number | null
    currency: string | null
    duration: string
    durationInMonths: number | null
    valid: boolean
  } | null
}

interface OrgOption {
  id: string
  name: string
  planTier: string
}

type CreateForm = {
  code: string
  name: string
  discountType: 'percent' | 'amount'
  percentOff: string
  amountOff: string
  currency: string
  duration: 'once' | 'repeating' | 'forever'
  durationInMonths: string
  expiresAt: string // YYYY-MM-DD
  maxRedemptions: string
  firstTimeOnly: boolean
}

const EMPTY_FORM: CreateForm = {
  code: '',
  name: '',
  discountType: 'percent',
  percentOff: '50',
  amountOff: '',
  currency: 'usd',
  duration: 'repeating',
  durationInMonths: '3',
  expiresAt: '',
  maxRedemptions: '',
  firstTimeOnly: false,
}

function formatDiscount(p: PromoRow): string {
  if (!p.coupon) return '—'
  const c = p.coupon
  let amount: string
  if (c.percentOff != null) amount = `${c.percentOff}% off`
  else if (c.amountOff != null && c.currency)
    amount = `${(c.amountOff / 100).toFixed(0)} ${c.currency.toUpperCase()} off`
  else amount = 'discount'
  if (c.duration === 'forever') return `${amount} forever`
  if (c.duration === 'once') return `${amount} (one-time)`
  if (c.duration === 'repeating' && c.durationInMonths) return `${amount} for ${c.durationInMonths}mo`
  return amount
}

function formatDate(unix: number | null): string {
  if (!unix) return '—'
  return new Date(unix * 1000).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function PromoCodesClient({ orgs }: { orgs: OrgOption[] }) {
  const [rows, setRows] = useState<PromoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM)
  const [creating, setCreating] = useState(false)

  const [applyState, setApplyState] = useState<{
    promoId: string
    promoCode: string
  } | null>(null)
  const [applyOrgId, setApplyOrgId] = useState('')
  const [applying, setApplying] = useState(false)
  const [toggleBusy, setToggleBusy] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/promo-codes')
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'Load failed')
      setRows(data.rows ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError(null)
    try {
      const expiresUnix = form.expiresAt
        ? Math.floor(new Date(form.expiresAt + 'T23:59:59').getTime() / 1000)
        : undefined

      const res = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          name: form.name || undefined,
          discountType: form.discountType,
          percentOff: form.discountType === 'percent' ? Number(form.percentOff) : undefined,
          amountOff: form.discountType === 'amount' ? Number(form.amountOff) : undefined,
          currency: form.discountType === 'amount' ? form.currency : undefined,
          duration: form.duration,
          durationInMonths: form.duration === 'repeating' ? Number(form.durationInMonths) : undefined,
          expiresAt: expiresUnix,
          maxRedemptions: form.maxRedemptions ? Number(form.maxRedemptions) : undefined,
          firstTimeOnly: form.firstTimeOnly,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'Create failed')

      setShowCreate(false)
      setForm(EMPTY_FORM)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed')
    } finally {
      setCreating(false)
    }
  }

  async function handleToggle(row: PromoRow) {
    setToggleBusy(row.id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/promo-codes/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !row.active }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'Update failed')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setToggleBusy(null)
    }
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault()
    if (!applyState || !applyOrgId) return
    setApplying(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/promo-codes/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: applyOrgId,
          promotionCodeId: applyState.promoId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'Apply failed')

      setApplyState(null)
      setApplyOrgId('')
      alert(`Applied ${applyState.promoCode} to ${data.orgName}. Discount takes effect on the next invoice.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Apply failed')
    } finally {
      setApplying(false)
    }
  }

  const activeCount = rows.filter((r) => r.active).length
  const totalRedemptions = rows.reduce((s, r) => s + r.timesRedeemed, 0)

  return (
    <>
      <KpiGrid columns={4}>
        <KpiCard label="Active Codes" value={activeCount.toLocaleString()} variant="ok-hl" />
        <KpiCard label="Total Codes" value={rows.length.toLocaleString()} />
        <KpiCard label="Total Redemptions" value={totalRedemptions.toLocaleString()} variant="hl" />
        <KpiCard label="Orgs With Sub" value={orgs.length.toLocaleString()} />
      </KpiGrid>

      {error && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fef3c7', border: '1px solid #d97706', borderRadius: 8, color: '#92400e', fontSize: 13 }}>
          {error}
        </div>
      )}

      <AdminCard
        title={<>All <em>codes</em></>}
        tag={`${rows.length} TOTAL`}
        actions={
          <button className="settings-btn-primary" onClick={() => setShowCreate(true)}>
            + Create promo code
          </button>
        }
      >
        {loading ? (
          <div className="stub-block"><p>Loading from Stripe…</p></div>
        ) : rows.length === 0 ? (
          <div className="stub-block">
            <h4>No promo codes yet</h4>
            <p>Click "Create promo code" to add your first one. It will be created in Stripe and immediately usable at checkout.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Status</th>
                <th>Expires</th>
                <th className="tn">Used</th>
                <th className="tn">Cap</th>
                <th>Restrictions</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>{r.code}</strong>
                    {r.coupon?.name && r.coupon.name !== r.code && (
                      <div style={{ fontSize: 11, color: 'var(--color-ink-3)' }}>{r.coupon.name}</div>
                    )}
                  </td>
                  <td>{formatDiscount(r)}</td>
                  <td>
                    <span className={`admin-pill ${r.active ? 'ok' : 'draft'}`}>
                      {r.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td>{formatDate(r.expiresAt)}</td>
                  <td className="tn">{r.timesRedeemed}</td>
                  <td className="tn">{r.maxRedemptions ?? '∞'}</td>
                  <td style={{ fontSize: 12, color: 'var(--color-ink-3)' }}>
                    {r.firstTimeOnly ? 'First-time customers' : 'All customers'}
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      onClick={() => setApplyState({ promoId: r.id, promoCode: r.code })}
                      disabled={!r.active}
                      style={{
                        background: 'none', border: '1px solid var(--color-line)',
                        borderRadius: 6, padding: '4px 10px', fontSize: 12,
                        cursor: r.active ? 'pointer' : 'not-allowed',
                        opacity: r.active ? 1 : 0.4,
                        marginRight: 6,
                      }}
                    >
                      Apply to user
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggle(r)}
                      disabled={toggleBusy === r.id}
                      style={{
                        background: 'none', border: '1px solid var(--color-line)',
                        borderRadius: 6, padding: '4px 10px', fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      {toggleBusy === r.id ? '…' : r.active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AdminCard>

      {/* ── CREATE MODAL ── */}
      {showCreate && (
        <Modal onClose={() => setShowCreate(false)} title="Create promo code">
          <form onSubmit={handleCreate} style={{ display: 'grid', gap: 14 }}>
            <Field label="Code (user-facing)" hint="Letters, numbers, dashes. Uppercase. e.g. PRODUCTHUNT">
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="PRODUCTHUNT"
                style={inputStyle}
              />
            </Field>

            <Field label="Internal name (optional)" hint="Shown only here, not to customers">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Product Hunt launch"
                style={inputStyle}
              />
            </Field>

            <Field label="Discount type">
              <div style={{ display: 'flex', gap: 8 }}>
                <SegBtn active={form.discountType === 'percent'} onClick={() => setForm({ ...form, discountType: 'percent' })}>Percent</SegBtn>
                <SegBtn active={form.discountType === 'amount'} onClick={() => setForm({ ...form, discountType: 'amount' })}>Fixed amount</SegBtn>
              </div>
            </Field>

            {form.discountType === 'percent' ? (
              <Field label="Percent off" hint="1–100">
                <input
                  type="number" min={1} max={100} required
                  value={form.percentOff}
                  onChange={(e) => setForm({ ...form, percentOff: e.target.value })}
                  style={inputStyle}
                />
              </Field>
            ) : (
              <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '2fr 1fr' }}>
                <Field label="Amount off (cents)" hint="e.g. 1000 for $10">
                  <input
                    type="number" min={1} required
                    value={form.amountOff}
                    onChange={(e) => setForm({ ...form, amountOff: e.target.value })}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Currency">
                  <input
                    type="text" required
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value.toLowerCase() })}
                    placeholder="usd"
                    style={inputStyle}
                  />
                </Field>
              </div>
            )}

            <Field label="Duration">
              <div style={{ display: 'flex', gap: 8 }}>
                <SegBtn active={form.duration === 'once'} onClick={() => setForm({ ...form, duration: 'once' })}>Once</SegBtn>
                <SegBtn active={form.duration === 'repeating'} onClick={() => setForm({ ...form, duration: 'repeating' })}>Repeating</SegBtn>
                <SegBtn active={form.duration === 'forever'} onClick={() => setForm({ ...form, duration: 'forever' })}>Forever</SegBtn>
              </div>
            </Field>

            {form.duration === 'repeating' && (
              <Field label="Apply for (months)">
                <input
                  type="number" min={1} max={60} required
                  value={form.durationInMonths}
                  onChange={(e) => setForm({ ...form, durationInMonths: e.target.value })}
                  style={inputStyle}
                />
              </Field>
            )}

            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr' }}>
              <Field label="Expires on (optional)">
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  style={inputStyle}
                />
              </Field>
              <Field label="Max redemptions (optional)">
                <input
                  type="number" min={1}
                  value={form.maxRedemptions}
                  onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
                  placeholder="∞"
                  style={inputStyle}
                />
              </Field>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={form.firstTimeOnly}
                onChange={(e) => setForm({ ...form, firstTimeOnly: e.target.checked })}
              />
              First-time customers only (no prior successful charges)
            </label>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" onClick={() => setShowCreate(false)} disabled={creating} style={cancelBtn}>Cancel</button>
              <button type="submit" disabled={creating} className="settings-btn-primary">
                {creating ? 'Creating…' : 'Create code'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── APPLY-TO-USER MODAL ── */}
      {applyState && (
        <Modal onClose={() => { setApplyState(null); setApplyOrgId('') }} title={`Apply ${applyState.promoCode} to a customer`}>
          <form onSubmit={handleApply} style={{ display: 'grid', gap: 14 }}>
            <p style={{ fontSize: 13, color: 'var(--color-ink-3)' }}>
              The discount will be added to the customer's <strong>next invoice</strong>. The current cycle is unaffected.
              Only organizations with an active Stripe subscription appear in this list.
            </p>
            <Field label="Customer">
              <select
                required
                value={applyOrgId}
                onChange={(e) => setApplyOrgId(e.target.value)}
                style={inputStyle}
              >
                <option value="">— Choose an organization —</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.planTier})
                  </option>
                ))}
              </select>
            </Field>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setApplyState(null); setApplyOrgId('') }} disabled={applying} style={cancelBtn}>Cancel</button>
              <button type="submit" disabled={applying || !applyOrgId} className="settings-btn-primary">
                {applying ? 'Applying…' : 'Apply discount'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

// ──────────────────────────────────────────────────────────────
// Inline component primitives — keep this file self-contained
// so the admin section can adopt the same modal style elsewhere.

function Modal({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode
  onClose: () => void
  title: string
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 12, maxWidth: 560, width: '100%',
          maxHeight: '90vh', overflow: 'auto', padding: 28,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--color-ink-3)' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-ink-2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11, color: 'var(--color-ink-3)', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

function SegBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1, padding: '8px 12px', border: `1px solid ${active ? 'var(--color-ink)' : 'var(--color-line)'}`,
        background: active ? 'var(--color-ink)' : 'white',
        color: active ? 'white' : 'var(--color-ink)',
        borderRadius: 6, fontSize: 13, cursor: 'pointer',
        fontWeight: active ? 600 : 400,
      }}
    >
      {children}
    </button>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid var(--color-line)',
  borderRadius: 8, fontSize: 14, background: 'white',
  fontFamily: 'inherit',
}

const cancelBtn: React.CSSProperties = {
  background: 'none', border: '1px solid var(--color-line)',
  borderRadius: 8, padding: '8px 16px', fontSize: 14, cursor: 'pointer',
}
