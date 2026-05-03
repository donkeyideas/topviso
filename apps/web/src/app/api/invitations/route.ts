import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { checkSeatLimit } from '@/lib/plan-limits'
import { sendEmail } from '@/lib/email/resend'
import { render as renderInvite, subject as inviteSubject } from '@/lib/email/templates/team-invite'

export async function POST(request: Request) {
  const serverClient = await getSupabaseServerClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { organization_id, email, role } = await request.json()
  if (!organization_id || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // Verify user is owner/admin of this org
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organization_id)
    .eq('user_id', user.id)
    .single()

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Check seat limit
  const limitCheck = await checkSeatLimit(organization_id)
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { error: limitCheck.message, code: 'LIMIT_EXCEEDED', current: limitCheck.current, limit: limitCheck.limit },
      { status: 403 }
    )
  }

  const token = crypto.randomUUID()
  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: invitation, error } = await supabase
    .from('invitations')
    .insert({ organization_id, email, role: role ?? 'member', token, expires_at })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Send invitation email
  try {
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organization_id)
      .single()

    const inviterName = user.user_metadata?.full_name ?? user.email ?? 'A teammate'
    const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.topviso.com'
    const inviteUrl = `${origin}/invite/${token}`

    const html = renderInvite({
      inviterName,
      orgName: org?.name ?? 'your team',
      inviteUrl,
      role: role ?? 'member',
    })

    await sendEmail(email, inviteSubject, html, { emailType: 'invite', userId: user.id })
  } catch (err) {
    console.error('[invitations] Failed to send invite email:', err)
    // Don't fail the invitation — it was already created
  }

  return NextResponse.json({ data: invitation }, { status: 201 })
}
