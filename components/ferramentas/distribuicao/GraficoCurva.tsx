'use client'

import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ComposedChart, Area
} from 'recharts'
import type { DataPoint, EstatisticasCentrais } from '@/lib/ferramentas/distribuicao/types'
import { BarChart3 } from 'lucide-react'

interface GraficoCurvaProps {
  data: DataPoint[]
  stats: EstatisticasCentrais
}

/** Tooltip customizado em PT-BR */
function TooltipCustom({ active, payload, label }: { active?: boolean; payload?: unknown[]; label?: string | number }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-xl text-xs space-y-1">
      <p className="font-bold text-foreground">Valor: {typeof label === 'number' ? label.toFixed(1) : label}</p>
      {payload.map((entry: unknown) => {
        const e = entry as { dataKey: string; color: string; value: number }
        return (
          <p key={e.dataKey} style={{ color: e.color }}>
            {e.dataKey === 'modified' ? 'Gram-Charlier' : 'Normal'}: {e.value.toFixed(4)}
          </p>
        )
      })}
    </div>
  )
}

export function GraficoCurva({ data, stats }: GraficoCurvaProps) {
  const { media, mediana, moda, picoDensidade, sigmaMarkers } = stats

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-2xl h-full flex flex-col">
      {/* Cabeçalho com legenda e badge de pico */}
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <BarChart3 size={16} className="text-primary" /> Visualização de Densidade
        </h3>
        <div className="flex items-center gap-5">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Normal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-[10px] font-bold text-foreground uppercase">Gram-Charlier</span>
            </div>
          </div>
          <div className="bg-muted/50 border border-border px-3 py-1 rounded-full">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Pico: </span>
            <span className="text-xs font-black text-foreground">{picoDensidade.toFixed(4)}</span>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="flex-1 min-h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 40, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis
              dataKey="x"
              type="number"
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickCount={11}
              domain={['dataMin', 'dataMax']}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickFormatter={(v: number) => v.toFixed(2)}
            />
            <Tooltip content={<TooltipCustom />} />

            {/* Áreas sombreadas de Z-Score baseadas na curva modificada */}
            <Area
              type="monotone"
              dataKey="modified"
              stroke="none"
              fill="hsl(var(--primary))"
              fillOpacity={0.06}
              isAnimationActive={false}
            />

            {/* Linhas de referência ±1σ e ±2σ */}
            <ReferenceLine
              x={sigmaMarkers.minus2}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="4 4"
              opacity={0.2}
              label={{ value: '-2σ', position: 'bottom', fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
            />
            <ReferenceLine
              x={sigmaMarkers.minus1}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="4 4"
              opacity={0.35}
              label={{ value: '-1σ', position: 'bottom', fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
            />
            <ReferenceLine
              x={sigmaMarkers.plus1}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="4 4"
              opacity={0.35}
              label={{ value: '+1σ', position: 'bottom', fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
            />
            <ReferenceLine
              x={sigmaMarkers.plus2}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="4 4"
              opacity={0.2}
              label={{ value: '+2σ', position: 'bottom', fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
            />

            {/* Moda (amarelo — ponto mais alto) */}
            <ReferenceLine
              x={moda}
              stroke="#f59e0b"
              strokeDasharray="2 2"
              strokeWidth={2}
              label={{ value: 'Moda', position: 'top', dy: -24, fontSize: 10, fill: '#f59e0b', fontWeight: 700 }}
            />

            {/* Mediana (verde — intermediária) */}
            <ReferenceLine
              x={mediana}
              stroke="#22c55e"
              strokeDasharray="5 3"
              strokeWidth={2}
              label={{ value: 'Mediana', position: 'top', dy: -12, fontSize: 10, fill: '#22c55e', fontWeight: 600 }}
            />

            {/* Média (vermelho — sensível a extremos) */}
            <ReferenceLine
              x={media}
              stroke="#f43f5e"
              strokeWidth={2.5}
              label={{ value: 'Média', position: 'top', dy: 0, fontSize: 11, fill: '#f43f5e', fontWeight: 700 }}
            />

            {/* Curva Normal Base (Referência) */}
            <Line
              type="monotone"
              dataKey="normal"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              dot={false}
              opacity={0.3}
              isAnimationActive={false}
            />

            {/* Curva Gram-Charlier */}
            <Line
              type="monotone"
              dataKey="modified"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Cards educativos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg">
          <h4 className="text-[11px] font-black text-rose-400 uppercase tracking-wider mb-1.5">
            Média & Assimetria
          </h4>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Com <strong className="text-foreground">skew positivo</strong>, a média é puxada para a direita
            pelos valores extremos da cauda. A moda resiste no pico.
          </p>
        </div>
        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <h4 className="text-[11px] font-black text-purple-400 uppercase tracking-wider mb-1.5">
            Curtose & Caudas
          </h4>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Curtose {'>'} 3</strong> (leptocúrtica): pico mais
            agudo e caudas mais pesadas — risco de eventos extremos.
          </p>
        </div>
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <h4 className="text-[11px] font-black text-amber-400 uppercase tracking-wider mb-1.5">
            Moda × Mediana × Média
          </h4>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Na <strong className="text-foreground">assimetria positiva</strong>: Moda {'<'} Mediana {'<'} Média.
            O inverso ocorre na assimetria negativa.
          </p>
        </div>
      </div>
    </div>
  )
}
