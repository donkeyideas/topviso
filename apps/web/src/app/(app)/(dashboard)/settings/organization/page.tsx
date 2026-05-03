'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export default function OrganizationSettingsPage() {
  const router = useRouter()
  const [orgName, setOrgName] = useState('')
  const [orgSlug, setOrgSlug] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

      const { data: org } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .eq('id', profile.default_organization_id)
        .single()

      if (org) {
        setOrgId(org.id)
        setOrgName(org.name)
        setOrgSlug(org.slug)
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!orgId) return
    setSaving(true)
    setMessage(null)

    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase
      .from('organizations')
      .update({ name: orgName })
      .eq('id', orgId)

    if (error) {
      setMessage('Failed to save: ' + error.message)
    } else {
      setMessage('Organization updated.')
    }
    setSaving(false)
  }

  if (loading) return <div className="animate-pulse h-40 rounded" style={{ background: 'var(--color-line)' }} />

  return (
    <div className="max-w-lg">
      <h1
        className="mb-2 text-3xl"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '-0.025em' }}
      >
        Organization
      </h1>
      <p className="mb-8 text-sm" style={{ color: 'var(--color-ink-3)' }}>
        Manage your workspace settings.
      </p>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <div>
          <label className="settings-label">Organization name</label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="settings-input"
          />
        </div>

        <div>
          <label className="settings-label">Slug</label>
          <input
            type="text"
            value={orgSlug}
            disabled
            className="settings-input"
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
          />
          <p className="mt-1 text-xs" style={{ color: 'var(--color-ink-3)' }}>
            Slug cannot be changed after creation.
          </p>
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

        <button type="submit" disabled={saving} className="settings-btn-primary">
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
