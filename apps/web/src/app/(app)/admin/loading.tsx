export default function AdminLoading() {
  return (
    <>
      {/* Page head skeleton */}
      <div className="admin-page-head">
        <div style={{ background: 'var(--color-line)', borderRadius: 3, width: 120, height: 10, marginBottom: 16 }} />
        <div style={{ background: 'var(--color-line)', borderRadius: 6, width: 360, height: 44, marginBottom: 12 }} />
        <div style={{ background: 'var(--color-line)', borderRadius: 3, width: 480, height: 14 }} />
      </div>

      {/* Content skeleton */}
      <div className="admin-content">
        {/* KPI grid skeleton */}
        <div className="kpi-grid" style={{ marginBottom: 28 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="kpi" style={{ height: 100 }}>
              <div style={{ background: 'var(--color-line)', borderRadius: 3, width: 80, height: 10, marginBottom: 12 }} />
              <div style={{ background: 'var(--color-line)', borderRadius: 4, width: 100, height: 32 }} />
            </div>
          ))}
        </div>

        {/* Card skeleton */}
        <div className="admin-card" style={{ height: 240 }}>
          <div className="admin-card-head">
            <div style={{ background: 'var(--color-line)', borderRadius: 4, width: 180, height: 20 }} />
          </div>
          <div className="admin-card-body">
            <div style={{ background: 'var(--color-line)', borderRadius: 6, width: '100%', height: 140 }} />
          </div>
        </div>
      </div>
    </>
  )
}
