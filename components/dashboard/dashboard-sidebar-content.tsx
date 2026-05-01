"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem 
} from '@/components/ui/sidebar'
import { 
  LayoutDashboard,
  FileSpreadsheet,
  MessageCircle,
  Wallet,
  Calculator,
  FlaskConical,
  ShieldAlert,
  ArrowUpDown,
  TrendingUp,
  GraduationCap, 
  Trophy, 
  FileText, 
  FileEdit, 
  Tags
} from 'lucide-react'

interface DashboardSidebarContentProps {
  userRole?: string
  onLinkClick?: () => void
}

export function DashboardSidebarContent({ userRole, onLinkClick }: DashboardSidebarContentProps) {
  const pathname = usePathname()

  const isAuthorPlus = userRole === 'ADMIN' || userRole === 'EDITOR' || userRole === 'AUTOR'
  const isEditorPlus = userRole === 'ADMIN' || userRole === 'EDITOR'
  const isAdmin = userRole === 'ADMIN'

  return (
    <SidebarContent onClick={(e) => {
      // Se clicou num link (tag A) ou dentro de um, dispara onLinkClick
      if (onLinkClick && (e.target as HTMLElement).closest('a')) {
        onLinkClick()
      }
    }}>
      <SidebarGroup>
        <SidebarGroupLabel>PRINCIPAL</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/dashboard'} tooltip="Visão Geral">
              <Link href="/dashboard">
                <LayoutDashboard />
                <span>Visão Geral</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>CONTEÚDO</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/dashboard/planilhas'} tooltip="Planilhas">
              <Link href="/dashboard/planilhas">
                <FileSpreadsheet />
                <span>Planilhas</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/dashboard/grupos-de-tips'} tooltip="Grupos de Tips">
              <Link href="/dashboard/grupos-de-tips">
                <MessageCircle />
                <span>Grupos de Tips</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

        </SidebarMenu>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>GESTÃO</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/dashboard/banca'} tooltip="Banca">
              <Link href="/dashboard/banca">
                <Wallet />
                <span>Banca</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/dashboard/metodos'} tooltip="Métodos">
              <Link href="/dashboard/metodos">
                <Calculator />
                <span>Métodos</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>FERRAMENTAS</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/dashboard/backtest'} tooltip="Backtest">
              <Link href="/dashboard/backtest">
                <FlaskConical />
                <span>Backtest</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/dashboard/validacao-de-risco'} tooltip="Validação de Risco">
              <Link href="/dashboard/validacao-de-risco">
                <ShieldAlert />
                <span>Validação de Risco</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/dashboard/over-under'} tooltip="Cálculo Over/Under">
              <Link href="/dashboard/over-under">
                <ArrowUpDown />
                <span>Cálculo Over/Under</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/dashboard/distribuicao-ah'} tooltip="Distribuição AH">
              <Link href="/dashboard/distribuicao-ah">
                <TrendingUp />
                <span>Distribuição AH</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>CURSO</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/curso'} tooltip="Aulas">
              <Link href="/curso">
                <GraduationCap />
                <span>Aulas</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/dashboard/progresso'} tooltip="Meu Progresso">
              <Link href="/dashboard/progresso">
                <Trophy />
                <span>Meu Progresso</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>



      {isAuthorPlus && (
        <SidebarGroup>
          <SidebarGroupLabel>CMS</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/cms/artigos'} tooltip="Meus Artigos">
                <Link href="/cms/artigos">
                  <FileText />
                  <span>Meus Artigos</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {isEditorPlus && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/cms/revisao'} tooltip="Em Revisão">
                  <Link href="/cms/revisao">
                    <FileEdit />
                    <span>Em Revisão</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {isAdmin && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/cms/categorias'} tooltip="Categorias">
                  <Link href="/cms/categorias">
                    <Tags />
                    <span>Categorias</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>
      )}
    </SidebarContent>
  )
}

