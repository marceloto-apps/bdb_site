'use client'

import React, { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { getPosthogClient } from './client'
import { trackPageView } from './events'
import { identifyUser, resetUser } from './identify'

function PosthogPageTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname) {
      const url = searchParams?.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname

      trackPageView(window.location.origin + url, document.referrer)
    }
  }, [pathname, searchParams])

  return null
}

/**
 * Provider que inicializa o PostHog e rastreia pageviews no App Router.
 * Faz também a identificação automática do usuário via NextAuth.
 */
export function PosthogProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  // Inicializa o PostHog uma única vez
  useEffect(() => {
    getPosthogClient()
  }, [])

  // Identificação automática do usuário com NextAuth
  const user = session?.user
  const userId = user?.id
  const userEmail = user?.email
  const userName = user?.name
  const userPlan = (user as { plan?: string } | undefined)?.plan
  const userRole = (user as { role?: string } | undefined)?.role

  useEffect(() => {
    if (status === 'authenticated' && userId) {
      identifyUser({
        id: userId,
        email: userEmail,
        name: userName,
        plan: userPlan,
        role: userRole,
      })
    } else if (status === 'unauthenticated') {
      resetUser()
    }
  }, [status, userId, userEmail, userName, userPlan, userRole])

  return (
    <>
      <Suspense fallback={null}>
        <PosthogPageTracker />
      </Suspense>
      {children}
    </>
  )
}
