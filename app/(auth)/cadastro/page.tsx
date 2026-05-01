import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CadastroForm } from '@/components/auth/CadastroForm'
import { GoogleButton } from '@/components/auth/GoogleButton'

export const metadata = {
  title: 'Cadastro | Big Data Bet',
  description: 'Crie sua conta gratuita na Big Data Bet e comece a usar dados de verdade.',
}

export default function CadastroPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md border-border bg-surface">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-2xl text-text-primary">
            Criar conta
          </CardTitle>
          <CardDescription className="text-text-muted">
            Gratuito. Acesso imediato a conteúdos e comunidade.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Cadastro com Google (mais rápido) */}
          <GoogleButton />

          {/* Separador */}
          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface px-2 text-xs text-text-muted">
              ou cadastre com email
            </span>
          </div>

          {/* Formulário de cadastro */}
          <CadastroForm />

          {/* Link para login */}
          <p className="text-center text-sm text-text-muted">
            Já tem conta?{' '}
            <Link
              href="/login"
              className="text-primary hover:text-primary-dark font-medium underline-offset-4 hover:underline"
            >
              Faça login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
