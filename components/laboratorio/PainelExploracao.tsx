'use client'
/** Modo Estratégia — passo "Da exploração": instrução anexada (resumo, copiar, remover) e campo para colar/aplicar outra. */
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Check, Copy, Trash2 } from 'lucide-react'
import type { InstrucaoExploracao } from '@/lib/laboratorio/engine/tipos'
import { lerInstrucao, resumoDaInstrucao, textoDaInstrucao } from '@/lib/laboratorio/ui/explorador'
import { DICAS } from '@/lib/laboratorio/ui/rotulos'
import { Rotulo } from './Dica'

export function PainelExploracao({ instrucao, onAplicar, onAnexar, onRemover }: {
  instrucao?: InstrucaoExploracao
  onAplicar: (i: InstrucaoExploracao) => void
  onAnexar: (i: InstrucaoExploracao) => void
  onRemover: () => void
}) {
  const [texto, setTexto] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  const ler = (): InstrucaoExploracao | null => {
    try { setErro(null); return lerInstrucao(texto) } catch (e) { setErro((e as Error).message); return null }
  }
  const copiar = async () => {
    if (!instrucao) return
    try { await navigator.clipboard.writeText(textoDaInstrucao(instrucao)); setCopiado(true); setTimeout(() => setCopiado(false), 2000) } catch { setErro('Não foi possível copiar; selecione o texto no campo abaixo.') ; setTexto(textoDaInstrucao(instrucao)) }
  }

  return (
    <div className="space-y-3 text-sm">
      {instrucao ? (
        <div className="bg-muted/30 border border-border rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Rotulo className="text-xs" dica={DICAS.instrucao}>Instrução anexada</Rotulo>
            <div className="ml-auto flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={() => void copiar()}>{copiado ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}{copiado ? 'Copiado' : 'Copiar'}</Button>
              <Button size="sm" variant="ghost" onClick={onRemover} title="Remover a instrução da estratégia"><Trash2 className="w-3 h-3" /></Button>
            </div>
          </div>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            {resumoDaInstrucao(instrucao).map((l, k) => <li key={k} className={l.startsWith('- ') ? 'pl-3' : ''}>{l}</li>)}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Nenhuma instrução anexada. No modo Explorar, marque células e use “Copiar instrução”; cole abaixo.</p>
      )}
      <div>
        <Rotulo className="text-xs" dica={DICAS.instrucao}>Colar instrução do Explorar</Rotulo>
        <Textarea value={texto} onChange={(e) => { setTexto(e.target.value); setErro(null) }} placeholder={'# Exploração do Laboratório · …\n{ "v": 1, … }'} rows={5} className="font-mono text-xs mt-1" />
        {erro && <p className="text-xs text-data-red mt-1">{erro}</p>}
        <div className="flex flex-wrap gap-2 mt-2">
          <Button size="sm" disabled={!texto.trim()} onClick={() => { const i = ler(); if (i) { onAplicar(i); setTexto('') } }}>Aplicar à estratégia</Button>
          <Button size="sm" variant="outline" disabled={!texto.trim()} onClick={() => { const i = ler(); if (i) { onAnexar(i); setTexto('') } }}>Só anexar</Button>
          <span className="text-[10px] text-muted-foreground self-center">Aplicar substitui universo, regra e apostas pelos da instrução. Só anexar guarda o texto sem mexer na estratégia.</span>
        </div>
      </div>
    </div>
  )
}
