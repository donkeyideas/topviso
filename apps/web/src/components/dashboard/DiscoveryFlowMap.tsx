'use client'

interface Surface {
  name: string
  type: 'store' | 'llm'
  estimatedTraffic?: 'high' | 'medium' | 'low'
  optimizationStatus?: 'optimized' | 'partial' | 'unoptimized'
  topQueries?: string[]
}

export function DiscoveryFlowMap({ surfaces, platform }: { surfaces: Surface[]; platform?: 'ios' | 'android' | undefined }) {
  const llm = surfaces.filter(s => s.type === 'llm')
  const stores = surfaces.filter(s => {
    if (s.type !== 'store') return false
    if (!platform) return true
    if (platform === 'ios') return !s.name.toLowerCase().includes('play')
    if (platform === 'android') return !s.name.toLowerCase().includes('app store')
    return true
  })

  // Layout
  const llmX = 20
  const llmW = 140
  const llmH = 46
  const llmGap = 64
  const llmStartY = 90

  const intentX = 440
  const intentW = 100
  const intentH = 80

  const storeX = 770
  const storeW = 110
  const storeH = 50

  const llmTotalH = (llm.length - 1) * llmGap + llmH
  const intentCY = llmStartY + llmTotalH / 2
  const intentY = intentCY - intentH / 2

  const storeGap = Math.max(140, llmTotalH * 0.5)
  const storeTotalH = Math.max(0, (stores.length - 1) * storeGap) + storeH
  const storeStartY = intentCY - storeTotalH / 2

  const vbH = Math.max(llmStartY + llmTotalH + 40, storeStartY + storeTotalH + 40, intentY + intentH + 40)

  function llmLabel(name: string) {
    return name.replace(' recommendations', '').replace(' Search', '')
  }

  function storeLabel(name: string) {
    if (name.includes('App Store')) return { label: 'App Store', sub: 'iOS' }
    if (name.includes('Play')) return { label: 'Google Play', sub: 'ANDROID' }
    return { label: name, sub: '' }
  }

  function statusColor(s: Surface) {
    if (s.optimizationStatus === 'optimized') return 'var(--color-ok, #1f6a3a)'
    if (s.optimizationStatus === 'partial') return 'var(--color-gold, #b58300)'
    return 'var(--color-warn, #c43b1e)'
  }

  function trafficWidth(s: Surface) {
    if (s.estimatedTraffic === 'high') return 3
    if (s.estimatedTraffic === 'medium') return 2
    return 1.5
  }

  function statusDot(status?: string) {
    if (status === 'optimized') return '●'
    if (status === 'partial') return '◐'
    return '○'
  }

  const llmCenterX = llmX + llmW / 2
  const intentCenterX = intentX + intentW / 2
  const storeCenterX = storeX + storeW / 2

  return (
    <svg
      viewBox={`0 0 900 ${vbH}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label="Discovery flow map showing optimization status across all surfaces"
    >
      <defs>
        <marker id="dm-arrow-ok" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
          <path d="M0,0 L10,3.5 L0,7" fill="var(--color-ok, #1f6a3a)" />
        </marker>
        <marker id="dm-arrow-gold" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
          <path d="M0,0 L10,3.5 L0,7" fill="var(--color-gold, #b58300)" />
        </marker>
        <marker id="dm-arrow-warn" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
          <path d="M0,0 L10,3.5 L0,7" fill="var(--color-warn, #c43b1e)" />
        </marker>
        <marker id="dm-arrow-accent" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
          <path d="M0,0 L10,3.5 L0,7" fill="var(--color-accent, #1d3fd9)" />
        </marker>
      </defs>

      {/* Column headers */}
      <g fontFamily="var(--font-mono)" fontSize="10" fill="var(--color-ink-4, #a8a69b)" letterSpacing="1.5">
        <text x={llmCenterX} y={50} textAnchor="middle">{llm.length} AI ASSISTANTS</text>
        <text x={llmCenterX} y={65} textAnchor="middle" fontWeight="500" fill="var(--color-accent, #1d3fd9)">UPSTREAM</text>
        <text x={intentCenterX} y={50} textAnchor="middle">SURFACE LAYER</text>
        <text x={intentCenterX} y={65} textAnchor="middle" fontWeight="500" fill="var(--color-ink, #0e0e0c)">UNIFIED</text>
        <text x={storeCenterX} y={50} textAnchor="middle">{stores.length} {stores.length === 1 ? 'STORE' : 'STORES'}</text>
        <text x={storeCenterX} y={65} textAnchor="middle" fontWeight="500" fill="var(--color-accent, #1d3fd9)">DOWNSTREAM</text>
      </g>

      {/* Curved lines: LLM → Intent — colored by optimization status */}
      {llm.map((s, i) => {
        const fromY = llmStartY + i * llmGap + llmH / 2
        const color = statusColor(s)
        const markerId = s.optimizationStatus === 'optimized' ? 'dm-arrow-ok' : s.optimizationStatus === 'partial' ? 'dm-arrow-gold' : 'dm-arrow-warn'
        return (
          <path
            key={`ll-${i}`}
            d={`M ${llmX + llmW} ${fromY} C ${llmX + llmW + 110} ${fromY}, ${intentX - 60} ${intentCY}, ${intentX} ${intentCY}`}
            fill="none"
            stroke={color}
            strokeWidth={trafficWidth(s)}
            strokeDasharray={s.optimizationStatus === 'unoptimized' ? '4 4' : 'none'}
            opacity={s.optimizationStatus === 'unoptimized' ? 0.5 : 0.8}
            markerEnd={`url(#${markerId})`}
          />
        )
      })}

      {/* Curved lines: Intent → Stores */}
      {stores.map((s, i) => {
        const toY = storeStartY + i * storeGap + storeH / 2
        const color = statusColor(s)
        const markerId = s.optimizationStatus === 'optimized' ? 'dm-arrow-ok' : s.optimizationStatus === 'partial' ? 'dm-arrow-gold' : 'dm-arrow-warn'
        return (
          <path
            key={`sl-${i}`}
            d={`M ${intentX + intentW} ${intentCY} C ${intentX + intentW + 110} ${intentCY}, ${storeX - 60} ${toY}, ${storeX} ${toY}`}
            fill="none"
            stroke={color}
            strokeWidth={trafficWidth(s)}
            markerEnd={`url(#${markerId})`}
            opacity={0.8}
          />
        )
      })}

      {/* LLM boxes — border color reflects status */}
      {llm.map((s, i) => {
        const y = llmStartY + i * llmGap
        const color = statusColor(s)
        return (
          <g key={`lb-${i}`}>
            <rect x={llmX} y={y} width={llmW} height={llmH} rx={6} fill="var(--color-card, #fff)" stroke={color} strokeWidth={1.5} />
            <text x={llmCenterX} y={y + llmH / 2 - 3} textAnchor="middle" fontFamily="var(--font-sans)" fontSize="13" fontWeight="600" fill="var(--color-ink, #0e0e0c)">{llmLabel(s.name)}</text>
            <text x={llmCenterX} y={y + llmH / 2 + 12} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill={color} letterSpacing="1">
              {statusDot(s.optimizationStatus)} {(s.estimatedTraffic ?? 'low').toUpperCase()}
            </text>
          </g>
        )
      })}

      {/* Intent box (dark) */}
      <rect x={intentX} y={intentY} width={intentW} height={intentH} rx={8} fill="var(--color-ink, #0e0e0c)" />
      <text x={intentCenterX} y={intentCY - 2} textAnchor="middle" fontFamily="var(--font-display)" fontSize="18" fill="var(--color-paper, #f4f1ea)" fontStyle="italic">Intent</text>
      <text x={intentCenterX} y={intentCY + 20} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" letterSpacing="2" fill="var(--color-ink-4, #a8a69b)">SEMANTIC</text>

      {/* Store boxes — border color reflects status */}
      {stores.map((s, i) => {
        const y = storeStartY + i * storeGap
        const { label, sub } = storeLabel(s.name)
        const color = statusColor(s)
        return (
          <g key={`sb-${i}`}>
            <rect x={storeX} y={y} width={storeW} height={storeH} rx={6} fill="var(--color-card, #fff)" stroke={color} strokeWidth={2} />
            <text x={storeCenterX} y={y + storeH / 2 + (sub ? -3 : 5)} textAnchor="middle" fontFamily="var(--font-sans)" fontSize="13" fontWeight="600" fill="var(--color-ink, #0e0e0c)">{label}</text>
            {sub && <text x={storeCenterX} y={y + storeH / 2 + 14} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="var(--color-ink-4, #a8a69b)" fontWeight="400">{sub}</text>}
          </g>
        )
      })}

      {/* Legend */}
      <g fontFamily="var(--font-mono)" fontSize="9" letterSpacing="0.5" transform={`translate(20, ${vbH - 20})`}>
        <circle cx={0} cy={-3} r={4} fill="var(--color-ok, #1f6a3a)" />
        <text x={10} y={0} fill="var(--color-ink-3)">Optimized</text>
        <circle cx={80} cy={-3} r={4} fill="var(--color-gold, #b58300)" />
        <text x={90} y={0} fill="var(--color-ink-3)">Partial</text>
        <circle cx={145} cy={-3} r={4} fill="var(--color-warn, #c43b1e)" />
        <text x={155} y={0} fill="var(--color-ink-3)">Unoptimized</text>
        <line x1={225} y1={-3} x2={245} y2={-3} stroke="var(--color-ink-3)" strokeWidth={1.5} strokeDasharray="4 4" />
        <text x={252} y={0} fill="var(--color-ink-3)">Not present</text>
      </g>
    </svg>
  )
}
