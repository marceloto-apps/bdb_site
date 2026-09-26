'use client'
/**
 * Laboratório de Estratégias (Backtest Livre) — página cliente: estado da estratégia (JSON do
 * engine), Worker (carrega chunks com cache e executa), tearsheet, estratégias/runs/indicadores.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Beaker, Compass, FlaskConical, Play } from 'lucide-react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { criarLaboratorio, ErroLaboratorio, type ClienteLaboratorio, type ProgressoUI } from '@/lib/laboratorio/worker/cliente'
import type { Estrategia } from '@/lib/laboratorio/engine/tipos'
import type { CampoUI, EstrategiaSalvaUI, FuncaoUI, IndicadorSalvoUI, ResumoUI, RunComparado, RunSalvoUI, RunUI } from '@/lib/laboratorio/ui/tipos'
import { PainelUniverso } from './PainelUniverso'
import { PainelIndicadores } from './PainelIndicadores'
import { PainelRegras } from './PainelRegras'
import { PainelEntradas } from './PainelEntradas'
import { PainelStaking } from './PainelStaking'
import { PainelValidacao } from './PainelValidacao'
import { PainelExplorar, type ConfigExplorar } from './PainelExplorar'
import { Explorador } from './Explorador'
import { apostasDaCesta, CESTA_PADRAO, ESTATISTICAS, estrategiaDaCelula, type CelulaUI, type ResultadoExploracaoUI } from '@/lib/laboratorio/ui/explorador'
import type { Cruzamento } from '@/lib/laboratorio/engine/explorar'
import type { Universo } from '@/lib/laboratorio/engine/tipos'
import { Tearsheet } from './Tearsheet'
import { EstrategiasSalvas } from './EstrategiasSalvas'
import { GuiaLaboratorio } from './GuiaLaboratorio'

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
  validacao: { holdout: 'selado', folds: 'temporada', walkForward: { janelas: 4, expandindo: true }, monteCarlo: { caminhos: 2000, ruinaPct: 0.5 } },
}
const CORES = ['#22c55e', '#3b82f6', '#eab308', '#a855f7', '#f97316']
const EXPLORAR_INICIAL: ConfigExplorar = { apostas: CESTA_PADRAO, casas: ['bet365'], estatistica: null, formulaLivre: '', cortes: 'tercis', nMin: 100 }

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
  // modo Explorar
  const [modo, setModo] = useState<'explorar' | 'estrategia'>('explorar')
  const [cfgExp, setCfgExp] = useState<ConfigExplorar>(EXPLORAR_INICIAL)
  const [universoExp, setUniversoExp] = useState<Universo>({ fontes: ['core'], tipos: ['LEAGUE'] })
  const [exploracao, setExploracao] = useState<{ resultado: ResultadoExploracaoUI; universo: Universo; apostas: ReturnType<typeof apostasDaCesta>; cruz: Cruzamento | null } | null>(null)
  const [explorando, setExplorando] = useState(false)

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

  const executar = async (validacao = false) => {
    if (!lab.current) return
    setExecutando(true); setProgresso(null)
    try {
      const tentativasPrevias = atualId ? (salvas.find((s) => s.id === atualId)?.tentativas ?? 0) : 0
      const r = await lab.current.executar(estrategia, { aoProgresso: setProgresso, extras: true, validacao, tentativasPrevias })
      setRun(r.resultado as RunUI)
      if (r.carga) toast({ title: validacao ? 'Validação concluída' : 'Resultado pronto', description: `${r.carga.chunks} blocos · ${(r.carga.bytes / 1048576).toFixed(1)} MB${r.carga.doCache ? ` (${r.carga.doCache} do cache)` : ''} · ${r.carga.ms} ms` })
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
      if (!r.data.minha && r.data.definicao.validacao?.holdout === 'aberto') setEstrategia((e) => ({ ...e, validacao: { ...(e.validacao ?? {}), holdout: 'selado' } }))
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
  const cruzamentoAtual = (): Cruzamento | null => {
    if (!cfgExp.estatistica) return null
    if (cfgExp.estatistica === 'livre') return cfgExp.formulaLivre.trim() ? { rotulo: cfgExp.formulaLivre.trim(), formula: cfgExp.formulaLivre.trim(), cortes: cfgExp.cortes } : null
    const e = ESTATISTICAS.find((x) => x.id === cfgExp.estatistica)
    return e ? { rotulo: e.rotulo, formula: e.formula, cortes: cfgExp.cortes } : null
  }
  const explorar = async () => {
    if (!lab.current) return
    const apostas = apostasDaCesta(cfgExp.apostas, cfgExp.casas)
    if (!apostas.length) { toast({ title: 'Marque pelo menos uma aposta e uma casa', variant: 'destructive' }); return }
    const cruz = cruzamentoAtual()
    setExplorando(true); setProgresso(null)
    try {
      const r = await lab.current.explorar({ universo: universoExp, apostas, cruzamento: cruz ?? undefined }, setProgresso)
      setExploracao({ resultado: r.resultado as ResultadoExploracaoUI, universo: universoExp, apostas, cruz })
      if (r.carga) toast({ title: 'Exploração pronta', description: `${r.carga.chunks} blocos · ${(r.carga.bytes / 1048576).toFixed(1)} MB${r.carga.doCache ? ` (${r.carga.doCache} do cache)` : ''} · ${r.carga.ms} ms` })
    } catch (e) {
      const err = e as ErroLaboratorio
      toast({ title: err.message || 'Falha ao explorar', description: err.erros?.slice(0, 3).join(' · '), variant: 'destructive' })
    } finally { setExplorando(false); setProgresso(null) }
  }
  const levarAoLaboratorio = (c: CelulaUI) => {
    if (!exploracao) return
    try {
      const e = estrategiaDaCelula(exploracao.resultado, c, exploracao.universo, exploracao.apostas, exploracao.cruz)
      setEstrategia({ ...INICIAL, ...e }); setAtualId(null); setAtualNome(''); setRunsSalvos([]); setRun(null)
      setModo('estrategia')
      toast({ title: 'Estratégia montada', description: `${e.nome}. Ajuste a regra e execute.` })
    } catch (err) { toast({ title: 'Não foi possível montar a estratégia', description: (err as Error).message, variant: 'destructive' }) }
  }
  const abrirSelo = async () => {
    if (!atualId) return
    if (!confirm('Abrir o selo inclui a última temporada de cada liga no run e fica registrado nesta estratégia. Faça isso só quando a regra estiver pronta. Continuar?')) return
    try {
      await api(`/api/laboratorio/estrategias/${atualId}`, { method: 'PATCH', body: JSON.stringify({ holdoutAberto: true, definicao: { ...estrategia, validacao: { ...(estrategia.validacao ?? {}), holdout: 'aberto' } } }) })
      atualizar({ validacao: { ...(estrategia.validacao ?? {}), holdout: 'aberto' } })
      toast({ title: 'Selo aberto', description: 'Execute de novo para ver a última temporada separada na aba Validação.' })
      await carregarListas()
    } catch (e) { toast({ title: 'Não foi possível abrir o selo', description: (e as Error).message, variant: 'destructive' }) }
  }
  const salvarIndicador = async (nome: string, formula: string) => {
    try { await api('/api/laboratorio/indicadores', { method: 'POST', body: JSON.stringify({ nome, formula }) }); toast({ title: `Indicador ${nome} salvo` }); await carregarListas() }
    catch (e) { const err = e as ErroLaboratorio; toast({ title: err.message === 'NOME_DUPLICADO' ? 'Já existe um indicador com esse nome' : 'Não foi possível salvar', description: err.erros?.[0], variant: 'destructive' }) }
  }

  const carregarExemplo = (e: Estrategia) => { setEstrategia({ ...INICIAL, ...e }); setAtualId(null); setAtualNome(''); setRunsSalvos([]); toast({ title: 'Exemplo carregado', description: e.nome }) }

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
    <TooltipProvider>
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2"><Beaker className="w-8 h-8 text-primary" />Laboratório de Estratégias</h1>
          <p className="text-muted-foreground text-sm">Monte uma estratégia com odds e estatísticas, escolha o que apostar e veja se ela teria dado lucro de verdade. {resumo && <span className="text-xs">Dados {resumo.versao} · {resumo.totalLinhas.toLocaleString('pt-BR')} jogos · {resumo.competicoes.length} competições.</span>}</p>
          {erroPreparo && <p className="text-sm text-data-red mt-2">Não foi possível preparar o Laboratório: {erroPreparo}</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-border overflow-hidden">
            <button type="button" className={`px-3 py-1.5 text-sm flex items-center gap-1 ${modo === 'explorar' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'}`} onClick={() => setModo('explorar')}><Compass className="w-4 h-4" />Explorar</button>
            <button type="button" className={`px-3 py-1.5 text-sm flex items-center gap-1 ${modo === 'estrategia' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'}`} onClick={() => setModo('estrategia')}><FlaskConical className="w-4 h-4" />Estratégia</button>
          </div>
          <GuiaLaboratorio funcoes={funcoes} onCarregarExemplo={(e) => { carregarExemplo(e); setModo('estrategia') }} />
        </div>
      </div>

      {modo === 'explorar' && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-card border border-border rounded-2xl p-4 sticky top-4 z-10 flex items-center gap-2">
            <Button className="flex-1" disabled={!pronto || explorando} onClick={() => void explorar()}>
              <Compass className="w-4 h-4 mr-2" />{explorando ? 'Explorando…' : pronto ? 'Explorar' : 'Preparando…'}
            </Button>
          </div>
          <Accordion type="multiple" defaultValue={['jogos', 'apostas']} className="bg-card border border-border rounded-2xl px-4">
            <AccordionItem value="jogos"><AccordionTrigger>1. Jogos considerados</AccordionTrigger><AccordionContent><PainelUniverso universo={universoExp} onChange={setUniversoExp} resumo={resumo} /></AccordionContent></AccordionItem>
            <AccordionItem value="apostas"><AccordionTrigger>2. Apostas e estatística</AccordionTrigger><AccordionContent><PainelExplorar cfg={cfgExp} onChange={setCfgExp} referencias={referencias} /></AccordionContent></AccordionItem>
          </Accordion>
          <p className="text-xs text-muted-foreground px-1">Achou uma célula interessante? Clique nela e em “Levar ao Laboratório”: a aposta, a liga e a faixa viram uma estratégia pronta no modo Estratégia, com a última temporada selada.</p>
        </div>
        <div className="lg:col-span-8">
          <Explorador resultado={exploracao?.resultado ?? null} executando={explorando} progresso={progresso} nMin={cfgExp.nMin} onLevar={levarAoLaboratorio} />
        </div>
      </div>
      )}

      {modo === 'estrategia' && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-card border border-border rounded-2xl p-4 sticky top-4 z-10 flex items-center gap-2">
            <Button className="flex-1" disabled={!pronto || executando || (validacao !== null && !validacao.ok)} onClick={() => void executar()}>
              <Play className="w-4 h-4 mr-2" />{executando ? 'Executando…' : pronto ? 'Executar' : 'Preparando…'}
            </Button>
            {validacao && !validacao.ok && <span className="text-xs text-data-red">{validacao.erros.length} erro(s)</span>}
          </div>

          <Accordion type="multiple" defaultValue={['universo', 'regras', 'entradas']} className="bg-card border border-border rounded-2xl px-4">
            <AccordionItem value="universo"><AccordionTrigger>1. Jogos considerados (universo)</AccordionTrigger><AccordionContent><PainelUniverso universo={estrategia.universo ?? {}} onChange={(u) => atualizar({ universo: u })} resumo={resumo} /></AccordionContent></AccordionItem>
            <AccordionItem value="indicadores"><AccordionTrigger>2. Dados e indicadores</AccordionTrigger><AccordionContent><PainelIndicadores indicadores={estrategia.indicadores ?? []} onChange={(i) => atualizar({ indicadores: i })} catalogo={catalogo} funcoes={funcoes} salvos={indicadoresSalvos} onSalvarServidor={salvarIndicador} tiposIndicadores={tiposIndicadores} errosIndicadores={errosIndicadores} /></AccordionContent></AccordionItem>
            <AccordionItem value="regras"><AccordionTrigger>3. Regra: quais jogos entram</AccordionTrigger><AccordionContent><PainelRegras regra={estrategia.regra} onChange={(r) => atualizar({ regra: r })} referencias={referencias} validacao={errosRegra} nSelecionados={run?.nSelecionados ?? null} nUniverso={run?.nUniverso ?? null} /></AccordionContent></AccordionItem>
            <AccordionItem value="entradas"><AccordionTrigger>4. Apostas</AccordionTrigger><AccordionContent><PainelEntradas entradas={estrategia.entradas} onChange={(e) => atualizar({ entradas: e })} /></AccordionContent></AccordionItem>
            <AccordionItem value="staking"><AccordionTrigger>5. Stake, banco e opções</AccordionTrigger><AccordionContent><PainelStaking estrategia={estrategia} onChange={atualizar} /></AccordionContent></AccordionItem>
            <AccordionItem value="validacao"><AccordionTrigger>6. Validação avançada</AccordionTrigger><AccordionContent><PainelValidacao estrategia={estrategia} onChange={atualizar} seloAbertoNoServidor={!!atualId && !!salvas.find((s) => s.id === atualId)?.holdoutAberto} podeAbrirSelo={!!atualId} onAbrirSelo={() => void abrirSelo()} nSalvas={salvas.length} /></AccordionContent></AccordionItem>
            <AccordionItem value="salvas"><AccordionTrigger>7. Salvar e carregar</AccordionTrigger><AccordionContent><EstrategiasSalvas salvas={salvas} atualId={atualId} atualNome={atualNome || estrategia.nome || ''} runs={runsSalvos} onSalvar={salvarEstrategia} onCarregar={carregarEstrategia} onDuplicar={duplicarEstrategia} onApagar={apagarEstrategia} onSalvarRun={salvarRun} temRun={!!run} /></AccordionContent></AccordionItem>
          </Accordion>
        </div>

        <div className="lg:col-span-8">
          <Tearsheet run={run} executando={executando} progresso={progresso} comparados={comparados}
            onGuardar={() => { if (run && comparados.length < 5) setComparados([...comparados, { rotulo: `${atualNome || estrategia.nome || 'Run'} · ${run.hash.slice(0, 6)}`, run, cor: CORES[comparados.length] }]) }}
            onRemoverComparado={(k) => setComparados(comparados.filter((_, i) => i !== k))}
            onValidar={() => void executar(true)} seloAberto={!!atualId && !!salvas.find((s) => s.id === atualId)?.holdoutAberto} />
        </div>
      </div>
      )}
    </div>
    </TooltipProvider>
  )
}
