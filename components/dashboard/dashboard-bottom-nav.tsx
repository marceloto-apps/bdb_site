"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, Star, Menu, Trophy } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet'
import { DashboardSidebarContent } from './dashboard-sidebar-content'
import { DashboardUserMenu } from './dashboard-user-menu'
import type { User } from 'next-auth'
import Image from 'next/image'

interface DashboardBottomNavProps {
  user: User
}

export function DashboardBottomNav({ user }: DashboardBottomNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const navItems = [
    {
      name: 'Início',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Artigos',
      href: '/artigos',
      icon: BookOpen,
    },
    {
      name: 'Ligas',
      href: '/dashboard/ligas',
      icon: Trophy,
    },
    {
      name: 'Favoritos',
      href: '/dashboard/favoritos',
      icon: Star,
    },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-border bg-background">
      <div className="grid h-full grid-cols-5 items-center justify-items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          )
        })}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center w-full h-full gap-1 text-muted-foreground hover:text-foreground transition-colors">
              <Menu className="h-5 w-5" />
              <span className="text-[10px] font-medium">Mais</span>
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 w-[80vw] sm:w-80 border-l border-border bg-background flex flex-col">
             <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
             
             {/* Header do Sheet (similar ao header da sidebar) */}
             <div className="p-4 border-b border-border flex items-center justify-between">
               <div className="flex items-center">
                 <Image 
                   src="/Logo_Site.png" 
                   alt="Big Data Bet" 
                   width={120} 
                   height={40} 
                   className="object-contain" 
                   priority 
                 />
               </div>
             </div>

             <div className="flex-1 overflow-y-auto">
               <DashboardSidebarContent userRole={user.role} onLinkClick={() => setOpen(false)} />
             </div>

             {/* Footer do Sheet */}
             <div className="p-4 border-t border-border mt-auto">
               <div className="flex items-center gap-3">
                 <DashboardUserMenu user={user} />
                 <div className="flex flex-col overflow-hidden">
                   <span className="text-sm font-medium truncate">{user.name}</span>
                   <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                 </div>
               </div>
             </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
