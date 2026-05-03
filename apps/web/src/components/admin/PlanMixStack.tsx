interface PlanMixData {
  solo: { count: number; mrr: number }
  team: { count: number; mrr: number }
  enterprise: { count: number; mrr: number }
}

interface PlanMixStackProps {
  data: PlanMixData
}

export function PlanMixStack({ data }: PlanMixStackProps) {
  const totalMrr = data.solo.mrr + data.team.mrr + data.enterprise.mrr
  const totalCount = data.solo.count + data.team.count + data.enterprise.count

  const soloArpu = data.solo.count > 0 ? Math.round(data.solo.mrr / data.solo.count) : 0
  const teamArpu = data.team.count > 0 ? Math.round(data.team.mrr / data.team.count) : 0
  const entArpu = data.enterprise.count > 0 ? Math.round(data.enterprise.mrr / data.enterprise.count) : 0
  const totalArpu = totalCount > 0 ? Math.round(totalMrr / totalCount) : 0

  const mrrPcts = {
    solo: totalMrr > 0 ? (data.solo.mrr / totalMrr) * 100 : 0,
    team: totalMrr > 0 ? (data.team.mrr / totalMrr) * 100 : 0,
    enterprise: totalMrr > 0 ? (data.enterprise.mrr / totalMrr) * 100 : 0,
  }

  const countPcts = {
    solo: totalCount > 0 ? (data.solo.count / totalCount) * 100 : 0,
    team: totalCount > 0 ? (data.team.count / totalCount) * 100 : 0,
    enterprise: totalCount > 0 ? (data.enterprise.count / totalCount) * 100 : 0,
  }

  const totalArpuVal = soloArpu + teamArpu + entArpu
  const arpuPcts = {
    solo: totalArpuVal > 0 ? (soloArpu / totalArpuVal) * 100 : 0,
    team: totalArpuVal > 0 ? (teamArpu / totalArpuVal) * 100 : 0,
    enterprise: totalArpuVal > 0 ? (entArpu / totalArpuVal) * 100 : 0,
  }

  const formatMrr = (v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`)

  return (
    <div className="plan-mix-stack">
      <div className="pmx-row">
        <div className="pmx-label">MRR</div>
        <div className="pmx-bar">
          {mrrPcts.solo > 0 && (
            <div className="pmx-seg solo" style={{ width: `${mrrPcts.solo}%` }}>
              {formatMrr(data.solo.mrr)}
            </div>
          )}
          {mrrPcts.team > 0 && (
            <div className="pmx-seg team" style={{ width: `${mrrPcts.team}%` }}>
              {formatMrr(data.team.mrr)}
            </div>
          )}
          {mrrPcts.enterprise > 0 && (
            <div className="pmx-seg enterprise" style={{ width: `${mrrPcts.enterprise}%` }}>
              {formatMrr(data.enterprise.mrr)}
            </div>
          )}
        </div>
        <div className="pmx-value">{formatMrr(totalMrr)}</div>
      </div>

      <div className="pmx-row">
        <div className="pmx-label">CUSTOMERS</div>
        <div className="pmx-bar">
          {countPcts.solo > 0 && (
            <div className="pmx-seg solo" style={{ width: `${countPcts.solo}%` }}>
              {data.solo.count}
            </div>
          )}
          {countPcts.team > 0 && (
            <div className="pmx-seg team" style={{ width: `${countPcts.team}%` }}>
              {data.team.count}
            </div>
          )}
          {countPcts.enterprise > 0 && (
            <div className="pmx-seg enterprise" style={{ width: `${countPcts.enterprise}%` }}>
              {data.enterprise.count}
            </div>
          )}
        </div>
        <div className="pmx-value">{totalCount.toLocaleString()}</div>
      </div>

      <div className="pmx-row">
        <div className="pmx-label">ARPU</div>
        <div className="pmx-bar">
          {arpuPcts.solo > 0 && (
            <div className="pmx-seg solo" style={{ width: `${arpuPcts.solo}%` }}>
              ${soloArpu}
            </div>
          )}
          {arpuPcts.team > 0 && (
            <div className="pmx-seg team" style={{ width: `${arpuPcts.team}%` }}>
              ${teamArpu}
            </div>
          )}
          {arpuPcts.enterprise > 0 && (
            <div className="pmx-seg enterprise" style={{ width: `${arpuPcts.enterprise}%` }}>
              ${entArpu}
            </div>
          )}
        </div>
        <div className="pmx-value">${totalArpu}</div>
      </div>
    </div>
  )
}
