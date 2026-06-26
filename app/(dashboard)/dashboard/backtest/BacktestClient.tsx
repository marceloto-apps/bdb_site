// app/(dashboard)/dashboard/backtest/BacktestClient.tsx
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  LineChart as ReChartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import {
  Play,
  Save,
  Trash2,
  TrendingUp,
  Target,
  Sparkles,
  BarChart3,
  Calendar,
  AlertTriangle,
  History,
  FileText,
  Search,
  CheckCircle,
  XCircle,
  Info,
  Download
} from 'lucide-react'

interface Season {
  id: string
  year: string
  isCurrent: boolean
}

interface CompetitionOption {
  id: string
  name: string
  country: string
  slug: string
  seasons: Season[]
  minDate: string | null
  maxDate: string | null
}

interface SavedBacktest {
  id: string
  name: string
  filters: any
  resultMeta: any
  createdAt: string
}

interface BacktestClientProps {
  initialCompetitions: CompetitionOption[]
  initialSavedBacktests: SavedBacktest[]
}

const getContinentForCountry = (country: string, slug?: string | null): string => {
  const c = country.toLowerCase().trim()
  const s = slug?.toLowerCase().trim() || ''

  if (['brasil', 'brazil', 'argentina', 'uruguay', 'uruguai', 'colombia', 'colômbia', 'paraguay', 'paraguai', 'ecuador', 'equador', 'bolivia', 'bolívia', 'chile', 'peru', 'venezuela'].includes(c) || s.includes('brasileirao') || s.includes('uruguay')) {
    return 'América do Sul'
  }
  if (['usa', 'estados unidos', 'canada', 'canadá', 'mexico', 'méxico'].includes(c) || s.includes('mls') || s.includes('usl') || s.includes('canadian')) {
    return 'América do Norte'
  }
  if (['italy', 'italia', 'itália', 'england', 'inglaterra', 'germany', 'alemanha', 'netherlands', 'holanda', 'portugal', 'belgium', 'bélgica', 'spain', 'espanha', 'denmark', 'dinamarca', 'poland', 'polônia', 'serbia', 'sérvia', 'bulgaria', 'bulgária', 'norway', 'noruega', 'sweden', 'suécia', 'finland', 'finlândia', 'ireland', 'irlanda', 'france', 'frança', 'greece', 'grécia', 'turkey', 'turquia', 'scotland', 'escócia', 'austria', 'áustria', 'switzerland', 'suíça', 'ukraine', 'ucrânia', 'croatia', 'croácia'].includes(c) || s.includes('bundesliga') || s.includes('laliga') || s.includes('eredivisie') || s.includes('championship')) {
    return 'Europa'
  }
  if (['japan', 'japão', 'south korea', 'coreia do sul', 'china', 'australia', 'austrália', 'saudi arabia', 'arábia saudita'].includes(c) || s.includes('j1') || s.includes('j2') || s.includes('k-league') || s.includes('cfa-super')) {
    return 'Ásia & Oceania'
  }
  return 'Internacional / Outros'
}

const ODD_RANGES = [
  { id: '1.01-1.20', label: '1.01 - 1.20' },
  { id: '1.21-1.40', label: '1.21 - 1.40' },
  { id: '1.41-1.60', label: '1.41 - 1.60' },
  { id: '1.61-1.80', label: '1.61 - 1.80' },
  { id: '1.81-2.00', label: '1.81 - 2.00' },
  { id: '2.01-2.50', label: '2.01 - 2.50' },
  { id: '2.51-3.00', label: '2.51 - 3.00' },
  { id: '3.01-4.00', label: '3.01 - 4.00' },
  { id: '4.01-5.00', label: '4.01 - 5.00' },
  { id: '5.01-7.00', label: '5.01 - 7.00' },
  { id: '7.01-10.00', label: '7.01 - 10.00' },
  { id: '10.01+', label: '10.01+' },
]

