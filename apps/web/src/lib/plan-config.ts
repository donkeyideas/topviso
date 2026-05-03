import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { PLANS } from '@/lib/stripe'

export interface PlanTierConfig {
  name: string
  priceMonthly: number
  apps: number
  keywords: number
  seats: number
}

export type PlanConfigMap = Record<'solo' | 'team' | 'enterprise', PlanTierConfig>

function getDefaults(): PlanConfigMap {
  return {
    solo: { name: PLANS.solo.name, priceMonthly: PLANS.solo.priceMonthly, apps: PLANS.solo.apps, keywords: PLANS.solo.keywords, seats: PLANS.solo.seats },
    team: { name: PLANS.team.name, priceMonthly: PLANS.team.priceMonthly, apps: PLANS.team.apps, keywords: PLANS.team.keywords, seats: PLANS.team.seats },
    enterprise: { name: PLANS.enterprise.name, priceMonthly: PLANS.enterprise.priceMonthly, apps: PLANS.enterprise.apps, keywords: PLANS.enterprise.keywords, seats: PLANS.enterprise.seats },
  }
}

/**
 * Reads pricing from admin_config (key = 'pricing'), falls back to PLANS defaults.
 * DB values override defaults per-tier; missing fields keep defaults.
 */
export async function getPlanConfig(): Promise<PlanConfigMap> {
  const defaults = getDefaults()

  try {
    const supabase = getSupabaseAdmin()
    const { data } = await supabase
      .from('admin_config')
      .select('value')
      .eq('key', 'pricing')
      .maybeSingle()

    if (!data?.value) return defaults

    const dbConfig = data.value as Record<string, Partial<PlanTierConfig>>

    for (const tier of ['solo', 'team', 'enterprise'] as const) {
      if (dbConfig[tier]) {
        defaults[tier] = { ...defaults[tier], ...dbConfig[tier] }
      }
    }

    return defaults
  } catch {
    return defaults
  }
}

/**
 * Drop-in replacement for static PLAN_PRICES constant.
 */
export async function getPlanPrices(): Promise<Record<string, number>> {
  const config = await getPlanConfig()
  return {
    solo: config.solo.priceMonthly,
    team: config.team.priceMonthly,
    enterprise: config.enterprise.priceMonthly,
  }
}
