'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'

interface PlanosClientProps {
  userSession: {
    id: string
    plan: 'FREE' | 'VIP_BASICO' | 'VIP_PRO'
    isLegacy: boolean
  } | null
  priceIds: {
    basico: string
    pro: string
  }
}

export function PlanosClient({ userSession, priceIds }: PlanosClientProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4 md:px-8">
      <Card className="max-w-2xl w-full border bg-card/40 backdrop-blur-sm shadow-xl p-8 text-center space-y-6 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -right-16 -top-16 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        <div className="inline-flex w-16 h-16 rounded-full bg-primary/10 items-center justify-center border border-primary/20 mb-2 relative z-10">
          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-display font-bold text-white relative z-10">
          Planos VIP em <span className="text-primary">Breve</span>
        </h1>
        
        <p className="text-zinc-400 text-base md:text-lg leading-relaxed relative z-10">
          Estamos preparando novidades incríveis, novos planos e ferramentas de precificação avançadas para potencializar suas análises esportivas.
        </p>
        
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 text-sm text-zinc-300 text-left space-y-2 relative z-10">
          <p className="font-semibold text-white flex items-center gap-1.5">
            💡 Acesso Liberado Temporariamente
          </p>
          <p className="text-xs text-zinc-400">
            No momento, o acesso completo para visualização de estatísticas avançadas, médias e previsões de confrontos das ligas:
          </p>
          <ul className="list-disc list-inside text-xs text-zinc-300 pl-1 space-y-1">
            <li><strong>Brasileirão Série A</strong></li>
            <li><strong>Brasileirão Série B</strong></li>
            <li><strong>División Profesional (Bolívia)</strong></li>
          </ul>
          <p className="text-xs text-zinc-400 pt-1">
            está gratuito para todos os usuários cadastrados na plataforma.
          </p>
        </div>
        
        <div className="pt-4 flex justify-center relative z-10">
          <Button asChild size="lg" className="font-semibold px-8 bg-[#22c55e] text-black hover:bg-[#16a34a]">
            <Link href="/dashboard">Ir para o Painel de Análises</Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