export function BacktestClient({ initialCompetitions, initialSavedBacktests }: BacktestClientProps) {
  const { toast } = useToast()

  // Form e Configs
  const [competitions] = useState<CompetitionOption[]>(initialCompetitions)
  const [savedProfiles, setSavedProfiles] = useState<SavedBacktest[]>(initialSavedBacktests)

  // Filtros selecionados
  const [competitionId, setCompetitionId] = useState<string>('')
  const [selectedSeasonIds, setSelectedSeasonIds] = useState<string[]>([])
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [model, setModel] = useState<string>('POISSON')
  const [lambdaMethod, setLambdaMethod] = useState<string>('MEDIA_SIMPLES')
  const [windowSize, setWindowSize] = useState<string>('5') // Janela de média móvel
  const [market, setMarket] = useState<string>('1X2')
  const [betSide, setBetSide] = useState<string>('HOME')
  const [line, setLine] = useState<string>('2.5')
  const [criterion, setCriterion] = useState<string>('PROBABILITY_ONLY')
  const [minProbability, setMinProbability] = useState<number>(55)
  const [maxProbability, setMaxProbability] = useState<number>(100)
  const [minEv, setMinEv] = useState<number>(5) // em %
  const [maxEv, setMaxEv] = useState<number>(100) // em %
  const [matchOddsHomeRanges, setMatchOddsHomeRanges] = useState<string[]>([])
  const [matchOddsDrawRanges, setMatchOddsDrawRanges] = useState<string[]>([])
  const [matchOddsAwayRanges, setMatchOddsAwayRanges] = useState<string[]>([])
  const [matchOddsOver25Ranges, setMatchOddsOver25Ranges] = useState<string[]>([])
  const [matchOddsUnder25Ranges, setMatchOddsUnder25Ranges] = useState<string[]>([])
  const [minOdd, setMinOdd] = useState<string>('1.00')
  const [maxOdd, setMaxOdd] = useState<string>('10.00')
  const [stake, setStake] = useState<number>(100)
  const [stakeType, setStakeType] = useState<'VALOR' | 'UNIDADES'>('VALOR')
  const [oddsType, setOddsType] = useState<'PREMATCH_OPENING' | 'PREMATCH_CLOSING'>('PREMATCH_CLOSING')
  const [filterOddsType, setFilterOddsType] = useState<'PREMATCH_OPENING' | 'PREMATCH_CLOSING'>('PREMATCH_CLOSING')

  // Estados para nova segmentação de ligas
  const [leagueSelectionType, setLeagueSelectionType] = useState<string>('ALL_LEAGUES') // ALL_LEAGUES | SEASON_TYPE | CONTINENT | COUNTRY | LEAGUE_BY_LEAGUE
  const [seasonType, setSeasonType] = useState<string>('INICIO_ANO') // INICIO_ANO | MEIO_ANO
  const [selectedContinents, setSelectedContinents] = useState<string[]>(['Europa', 'América do Sul'])
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>([])
  const [selectedSeasonYears, setSelectedSeasonYears] = useState<string[]>([])

  // Filtros de Busca local
  const [countrySearch, setCountrySearch] = useState<string>('')
  const [leagueSearch, setLeagueSearch] = useState<string>('')

  // Mapear países e continentes disponíveis
  const availableCountries = useMemo(() => {
    const countries = new Set<string>()
    competitions.forEach((c) => {
      if (c.country) countries.add(c.country)
    })
    return Array.from(countries).sort((a, b) => a.localeCompare(b))
  }, [competitions])

  const availableContinents = ['Europa', 'América do Sul', 'América do Norte', 'Ásia & Oceania', 'Internacional / Outros']

  // Filtrar base de dados na UI
  const filteredCountries = useMemo(() => {
    return availableCountries.filter((c) =>
      c.toLowerCase().includes(countrySearch.toLowerCase())
    )
  }, [availableCountries, countrySearch])

  const filteredLeagues = useMemo(() => {
    return competitions.filter((comp) =>
      comp.name.toLowerCase().includes(leagueSearch.toLowerCase()) ||
      comp.country.toLowerCase().includes(leagueSearch.toLowerCase())
    )
  }, [competitions, leagueSearch])

  // Ligas efetivamente selecionadas
  const selectedComps = useMemo(() => {
    if (leagueSelectionType === 'ALL_LEAGUES') {
      return competitions
    }
    if (leagueSelectionType === 'SEASON_TYPE') {
      return competitions.filter((comp) => {
        const hasSlash = comp.seasons.some((s) => s.year.includes('/'))
        return seasonType === 'INICIO_ANO' ? !hasSlash : hasSlash
      })
    }
    if (leagueSelectionType === 'CONTINENT') {
      return competitions.filter((comp) => {
        const continent = getContinentForCountry(comp.country, comp.slug)
        return selectedContinents.includes(continent)
      })
    }
    if (leagueSelectionType === 'COUNTRY') {
      return competitions.filter((comp) => selectedCountries.includes(comp.country))
    }
    if (leagueSelectionType === 'LEAGUE_BY_LEAGUE') {
      return competitions.filter((comp) => selectedLeagues.includes(comp.id))
    }
    return []
  }, [leagueSelectionType, seasonType, selectedContinents, selectedCountries, selectedLeagues, competitions])

  // Anos de temporadas disponíveis para as ligas selecionadas
  const availableYears = useMemo(() => {
    const years = new Set<string>()
    selectedComps.forEach((comp) => {
      comp.seasons.forEach((se) => {
        years.add(se.year)
      })
    })
    return Array.from(years).sort((a, b) => b.localeCompare(a))
  }, [selectedComps])

  // Limites globais de datas das ligas selecionadas
  const dateLimits = useMemo(() => {
    let min: any = null
    let max: any = null
    selectedComps.forEach((comp) => {
      if (comp.minDate) {
        if (!min || comp.minDate < min) min = comp.minDate
      }
      if (comp.maxDate) {
        if (!max || comp.maxDate > max) max = comp.maxDate
      }
    })
    return {
      minDate: typeof min === 'string' ? min.substring(0, 10) : '',
      maxDate: typeof max === 'string' ? max.substring(0, 10) : '',
    }
  }, [selectedComps])

  // Controle de Interface
  const [running, setRunning] = useState<boolean>(false)
  const [results, setResults] = useState<any | null>(null)
  const [saveName, setSaveName] = useState<string>('')
  const [saving, setSaving] = useState<boolean>(false)

  // Lista filtrada de temporadas da competição atual (para compatibilidade/caso de 1 liga)
  const activeComp = competitions.find((c) => c.id === competitionId)

  // Sincronizar competitionId se houver apenas uma competição ativa
  useEffect(() => {
    if (selectedComps.length === 1) {
      setCompetitionId(selectedComps[0].id)
    } else {
      setCompetitionId('')
    }
  }, [selectedComps])

  // Atualizar datas limite quando as competições selecionadas mudarem
  useEffect(() => {
    if (selectedComps.length > 0) {
      if (dateLimits.minDate) {
        setStartDate(dateLimits.minDate)
      } else {
        setStartDate('')
      }
      if (dateLimits.maxDate) {
        setEndDate(dateLimits.maxDate)
      } else {
        setEndDate('')
      }
    } else {
      setStartDate('')
      setEndDate('')
    }
    setSelectedSeasonIds([])
    setSelectedSeasonYears([])
  }, [selectedComps, dateLimits.minDate, dateLimits.maxDate])

  // Ajustar o BetSide padrão quando o mercado mudar
  useEffect(() => {
    if (market === '1X2') {
      setBetSide('HOME')
      setLine('')
    } else if (market === 'BTTS') {
      setBetSide('YES')
      setLine('')
    } else if (market === 'OVER_UNDER') {
      setBetSide('OVER')
      setLine('2.5')
    } else if (market === 'ASIAN_HANDICAP') {
      setBetSide('HOME')
      setLine('-0.5')
    }
  }, [market])

  // Rodar o Backtest com timeout de 15 segundos
  const handleRunBacktest = async () => {
    if (selectedComps.length === 0) {
      toast({
        title: 'Selecione uma liga',
        description: 'É necessário selecionar ao menos uma liga antes de executar o backtest.',
        variant: 'destructive',
      })
      return
    }

    setRunning(true)
    setResults(null)

    // Controlador para implementar timeout de 15 segundos
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 15000)

    try {
      const payload = {
        competitionId: selectedComps.length === 1 ? selectedComps[0].id : null,
        competitionIds: selectedComps.map((c) => c.id),
        seasonIds: selectedComps.length === 1 ? selectedSeasonIds : [],
        seasonYears: selectedComps.length > 1 ? selectedSeasonYears : [],
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
        model,
        lambdaMethod,
        minProbability: minProbability / 100,
        maxProbability: maxProbability ? maxProbability / 100 : null,
        minOdd: minOdd ? parseFloat(minOdd) : null,
        maxOdd: maxOdd ? parseFloat(maxOdd) : null,
        market,
        betSide,
        line: line ? parseFloat(line) : null,
        stake,
        oddsType,
        filterOddsType,
        windowSize: windowSize === 'null' ? null : parseInt(windowSize),
        criterion,
        minEv: minEv / 100,
        maxEv: maxEv / 100,
        filterOdds: {
          homeRanges: matchOddsHomeRanges,
          drawRanges: matchOddsDrawRanges,
          awayRanges: matchOddsAwayRanges,
          over25Ranges: matchOddsOver25Ranges,
          under25Ranges: matchOddsUnder25Ranges,
        },
      }

      const res = await fetch('/api/backtest/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const body = await res.json()
      if (!res.ok) {
        throw new Error(body.error || 'Erro ao processar simulação.')
      }

      setResults(body.data)
      toast({
        title: 'Simulação Concluída!',
        description: `Backtest executado em ${body.data.summary.totalBets} apostas filtradas.`,
      })
    } catch (err: any) {
      clearTimeout(timeoutId)
      console.error(err)
      let msg = err.message || 'Erro de rede ao processar o backtest.'
      if (err.name === 'AbortError') {
        msg = 'O processamento do backtest excedeu o limite de 15s. Tente reduzir o período das datas.'
      }
      toast({
        title: 'Falha no Backtest',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setRunning(false)
    }
  }

  // Exportar os cálculos detalhados para CSV
  const handleExportCSV = () => {
    if (!results || !results.bets || results.bets.length === 0) {
      toast({
        title: 'Nenhum dado para exportar',
        description: 'Execute um backtest com resultados para poder exportar.',
        variant: 'destructive',
      })
      return
    }

    // Definir cabeçalho do CSV
    const headers = [
      'Competicao',
      'Temporada',
      'Data da Partida',
      'Mandante',
      'Visitante',
      'Gols Mandante (Placar Real)',
      'Gols Visitante (Placar Real)',
      'Casa de Aposta',
      'Odd Obtida',
      'Stake (Investimento)',
      'Mercado',
      'Lado Escolhido',
      'Linha',
      'Tipo de Odd (Resultado)',
      'Tipo de Odd (Filtro)',
      'Modelo',
      'Metodo Lambda',
      'Media Gols Mandante (Gols Feitos)',
      'Media Gols Mandante (Gols Sofridos)',
      'Media Gols Visitante (Gols Feitos)',
      'Media Gols Visitante (Gols Sofridos)',
      'Media Geral Gols Casa (muH)',
      'Media Geral Gols Fora (muA)',
      'Probabilidade Projetada (%)',
      'Valor Esperado (EV %)',
      'Resultado Aposta',
      'Retorno (P&L)',
      'P&L Acumulado'
    ]

    // Formatar linhas
    const rows = results.bets.map((bet: any) => {
      const date = new Date(bet.utcDate).toLocaleString('pt-BR')
      return [
        `"${bet.competitionName ?? 'N/A'}"`,
        `"${bet.seasonYear ?? 'N/A'}"`,
        `"${date}"`,
        `"${bet.homeTeam}"`,
        `"${bet.awayTeam}"`,
        bet.fthg,
        bet.ftag,
        `"${bet.bookmaker}"`,
        bet.odd,
        bet.stake,
        `"${market}"`,
        `"${betSide}"`,
        line || 'N/A',
        oddsType === 'PREMATCH_OPENING' ? '"Abertura"' : '"Fechamento"',
        filterOddsType === 'PREMATCH_OPENING' ? '"Abertura"' : '"Fechamento"',
        `"${model}"`,
        `"${lambdaMethod}"`,
        bet.homeGoalsAvgScored ?? 'N/A',
        bet.homeGoalsAvgConceded ?? 'N/A',
        bet.awayGoalsAvgScored ?? 'N/A',
        bet.awayGoalsAvgConceded ?? 'N/A',
        bet.leagueMuH ?? 'N/A',
        bet.leagueMuA ?? 'N/A',
        `${(bet.modelProb * 100).toFixed(2)}%`,
        `${(bet.ev * 100).toFixed(2)}%`,
        `"${bet.outcome}"`,
        bet.pnl,
        bet.cumulativePnL
      ]
    })

    // Montar string CSV com codificação UTF-8 e BOM para o Excel ler acentuação corretamente
    const csvContent = "\uFEFF" + [headers.join(';'), ...rows.map((row: any) => row.join(';'))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    // Obter data formatada para o nome do arquivo
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    
    link.href = url
    link.setAttribute('download', `backtest_detalhes_${dateStr}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: 'Exportação Concluída!',
      description: `Arquivo CSV gerado com ${results.bets.length} registros e dados de calibração.`,
    })
  }

  // Salvar a Estratégia de Backtest Atual
  const handleSaveStrategy = async () => {
    if (!saveName.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, digite um nome para identificar esta estratégia.',
        variant: 'destructive',
      })
      return
    }

    if (!results) {
      toast({
        title: 'Simule antes de salvar',
        description: 'Você precisa rodar a simulação para salvar o perfil com seus resultados.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const filters = {
        leagueSelectionType,
        seasonType,
        selectedContinents,
        selectedCountries,
        selectedLeagues,
        selectedSeasonYears,
        competitionId,
        selectedSeasonIds,
        startDate,
        endDate,
        model,
        lambdaMethod,
        windowSize,
        market,
        betSide,
        line,
        criterion,
        minProbability,
        maxProbability,
        minEv,
        maxEv,
        minOdd,
        maxOdd,
        stake,
        stakeType,
        oddsType,
        filterOddsType,
        matchOddsHomeRanges,
        matchOddsDrawRanges,
        matchOddsAwayRanges,
        matchOddsOver25Ranges,
        matchOddsUnder25Ranges,
      }

      const res = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveName,
          filters,
          resultMeta: results.summary,
        }),
      })

      const body = await res.json()
      if (!res.ok) {
        throw new Error(body.error || 'Erro ao salvar perfil.')
      }

      setSavedProfiles([body.data, ...savedProfiles])
      setSaveName('')
      toast({
        title: 'Estratégia Salva!',
        description: `O perfil "${body.data.name}" foi salvo com sucesso.`,
      })
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Erro ao Salvar',
        description: err.message || 'Falha ao salvar a estratégia.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Carregar filtros de uma estratégia salva
  const handleLoadStrategy = (profile: SavedBacktest) => {
    const f = profile.filters
    if (!f) return

    if (f.leagueSelectionType) {
      setLeagueSelectionType(f.leagueSelectionType)
      setSeasonType(f.seasonType || 'INICIO_ANO')
      setSelectedContinents(f.selectedContinents || [])
      setSelectedCountries(f.selectedCountries || [])
      setSelectedLeagues(f.selectedLeagues || [])
      setSelectedSeasonYears(f.selectedSeasonYears || (f.seasonYear && f.seasonYear !== 'ALL_SEASONS' ? [f.seasonYear] : []))
    } else {
      // Formato legado com apenas competitionId
      setLeagueSelectionType('LEAGUE_BY_LEAGUE')
      setSelectedLeagues(f.competitionId ? [f.competitionId] : [])
      setSelectedSeasonYears([])
    }

    setCompetitionId(f.competitionId || '')
    setSelectedSeasonIds(f.selectedSeasonIds || (f.seasonId && f.seasonId !== 'ALL_SEASONS' ? [f.seasonId] : []))
    setStartDate(f.startDate || '')
    setEndDate(f.endDate || '')
    setModel(f.model || 'POISSON')
    setLambdaMethod(f.lambdaMethod || 'MEDIA_SIMPLES')
    setWindowSize(f.windowSize != null ? f.windowSize.toString() : 'null')
    setMarket(f.market || '1X2')
    setBetSide(f.betSide || 'HOME')
    setLine(f.line != null ? f.line.toString() : '')
    setCriterion(f.criterion || 'PROBABILITY_ONLY')
    setMinProbability(f.minProbability ?? 55)
    setMaxProbability(f.maxProbability ?? 100)
    setMinEv(f.minEv ?? 5)
    setMaxEv(f.maxEv ?? 100)
    setMinOdd(f.minOdd || '1.50')
    setMaxOdd(f.maxOdd || '5.00')
    setStake(f.stake ?? 100)
    setStakeType(f.stakeType || 'VALOR')
    setOddsType(f.oddsType || 'PREMATCH_CLOSING')
    setFilterOddsType(f.filterOddsType || 'PREMATCH_CLOSING')
    setMatchOddsHomeRanges(f.matchOddsHomeRanges || [])
    setMatchOddsDrawRanges(f.matchOddsDrawRanges || [])
    setMatchOddsAwayRanges(f.matchOddsAwayRanges || [])
    setMatchOddsOver25Ranges(f.matchOddsOver25Ranges || [])
    setMatchOddsUnder25Ranges(f.matchOddsUnder25Ranges || [])

    toast({
      title: 'Configuração Carregada',
      description: `Parâmetros da estratégia "${profile.name}" aplicados no painel.`,
    })
  }

  // Deletar um perfil salvo
  const handleDeleteStrategy = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Deseja excluir permanentemente este perfil de backtest?')) return

    try {
      const res = await fetch(`/api/backtest/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Falha ao excluir perfil.')
      }

      setSavedProfiles(savedProfiles.filter((p) => p.id !== id))
      toast({
        title: 'Perfil Excluído',
        description: 'A estratégia foi removida com sucesso.',
      })
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Falha ao excluir',
        description: err.message || 'Erro ao processar requisição.',
        variant: 'destructive',
      })
    }
  }

  // Função auxiliar para renderizar o seletor de faixa de odds com popover multi-seleção
  const renderRangeSelector = (
    label: string,
    selectedRanges: string[],
    setSelectedRanges: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const handleToggle = (id: string) => {
      if (selectedRanges.includes(id)) {
        setSelectedRanges(selectedRanges.filter((r) => r !== id))
      } else {
        setSelectedRanges([...selectedRanges, id])
      }
    }

    const selectAll = () => setSelectedRanges(ODD_RANGES.map((r) => r.id))
    const clearAll = () => setSelectedRanges([])

    const buttonLabel = selectedRanges.length === 0
      ? 'Qualquer odd'
      : selectedRanges.length === ODD_RANGES.length
      ? 'Todas as faixas'
      : selectedRanges.map(id => ODD_RANGES.find(r => r.id === id)?.label || id).join(', ')

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full bg-zinc-900 border-zinc-800 text-zinc-100 text-xs h-8 px-2 justify-between font-normal hover:bg-zinc-800 hover:text-zinc-50"
          >
            <span className="truncate max-w-[90%]">{buttonLabel}</span>
            <span className="text-[10px] text-zinc-500">▼</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3 bg-zinc-950 border border-zinc-850 text-zinc-100 shadow-xl" align="start">
          <div className="flex justify-between items-center pb-2 mb-2 border-b border-zinc-850">
            <span className="text-xs font-semibold text-zinc-300">{label}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-[10px] text-primary hover:underline"
              >
                Todos
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="text-[10px] text-zinc-500 hover:underline"
              >
                Limpar
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
            {ODD_RANGES.map((range) => {
              const active = selectedRanges.includes(range.id)
              return (
                <button
                  key={range.id}
                  type="button"
                  onClick={() => handleToggle(range.id)}
                  className={`text-[11px] py-1 px-2 rounded border text-center font-medium transition-all ${
                    active
                      ? 'bg-primary border-primary text-primary-foreground font-semibold shadow-md shadow-primary/10'
                      : 'bg-zinc-900/60 border-zinc-850 text-zinc-300 hover:bg-zinc-850 hover:text-zinc-100'
                  }`}
                >
                  {range.label}
                </button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  // Função auxiliar para obter a legenda do mercado e seleção ativos
  const getDynamicMarketLabel = () => {
    let marketLabel = ''
    let selectionLabel = ''

    if (market === '1X2') {
      marketLabel = '1X2'
      if (betSide === 'HOME') selectionLabel = 'Mandante'
      else if (betSide === 'DRAW') selectionLabel = 'Empate'
      else if (betSide === 'AWAY') selectionLabel = 'Visitante'
    } else if (market === 'BTTS') {
      marketLabel = 'Ambos Marcam'
      if (betSide === 'YES') selectionLabel = 'Sim'
      else if (betSide === 'NO') selectionLabel = 'Não'
    } else if (market === 'OVER_UNDER') {
      marketLabel = 'O/U Gols'
      if (betSide === 'OVER') selectionLabel = `Over ${line || '2.5'}`
      else if (betSide === 'UNDER') selectionLabel = `Under ${line || '2.5'}`
    } else if (market === 'ASIAN_HANDICAP') {
      marketLabel = 'H. Asiático'
      const lineStr = line ? (parseFloat(line) >= 0 ? `+${line}` : line) : '0.0'
      if (betSide === 'HOME') selectionLabel = `Mandante ${lineStr}`
      else if (betSide === 'AWAY') selectionLabel = `Visitante ${lineStr}`
    }

    return `${marketLabel} - ${selectionLabel}`
  }

  // Função auxiliar para exibir a data formatada
  const formatDateString = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('pt-BR')
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-primary" />
            Backtests Interativos
          </h1>
          <p className="text-muted-foreground">
            Desenvolva, valide e otimize estratégias de valor esperado com simulações estatísticas rápidas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Painel Esquerdo — Configurações da Estratégia */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border border-zinc-800 bg-zinc-950/70 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-display font-bold flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Configurar Simulação
              </CardTitle>
              <CardDescription>
                Defina as regras e modelos matemáticos para a validação.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Seleção de Ligas Segmentada */}
              <div className="space-y-3">
                <Label className="text-zinc-300 font-medium flex items-center justify-between">
                  <span>Seleção de Ligas</span>
                  <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 text-[10px]">
                    {selectedComps.length} {selectedComps.length === 1 ? 'liga' : 'ligas'}
                  </Badge>
                </Label>
                <Select value={leagueSelectionType} onValueChange={setLeagueSelectionType}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                    <SelectItem value="ALL_LEAGUES">Todas as Ligas</SelectItem>
                    <SelectItem value="SEASON_TYPE">Por Calendário (Início/Meio do Ano)</SelectItem>
                    <SelectItem value="CONTINENT">Por Continente</SelectItem>
                    <SelectItem value="COUNTRY">Por País</SelectItem>
                    <SelectItem value="LEAGUE_BY_LEAGUE">Liga a Liga</SelectItem>
                  </SelectContent>
                </Select>

                {/* Filtro secundário conforme o tipo de seleção */}
                {leagueSelectionType === 'SEASON_TYPE' && (
                  <div className="space-y-2 bg-zinc-900/40 border border-zinc-850 p-3 rounded-lg animate-in fade-in duration-200">
                    <Label className="text-xs text-zinc-400">Tipo de Calendário</Label>
                    <Select value={seasonType} onValueChange={setSeasonType}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100 text-xs h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                        <SelectItem value="INICIO_ANO">Início do Ano (Calendário Civil - Ex: Brasil, EUA, Japão)</SelectItem>
                        <SelectItem value="MEIO_ANO">Meio do Ano (Calendário Europeu - Ex: Inglaterra, Itália, Espanha)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {leagueSelectionType === 'CONTINENT' && (
                  <div className="space-y-2 bg-zinc-900/40 border border-zinc-850 p-3 rounded-lg animate-in fade-in duration-200">
                    <Label className="text-xs text-zinc-400">Selecione os Continentes</Label>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {availableContinents.map((continent) => {
                        const isChecked = selectedContinents.includes(continent)
                        return (
                          <label key={continent} className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 hover:text-zinc-100">
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedContinents([...selectedContinents, continent])
                                } else {
                                  setSelectedContinents(selectedContinents.filter((c) => c !== continent))
                                }
                              }}
                            />
                            {continent}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

                {leagueSelectionType === 'COUNTRY' && (
                  <div className="space-y-2 bg-zinc-900/40 border border-zinc-850 p-3 rounded-lg animate-in fade-in duration-200">
                    <div className="flex justify-between items-center gap-2">
                      <Label className="text-xs text-zinc-400">Selecione os Países</Label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedCountries([...availableCountries])}
                          className="text-[10px] text-primary hover:underline"
                        >
                          Todos
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedCountries([])}
                          className="text-[10px] text-zinc-500 hover:underline"
                        >
                          Limpar
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                      <Input
                        type="text"
                        placeholder="Buscar país..."
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        className="bg-zinc-900 border-zinc-800 text-zinc-100 text-xs h-8 pl-8"
                      />
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-2 pr-1 pt-1 scrollbar-thin">
                      {filteredCountries.map((country) => {
                        const isChecked = selectedCountries.includes(country)
                        return (
                          <label key={country} className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 hover:text-zinc-100">
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedCountries([...selectedCountries, country])
                                } else {
                                  setSelectedCountries(selectedCountries.filter((c) => c !== country))
                                }
                              }}
                            />
                            {country}
                          </label>
                        )
                      })}
                      {filteredCountries.length === 0 && (
                        <p className="text-[10px] text-zinc-500 text-center py-2">Nenhum país encontrado.</p>
                      )}
                    </div>
                  </div>
                )}

                {leagueSelectionType === 'LEAGUE_BY_LEAGUE' && (
                  <div className="space-y-2 bg-zinc-900/40 border border-zinc-850 p-3 rounded-lg animate-in fade-in duration-200">
                    <div className="flex justify-between items-center gap-2">
                      <Label className="text-xs text-zinc-400">Selecione as Ligas</Label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedLeagues(competitions.map((c) => c.id))}
                          className="text-[10px] text-primary hover:underline"
                        >
                          Todas
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedLeagues([])}
                          className="text-[10px] text-zinc-500 hover:underline"
                        >
                          Limpar
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                      <Input
                        type="text"
                        placeholder="Buscar liga ou país..."
                        value={leagueSearch}
                        onChange={(e) => setLeagueSearch(e.target.value)}
                        className="bg-zinc-900 border-zinc-800 text-zinc-100 text-xs h-8 pl-8"
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-1 pt-1 scrollbar-thin">
                      {filteredLeagues.map((comp) => {
                        const isChecked = selectedLeagues.includes(comp.id)
                        return (
                          <label key={comp.id} className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 hover:text-zinc-100">
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedLeagues([...selectedLeagues, comp.id])
                                } else {
                                  setSelectedLeagues(selectedLeagues.filter((id) => id !== comp.id))
                                }
                              }}
                            />
                            <span className="truncate flex-1">
                              {comp.country ? `[${comp.country.toUpperCase()}] ` : ''}{comp.name}
                            </span>
                          </label>
                        )
                      })}
                      {filteredLeagues.length === 0 && (
                        <p className="text-[10px] text-zinc-500 text-center py-2">Nenhuma liga encontrada.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Temporada e Média Móvel */}
              {selectedComps.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Temporada */}
                  <div className="space-y-2">
                    <Label className="text-zinc-300 font-medium">Temporada</Label>
                    {selectedComps.length === 1 ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full bg-zinc-900 border-zinc-800 text-zinc-100 text-xs h-10 px-3 justify-between font-normal hover:bg-zinc-800 hover:text-zinc-50"
                          >
                            <span className="truncate">
                              {selectedSeasonIds.length === 0
                                ? 'Todas as Temporadas'
                                : selectedSeasonIds.length === selectedComps[0].seasons.length
                                ? 'Todas as Temporadas'
                                : selectedComps[0].seasons
                                    .filter((s) => selectedSeasonIds.includes(s.id))
                                    .map((s) => s.year)
                                    .join(', ')}
                            </span>
                            <span className="text-[10px] text-zinc-500">▼</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-3 bg-zinc-950 border border-zinc-850 text-zinc-100 shadow-xl" align="start">
                          <div className="flex justify-between items-center pb-2 mb-2 border-b border-zinc-850">
                            <span className="text-xs font-semibold text-zinc-300">Temporadas</span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedSeasonIds(selectedComps[0].seasons.map((s) => s.id))}
                                className="text-[10px] text-primary hover:underline"
                              >
                                Todas
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedSeasonIds([])}
                                className="text-[10px] text-zinc-500 hover:underline"
                              >
                                Limpar
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                            {selectedComps[0].seasons.map((se) => {
                              const active = selectedSeasonIds.includes(se.id)
                              return (
                                <label
                                  key={se.id}
                                  className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 hover:text-zinc-100 py-0.5"
                                >
                                  <Checkbox
                                    checked={active}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedSeasonIds([...selectedSeasonIds, se.id])
                                      } else {
                                        setSelectedSeasonIds(selectedSeasonIds.filter((id) => id !== se.id))
                                      }
                                    }}
                                  />
                                  {se.year} {se.isCurrent ? '(Atual)' : ''}
                                </label>
                              )
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full bg-zinc-900 border-zinc-800 text-zinc-100 text-xs h-10 px-3 justify-between font-normal hover:bg-zinc-800 hover:text-zinc-50"
                          >
                            <span className="truncate">
                              {selectedSeasonYears.length === 0
                                ? 'Todas as Temporadas'
                                : selectedSeasonYears.length === availableYears.length
                                ? 'Todas as Temporadas'
                                : selectedSeasonYears.join(', ')}
                            </span>
                            <span className="text-[10px] text-zinc-500">▼</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-3 bg-zinc-950 border border-zinc-850 text-zinc-100 shadow-xl" align="start">
                          <div className="flex justify-between items-center pb-2 mb-2 border-b border-zinc-850">
                            <span className="text-xs font-semibold text-zinc-300">Anos</span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedSeasonYears([...availableYears])}
                                className="text-[10px] text-primary hover:underline"
                              >
                                Todos
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedSeasonYears([])}
                                className="text-[10px] text-zinc-500 hover:underline"
                              >
                                Limpar
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                            {availableYears.map((year) => {
                              const active = selectedSeasonYears.includes(year)
                              return (
                                <label
                                  key={year}
                                  className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 hover:text-zinc-100 py-0.5"
                                >
                                  <Checkbox
                                    checked={active}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedSeasonYears([...selectedSeasonYears, year])
                                      } else {
                                        setSelectedSeasonYears(selectedSeasonYears.filter((y) => y !== year))
                                      }
                                    }}
                                  />
                                  {year}
                                </label>
                              )
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>

                  {/* Média Móvel (Time) */}
                  <div className="space-y-2">
                    <Label htmlFor="windowSize" className="text-zinc-300 font-medium">Média Móvel (Time)</Label>
                    <Select value={windowSize} onValueChange={setWindowSize}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                        <SelectItem value="5">Últimos 5 jogos</SelectItem>
                        <SelectItem value="10">Últimos 10 jogos</SelectItem>
                        <SelectItem value="20">Últimos 20 jogos</SelectItem>
                        <SelectItem value="40">Últimos 40 jogos</SelectItem>
                        <SelectItem value="null">Total da Temporada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Datas limites */}
              {selectedComps.length > 0 && (
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-zinc-300 font-medium flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      De (Data)
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={dateLimits.minDate || undefined}
                      max={dateLimits.maxDate || undefined}
                      className="bg-zinc-900 border-zinc-800 text-zinc-100 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-zinc-300 font-medium flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      Até (Data)
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={dateLimits.minDate || undefined}
                      max={dateLimits.maxDate || undefined}
                      className="bg-zinc-900 border-zinc-800 text-zinc-100 focus-visible:ring-primary"
                    />
                  </div>
                </div>
              )}

              {/* Modelos Matemáticos */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model" className="text-zinc-300 font-medium">Modelo de Projeção</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                      <SelectItem value="POISSON">Poisson</SelectItem>
                      <SelectItem value="ZIP">ZIP (Zero-Inflated)</SelectItem>
                      <SelectItem value="NB">Binomial Negativa</SelectItem>
                      <SelectItem value="DIXON_COLES">Dixon-Coles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lambdaMethod" className="text-zinc-300 font-medium">Método λ (Gols)</Label>
                  <Select value={lambdaMethod} onValueChange={setLambdaMethod}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                      <SelectItem value="MEDIA_SIMPLES">Média Simples</SelectItem>
                      <SelectItem value="FORCAS_RELATIVAS">Forças Relativas</SelectItem>
                      <SelectItem value="XG">Esperado (xG)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <hr className="border-zinc-850 my-2" />

              {/* Configs de Mercado */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="market" className="text-zinc-300 font-medium font-semibold">Mercado</Label>
                  <Select value={market} onValueChange={setMarket}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                      <SelectItem value="1X2">1X2 (Match Winner)</SelectItem>
                      <SelectItem value="OVER_UNDER">Over/Under Gols</SelectItem>
                      <SelectItem value="BTTS">BTTS (Ambos Marcam)</SelectItem>
                      <SelectItem value="ASIAN_HANDICAP">Handicap Asiático</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="betSide" className="text-zinc-300 font-medium">Seleção</Label>
                  <Select value={betSide} onValueChange={setBetSide}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                      {market === '1X2' && (
                        <>
                          <SelectItem value="HOME">Mandante (1)</SelectItem>
                          <SelectItem value="DRAW">Empate (X)</SelectItem>
                          <SelectItem value="AWAY">Visitante (2)</SelectItem>
                        </>
                      )}
                      {market === 'OVER_UNDER' && (
                        <>
                          <SelectItem value="OVER">Mais de (Over)</SelectItem>
                          <SelectItem value="UNDER">Menos de (Under)</SelectItem>
                        </>
                      )}
                      {market === 'BTTS' && (
                        <>
                          <SelectItem value="YES">Sim (BTTS)</SelectItem>
                          <SelectItem value="NO">Não (No BTTS)</SelectItem>
                        </>
                      )}
                      {market === 'ASIAN_HANDICAP' && (
                        <>
                          <SelectItem value="HOME">Mandante (Home)</SelectItem>
                          <SelectItem value="AWAY">Visitante (Away)</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Linha (exclusivo para Over/Under e AH) */}
              {(market === 'OVER_UNDER' || market === 'ASIAN_HANDICAP') && (
                <div className="space-y-2">
                  <Label htmlFor="line" className="text-zinc-300 font-medium flex items-center justify-between">
                    <span>Linha do Mercado</span>
                    <span className="text-xs text-zinc-500">Múltiplos de 0.25</span>
                  </Label>
                  <Input
                    id="line"
                    type="number"
                    step="0.25"
                    value={line}
                    onChange={(e) => setLine(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-zinc-100 focus-visible:ring-primary"
                    placeholder="Ex: 2.25, -0.75, 0.0"
                  />
                </div>
              )}

              <hr className="border-zinc-850 my-2" />

              {/* Critério de entrada */}
              <div className="space-y-2">
                <Label htmlFor="criterion" className="text-zinc-300 font-medium">Critério de Aposta</Label>
                <Select value={criterion} onValueChange={setCriterion}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                    <SelectItem value="PROBABILITY_ONLY">Apenas Probabilidade Mínima</SelectItem>
                    <SelectItem value="VALUE_ONLY">Apenas Valor Esperado (+EV)</SelectItem>
                    <SelectItem value="VALUE_AND_PROBABILITY">Probabilidade + Valor Esperado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Parâmetros do critério */}
              {(criterion === 'PROBABILITY_ONLY' || criterion === 'VALUE_AND_PROBABILITY') && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-zinc-300 font-medium text-xs flex justify-between">
                      <span>Prob. Mínima</span>
                      <span className="text-primary font-semibold">{minProbability}%</span>
                    </Label>
                    <Input
                      type="range"
                      min="1"
                      max="100"
                      value={minProbability}
                      onChange={(e) => setMinProbability(parseInt(e.target.value))}
                      className="accent-primary cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-zinc-300 font-medium text-xs flex justify-between">
                      <span>Prob. Máxima</span>
                      <span className="text-primary font-semibold">{maxProbability}%</span>
                    </Label>
                    <Input
                      type="range"
                      min="1"
                      max="100"
                      value={maxProbability}
                      onChange={(e) => setMaxProbability(parseInt(e.target.value))}
                      className="accent-primary cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {(criterion === 'VALUE_ONLY' || criterion === 'VALUE_AND_PROBABILITY') && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-zinc-300 font-medium text-xs flex justify-between">
                      <span>EV Mínimo</span>
                      <span className="text-primary font-semibold">{minEv >= 0 ? '+' : ''}{minEv}%</span>
                    </Label>
                    <Input
                      type="range"
                      min="-100"
                      max="100"
                      value={minEv}
                      onChange={(e) => setMinEv(parseInt(e.target.value))}
                      className="accent-primary cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-zinc-300 font-medium text-xs flex justify-between">
                      <span>EV Máximo</span>
                      <span className="text-primary font-semibold">{maxEv >= 0 ? '+' : ''}{maxEv}%</span>
                    </Label>
                    <Input
                      type="range"
                      min="-100"
                      max="100"
                      value={maxEv}
                      onChange={(e) => setMaxEv(parseInt(e.target.value))}
                      className="accent-primary cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Limites de Odds do Mercado Escolhido */}
              <div className="space-y-2 bg-zinc-900/30 border border-zinc-850 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <Label className="text-zinc-300 text-xs font-semibold">Momento das Odds</Label>
                  <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setOddsType('PREMATCH_OPENING')}
                      className={`text-[10px] font-semibold py-1 px-3.5 rounded-md transition-all ${oddsType === 'PREMATCH_OPENING' ? 'bg-primary text-zinc-950 shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                      Abertura
                    </button>
                    <button
                      type="button"
                      onClick={() => setOddsType('PREMATCH_CLOSING')}
                      className={`text-[10px] font-semibold py-1 px-3.5 rounded-md transition-all ${oddsType === 'PREMATCH_CLOSING' ? 'bg-primary text-zinc-950 shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                      Fechamento
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="space-y-1">
                    <Label htmlFor="minOdd" className="text-zinc-300 text-[10px] font-semibold uppercase tracking-wider">Odd Mín. ({getDynamicMarketLabel()})</Label>
                    <Input
                      id="minOdd"
                      type="text"
                      value={minOdd}
                      onChange={(e) => setMinOdd(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 text-zinc-100 text-xs px-2 py-1.5 text-center"
                      placeholder="1.00"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="maxOdd" className="text-zinc-300 text-[10px] font-semibold uppercase tracking-wider">Odd Máx. ({getDynamicMarketLabel()})</Label>
                    <Input
                      id="maxOdd"
                      type="text"
                      value={maxOdd}
                      onChange={(e) => setMaxOdd(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 text-zinc-100 text-xs px-2 py-1.5 text-center"
                      placeholder="10.00"
                    />
                  </div>
                </div>
              </div>

              {/* Faixa de Odds do Confronto */}
              <div className="space-y-3 bg-zinc-900/30 border border-zinc-850 p-3 rounded-lg">
                <div className="flex justify-between items-center pb-1 border-b border-zinc-850">
                  <span className="text-xs font-semibold text-zinc-300">Filtro de Odds do Confronto</span>
                  <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setFilterOddsType('PREMATCH_OPENING')}
                      className={`text-[10px] font-semibold py-1 px-3.5 rounded-md transition-all ${filterOddsType === 'PREMATCH_OPENING' ? 'bg-primary text-zinc-950 shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                      Abertura
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterOddsType('PREMATCH_CLOSING')}
                      className={`text-[10px] font-semibold py-1 px-3.5 rounded-md transition-all ${filterOddsType === 'PREMATCH_CLOSING' ? 'bg-primary text-zinc-950 shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                      Fechamento
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 1X2 Odds */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Mercado 1X2</span>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-zinc-400">Mandante (1)</Label>
                        {renderRangeSelector("Odds Mandante (1)", matchOddsHomeRanges, setMatchOddsHomeRanges)}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-zinc-400">Empate (X)</Label>
                        {renderRangeSelector("Odds Empate (X)", matchOddsDrawRanges, setMatchOddsDrawRanges)}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-zinc-400">Visitante (2)</Label>
                        {renderRangeSelector("Odds Visitante (2)", matchOddsAwayRanges, setMatchOddsAwayRanges)}
                      </div>
                    </div>
                  </div>

                  {/* Over/Under 2.5 Odds */}
                  <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-zinc-850 pt-3 sm:pt-0 sm:pl-4">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Mercado Gols (Over/Under 2.5)</span>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-zinc-400">Over 2.5 Gols</Label>
                        {renderRangeSelector("Odds Over 2.5", matchOddsOver25Ranges, setMatchOddsOver25Ranges)}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-zinc-400">Under 2.5 Gols</Label>
                        {renderRangeSelector("Odds Under 2.5", matchOddsUnder25Ranges, setMatchOddsUnder25Ranges)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Valor da Aposta (Stake) */}
              <div className="space-y-2 bg-zinc-900/30 border border-zinc-850 p-3 rounded-lg">
                <Label className="text-zinc-300 text-xs font-semibold">Valor da Aposta</Label>
                <div className="flex gap-2">
                  <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 w-1/2">
                    <button
                      type="button"
                      onClick={() => {
                        setStakeType('VALOR')
                        if (stake <= 10) setStake(100)
                      }}
                      className={`flex-1 text-[10px] font-semibold py-1 rounded-md transition-all ${stakeType === 'VALOR' ? 'bg-primary text-zinc-950 shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                      Moeda (R$)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStakeType('UNIDADES')
                        if (stake >= 50) setStake(1)
                      }}
                      className={`flex-1 text-[10px] font-semibold py-1 rounded-md transition-all ${stakeType === 'UNIDADES' ? 'bg-primary text-zinc-950 shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                      Unidades
                    </button>
                  </div>
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-500">
                      {stakeType === 'VALOR' ? 'R$' : 'u'}
                    </span>
                    <Input
                      id="stake"
                      type="number"
                      value={stake}
                      onChange={(e) => setStake(parseFloat(e.target.value) || 0)}
                      className="bg-zinc-900 border-zinc-800 text-zinc-100 text-xs pl-8 pr-2 py-1 text-center w-full"
                      placeholder={stakeType === 'VALOR' ? '100' : '1'}
                      min={0.01}
                      step={stakeType === 'VALOR' ? 10 : 0.1}
                    />
                  </div>
                </div>
              </div>

              {/* Executar */}
              <Button
                onClick={handleRunBacktest}
                disabled={running}
                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold py-6 mt-4 flex items-center justify-center gap-2 group transition-all"
              >
                {running ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Simulando...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 text-primary-foreground group-hover:scale-110 transition-transform" />
                    <span>Executar Backtest</span>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Seção de Salvar Perfil */}
          {results && (
            <Card className="border border-zinc-800 bg-zinc-950/70 p-4 space-y-4">
              <Label htmlFor="saveName" className="text-sm font-semibold text-zinc-200">Salvar Estratégia</Label>
              <div className="flex gap-2">
                <Input
                  id="saveName"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Nome do Filtro (Ex: Poisson Under 2.5 Serie A)"
                  className="bg-zinc-900 border-zinc-800 text-zinc-100 flex-1"
                />
                <Button
                  onClick={handleSaveStrategy}
                  disabled={saving}
                  size="icon"
                  className="bg-primary text-primary-foreground"
                >
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          )}

          {/* Histórico / Perfis Salvos */}
          <Card className="border border-zinc-800 bg-zinc-950/70 shadow-lg">
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                <History className="w-4 h-4 text-zinc-400" />
                Minhas Estratégias Salvas
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4 pt-0">
              {savedProfiles.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4">Você ainda não salvou estratégias.</p>
              ) : (
                <div className="max-h-[220px] overflow-y-auto space-y-1 px-2">
                  {savedProfiles.map((profile) => (
                    <div
                      key={profile.id}
                      onClick={() => handleLoadStrategy(profile)}
                      className="flex items-center justify-between p-2 rounded bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 cursor-pointer transition-colors text-left"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-zinc-300 truncate max-w-[180px]">{profile.name}</div>
                        <div className="text-[10px] text-zinc-500 flex gap-2">
                          <span>ROI: <span className={profile.resultMeta?.totalPnL >= 0 ? "text-green-500" : "text-destructive"}>{(profile.resultMeta?.roi * 100).toFixed(1)}%</span></span>
                          <span>Apostas: {profile.resultMeta?.totalBets}</span>
                        </div>
                      </div>
                      <Button
                        onClick={(e) => handleDeleteStrategy(profile.id, e)}
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-zinc-500 hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Painel Direito — Curvas de Rendimento e Resultados */}
        <div className="lg:col-span-8 space-y-6">
          {/* Resultados ainda não processados */}
          {!results && !running && (
            <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-zinc-800 rounded-lg bg-zinc-950/40 min-h-[450px]">
              <div className="bg-zinc-900/80 p-4 rounded-full mb-6 border border-zinc-850">
                <BarChart3 className="h-10 w-10 text-zinc-500" />
              </div>
              <h3 className="font-display text-lg font-semibold text-zinc-200">Pronto para simular</h3>
              <p className="text-muted-foreground text-sm max-w-sm mt-2 leading-relaxed">
                Configure os filtros matemáticos do painel esquerdo e execute a simulação histórica para obter KPIs e visualizar as projeções de rendimento.
              </p>
            </div>
          )}

          {/* Skeletons de Loading */}
          {running && (
            <div className="space-y-6 min-h-[450px]">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-zinc-900/50 border border-zinc-850 h-24 rounded-lg p-4 flex flex-col justify-between animate-pulse">
                    <div className="h-3 w-16 bg-zinc-800 rounded"></div>
                    <div className="h-6 w-20 bg-zinc-800 rounded"></div>
                  </div>
                ))}
              </div>

              <Card className="border border-zinc-800 bg-zinc-950/50 p-6 flex flex-col justify-between h-[300px] animate-pulse">
                <div className="h-4 w-40 bg-zinc-800 rounded"></div>
                <div className="w-full h-48 bg-zinc-900/70 rounded-md"></div>
              </Card>
            </div>
          )}

          {results && !running && (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* KPIs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 shadow-md flex flex-col justify-between relative overflow-hidden">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total de Apostas</div>
                  <div className="mt-3">
                    <div className="text-2xl font-bold text-zinc-100">{results.summary.totalBets}</div>
                    <div className="text-[10px] text-zinc-500 mt-1">Jogos elegíveis filtrados</div>
                  </div>
                </div>

                <div className="bg-zinc-950 border border-zinc-850 rounded-lg p-4 shadow-md flex flex-col justify-between">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Retorno (P&L)</div>
                  <div className="mt-3">
                    <div className={`text-2xl font-bold ${results.summary.totalPnL >= 0 ? "text-green-500" : "text-destructive"}`}>
                      {results.summary.totalPnL >= 0 ? '+' : ''}
                      {stakeType === 'VALOR' ? `R$ ${results.summary.totalPnL.toFixed(2)}` : `${results.summary.totalPnL.toFixed(2)} u`}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-1">Líquido (P&L Final)</div>
                  </div>
                </div>

                <div className={`border rounded-lg p-4 shadow-md flex flex-col justify-between relative overflow-hidden bg-gradient-to-br ${results.summary.roi >= 0 ? "from-green-500/5 to-emerald-500/10 border-green-500/30" : "from-destructive/5 to-red-500/10 border-destructive/30"}`}>
                  <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Retorno s/ Investimento (ROI)</div>
                  <div className="mt-3">
                    <div className={`text-2xl font-bold ${results.summary.roi >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {results.summary.roi >= 0 ? '+' : ''}{(results.summary.roi * 100).toFixed(2)}%
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-1">Baseado no stake investido</div>
                  </div>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 shadow-md flex flex-col justify-between">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Hit Rate (Acerto)</div>
                  <div className="mt-3">
                    <div className="text-2xl font-bold text-zinc-100">{(results.summary.hitRate * 100).toFixed(1)}%</div>
                    <div className="text-[10px] text-zinc-500 mt-1">Excluindo reembolsos</div>
                  </div>
                </div>
              </div>

              {/* Detalhes de Desempenho */}
              <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg flex flex-wrap gap-x-6 gap-y-2 justify-center text-xs text-zinc-400">
                <div>Greens (Win): <span className="text-green-500 font-semibold">{results.summary.winCount}</span></div>
                <div>Metades Ganhas: <span className="text-emerald-500 font-semibold">{results.summary.halfWinCount}</span></div>
                <div>Anuladas (Refund): <span className="text-zinc-300 font-semibold">{results.summary.refundCount}</span></div>
                <div>Metades Perdidas: <span className="text-orange-500 font-semibold">{results.summary.halfLossCount}</span></div>
                <div>Reds (Loss): <span className="text-destructive font-semibold">{results.summary.lossCount}</span></div>
              </div>

              {/* Gráfico da Curva de Saldo */}
              <Card className="border border-zinc-850 bg-zinc-950/70 p-4 shadow-xl">
                <CardHeader className="px-2 pb-4 pt-0">
                  <CardTitle className="text-base font-display font-semibold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Evolução da Banca (P&L Acumulado)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="w-full h-64 md:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ReChartsLineChart
                        data={results.curve}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="index" stroke="#71717a" fontSize={10} tickLine={false} />
                        <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                          labelFormatter={(value) => `Aposta #${value}`}
                          formatter={(value: any) => [
                            stakeType === 'VALOR' ? `R$ ${value.toFixed(2)}` : `${value.toFixed(2)} u`,
                            'P&L Acumulado'
                          ]}
                        />
                        <ReferenceLine y={0} stroke="#dc2626" strokeDasharray="3 3" />
                        <Line
                          type="monotone"
                          dataKey="cumulativePnL"
                          stroke="#22c55e"
                          strokeWidth={2.5}
                          dot={results.curve.length < 50 ? { r: 4, fill: '#22c55e', stroke: '#22c55e', strokeWidth: 0 } : false}
                          activeDot={{ r: 6 }}
                          isAnimationActive={false}
                        />
                      </ReChartsLineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Listagem de Partidas e Apostas Filtradas */}
              <Card className="border border-zinc-850 bg-zinc-950/70 shadow-xl">
                <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base font-display font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-zinc-400" />
                    Apostas Efetuadas ({results.bets.length})
                  </CardTitle>
                  {results.bets.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportCSV}
                      className="flex items-center gap-2 text-zinc-300 border-zinc-800 hover:bg-zinc-900"
                    >
                      <Download className="w-4 h-4" />
                      Exportar Cálculos (CSV)
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-0 max-h-[800px] overflow-y-auto">
                  {results.bets.length === 0 ? (
                    <p className="text-sm text-zinc-500 text-center py-8">Nenhum confronto atendeu aos filtros configurados.</p>
                  ) : (
                    <Table>
                      <TableHeader className="bg-zinc-900 border-b border-zinc-800">
                        <TableRow>
                          <TableHead className="text-xs font-semibold text-zinc-400 text-center">Data</TableHead>
                          <TableHead className="text-xs font-semibold text-zinc-400">Confronto</TableHead>
                          <TableHead className="text-xs font-semibold text-zinc-400 text-center">Placar</TableHead>
                          <TableHead className="text-xs font-semibold text-zinc-400 text-center">Prob (Mod)</TableHead>
                          <TableHead className="text-xs font-semibold text-zinc-400 text-center">EV</TableHead>
                          <TableHead className="text-xs font-semibold text-zinc-400 text-center">Odd</TableHead>
                          <TableHead className="text-xs font-semibold text-zinc-400 text-center">Outcome</TableHead>
                          <TableHead className="text-xs font-semibold text-zinc-400 text-right">P&L</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.bets.map((bet: any, idx: number) => (
                          <TableRow key={idx} className="border-b border-zinc-850 hover:bg-zinc-900/30 text-xs">
                            <TableCell className="text-center text-zinc-500">{formatDateString(bet.utcDate)}</TableCell>
                            <TableCell className="font-medium text-zinc-300">
                              <span className="text-zinc-200">{bet.homeTeam}</span> vs <span className="text-zinc-200">{bet.awayTeam}</span>
                            </TableCell>
                            <TableCell className="text-center font-semibold text-zinc-400">{bet.fthg} - {bet.ftag}</TableCell>
                            <TableCell className="text-center text-zinc-300">{(bet.modelProb * 100).toFixed(1)}%</TableCell>
                            <TableCell className="text-center text-zinc-300 font-semibold">
                              <span className={bet.ev >= 0 ? "text-green-500" : "text-destructive"}>
                                {bet.ev >= 0 ? '+' : ''}{(bet.ev * 100).toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell className="text-center font-bold text-zinc-300">{bet.odd.toFixed(2)}</TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className={
                                  bet.outcome === "WIN" || bet.outcome === "HALF_WIN"
                                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                                    : bet.outcome === "REFUND"
                                    ? "bg-zinc-500/10 text-zinc-300 border-zinc-500/20"
                                    : "bg-red-500/10 text-red-400 border-red-500/20"
                                }
                              >
                                {bet.outcome}
                              </Badge>
                            </TableCell>
                            <TableCell className={`text-right font-bold ${bet.pnl >= 0 ? "text-green-500" : "text-destructive"}`}>
                              {bet.pnl >= 0 ? '+' : ''}
                              {stakeType === 'VALOR' ? `R$ ${bet.pnl.toFixed(2)}` : `${bet.pnl.toFixed(2)} u`}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
