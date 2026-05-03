'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { PatrimonioPoint } from '@/lib/ferramentas/validacao-risco/types'
import { Activity } from 'lucide-react'

interface CurvasPatrimonioProps {
  data: PatrimonioPoint[]
}

export function CurvasPatrimonio({ data }: CurvasPatrimonioProps) {
  return (
    <div className="bg-card border border-border p-6 rounded-2xl shadow-xl mt-6">
      <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
        <Activity size={14} className="text-primary" /> Curvas de Patrimônio (Stress Test)
      </h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis dataKey="bet" hide />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={v => `$${v}`} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                borderColor: 'hsl(var(--border))', 
                borderRadius: '10px',
                color: 'hsl(var(--foreground))'
              }} 
            />
            {Array.from({ length: 12 }).map((_, i) => (
              <Line 
                key={i} 
                type="monotone" 
                dataKey={`s${i}`} 
                stroke={i === 0 ? "hsl(var(--primary))" : "hsl(var(--border))"} 
                strokeWidth={i === 0 ? 3 : 1} 
                dot={false} 
                opacity={i === 0 ? 1 : 0.5} 
                isAnimationActive={false} 
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
