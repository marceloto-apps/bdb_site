'use client'
/**
 * Laboratório de Estratégias (Backtest Livre) — página cliente: estado da estratégia (JSON do
 * engine), Worker (carrega chunks com cache e executa), tearsheet, estratégias/runs/indicadores.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Beaker, Play } from 'lucide-react'
import { criarLaboratorio, ErroLaboratorio, type ClienteLaboratorio, type ProgressoUI } from '@/lib/laboratorio/worker/cliente'
import type { Estrategia } from '@/lib/laboratorio/engine/tipos'
import type { CampoUI, EstrategiaSalvaUI, FuncaoUI, IndicadorSalvoUI, ResumoUI, RunComparado, RunSalvoUI, RunUI } from '@/lib/laboratorio/ui/tipos'
import { PainelUniverso } from './PainelUniverso'
import { PainelIndicadores } from './PainelIndicadores'
import { PainelRegras } from './PainelRegras'
import { PainelEntradas } from './PainelEntradas'
import { PainelStaking } from './PainelStaking'
import { Tearsheet } from './Tearsheet'
import { EstrategiasSalvas } from './EstrategiasSalvas'

const INICIAL: Estrategia = {
  versao: 1,
  universo: { fontes: ['core'], tipos: ['LEAGUE'] },
  indicadores: [{ nome: 'edge_h', expressao: { formula: 'odds.bet365.close.1x2.h * odds.pinnacle.close.1x2.novig_h - 1' } }],
  regra: { formula: 'edge_h > 0.02 and home.l5.pts_pg >= 1.5' },
  entradas: [{ id: 'e1', mercado: '1x2', selecao: 'home', preco: { casa: 'bet365', snapshot: 'close' } }],
  staking: { metodo: 'flat', unidade: 1 },
  bancoInicial: 100,
  bootstrap: 1000,
  seed: 42,
}
const CORES = ['#22c55e', '#3b82f6', '#eab308', '#a855f7', '#f97316']

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { credentials: 'same-origin', headers: { 'content-type': 'application/json' }, ...init })
  const body = (await r.json().catch(() => ({}))) as T & { error?: string; erros?: string[] }
  if (!r.ok) throw new ErroLaboratorio(body.error ?? `HTTP ${r.status}`, body.erros ?? [])
  return body
}

export function LaboratorioClient({ datasetDisponivel, variaveisFaltando = [] }: { datasetDisponivel: boolean; variaveisFaltando?: string[] }) {
  const { toast } = useToast()
  const lab = useRef<ClienteLaboratorio | null>(null)
  const [estrategia, setEstrategia] = useState<Estrategia>(INICIAL)
  const [pronto, setPronto] = useState(false)
  const [resumo, setResumo] = useState<ResumoUI | null>(null)
  const [catalogo, setCatalogo] = useState<CampoUI[]>([])
  const [funcoes, setFuncoes] = useState<FuncaoUI[]>([])
  const [validacao, setValidacao] = useState<{ ok: boolean; erros: string[]; avisos: string[]; indicadores: { nome: string; tipo: string }[] } | null>(null)
  const [executando, setExecutando] = useState(false)
  const [progresso, setProgresso] = useState<ProgressoUI | null>(null)
  const [run, setRun] = useState<RunUI | null>(null)
  const [comparados, setComparados] = useState<RunComparado[]>([])
  const [salvas, setSalvas] = useState<EstrategiaSalvaUI[]>([])
  const [indicadoresSalvos, setIndicadoresSalvos] = useState<IndicadorSalvoUI[]>([])
  const [runsSalvos, setRunsSalvos] = useState<RunSalvoUI[]>([])
  const [atualId, setAtualId] = useState<string | null>(null)
  const [atualNome, setAtualNome] = useState('')
  const [erroPreparo, setErroPreparo] = useState<string | null>(null)

  const atualizar = useCallback((patch: Partial<Estrategia>) => setEstrategia((e) => ({ ...e, ...patch })), [])
  const carregarListas = useCallback(async () => {
    try {
      const [e, i] = await Promise.all([api<{ data: EstrategiaSalvaUI[] }>('/api/laboratorio/estrategias'), api<{ data: IndicadorSalvoUI[] }>('/api/laboratorio/indicadores')])
      setSalvas(e.data); setIndicadoresSalvos(i.data)
    } catch { /* listas são opcionais */ }
  }, [])

  // Worker + catálogo/manifesto
  useEffect(() => {
    if (!datasetDisponivel) return
    const cliente = criarLaboratorio()
    lab.current = cliente
    cliente.preparar().then((r) => {
      setResumo(r.resumo as ResumoUI)
      const cat = r.catalogo as { campos: CampoUI[] }
      setCatalogo(cat.campos)
      setPronto(true)
    }).catch((e: Error) => setErroPreparo(e.message))
    fetch('/api/laboratorio/catalogo', { credentials: 'same-origin' }).then((r) => r.json()).then((j: { funcoes?: FuncaoUI[] }) => setFuncoes(j.funcoes ?? [])).catch(() => undefined)
    void carregarListas()
    return () => cliente.encerrar()
  }, [datasetDisponivel, carregarListas])

  // validação ao vivo (debounce)
  useEffect(() => {
    if (!pronto || !lab.current) return
    const t = setTimeout(() => { lab.current?.validar(estrategia).then((v) => setValidacao({ ok: v.ok, erros: v.erros, avisos: v.avisos, indicadores: v.indicadores })).catch(() => undefined) }, 500)
    return () => clearTimeout(t)
  }, [estrategia, pronto])

  const executar = async () => {
    if (!lab.current) return
    setExecutando(true); setProgresso(null)
    try {
      const r = await lab.current.executar(estrategia, { aoProgresso: setProgresso, extras: true })
      setRun(r.resultado as RunUI)
      if (r.carga) toast({ title: 'Run concluído', description: `${r.carga.chunks} blocos · ${(r.carga.bytes / 1048576).toFixed(1)} MB${r.carga.doCache ? ` (${r.carga.doCache} do cache)` : ''} · ${r.carga.ms} ms` })
    } catch (e) {
      const err = e as ErroLaboratorio
      toast({ title: err.message || 'Falha ao executar', description: err.erros?.slice(0, 3).join(' · '), variant: 'destructive' })
    } finally { setExecutando(false); setProgresso(null) }
  }

  const salvarEstrategia = async (nome: string, descricao: string, publica: boolean, comoNova: boolean) => {
    try {
      const definicao = { ...estrategia, nome }
      if (atualId && !comoNova) {
        await api(`/api/laboratorio/estrategias/${atualId}`, { method: 'PATCH', body: JSON.stringify({ nome, descricao: descricao || undefined, definicao, publica }) })
      } else {
        const r = await api<{ data: { id: string } }>('/api/laboratorio/estrategias', { method: 'POST', body: JSON.stringify({ nome, descricao: descricao || undefined, definicao, publica }) })
        setAtualId(r.data.id)
      }
      setAtualNome(nome); atualizar({ nome })
      toast({ title: 'Estratégia salva' })
      await carregarListas()
    } catch (e) { const err = e as ErroLaboratorio; toast({ title: 'Não foi possível salvar', description: err.erros?.[0] ?? err.message, variant: 'destructive' }) }
  }
  const carregarEstrategia = async (id: string) => {
    try {
      const r = await api<{ data: { id: string; nome: string; definicao: Estrategia; minha: boolean } }>(`/api/laboratorio/estrategias/${id}`)
      setEstrategia({ ...INICIAL, ...r.data.definicao })
      setAtualId(r.data.minha ? r.data.id : null); setAtualNome(r.data.minha ? r.data.nome : `${r.data.nome} (cópia)`)
      const runs = r.data.minha ? await api<{ data: RunSalvoUI[] }>(`/api/laboratorio/runs?strategyId=${id}`) : { data: [] }
      setRunsSalvos(runs.data)
    } catch (e) { toast({ title: 'Não foi possível carregar', description: (e as Error).message, variant: 'destructive' }) }
  }
  const duplicarEstrategia = async (id: string) => {
    const r = await api<{ data: { nome: string; definicao: Estrategia } }>(`/api/laboratorio/estrategias/${id}`)
    setEstrategia({ ...INICIAL, ...r.data.definicao }); setAtualId(null); setAtualNome(`${r.data.nome} (cópia)`); setRunsSalvos([])
  }
  const apagarEstrategia = async (id: string) => {
    await api(`/api/laboratorio/estrategias/${id}`, { method: 'DELETE' })
    if (atualId === id) { setAtualId(null); setRunsSalvos([]) }
    await carregarListas()
  }
  const salvarRun = async () => {
    if (!run) return
    try {
      const r = await api<{ data: { id: string; tentativas: number } }>('/api/laboratorio/runs', { method: 'POST', body: JSON.stringify({ strategyId: atualId ?? undefined, definicao: estrategia, resultado: { ...run, apostas: run.apostas.slice(0, 2000).map((a) => ({ ...a, extras: undefined })) } }) })
      toast({ title: 'Run salvo', description: `${r.data.tentativas} tentativa(s) registrada(s) nesta estratégia` })
      if (atualId) setRunsSalvos((await api<{ data: RunSalvoUI[] }>(`/api/laboratorio/runs?strategyId=${atualId}`)).data)
      await carregarListas()
    } catch (e) { toast({ title: 'Não foi possível salvar o run', description: (e as Error).message, variant: 'destructive' }) }
  }
  const salvarIndicador = async (nome: string, formula: string) => {
    try { await api('/api/laboratorio/indicadores', { method: 'POST', body: JSON.stringify({ nome, formula }) }); toast({ title: `Indicador ${nome} salvo` }); await carregarListas() }
    catch (e) { const err = e as ErroLaboratorio; toast({ title: err.message === 'NOME_DUPLICADO' ? 'Já existe um indicador com esse nome' : 'Não foi possível salvar', description: err.erros?.[0], variant: 'destructive' }) }
  }

  const referencias = useMemo(() => [...(estrategia.indicadores ?? []).map((i) => i.nome), ...catalogo.map((c) => c.key)], [catalogo, estrategia.indicadores])
  const tiposIndicadores = useMemo(() => Object.fromEntries((validacao?.indicadores ?? []).map((i) => [i.nome, i.tipo])), [validacao])
  const errosIndicadores = useMemo(() => (validacao?.erros ?? []).filter((e) => e.startsWith('Indicador')), [validacao])
  const errosRegra = useMemo(() => validacao ? { ok: validacao.ok, erros: validacao.erros.filter((e) => !e.startsWith('Indicador')), avisos: validacao.avisos } : null, [validacao])

  if (!datasetDisponivel) return (
    <div className="p-8 text-center text-muted-foreground space-y-2">
      <p>O dataset do Laboratório ainda não está configurado neste ambiente.</p>
      {variaveisFaltando.length > 0 && <p className="text-xs">Variáveis ausentes no servidor: <span className="font-mono">{variaveisFaltando.join(', ')}</span>. Na Vercel, confira o nome exato e o ambiente (Production) e faça um novo deploy.</p>}
    </div>
  )

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-2"><Beaker className="w-8 h-8 text-primary" />Laboratório de Estratégias</h1>
        <p className="text-muted-foreground text-sm">Combine odds e estatísticas por fórmula, defina entradas e valide com CLV, drawdown e inferência. {resumo && <span className="text-xs">Dataset {resumo.versao} · {resumo.totalLinhas.toLocaleString('pt-BR')} jogos · {resumo.competicoes.length} competições.</span>}</p>
        {erroPreparo && <p className="text-sm text-data-red mt-2">Não foi possível preparar o Laboratório: {erroPreparo}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-card border border-border rounded-2xl p-4 sticky top-4 z-10 flex items-center gap-2">
            <Button className="flex-1" disabled={!pronto || executando || (validacao !== null && !validacao.ok)} onClick={() => void executar()}>
              <Play className="w-4 h-4 mr-2" />{executando ? 'Executando…' : pronto ? 'Executar' : 'Preparando…'}
            </Button>
            {validacao && !validacao.ok && <span className="text-xs text-data-red">{validacao.erros.length} erro(s)</span>}
          </div>

          <Accordion type="multiple" defaultValue={['universo', 'regras', 'entradas']} className="bg-card border border-border rounded-2xl px-4">
            <AccordionItem value="universo"><AccordionTrigger>1. Universo</AccordionTrigger><AccordionContent><PainelUniverso universo={estrategia.universo ?? {}} onChange={(u) => atualizar({ universo: u })} resumo={resumo} /></AccordionContent></AccordionItem>
            <AccordionItem value="indicadores"><AccordionTrigger>2. Indicadores e catálogo</AccordionTrigger><AccordionContent><PainelIndicadores indicadores={estrategia.indicadores ?? []} onChange={(i) => atualizar({ indicadores: i })} catalogo={catalogo} funcoes={funcoes} salvos={indicadoresSalvos} onSalvarServidor={salvarIndicador} tiposIndicadores={tiposIndicadores} errosIndicadores={errosIndicadores} /></AccordionContent></AccordionItem>
            <AccordionItem value="regras"><AccordionTrigger>3. Regra de seleção</AccordionTrigger><AccordionContent><PainelRegras regra={estrategia.regra} onChange={(r) => atualizar({ regra: r })} referencias={referencias} validacao={errosRegra} nSelecionados={run?.nSelecionados ?? null} nUniverso={run?.nUniverso ?? null} /></AccordionContent></AccordionItem>
            <AccordionItem value="entradas"><AccordionTrigger>4. Entradas</AccordionTrigger><AccordionContent><PainelEntradas entradas={estrategia.entradas} onChange={(e) => atualizar({ entradas: e })} /></AccordionContent></AccordionItem>
            <AccordionItem value="staking"><AccordionTrigger>5. Staking e opções</AccordionTrigger><AccordionContent><PainelStaking estrategia={estrategia} onChange={atualizar} /></AccordionContent></AccordionItem>
            <AccordionItem value="salvas"><AccordionTrigger>6. Salvar e carregar</AccordionTrigger><AccordionContent><EstrategiasSalvas salvas={salvas} atualId={atualId} atualNome={atualNome || estrategia.nome || ''} runs={runsSalvos} onSalvar={salvarEstrategia} onCarregar={carregarEstrategia} onDuplicar={duplicarEstrategia} onApagar={apagarEstrategia} onSalvarRun={salvarRun} temRun={!!run} /></AccordionContent></AccordionItem>
          </Accordion>
        </div>

        <div className="lg:col-span-8">
          <Tearsheet run={run} executando={executando} progresso={progresso} comparados={comparados}
            onGuardar={() => { if (run && comparados.length < 5) setComparados([...comparados, { rotulo: `${atualNome || estrategia.nome || 'Run'} · ${run.hash.slice(0, 6)}`, run, cor: CORES[comparados.length] }]) }}
            onRemoverComparado={(k) => setComparados(comparados.filter((_, i) => i !== k))} />
        </div>
      </div>
    </div>
  )
}
