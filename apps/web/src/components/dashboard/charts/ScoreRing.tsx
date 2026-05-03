interface ScoreRingProps {
  score: number
  label?: string
}

export function ScoreRing({ score, label = 'out of 100' }: ScoreRingProps) {
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="score-ring">
      <svg viewBox="0 0 140 140">
        <circle className="ring-bg" cx="70" cy="70" r={radius} />
        <circle
          className="ring-fg"
          cx="70"
          cy="70"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="score-val">
        <span className="sv-num">{score}</span>
        <span className="sv-label">{label}</span>
      </div>
    </div>
  )
}
