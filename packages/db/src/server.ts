import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import type { Database } from './types'

interface CookieStore {
  getAll: () => Array<{ name: string; value: string }>
  set: (name: string, value: string, options?: Record<string, unknown>) => void
}

export function createServerClient(cookieStore: CookieStore) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createSupabaseServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        try {
          for (const cookie of cookiesToSet) {
            cookieStore.set(cookie.name, cookie.value, cookie.options ?? {})
          }
        } catch {
          // Ignore errors in Server Components where cookies can't be set
        }
      },
    },
  })
}
