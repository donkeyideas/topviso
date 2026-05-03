import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export async function getSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Partial<ResponseCookie> }>) {
          try {
            for (const cookie of cookiesToSet) {
              cookieStore.set(cookie.name, cookie.value, cookie.options ?? {})
            }
          } catch {
            // Server Component context -- cookies can't be set
          }
        },
      },
    },
  )
}
