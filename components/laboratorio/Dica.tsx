'use client'
/** Ícone de informação com tooltip, e rótulo com dica ao lado. Exige `TooltipProvider` no topo da página. */
import { HelpCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function Dica({ texto, className = '' }: { texto: string; className?: string }) {
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <button type="button" tabIndex={-1} aria-label="Ajuda" className={`inline-flex text-muted-foreground hover:text-foreground align-middle ${className}`} onClick={(e) => e.preventDefault()}>
          <HelpCircle className="w-3 h-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[280px] bg-card text-foreground border border-border shadow-lg leading-snug">{texto}</TooltipContent>
    </Tooltip>
  )
}

export function Rotulo({ children, dica, className = 'text-[10px]' }: { children: React.ReactNode; dica?: string; className?: string }) {
  return (
    <Label className={`${className} inline-flex items-center gap-1`}>{children}{dica && <Dica texto={dica} />}</Label>
  )
}
