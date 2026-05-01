import { Metadata } from 'next'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { Separator } from '@/components/ui/separator'
import { FormDadosPessoais } from '@/components/dashboard/perfil/FormDadosPessoais'
import { FormAlterarSenha } from '@/components/dashboard/perfil/FormAlterarSenha'
import { SecaoExcluirConta } from '@/components/dashboard/perfil/SecaoExcluirConta'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Meu Perfil',
}

export default async function PerfilPage() {
  const sessionUser = await requireAuth()

  // Buscar dados atualizados do banco
  const dbUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { 
      id: true, 
      name: true, 
      email: true, 
      image: true, 
      password: true 
    }
  })

  if (!dbUser) {
    redirect('/login')
  }

  // Define se o usuário tem senha (para exibir o form correspondente), sem enviar o hash pro client
  const temSenha = dbUser.password !== null

  // Prepara o objeto do usuário sem a senha para passar pro componente client
  const usuario = {
    name: dbUser.name,
    email: dbUser.email,
    image: dbUser.image,
  }

  return (
    <div className="space-y-8 max-w-2xl pt-4 md:pt-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie suas informações pessoais e preferências de conta.
        </p>
      </header>

      {/* Seção 1: Dados Pessoais */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Dados pessoais</h2>
        <FormDadosPessoais usuario={usuario} />
      </section>

      <Separator />

      {/* Seção 2: Senha */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Senha</h2>
        <FormAlterarSenha temSenha={temSenha} />
      </section>

      <Separator />

      {/* Seção 3: Excluir conta */}
      <section>
        <SecaoExcluirConta temSenha={temSenha} />
      </section>
    </div>
  )
}
