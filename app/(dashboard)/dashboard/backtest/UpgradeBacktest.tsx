// app/(dashboard)/dashboard/backtest/UpgradeBacktest.tsx
import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lock, Sparkles, LineChart, Target, TrendingUp, Zap } from 'lucide-react'
import Link from 'next/link'

export function UpgradeBacktest() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4 md:p-8 pt-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold flex items-center gap-2">
          <LineChart className="w-8 h-8 text-primary" />
          Backtests Interativos
        </h1>
        <p className="text-muted-foreground text-lg">
          Valide suas estratégias estatísticas e simule lucros com dados históricos reais.
        </p>
      </div>

      <Card className="relative overflow-hidden border border-zinc-800 bg-zinc-950 p-6 md:p-10 text-center flex flex-col items-center shadow-2xl">
        {/* Glowing backgrounds */}
        <div className="absolute -left-20 -top-20 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-primary" />
        </div>

        <h2 className="text-2xl font-display font-bold text-zinc-100 mb-2 flex items-center gap-2">
          Recurso Exclusivo VIP PRO
          <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
        </h2>
        
        <p className="text-zinc-400 max-w-lg mb-8 text-sm md:text-base leading-relaxed">
          A ferramenta de Backtesting Interativo permite que você valide filtros baseados nos modelos estatísticos (Poisson, Dixon-Coles, ZIP e Binomial Negativa) em milhares de partidas finalizadas, descobrindo o P&L e ROI real das suas estratégias.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mb-8 text-left">
          <div className="p-5 rounded-xl border border-zinc-850 bg-zinc-900/30 flex flex-col gap-2">
            <Target className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-zinc-200 text-sm">Filtros Avançados</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Filtre por probabilidade do modelo, Expected Value (+EV), faixas de odds, mercados e linhas específicas.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-zinc-850 bg-zinc-900/30 flex flex-col gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-zinc-200 text-sm">Curva de Saldo e KPIs</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Visualize a evolução da banca em tempo real, ROI acumulado, taxa de acerto e métricas detalhadas.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-zinc-850 bg-zinc-900/30 flex flex-col gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h4 className="font-semibold text-zinc-200 text-sm">Simulação Histórica</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Descubra em segundos se o seu método é lucrativo no longo prazo em mais de 25 ligas VIP.
            </p>
          </div>
        </div>

        <Button asChild size="lg" className="bg-primary text-primary-foreground font-semibold px-8 py-6 hover:opacity-90 transition-all shadow-lg hover:scale-105 duration-300">
          <Link href="/dashboard/plano">
            Fazer Upgrade para VIP PRO
          </Link>
        </Button>
      </Card>
    </div>
  )
}
