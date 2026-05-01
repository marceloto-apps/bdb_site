import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { DashboardBottomNav } from '@/components/dashboard/dashboard-bottom-nav'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/dashboard')
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background relative">
        <DashboardSidebar user={session.user} />
        
        <SidebarInset className="flex w-full flex-col min-w-0">
          <DashboardHeader user={session.user} />
          
          <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 w-full max-w-full overflow-x-hidden">
            {children}
          </main>
          
          <DashboardBottomNav user={session.user} />
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
