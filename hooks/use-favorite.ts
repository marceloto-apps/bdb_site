import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

interface UseFavoriteParams {
  articleId: string
  initialIsFavorited: boolean
  isAuthenticated: boolean
}

export function useFavorite({
  articleId,
  initialIsFavorited,
  isAuthenticated,
}: UseFavoriteParams) {
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const toggle = async () => {
    if (!isAuthenticated) {
      return { needsLogin: true }
    }

    if (isLoading) return { needsLogin: false }

    setIsLoading(true)

    // Optimistic update
    const previousIsFavorited = isFavorited
    setIsFavorited(!previousIsFavorited)

    try {
      if (!previousIsFavorited) {
        // Favoritar
        const res = await fetch('/api/favoritos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articleId }),
        })

        if (!res.ok) throw new Error('Falha ao favoritar')
      } else {
        // Desfavoritar
        const res = await fetch(`/api/favoritos/${articleId}`, {
          method: 'DELETE',
        })

        if (!res.ok) throw new Error('Falha ao remover favorito')
      }
    } catch (error) {
      console.error('[useFavorite] Erro no toggle:', error)
      // Revert optimistic update
      setIsFavorited(previousIsFavorited)

      toast({
        title: 'Erro',
        description: 'Não foi possível alterar os favoritos. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }

    return { needsLogin: false }
  }

  return { isFavorited, isLoading, toggle }
}
