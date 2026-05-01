"use client"

import type { User } from 'next-auth'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Sidebar, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarTrigger
} from '@/components/ui/sidebar'
import { DashboardUserMenu } from './dashboard-user-menu'
import { DashboardSidebarContent } from './dashboard-sidebar-content'

interface DashboardSidebarProps {
  user: User
  isMobile?: boolean
}

export function DashboardSidebar({ user, isMobile = false }: DashboardSidebarProps) {
  return (
    <Sidebar collapsible="icon" className={isMobile ? "flex w-full border-none" : "hidden md:flex border-r border-border"}>
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2 flex flex-row items-center justify-between overflow-hidden">
        <Link href="/" className="flex items-center gap-2 overflow-hidden group-data-[collapsible=icon]:justify-center w-full">
          <Image 
            src="/logo-icon.svg" 
            alt="Big Data Bet" 
            width={24} 
            height={24} 
            className="object-contain hidden group-data-[collapsible=icon]:block" 
            priority 
          />
          <Image 
            src="/Logo_Site.png" 
            alt="Big Data Bet" 
            width={140} 
            height={48} 
            className="object-contain group-data-[collapsible=icon]:hidden w-[140px]" 
            priority 
          />
        </Link>
        {!isMobile && <SidebarTrigger />}
      </SidebarHeader>

      <DashboardSidebarContent userRole={user.role} />

      <SidebarFooter className="p-4 group-data-[collapsible=icon]:p-2 border-t border-border mt-auto">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <DashboardUserMenu user={user} />
          <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium truncate">{user.name}</span>
            <span className="text-xs text-muted-foreground truncate">{user.email}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
