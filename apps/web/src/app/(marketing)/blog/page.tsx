import { createClient } from '@supabase/supabase-js'
import { Nav } from '@/components/marketing/Nav'
import { Footer } from '@/components/marketing/Footer'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog | Top Viso — App Store Optimization Intelligence',
  description:
    'Deep dives on ASO strategy, mobile growth, LLM discovery, and the future of app store optimization.',
}

async function getPublishedPosts() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .eq('type', 'blog')
    .order('published_at', { ascending: false })

  return data ?? []
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function BlogPage() {
  const posts = await getPublishedPosts()

  return (
    <>
      <Nav />

      {/* Hero */}
      <section
        className="border-b border-line"
        style={{
          padding: '120px 32px 80px',
          background:
            'linear-gradient(180deg, var(--color-paper) 0%, var(--color-paper-2) 100%)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '700px',
            height: '700px',
            background:
              'radial-gradient(circle, rgba(29,63,217,0.06) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        <div className="relative mx-auto" style={{ maxWidth: '640px' }}>
          <div className="sec-kicker">BLOG</div>
          <h1
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 800,
              fontSize: 'clamp(36px, 6vw, 64px)',
              letterSpacing: '-0.035em',
              lineHeight: 1,
              marginBottom: '20px',
              color: 'var(--color-ink)',
            }}
          >
            Top Viso{' '}
            <em
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 400,
                fontStyle: 'italic',
                color: 'var(--color-accent)',
              }}
            >
              insights
            </em>
            .
          </h1>
          <p
            className="text-ink-2 mx-auto"
            style={{
              fontSize: '19px',
              maxWidth: '480px',
              lineHeight: '1.45',
            }}
          >
            Deep dives on ASO strategy, LLM discovery, creative testing, and
            the future of app growth.
          </p>
        </div>
      </section>

      {/* Posts Grid */}
      <section style={{ padding: '60px 32px' }}>
        <div className="mx-auto" style={{ maxWidth: '900px' }}>
          {posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p
                className="text-ink-3"
                style={{ fontSize: '16px', lineHeight: '1.5' }}
              >
                No posts published yet. Check back soon!
              </p>
            </div>
          ) : (
            <div
              className="grid gap-6"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
            >
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="rounded-2xl border border-line bg-white hover:border-accent"
                  style={{
                    padding: '28px 24px',
                    display: 'block',
                    textDecoration: 'none',
                    transition: 'border-color 0.15s',
                  }}
                >
                  {post.cover_image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      style={{
                        width: '100%',
                        height: 160,
                        objectFit: 'cover',
                        borderRadius: 8,
                        marginBottom: 16,
                      }}
                    />
                  )}
                  {post.tags && (post.tags as string[]).length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        gap: 6,
                        flexWrap: 'wrap',
                        marginBottom: 8,
                      }}
                    >
                      {(post.tags as string[]).slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="font-mono text-accent"
                          style={{
                            fontSize: '10px',
                            letterSpacing: '0.1em',
                            fontWeight: 600,
                          }}
                        >
                          {tag.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  )}
                  <h3
                    className="text-ink font-bold"
                    style={{
                      fontSize: '18px',
                      lineHeight: '1.25',
                      letterSpacing: '-0.01em',
                      marginBottom: 8,
                    }}
                  >
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p
                      className="text-ink-3"
                      style={{
                        fontSize: '14px',
                        lineHeight: '1.5',
                        marginBottom: 12,
                      }}
                    >
                      {post.excerpt}
                    </p>
                  )}
                  <div
                    className="font-mono text-ink-3"
                    style={{ fontSize: '11px' }}
                  >
                    {post.author_name && (
                      <span>
                        {post.author_name} ·{' '}
                      </span>
                    )}
                    {formatDate(post.published_at)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  )
}
