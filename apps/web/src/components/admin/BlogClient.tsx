'use client'

import { useState, useTransition, useRef } from 'react'
import { AdminCard } from '@/components/admin/AdminCard'
import { SectionHead } from '@/components/admin/SectionHead'
import {
  createPost,
  updatePost,
  deletePost,
  generateBlogWithAI,
} from '@/app/(app)/admin/blog/actions'

interface Post {
  id: string
  type: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  cover_image: string | null
  author_name: string | null
  status: string
  tags: string[]
  published_at: string | null
  created_at: string
  updated_at: string
}

interface BlogClientProps {
  blogPosts: Post[]
  guides: Post[]
}

const TOOLBAR_BUTTONS = [
  { label: 'B', tag: 'strong', title: 'Bold' },
  { label: 'I', tag: 'em', title: 'Italic' },
  { label: 'H2', tag: 'h2', title: 'Heading 2' },
  { label: 'H3', tag: 'h3', title: 'Heading 3' },
  { label: 'UL', tag: 'ul', title: 'Unordered List' },
  { label: 'OL', tag: 'ol', title: 'Ordered List' },
  { label: 'BQ', tag: 'blockquote', title: 'Blockquote' },
  { label: 'IMG', tag: 'img', title: 'Image' },
  { label: 'A', tag: 'a', title: 'Link' },
] as const

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
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function BlogClient({ blogPosts, guides }: BlogClientProps) {
  const [activeTab, setActiveTab] = useState<'BLOG POSTS' | 'GUIDES'>(
    'BLOG POSTS',
  )
  const [editing, setEditing] = useState<Post | null>(null)
  const [creating, setCreating] = useState(false)
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [tagsInput, setTagsInput] = useState('')
  const [backlink, setBacklink] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'ok' | 'error'
    msg: string
  } | null>(null)

  const currentType = activeTab === 'BLOG POSTS' ? 'blog' : 'guide'
  const posts = activeTab === 'BLOG POSTS' ? blogPosts : guides

  function resetForm() {
    setTitle('')
    setSlug('')
    setExcerpt('')
    setContent('')
    setCoverImage('')
    setAuthorName('')
    setStatus('draft')
    setTagsInput('')
    setBacklink('')
    setEditing(null)
    setCreating(false)
    setFeedback(null)
  }

  function startEdit(post: Post) {
    setEditing(post)
    setCreating(false)
    setTitle(post.title)
    setSlug(post.slug)
    setExcerpt(post.excerpt ?? '')
    setContent(post.content)
    setCoverImage(post.cover_image ?? '')
    setAuthorName(post.author_name ?? '')
    setStatus(post.status as 'draft' | 'published')
    setTagsInput((post.tags ?? []).join(', '))
    setFeedback(null)
  }

  function startCreate() {
    resetForm()
    setCreating(true)
  }

  function insertTag(tag: string) {
    const ta = textareaRef.current
    if (!ta) return

    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = content.substring(start, end)

    let insertion: string
    if (tag === 'img') {
      const url = prompt('Image URL:')
      if (!url) return
      insertion = `<img src="${url}" alt="${selected || 'image'}" />`
    } else if (tag === 'a') {
      const url = prompt('Link URL:')
      if (!url) return
      insertion = `<a href="${url}">${selected || 'link text'}</a>`
    } else if (tag === 'ul' || tag === 'ol') {
      const items = selected
        ? selected
            .split('\n')
            .map((l) => `  <li>${l}</li>`)
            .join('\n')
        : '  <li>Item</li>'
      insertion = `<${tag}>\n${items}\n</${tag}>`
    } else {
      insertion = `<${tag}>${selected || ''}</${tag}>`
    }

    const newContent =
      content.substring(0, start) + insertion + content.substring(end)
    setContent(newContent)

    setTimeout(() => {
      ta.focus()
      const newPos = start + insertion.length
      ta.setSelectionRange(newPos, newPos)
    }, 0)
  }

  function handleSave() {
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    startTransition(async () => {
      let result: { error: string } | { success: true }

      if (editing) {
        const updateData: Parameters<typeof updatePost>[1] = {
          title,
          slug,
          content,
          status,
          tags,
        }
        if (excerpt) updateData.excerpt = excerpt
        if (coverImage) updateData.cover_image = coverImage
        if (authorName) updateData.author_name = authorName
        result = await updatePost(editing.id, updateData)
      } else {
        const createData: Parameters<typeof createPost>[0] = {
          type: currentType as 'blog' | 'guide',
          title,
          content,
          status,
          tags,
        }
        if (slug) createData.slug = slug
        if (excerpt) createData.excerpt = excerpt
        if (coverImage) createData.cover_image = coverImage
        if (authorName) createData.author_name = authorName
        result = await createPost(createData)
      }

      if ('error' in result) {
        setFeedback({ type: 'error', msg: result.error })
      } else {
        setFeedback({ type: 'ok', msg: 'Saved!' })
        setTimeout(() => resetForm(), 1000)
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this post?')) return
    startTransition(async () => {
      await deletePost(id)
    })
  }

  function handleGenerateAI() {
    if (!title.trim()) {
      setFeedback({ type: 'error', msg: 'Enter a title first' })
      return
    }
    setAiGenerating(true)
    setFeedback(null)
    startTransition(async () => {
      const result = await generateBlogWithAI(
        title,
        currentType as 'blog' | 'guide',
        backlink || undefined,
      )
      setAiGenerating(false)
      if ('error' in result) {
        setFeedback({ type: 'error', msg: result.error })
      } else {
        setContent(result.content)
        setExcerpt(result.excerpt)
        setTagsInput(result.tags.join(', '))
        setFeedback({ type: 'ok', msg: 'AI content generated!' })
      }
    })
  }

  const showForm = creating || editing

  return (
    <>
      {/* Tab Chips */}
      <div className="admin-chip-row" style={{ marginBottom: 20 }}>
        {(['BLOG POSTS', 'GUIDES'] as const).map((tab) => (
          <button
            key={tab}
            className={`admin-chip${activeTab === tab ? ' on' : ''}`}
            onClick={() => {
              setActiveTab(tab)
              resetForm()
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <SectionHead
        number="01"
        title={activeTab === 'BLOG POSTS' ? 'Blog Posts' : 'Guides'}
        actions={
          !showForm && (
            <button
              className="admin-chip on"
              onClick={startCreate}
              style={{ fontSize: 11 }}
            >
              + New {currentType === 'blog' ? 'Post' : 'Guide'}
            </button>
          )
        }
      />

      {/* Editor Form */}
      {showForm && (
        <AdminCard
          title={
            editing ? (
              <>
                Edit <em>post</em>
              </>
            ) : (
              <>
                New <em>{currentType}</em>
              </>
            )
          }
          tag={editing ? 'EDITING' : 'NEW'}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Title */}
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
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  if (!editing && !slug) {
                    // Auto-slug only when creating and slug hasn't been manually set
                  }
                }}
                placeholder="Post title..."
                style={{
                  width: '100%',
                  fontFamily: 'var(--font-display)',
                  fontSize: 18,
                  border: '1px solid var(--color-line)',
                  borderRadius: 6,
                  padding: '8px 12px',
                  outline: 'none',
                  letterSpacing: '-0.02em',
                }}
              />
            </div>

            {/* Slug */}
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
                Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder={
                  title
                    ? title
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '')
                    : 'auto-generated-from-title'
                }
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

            {/* AI Generation Row */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                padding: '8px 12px',
                background: 'var(--color-bg)',
                borderRadius: 6,
                border: '1px solid var(--color-line)',
              }}
            >
              <input
                type="text"
                value={backlink}
                onChange={(e) => setBacklink(e.target.value)}
                placeholder="Optional backlink URL..."
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  border: '1px solid var(--color-line)',
                  borderRadius: 4,
                  padding: '4px 8px',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleGenerateAI}
                disabled={isPending || aiGenerating}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  padding: '6px 14px',
                  border: '1px solid var(--color-accent, #333)',
                  borderRadius: 6,
                  background: 'var(--color-ink)',
                  color: '#fff',
                  cursor: isPending ? 'wait' : 'pointer',
                  opacity: isPending ? 0.6 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {aiGenerating ? 'Generating...' : 'Generate with AI'}
              </button>
            </div>

            {/* HTML Toolbar */}
            <div
              style={{
                display: 'flex',
                gap: 4,
                flexWrap: 'wrap',
              }}
            >
              {TOOLBAR_BUTTONS.map((btn) => (
                <button
                  key={btn.tag}
                  onClick={() => insertTag(btn.tag)}
                  title={btn.title}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '4px 8px',
                    border: '1px solid var(--color-line)',
                    borderRadius: 4,
                    background: 'var(--color-card)',
                    color: 'var(--color-ink)',
                    cursor: 'pointer',
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Content Textarea */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write HTML content..."
              rows={20}
              style={{
                width: '100%',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                border: '1px solid var(--color-line)',
                borderRadius: 6,
                padding: '12px',
                outline: 'none',
                resize: 'vertical',
                lineHeight: 1.6,
              }}
            />

            {/* Excerpt */}
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
                Excerpt / Meta Description
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Short description for SEO..."
                rows={2}
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

            {/* Tags */}
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
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="ASO, keywords, app store..."
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

            {/* Cover Image + Author Row */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-ink-3)',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Cover Image URL
                </label>
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://..."
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
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-ink-3)',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Author Name
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Author..."
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
            </div>

            {/* Status */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-ink-3)',
                }}
              >
                Status:
              </label>
              <button
                onClick={() => setStatus('draft')}
                className={`admin-pill ${status === 'draft' ? 'draft' : ''}`}
                style={{
                  cursor: 'pointer',
                  border: 'none',
                  background:
                    status === 'draft' ? undefined : 'var(--color-bg)',
                }}
              >
                DRAFT
              </button>
              <button
                onClick={() => setStatus('published')}
                className={`admin-pill ${status === 'published' ? 'ok' : ''}`}
                style={{
                  cursor: 'pointer',
                  border: 'none',
                  background:
                    status === 'published' ? undefined : 'var(--color-bg)',
                }}
              >
                PUBLISHED
              </button>
            </div>

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                borderTop: '1px solid var(--color-line)',
                paddingTop: 12,
              }}
            >
              <button
                onClick={handleSave}
                disabled={isPending || !title.trim()}
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
                {isPending ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
              <button
                onClick={resetForm}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  padding: '8px 20px',
                  border: '1px solid var(--color-line)',
                  borderRadius: 6,
                  background: 'var(--color-card)',
                  color: 'var(--color-ink)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              {feedback && (
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color:
                      feedback.type === 'ok'
                        ? 'var(--color-ok, #22863a)'
                        : 'var(--color-error, #cb2431)',
                  }}
                >
                  {feedback.msg}
                </span>
              )}
            </div>
          </div>
        </AdminCard>
      )}

      {/* Post List */}
      {!showForm && posts.length === 0 && (
        <AdminCard
          title={
            activeTab === 'BLOG POSTS' ? 'Blog Posts' : 'Guides'
          }
          tag="0 POSTS"
        >
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                marginBottom: 8,
                letterSpacing: '-0.02em',
              }}
            >
              No {currentType === 'blog' ? 'posts' : 'guides'} yet
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--color-ink-3)',
              }}
            >
              Create your first{' '}
              {currentType === 'blog' ? 'blog post' : 'guide'} to get started.
            </div>
          </div>
        </AdminCard>
      )}

      {!showForm &&
        posts.map((post) => (
          <AdminCard
            key={post.id}
            title={post.title}
            tag={post.status.toUpperCase()}
            actions={
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => startEdit(post)}
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
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
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
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: 0 }}
            >
              <div style={{ ...rowStyle, borderTop: 'none' }}>
                <span style={{ color: 'var(--color-ink-3)' }}>Slug</span>
                <span
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
                >
                  /blog/{post.slug}
                </span>
              </div>
              <div style={rowStyle}>
                <span style={{ color: 'var(--color-ink-3)' }}>Status</span>
                <span
                  className={`admin-pill ${post.status === 'published' ? 'ok' : 'draft'}`}
                >
                  {post.status.toUpperCase()}
                </span>
              </div>
              {post.excerpt && (
                <div style={rowStyle}>
                  <span style={{ color: 'var(--color-ink-3)' }}>
                    Excerpt
                  </span>
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
                    {post.excerpt}
                  </span>
                </div>
              )}
              <div style={rowStyle}>
                <span style={{ color: 'var(--color-ink-3)' }}>
                  Created
                </span>
                <span
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
                >
                  {formatDate(post.created_at)}
                </span>
              </div>
              {post.published_at && (
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
              )}
              {post.tags && post.tags.length > 0 && (
                <div style={rowStyle}>
                  <span style={{ color: 'var(--color-ink-3)' }}>Tags</span>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="admin-pill draft"
                        style={{ fontSize: 9 }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AdminCard>
        ))}
    </>
  )
}
