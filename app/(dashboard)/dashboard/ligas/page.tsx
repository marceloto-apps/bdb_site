import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { LigaCard } from '@/components/ligas/LigaCard'
import { BarChart3 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Ligas - BDB',
}

export default async function LigasPage() {
  const competicoes = await prisma.competition.findMany({
    where: { active: true },
    include: {
      seasons: {
        where: { isCurrent: true },
        include: {
          _count: {
            select: {
              matches: { where: { status: 'FINISHED', fthg: { not: null }, ftag: { not: null } } }
            }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  })

  // Mapear para o formato esperado pelo LigaCard
  const ligas = competicoes.map(comp => {
    const season = comp.seasons[0]
    const totalJogos = season ? season._count.matches : 0
    // Simular o tier no MVP. Você pode checar o campo 'tier' do prisma se ele existir, ou mockar
    // Se não existir tier no Prisma, tratamos como FREE por padrao o brasileirao
    const tier = comp.slug === 'brasileirao-serie-a' ? 'FREE' : 'VIP'
    const disponivel = tier === 'FREE'

    return {
      nome: comp.name,
      slug: comp.slug,
      pais: comp.country,
      logoUrl: (comp as any).logoUrl ?? null,
      temporada: season ? season.year : 'N/A',
      totalJogos,
      tier: tier as 'FREE' | 'VIP',
      disponivel
    }
  })

  return (
    <div className="space-y-8 p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-primary" />
          Ligas Disponíveis
        </h1>
        <p className="text-muted-foreground text-lg">
          Selecione uma liga para análise estatística avançada e previsão de confrontos
        </p>
      </div>
      
      {ligas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {ligas.map(liga => (
            <LigaCard key={liga.slug} {...liga} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-card border-dashed">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-lg font-medium">Nenhuma liga encontrada</h3>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Não há ligas ativas disponíveis no momento. Tente novamente mais tarde.
          </p>
        </div>
      )}
    </div>
  )
}
