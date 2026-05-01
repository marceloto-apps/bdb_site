import Link from "next/link"
import Image from "next/image"
import { auth } from "@/auth"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/auth/user-menu"

/** Links públicos de navegação */
const navLinks = [
  { href: "/", label: "Home" },
  { href: "/sobre", label: "Sobre" },
  { href: "/artigos", label: "Artigos" },
  { href: "/planilhas", label: "Planilhas" },
]

export async function Header() {
  const session = await auth()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Nav absolutamente ancorado no centro real da tela (50% do viewport) */}
      <div className="relative h-20 flex items-center">
        {/* Logo: alinhado à esquerda dentro do container */}
        <div className="container flex items-center h-full">
          <Link href="/" className="ml-4 md:ml-8">
            <Image
              src="/Logo_Site.png"
              alt="Big Data Bet"
              width={140}
              height={48}
              className="object-contain"
            />
          </Link>
        </div>

        {/* Nav: posição absoluta em relação ao header (100% da tela) */}
        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Lado Direito: Ações (Entrar ou Menu do Usuário) */}
      <div className="absolute right-4 md:right-8 flex items-center gap-4 h-full top-0">
        {session ? (
          <UserMenu />
        ) : (
          <Link href="/login">
            <Button variant="default" className="bg-[#22c55e] text-black hover:bg-[#16a34a] font-semibold">
              Entrar
            </Button>
          </Link>
        )}
      </div>
    </header>
  )
}
