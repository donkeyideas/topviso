import { createClient } from '@supabase/supabase-js'
import { Nav } from '@/components/marketing/Nav'
import { Footer } from '@/components/marketing/Footer'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ASO Glossary — App Store Optimization Terms & Definitions | Top Viso',
  description:
    'A plain-English glossary of app store optimization (ASO) terms — keyword density, conversion rate optimization, Apple Search Tags, and more. Definitions for the AI era.',
  alternates: { canonical: '/glossary' },
}

// Re-query published guides at most once an hour so newly seeded terms appear
// without a full rebuild.
export const revalidate = 3600

async function getPublishedGuides() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data } = await supabase
    .from('posts')
    .select('slug, title, excerpt, tags')
    .eq('status', 'published')
    .eq('type', 'guide')
    .order('title', { ascending: true })

  return data ?? []
}

export default async function GlossaryPage() {
  const terms = await getPublishedGuides()

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
        <div className="relative mx-auto" style={{ maxWidth: '640px' }}>
          <div className="sec-kicker">ASO GLOSSARY</div>
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
            The language of{' '}
            <em
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 400,
                fontStyle: 'italic',
                color: 'var(--color-accent)',
              }}
            >
              app discovery
            </em>
            .
          </h1>
          <p
            className="text-ink-2 mx-auto"
            style={{ fontSize: '19px', maxWidth: '480px', lineHeight: '1.45' }}
          >
            Plain-English definitions for every app store optimization term that
            matters — from keyword density to LLM citations.
          </p>
        </div>
      </section>

      {/* Terms Grid */}
      <section style={{ padding: '60px 32px' }}>
        <div className="mx-auto" style={{ maxWidth: '900px' }}>
          {terms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p
                className="text-ink-3"
                style={{ fontSize: '16px', lineHeight: '1.5' }}
              >
                The glossary is coming soon. Check back shortly!
              </p>
            </div>
          ) : (
            <div
              className="grid gap-6"
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              }}
            >
              {terms.map((term) => (
                <Link
                  key={term.slug}
                  href={`/glossary/${term.slug}`}
                  className="rounded-2xl border border-line bg-white hover:border-accent"
                  style={{
                    padding: '28px 24px',
                    display: 'block',
                    textDecoration: 'none',
                    transition: 'border-color 0.15s',
                  }}
                >
                  {term.tags && (term.tags as string[]).length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        gap: 6,
                        flexWrap: 'wrap',
                        marginBottom: 8,
                      }}
                    >
                      {(term.tags as string[]).slice(0, 3).map((tag) => (
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
                    {term.title}
                  </h3>
                  {term.excerpt && (
                    <p
                      className="text-ink-3"
                      style={{ fontSize: '14px', lineHeight: '1.5' }}
                    >
                      {term.excerpt}
                    </p>
                  )}
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
