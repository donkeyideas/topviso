import { createClient } from '@supabase/supabase-js'
import { Nav } from '@/components/marketing/Nav'
import { Footer } from '@/components/marketing/Footer'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

const SITE = 'https://www.topviso.com'

// Refresh known terms hourly; unknown slugs are rendered on demand.
export const revalidate = 3600

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function getTerm(slug: string) {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .eq('type', 'guide')
    .single()
  return data
}

export async function generateStaticParams() {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('posts')
    .select('slug')
    .eq('status', 'published')
    .eq('type', 'guide')

  return (data ?? []).map((row) => ({ term: row.slug as string }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ term: string }>
}): Promise<Metadata> {
  const { term } = await params
  const post = await getTerm(term)
  if (!post) return { title: 'Term Not Found | Top Viso ASO Glossary' }

  return {
    title: `${post.title} — ASO Glossary | Top Viso`,
    description: post.excerpt ?? undefined,
    alternates: { canonical: `/glossary/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: 'article',
      publishedTime: post.published_at ?? undefined,
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

export default async function GlossaryTermPage({
  params,
}: {
  params: Promise<{ term: string }>
}) {
  const { term } = await params
  const post = await getTerm(term)
  if (!post) notFound()

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'DefinedTerm',
      name: post.title,
      description: post.excerpt ?? undefined,
      url: `${SITE}/glossary/${post.slug}`,
      inDefinedTermSet: {
        '@type': 'DefinedTermSet',
        name: 'Top Viso ASO Glossary',
        url: `${SITE}/glossary`,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'ASO Glossary',
          item: `${SITE}/glossary`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: post.title,
          item: `${SITE}/glossary/${post.slug}`,
        },
      ],
    },
  ]

  const tags = (post.tags as string[] | null) ?? []

  return (
    <>
      <Nav />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article
        style={{ padding: '60px 32px 80px', maxWidth: 760, margin: '0 auto' }}
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
              href="/glossary"
              style={{
                color: 'var(--color-accent)',
                textDecoration: 'underline',
                textUnderlineOffset: 2,
              }}
            >
              ASO GLOSSARY
            </Link>
            {' / '}
            <span>{post.title.toUpperCase()}</span>
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

          {/* Excerpt as lede */}
          {post.excerpt && (
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 18,
                lineHeight: 1.5,
                color: 'var(--color-ink-2)',
              }}
            >
              {post.excerpt}
            </p>
          )}
        </header>

        {/* ── Content ── */}
        <div
          className="blog-content"
          style={{ fontSize: 17, lineHeight: 1.8, color: 'var(--color-ink-2)' }}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
        />

        {/* ── Footer ── */}
        <div
          style={{
            marginTop: 64,
            paddingTop: 24,
            borderTop: '1px solid var(--color-line)',
          }}
        >
          <Link
            href="/glossary"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--color-accent)',
              textDecoration: 'underline',
              textUnderlineOffset: 2,
              letterSpacing: '0.06em',
            }}
          >
            ← BACK TO GLOSSARY
          </Link>
        </div>
      </article>

      <Footer />
    </>
  )
}
