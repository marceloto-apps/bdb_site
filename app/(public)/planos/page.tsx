import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { PlanosClient } from "./PlanosClient"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: 'Planos VIP - BDB',
  description: 'Conheça nossos planos de assinatura VIP e tenha acesso a análises de futebol avançadas Dixon-Coles, NB e Poisson.',
}

export default async function PlanosPage() {
  const session = await auth()
  
  let userSessionData = null

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        plan: true,
        legacyAccess: {
          select: { id: true },
        },
      },
    })

    if (user) {
      userSessionData = {
        id: user.id,
        plan: user.plan,
        isLegacy: !!user.legacyAccess,
      }
    }
  }

  const priceIds = {
    basico: process.env.NEXT_PUBLIC_STRIPE_PRICE_VIP_BASICO || '',
    pro: process.env.NEXT_PUBLIC_STRIPE_PRICE_VIP_PRO || '',
  }

  return (
    <div className="bg-background min-h-screen text-white">
      <PlanosClient userSession={userSessionData} priceIds={priceIds} />
    </div>
  )
}
