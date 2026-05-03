'use client'

import { useState, useTransition } from 'react'
import { AdminCard } from '@/components/admin/AdminCard'
import { SectionHead } from '@/components/admin/SectionHead'
import {
  generateSocialPosts,
  updateSocialPost,
  deleteSocialPost,
  bulkApproveDrafts,
  saveAutomationConfig,
  saveCredentials,
} from '@/app/(app)/admin/social-posts/actions'
import type {
  SocialMediaPost,
  SocialPlatform,
  ToneType,
  AutomationConfig,
} from '@/types/social-posts'
import { CHAR_LIMITS, TONE_OPTIONS, PLATFORM_CREDENTIALS } from '@/types/social-posts'

const TABS = [
  'GENERATOR',
  'QUEUE',
  'PUBLISHED',
  'AUTOMATION',
  'CONNECTIONS',
] as const
type Tab = (typeof TABS)[number]

const PLATFORMS: SocialPlatform[] = [
  'TWITTER',
  'LINKEDIN',
  'FACEBOOK',
  'INSTAGRAM',
  'TIKTOK',
]

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 0',
  fontSize: 12,
  borderTop: '1px solid var(--color-line)',
} as const

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface Props {
  initialPosts: SocialMediaPost[]
  initialAutomation: AutomationConfig
  initialCredentials: Record<string, string>
}

