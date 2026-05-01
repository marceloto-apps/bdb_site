import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { LoginForm } from '@/components/auth/LoginForm'
import { GoogleButton } from '@/components/auth/GoogleButton'

export const metadata = {
  title: 'Entrar | Big Data Bet',
  description: 'Faça login na plataforma Big Data Bet.',
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border bg-surface">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-2xl text-text-primary">
            Entrar
          </CardTitle>
          <CardDescription className="text-text-muted">
            Acesse sua conta na Big Data Bet
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Login com Google */}
          <GoogleButton />

          {/* Separador */}
          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface px-2 text-xs text-text-muted">
              ou
            </span>
          </div>

          {/* Login com email/senha */}
          <LoginForm />

          {/* Link para cadastro */}
          <p className="text-center text-sm text-text-muted">
            Não tem conta?{' '}
            <Link
              href="/cadastro"
              className="text-primary hover:text-primary-dark font-medium underline-offset-4 hover:underline"
            >
              Cadastre-se grátis
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
