'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export default function ProfileSettingsPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/signin'); return }

      setEmail(user.email ?? '')

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      setFullName(profile?.full_name ?? '')
      setLoading(false)
    }
    load()
  }, [router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const supabase = getSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id)

    if (error) {
      setMessage('Failed to save: ' + error.message)
    } else {
      setMessage('Saved successfully.')
    }
    setSaving(false)
  }

  if (loading) {
    return <SettingsSkeleton />
  }

  return (
    <div className="max-w-lg">
      <h1
        className="mb-2 text-3xl"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '-0.025em' }}
      >
        Profile
      </h1>
      <p className="mb-8 text-sm" style={{ color: 'var(--color-ink-3)' }}>
        Manage your personal account settings.
      </p>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <div>
          <label className="settings-label">Email</label>
          <input
            type="email"
            value={email}
            disabled
            className="settings-input"
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
          />
          <p className="mt-1 text-xs" style={{ color: 'var(--color-ink-3)' }}>
            Email cannot be changed here.
          </p>
        </div>

        <div>
          <label className="settings-label">Full name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="settings-input"
            placeholder="Your name"
          />
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

        <button
          type="submit"
          disabled={saving}
          className="settings-btn-primary"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="max-w-lg animate-pulse">
      <div className="mb-2 h-8 w-32 rounded" style={{ background: 'var(--color-line)' }} />
      <div className="mb-8 h-4 w-64 rounded" style={{ background: 'var(--color-line)' }} />
      <div className="flex flex-col gap-5">
        <div className="h-16 rounded" style={{ background: 'var(--color-line)' }} />
        <div className="h-16 rounded" style={{ background: 'var(--color-line)' }} />
      </div>
    </div>
  )
}
