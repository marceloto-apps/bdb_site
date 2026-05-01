import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { HeroSection } from "@/components/home/hero-section"
import { ProblemSection } from "@/components/home/problem-section"
import { SolutionSection } from "@/components/home/solution-section"
import { AudienceSection } from "@/components/home/audience-section"
import { SocialProofSection } from "@/components/home/social-proof-section"
import { FeaturedContentSection } from "@/components/home/featured-content-section"
import { CtaFooterSection } from "@/components/home/cta-footer-section"

import { seo } from '@/lib/seo'

export const metadata = seo({
  title: 'Análise Esportiva Baseada em Dados',
  description:
    'Plataforma brasileira de análise esportiva baseada em dados. Estatísticas avançadas, planilhas profissionais e conteúdo exclusivo para apostas esportivas.',
  path: '',
})

export default async function HomePage() {
  let latestArticles: any[] = []
  try {
    latestArticles = await prisma.article.findMany({
      where: { status: "PUBLICADO" },
      take: 3,
      orderBy: { publishedAt: "desc" },
      include: { category: true },
    })
  } catch (error) {
    console.error("Erro ao buscar artigos:", error)
  }

  return (
    <main className="flex-1">
      <HeroSection />

      {/* Banner entre S1 (Hero) e S2 (Problema) */}
      <div className="relative w-full h-[300px] overflow-hidden">
        <Image
          src="/images/1.Home_s01_s02.png"
          alt="Big Data Bet — análise de dados esportivos"
          fill
          className="object-cover object-center"
          priority
        />
      </div>

      <ProblemSection />
      <SolutionSection />
      <AudienceSection />

      {/* Banner entre S4 (Para quem é) e S5 (Prova social) */}
      <div className="relative w-full h-[300px] overflow-hidden">
        <Image
          src="/images/1.Home_s04_s05.png"
          alt="Big Data Bet — comunidade"
          fill
          className="object-cover object-center"
        />
      </div>

      <SocialProofSection />
      {latestArticles.length > 0 && <FeaturedContentSection articles={latestArticles} />}
      <CtaFooterSection />
    </main>
  )
}

