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
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      identifyUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        plan: (session.user as any).plan,
        role: session.user.role,
      })
    } else if (status === 'unauthenticated') {
      resetUser()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, status])

  return (
    <>
      <Suspense fallback={null}>
        <PosthogPageTracker />
      </Suspense>
      {children}
    </>
  )
}
