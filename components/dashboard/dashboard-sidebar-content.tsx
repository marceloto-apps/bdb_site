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
  Wallet,
  Calculator,
  FlaskConical,
  ShieldAlert,
  ArrowUpDown,
  TrendingUp,
  Target,
  GraduationCap, 
  Trophy, 
  FileText, 
  FileEdit, 
  Tags,
  LineChart,
  RefreshCw,
  Gauge,
  Coins
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
        <SidebarGroupLabel>ANÁLISE ESPORTIVA</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard/ligas')} tooltip="Ligas">
              <Link href="/dashboard/ligas">
                <Trophy />
                <span>Ligas</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard/analises')} tooltip="Análises">
              <Link href="/dashboard/analises" className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <LineChart />
                  <span>Análises</span>
                </div>
                <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full whitespace-nowrap">Em breve</span>
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
              <Link href="/dashboard/backtest" className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <FlaskConical />
                  <span>Backtest</span>
                </div>
                <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full whitespace-nowrap">Em breve</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/dashboard/ferramentas/validacao-risco'} tooltip="Validação e Risco">
              <Link href="/dashboard/ferramentas/validacao-risco">
                <ShieldAlert />
                <span>Validação e Risco</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/dashboard/ferramentas/over-under-25'} tooltip="Over/Under 2.5">
              <Link href="/dashboard/ferramentas/over-under-25">
                <Target />
                <span>Over/Under 2.5</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/dashboard/ferramentas/over-under-linhas'} tooltip="Over/Under Linhas">
              <Link href="/dashboard/ferramentas/over-under-linhas">
                <ArrowUpDown />
                <span>Over/Under Linhas</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/dashboard/ferramentas/distribuicao'} tooltip="Simulador de Distribuição">
              <Link href="/dashboard/ferramentas/distribuicao">
                <TrendingUp />
                <span>Simulador de Distribuição</span>
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
              <Link href="/dashboard/banca" className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Wallet />
                  <span>Banca</span>
                </div>
                <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full whitespace-nowrap">Em breve</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/dashboard/metodos'} tooltip="Métodos">
              <Link href="/dashboard/metodos" className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Calculator />
                  <span>Métodos</span>
                </div>
                <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full whitespace-nowrap">Em breve</span>
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
              <Link href="/curso" className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <GraduationCap />
                  <span>Aulas</span>
                </div>
                <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full whitespace-nowrap">Em breve</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/dashboard/progresso'} tooltip="Meu Progresso">
              <Link href="/dashboard/progresso" className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Trophy />
                  <span>Meu Progresso</span>
                </div>
                <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full whitespace-nowrap">Em breve</span>
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
              <SidebarMenuButton asChild isActive={pathname === '/cms'} tooltip="Meus Artigos">
                <Link href="/cms">
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

      {isAdmin && (
        <SidebarGroup>
          <SidebarGroupLabel>ADMINISTRAÇÃO</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard/admin/sync')} tooltip="Sync Dados">
                <Link href="/dashboard/admin/sync">
                  <RefreshCw />
                  <span>Sync Dados</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard/admin/quota')} tooltip="Quota API">
                <Link href="/dashboard/admin/quota">
                  <Gauge />
                  <span>Quota API</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/cms/admin/points')} tooltip="Bônus Admin">
                <Link href="/cms/admin/points">
                  <Coins />
                  <span>Bônus Admin</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/cms/admin/courses')} tooltip="Cursos Admin">
                <Link href="/cms/admin/courses">
                  <GraduationCap />
                  <span>Cursos Admin</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      )}
    </SidebarContent>
  )
}

