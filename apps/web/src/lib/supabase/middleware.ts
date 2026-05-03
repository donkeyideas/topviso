import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Partial<ResponseCookie> }>) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          supabaseResponse = NextResponse.next({ request })
          for (const cookie of cookiesToSet) {
            supabaseResponse.cookies.set(cookie.name, cookie.value, cookie.options ?? {})
          }
        },
      },
    },
  )

  // Refresh the session -- important for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthPage =
    request.nextUrl.pathname.startsWith('/signin') ||
    request.nextUrl.pathname.startsWith('/signup') ||
    request.nextUrl.pathname.startsWith('/verify')

  const isAppPage = request.nextUrl.pathname.startsWith('/app') ||
    request.nextUrl.pathname.startsWith('/focused') ||
    request.nextUrl.pathname.startsWith('/settings') ||
    request.nextUrl.pathname.startsWith('/onboarding') ||
    request.nextUrl.pathname.startsWith('/llm-tracker') ||
    request.nextUrl.pathname.startsWith('/intent-map') ||
    request.nextUrl.pathname.startsWith('/creative-lab') ||
    request.nextUrl.pathname.startsWith('/ad-intel') ||
    request.nextUrl.pathname.startsWith('/market-intel') ||
    request.nextUrl.pathname.startsWith('/attribution') ||
    request.nextUrl.pathname.startsWith('/reviews-plus') ||
    request.nextUrl.pathname.startsWith('/cpps') ||
    request.nextUrl.pathname.startsWith('/agent-ready')

  // Redirect unauthenticated users away from app pages
  if (!user && isAppPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/signin'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/app'
    return NextResponse.redirect(url)
  }

  // Dashboard mode routing: redirect based on user preference
  const pathname = request.nextUrl.pathname
  const isDashboardRoute = pathname.startsWith('/app') || pathname.startsWith('/focused')
  const isExempt = pathname.startsWith('/api/') || pathname.startsWith('/admin') ||
    pathname.startsWith('/settings') || pathname.startsWith('/onboarding') ||
    pathname.startsWith('/pricing')

  if (user && isDashboardRoute && !isExempt) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('dashboard_mode')
      .eq('id', user.id)
      .single()

    const mode = profile?.dashboard_mode ?? 'focused'

    // V1 page name → V2 page name mapping
    const v1ToV2Page: Record<string, string> = {
      'overview-2': 'overview',
      'llm-tracker': 'llm-discovery',
      'attribution': 'growth',
      // V1 pages with no V2 equivalent → land on overview
      'visibility': 'overview',
      'recommendations': 'overview',
      'store-intel': 'overview',
      'discovery-map': 'llm-discovery',
      'strategy': 'overview',
      'update-impact': 'overview',
      'intent-map': 'keywords',
      'ad-intel': 'overview',
      'market-intel': 'competitors',
      'cpps': 'keywords',
      'reviews-plus': 'reviews',
      'agent-ready': 'overview',
      'api-data': 'overview',
    }
    const v2ToV1Page: Record<string, string> = {
      'overview': 'overview-2',
      'llm-discovery': 'llm-tracker',
      'growth': 'attribution',
    }

    if (mode === 'focused' && pathname.startsWith('/app')) {
      const url = request.nextUrl.clone()
      // /app (app picker) stays accessible — don't redirect
      if (pathname === '/app') {
        return supabaseResponse
      }
      // /app/{id}/{page} → /focused/app/{id}/{page}
      const match = pathname.match(/^\/app\/([^/]+)\/(.+)$/)
      if (match) {
        const page = v1ToV2Page[match[2]!] ?? match[2]
        url.pathname = `/focused/app/${match[1]}/${page}`
        return NextResponse.redirect(url)
      }
      // /app/{id} → /focused/app/{id}/overview
      const slugOnly = pathname.match(/^\/app\/([^/]+)\/?$/)
      if (slugOnly) {
        url.pathname = `/focused/app/${slugOnly[1]}/overview`
        return NextResponse.redirect(url)
      }
    }

    if (mode === 'full_suite' && pathname.startsWith('/focused')) {
      const url = request.nextUrl.clone()
      // /focused → /app
      if (pathname === '/focused') {
        url.pathname = '/app'
        return NextResponse.redirect(url)
      }
      // /focused/app/{id}/{page} → /app/{id}/{page}
      const match = pathname.match(/^\/focused\/app\/([^/]+)\/(.+)$/)
      if (match) {
        const page = v2ToV1Page[match[2]!] ?? match[2]
        url.pathname = `/app/${match[1]}/${page}`
        return NextResponse.redirect(url)
      }
      // /focused/app/{id} → /app/{id}/overview-2
      const slugOnly = pathname.match(/^\/focused\/app\/([^/]+)\/?$/)
      if (slugOnly) {
        url.pathname = `/app/${slugOnly[1]}/overview-2`
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
