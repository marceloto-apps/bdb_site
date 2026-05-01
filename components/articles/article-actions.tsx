"use client"

import { FavoriteButton } from './favorite-button'
import { ReadingTracker } from './reading-tracker'

type ArticleActionsProps = {
  articleId: string
  initialIsFavorited: boolean
}

export function ArticleActions({
  articleId,
  initialIsFavorited,
}: ArticleActionsProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-muted-foreground">
        Salvar artigo
      </span>
      <FavoriteButton
        articleId={articleId}
        initialIsFavorited={initialIsFavorited}
      />
      <ReadingTracker articleId={articleId} />
    </div>
  )
}
