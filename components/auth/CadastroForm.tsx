'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type Resolver } from 'react-hook-form'
import { cadastroSchema, type CadastroInput } from '@/lib/validations/auth'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

export function CadastroForm() {
  const router = useRouter()
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  const form = useForm<CadastroInput>({
    resolver: zodResolver(cadastroSchema) as Resolver<CadastroInput>,
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      newsletterOptIn: false,
    },
  })

  async function onSubmit(dados: CadastroInput) {
    setErro(null)
    setCarregando(true)

    try {
      // 1. Criar conta via API
      const resposta = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      })

      const resultado = await resposta.json()

      if (!resposta.ok) {
        // Erro de conflito (email já existe)
        if (resposta.status === 409) {
          setErro('Este email já está cadastrado. Tente fazer login.')
          return
        }
        // Erros de validação
        if (resultado.fields) {
          const campos = resultado.fields as Record<string, string[]>
          Object.entries(campos).forEach(([campo, mensagens]) => {
            form.setError(campo as keyof CadastroInput, {
              message: mensagens[0],
            })
          })
          return
        }
        setErro(resultado.message || 'Erro ao criar conta')
        return
      }

      // 2. Cadastro OK — fazer login automático
      const loginResult = await signIn('credentials', {
        email: dados.email,
        password: dados.password,
        redirect: false,
      })

      if (loginResult?.error) {
        // Cadastro funcionou mas login falhou — redirecionar para login
        router.push('/login')
        return
      }

      // 3. Login OK — redirecionar ao dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Erro ao criar conta. Tente novamente."
      setErro(msg)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Mensagem de erro geral */}
        {erro && (
          <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
            {erro}
          </div>
        )}

        {/* Campo Nome */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input
                  placeholder="Seu nome"
                  autoComplete="name"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campo Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campo Senha */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campo Confirmar Senha */}
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar senha</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Repita a senha"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Checkbox Newsletter (LGPD) */}
        <FormField
          control={form.control}
          name="newsletterOptIn"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm text-text-secondary font-normal cursor-pointer">
                  Quero receber novidades e conteúdos por email
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        {/* Botão de submit */}
        <Button
          type="submit"
          className="w-full bg-[#22c55e] text-black hover:bg-[#16a34a] font-semibold"
          disabled={carregando}
        >
          {carregando ? 'Criando conta...' : 'Criar conta grátis'}
        </Button>
      </form>
    </Form>
  )
}
