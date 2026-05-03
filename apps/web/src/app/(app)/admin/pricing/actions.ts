'use server'

import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function savePricing(pricing: Record<string, {
  priceMonthly: number
  apps: number
  keywords: number
  seats: number
}>) {
  const supabase = getSupabaseAdmin()
  await supabase
    .from('admin_config')
    .upsert({ key: 'pricing', value: pricing, updated_at: new Date().toISOString() })
}
