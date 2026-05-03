import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

/** Untyped admin client for admin-specific tables (not yet in generated types) */
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/**
 * Validates the request comes from a superuser.
 * Returns the user ID or a 403 response.
 */
export async function requireSuperuser(request: NextRequest): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }
> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {},
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 },
      ),
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_superuser')
    .eq('id', user.id)
    .single()

  if (!profile?.is_superuser) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'FORBIDDEN', message: 'Superuser access required' },
        { status: 403 },
      ),
    }
  }

  return { ok: true, userId: user.id }
}

/**
 * Writes an entry to admin_audit_log via service-role client.
 */
export async function auditLog(
  actorId: string,
  action: string,
  resourceType?: string,
  resourceId?: string,
  metadata?: Record<string, unknown>,
) {
  const admin = getAdminClient()
  await admin.from('admin_audit_log').insert({
    actor_id: actorId,
    action,
    resource_type: resourceType ?? null,
    resource_id: resourceId ?? null,
    metadata: metadata ?? {},
  })
}

/**
 * Typed success response wrapper.
 */
export function adminResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

/**
 * Typed error response wrapper.
 */
export function adminError(code: string, message: string, status = 400) {
  return NextResponse.json({ error: code, message }, { status })
}
