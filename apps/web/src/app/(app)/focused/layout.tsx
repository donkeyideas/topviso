import { getSupabaseServerClient } from '@/lib/supabase/server'
import { SidebarV2 } from '@/components/dashboard/SidebarV2'
import { AppProvider } from '@/contexts/AppContext'
import { GenerateProvider } from '@/contexts/GenerateContext'

export default async function V2DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single()

  // Get user's org, then first app
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user!.id)
    .limit(1)
    .single()

  let app: { id: string; name: string; icon_url: string | null } | null = null
  if (membership) {
    const { data } = await supabase
      .from('apps')
      .select('id, name, icon_url')
      .eq('organization_id', membership.organization_id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()
    app = data
  }

  const fullName = profile?.full_name ?? user?.email ?? 'User'
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="shell">
      <SidebarV2
        {...(app ? {
          appSlug: app.id,
          appName: app.name,
          appIcon: app.name.charAt(0).toUpperCase(),
          ...(app.icon_url ? { appIconUrl: app.icon_url } : {}),
        } : {})}
        userName={fullName}
        userInitials={initials}
        userRole="ADMIN"
      />
      <main className="main-content">
        <AppProvider appId={app?.id ?? null} appName={app?.name ?? null} appIconUrl={app?.icon_url ?? null}>
          <GenerateProvider>
            {children}
          </GenerateProvider>
        </AppProvider>
      </main>
    </div>
  )
}
