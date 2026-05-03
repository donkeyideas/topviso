interface FeatureImportanceItem {
  feature: string
  detail: string
  shapValue: number // negative = reduces risk, positive = increases risk
}

interface FeatureImportanceBarsProps {
  items: FeatureImportanceItem[]
}

export function FeatureImportanceBars({ items }: FeatureImportanceBarsProps) {
  const maxAbsValue = Math.max(...items.map((item) => Math.abs(item.shapValue)), 0.01)

  return (
    <div>
      {items.map((item, i) => {
        const barWidthPct = (Math.abs(item.shapValue) / maxAbsValue) * 50
        const isNegative = item.shapValue < 0

        return (
          <div key={i} className="fi-row">
            <div className="fi-label">
              {item.feature}
              <small>{item.detail}</small>
            </div>
            <div className="fi-bar">
              <div className="zero-line" />
              {isNegative ? (
                // Negative SHAP = reduces risk = green bar extending LEFT from center
                <div
                  className="f pos"
                  style={{
                    width: `${barWidthPct}%`,
                  }}
                />
              ) : (
                // Positive SHAP = increases risk = red/warn bar extending RIGHT from center
                <div
                  className="f neg"
                  style={{
                    width: `${barWidthPct}%`,
                  }}
                />
              )}
            </div>
            <div
              className="fi-val"
              style={{
                color: isNegative ? 'var(--color-ok)' : 'var(--color-warn)',
              }}
            >
              {item.shapValue > 0 ? '+' : ''}
              {item.shapValue.toFixed(2)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
