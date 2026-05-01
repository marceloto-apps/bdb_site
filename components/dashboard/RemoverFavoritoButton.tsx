'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface RemoverFavoritoButtonProps {
  articleId: string
  articleTitle: string
}

export function RemoverFavoritoButton({ articleId, articleTitle }: RemoverFavoritoButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [removed, setRemoved] = useState(false)

  if (removed) return null

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Optimistic update
    setRemoved(true)

    try {
      const res = await fetch(`/api/favoritos/${articleId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Falha ao remover favorito')
      }

      toast({
        description: `"${articleTitle}" removido dos favoritos`,
      })

      // Revalida a listagem de favoritos
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      console.error(error)
      // Reverte o optimistic update
      setRemoved(false)
      toast({
        variant: "destructive",
        description: "Erro ao remover. Tente novamente.",
      })
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      onClick={handleRemove}
      disabled={isPending}
      title="Remover favorito"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  )
}
