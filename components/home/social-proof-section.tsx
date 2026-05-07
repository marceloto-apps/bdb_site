import Image from "next/image"
import { SOCIAL_LINKS } from "@/lib/constants"
import { Card, CardContent } from "@/components/ui/card"

export function SocialProofSection() {
  return (
    <section className="py-20">
      <div className="container px-4 md:px-6 mx-auto">
        <h2 className="text-3xl font-bold tracking-tight mb-12 text-center">
          Uma comunidade que cresce com dados, não com hype.
        </h2>

        {/* Contadores */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {/* Telegram */}
          <a
            href={SOCIAL_LINKS.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-center p-6 bg-surface/30 rounded-xl border border-border hover:border-[#229ED9]/50 transition-colors flex flex-col items-center gap-3"
          >
            <Image src="/images/telegram_logo.png" alt="Telegram" width={48} height={48} className="object-contain" />
            <div className="text-3xl md:text-4xl font-extrabold text-primary">+1.600</div>
            <div className="text-sm md:text-base text-muted-foreground">membros no Telegram</div>
          </a>

          {/* YouTube */}
          <a
            href={SOCIAL_LINKS.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="text-center p-6 bg-surface/30 rounded-xl border border-border hover:border-[#FF0000]/50 transition-colors flex flex-col items-center gap-3"
          >
            <Image src="/images/youtube_logo.png" alt="YouTube" width={48} height={48} className="object-contain" />
            <div className="text-3xl md:text-4xl font-extrabold text-[#FF0000]">+2.800</div>
            <div className="text-sm md:text-base text-muted-foreground">inscritos no YouTube</div>
          </a>

          {/* Instagram */}
          <a
            href={SOCIAL_LINKS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-center p-6 bg-surface/30 rounded-xl border border-border hover:border-[#E1306C]/50 transition-colors flex flex-col items-center gap-3"
          >
            <Image src="/images/instagram_logo.png" alt="Instagram" width={48} height={48} className="object-contain" />
            <div className="text-3xl md:text-4xl font-extrabold text-[#E1306C]">+819</div>
            <div className="text-sm md:text-base text-muted-foreground">seguidores no Instagram</div>
          </a>

          {/* Desde 2019 */}
          <div className="text-center p-6 bg-surface/30 rounded-xl border border-border flex flex-col items-center gap-3">
            <Image src="/images/desde_2022.png" alt="Desde 2019" width={48} height={48} className="object-contain" />
            <div className="text-3xl md:text-4xl font-extrabold text-text-primary">Desde 2019</div>
            <div className="text-sm md:text-base text-muted-foreground">construindo com a comunidade</div>
          </div>
        </div>

        {/* Depoimentos */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-surface border-border shadow-md">
            <CardContent className="pt-6">
              <p className="italic text-muted-foreground mb-4">
                &quot;Conheci a comunidade em 2023 e passei a entender que tem gente séria estudando e disseminando conteúdos relevantes sobre aposta esportiva no Brasil. Luciano está de parabéns pelo trabalho que fez nestes anos. Obrigado pelo dinheiro que me fez ganhar também seguindo seus grupos.&quot;
              </p>
              <p className="font-semibold">— Marcelo · Desde 2023</p>
            </CardContent>
          </Card>
          <Card className="bg-surface border-border opacity-70">
            <CardContent className="pt-6">
              <p className="italic text-muted-foreground mb-4">
                &quot;[Depoimento de membro a ser coletado]&quot;
              </p>
              <p className="font-semibold">— [Nome do membro] · [Desde XXXX]</p>
            </CardContent>
          </Card>
          <Card className="bg-surface border-border opacity-70">
            <CardContent className="pt-6">
              <p className="italic text-muted-foreground mb-4">
                &quot;[Depoimento de membro a ser coletado]&quot;
              </p>
              <p className="font-semibold">— [Nome do membro] · [Desde XXXX]</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
