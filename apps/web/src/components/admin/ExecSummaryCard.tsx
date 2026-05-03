import { SparklineChart } from './charts/SparklineChart'

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^>]*>.*?<\/iframe>/gi, '')
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\son\w+\s*=\s*\S+/gi, '')
    .replace(/javascript\s*:/gi, 'blocked:')
}

interface SparkStat {
  label: string
  value: string
  color?: 'ok' | 'warn' | 'accent'
  sparkData?: number[]
  sparkColor?: string
}

interface ExecSummaryCardProps {
  tagline: string
  narrative: string
  sparks: SparkStat[]
}

export function ExecSummaryCard({ tagline, narrative, sparks }: ExecSummaryCardProps) {
  return (
    <div className="exec-sum">
      <div className="tag">{tagline}</div>
      <h2 dangerouslySetInnerHTML={{ __html: sanitizeHtml(narrative) }} />
      <div className="sparks">
        {sparks.map((s) => (
          <div key={s.label} className="spark">
            {s.label}
            <strong className={s.color ?? ''}>{s.value}</strong>
            {s.sparkData && (
              <SparklineChart
                data={s.sparkData}
                color={
                  s.sparkColor ??
                  (s.color === 'ok' ? '#6dd48e' : s.color === 'warn' ? '#ff8670' : '#1d3fd9')
                }
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