export function SocialPostsClient({
  initialPosts,
  initialAutomation,
  initialCredentials,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('GENERATOR')
  const [isPending, startTransition] = useTransition()

  // Generator state
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState<ToneType>('engaging')
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([
    'TWITTER',
    'LINKEDIN',
  ])
  const [generated, setGenerated] = useState<SocialMediaPost[]>([])
  const [genErrors, setGenErrors] = useState<string[]>([])

  // Posts state (locally tracked for reactivity)
  const [posts, setPosts] = useState(initialPosts)

  // Automation state
  const [automation, setAutomation] = useState(initialAutomation)
  const [autoSaved, setAutoSaved] = useState(false)

  // Credentials state
  const [credentials, setCredentials] = useState(initialCredentials)
  const [credSaved, setCredSaved] = useState(false)

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Feedback
  const [feedback, setFeedback] = useState<string | null>(null)

  function handleCopy(post: SocialMediaPost) {
    const hashtags = post.hashtags.length > 0
      ? '\n\n' + post.hashtags.join(' ')
      : ''
    navigator.clipboard.writeText(post.content + hashtags)
    setCopiedId(post.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function togglePlatform(p: SocialPlatform) {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    )
  }

  function handleGenerate() {
    if (selectedPlatforms.length === 0) return
    setGenerated([])
    setGenErrors([])
    startTransition(async () => {
      const genParams: Parameters<typeof generateSocialPosts>[0] = {
        tone,
        platforms: selectedPlatforms,
      }
      if (topic) genParams.topic = topic
      const result = await generateSocialPosts(genParams)
      if ('error' in result) {
        setFeedback(result.error)
      } else {
        setGenerated(result.posts)
        setGenErrors(result.errors)
        setPosts((prev) => [...result.posts, ...prev])
      }
    })
  }

  function handleApprovePost(id: string) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)

    startTransition(async () => {
      const result = await updateSocialPost(id, {
        status: 'SCHEDULED',
        scheduled_at: tomorrow.toISOString(),
      })
      if ('success' in result) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, status: 'SCHEDULED' as const, scheduled_at: tomorrow.toISOString() }
              : p,
          ),
        )
        setGenerated((prev) => prev.filter((p) => p.id !== id))
      }
    })
  }

  function handleDiscardPost(id: string) {
    startTransition(async () => {
      const result = await deleteSocialPost(id)
      if ('success' in result) {
        setPosts((prev) => prev.filter((p) => p.id !== id))
        setGenerated((prev) => prev.filter((p) => p.id !== id))
      }
    })
  }

  function handleDeletePost(id: string) {
    if (!confirm('Delete this post?')) return
    startTransition(async () => {
      const result = await deleteSocialPost(id)
      if ('success' in result) {
        setPosts((prev) => prev.filter((p) => p.id !== id))
      }
    })
  }

  function handleBulkApprove() {
    startTransition(async () => {
      const result = await bulkApproveDrafts()
      if ('success' in result) {
        setFeedback(`${result.count} posts scheduled`)
        setPosts((prev) =>
          prev.map((p) =>
            p.status === 'DRAFT' ? { ...p, status: 'SCHEDULED' as const } : p,
          ),
        )
      }
    })
  }

  function handleSaveAutomation() {
    startTransition(async () => {
      const result = await saveAutomationConfig(automation)
      if ('success' in result) {
        setAutoSaved(true)
        setTimeout(() => setAutoSaved(false), 2000)
      }
    })
  }

  function handleSaveCredentials() {
    startTransition(async () => {
      const result = await saveCredentials(credentials)
      if ('success' in result) {
        setCredSaved(true)
        setTimeout(() => setCredSaved(false), 2000)
      }
    })
  }

  const drafts = posts.filter((p) => p.status === 'DRAFT')
  const scheduled = posts.filter((p) => p.status === 'SCHEDULED')
  const published = posts.filter((p) => p.status === 'PUBLISHED')

  return (
    <>
      {/* Tab Chips */}
      <div className="admin-chip-row" style={{ marginBottom: 20 }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`admin-chip${activeTab === tab ? ' on' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ═══ GENERATOR TAB ══�� */}
      {activeTab === 'GENERATOR' && (
        <>
          <SectionHead number="01" title="Generate Posts" />
          <AdminCard
            title={
              <>
                AI <em>generator</em>
              </>
            }
            tag="DEEPSEEK"
          >
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              {/* Topic */}
              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-ink-3)',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Topic (optional)
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., ASO keyword strategies for 2025..."
                  style={{
                    width: '100%',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    border: '1px solid var(--color-line)',
                    borderRadius: 6,
                    padding: '8px 12px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Tone */}
              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-ink-3)',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Tone
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {TONE_OPTIONS.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTone(t.value)}
                      className={`admin-pill ${tone === t.value ? 'ok' : 'draft'}`}
                      style={{
                        cursor: 'pointer',
                        border: 'none',
                        fontSize: 10,
                      }}
                    >
                      {t.label.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Platforms */}
              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-ink-3)',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Platforms
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {PLATFORMS.map((p) => (
                    <label
                      key={p}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes(p)}
                        onChange={() => togglePlatform(p)}
                      />
                      {p}
                    </label>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div
                style={{
                  borderTop: '1px solid var(--color-line)',
                  paddingTop: 12,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <button
                  onClick={handleGenerate}
                  disabled={isPending || selectedPlatforms.length === 0}
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
                  {isPending ? 'Generating...' : 'Generate Posts'}
                </button>
                {feedback && (
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--color-ink-3)',
                    }}
                  >
                    {feedback}
                  </span>
                )}
              </div>
            </div>
          </AdminCard>

          {/* Generated Posts */}
          {generated.length > 0 && (
            <>
              <SectionHead number="02" title="Generated Posts" />
              {generated.map((post) => {
                const limit = CHAR_LIMITS[post.platform]
                const len = post.content.length
                const overLimit = len > limit

                return (
                  <AdminCard
                    key={post.id}
                    title={post.platform}
                    tag={`${len}/${limit}`}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 13,
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {post.content}
                      </p>
                      {post.hashtags.length > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            gap: 4,
                            flexWrap: 'wrap',
                          }}
                        >
                          {post.hashtags.map((h) => (
                            <span
                              key={h}
                              className="admin-pill draft"
                              style={{ fontSize: 9 }}
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      )}
                      {overLimit && (
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            color: 'var(--color-error, #cb2431)',
                          }}
                        >
                          Over character limit by {len - limit}
                        </span>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          borderTop: '1px solid var(--color-line)',
                          paddingTop: 8,
                        }}
                      >
                        <button
                          onClick={() => handleApprovePost(post.id)}
                          disabled={isPending}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            padding: '4px 12px',
                            border: 'none',
                            borderRadius: 4,
                            background: 'var(--color-ink)',
                            color: '#fff',
                            cursor: 'pointer',
                          }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleCopy(post)}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            padding: '4px 12px',
                            border: '1px solid var(--color-line)',
                            borderRadius: 4,
                            background: 'var(--color-card)',
                            color: copiedId === post.id
                              ? 'var(--color-ok, #22863a)'
                              : 'var(--color-ink)',
                            cursor: 'pointer',
                          }}
                        >
                          {copiedId === post.id ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                          onClick={() => handleDiscardPost(post.id)}
                          disabled={isPending}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            padding: '4px 12px',
                            border: '1px solid var(--color-line)',
                            borderRadius: 4,
                            background: 'var(--color-card)',
                            color: 'var(--color-error, #cb2431)',
                            cursor: 'pointer',
                          }}
                        >
                          Discard
                        </button>
                      </div>
                    </div>
                  </AdminCard>
                )
              })}
              {genErrors.length > 0 && (
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--color-error, #cb2431)',
                    padding: '8px 0',
                  }}
                >
                  Errors: {genErrors.join('; ')}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ���══ QUEUE TAB ��══ */}
      {activeTab === 'QUEUE' && (
        <>
          <SectionHead
            number="01"
            title="Post Queue"
            actions={
              drafts.length > 0 && (
                <button
                  onClick={handleBulkApprove}
                  disabled={isPending}
                  className="admin-chip on"
                  style={{ fontSize: 11 }}
                >
                  Approve All Drafts
                </button>
              )
            }
          />
          {[...drafts, ...scheduled].length === 0 ? (
            <AdminCard title="Queue" tag="EMPTY">
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-display)',
                  fontSize: 20,
                  letterSpacing: '-0.02em',
                }}
              >
                No posts in queue
              </div>
            </AdminCard>
          ) : (
            [...drafts, ...scheduled].map((post) => (
              <AdminCard
                key={post.id}
                title={post.platform}
                tag={post.status}
                actions={
                  <div style={{ display: 'flex', gap: 6 }}>
                    {post.status === 'DRAFT' && (
                      <button
                        onClick={() => handleApprovePost(post.id)}
                        disabled={isPending}
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
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => handleCopy(post)}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        padding: '3px 10px',
                        border: '1px solid var(--color-line)',
                        borderRadius: 4,
                        background: 'var(--color-card)',
                        color: copiedId === post.id
                          ? 'var(--color-ok, #22863a)'
                          : 'var(--color-ink)',
                        cursor: 'pointer',
                      }}
                    >
                      {copiedId === post.id ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      disabled={isPending}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        padding: '3px 10px',
                        border: '1px solid var(--color-line)',
                        borderRadius: 4,
                        background: 'var(--color-card)',
                        color: 'var(--color-error, #cb2431)',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <div style={{ ...rowStyle, borderTop: 'none' }}>
                    <span style={{ color: 'var(--color-ink-3)' }}>Status</span>
                    <span
                      className={`admin-pill ${post.status === 'SCHEDULED' ? 'ok' : 'draft'}`}
                    >
                      {post.status}
                    </span>
                  </div>
                  <div style={rowStyle}>
                    <span style={{ color: 'var(--color-ink-3)' }}>Content</span>
                    <span
                      style={{
                        fontSize: 11,
                        maxWidth: 400,
                        textAlign: 'right',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {post.content.slice(0, 80)}
                      {post.content.length > 80 ? '...' : ''}
                    </span>
                  </div>
                  {post.scheduled_at && (
                    <div style={rowStyle}>
                      <span style={{ color: 'var(--color-ink-3)' }}>
                        Scheduled
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                        }}
                      >
                        {formatDate(post.scheduled_at)}
                      </span>
                    </div>
                  )}
                  <div style={rowStyle}>
                    <span style={{ color: 'var(--color-ink-3)' }}>Created</span>
                    <span
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
                    >
                      {formatDate(post.created_at)}
                    </span>
                  </div>
                </div>
              </AdminCard>
            ))
          )}
        </>
      )}

      {/* ═══ PUBLISHED TAB ═══ */}
      {activeTab === 'PUBLISHED' && (
        <>
          <SectionHead number="01" title="Published Posts" />
          {published.length === 0 ? (
            <AdminCard title="Published" tag="EMPTY">
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-display)',
                  fontSize: 20,
                  letterSpacing: '-0.02em',
                }}
              >
                No published posts yet
              </div>
            </AdminCard>
          ) : (
            published.map((post) => (
              <AdminCard
                key={post.id}
                title={post.platform}
                tag="PUBLISHED"
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <div style={{ ...rowStyle, borderTop: 'none' }}>
                    <span style={{ color: 'var(--color-ink-3)' }}>Content</span>
                    <span style={{ fontSize: 11, maxWidth: 400, textAlign: 'right' }}>
                      {post.content.slice(0, 100)}
                      {post.content.length > 100 ? '...' : ''}
                    </span>
                  </div>
                  {post.hashtags.length > 0 && (
                    <div style={rowStyle}>
                      <span style={{ color: 'var(--color-ink-3)' }}>
                        Hashtags
                      </span>
                      <span style={{ fontSize: 11 }}>
                        {post.hashtags.join(' ')}
                      </span>
                    </div>
                  )}
                  <div style={rowStyle}>
                    <span style={{ color: 'var(--color-ink-3)' }}>
                      Published
                    </span>
                    <span
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
                    >
                      {formatDate(post.published_at)}
                    </span>
                  </div>
                </div>
              </AdminCard>
            ))
          )}
        </>
      )}

      {/* ═══ AUTOMATION TAB ═══ */}
      {activeTab === 'AUTOMATION' && (
        <>
          <SectionHead number="01" title="Automation Settings" />
          <AdminCard
            title={
              <>
                Automation <em>config</em>
              </>
            }
            tag={automation.enabled ? 'ACTIVE' : 'INACTIVE'}
          >
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              {/* Enable toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label
                  style={{
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={automation.enabled}
                    onChange={(e) =>
                      setAutomation((prev) => ({
                        ...prev,
                        enabled: e.target.checked,
                      }))
                    }
                  />
                  Enable automatic post generation
                </label>
              </div>

              {/* Platform checkboxes */}
              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-ink-3)',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Platforms
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {PLATFORMS.map((p) => (
                    <label
                      key={p}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={automation.platforms.includes(p)}
                        onChange={(e) =>
                          setAutomation((prev) => ({
                            ...prev,
                            platforms: e.target.checked
                              ? [...prev.platforms, p]
                              : prev.platforms.filter((x) => x !== p),
                          }))
                        }
                      />
                      {p}
                    </label>
                  ))}
                </div>
              </div>

              {/* Schedule hour */}
              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-ink-3)',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Schedule Hour (UTC)
                </label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={automation.hour}
                  onChange={(e) =>
                    setAutomation((prev) => ({
                      ...prev,
                      hour: parseInt(e.target.value) || 0,
                    }))
                  }
                  style={{
                    width: 80,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    border: '1px solid var(--color-line)',
                    borderRadius: 6,
                    padding: '6px 12px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Topics */}
              <div>
                <label
                  style={{
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-ink-3)',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Topics (one per line)
                </label>
                <textarea
                  value={automation.topics.join('\n')}
                  onChange={(e) =>
                    setAutomation((prev) => ({
                      ...prev,
                      topics: e.target.value.split('\n').filter(Boolean),
                    }))
                  }
                  rows={4}
                  placeholder="ASO keyword research&#10;Mobile growth hacks&#10;App store trends"
                  style={{
                    width: '100%',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    border: '1px solid var(--color-line)',
                    borderRadius: 6,
                    padding: '8px 12px',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', gap: 20 }}>
                <label
                  style={{
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={automation.useDomainContent}
                    onChange={(e) =>
                      setAutomation((prev) => ({
                        ...prev,
                        useDomainContent: e.target.checked,
                      }))
                    }
                  />
                  Use domain content
                </label>
                <label
                  style={{
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={automation.requireApproval}
                    onChange={(e) =>
                      setAutomation((prev) => ({
                        ...prev,
                        requireApproval: e.target.checked,
                      }))
                    }
                  />
                  Require approval
                </label>
              </div>

              {/* Save */}
              <div
                style={{
                  borderTop: '1px solid var(--color-line)',
                  paddingTop: 12,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <button
                  onClick={handleSaveAutomation}
                  disabled={isPending}
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
                  {isPending ? 'Saving...' : 'Save Configuration'}
                </button>
                {autoSaved && (
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--color-ok, #22863a)',
                    }}
                  >
                    Saved!
                  </span>
                )}
              </div>
            </div>
          </AdminCard>
        </>
      )}

      {/* ═══ CONNECTIONS TAB ═══ */}
      {activeTab === 'CONNECTIONS' && (
        <>
          <SectionHead number="01" title="Platform Connections" />
          {PLATFORMS.map((platform) => {
            const fields = PLATFORM_CREDENTIALS[platform] ?? []
            return (
              <AdminCard
                key={platform}
                title={platform}
                tag={
                  fields.some((f) => credentials[f.key])
                    ? 'CONNECTED'
                    : 'NOT SET'
                }
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  {fields.map((field) => (
                    <div key={field.key}>
                      <label
                        style={{
                          fontSize: 11,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--color-ink-3)',
                          display: 'block',
                          marginBottom: 4,
                        }}
                      >
                        {field.label}
                      </label>
                      <input
                        type="password"
                        value={credentials[field.key] ?? ''}
                        onChange={(e) =>
                          setCredentials((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                        placeholder={`Enter ${field.label}...`}
                        style={{
                          width: '100%',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          border: '1px solid var(--color-line)',
                          borderRadius: 6,
                          padding: '6px 12px',
                          outline: 'none',
                        }}
                      />
                    </div>
                  ))}
                </div>
              </AdminCard>
            )
          })}

          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              marginTop: 12,
            }}
          >
            <button
              onClick={handleSaveCredentials}
              disabled={isPending}
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
              {isPending ? 'Saving...' : 'Save All Credentials'}
            </button>
            {credSaved && (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--color-ok, #22863a)',
                }}
              >
                Saved!
              </span>
            )}
          </div>
        </>
      )}
    </>
  )
}
