import { Button } from "@/components/ui/button"
import { SOCIAL_LINKS } from "@/lib/constants"
import { Send } from "lucide-react"

export function CtaFooterSection() {
  return (
    <section className="py-24 bg-primary/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
      <div className="container relative z-10 px-4 md:px-6 mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 text-text-primary">
          Chega de apostar no escuro.
        </h2>
        <p className="mx-auto max-w-2xl text-xl md:text-2xl text-muted-foreground mb-10">
          Entre para a comunidade que usa dados de verdade para operar no mercado esportivo.
        </p>
        <Button asChild size="lg" className="gap-2 text-base px-8 py-6">
          <a href={SOCIAL_LINKS.telegram} target="_blank" rel="noopener noreferrer">
            <Send className="h-5 w-5" />
            Entrar no Telegram
          </a>
        </Button>
      </div>
    </section>
  )
}
