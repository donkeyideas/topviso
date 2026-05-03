import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminShell } from '@/components/admin/AdminShell'
import '@/components/admin/admin.css'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/signin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_superuser, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.is_superuser) {
    redirect('/app')
  }

  const fullName = profile.full_name ?? user.email ?? 'Admin'
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="shell">
      <AdminSidebar userName={fullName} userInitials={initials} />
      <main className="main">
        <Suspense>
          <AdminShell>{children}</AdminShell>
        </Suspense>
      </main>
    </div>
  )
}
