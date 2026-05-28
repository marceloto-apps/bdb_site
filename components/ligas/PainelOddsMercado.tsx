'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Lock, Settings, RefreshCw, AlertCircle } from 'lucide-react'
import { OddsMercado } from '@/lib/validations/odds-mercado'

interface PainelOddsMercadoProps {
  slug: string
  homeTeamId: string | null
  awayTeamId: string | null
  onOddsChange: (odds: OddsMercado | null) => void
}

const linhasOU = ['0.5', '1.5', '2.5', '3.5', '4.5']

const createEmptyOdds = (fonte: 'bet365' | 'pinnacle' | 'manual'): OddsMercado => ({
  fonte,
  x1x2: { home: null, draw: null, away: null },
  btts: { yes: null, no: null },
  overUnder: linhasOU.reduce((acc, linha) => ({ ...acc, [linha]: { over: null, under: null } }), {}),
})

export function PainelOddsMercado({ slug, homeTeamId, awayTeamId, onOddsChange }: PainelOddsMercadoProps) {
  const [bookmaker, setBookmaker] = useState<'bet365' | 'pinnacle'>('bet365')
  const [oddsType, setOddsType] = useState<'opening' | 'current'>('current')
  const [isManual, setIsManual] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  
  const [localOdds, setLocalOdds] = useState<OddsMercado>(createEmptyOdds('bet365'))
  const [apiMatchInfo, setApiMatchInfo] = useState<{ status?: string, utcDate?: string, round?: number } | null>(null)
  const [rawInputs, setRawInputs] = useState<Record<string, string>>({})

  // Cache para não refazer fetch à toa
  const oddsCache = useRef<Record<string, OddsMercado>>({})
  
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
        setLocalOdds(cached)
        if (!isManual) {
          onOddsChange(cached)
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
          oddsCache.current[cacheKey] = fetchedOdds
          
          setApiMatchInfo({
            status: json.data.status,
            utcDate: json.data.utcDate,
            round: json.data.round
          })

          if (!isManual) {
            setLocalOdds(fetchedOdds)
            onOddsChange(fetchedOdds)
          }
        } else {
          // Sem odds ou sem jogo
          const empty = createEmptyOdds(bookmaker)
          oddsCache.current[cacheKey] = empty
          setMessage(json.message || "Nenhuma odd encontrada")
          
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
      const cached = oddsCache.current[cacheKey] || createEmptyOdds(bookmaker)
      setLocalOdds(cached)
      onOddsChange(cached)
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
        <div className="flex items-center justify-between gap-4">
          <Tabs 
            value={bookmaker} 
            onValueChange={(v) => setBookmaker(v as any)} 
            className="w-full max-w-[150px]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="bet365" disabled={isManual}>Bet365</TabsTrigger>
              <TabsTrigger value="pinnacle" disabled={isManual}>Pinnacle</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-3">
            {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />}
            
            <Tabs 
              value={oddsType} 
              onValueChange={(v) => setOddsType(v as any)} 
              className="w-full max-w-[180px]"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="current" disabled={isManual}>Atuais</TabsTrigger>
                <TabsTrigger value="opening" disabled={isManual}>Abertura</TabsTrigger>
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

        <div className="mt-auto pt-4 border-t">
          {apiMatchInfo?.status === 'SCHEDULED' ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="font-normal border-primary/20 bg-primary/5 text-primary">
                📡 {bookmaker === 'bet365' ? 'Bet365' : 'Pinnacle'} ({oddsType === 'opening' ? 'Abertura' : 'Atuais'})
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
