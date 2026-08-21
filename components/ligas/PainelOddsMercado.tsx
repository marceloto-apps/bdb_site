'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Lock, Settings, RefreshCw, AlertCircle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'
import { OddsMercado } from '@/lib/validations/odds-mercado'

interface PainelOddsMercadoProps {
  slug: string
  homeTeamId: string | null
  awayTeamId: string | null
  onOddsChange: (odds: OddsMercado | null) => void
}

interface OddsCacheEntry {
  odds: OddsMercado
  message: string | null
  apiMatchInfo: { status?: string; utcDate?: string; round?: number } | null
}

export type BookmakerSource = 'bet365' | 'pinnacle' | 'betfair-exchange'

const linhasOU = ['0.5', '1.5', '2.5', '3.5', '4.5']

const createEmptyOdds = (fonte: BookmakerSource | 'manual'): OddsMercado => ({
  fonte,
  x1x2: { home: null, draw: null, away: null },
  btts: { yes: null, no: null },
  overUnder: linhasOU.reduce((acc, linha) => ({ ...acc, [linha]: { over: null, under: null } }), {}),
})

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-2.5 rounded shadow-lg text-xs space-y-1 z-50">
        <p className="text-slate-400 font-medium">
          {new Date(label).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
        {payload.map((pld: any) => (
          <div key={pld.name} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pld.color }} />
            <span className="font-semibold text-slate-200 capitalize">{pld.name}:</span>
            <span className="font-bold text-white">{pld.value.toFixed(2)}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function PainelOddsMercado({ slug, homeTeamId, awayTeamId, onOddsChange }: PainelOddsMercadoProps) {
  const [bookmaker, setBookmaker] = useState<BookmakerSource>('bet365')
  const [oddsType, setOddsType] = useState<'opening' | 'current'>('current')
  const [isManual, setIsManual] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  
  const [localOdds, setLocalOdds] = useState<OddsMercado>(createEmptyOdds('bet365'))
  const [apiMatchInfo, setApiMatchInfo] = useState<{ status?: string, utcDate?: string, round?: number } | null>(null)
  const [rawInputs, setRawInputs] = useState<Record<string, string>>({})

  const [selectedChartMarket, setSelectedChartMarket] = useState<string>('1x2')
  const [historyData, setHistoryData] = useState<any>(null)
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false)

  // Cache para não refazer fetch à toa
  const oddsCache = useRef<Record<string, OddsCacheEntry>>({})
  
  // Ref para guardar o timeout do debounce
  const debounceRef = useRef<NodeJS.Timeout>()

  const cacheKey = `${homeTeamId}-${awayTeamId}-${bookmaker}-${oddsType}`

  // Efeito principal para buscar dados
  useEffect(() => {
    // Se não temos times, resetar tudo
    if (!homeTeamId || !awayTeamId) {
      setLocalOdds(createEmptyOdds(bookmaker))
      setApiMatchInfo(null)
      setMessage(null)
      onOddsChange(null)
      return
    }

    const fetchOdds = async () => {
      // Se já temos no cache, usa do cache
      if (oddsCache.current[cacheKey]) {
        const cached = oddsCache.current[cacheKey]
        setLocalOdds(cached.odds)
        setMessage(cached.message)
        setApiMatchInfo(cached.apiMatchInfo)
        if (!isManual) {
          onOddsChange(cached.odds)
        }
        return
      }

      setIsLoading(true)
      setMessage(null)
      try {
        const params = new URLSearchParams({
          homeTeamId,
          awayTeamId,
          bookmaker,
          oddsType
        })
        const res = await fetch(`/api/ligas/${slug}/odds-mercado?${params}`)
        const json = await res.json()

        if (res.ok && json.data) {
          const fetchedOdds: OddsMercado = {
            fonte: bookmaker,
            matchId: json.data.matchId,
            x1x2: json.data.mercados.x1x2,
            btts: json.data.mercados.btts,
            overUnder: json.data.mercados.overUnder,
          }
          
          const matchInfo = {
            status: json.data.status,
            utcDate: json.data.utcDate,
            round: json.data.round
          }

          oddsCache.current[cacheKey] = {
            odds: fetchedOdds,
            message: null,
            apiMatchInfo: matchInfo
          }
          
          setApiMatchInfo(matchInfo)
          setMessage(null)

          if (!isManual) {
            setLocalOdds(fetchedOdds)
            onOddsChange(fetchedOdds)
          }
        } else {
          // Sem odds ou sem jogo
          const empty = createEmptyOdds(bookmaker)
          const msg = json.message || "Nenhuma odd encontrada"
          
          oddsCache.current[cacheKey] = {
            odds: empty,
            message: msg,
            apiMatchInfo: null
          }
          
          setMessage(msg)
          setApiMatchInfo(null)
          
          if (!isManual) {
            setLocalOdds(empty)
            onOddsChange(empty)
            // Se foi porque não tem fixture, força o manual
            if (json.message?.includes("Nenhuma partida agendada")) {
              setIsManual(true)
              setApiMatchInfo(null)
            }
          }
        }
      } catch (error) {
        console.error("Erro ao buscar odds de mercado", error)
        setMessage("Erro de conexão ao buscar odds.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchOdds()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, homeTeamId, awayTeamId, bookmaker, oddsType])

  // Efeito para buscar histórico de odds (não responde ao filtro de atual/abertura)
  useEffect(() => {
    if (!homeTeamId || !awayTeamId) {
      setHistoryData(null)
      return
    }

    const fetchHistory = async () => {
      setIsHistoryLoading(true)
      try {
        const params = new URLSearchParams({
          homeTeamId,
          awayTeamId,
          bookmaker
        })
        const res = await fetch(`/api/ligas/${slug}/odds-mercado/historico?${params}`)
        const json = await res.json()
        if (res.ok && json.data) {
          setHistoryData(json.data.history)
        } else {
          setHistoryData(null)
        }
      } catch (err) {
        console.error("Erro ao buscar histórico de odds", err)
        setHistoryData(null)
      } finally {
        setIsHistoryLoading(false)
      }
    }

    fetchHistory()
  }, [slug, homeTeamId, awayTeamId, bookmaker])

  // Helpers para cálculo de mín/máx e dados do gráfico
  const getChartData = () => {
    if (!historyData) return []
    if (selectedChartMarket === '1x2') return historyData.x1x2 || []
    if (selectedChartMarket === 'btts') return historyData.btts || []
    if (selectedChartMarket.startsWith('ou')) {
      const line = selectedChartMarket.replace('ou', '')
      return (historyData.overUnder || {})[line] || []
    }
    return []
  }

  interface MinMaxOdd {
    selection: string
    min: number | null
    max: number | null
    current: number | null
  }

  const getMinMaxOdds = (): MinMaxOdd[] => {
    let list: any[] = []
    if (historyData) {
      if (selectedChartMarket === '1x2') list = historyData.x1x2 || []
      else if (selectedChartMarket === 'btts') list = historyData.btts || []
      else if (selectedChartMarket.startsWith('ou')) {
        const line = selectedChartMarket.replace('ou', '')
        list = (historyData.overUnder || {})[line] || []
      }
    }

    if (list.length > 0) {
      if (selectedChartMarket === '1x2') {
        const homes = list.map((d: any) => d.home).filter((v: any) => v !== null)
        const draws = list.map((d: any) => d.draw).filter((v: any) => v !== null)
        const aways = list.map((d: any) => d.away).filter((v: any) => v !== null)
        const current = list[list.length - 1]
        return [
          { selection: 'Casa', min: homes.length ? Math.min(...homes) : null, max: homes.length ? Math.max(...homes) : null, current: current?.home || null },
          { selection: 'Empate', min: draws.length ? Math.min(...draws) : null, max: draws.length ? Math.max(...draws) : null, current: current?.draw || null },
          { selection: 'Visitante', min: aways.length ? Math.min(...aways) : null, max: aways.length ? Math.max(...aways) : null, current: current?.away || null },
        ]
      }
      if (selectedChartMarket === 'btts') {
        const yeses = list.map((d: any) => d.yes).filter((v: any) => v !== null)
        const noes = list.map((d: any) => d.no).filter((v: any) => v !== null)
        const current = list[list.length - 1]
        return [
          { selection: 'Sim', min: yeses.length ? Math.min(...yeses) : null, max: yeses.length ? Math.max(...yeses) : null, current: current?.yes || null },
          { selection: 'Não', min: noes.length ? Math.min(...noes) : null, max: noes.length ? Math.max(...noes) : null, current: current?.no || null },
        ]
      }
      if (selectedChartMarket.startsWith('ou')) {
        const overs = list.map((d: any) => d.over).filter((v: any) => v !== null)
        const unders = list.map((d: any) => d.under).filter((v: any) => v !== null)
        const current = list[list.length - 1]
        return [
          { selection: 'Over', min: overs.length ? Math.min(...overs) : null, max: overs.length ? Math.max(...overs) : null, current: current?.over || null },
          { selection: 'Under', min: unders.length ? Math.min(...unders) : null, max: unders.length ? Math.max(...unders) : null, current: current?.under || null },
        ]
      }
    }

    // Fallback para as odds atuais locais
    if (selectedChartMarket === '1x2') {
      return [
        { selection: 'Casa', min: localOdds.x1x2.home, max: localOdds.x1x2.home, current: localOdds.x1x2.home },
        { selection: 'Empate', min: localOdds.x1x2.draw, max: localOdds.x1x2.draw, current: localOdds.x1x2.draw },
        { selection: 'Visitante', min: localOdds.x1x2.away, max: localOdds.x1x2.away, current: localOdds.x1x2.away },
      ]
    }
    if (selectedChartMarket === 'btts') {
      return [
        { selection: 'Sim', min: localOdds.btts.yes, max: localOdds.btts.yes, current: localOdds.btts.yes },
        { selection: 'Não', min: localOdds.btts.no, max: localOdds.btts.no, current: localOdds.btts.no },
      ]
    }
    if (selectedChartMarket.startsWith('ou')) {
      const line = selectedChartMarket.replace('ou', '')
      const oddsOU = localOdds.overUnder[line] || { over: null, under: null }
      return [
        { selection: 'Over', min: oddsOU.over, max: oddsOU.over, current: oddsOU.over },
        { selection: 'Under', min: oddsOU.under, max: oddsOU.under, current: oddsOU.under },
      ]
    }

    return []
  }

  const chartData = getChartData()
  const minMaxOdds = getMinMaxOdds()

  // Efeito para repassar mudanças no modo manual com debounce
  useEffect(() => {
    if (!isManual || !homeTeamId || !awayTeamId) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    
    debounceRef.current = setTimeout(() => {
      // Atualizar a fonte para manual para que o componente pai saiba
      const manualOdds = { ...localOdds, fonte: 'manual' as const }
      onOddsChange(manualOdds)
    }, 500)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [localOdds, isManual, homeTeamId, awayTeamId, onOddsChange])

  // Quando alterna manual/auto
  const handleModeToggle = (checked: boolean) => {
    setIsManual(checked)
    if (checked) {
      // Entrando no manual: atualiza a fonte e dispara para o pai
      const manualOdds = { ...localOdds, fonte: 'manual' as const }
      setLocalOdds(manualOdds)
      onOddsChange(manualOdds)
    } else {
      // Entrando no auto: resgata do cache ou reseta se não tiver
      setRawInputs({})
      const cached = oddsCache.current[cacheKey]
      if (cached) {
        setLocalOdds(cached.odds)
        setMessage(cached.message)
        setApiMatchInfo(cached.apiMatchInfo)
        onOddsChange(cached.odds)
      } else {
        const empty = createEmptyOdds(bookmaker)
        setLocalOdds(empty)
        setMessage(null)
        setApiMatchInfo(null)
        onOddsChange(empty)
      }
    }
  }

  // Handlers para input
  const handleOddChange = (market: keyof OddsMercado, selection: string, subSelection: string, value: string) => {
    if (!isManual) return
    
    const key = `${market}-${selection}-${subSelection}`
    setRawInputs(prev => ({ ...prev, [key]: value }))

    const numValue = value === '' ? null : parseFloat(value)
    
    setLocalOdds(prev => {
      const next = { ...prev }
      if (market === 'x1x2') {
        (next.x1x2 as any)[selection] = numValue
      } else if (market === 'btts') {
        (next.btts as any)[selection] = numValue
      } else if (market === 'overUnder') {
        if (!next.overUnder[selection]) next.overUnder[selection] = { over: null, under: null }
        ;(next.overUnder[selection] as any)[subSelection] = numValue
      }
      return next
    })
  }

  const handleBlur = (market: string, selection: string, subSelection: string) => {
    const key = `${market}-${selection}-${subSelection}`
    setRawInputs(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const getInputValue = (market: string, selection: string, subSelection: string, val: number | null) => {
    const key = `${market}-${selection}-${subSelection}`
    if (isManual && rawInputs[key] !== undefined) {
      return rawInputs[key]
    }
    return val ? val.toFixed(2) : ''
  }

  const isReadOnly = !isManual || isLoading

  const inputClass = isReadOnly 
    ? "h-8 text-center bg-muted/50 border-transparent text-muted-foreground focus-visible:ring-0 cursor-not-allowed" 
    : "h-8 text-center"

  const getJuice = (odds: (number | null | undefined)[]) => {
    if (odds.some(o => !o || o <= 1)) return null;
    const sum = odds.reduce((acc: number, val) => acc + (1 / val!), 0);
    return ((sum - 1) * 100).toFixed(1) + '%';
  }

  const renderJuice = (odds: (number | null | undefined)[]) => {
    const juice = getJuice(odds);
    if (!juice) {
      return <div className="h-8 flex items-center justify-center text-muted-foreground/30 text-xs">-</div>;
    }
    return (
      <div className="h-8 flex items-center justify-center text-sm font-bold text-amber-500 bg-amber-500/10 rounded w-full">
        {juice}
      </div>
    );
  }

  return (
    <Card className="flex flex-col h-full bg-card shadow-sm">
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between space-y-0 p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg font-semibold">Odds de Mercado</CardTitle>
        </div>
        
        <div className="flex items-center space-x-2">
          <Label htmlFor="manual-mode" className="text-xs cursor-pointer">Manual</Label>
          <Switch 
            id="manual-mode" 
            checked={isManual} 
            onCheckedChange={handleModeToggle} 
          />
        </div>
      </CardHeader>
      
      <CardContent className="p-4 md:p-6 flex flex-col gap-6 overflow-y-auto">
        
        {/* Controles de Fonte */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs 
            value={bookmaker} 
            onValueChange={(v) => setBookmaker(v as any)} 
            className="w-full min-w-[280px] flex-1 max-w-[360px]"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="bet365" disabled={isManual} className="text-xs px-1 overflow-hidden text-ellipsis whitespace-nowrap">Bet365</TabsTrigger>
              <TabsTrigger value="pinnacle" disabled={isManual} className="text-xs px-1 overflow-hidden text-ellipsis whitespace-nowrap">Pinnacle</TabsTrigger>
              <TabsTrigger value="betfair-exchange" disabled={isManual} className="text-xs px-1 overflow-hidden text-ellipsis whitespace-nowrap">BetfairEx</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />}
            
            <Tabs 
              value={oddsType} 
              onValueChange={(v) => setOddsType(v as any)} 
              className="w-full max-w-[160px]"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="current" disabled={isManual} className="text-xs px-1">Atuais</TabsTrigger>
                <TabsTrigger value="opening" disabled={isManual} className="text-xs px-1">Abertura</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Mensagem se não houver jogo ou odds */}
        {message && !isManual && (
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-500/10 p-2 rounded-md">
            <AlertCircle className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}

        {/* Grid 1X2 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-muted-foreground">RESULTADO (1X2)</Label>
            {isReadOnly && <Lock className="w-3 h-3 text-muted-foreground" />}
          </div>
          <div className="grid grid-cols-[1fr_60px] gap-2 items-end">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground mb-1 block text-center">Casa</Label>
                <Input 
                  type="number" step="0.01" min="1.01" 
                  className={inputClass} readOnly={isReadOnly}
                  value={getInputValue('x1x2', 'home', '', localOdds.x1x2.home)}
                  onChange={(e) => handleOddChange('x1x2', 'home', '', e.target.value)}
                  onBlur={() => handleBlur('x1x2', 'home', '')}
                />
              </div>
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground mb-1 block text-center">Empate</Label>
                <Input 
                  type="number" step="0.01" min="1.01" 
                  className={inputClass} readOnly={isReadOnly}
                  value={getInputValue('x1x2', 'draw', '', localOdds.x1x2.draw)}
                  onChange={(e) => handleOddChange('x1x2', 'draw', '', e.target.value)}
                  onBlur={() => handleBlur('x1x2', 'draw', '')}
                />
              </div>
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground mb-1 block text-center">Visitante</Label>
                <Input 
                  type="number" step="0.01" min="1.01" 
                  className={inputClass} readOnly={isReadOnly}
                  value={getInputValue('x1x2', 'away', '', localOdds.x1x2.away)}
                  onChange={(e) => handleOddChange('x1x2', 'away', '', e.target.value)}
                  onBlur={() => handleBlur('x1x2', 'away', '')}
                />
              </div>
            </div>
            
            <div>
              <Label className="text-[10px] uppercase text-muted-foreground mb-1 block text-center">Juice</Label>
              {renderJuice([localOdds.x1x2.home, localOdds.x1x2.draw, localOdds.x1x2.away])}
            </div>
          </div>
        </div>

        {/* Grid BTTS */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-muted-foreground">AMBAS MARCAM (BTTS)</Label>
            {isReadOnly && <Lock className="w-3 h-3 text-muted-foreground" />}
          </div>
          <div className="grid grid-cols-[1fr_60px] gap-2 items-end">
            <div className="grid grid-cols-2 gap-2 max-w-[200px]">
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground mb-1 block text-center">Sim</Label>
                <Input 
                  type="number" step="0.01" min="1.01" 
                  className={inputClass} readOnly={isReadOnly}
                  value={getInputValue('btts', 'yes', '', localOdds.btts.yes)}
                  onChange={(e) => handleOddChange('btts', 'yes', '', e.target.value)}
                  onBlur={() => handleBlur('btts', 'yes', '')}
                />
              </div>
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground mb-1 block text-center">Não</Label>
                <Input 
                  type="number" step="0.01" min="1.01" 
                  className={inputClass} readOnly={isReadOnly}
                  value={getInputValue('btts', 'no', '', localOdds.btts.no)}
                  onChange={(e) => handleOddChange('btts', 'no', '', e.target.value)}
                  onBlur={() => handleBlur('btts', 'no', '')}
                />
              </div>
            </div>
            
            <div>
              <Label className="text-[10px] uppercase text-muted-foreground mb-1 block text-center">Juice</Label>
              {renderJuice([localOdds.btts.yes, localOdds.btts.no])}
            </div>
          </div>
        </div>

        {/* Grid Over/Under */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-muted-foreground">OVER / UNDER</Label>
            {isReadOnly && <Lock className="w-3 h-3 text-muted-foreground" />}
          </div>
          
          <div className="grid grid-cols-[50px_1fr_1fr_60px] gap-2 mb-1">
            <div className="text-[10px] uppercase text-muted-foreground text-center font-semibold">Linha</div>
            <div className="text-[10px] uppercase text-muted-foreground text-center font-semibold">Over</div>
            <div className="text-[10px] uppercase text-muted-foreground text-center font-semibold">Under</div>
            <div className="text-[10px] uppercase text-muted-foreground text-center font-semibold">Juice</div>
          </div>
          
          <div className="space-y-2">
            {linhasOU.map((linha) => {
              return (
              <div key={linha} className="grid grid-cols-[50px_1fr_1fr_60px] gap-2 items-center">
                <div className="text-sm font-bold text-center bg-muted/30 h-8 flex items-center justify-center rounded">{linha}</div>
                <Input 
                  type="number" step="0.01" min="1.01" 
                  className={inputClass} readOnly={isReadOnly}
                  value={getInputValue('overUnder', linha, 'over', localOdds.overUnder[linha]?.over)}
                  onChange={(e) => handleOddChange('overUnder', linha, 'over', e.target.value)}
                  onBlur={() => handleBlur('overUnder', linha, 'over')}
                />
                <Input 
                  type="number" step="0.01" min="1.01" 
                  className={inputClass} readOnly={isReadOnly}
                  value={getInputValue('overUnder', linha, 'under', localOdds.overUnder[linha]?.under)}
                  onChange={(e) => handleOddChange('overUnder', linha, 'under', e.target.value)}
                  onBlur={() => handleBlur('overUnder', linha, 'under')}
                />
                {renderJuice([localOdds.overUnder[linha]?.over, localOdds.overUnder[linha]?.under])}
              </div>
            )})}
          </div>
        </div>

        {/* Gráfico de Histórico de Odds */}
        {!isManual && (
          <div className="space-y-4 border-t pt-4 mt-2">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">Histórico de Odds</Label>
              
              <Select value={selectedChartMarket} onValueChange={setSelectedChartMarket}>
                <SelectTrigger className="w-[180px] h-8 text-xs bg-muted/40">
                  <SelectValue placeholder="Selecione o mercado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1x2">Resultado (1x2)</SelectItem>
                  <SelectItem value="btts">Ambas Marcam (BTTS)</SelectItem>
                  <SelectItem value="ou0.5">Over/Under 0.5</SelectItem>
                  <SelectItem value="ou1.5">Over/Under 1.5</SelectItem>
                  <SelectItem value="ou2.5">Over/Under 2.5</SelectItem>
                  <SelectItem value="ou3.5">Over/Under 3.5</SelectItem>
                  <SelectItem value="ou4.5">Over/Under 4.5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tabela de Min/Max/Atual */}
            {minMaxOdds.length > 0 && (
              <div className="grid grid-cols-3 gap-2 bg-muted/20 p-2.5 rounded-lg border border-muted-foreground/10 text-xs">
                {minMaxOdds.map((oddInfo) => (
                  <div key={oddInfo.selection} className="space-y-1 text-center border-r last:border-r-0 border-muted-foreground/10">
                    <div className="font-semibold text-muted-foreground uppercase text-[10px]">{oddInfo.selection}</div>
                    <div className="grid grid-cols-3 gap-1 px-1">
                      <div className="text-[10px]">
                        <span className="text-muted-foreground/60 block text-[9px]">Mín</span>
                        <span className="font-medium text-slate-300">{oddInfo.min ? oddInfo.min.toFixed(2) : '-'}</span>
                      </div>
                      <div className="text-[10px]">
                        <span className="text-muted-foreground/60 block text-[9px]">Máx</span>
                        <span className="font-medium text-slate-300">{oddInfo.max ? oddInfo.max.toFixed(2) : '-'}</span>
                      </div>
                      <div className="text-[10px]">
                        <span className="text-primary block text-[9px] font-bold">Atual</span>
                        <span className="font-bold text-primary">{oddInfo.current ? oddInfo.current.toFixed(2) : '-'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Gráfico Recharts */}
            {isHistoryLoading ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground animate-pulse text-xs bg-muted/5 rounded-md">
                Carregando histórico...
              </div>
            ) : chartData.length > 1 ? (
              <div className="h-[200px] w-full bg-muted/5 p-2 rounded-lg border border-muted-foreground/5">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis 
                      dataKey="capturedAt" 
                      stroke="#64748b" 
                      fontSize={10}
                      tickFormatter={(value) => {
                        const date = new Date(value)
                        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                      }}
                      hide={true}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={10} 
                      domain={['auto', 'auto']}
                      tickFormatter={(value) => value.toFixed(2)}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="top" 
                      height={24} 
                      iconSize={8}
                      wrapperStyle={{ fontSize: 10 }}
                    />
                    {selectedChartMarket === '1x2' && (
                      <>
                        <Line type="monotone" dataKey="home" name="Casa" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                        <Line type="monotone" dataKey="draw" name="Empate" stroke="#94a3b8" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                        <Line type="monotone" dataKey="away" name="Visitante" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                      </>
                    )}
                    {selectedChartMarket === 'btts' && (
                      <>
                        <Line type="monotone" dataKey="yes" name="Sim" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                        <Line type="monotone" dataKey="no" name="Não" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                      </>
                    )}
                    {selectedChartMarket.startsWith('ou') && (
                      <>
                        <Line type="monotone" dataKey="over" name="Over" stroke="#8b5cf6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                        <Line type="monotone" dataKey="under" name="Under" stroke="#ec4899" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground border border-dashed rounded-md bg-muted/5 text-xs p-4 text-center">
                <span>Nenhum histórico registrado para este mercado</span>
                <span className="text-[10px] text-muted-foreground/50 mt-1">Os dados históricos são preenchidos conforme cotações mudam</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-auto pt-4 border-t">
          {apiMatchInfo?.status === 'SCHEDULED' ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="font-normal border-primary/20 bg-primary/5 text-primary">
                📡 {bookmaker === 'bet365' ? 'Bet365' : bookmaker === 'pinnacle' ? 'Pinnacle' : 'BetfairEx'} ({oddsType === 'opening' ? 'Abertura' : 'Atuais'})
              </Badge>
              <span className="truncate">
                {apiMatchInfo.utcDate ? new Date(apiMatchInfo.utcDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                {apiMatchInfo.round ? ` · R${apiMatchInfo.round}` : ''}
              </span>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic">
              {isManual ? 'Modo de inserção manual ativo.' : 'Buscando ou sem partida confirmada.'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
