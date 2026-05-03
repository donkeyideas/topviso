import { createClient } from '@supabase/supabase-js'
import { Nav } from '@/components/marketing/Nav'
import { Footer } from '@/components/marketing/Footer'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function getPost(slug: string) {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  return data
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Post Not Found' }

  return {
    title: `${post.title} | Top Viso Blog`,
    description: post.excerpt ?? undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: 'article',
      publishedTime: post.published_at ?? undefined,
      images: post.cover_image ? [post.cover_image] : undefined,
    },
  }
}

/** Strip script tags and on* event handlers from HTML */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^>]*>.*?<\/iframe>/gi, '')
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\son\w+\s*=\s*\S+/gi, '')
    .replace(/javascript\s*:/gi, 'blocked:')
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.published_at,
    author: post.author_name
      ? { '@type': 'Person', name: post.author_name }
      : undefined,
    image: post.cover_image ?? undefined,
  }

  const tags = (post.tags as string[] | null) ?? []

  return (
    <>
      <Nav />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article
        style={{
          padding: '60px 32px 80px',
          maxWidth: 760,
          margin: '0 auto',
        }}
      >
        {/* ── Header ── */}
        <header
          style={{
            marginBottom: 48,
            paddingBottom: 32,
            borderBottom: '1px solid var(--color-line)',
          }}
        >
          {/* Breadcrumb */}
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.1em',
              color: 'var(--color-ink-3)',
              marginBottom: 20,
            }}
          >
            <Link
              href="/blog"
              style={{
                color: 'var(--color-accent)',
                textDecoration: 'underline',
                textUnderlineOffset: 2,
              }}
            >
              BLOG
            </Link>
            {' / '}
            <span>{post.title.toUpperCase().slice(0, 40)}{'…'}</span>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                marginBottom: 20,
              }}
            >
              {tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    letterSpacing: '0.1em',
                    fontWeight: 700,
                    padding: '3px 10px',
                    border: '1px solid var(--color-accent)',
                    borderRadius: 4,
                    color: 'var(--color-accent)',
                    textTransform: 'uppercase',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 400,
              fontSize: 'clamp(32px, 5vw, 48px)',
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
              marginBottom: 16,
              color: 'var(--color-ink)',
            }}
          >
            {post.title}
          </h1>

          {/* Meta */}
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--color-ink-3)',
              letterSpacing: '0.04em',
            }}
          >
            {post.author_name && <span>{post.author_name} · </span>}
            {formatDate(post.published_at)}
          </div>
        </header>

        {/* ── Cover Image ── */}
        {post.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover_image}
            alt={post.title}
            style={{
              width: '100%',
              borderRadius: 12,
              marginBottom: 48,
              border: '1px solid var(--color-line)',
            }}
          />
        )}

        {/* ── Content ── */}
        <div
          className="blog-content"
          style={{
            fontSize: 17,
            lineHeight: 1.8,
            color: 'var(--color-ink-2)',
          }}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
        />

        {/* ── Footer ── */}
        <div
          style={{
            marginTop: 64,
            paddingTop: 24,
            borderTop: '1px solid var(--color-line)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Link
            href="/blog"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--color-accent)',
              textDecoration: 'underline',
              textUnderlineOffset: 2,
              letterSpacing: '0.06em',
            }}
          >
            ← BACK TO BLOG
          </Link>
          {post.type && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.12em',
                color: 'var(--color-ink-4)',
                textTransform: 'uppercase',
              }}
            >
              {post.type}
            </span>
          )}
        </div>
      </article>

      <Footer />
    </>
  )
}
