'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { excluirContaSchema, type ExcluirContaInput } from '@/lib/schemas/perfil'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, AlertTriangle } from 'lucide-react'
import { signOut } from 'next-auth/react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface SecaoExcluirContaProps {
  temSenha: boolean
}

export function SecaoExcluirConta({ temSenha }: SecaoExcluirContaProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, formState: { errors, isValid }, reset } = useForm<ExcluirContaInput>({
    resolver: zodResolver(excluirContaSchema),
    mode: 'onChange', // Permite validar e habilitar o botão em tempo real
  })

  const onSubmit = async (data: ExcluirContaInput) => {
    startTransition(async () => {
      try {
        const res = await fetch('/api/dashboard/perfil', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        const result = await res.json()
        if (!res.ok) throw new Error(result.error || 'Erro ao excluir conta')

        toast({ description: 'Conta excluída com sucesso.' })
        
        // Desloga o usuário e redireciona (isso já garante a remoção do cookie no browser)
        await signOut({ callbackUrl: '/', redirect: true })

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
    <div className="bg-surface border border-destructive/50 rounded-lg p-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="space-y-1">
          <h3 className="font-semibold text-destructive flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Zona de Perigo
          </h3>
          <p className="text-sm text-muted-foreground">
            A exclusão da conta é irreversível. Todos os seus dados, histórico e assinaturas serão apagados permanentemente.
          </p>
        </div>

        <AlertDialog onOpenChange={(open) => { if (!open) reset() }}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Excluir minha conta</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <p>
                    Esta ação é permanente e não pode ser desfeita. Todos os seus dados, 
                    favoritos e histórico de leitura serão apagados do sistema.
                  </p>
                  <p>
                    Para confirmar, digite <span className="font-bold text-foreground select-none">EXCLUIR MINHA CONTA</span> no campo abaixo.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="my-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="confirmacao">Confirmação</Label>
                  <Input 
                    id="confirmacao" 
                    placeholder="EXCLUIR MINHA CONTA" 
                    {...register('confirmacao')} 
                    disabled={isPending}
                  />
                  {errors.confirmacao && <p className="text-sm text-destructive">{errors.confirmacao.message}</p>}
                </div>

                {temSenha && (
                  <div className="space-y-2">
                    <Label htmlFor="senha">Confirme com sua senha</Label>
                    <Input 
                      id="senha" 
                      type="password" 
                      {...register('senha')} 
                      disabled={isPending}
                    />
                    {errors.senha && <p className="text-sm text-destructive">{errors.senha.message}</p>}
                  </div>
                )}
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                <Button 
                  type="submit" 
                  variant="destructive" 
                  disabled={!isValid || isPending}
                >
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Excluir definitivamente
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
