import { getPlanConfig, type PlanTierConfig } from '@/lib/plan-config'
import { TopStrip } from '@/components/dashboard/TopStrip'
import { PageHero } from '@/components/dashboard/PageHero'

function fmtNum(n: number): string {
  if (n >= 1000) {
    const k = n / 1000
    return `${Number.isInteger(k) ? k : k.toFixed(1)}K`
  }
  return n.toLocaleString()
}

interface TierDef {
  key: 'solo' | 'team' | 'enterprise'
  desc: string
  popular?: boolean
  features: (c: PlanTierConfig) => string[]
  cta: string
  ctaStyle: string
}

const TIERS: TierDef[] = [
  {
    key: 'solo',
    desc: 'For indie developers priced out of serious ASO tools.',
    features: (c) => [
      `${c.apps} app · iOS + Android`,
      `Full keyword intelligence · ${fmtNum(c.keywords)} tracked`,
      'LLM Tracker · 3 engines',
      'REST API · 10K calls/mo',
      'Community support',
    ],
    cta: 'Start 14-day trial',
    ctaStyle: 'ghost',
  },
  {
    key: 'team',
    desc: 'The gap between $9 tools and $2K tools, finally filled.',
    popular: true,
    features: (c) => [
      `Up to ${c.apps} apps`,
      'All 5 LLM engines',
      'Intent Map + CPP manager',
      'Creative Lab with AI variants',
      'Reviews+ auto-routing',
      'Attribution / incrementality',
      'Ad Intel · competitor library',
      'REST API · 250K + webhooks',
    ],
    cta: 'Start 14-day trial',
    ctaStyle: '',
  },
  {
    key: 'enterprise',
    desc: 'For portfolios needing their own pipeline.',
    features: (c) => [
      `Up to ${c.apps} apps, markets`,
      'Agent Readiness module',
      'Raw data exports · warehouse sync',
      'Dedicated LLM polling',
      'Custom attribution models',
      'Private deployment',
      'Named engineer + QBR',
      'SLA 99.95% · SOC 2',
    ],
    cta: 'Contact sales',
    ctaStyle: 'ghost',
  },
]

export default async function PricingPage() {
  const config = await getPlanConfig()

  return (
    <>
      <TopStrip
        breadcrumbs={[
          { label: 'System' },
          { label: 'Pricing', isActive: true },
        ]}
      />

      <PageHero
        title={<>Honest pricing. <em>Unlike incumbents.</em></>}
        subtitle="Every price published. API access at every tier. Fills the $50–$200 gap indie developers were priced out of."
      />

      <div className="content">
        <div className="pricing-grid">
          {TIERS.map((tier) => {
            const plan = config[tier.key]
            const features = tier.features(plan)
            return (
              <div key={tier.key} className={`tier${tier.popular ? ' feat' : ''}`}>
                {tier.popular && <div className="tier-ribbon">Most popular</div>}
                <div className="tier-name">{plan.name}</div>
                <div className="tier-price">
                  ${plan.priceMonthly}<sub>/mo</sub>
                </div>
                <div className="tier-desc">{tier.desc}</div>
                <ul>
                  {features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
                <div className="btn-wrap">
                  <button className={`btn ${tier.ctaStyle}`}>{tier.cta}</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
