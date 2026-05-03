import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export default async function FocusedIndexPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/signin')

  // Get user's org, then first app
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  if (membership) {
    const { data: app } = await supabase
      .from('apps')
      .select('id')
      .eq('organization_id', membership.organization_id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (app) {
      redirect(`/focused/app/${app.id}/overview`)
    }
  }

  // No apps yet — send to v1 app picker to add one
  redirect('/app')
}
