import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'

import { cn } from '@/lib/utils'
import { SessionProvider } from "@/components/providers/session-provider"
import { PosthogProvider } from "@/lib/posthog/provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

import { seo, metadataBase } from '@/lib/seo'

const baseMetadata = seo({
  title: 'Análise Esportiva Baseada em Dados',
  description:
    'Plataforma brasileira de análise esportiva baseada em dados. Estatísticas avançadas, planilhas profissionais, backtests interativos e conteúdo exclusivo para o mercado de apostas esportivas.',
  path: '',
  keywords: [
    'apostas esportivas brasil',
    'análise de futebol',
    'estatísticas de apostas',
    'odds futebol',
    'planilhas futebol',
  ],
})

export const metadata: Metadata = {
  ...baseMetadata,
  metadataBase,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.variable,
          plusJakarta.variable,
          jetbrainsMono.variable
        )}
      >
        <SessionProvider>
          <PosthogProvider>
            {children}
          </PosthogProvider>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  )
}
