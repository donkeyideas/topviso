export default function DashboardLoading() {
  return (
    <>
      {/* Top strip skeleton */}
      <div className="top-strip">
        <div className="crumb">
          <span style={{ background: 'var(--color-line)', borderRadius: 3, display: 'inline-block', width: 120, height: 12 }} />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="page-hero" style={{ borderBottom: 'none' }}>
        <div>
          <div style={{ background: 'var(--color-line)', borderRadius: 6, width: 320, height: 48, marginBottom: 14 }} />
          <div style={{ background: 'var(--color-line)', borderRadius: 4, width: 480, height: 16 }} />
        </div>
      </div>

      <div className="content">
        <div style={{ background: 'var(--color-line)', borderRadius: 8, width: '100%', height: 200 }} />
      </div>
    </>
  )
}
