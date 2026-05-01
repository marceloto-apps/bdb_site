import { Button } from "@/components/ui/button"
import { SOCIAL_LINKS } from "@/lib/constants"
import { Send, Play } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background py-24 sm:py-32">
      <div className="absolute inset-0 z-0 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/40 via-background to-background"></div>
      <div className="container relative z-10 mx-auto px-4 md:px-6 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-text-primary mb-6">
          Ciência de dados e estatística aplicadas ao <br className="hidden md:block" />
          <span className="text-primary">mercado de apostas esportivas.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl mb-10">
          Ferramentas, análises e métodos para encontrar desajustes nas odds, explorar vantagens matemáticas e operar com edge real no mercado esportivo.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button asChild size="lg" className="gap-2 text-base">
            <a href={SOCIAL_LINKS.telegram} target="_blank" rel="noopener noreferrer">
              <Send className="h-5 w-5" />
              Entrar na comunidade
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2 text-base">
            <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer">
              <Play className="h-5 w-5" />
              Assistir no YouTube
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
