import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { loginSchema } from "@/lib/validations/auth"
import { sendEmail } from "@/lib/email/brevo"
import { welcomeEmailTemplate } from "@/lib/email/templates/welcome"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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
  events: {
    /**
     * Disparado quando um novo usuário é criado (primeiro login Google).
     * Envia email de boas-vindas.
     */
    async createUser({ user }) {
      if (user.id) {
        try {
          const { awardPoints } = await import('@/lib/points/award')
          await awardPoints(user.id, 'CRIAR_CONTA')
        } catch (err) {
          console.error('[Auth] Erro ao conceder pontos de boas-vindas (Google):', err)
        }
      }
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
