'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface MudarStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  statusAtual: string
  novoStatus: string
  onConfirm: (note: string) => void
  loading?: boolean
}

export function MudarStatusDialog({ open, onOpenChange, statusAtual, novoStatus, onConfirm, loading }: MudarStatusDialogProps) {
  const [note, setNote] = useState('')

  const isDevolucao = statusAtual === 'REVISAO' && novoStatus === 'RASCUNHO'

  const statusLabels: Record<string, string> = {
    RASCUNHO: 'Rascunho',
    REVISAO: 'Em Revisão',
    PUBLICADO: 'Publicado',
  }

  function handleConfirm() {
    onConfirm(note)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Mudança de Status</DialogTitle>
          <DialogDescription>
            Você está alterando o status de <strong>{statusLabels[statusAtual]}</strong> para <strong>{statusLabels[novoStatus]}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label htmlFor="note">Comentário {isDevolucao ? '(Obrigatório)' : '(Opcional)'}</Label>
          <Textarea 
            id="note"
            placeholder={isDevolucao ? 'Explique o motivo da devolução...' : 'Adicione um comentário (opcional)...'}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-2"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={loading || (isDevolucao && note.trim().length === 0)}
          >
            {loading ? 'Salvando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
