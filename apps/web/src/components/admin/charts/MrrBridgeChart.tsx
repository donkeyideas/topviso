interface BridgeRow {
  label: string
  sublabel?: string
  value: number
  type: 'start' | 'new' | 'expansion' | 'contraction' | 'churned' | 'end'
  pctWidth: number
}

interface MrrBridgeChartProps {
  rows: BridgeRow[]
}

export function MrrBridgeChart({ rows }: MrrBridgeChartProps) {
  return (
    <div className="mrr-bridge">
      {rows.map((row, i) => {
        const isDivider = i > 0 && (row.type === 'end' || rows[i - 1]?.type === 'start')
        return (
          <div key={i}>
            {isDivider && row.type === 'end' && <div className="bridge-divider" />}
            <div className="bridge-row">
              <div className="br-label">
                {row.label}
                {row.sublabel && <small>{row.sublabel}</small>}
              </div>
              <div className="bridge-track">
                <div
                  className={`bridge-fill ${row.type}`}
                  style={{ width: `${Math.max(row.pctWidth, 2)}%` }}
                >
                  {row.pctWidth > 15 && `$${(row.value / 1000).toFixed(1)}K`}
                </div>
              </div>
              <div
                className={`bridge-value${
                  row.type === 'new' || row.type === 'expansion'
                    ? ' positive'
                    : row.type === 'contraction' || row.type === 'churned'
                      ? ' negative'
                      : ''
                }`}
              >
                ${(Math.abs(row.value) / 1000).toFixed(1)}K
                {row.type !== 'start' && row.type !== 'end' && (
                  <small>
                    {row.type === 'new' || row.type === 'expansion' ? '+' : '−'}
                    {((Math.abs(row.value) / (rows[0]?.value || 1)) * 100).toFixed(1)}%
                  </small>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
