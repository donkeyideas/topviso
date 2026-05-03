'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

type Step = 'org' | 'app' | 'mode' | 'done'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('org')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1: Org
  const [orgName, setOrgName] = useState('')

  // Step 2: App
  const [storeUrl, setStoreUrl] = useState('')
  const [orgId, setOrgId] = useState<string | null>(null)
  const [appId, setAppId] = useState<string | null>(null)

  // Step 3: Mode
  const [selectedMode, setSelectedMode] = useState<'focused' | 'full_suite'>('focused')

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const baseSlug = orgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`

      // Generate ID client-side so we don't need to read back the row
      // (RLS SELECT policy requires membership which doesn't exist yet)
      const newOrgId = crypto.randomUUID()

      // Create org
      const { error: orgError } = await supabase
        .from('organizations')
        .insert({ id: newOrgId, name: orgName, slug })

      if (orgError) throw orgError

      // Add user as owner
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: newOrgId,
          user_id: user.id,
          role: 'owner',
        })

      if (memberError) throw memberError

      // Update profile default org
      await supabase
        .from('profiles')
        .update({ default_organization_id: newOrgId })
        .eq('id', user.id)

      setOrgId(newOrgId)
      setStep('app')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddApp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!orgId) throw new Error('No organization')

      // Parse store URL to get platform and store ID
      const { platform, storeId, appName } = parseStoreUrl(storeUrl)

      // Route through API to enforce plan limits
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_id: orgId, platform, store_id: storeId, name: appName }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to add app' }))
        throw new Error(data.error || 'Failed to add app')
      }
      const { data: app } = await res.json()
      const newAppId = app.id

      // Fetch store metadata (icon, real name, category) in background
      fetch(`/api/apps/${newAppId}/enrich`, { method: 'POST' }).catch(() => {})

      setAppId(newAppId)
      setStep('mode')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add app')
    } finally {
      setLoading(false)
    }
  }

  function handleSkipApp() {
    setStep('mode')
  }

  async function handleSelectMode(mode: 'focused' | 'full_suite') {
    setSelectedMode(mode)
    setLoading(true)
    setError(null)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      await supabase.from('profiles').update({ dashboard_mode: mode }).eq('id', user.id)
      setStep('done')
      setTimeout(() => {
        if (appId) {
          router.push(mode === 'focused' ? `/focused/app/${appId}/overview` : `/app/${appId}/overview-2`)
        } else {
          router.push(mode === 'focused' ? '/focused' : '/app')
        }
        router.refresh()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preference')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: 'var(--color-paper)' }}
    >
      <div className="w-full max-w-lg px-6">
        {/* Brand */}
        <div className="mb-10 flex items-baseline gap-2.5">
          <div
            className="relative top-0.5 h-3 w-3 rounded-full"
            style={{ background: 'var(--color-ink)' }}
          >
            <div
              className="absolute left-[3px] top-[3px] h-1.5 w-1.5 rounded-full"
              style={{ background: 'var(--color-accent)' }}
            />
          </div>
          <span
            className="text-2xl leading-none"
            style={{
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.02em',
            }}
          >
            Top Viso
          </span>
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex gap-2">
          {(['org', 'app', 'mode', 'done'] as const).map((s, i) => (
            <div
              key={s}
              className="h-1 flex-1 rounded-full"
              style={{
                background:
                  i <= ['org', 'app', 'mode', 'done'].indexOf(step)
                    ? 'var(--color-accent)'
                    : 'var(--color-line)',
              }}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-4 rounded-md p-3 text-sm"
            style={{
              background: 'var(--color-warn-wash)',
              color: 'var(--color-warn)',
              border: '1px solid var(--color-warn)',
            }}
          >
            {error}
          </div>
        )}

        {/* Step 1: Create Organization */}
        {step === 'org' && (
          <form onSubmit={handleCreateOrg}>
            <div
              className="mb-1 text-xs font-medium uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink-3)' }}
            >
              STEP 1 OF 3
            </div>
            <h1
              className="mb-2 text-3xl"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '-0.025em' }}
            >
              Name your <em style={{ color: 'var(--color-accent)' }}>workspace</em>
            </h1>
            <p className="mb-8 text-sm" style={{ color: 'var(--color-ink-3)' }}>
              This is your team&apos;s home. You can rename it later.
            </p>

            <div className="mb-4">
              <label
                className="mb-1.5 block text-xs font-medium uppercase tracking-widest"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink-3)' }}
              >
                Organization name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
                className="w-full rounded-md px-3 py-2.5 text-sm outline-none"
                style={{ border: '1px solid var(--color-line)', background: 'white' }}
                placeholder="Acme Inc."
              />
            </div>

            <button
              type="submit"
              disabled={loading || !orgName.trim()}
              className="w-full rounded-md py-3 text-sm font-semibold"
              style={{
                background: loading ? 'var(--color-ink-3)' : 'var(--color-ink)',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Creating...' : 'Continue'}
            </button>
          </form>
        )}

        {/* Step 2: Add First App */}
        {step === 'app' && (
          <form onSubmit={handleAddApp}>
            <div
              className="mb-1 text-xs font-medium uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink-3)' }}
            >
              STEP 2 OF 3
            </div>
            <h1
              className="mb-2 text-3xl"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '-0.025em' }}
            >
              Add your first <em style={{ color: 'var(--color-accent)' }}>app</em>
            </h1>
            <p className="mb-8 text-sm" style={{ color: 'var(--color-ink-3)' }}>
              Paste a link from the App Store or Google Play. We&apos;ll pull in the metadata automatically.
            </p>

            <div className="mb-4">
              <label
                className="mb-1.5 block text-xs font-medium uppercase tracking-widest"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink-3)' }}
              >
                App Store or Play Store URL
              </label>
              <input
                type="url"
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
                required
                className="w-full rounded-md px-3 py-2.5 text-sm outline-none"
                style={{ border: '1px solid var(--color-line)', background: 'white' }}
                placeholder="https://apps.apple.com/app/id123456789"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || !storeUrl.trim()}
                className="flex-1 rounded-md py-3 text-sm font-semibold"
                style={{
                  background: loading ? 'var(--color-ink-3)' : 'var(--color-accent)',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Adding...' : 'Add app'}
              </button>
              <button
                type="button"
                onClick={handleSkipApp}
                className="rounded-md px-6 py-3 text-sm font-semibold"
                style={{ border: '1px solid var(--color-line)', color: 'var(--color-ink-3)' }}
              >
                Skip for now
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Choose Dashboard Mode */}
        {step === 'mode' && (
          <div>
            <div
              className="mb-1 text-xs font-medium uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink-3)' }}
            >
              STEP 3 OF 3
            </div>
            <h1
              className="mb-2 text-3xl"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '-0.025em' }}
            >
              Choose your <em style={{ color: 'var(--color-accent)' }}>dashboard</em>
            </h1>
            <p className="mb-8 text-sm" style={{ color: 'var(--color-ink-3)' }}>
              You can switch anytime in Settings.
            </p>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSelectMode('focused')}
                style={{
                  flex: 1, padding: '20px 16px', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
                  border: selectedMode === 'focused' ? '2px solid var(--color-accent)' : '1px solid var(--color-line)',
                  background: selectedMode === 'focused' ? 'var(--color-accent-wash)' : 'white',
                  textAlign: 'left', transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', letterSpacing: '0.08em', marginBottom: 6 }}>
                  RECOMMENDED
                </div>
                <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '-0.02em', marginBottom: 6 }}>
                  Focused
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-ink-3)', lineHeight: 1.4 }}>
                  9 essential modules, streamlined for speed. Everything you need, nothing you don&apos;t.
                </div>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleSelectMode('full_suite')}
                style={{
                  flex: 1, padding: '20px 16px', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
                  border: selectedMode === 'full_suite' ? '2px solid var(--color-accent)' : '1px solid var(--color-line)',
                  background: selectedMode === 'full_suite' ? 'var(--color-accent-wash)' : 'white',
                  textAlign: 'left', transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-ink-3)', letterSpacing: '0.08em', marginBottom: 6 }}>
                  ADVANCED
                </div>
                <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '-0.02em', marginBottom: 6 }}>
                  Full Suite
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-ink-3)', lineHeight: 1.4 }}>
                  22 modules with granular detail. Every tool, every metric, full control.
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 'done' && (
          <div className="text-center">
            <h1
              className="mb-4 text-3xl"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 400, letterSpacing: '-0.025em' }}
            >
              You&apos;re <em style={{ color: 'var(--color-accent)' }}>all set</em>
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-ink-3)' }}>
              Redirecting to your dashboard...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function parseStoreUrl(url: string): { platform: 'ios' | 'android'; storeId: string; appName: string } {
  // iOS App Store URL patterns:
  // https://apps.apple.com/app/app-name/id123456789
  // https://apps.apple.com/us/app/app-name/id123456789
  // https://itunes.apple.com/app/id123456789
  const iosMatch = url.match(/(?:apps\.apple\.com|itunes\.apple\.com).*?\/id(\d+)/)
  if (iosMatch) {
    const nameMatch = url.match(/\/app\/([^/]+)\/id/)
    const appName = nameMatch
      ? nameMatch[1]!.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : `iOS App ${iosMatch[1]}`
    return { platform: 'ios', storeId: iosMatch[1]!, appName }
  }

  // Google Play Store URL patterns:
  // https://play.google.com/store/apps/details?id=com.example.app
  const androidMatch = url.match(/play\.google\.com\/store\/apps\/details\?id=([a-zA-Z0-9._]+)/)
  if (androidMatch) {
    const parts = androidMatch[1]!.split('.')
    const appName = parts[parts.length - 1]!.replace(/([A-Z])/g, ' $1').trim()
    return {
      platform: 'android',
      storeId: androidMatch[1]!,
      appName: appName.charAt(0).toUpperCase() + appName.slice(1),
    }
  }

  throw new Error('Invalid URL. Paste an App Store or Google Play URL.')
}
