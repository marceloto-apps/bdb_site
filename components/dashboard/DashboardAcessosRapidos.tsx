'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Target,
  ArrowUpDown,
  ShieldCheck,
  BarChart3,
  FlaskConical,
  GraduationCap,
  Trophy,
  Flame,
  FileSpreadsheet,
  Coins,
  ChevronRight,
  Sparkles, Beaker } from 'lucide-react'

interface ItemAcessoRapido {
  titulo: string
  descricao: string
  href: string
  icone: React.ComponentType<{ className?: string }>
  corIcone: string
  bgIcone: string
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'outline'
}

const ferramentas: ItemAcessoRapido[] = [
  {
    titulo: 'Laboratório de Estratégias',
    descricao: 'Backtest livre: combine odds e estatísticas por fórmula, valide com CLV e drawdown',
    href: '/dashboard/laboratorio',
    icone: Beaker,
    corIcone: 'text-emerald-400',
    bgIcone: 'bg-emerald-500/10',
    badge: 'VIP PRO',
    badgeVariant: 'secondary',
  },
  {
    titulo: 'Over/Under 2.5',
    descricao: 'Projeção de odds justas para a linha 2.5 via Poisson',
    href: '/dashboard/ferramentas/over-under-25',
    icone: Target,
    corIcone: 'text-primary',
    bgIcone: 'bg-primary/10',
  },
  {
    titulo: 'Over/Under Linhas',
    descricao: 'Projeção de todas as linhas de gols a partir de linha âncora',
    href: '/dashboard/ferramentas/over-under-linhas',
    icone: ArrowUpDown,
    corIcone: 'text-blue-400',
    bgIcone: 'bg-blue-500/10',
  },
  {
    titulo: 'Validação e Risco',
    descricao: 'Simulação Monte Carlo para avaliar risco de ruína e viabilidade',
    href: '/dashboard/ferramentas/validacao-risco',
    icone: ShieldCheck,
    corIcone: 'text-amber-400',
    bgIcone: 'bg-amber-500/10',
  },
  {
    titulo: 'Simulador de Distribuição',
    descricao: 'Laboratório visual com ajuste estatístico Gram-Charlier',
    href: '/dashboard/ferramentas/distribuicao',
    icone: BarChart3,
    corIcone: 'text-emerald-400',
    bgIcone: 'bg-emerald-500/10',
  },
  {
    titulo: 'Backtest Quantitativo',
    descricao: 'Validação de estratégias em dados históricos consolidados',
    href: '/dashboard/backtest',
    icone: FlaskConical,
    corIcone: 'text-purple-400',
    bgIcone: 'bg-purple-500/10',
    badge: 'VIP PRO',
    badgeVariant: 'secondary',
  },
]

const cursos: ItemAcessoRapido[] = [
  {
    titulo: 'Vitrine de Cursos',
    descricao: 'Aulas completas sobre modelagem estatística e precificação',
    href: '/curso',
    icone: GraduationCap,
    corIcone: 'text-primary',
    bgIcone: 'bg-primary/10',
  },
  {
    titulo: 'Meu Progresso',
    descricao: 'Acompanhe aulas concluídas, quizzes e metas de estudo',
    href: '/dashboard/progresso',
    icone: Trophy,
    corIcone: 'text-amber-400',
    bgIcone: 'bg-amber-500/10',
    badge: 'Em breve',
    badgeVariant: 'outline',
  },
]

const utilitarios: ItemAcessoRapido[] = [
  {
    titulo: 'Bolão BDB',
    descricao: 'Palpite nos jogos da rodada e dispute prêmios no ranking',
    href: '/dashboard/bolao',
    icone: Flame,
    corIcone: 'text-orange-400',
    bgIcone: 'bg-orange-500/10',
  },
  {
    titulo: 'Planilhas Oficiais',
    descricao: 'Download de modelos prontos para Excel e Google Sheets',
    href: '/dashboard/planilhas',
    icone: FileSpreadsheet,
    corIcone: 'text-blue-400',
    bgIcone: 'bg-blue-500/10',
  },
  {
    titulo: 'BDB Points & Clube',
    descricao: 'Resgate cupons de desconto e recompensas exclusivas',
    href: '/dashboard/bdb-points',
    icone: Coins,
    corIcone: 'text-yellow-400',
    bgIcone: 'bg-yellow-500/10',
  },
]

export function DashboardAcessosRapidos() {
  return (
    <section className="space-y-6 pt-6 border-t border-border/60">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-display text-2xl font-bold tracking-tight text-white">
            Acessos Rápidos
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          Navegue pelas ferramentas de cálculo, cursos e áreas exclusivas da plataforma
        </p>
      </div>

      {/* Bloco 1: Ferramentas Quantitativas */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Ferramentas de Análise
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ferramentas.map((item) => (
            <Link key={item.href} href={item.href} className="group">
              <Card className="h-full bg-surface/70 hover:bg-surface border-border hover:border-primary/50 transition-all duration-200 cursor-pointer shadow-xs group-hover:-translate-y-0.5">
                <CardHeader className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className={`${item.bgIcone} p-2 rounded-lg shrink-0`}>
                      <item.icone className={`h-5 w-5 ${item.corIcone}`} />
                    </div>
                    {item.badge && (
                      <Badge
                        variant={item.badgeVariant || 'outline'}
                        className="text-[10px] px-1.5 py-0 h-5"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3">
                    <CardTitle className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors flex items-center justify-between">
                      <span>{item.titulo}</span>
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-primary shrink-0" />
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {item.descricao}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Grid Duplo: Cursos + Comunidade/Gestão */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Bloco 2: Cursos */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Cursos & Metodologia
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cursos.map((item) => (
              <Link key={item.href} href={item.href} className="group">
                <Card className="h-full bg-surface/70 hover:bg-surface border-border hover:border-primary/50 transition-all duration-200 cursor-pointer shadow-xs group-hover:-translate-y-0.5">
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className={`${item.bgIcone} p-2 rounded-lg shrink-0`}>
                        <item.icone className={`h-5 w-5 ${item.corIcone}`} />
                      </div>
                      {item.badge && (
                        <Badge
                          variant={item.badgeVariant || 'outline'}
                          className="text-[10px] px-1.5 py-0 h-5"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-3">
                      <CardTitle className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors flex items-center justify-between">
                        <span>{item.titulo}</span>
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-primary shrink-0" />
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {item.descricao}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Bloco 3: Utilitários & Comunidade */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Comunidade & Recursos
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {utilitarios.map((item) => (
              <Link key={item.href} href={item.href} className="group">
                <Card className="h-full bg-surface/70 hover:bg-surface border-border hover:border-primary/50 transition-all duration-200 cursor-pointer shadow-xs group-hover:-translate-y-0.5">
                  <CardHeader className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className={`${item.bgIcone} p-2 rounded-lg shrink-0`}>
                        <item.icone className={`h-5 w-5 ${item.corIcone}`} />
                      </div>
                    </div>
                    <div className="mt-3">
                      <CardTitle className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors flex items-center justify-between">
                        <span>{item.titulo}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-primary shrink-0" />
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {item.descricao}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
