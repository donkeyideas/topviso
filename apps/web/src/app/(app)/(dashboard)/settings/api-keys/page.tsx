'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

interface ApiKey {
  id: string
  name: string
  prefix: string
  created_at: string
  last_used_at: string | null
  revoked_at: string | null
}

export default function ApiKeysSettingsPage() {
  const router = useRouter()
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [keyName, setKeyName] = useState('')
  const [newKey, setNewKey] = useState<string | null>(null)
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
        .from('api_keys')
        .select('id, name, prefix, created_at, last_used_at, revoked_at')
        .eq('organization_id', profile.default_organization_id)
        .is('revoked_at', null)
        .order('created_at', { ascending: false })

      setKeys((data as ApiKey[]) ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!orgId || !keyName.trim()) return
    setCreating(true)

    const supabase = getSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Generate key
    const rawKey = `aso_${crypto.randomUUID().replace(/-/g, '')}`
    const prefix = rawKey.slice(0, 8)

    // Hash key for storage (simple hash for demo — in prod use server-side bcrypt)
    const encoder = new TextEncoder()
    const data = encoder.encode(rawKey)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashedKey = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    const { data: created, error } = await supabase
      .from('api_keys')
      .insert({
        organization_id: orgId,
        name: keyName,
        prefix,
        hashed_key: hashedKey,
        created_by: user.id,
      })
      .select()
      .single()

    if (!error && created) {
      setNewKey(rawKey)
      setKeys([created as ApiKey, ...keys])
      setKeyName('')
    }
    setCreating(false)
  }

  async function handleRevoke(id: string) {
    const supabase = getSupabaseBrowserClient()
    await supabase
      .from('api_keys')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', id)

    setKeys(keys.filter(k => k.id !== id))
  }

  if (loading) return <div className="animate-pulse h-40 rounded" style={{ background: 'var(--color-line)' }} />

  return (
    <div className="max-w-2xl">
      <h1
        className="mb-2 text-3xl"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '-0.025em' }}
      >
        API Keys
      </h1>
      <p className="mb-8 text-sm" style={{ color: 'var(--color-ink-3)' }}>
        Create and manage API keys for programmatic access.
      </p>

      {/* New key display */}
      {newKey && (
        <div
          className="mb-6 rounded-lg p-4"
          style={{ background: 'var(--color-ok-wash)', border: '1px solid var(--color-ok)' }}
        >
          <div className="mb-1 text-xs font-medium" style={{ color: 'var(--color-ok)' }}>
            Copy your new API key now — it won&apos;t be shown again.
          </div>
          <code
            className="block rounded px-3 py-2 text-sm"
            style={{ background: 'white', fontFamily: 'var(--font-mono)' }}
          >
            {newKey}
          </code>
          <button
            onClick={() => { navigator.clipboard.writeText(newKey); setNewKey(null) }}
            className="mt-2 text-xs font-medium underline"
            style={{ color: 'var(--color-ok)' }}
          >
            Copy &amp; dismiss
          </button>
        </div>
      )}

      {/* Create form */}
      <form onSubmit={handleCreate} className="mb-8 flex gap-2">
        <input
          type="text"
          value={keyName}
          onChange={(e) => setKeyName(e.target.value)}
          className="settings-input flex-1"
          placeholder="Key name (e.g., Production)"
        />
        <button
          type="submit"
          disabled={creating || !keyName.trim()}
          className="settings-btn-primary"
        >
          {creating ? 'Creating...' : 'Create key'}
        </button>
      </form>

      {/* Keys list */}
      {keys.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--color-ink-3)' }}>
          No API keys yet. Create one above.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {keys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between rounded-lg p-3"
              style={{ border: '1px solid var(--color-line)', background: 'white' }}
            >
              <div>
                <div className="text-sm font-medium">{key.name}</div>
                <div
                  className="text-xs"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink-3)' }}
                >
                  {key.prefix}... &middot; Created {new Date(key.created_at).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => handleRevoke(key.id)}
                className="rounded-md px-3 py-1 text-xs font-medium"
                style={{
                  border: '1px solid var(--color-warn)',
                  color: 'var(--color-warn)',
                }}
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
