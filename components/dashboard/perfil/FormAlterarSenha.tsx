'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { alterarSenhaSchema, type AlterarSenhaInput } from '@/lib/schemas/perfil'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Info } from 'lucide-react'

interface FormAlterarSenhaProps {
  temSenha: boolean
}

export function FormAlterarSenha({ temSenha }: FormAlterarSenhaProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AlterarSenhaInput>({
    resolver: zodResolver(alterarSenhaSchema),
  })

  // Para contas OAuth
  if (!temSenha) {
    return (
      <div className="bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 shrink-0 mt-0.5" />
        <p className="text-sm">
          Você se cadastrou via Google. Sua autenticação é gerenciada pela conta Google e não há senha para alterar.
        </p>
      </div>
    )
  }

  const onSubmit = async (data: AlterarSenhaInput) => {
    startTransition(async () => {
      try {
        const res = await fetch('/api/dashboard/perfil/senha', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        const result = await res.json()
        if (!res.ok) throw new Error(result.error || 'Erro ao alterar senha')

        toast({ description: 'Senha alterada com sucesso.' })
        reset() // Limpa os campos após sucesso
      } catch (error) {
        if (error instanceof Error) {
          toast({ variant: 'destructive', description: error.message })
        } else {
          toast({ variant: 'destructive', description: 'Erro inesperado.' })
        }
      }
    })
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
        <div className="space-y-2">
          <Label htmlFor="senhaAtual">Senha atual</Label>
          <Input 
            id="senhaAtual" 
            type="password" 
            {...register('senhaAtual')} 
            disabled={isPending}
          />
          {errors.senhaAtual && <p className="text-sm text-destructive">{errors.senhaAtual.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="novaSenha">Nova senha</Label>
          <Input 
            id="novaSenha" 
            type="password" 
            {...register('novaSenha')} 
            disabled={isPending}
          />
          {errors.novaSenha && <p className="text-sm text-destructive">{errors.novaSenha.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmarNovaSenha">Confirmar nova senha</Label>
          <Input 
            id="confirmarNovaSenha" 
            type="password" 
            {...register('confirmarNovaSenha')} 
            disabled={isPending}
          />
          {errors.confirmarNovaSenha && <p className="text-sm text-destructive">{errors.confirmarNovaSenha.message}</p>}
        </div>

        <Button 
          type="submit" 
          disabled={isPending}
          className="w-full sm:w-auto"
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Alterar senha
        </Button>
      </form>
    </div>
  )
}
