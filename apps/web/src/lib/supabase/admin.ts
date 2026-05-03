import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

// Server-side admin client — bypasses RLS, use only in API routes
let adminClient: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseAdmin() {
  if (adminClient) return adminClient

  adminClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  return adminClient
}
