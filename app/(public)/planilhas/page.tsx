import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { HeroSection } from '@/components/planilhas/hero-section'
import { FreeSpreadsheetsSection } from '@/components/planilhas/free-spreadsheets-section'
import { VipPackSection } from '@/components/planilhas/vip-pack-section'
import { ToolsPlaceholder } from '@/components/planilhas/tools-placeholder'

import { seo } from '@/lib/seo'

export const metadata = seo({
  title: 'Planilhas',
  description:
    'Planilhas em Excel para análise avançada do mercado esportivo de futebol. Odds, dispersão, tendências de lucratividade e variáveis estatísticas profundas.',
  path: '/planilhas',
  keywords: ['planilhas apostas', 'excel futebol', 'análise odds', 'planilhas futebol'],
})

export default async function PlanilhasPage() {
  // Busca planilhas free do banco
  const planilhasFree = await prisma.spreadsheet.findMany({
    where: { isPremium: false },
    orderBy: { order: 'asc' },
  })

  return (
    <main className="min-h-screen">
      <HeroSection />
      <FreeSpreadsheetsSection planilhas={planilhasFree} />
      <VipPackSection />
      <ToolsPlaceholder />
    </main>
  )
}
