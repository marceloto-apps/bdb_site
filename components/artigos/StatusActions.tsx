'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MudarStatusDialog } from '@/components/artigos/MudarStatusDialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface StatusActionsProps {
  artigo: any
  userRole: string
}

export function StatusActions({ artigo, userRole }: StatusActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [targetStatus, setTargetStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const statusAtual = artigo.status

  // Determinar quais botões mostrar baseado no role
  const isAutor = userRole === 'AUTOR'
  const isRevisor = userRole === 'REVISOR'
  const isEditor = userRole === 'EDITOR' || userRole === 'ADMIN'

  function handleAction(status: string) {
    setTargetStatus(status)
    setDialogOpen(true)
  }

  async function onConfirm(note: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/artigos/${artigo.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus, note })
      })

      const result = await res.json()

      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Erro', description: result.error || 'Erro ao mudar status' })
        return
      }

      toast({ title: 'Sucesso', description: 'Status atualizado com sucesso.' })
      setDialogOpen(false)
      router.refresh()
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Erro inesperado' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {statusAtual === 'RASCUNHO' && (isAutor || isEditor) && (
          <Button onClick={() => handleAction('REVISAO')}>Enviar para Revisão</Button>
        )}
        
        {statusAtual === 'REVISAO' && (
          <>
            {(isRevisor || isEditor) && (
              <Button variant="destructive" onClick={() => handleAction('RASCUNHO')}>Devolver para Rascunho</Button>
            )}
            {isEditor && (
              <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleAction('PUBLICADO')}>Publicar</Button>
            )}
          </>
        )}

        {statusAtual === 'PUBLICADO' && isEditor && (
          <Button variant="outline" onClick={() => handleAction('RASCUNHO')}>Despublicar (Rascunho)</Button>
        )}
      </div>

      <MudarStatusDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        statusAtual={statusAtual}
        novoStatus={targetStatus}
        onConfirm={onConfirm}
        loading={loading}
      />
    </>
  )
}
