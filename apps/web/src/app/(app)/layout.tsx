import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import '@/components/dashboard/dashboard.css'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  // Check if user has an organization
  const { data: memberships } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .limit(1)

  // If no org, send to onboarding
  if (!memberships || memberships.length === 0) {
    // Allow access to onboarding route
    return <>{children}</>
  }

  return <>{children}</>
}
