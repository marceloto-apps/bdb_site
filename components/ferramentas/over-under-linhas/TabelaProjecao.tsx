import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Anchor } from 'lucide-react'
import type { LinhaProjetada } from '@/lib/ferramentas/over-under-linhas/types'

interface TabelaProjecaoProps {
  data: LinhaProjetada[]
}

export function TabelaProjecao({ data }: TabelaProjecaoProps) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mercado (Gols)</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Under Proj.</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Over Proj.</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prob. Fair %</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Margem (Juice)</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Status da Linha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow 
              key={idx} 
              className={row.isAnchor ? 'bg-primary/5 border-l-4 border-l-primary' : ''}
            >
              <TableCell>
                <span className="text-sm font-black text-foreground">{row.label}</span>
              </TableCell>
              <TableCell className="font-black text-primary text-lg">
                {row.under}
              </TableCell>
              <TableCell className="font-black text-data-red text-lg">
                {row.over}
              </TableCell>
              <TableCell className="text-xs font-bold text-muted-foreground italic">
                {row.probUnder}% <span className="mx-1">/</span> {row.probOver}%
              </TableCell>
              <TableCell>
                <span className={`text-xs font-black ${row.isAnchor ? 'text-primary' : 'text-muted-foreground'}`}>
                  {row.juice}%
                </span>
              </TableCell>
              <TableCell className="text-right">
                {row.isAnchor ? (
                  <Badge variant="default" className="text-[10px] uppercase font-black px-2 gap-1">
                    <Anchor size={12} /> Âncora
                  </Badge>
                ) : (
                  <span className="text-[10px] font-black text-muted-foreground italic uppercase">Projetada</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
