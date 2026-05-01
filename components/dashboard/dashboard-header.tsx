import Link from 'next/link'
import Image from 'next/image'
import { DashboardUserMenu } from './dashboard-user-menu'
import type { User } from 'next-auth'

interface DashboardHeaderProps {
  user: User
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="md:hidden sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <Image 
            src="/Logo_Site.png" 
            alt="Big Data Bet" 
            width={120} 
            height={40} 
            className="object-contain" 
            priority 
          />
        </Link>
        <DashboardUserMenu user={user} />
      </div>
    </header>
  )
}
