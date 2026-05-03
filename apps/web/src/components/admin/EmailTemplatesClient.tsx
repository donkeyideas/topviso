'use client'

import { useState, useTransition } from 'react'
import { AdminCard } from '@/components/admin/AdminCard'
import { SectionHead } from '@/components/admin/SectionHead'
import {
  getEmailTemplatePreview,
  sendTestEmail,
} from '@/app/(app)/admin/email-templates/actions'
import type { EmailTemplate } from '@/lib/email/template-registry'

interface Props {
  templates: EmailTemplate[]
}

const CATEGORIES = [
  { key: 'transactional', label: 'Transactional' },
  { key: 'lifecycle', label: 'Lifecycle' },
  { key: 'notification', label: 'Notification' },
  { key: 'auth', label: 'Authentication' },
] as const

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 0',
  fontSize: 12,
  borderTop: '1px solid var(--color-line)',
} as const

const modalOverlay: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
}

const modalBox: React.CSSProperties = {
  background: 'var(--color-card, #fff)',
  borderRadius: 12,
  border: '1px solid var(--color-line)',
  maxWidth: 700,
  width: '90vw',
  maxHeight: '85vh',
  overflow: 'auto',
  boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
}

export function EmailTemplatesClient({ templates }: Props) {
  const [isPending, startTransition] = useTransition()

  // Preview modal
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(
    null,
  )
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewSubject, setPreviewSubject] = useState('')
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>(
    'desktop',
  )

  // Send test modal
  const [testTemplate, setTestTemplate] = useState<EmailTemplate | null>(null)
  const [testEmail, setTestEmail] = useState('')
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  function handlePreview(template: EmailTemplate) {
    setPreviewTemplate(template)
    setPreviewHtml('')
    setPreviewSubject('')
    setPreviewDevice('desktop')
    startTransition(async () => {
      const result = await getEmailTemplatePreview(template.id)
      if ('error' in result) {
        setPreviewHtml(
          `<div style="padding:40px;text-align:center;color:#cb2431;">${result.error}</div>`,
        )
      } else {
        setPreviewHtml(result.html)
        setPreviewSubject(result.subject)
      }
    })
  }

  function handleSendTest(template: EmailTemplate) {
    setTestTemplate(template)
    setTestEmail('')
    setTestResult(null)
  }

  function doSendTest() {
    if (!testEmail.trim() || !testTemplate) return
    startTransition(async () => {
      const result = await sendTestEmail(testTemplate.id, testEmail.trim())
      setTestResult({
        success: result.success,
        message: result.success
          ? `Test email sent to ${testEmail}`
          : result.error ?? 'Send failed',
      })
    })
  }

  return (
    <>
      {CATEGORIES.map((cat, idx) => {
        const catTemplates = templates.filter((t) => t.category === cat.key)
        if (catTemplates.length === 0) return null

        return (
          <div key={cat.key}>
            <SectionHead
              number={String(idx + 1).padStart(2, '0')}
              title={cat.label}
            />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {catTemplates.map((tmpl) => (
                <AdminCard
                  key={tmpl.id}
                  title={tmpl.name}
                  tag={cat.key.toUpperCase()}
                  actions={
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handlePreview(tmpl)}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          padding: '3px 10px',
                          border: '1px solid var(--color-line)',
                          borderRadius: 4,
                          background: 'var(--color-card)',
                          color: 'var(--color-ink)',
                          cursor: 'pointer',
                        }}
                      >
                        Preview
                      </button>
                      {tmpl.canSendTest && (
                        <button
                          onClick={() => handleSendTest(tmpl)}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            padding: '3px 10px',
                            border: '1px solid var(--color-line)',
                            borderRadius: 4,
                            background: 'var(--color-ink)',
                            color: '#fff',
                            cursor: 'pointer',
                          }}
                        >
                          Send Test
                        </button>
                      )}
                    </div>
                  }
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0,
                    }}
                  >
                    <div style={{ ...rowStyle, borderTop: 'none' }}>
                      <span style={{ color: 'var(--color-ink-3)' }}>
                        Description
                      </span>
                      <span style={{ fontSize: 11 }}>{tmpl.description}</span>
                    </div>
                    <div style={rowStyle}>
                      <span style={{ color: 'var(--color-ink-3)' }}>
                        Trigger
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                        }}
                      >
                        {tmpl.trigger}
                      </span>
                    </div>
                    <div style={rowStyle}>
                      <span style={{ color: 'var(--color-ink-3)' }}>
                        Subject
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                        }}
                      >
                        {tmpl.subject}
                      </span>
                    </div>
                    <div style={rowStyle}>
                      <span style={{ color: 'var(--color-ink-3)' }}>
                        Testable
                      </span>
                      <span
                        className={`admin-pill ${tmpl.canSendTest ? 'ok' : 'draft'}`}
                      >
                        {tmpl.canSendTest ? 'YES' : 'NO'}
                      </span>
                    </div>
                    {tmpl.category === 'auth' && (
                      <div style={rowStyle}>
                        <span style={{ color: 'var(--color-ink-3)' }}>
                          Managed by
                        </span>
                        <span
                          className="admin-pill draft"
                          style={{ fontSize: 9 }}
                        >
                          SUPABASE DASHBOARD
                        </span>
                      </div>
                    )}
                  </div>
                </AdminCard>
              ))}
            </div>
          </div>
        )
      })}

      {/* ═══ PREVIEW MODAL ═══ */}
      {previewTemplate && (
        <div
          style={modalOverlay}
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            style={modalBox}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--color-line)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {previewTemplate.name}
                </div>
                {previewSubject && (
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--color-ink-3)',
                      marginTop: 2,
                    }}
                  >
                    Subject: {previewSubject}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`admin-pill ${previewDevice === 'desktop' ? 'ok' : 'draft'}`}
                  style={{ cursor: 'pointer', border: 'none', fontSize: 9 }}
                >
                  DESKTOP
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`admin-pill ${previewDevice === 'mobile' ? 'ok' : 'draft'}`}
                  style={{ cursor: 'pointer', border: 'none', fontSize: 9 }}
                >
                  MOBILE
                </button>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 14,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-ink-3)',
                    padding: '0 4px',
                  }}
                >
                  ×
                </button>
              </div>
            </div>
            <div
              style={{
                padding: 20,
                display: 'flex',
                justifyContent: 'center',
                background: '#f5f5f0',
                minHeight: 400,
              }}
            >
              {isPending ? (
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: 'var(--color-ink-3)',
                    padding: 40,
                  }}
                >
                  Loading preview...
                </div>
              ) : (
                <iframe
                  srcDoc={previewHtml}
                  title="Email Preview"
                  style={{
                    width: previewDevice === 'desktop' ? 600 : 375,
                    height: 600,
                    border: '1px solid var(--color-line)',
                    borderRadius: 8,
                    background: '#fff',
                    transition: 'width 0.2s',
                  }}
                />
              )}
            </div>
            {previewTemplate.canSendTest && (
              <div
                style={{
                  padding: '12px 20px',
                  borderTop: '1px solid var(--color-line)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  onClick={() => {
                    setPreviewTemplate(null)
                    handleSendTest(previewTemplate)
                  }}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    padding: '6px 16px',
                    border: 'none',
                    borderRadius: 6,
                    background: 'var(--color-ink)',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Send Test Email
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ SEND TEST MODAL ═══ */}
      {testTemplate && (
        <div
          style={modalOverlay}
          onClick={() => setTestTemplate(null)}
        >
          <div
            style={{ ...modalBox, maxWidth: 440 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--color-line)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                }}
              >
                Send Test: {testTemplate.name}
              </div>
              <button
                onClick={() => setTestTemplate(null)}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 14,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-ink-3)',
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: 20 }}>
              <label
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-ink-3)',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Recipient Email
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') doSendTest()
                }}
                style={{
                  width: '100%',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  border: '1px solid var(--color-line)',
                  borderRadius: 6,
                  padding: '10px 14px',
                  outline: 'none',
                  marginBottom: 16,
                }}
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={doSendTest}
                  disabled={isPending || !testEmail.trim()}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    padding: '8px 20px',
                    border: 'none',
                    borderRadius: 6,
                    background: 'var(--color-ink)',
                    color: '#fff',
                    cursor: isPending ? 'wait' : 'pointer',
                    opacity: isPending ? 0.6 : 1,
                  }}
                >
                  {isPending ? 'Sending...' : 'Send Test'}
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
          </div>
        </div>
      )}
    </>
  )
}
