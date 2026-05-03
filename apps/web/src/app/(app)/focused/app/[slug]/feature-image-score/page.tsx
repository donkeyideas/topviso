'use client'

import { useParams } from 'next/navigation'
import { useApp } from '@/hooks/useApp'
import { TopStrip } from '@/components/dashboard/TopStrip'
import { PageHero } from '@/components/dashboard/PageHero'
import { useAnalysis } from '@/hooks/useAnalysis'
import { useGenerate } from '@/hooks/useGenerate'
import type { FeatureImageScoreData, FeatureImageScoreCategory } from '@/lib/analysis-types'
import { analyzeImage } from '@/lib/image-analysis'
import { useState, useCallback, useEffect, useRef } from 'react'

/* ── Score Ring (SVG, matches optimizer style) ─────────────────────── */

function ScoreRing({ score, label = 'IMAGE SCORE' }: { score: number; label?: string }) {
  const size = 140
  const r = 60
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(100, Math.max(0, score)) / 100) * circ
  const color = score >= 70 ? 'var(--color-ok)' : score >= 40 ? '#d97706' : '#ef4444'

  return (
    <div className="score-ring">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle className="ring-bg" cx={size / 2} cy={size / 2} r={r} />
        {score > 0 && (
          <circle className="ring-fg" cx={size / 2} cy={size / 2} r={r}
            style={{ stroke: color, strokeDasharray: circ, strokeDashoffset: offset, transition: 'stroke-dashoffset 0.6s ease' }} />
        )}
      </svg>
      <div className="score-val">
        <span className="sv-num">{score > 0 ? score : '\u2014'}</span>
        <span className="sv-label">{label}</span>
      </div>
    </div>
  )
}

/* ── Score Bar (matches optimizer breakdown style) ─────────────────── */

