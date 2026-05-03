'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

interface Member {
  user_id: string
  role: string
  profiles: { full_name: string | null; avatar_url: string | null } | null
}

export default function MembersSettingsPage() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/signin'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('default_organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.default_organization_id) { router.push('/onboarding'); return }
      setOrgId(profile.default_organization_id)

      const { data } = await supabase
        .from('organization_members')
        .select('user_id, role, profiles(full_name, avatar_url)')
        .eq('organization_id', profile.default_organization_id)

      setMembers((data as unknown as Member[]) ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!orgId || !inviteEmail.trim()) return
    setInviting(true)
    setMessage(null)

    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organization_id: orgId, email: inviteEmail, role: 'member' }),
    })
    const data = await res.json()

    if (!res.ok) {
      setMessage('Failed to invite: ' + data.error)
    } else {
      setMessage(`Invitation created for ${inviteEmail}. Share the token to join.`)
      setInviteEmail('')
    }
    setInviting(false)
  }

  if (loading) return <div className="animate-pulse h-40 rounded" style={{ background: 'var(--color-line)' }} />

  return (
    <div className="max-w-2xl">
      <h1
        className="mb-2 text-3xl"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '-0.025em' }}
      >
        Members
      </h1>
      <p className="mb-8 text-sm" style={{ color: 'var(--color-ink-3)' }}>
        Manage who has access to your workspace.
      </p>

      {/* Members list */}
      <div className="mb-8 flex flex-col gap-2">
        {members.map((member) => (
          <div
            key={member.user_id}
            className="flex items-center justify-between rounded-lg p-3"
            style={{ border: '1px solid var(--color-line)', background: 'white' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                style={{ background: 'var(--color-ink)' }}
              >
                {(member.profiles?.full_name ?? 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium">
                  {member.profiles?.full_name ?? 'Unknown'}
                </div>
              </div>
            </div>
            <span
              className="rounded-full px-2 py-0.5 text-xs uppercase"
              style={{
                fontFamily: 'var(--font-mono)',
                background: 'var(--color-paper-2)',
                color: 'var(--color-ink-3)',
                letterSpacing: '0.06em',
              }}
            >
              {member.role}
            </span>
          </div>
        ))}
      </div>

      {/* Invite form */}
      <form onSubmit={handleInvite} className="flex flex-col gap-4">
        <div
          className="text-xs font-medium uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink-3)' }}
        >
          Invite new member
        </div>
        <div className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="settings-input flex-1"
            placeholder="colleague@company.com"
          />
          <button
            type="submit"
            disabled={inviting || !inviteEmail.trim()}
            className="settings-btn-primary"
          >
            {inviting ? 'Sending...' : 'Invite'}
          </button>
        </div>
        {message && (
          <div
            className="rounded-md p-3 text-xs"
            style={{
              background: message.includes('Failed') ? 'var(--color-warn-wash)' : 'var(--color-ok-wash)',
              color: message.includes('Failed') ? 'var(--color-warn)' : 'var(--color-ok)',
            }}
          >
            {message}
          </div>
        )}
      </form>
    </div>
  )
}
