'use client'

import { useTransition, useState } from 'react'
import { AdminCard } from '@/components/admin/AdminCard'
import { SectionHead } from '@/components/admin/SectionHead'
import {
  testAPIConnection,
  saveApiKey,
} from '@/app/(app)/admin/api-management/actions'

interface ApiConfig {
  id: string
  provider: string
  display_name: string
  is_active: boolean
  has_key: boolean
  api_key_last4: string
  env_var: string | null
  model: string | null
  test_status: string | null
  last_tested_at: string | null
  cost_per_1k_input: number | null
  cost_per_1k_output: number | null
}

interface ApiConfigTabProps {
  configs: ApiConfig[]
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 0',
  fontSize: 12,
  borderTop: '1px solid var(--color-line)',
} as const

function ConfigCard({ config }: { config: ApiConfig }) {
  const [isPending, startTransition] = useTransition()
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [editingKey, setEditingKey] = useState(false)
  const [keyValue, setKeyValue] = useState('')
  const [keySaved, setKeySaved] = useState(false)
  const [maskedKey, setMaskedKey] = useState(config.api_key_last4)
  const [hasKey, setHasKey] = useState(config.has_key)

  function handleTest() {
    setTestResult(null)
    startTransition(async () => {
      const result = await testAPIConnection(config.provider)
      setTestResult(result)
    })
  }

  function handleSaveKey() {
    if (!keyValue.trim()) return
    startTransition(async () => {
      const result = await saveApiKey(config.provider, keyValue.trim())
      if (result.success) {
        setMaskedKey(`••••${keyValue.trim().slice(-4)}`)
        setHasKey(true)
        setEditingKey(false)
        setKeyValue('')
        setKeySaved(true)
        setTimeout(() => setKeySaved(false), 2000)
      }
    })
  }

  return (
    <AdminCard
      title={
        <>
          {config.display_name} <em>config</em>
        </>
      }
      tag={config.provider.toUpperCase()}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Provider */}
        <div style={{ ...rowStyle, borderTop: 'none' }}>
          <span style={{ color: 'var(--color-ink-3)' }}>Provider</span>
          <span>
            <strong>{config.display_name}</strong>{' '}
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--color-ink-3)',
              }}
            >
              ({config.provider})
            </span>
          </span>
        </div>

        {/* Status */}
        <div style={rowStyle}>
          <span style={{ color: 'var(--color-ink-3)' }}>Status</span>
          <span
            className={`admin-pill ${config.is_active ? 'ok' : 'draft'}`}
          >
            {config.is_active ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </div>

        {/* Model */}
        {config.model && (
          <div style={rowStyle}>
            <span style={{ color: 'var(--color-ink-3)' }}>Model</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              {config.model}
            </span>
          </div>
        )}

        {/* API Key — editable */}
        <div style={rowStyle}>
          <span style={{ color: 'var(--color-ink-3)' }}>API Key</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {editingKey ? (
              <>
                <input
                  type="password"
                  value={keyValue}
                  onChange={(e) => setKeyValue(e.target.value)}
                  placeholder="Paste new key..."
                  autoFocus
                  style={{
                    width: 200,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    border: '1px solid var(--color-accent)',
                    borderRadius: 4,
                    padding: '3px 8px',
                    outline: 'none',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveKey()
                    if (e.key === 'Escape') {
                      setEditingKey(false)
                      setKeyValue('')
                    }
                  }}
                />
                <button
                  onClick={handleSaveKey}
                  disabled={isPending || !keyValue.trim()}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    padding: '3px 8px',
                    border: '1px solid var(--color-line)',
                    borderRadius: 4,
                    background: 'var(--color-ink)',
                    color: '#fff',
                    cursor: isPending ? 'wait' : 'pointer',
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingKey(false)
                    setKeyValue('')
                  }}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    padding: '3px 8px',
                    border: '1px solid var(--color-line)',
                    borderRadius: 4,
                    background: 'var(--color-card)',
                    color: 'var(--color-ink)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                {maskedKey && (
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--color-ink-3)',
                    }}
                  >
                    {maskedKey}
                  </span>
                )}
                <span
                  className={`admin-pill ${hasKey ? 'ok' : 'error'}`}
                >
                  {hasKey ? 'CONFIGURED' : 'NOT SET'}
                </span>
                <button
                  onClick={() => setEditingKey(true)}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    padding: '2px 8px',
                    border: '1px solid var(--color-line)',
                    borderRadius: 4,
                    background: 'var(--color-card)',
                    color: 'var(--color-ink)',
                    cursor: 'pointer',
                  }}
                >
                  Edit
                </button>
                {keySaved && (
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: 'var(--color-ok)',
                    }}
                  >
                    Saved
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Test Status */}
        <div style={rowStyle}>
          <span style={{ color: 'var(--color-ink-3)' }}>Test Status</span>
          <span
            className={`admin-pill ${
              config.test_status === 'success'
                ? 'ok'
                : config.test_status === 'failed'
                  ? 'error'
                  : 'draft'
            }`}
          >
            {config.test_status === 'success'
              ? 'VERIFIED'
              : config.test_status === 'failed'
                ? 'FAILED'
                : 'UNTESTED'}
          </span>
        </div>

        {/* Last Tested */}
        <div style={rowStyle}>
          <span style={{ color: 'var(--color-ink-3)' }}>Last Tested</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            {formatDate(config.last_tested_at)}
          </span>
        </div>

        {/* Cost Rates — only show if available */}
        {config.cost_per_1k_input != null && (
          <div style={rowStyle}>
            <span style={{ color: 'var(--color-ink-3)' }}>Cost / 1K input</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              ${config.cost_per_1k_input.toFixed(4)}
            </span>
          </div>
        )}
        {config.cost_per_1k_output != null && (
          <div style={rowStyle}>
            <span style={{ color: 'var(--color-ink-3)' }}>Cost / 1K output</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              ${config.cost_per_1k_output.toFixed(4)}
            </span>
          </div>
        )}

        {/* Test Connection Button */}
        <div
          style={{
            borderTop: '1px solid var(--color-line)',
            paddingTop: 12,
            marginTop: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <button
            onClick={handleTest}
            disabled={isPending}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              padding: '6px 14px',
              border: '1px solid var(--color-line)',
              borderRadius: 6,
              background: 'var(--color-card)',
              color: 'var(--color-ink)',
              cursor: isPending ? 'wait' : 'pointer',
              opacity: isPending ? 0.6 : 1,
            }}
          >
            {isPending ? 'Testing...' : 'Test Connection'}
          </button>
          {testResult && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: testResult.success
                  ? 'var(--color-ok, #22863a)'
                  : 'var(--color-error, #cb2431)',
              }}
            >
              {testResult.message}
            </span>
          )}
        </div>
      </div>
    </AdminCard>
  )
}

export function ApiConfigTab({ configs }: ApiConfigTabProps) {
  if (!configs || configs.length === 0) {
    return (
      <>
        <SectionHead number="01" title="Provider Configurations" />
        <AdminCard title="API Configurations" tag="0 PROVIDERS">
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                marginBottom: 8,
                letterSpacing: '-0.02em',
              }}
            >
              No API providers configured
            </div>
          </div>
        </AdminCard>
      </>
    )
  }

  return (
    <>
      <SectionHead number="01" title="Provider Configurations" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {configs.map((config) => (
          <ConfigCard key={config.id} config={config} />
        ))}
      </div>
    </>
  )
}
