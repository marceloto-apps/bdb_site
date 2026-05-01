"use client"

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import type { User } from 'next-auth'
import { Star, History, User as UserIcon, CreditCard, LogOut } from 'lucide-react'

interface DashboardUserMenuProps {
  user: User
}

export function DashboardUserMenu({ user }: DashboardUserMenuProps) {
  const initials = user.name
    ? user.name.substring(0, 2).toUpperCase()
    : 'U'

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20',
    EDITOR: 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border-purple-500/20',
    AUTOR: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20',
    MEMBRO: 'bg-muted text-muted-foreground hover:bg-muted border-border',
  }
  
  const roleColor = roleColors[user.role || 'MEMBRO'] || roleColors.MEMBRO

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer h-9 w-9 border border-border">
          <AvatarImage src={user.image || undefined} alt={user.name || 'Usuário'} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-2 p-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold truncate">{user.name}</span>
            {user.role && user.role !== 'MEMBRO' && (
              <Badge variant="outline" className={`text-[10px] uppercase px-1.5 py-0 h-4 border ${roleColor}`}>
                {user.role}
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground truncate">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/favoritos" className="cursor-pointer w-full flex items-center gap-2">
            <Star className="w-4 h-4" />
            <span>Favoritos</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/historico" className="cursor-pointer w-full flex items-center gap-2">
            <History className="w-4 h-4" />
            <span>Histórico</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/perfil" className="cursor-pointer w-full flex items-center gap-2">
            <UserIcon className="w-4 h-4" />
            <span>Perfil</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/plano" className="cursor-pointer w-full flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            <span>Plano</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })} className="cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-500 flex items-center gap-2">
          <LogOut className="w-4 h-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