function ScoreBar({ cat }: { cat: FeatureImageScoreCategory }) {
  const color = cat.score >= 70 ? 'var(--color-ok)' : cat.score >= 40 ? '#d97706' : '#ef4444'
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
        <span style={{ color: 'var(--color-ink-2)' }}>
          {cat.name} <span style={{ fontSize: 10, color: 'var(--color-ink-4)' }}>({cat.weight}%)</span>
        </span>
        <strong style={{ color }}>{cat.score > 0 ? cat.score : '\u2014'}</strong>
      </div>
      <div className="bar">
        <div className="fill" style={{ width: `${Math.min(100, cat.score)}%`, background: color, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────────────── */

export default function FeatureImageScorePage() {
  const params = useParams()
  const slug = params.slug as string
  const { app: appData, loading: appLoading } = useApp(slug)
  const appName = appData?.name ?? ''
  const isAndroid = appData?.platform === 'android'

  const { data, setData, refetch } = useAnalysis<FeatureImageScoreData>(slug, 'feature-image-score')
  const { generate, generating } = useGenerate(slug, 'feature-image-score', { onSuccess: refetch })

  // Store preview — fetch feature graphic URL from live store on load
  const [storeImageUrl, setStoreImageUrl] = useState<string | null>(null)
  const [storeScreenshots, setStoreScreenshots] = useState<string[]>([])

  useEffect(() => {
    // Only fetch store preview for Android — iOS apps don't have a feature graphic
    if (!slug || !isAndroid) return
    fetch(`/api/store-preview?appId=${encodeURIComponent(slug)}`)
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.headerImage) setStoreImageUrl(json.headerImage)
        if (json?.screenshots) setStoreScreenshots(json.screenshots)
      })
      .catch(err => console.error('[feature-image-score]', err))
  }, [slug, isAndroid])

  // Upload state
  const [uploadUrl, setUploadUrl] = useState<string | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setUploadUrl(dataUrl)
      setUploadPreview(dataUrl)
    }
    reader.readAsDataURL(file)
  }, [])

  const [analyzingImage, setAnalyzingImage] = useState(false)

  const handleReset = useCallback(async () => {
    setData(null)
    setUploadUrl(null)
    setUploadPreview(null)
    // Delete from database so it doesn't come back on reload
    if (slug) {
      await fetch(`/api/analysis?appId=${encodeURIComponent(slug)}&type=feature-image-score`, {
        method: 'DELETE',
      }).catch(err => console.error('[feature-image-score]', err))
    }
  }, [setData, slug])

  const handleAnalyze = useCallback(async () => {
    const imgSrc = uploadUrl ?? storeImageUrl ?? data?.featureImageUrl
    if (!imgSrc) {
      // No image available — just call generate and let server fetch from store
      generate()
      return
    }

    // Run client-side Canvas analysis first
    setAnalyzingImage(true)
    try {
      const metrics = await analyzeImage(imgSrc)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params: Record<string, unknown> = { imageMetrics: metrics }
      if (uploadUrl) params.imageUrl = uploadUrl
      generate(params as any)
    } catch {
      // If Canvas analysis fails, still call generate without metrics
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params: Record<string, unknown> = {}
      if (uploadUrl) params.imageUrl = uploadUrl
      generate(params as any)
    } finally {
      setAnalyzingImage(false)
    }
  }, [generate, uploadUrl, storeImageUrl, data?.featureImageUrl])

  const [copiedFindings, setCopiedFindings] = useState(false)
  const [copiedPlaybook, setCopiedPlaybook] = useState(false)
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCopyFindings = useCallback(() => {
    if (!data?.categories?.length) return
    const text = data.categories.map(cat => {
      let block = `${cat.name} — ${cat.score}/100\n`
      if (cat.findings?.length) block += cat.findings.map(f => `  • ${f}`).join('\n') + '\n'
      if (cat.suggestions?.length) block += cat.suggestions.map(s => `  Tip: ${s}`).join('\n') + '\n'
      return block
    }).join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopiedFindings(true)
      if (copyTimeout.current) clearTimeout(copyTimeout.current)
      copyTimeout.current = setTimeout(() => setCopiedFindings(false), 1500)
    })
  }, [data?.categories])

  const handleCopyPlaybook = useCallback(() => {
    if (!data?.recommendations?.length) return
    const text = data.recommendations.map((rec, i) => {
      let block = `${i + 1}. [${rec.priority.toUpperCase()}] ${rec.title}\n   ${rec.detail}\n`
      if (rec.expectedImpact) block += `   Expected impact: ${rec.expectedImpact}\n`
      return block
    }).join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopiedPlaybook(true)
      if (copyTimeout.current) clearTimeout(copyTimeout.current)
      copyTimeout.current = setTimeout(() => setCopiedPlaybook(false), 1500)
    })
  }, [data?.recommendations])

  const categories = data?.categories ?? []
  const recommendations = data?.recommendations ?? []
  const competitors = data?.competitorFeatureImages ?? []

  /* ── Loading skeleton ─────────────────────────────── */
  if (appLoading) {
    return (
      <>
        <TopStrip breadcrumbs={[{ label: '...' }, { label: 'Feature Image', isActive: true }]} />
        <div className="content">
          <div className="card"><div className="card-body">
            <div className="animate-pulse" style={{ height: 300, background: 'var(--color-line)', borderRadius: 8 }} />
          </div></div>
        </div>
      </>
    )
  }

  /* ── Which image to show (upload > live store > old analysis) ── */
  const displayImage = uploadPreview ?? storeImageUrl ?? data?.featureImageUrl

  return (
    <>
      <TopStrip
        breadcrumbs={[
          { label: appName || '\u2014' },
          { label: 'Feature Image Score', isActive: true },
        ]}
      >
        <div className="top-strip-actions">
          {data && (
            <button className="btn" onClick={handleReset} disabled={generating || analyzingImage}
              style={{ fontSize: 12 }}>
              Reset
            </button>
          )}
          <button className="btn accent" onClick={handleAnalyze} disabled={generating || analyzingImage}>
            {analyzingImage ? 'Scanning image\u2026' : generating ? 'Analyzing\u2026' : data ? 'Re-analyze' : 'Analyze Image'}
          </button>
        </div>
      </TopStrip>

      <PageHero
        title={<>Feature graphic, <em>scored</em>.</>}
        subtitle={data?.summary ?? 'AI-powered visual analysis of your app store feature graphic \u2014 with scoring and improvement recommendations.'}
        meta={
          <>
            SCORE &middot; <strong>{data?.overallScore ?? '\u2014'}</strong><br />
            CATEGORIES &middot; <strong>6</strong><br />
            PLATFORM &middot; <strong>{isAndroid ? 'Android' : 'iOS'}</strong>
          </>
        }
      />

      <div className="content">
        <div className="grid-2-1">
          {/* ═══ LEFT COLUMN ═══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* § 01 Feature image preview */}
            <section>
              <div className="section-head">
                <div className="section-head-left">
                  <span className="section-num">&sect; 01</span>
                  <h2>Your feature <em>graphic</em></h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="pill ok" style={{ fontSize: 9, letterSpacing: 1 }}>
                    {data?.uploadedImageUrl ? 'UPLOADED' : 'STORE DATA'}
                  </span>
                </div>
              </div>
              <div className="card">
                <div className="card-body">
                  {displayImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={displayImage}
                      alt="Feature graphic"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      style={{
                        width: '100%', borderRadius: 8,
                        border: '1px solid var(--color-line)',
                        aspectRatio: '1024/500', objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div style={{
                      padding: '3rem 1rem', textAlign: 'center',
                      color: 'var(--color-ink-3)',
                      border: '2px dashed var(--color-line)', borderRadius: 8,
                    }}>
                      <p style={{ marginBottom: 16, fontSize: 14 }}>
                        {isAndroid
                          ? 'No feature graphic found yet. Click "Analyze Image" to pull it from Google Play, or upload one below.'
                          : 'iOS apps do not have a feature graphic. Upload an image to analyze.'}
                      </p>
                      <label style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '9px 14px', background: 'var(--color-ink)',
                        color: 'var(--color-paper)', borderRadius: 4,
                        fontSize: 13, fontWeight: 500, cursor: 'pointer',
                      }}>
                        Upload image
                        <input type="file" accept="image/*" onChange={handleFileUpload}
                          style={{ display: 'none' }} />
                      </label>
                      {uploadPreview && (
                        <div style={{ marginTop: 12, fontSize: 11, color: 'var(--color-ok)' }}>
                          Image ready. Click &quot;Analyze Image&quot; above to score it.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Upload option even when image exists */}
                  {displayImage && (
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <label style={{
                        fontSize: 12, color: 'var(--color-accent)', cursor: 'pointer', fontWeight: 500,
                      }}>
                        Upload different image
                        <input type="file" accept="image/*" onChange={handleFileUpload}
                          style={{ display: 'none' }} />
                      </label>
                      {uploadPreview && !data?.uploadedImageUrl && (
                        <span style={{ fontSize: 11, color: 'var(--color-ok)' }}>
                          New image selected — click Analyze to score
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* § 02 Detailed findings */}
            {categories.length > 0 && (
              <section>
                <div className="section-head">
                  <div className="section-head-left">
                    <span className="section-num">&sect; 02</span>
                    <h2>Detailed <em>findings</em></h2>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={handleCopyFindings}
                      style={{
                        fontSize: 11, padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
                        background: copiedFindings ? 'var(--color-ok)' : 'var(--color-paper-2)',
                        color: copiedFindings ? '#fff' : 'var(--color-ink-3)',
                        border: '1px solid var(--color-line)', fontWeight: 500,
                        transition: 'all 0.2s',
                      }}
                    >
                      {copiedFindings ? 'Copied!' : 'Copy all'}
                    </button>
                    <span className="pill" style={{ fontSize: 9, letterSpacing: 1, background: 'var(--color-accent-wash)', color: 'var(--color-accent)' }}>
                      AI ANALYSIS
                    </span>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body">
                    {categories.map((cat, i) => (
                      <div key={i} style={{ marginBottom: i < categories.length - 1 ? 20 : 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)' }}>{cat.name}</span>
                          <span style={{
                            fontSize: 14, fontWeight: 700,
                            color: cat.score >= 70 ? 'var(--color-ok)' : cat.score >= 40 ? '#d97706' : '#ef4444',
                          }}>
                            {cat.score}/100
                          </span>
                        </div>
                        {cat.findings?.map((f, fi) => (
                          <div key={fi} style={{ fontSize: 12, color: 'var(--color-ink-2)', marginBottom: 4, paddingLeft: 12 }}>
                            &bull; {f}
                          </div>
                        ))}
                        {cat.suggestions?.map((s, si) => (
                          <div key={si} style={{
                            fontSize: 11, color: 'var(--color-accent)',
                            marginTop: 4, paddingLeft: 12, fontStyle: 'italic',
                          }}>
                            Tip: {s}
                          </div>
                        ))}
                        {i < categories.length - 1 && (
                          <div style={{ borderBottom: '1px solid var(--color-line-soft)', marginTop: 16 }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* § 03 Improvement playbook */}
            {recommendations.length > 0 && (
              <section>
                <div className="section-head">
                  <div className="section-head-left">
                    <span className="section-num">&sect; 03</span>
                    <h2>Improvement <em>playbook</em></h2>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={handleCopyPlaybook}
                      style={{
                        fontSize: 11, padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
                        background: copiedPlaybook ? 'var(--color-ok)' : 'var(--color-paper-2)',
                        color: copiedPlaybook ? '#fff' : 'var(--color-ink-3)',
                        border: '1px solid var(--color-line)', fontWeight: 500,
                        transition: 'all 0.2s',
                      }}
                    >
                      {copiedPlaybook ? 'Copied!' : 'Copy all'}
                    </button>
                    <span className="pill" style={{ fontSize: 9, letterSpacing: 1, background: 'var(--color-accent-wash)', color: 'var(--color-accent)' }}>
                      AI ANALYSIS
                    </span>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body">
                    {recommendations.map((rec, i) => (
                      <div className="comp-row" key={i}>
                        <div className="comp-icon" style={{
                          background: rec.priority === 'high' ? '#ef4444' : rec.priority === 'medium' ? '#d97706' : 'var(--color-ok)',
                        }}>{i + 1}</div>
                        <div style={{ flex: 1 }}>
                          <div className="comp-name">{rec.title}</div>
                          <div className="comp-meta">{rec.detail}</div>
                          {rec.expectedImpact && (
                            <div style={{ marginTop: 4, fontSize: 11, color: 'var(--color-accent)', fontWeight: 600 }}>
                              Expected impact: {rec.expectedImpact}
                            </div>
                          )}
                        </div>
                        <span className={`pill ${rec.priority === 'high' ? 'warn' : rec.priority === 'medium' ? 'test' : 'ok'}`}>
                          {rec.priority.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* § 04 Competitor feature graphics */}
            {competitors.length > 0 && (
              <section>
                <div className="section-head">
                  <div className="section-head-left">
                    <span className="section-num">&sect; 04</span>
                    <h2>Competitor <em>graphics</em></h2>
                  </div>
                  <span className="pill ok" style={{ fontSize: 9, letterSpacing: 1 }}>REAL DATA</span>
                </div>
                <div className="card">
                  <div className="card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                      {competitors.map((comp, i) => (
                        <div key={i} style={{ border: '1px solid var(--color-line)', borderRadius: 8, overflow: 'hidden' }}>
                          {comp.imageUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={comp.imageUrl} alt={comp.name}
                              referrerPolicy="no-referrer" crossOrigin="anonymous"
                              style={{ width: '100%', aspectRatio: '1024/500', objectFit: 'cover' }} />
                          ) : (
                            <div style={{
                              width: '100%', aspectRatio: '1024/500',
                              background: 'var(--color-paper-2)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'var(--color-ink-4)', fontSize: 12,
                            }}>
                              No feature graphic
                            </div>
                          )}
                          <div style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600 }}>{comp.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* ═══ RIGHT COLUMN ═══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Score ring card */}
            <div className="card">
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px' }}>
                <ScoreRing score={data?.overallScore ?? 0} />
                <div style={{
                  marginTop: 16, maxWidth: 300, textAlign: 'center',
                  fontSize: 13, color: 'var(--color-ink-3)', fontStyle: 'italic',
                }}>
                  {!data
                    ? 'Run analysis to score your feature graphic.'
                    : data.overallScore >= 80 ? 'Strong metadata. Fine-tune individual fields.'
                    : data.overallScore >= 60 ? 'Good graphic with room for improvement.'
                    : data.overallScore >= 40 ? 'Several areas need attention.'
                    : 'Significant improvements needed to stand out.'}
                </div>
              </div>
            </div>

            {/* Score breakdown */}
            {categories.length > 0 && (
              <div className="card">
                <div className="card-head"><h3>Score breakdown</h3></div>
                <div className="card-body">
                  {categories.map((cat) => (
                    <ScoreBar key={cat.name} cat={cat} />
                  ))}
                </div>
              </div>
            )}

            {/* Strengths */}
            {data?.strengths && data.strengths.length > 0 && (
              <div className="card">
                <div className="card-head"><h3>Strengths</h3></div>
                <div className="card-body">
                  {data.strengths.map((s, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 8, fontSize: 12,
                      color: 'var(--color-ink-2)',
                      marginBottom: i < data.strengths.length - 1 ? 8 : 0,
                    }}>
                      <span style={{ color: 'var(--color-ok)', fontWeight: 600, flexShrink: 0 }}>+</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weaknesses */}
            {data?.weaknesses && data.weaknesses.length > 0 && (
              <div className="card">
                <div className="card-head"><h3>Weaknesses</h3></div>
                <div className="card-body">
                  {data.weaknesses.map((w, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 8, fontSize: 12,
                      color: 'var(--color-ink-2)',
                      marginBottom: i < data.weaknesses.length - 1 ? 8 : 0,
                    }}>
                      <span style={{ color: '#ef4444', fontWeight: 600, flexShrink: 0 }}>&minus;</span>
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Google Play spec reference */}
            {isAndroid && (
              <div className="card">
                <div className="card-head"><h3>Google Play specs</h3></div>
                <div className="card-body">
                  {[
                    { label: 'Feature graphic size', value: '1024 x 500 px' },
                    { label: 'Format', value: 'PNG or JPEG' },
                    { label: 'Max file size', value: '1 MB' },
                    { label: 'Safe zone (text)', value: 'Center 840 x 400 px' },
                  ].map((spec, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between',
                      fontSize: 12, padding: '6px 0',
                      borderBottom: i < 3 ? '1px solid var(--color-line-soft)' : 'none',
                    }}>
                      <span style={{ color: 'var(--color-ink-3)' }}>{spec.label}</span>
                      <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: 11 }}>{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA when no data */}
            {!data && (
              <div className="card">
                <div className="card-body" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <p style={{ fontSize: 13, color: 'var(--color-ink-3)', marginBottom: 12 }}>
                    {isAndroid
                      ? 'Analyze your Google Play feature graphic with AI vision.'
                      : 'Upload a feature image to get AI scoring and recommendations.'}
                  </p>
                  <button className="btn accent" onClick={handleAnalyze} disabled={generating || analyzingImage}>
                    {analyzingImage ? 'Scanning image\u2026' : generating ? 'Analyzing\u2026' : 'Analyze Feature Image'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
