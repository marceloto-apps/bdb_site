import { Badge } from '@/components/ui/badge'

interface StatusBadgeProps {
  status: 'RASCUNHO' | 'REVISAO' | 'PUBLICADO'
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const map = {
    RASCUNHO: { label: 'Rascunho', className: 'bg-muted text-muted-foreground hover:bg-muted/80' },
    REVISAO: { label: 'Em Revisão', className: 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30' },
    PUBLICADO: { label: 'Publicado', className: 'bg-green-500/20 text-green-500 hover:bg-green-500/30' },
  }

  const { label, className } = map[status]

  return <Badge className={className} variant="outline">{label}</Badge>
}
