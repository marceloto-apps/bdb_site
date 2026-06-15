import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { PlanoClient } from "./PlanoClient"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: 'Meu Plano - BDB',
}

export default async function PlanoPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      plan: true,
      legacyAccess: {
        select: {
          id: true,
        },
      },
      subscription: {
        select: {
          status: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
        },
      },
    },
  })

  if (!user) {
    redirect('/login')
  }

  // Serializar datas para o cliente Next.js
  const serializedUser = {
    ...user,
    subscription: user.subscription
      ? {
          status: user.subscription.status,
          currentPeriodEnd: user.subscription.currentPeriodEnd
            ? user.subscription.currentPeriodEnd.toISOString()
            : null,
          cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
        }
      : null,
  }

  return <PlanoClient user={serializedUser} />
}
