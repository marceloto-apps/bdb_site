import Link from "next/link"
import Image from "next/image"
import { SOCIAL_LINKS, SITE_CONFIG } from "@/lib/constants"
import { Separator } from "@/components/ui/separator"


export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full border-t bg-background">
      <div className="container py-12 px-4 md:px-6 mx-auto">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          {/* Coluna 1: Logo e Descrição */}
          <div className="flex flex-col gap-4 max-w-xs">
            <Link href="/" className="flex items-center gap-2">
              <Image 
                src="/Logo_Site.png" 
                alt="Big Data Bet Logo" 
                width={150} 
                height={50} 
                className="object-contain"
              />
            </Link>
            <p className="text-sm text-muted-foreground">
              {SITE_CONFIG.description}
            </p>
          </div>

          {/* Coluna 2: Navegação */}
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold">Navegação</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">Home</Link>
              <Link href="/sobre" className="text-sm text-muted-foreground hover:text-primary transition-colors">Sobre</Link>
              <Link href="/artigos" className="text-sm text-muted-foreground hover:text-primary transition-colors">Artigos</Link>
              <Link href="/planilhas" className="text-sm text-muted-foreground hover:text-primary transition-colors">Planilhas</Link>
            </nav>
          </div>

          {/* Coluna 3: Redes Sociais */}
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold">Comunidade</h3>
            <div className="flex gap-4">
              <a 
                href={SOCIAL_LINKS.telegram} 
                target="_blank" 
                rel="noreferrer"
                className="opacity-70 hover:opacity-100 transition-opacity"
                aria-label="Telegram"
              >
                <Image src="/telegram.svg" alt="Telegram" width={20} height={20} className="brightness-0 invert" />
              </a>
              <a 
                href={SOCIAL_LINKS.youtube} 
                target="_blank" 
                rel="noreferrer"
                className="opacity-70 hover:opacity-100 transition-opacity"
                aria-label="YouTube"
              >
                <Image src="/youtube.svg" alt="YouTube" width={20} height={20} className="brightness-0 invert" />
              </a>
              <a 
                href={SOCIAL_LINKS.instagram} 
                target="_blank" 
                rel="noreferrer"
                className="opacity-70 hover:opacity-100 transition-opacity"
                aria-label="Instagram"
              >
                <Image src="/instagram.svg" alt="Instagram" width={20} height={20} className="brightness-0 invert" />
              </a>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} {SITE_CONFIG.name}. Todos os direitos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Apostas esportivas envolvem risco. Jogue com responsabilidade.
          </p>
        </div>
      </div>
    </footer>
  )
}
