import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Target } from 'lucide-react'
import type { LinhaCalculada25 } from '@/lib/ferramentas/over-under-25/types'

interface TabelaLinhasProps {
  data: LinhaCalculada25[]
}

export function TabelaLinhas({ data }: TabelaLinhasProps) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Linha de Gols</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Under Proj.</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Over Proj.</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prob. % (U/O)</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Juice Dinâmica</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Afastamento</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow 
              key={idx} 
              className={row.isBase ? 'bg-primary/5 border-l-4 border-l-primary' : ''}
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-foreground">LINE {row.line}</span>
                  {row.isBase && <Target size={14} className="text-primary" />}
                </div>
              </TableCell>
              <TableCell className="font-black text-primary text-base">{row.under}</TableCell>
              <TableCell className="font-black text-data-red text-base">{row.over}</TableCell>
              <TableCell className="font-bold text-[11px] text-primary/80 tracking-tighter uppercase">
                {row.probUnder}% <span className="text-muted-foreground mx-1">|</span> {row.probOver}%
              </TableCell>
              <TableCell className="text-center">
                <span className={`text-[11px] font-bold ${row.isBase ? 'text-primary' : 'text-muted-foreground'}`}>
                  {row.juice}%
                </span>
              </TableCell>
              <TableCell className="text-right">
                {row.isBase ? (
                  <span className="bg-primary/10 text-primary text-[9px] font-black px-2 py-1 rounded border border-primary/20 uppercase tracking-tighter">
                    🎯 Base
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {row.afastamento}
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
