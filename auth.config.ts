import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  providers: [], // Será preenchido no auth.ts
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string
        token.role = (user as any).role ?? "MEMBRO"
        token.plan = (user as any).plan ?? "FREE"
      }
      if (trigger === "update" && session) {
        token.role = session.role ?? token.role
        token.plan = session.plan ?? token.plan
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = (token.id as string) ?? token.sub!
        ;(session.user as any).role = token.role
        ;(session.user as any).plan = token.plan
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Se for o redirecionamento de logout (apenas a raiz), envia para a raiz/Home
      if (url === baseUrl || url === `${baseUrl}/` || url === '/') {
        return baseUrl
      }
      // Para qualquer outro redirecionamento pós-login, garante o envio ao dashboard
      return `${baseUrl}/dashboard`
    },
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
      const isOnCms = nextUrl.pathname.startsWith("/cms")
      const isOnLogin = nextUrl.pathname.startsWith("/login")

      if (isOnDashboard || isOnCms) {
        if (isLoggedIn) return true
        return false // Redireciona para signIn page
      }

      if (isOnLogin && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl))
      }

      return true
    },
  },
} satisfies NextAuthConfig
