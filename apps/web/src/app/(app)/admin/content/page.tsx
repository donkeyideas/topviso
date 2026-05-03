import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { AdminCard } from '@/components/admin/AdminCard'

const marketingSections = [
  { key: 'announcement_bar', title: 'Announcement Bar', visible: true },
  { key: 'nav', title: 'Navigation', visible: true },
  { key: 'hero', title: 'Hero', visible: true },
  { key: 'logo_marquee', title: 'Logo Marquee', visible: true },
  { key: 'problem', title: 'Problem Section', visible: true },
  { key: 'features', title: 'Features (10 modules)', visible: true },
  { key: 'testimonials', title: 'Testimonials', visible: true },
  { key: 'comparison', title: 'Comparison (vs Legacy)', visible: true },
  { key: 'pricing', title: 'Pricing (Solo/Team/Enterprise)', visible: true },
  { key: 'final_cta', title: 'Final CTA', visible: true },
  { key: 'footer', title: 'Footer', visible: true },
]

const platformModules = [
  { key: 'llm_discovery', title: 'LLM Discovery', status: 'live' },
  { key: 'keywords', title: 'Keywords + Intent', status: 'live' },
  { key: 'optimizer', title: 'Optimizer', status: 'live' },
  { key: 'competitors', title: 'Competitors', status: 'live' },
  { key: 'reviews', title: 'Reviews+', status: 'live' },
  { key: 'creative_lab', title: 'Creative Lab', status: 'live' },
  { key: 'conversion', title: 'Conversion', status: 'live' },
  { key: 'growth', title: 'Growth', status: 'live' },
  { key: 'localization', title: 'Localization', status: 'live' },
]


export default function ContentManagerPage() {
  return (
    <>
      <AdminPageHead
        category="System"
        title={<>Content <em>manager</em>.</>}
        subtitle="Marketing homepage sections and platform modules."
      />

      <div className="admin-content">
        <div className="admin-grid-1-2">
          {/* Left: Marketing sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <AdminCard title="Homepage Sections" tag="11 SECTIONS">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {marketingSections.map((section, i) => (
                  <div
                    key={section.key}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      borderRadius: 4,
                      border: '1px solid var(--color-line-soft, var(--color-line))',
                      background: '#fff',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-ink-4)', width: 16 }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{section.title}</span>
                    </div>
                    <span className={`admin-pill ${section.visible ? 'ok' : 'draft'}`}>
                      {section.visible ? 'VISIBLE' : 'HIDDEN'}
                    </span>
                  </div>
                ))}
              </div>
            </AdminCard>

          </div>

          {/* Right: Module registry */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <AdminCard title="Platform Modules" tag="9 LIVE">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {platformModules.map((mod, i) => (
                  <div
                    key={mod.key}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      borderRadius: 4,
                      border: '1px solid var(--color-line-soft, var(--color-line))',
                      background: '#fff',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-ink-4)', width: 16 }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{mod.title}</span>
                    </div>
                    <span className={`admin-pill ${mod.status === 'live' ? 'ok' : 'draft'}`}>
                      {mod.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </AdminCard>

            <AdminCard title="Configuration Notes">
              <div style={{ padding: '12px 0' }}>
                <div className="note-strip">
                  Homepage sections, modules, and pricing are currently managed via code. A CMS integration can be added to enable live editing without deployments.
                </div>
              </div>
            </AdminCard>
          </div>
        </div>
      </div>
    </>
  )
}
