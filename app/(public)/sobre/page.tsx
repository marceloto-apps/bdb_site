import { SOCIAL_LINKS, CONTACT_EMAIL } from "@/lib/constants"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"
import Image from "next/image"

import { seo } from '@/lib/seo'

export const metadata = seo({
  title: 'Sobre',
  description:
    'Conheça o Big Data Bet — plataforma brasileira de análise esportiva baseada em dados para o mercado de apostas.',
  path: '/sobre',
  keywords: ['sobre big data bet', 'quem somos'],
})

export default function SobrePage() {
  return (
    <main className="flex-1 container mx-auto px-4 md:px-6 py-12 max-w-4xl">
      {/* Institucional */}
      <section className="mb-16">
        <h1 className="text-4xl font-bold tracking-tight mb-6">Sobre o Big Data Bet</h1>
        <div className="prose prose-invert max-w-none text-muted-foreground text-lg leading-relaxed space-y-6">
          <p>
            O Big Data Bet nasceu da necessidade de elevar o nível das análises no mercado esportivo. Fundado por Luciano Zeidler, o projeto tem como pilar fundamental o uso rigoroso de estatísticas e ciência de dados para substituir o palpite por decisões embasadas matematicamente.
          </p>
          <p>
            Nossa missão é educar e instrumentalizar o apostador e o trader esportivo. Acreditamos que a constância no mercado não vem da sorte, mas do domínio de métricas e indicadores-chave, modelagem de dados, conceitos estatísticos e do uso consciente do valor esperado positivo (+EV) — entendendo como a informação bem aplicada pode gerar pequenas vantagens que, no longo prazo, fazem toda a diferença.
          </p>
          <p>
            O grande diferencial da nossa plataforma é que não somos uma casa de apostas, não somos patrocinados e não temos nenhum acordo com casas de apostas, tampouco vendemos ilusões. Somos uma comunidade de estudos, focada na construção de métodos validados, oferecendo ferramentas, planilhas e metodologias atualizadas de ligas globais, além de conteúdos práticos em vídeo e artigos técnicos de alto nível.
          </p>
        </div>
      </section>

      {/* Nossos Canais */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold tracking-tight mb-8">Nossos Canais</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <Card className="bg-surface">
            <CardHeader>
              <div className="mb-2 h-10 w-10 flex items-center justify-center">
                <Image src="/images/telegram_logo.png" alt="Telegram" width={40} height={40} className="object-contain" />
              </div>
              <CardTitle>Telegram</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Nosso grupo principal de estudos. Onde compartilhamos métodos, planilhas gratuitas e promovemos discussões de alto nível diariamente.
              </CardDescription>
              <a href={SOCIAL_LINKS.telegram} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline">
                Acessar Comunidade
              </a>
            </CardContent>
          </Card>
          
          <Card className="bg-surface">
            <CardHeader>
              <div className="mb-2 h-10 w-10 flex items-center justify-center">
                <Image src="/images/youtube_logo.png" alt="YouTube" width={40} height={40} className="object-contain" />
              </div>
              <CardTitle>YouTube</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Vídeos publicados com frequência, trazendo tutoriais de criação de planilhas, análises práticas de ligas e explicações detalhadas sobre nossos métodos estatísticos.
              </CardDescription>
              <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline">
                Acessar Canal
              </a>
            </CardContent>
          </Card>

          <Card className="bg-surface">
            <CardHeader>
              <div className="mb-2 h-10 w-10 flex items-center justify-center">
                <Image src="/images/instagram_logo.png" alt="Instagram" width={40} height={40} className="object-contain" />
              </div>
              <CardTitle>Instagram</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Conteúdos curtos, insights rápidos, bastidores do projeto e anúncios em primeira mão sobre novas ferramentas e turmas.
              </CardDescription>
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline">
                Seguir Perfil
              </a>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contato */}
      <section>
        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" /> Fale Conosco
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-2">
              Tem alguma dúvida sobre nossas planilhas, precisa de suporte ou quer sugerir uma parceria?
            </p>
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary font-medium hover:underline">
              {CONTACT_EMAIL}
            </a>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
