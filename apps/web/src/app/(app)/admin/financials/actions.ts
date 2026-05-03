'use server'

import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function saveCogs(cogs: Record<string, number>) {
  const supabase = getSupabaseAdmin()
  await supabase
    .from('admin_config')
    .upsert({ key: 'cogs', value: cogs, updated_at: new Date().toISOString() })
}

export async function saveOpex(opex: Record<string, number>) {
  const supabase = getSupabaseAdmin()
  await supabase
    .from('admin_config')
    .upsert({ key: 'opex', value: opex, updated_at: new Date().toISOString() })
}
