'use client'

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ShieldCheck, TrendingUp, Target, BarChart3 } from 'lucide-react'

const ferramentas = [
  {
    titulo: 'Validação e Risco',
    descricao: 'Simulação Monte Carlo para avaliar viabilidade estatística de estratégias',
    href: '/dashboard/ferramentas/validacao-risco',
    icone: ShieldCheck,
  },
  {
    titulo: 'Over/Under 2.5',
    descricao: 'Projeção de odds justas para a linha 2.5 baseada em Poisson',
    href: '/dashboard/ferramentas/over-under-25',
    icone: Target,
  },
  {
    titulo: 'Over/Under Linhas',
    descricao: 'Projeção de todas as linhas de gols a partir de uma linha âncora',
    href: '/dashboard/ferramentas/over-under-linhas',
    icone: TrendingUp,
  },
  {
    titulo: 'Simulador de Distribuição',
    descricao: 'Laboratório visual de distribuição estatística com ajuste Gram-Charlier',
    href: '/dashboard/ferramentas/distribuicao',
    icone: BarChart3,
  },
]

export function FerramentasGrid() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ferramentas</h1>
        <p className="text-muted-foreground">
          Calculadoras e simuladores para análise estatística de apostas
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ferramentas.map((f) => (
          <Link key={f.href} href={f.href}>
            <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <f.icone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{f.titulo}</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {f.descricao}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
