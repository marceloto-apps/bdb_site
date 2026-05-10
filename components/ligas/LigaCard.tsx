import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Lock } from 'lucide-react'

interface LigaCardProps {
  nome: string
  slug: string
  pais: string | null
  logoUrl: string | null
  temporada: string
  totalJogos: number
  tier: 'FREE' | 'VIP'
  disponivel: boolean
}

export function LigaCard({ nome, slug, pais, logoUrl, temporada, totalJogos, tier, disponivel }: LigaCardProps) {
  const content = (
    <Card className="relative overflow-hidden group transition-all duration-200 hover:scale-[1.02] hover:border-primary cursor-pointer h-full">
      <CardContent className="p-6 flex flex-col h-full justify-between gap-4">
        <div className="flex justify-between items-start">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0 border overflow-hidden">
            {logoUrl ? (
              <div className="w-12 h-12 relative">
                <Image src={logoUrl} alt={`Logo ${nome}`} fill className="object-cover" />
              </div>
            ) : (
              <Trophy className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          <Badge 
            variant={tier === 'FREE' ? 'default' : 'secondary'} 
            className={tier === 'FREE' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-yellow-500/20 text-yellow-600 border-yellow-500/50'}
          >
            {tier}
          </Badge>
        </div>
        
        <div>
          <h3 className="font-display font-bold text-xl leading-tight line-clamp-2">{nome}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {pais ? `${pais} • ` : ''}Temporada {temporada}
          </p>
        </div>

        <div className="pt-4 border-t border-border mt-auto">
          <p className="text-sm text-muted-foreground font-medium">
            {totalJogos} jogos processados
          </p>
        </div>
      </CardContent>

      {!disponivel && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] flex items-center justify-center z-10 transition-opacity group-hover:bg-background/90">
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-1">
              <Lock className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="font-semibold text-sm">Disponível no VIP</span>
            <span className="text-xs text-muted-foreground">Faça upgrade para acessar</span>
          </div>
        </div>
      )}
    </Card>
  )

  if (!disponivel) {
    return <Link href="/planos">{content}</Link>
  }

  return <Link href={`/dashboard/ligas/${slug}`}>{content}</Link>
}
