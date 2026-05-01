"use client"

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useFavorite } from '@/hooks/use-favorite'
import { ToastAction } from '@/components/ui/toast'

type FavoriteButtonProps = {
  articleId: string
  initialIsFavorited: boolean
}

export function FavoriteButton({
  articleId,
  initialIsFavorited,
}: FavoriteButtonProps) {
  const { status } = useSession()
  const pathname = usePathname()
  const { toast } = useToast()

  const isAuthenticated = status === 'authenticated'

  const { isFavorited, isLoading, toggle } = useFavorite({
    articleId,
    initialIsFavorited,
    isAuthenticated,
  })

  const handleToggle = async () => {
    const result = await toggle()

    if (result?.needsLogin) {
      toast({
        title: 'Faça login',
        description: 'Faça login para favoritar este artigo.',
        action: (
          <ToastAction
            altText="Entrar"
            onClick={() => {
              window.location.href = `/login?callbackUrl=${encodeURIComponent(pathname)}`
            }}
          >
            Entrar
          </ToastAction>
        ),
      })
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggle}
      disabled={isLoading || status === 'loading'}
      aria-label={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      className="shrink-0"
    >
      <Heart
        className={`h-5 w-5 transition-colors ${
          isFavorited ? 'fill-primary text-primary' : 'text-muted-foreground'
        }`}
      />
    </Button>
  )
}
