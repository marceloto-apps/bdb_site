'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'
import type { DrawdownBucket } from '@/lib/ferramentas/validacao-risco/types'

interface HistogramaDrawdownProps {
  histData: DrawdownBucket[]
  avgMDD: number
  worstDD: number
  simulacoesCount: number
}

export function HistogramaDrawdown({ histData, avgMDD, worstDD, simulacoesCount }: HistogramaDrawdownProps) {
  // Reformatar labels para exibição (ex: "0%" → "0-10%")
  const dadosFormatados = histData.map((bucket, i) => ({
    ...bucket,
    label: `${i * 10}-${(i + 1) * 10}%`,
  }))

  return (
    <Card className="mt-6 shadow-xl border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Frequência de Drawdown (Amostra de {simulacoesCount.toLocaleString()})
          </CardTitle>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase font-semibold">DD Médio</p>
              <p className="text-lg font-bold text-foreground">{avgMDD.toFixed(1)}%</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase font-semibold">DD Máximo (Pior)</p>
              <p className="text-lg font-bold text-data-red">{worstDD.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Eixo vertical: % das simulações que atingiram esta faixa
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosFormatados}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="label"
                fontSize={10}
                stroke="hsl(var(--muted-foreground))"
                tickLine={false}
              />
              <YAxis
                fontSize={10}
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(v: number) => `${v.toFixed(0)}%`}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: unknown) => [typeof value === 'number' ? `${value.toFixed(1)}%` : String(value), 'Simulações']}
                labelFormatter={(label: unknown) => `Faixa: ${String(label)}`}
              />
              <Bar dataKey="percent" radius={[4, 4, 0, 0]}>
                {dadosFormatados.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.danger ? '#ef4444' : 'hsl(var(--primary))'}
                    opacity={entry.danger ? 0.8 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
