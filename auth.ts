import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { loginSchema } from "@/lib/validations/auth"
import { sendEmail } from "@/lib/email/brevo"
import { welcomeEmailTemplate } from "@/lib/email/templates/welcome"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Usar JWT para sessão — necessário para funcionar no Edge Runtime (middleware)
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })

        if (!user || !user.password) return null

        const senhaValida = await bcrypt.compare(
          parsed.data.password,
          user.password
        )
        if (!senhaValida) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          plan: (user as any).plan,
        } as any
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // Enriquecer o JWT com role e plan do banco
    async jwt({ token, user, trigger, session }) {
      // No primeiro login, o objeto user vem do adapter
      if (user) {
        token.id = user.id as string
        token.role = (user as any).role ?? "MEMBRO"
        token.plan = (user as any).plan ?? "FREE"
      }
      // Quando a sessão é atualizada manualmente (ex: após upgrade de plano)
      if (trigger === "update" && session) {
        token.role = session.role ?? token.role
        token.plan = session.plan ?? token.plan
      }
      return token
    },
    // Expor role e plan na sessão do cliente
    async session({ session, token }) {
      if (token) {
        session.user.id = (token.id as string) ?? token.sub!
        ;(session.user as any).role = token.role
        ;(session.user as any).plan = token.plan
      }
      return session
    },
    // Controle de redirecionamento
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
      const isOnCms = nextUrl.pathname.startsWith("/cms")
      const isOnLogin = nextUrl.pathname.startsWith("/login")

      // Rotas protegidas
      if (isOnDashboard || isOnCms) {
        if (isLoggedIn) return true
        return false // Redireciona para signIn page
      }

      // Se já está logado e tenta acessar /login, redireciona para dashboard
      if (isOnLogin && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl))
      }

      return true
    },
  },
  events: {
    /**
     * Disparado quando um novo usuário é criado (primeiro login Google).
     * Envia email de boas-vindas.
     */
    async createUser({ user }) {
      if (user.email) {
        const { subject, htmlContent } = welcomeEmailTemplate({
          name: user.name ?? 'usuário',
        })
        sendEmail({
          to: { email: user.email, name: user.name ?? undefined },
          subject,
          htmlContent,
        }).catch((err) =>
          console.error('[Auth] Erro ao enviar email de boas-vindas (Google):', err)
        )
      }
    },
  },
})
