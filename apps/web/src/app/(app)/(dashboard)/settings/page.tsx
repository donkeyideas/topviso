'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { TopStrip } from '@/components/dashboard/TopStrip'
import { PageHero } from '@/components/dashboard/PageHero'
import { BillingModal } from '@/components/billing/BillingModal'

interface Member {
  user_id: string
  role: string
  profiles: { full_name: string | null; avatar_url: string | null } | null
}

interface ApiKey {
  id: string
  name: string
  prefix: string
  created_at: string
  last_used_at: string | null
  revoked_at: string | null
}

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  // Profile
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState<string | null>(null)

  // Organization
  const [orgId, setOrgId] = useState<string | null>(null)
  const [orgName, setOrgName] = useState('')
  const [orgSlug, setOrgSlug] = useState('')
  const [savingOrg, setSavingOrg] = useState(false)
  const [orgMsg, setOrgMsg] = useState<string | null>(null)

  // Members
  const [members, setMembers] = useState<Member[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [memberMsg, setMemberMsg] = useState<string | null>(null)

  // Billing
  const [plan, setPlan] = useState('solo')
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false)
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<number | null>(null)

  // API Keys
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [keyName, setKeyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)

  // Billing modal
  const [showBilling, setShowBilling] = useState(false)

  // Dashboard mode
  const [dashboardMode, setDashboardMode] = useState<'focused' | 'full_suite'>('focused')
  const [savingMode, setSavingMode] = useState(false)
  const [modeMsg, setModeMsg] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/signin'); return }

      setEmail(user.email ?? '')

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, default_organization_id, dashboard_mode')
        .eq('id', user.id)
        .single()

      setFullName(profile?.full_name ?? '')
      setDashboardMode((profile?.dashboard_mode as 'focused' | 'full_suite') ?? 'focused')

      if (!profile?.default_organization_id) { setLoading(false); return }
      setOrgId(profile.default_organization_id)

      const [orgRes, membersRes, keysRes, planRes] = await Promise.all([
        supabase.from('organizations').select('id, name, slug, plan_tier').eq('id', profile.default_organization_id).single(),
        supabase.from('organization_members').select('user_id, role, profiles(full_name, avatar_url)').eq('organization_id', profile.default_organization_id),
        supabase.from('api_keys').select('id, name, prefix, created_at, last_used_at, revoked_at').eq('organization_id', profile.default_organization_id).is('revoked_at', null).order('created_at', { ascending: false }),
        supabase.from('organizations').select('plan_tier').eq('id', profile.default_organization_id).single(),
      ])

      if (orgRes.data) { setOrgName(orgRes.data.name); setOrgSlug(orgRes.data.slug) }
      setMembers((membersRes.data as unknown as Member[]) ?? [])
      setKeys((keysRes.data as ApiKey[]) ?? [])
      setPlan(planRes.data?.plan_tier ?? 'solo')

      // Fetch subscription cancellation status
      if (orgRes.data?.plan_tier && orgRes.data.plan_tier !== 'solo') {
        try {
          const statusRes = await fetch('/api/billing/status')
          if (statusRes.ok) {
            const statusData = await statusRes.json()
            setCancelAtPeriodEnd(statusData.cancel_at_period_end ?? false)
            setCurrentPeriodEnd(statusData.current_period_end ?? null)
          }
        } catch { /* ignore */ }
      }

      setLoading(false)
    }
    load()
  }, [router])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true); setProfileMsg(null)
    const supabase = getSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id)
    setProfileMsg(error ? 'Failed: ' + error.message : 'Saved.')
    setSavingProfile(false)
  }

  async function saveOrg(e: React.FormEvent) {
    e.preventDefault()
    if (!orgId) return
    setSavingOrg(true); setOrgMsg(null)
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.from('organizations').update({ name: orgName }).eq('id', orgId)
    setOrgMsg(error ? 'Failed: ' + error.message : 'Updated.')
    setSavingOrg(false)
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!orgId || !inviteEmail.trim()) return
    setInviting(true); setMemberMsg(null)
    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organization_id: orgId, email: inviteEmail, role: 'member' }),
    })
    const data = await res.json()
    if (!res.ok) {
      setMemberMsg(`Failed: ${data.error}`)
    } else {
      setMemberMsg(`Invited ${inviteEmail}.`)
      setInviteEmail('')
    }
    setInviting(false)
  }

  async function createKey(e: React.FormEvent) {
    e.preventDefault()
    if (!orgId || !keyName.trim()) return
    setCreating(true)
    const supabase = getSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const rawKey = `aso_${crypto.randomUUID().replace(/-/g, '')}`
    const prefix = rawKey.slice(0, 8)
    const encoder = new TextEncoder()
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(rawKey))
    const hashedKey = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
    const { data: created, error } = await supabase.from('api_keys').insert({ organization_id: orgId, name: keyName, prefix, hashed_key: hashedKey, created_by: user.id }).select().single()
    if (!error && created) { setNewKey(rawKey); setKeys([created as ApiKey, ...keys]); setKeyName('') }
    setCreating(false)
  }

  async function revokeKey(id: string) {
    const supabase = getSupabaseBrowserClient()
    await supabase.from('api_keys').update({ revoked_at: new Date().toISOString() }).eq('id', id)
    setKeys(keys.filter(k => k.id !== id))
  }

  function StatusMsg({ msg }: { msg: string | null }) {
    if (!msg) return null
    const isFail = msg.startsWith('Failed')
    return <div className="rounded-md p-3 text-xs" style={{ background: isFail ? 'var(--color-warn-wash)' : 'var(--color-ok-wash)', color: isFail ? 'var(--color-warn)' : 'var(--color-ok)' }}>{msg}</div>
  }

  if (loading) {
    return (
      <>
        <TopStrip breadcrumbs={[{ label: 'System' }, { label: 'Settings', isActive: true }]} />
        <div className="content"><div className="card"><div className="card-body"><div className="animate-pulse" style={{ height: 200, background: 'var(--color-line)', borderRadius: 8 }} /></div></div></div>
      </>
    )
  }

  return (
    <>
      <TopStrip breadcrumbs={[{ label: 'System' }, { label: 'Settings', isActive: true }]} />

      <PageHero
        title={<>Account <em>settings</em>.</>}
        subtitle="Profile, organization, team members, billing, and API keys — all in one place."
      />

      <div className="content" style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* § 01 Profile */}
        <section>
          <div className="section-head"><div className="section-head-left"><span className="section-num">§ 01</span><h2>Profile</h2></div></div>
          <div className="card"><div className="card-body">
            <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
              <div>
                <label className="settings-label">Email</label>
                <input type="email" value={email} disabled className="settings-input" style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
              <div>
                <label className="settings-label">Full name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="settings-input" placeholder="Your name" />
              </div>
              <StatusMsg msg={profileMsg} />
              <button type="submit" disabled={savingProfile} className="settings-btn-primary" style={{ alignSelf: 'flex-start' }}>{savingProfile ? 'Saving...' : 'Save profile'}</button>
            </form>
          </div></div>
        </section>

        {/* § 02 Organization */}
        <section>
          <div className="section-head"><div className="section-head-left"><span className="section-num">§ 02</span><h2>Organization</h2></div></div>
          <div className="card"><div className="card-body">
            <form onSubmit={saveOrg} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
              <div>
                <label className="settings-label">Organization name</label>
                <input type="text" value={orgName} onChange={e => setOrgName(e.target.value)} className="settings-input" />
              </div>
              <div>
                <label className="settings-label">Slug</label>
                <input type="text" value={orgSlug} disabled className="settings-input" style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                <p style={{ marginTop: 4, fontSize: 11, color: 'var(--color-ink-3)' }}>Cannot be changed after creation.</p>
              </div>
              <StatusMsg msg={orgMsg} />
              <button type="submit" disabled={savingOrg} className="settings-btn-primary" style={{ alignSelf: 'flex-start' }}>{savingOrg ? 'Saving...' : 'Save organization'}</button>
            </form>
          </div></div>
        </section>

        {/* § 03 Members */}
        <section>
          <div className="section-head"><div className="section-head-left"><span className="section-num">§ 03</span><h2>Members</h2></div></div>
          <div className="card"><div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {members.map(m => (
                <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', border: '1px solid var(--color-line)', borderRadius: 8, background: 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-ink)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>{(m.profiles?.full_name ?? 'U').charAt(0).toUpperCase()}</div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{m.profiles?.full_name ?? 'Unknown'}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--color-ink-3)', textTransform: 'uppercase' as const }}>{m.role}</span>
                </div>
              ))}
            </div>
            <form onSubmit={handleInvite} style={{ display: 'flex', gap: 8, maxWidth: 480 }}>
              <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="settings-input" style={{ flex: 1 }} placeholder="colleague@company.com" />
              <button type="submit" disabled={inviting || !inviteEmail.trim()} className="settings-btn-primary">{inviting ? 'Sending...' : 'Invite'}</button>
            </form>
            {memberMsg && <div style={{ marginTop: 12 }}><StatusMsg msg={memberMsg} /></div>}
          </div></div>
        </section>

        {/* § 04 Billing */}
        <section>
          <div className="section-head"><div className="section-head-left"><span className="section-num">§ 04</span><h2>Billing</h2></div></div>
          <div className="card"><div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 480 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--color-ink-3)', textTransform: 'uppercase' as const }}>Current plan</div>
                <div style={{ fontSize: 22, fontWeight: 600, textTransform: 'capitalize' as const, marginTop: 4 }}>
                  {plan}
                  <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--color-ink-3)', marginLeft: 8 }}>
                    ${plan === 'enterprise' ? '199' : plan === 'team' ? '49' : '0'}/mo
                  </span>
                </div>
              </div>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                color: plan === 'solo' ? 'var(--color-ink-3)' : cancelAtPeriodEnd ? 'var(--color-warn)' : 'var(--color-ok)',
              }}>
                {plan === 'solo' ? 'Free' : cancelAtPeriodEnd ? 'Cancelling' : 'Active'}
              </span>
            </div>
            {cancelAtPeriodEnd && (
              <div className="rounded-md p-3 text-xs" style={{ marginTop: 12, maxWidth: 480, background: 'var(--color-warn-wash)', color: 'var(--color-warn)' }}>
                {currentPeriodEnd
                  ? <>Your plan cancels on {new Date(currentPeriodEnd * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. After that, you&apos;ll be downgraded to Solo.</>
                  : <>Your plan is set to cancel at the end of the current billing period. After that, you&apos;ll be downgraded to Solo.</>
                }
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowBilling(true)}
              style={{ display: 'inline-block', marginTop: 16, fontSize: 13, fontWeight: 500, color: 'var(--color-accent, #1d3fd9)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Manage billing &rarr;
            </button>
          </div></div>
        </section>

        {showBilling && (
          <BillingModal
            onClose={() => setShowBilling(false)}
            onPlanChange={(newPlan) => setPlan(newPlan)}
          />
        )}

        {/* § 05 Dashboard */}
        <section>
          <div className="section-head"><div className="section-head-left"><span className="section-num">§ 05</span><h2>Dashboard</h2></div></div>
          <div className="card"><div className="card-body">
            <p style={{ fontSize: 13, color: 'var(--color-ink-3)', marginBottom: 16 }}>Choose your dashboard experience. Changes take effect immediately.</p>
            <div style={{ display: 'flex', gap: 12, maxWidth: 560, marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => setDashboardMode('focused')}
                style={{
                  flex: 1, padding: '16px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                  border: dashboardMode === 'focused' ? '2px solid var(--color-accent)' : '1px solid var(--color-line)',
                  background: dashboardMode === 'focused' ? 'var(--color-accent-wash)' : 'white',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', color: 'var(--color-accent)', marginBottom: 4 }}>RECOMMENDED</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Focused</div>
                <div style={{ fontSize: 12, color: 'var(--color-ink-3)', lineHeight: 1.4 }}>9 essential modules, streamlined for speed.</div>
              </button>
              <button
                type="button"
                onClick={() => setDashboardMode('full_suite')}
                style={{
                  flex: 1, padding: '16px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                  border: dashboardMode === 'full_suite' ? '2px solid var(--color-accent)' : '1px solid var(--color-line)',
                  background: dashboardMode === 'full_suite' ? 'var(--color-accent-wash)' : 'white',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', color: 'var(--color-ink-3)', marginBottom: 4 }}>ADVANCED</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Full Suite</div>
                <div style={{ fontSize: 12, color: 'var(--color-ink-3)', lineHeight: 1.4 }}>22 modules with granular detail.</div>
              </button>
            </div>
            <StatusMsg msg={modeMsg} />
            <button
              type="button"
              disabled={savingMode}
              onClick={async () => {
                setSavingMode(true); setModeMsg(null)
                const supabase = getSupabaseBrowserClient()
                const { data: { user: u } } = await supabase.auth.getUser()
                if (!u) return
                const { error: err } = await supabase.from('profiles').update({ dashboard_mode: dashboardMode }).eq('id', u.id)
                setModeMsg(err ? 'Failed: ' + err.message : 'Saved. Redirecting...')
                setSavingMode(false)
                if (!err) {
                  setTimeout(() => {
                    window.location.href = dashboardMode === 'focused' ? '/focused' : '/app'
                  }, 800)
                }
              }}
              className="settings-btn-primary"
              style={{ alignSelf: 'flex-start' }}
            >
              {savingMode ? 'Saving...' : 'Save preference'}
            </button>
          </div></div>
        </section>
      </div>
    </>
  )
}
