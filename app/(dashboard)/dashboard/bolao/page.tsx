"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  Trophy, Lock, CheckCircle2, AlertTriangle,
  ShieldAlert, Award, Star, RefreshCw, Check,
  Calendar, ChevronLeft, ChevronRight, BookOpen, Edit3, Target, Scale, Gift
} from "lucide-react";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Team {
  id: string;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
}

interface Match {
  id: string;
  round: number | null;
  status: string;
  utcDate: string;
  fthg: number | null;
  ftag: number | null;
  homeTeam: Team;
  awayTeam: Team;
}

interface UserScore {
  pontosTotal: number;
  quantidadePalpites: number;
  acertosPlacar: number;
  acertosResultado: number;
  acertosOverUnder: number;
}

interface RankingUser {
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: string;
}

interface RankingRow {
  id: string;
  userId: string;
  pontosTotal: number;
  quantidadePalpites: number;
  acertosPlacar: number;
  acertosResultado: number;
  acertosOverUnder: number;
  user: RankingUser;
}

interface UserPalpite {
  matchId: string;
  golsMandante: number;
  golsVisitante: number;
  palpiteOverUnder: "OVER" | "UNDER";
  pontos: number;
  avaliado: boolean;
}

export default function BolaoPage() {
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // States para dados da API
  const [loading, setLoading] = useState(true);
  const [bolao, setBolao] = useState<any>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [userScore, setUserScore] = useState<UserScore | null>(null);
  const [userPalpites, setUserPalpites] = useState<Record<string, UserPalpite>>({});
  
  // States para Ranking
  const [ranking, setRanking] = useState<RankingRow[]>([]);
  const [rankingPage, setRankingPage] = useState(1);
  const [rankingTotalPages, setRankingTotalPages] = useState(1);
  const [rankingLoading, setRankingLoading] = useState(false);

  // Form inputs local state
  const [inputs, setInputs] = useState<Record<string, { golsMandante: string; golsVisitante: string; palpiteOverUnder: "OVER" | "UNDER" }>>({});
  const [savingMatches, setSavingMatches] = useState<Record<string, boolean>>({});

  // Filters
  const [activeTab, setActiveTab] = useState("matches");
  const [matchFilter, setMatchFilter] = useState<"all" | "open" | "closed" | "finished">("all");
  const [roundFilter, setRoundFilter] = useState<string>("all");

  useEffect(() => {
    setIsMounted(true);
    setCurrentTime(new Date());

    // Atualiza o relógio interno a cada minuto para o lock reativo
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Fetch inicial do bolão
  const fetchBolaoData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bolao/copa-2026");
      if (!res.ok) throw new Error("Erro ao carregar dados do bolão");
      const data = await res.json();

      setBolao(data.bolao);
      setMatches(data.matches);
      setUserScore(data.userScore || null);

      // Fetch dos palpites salvos do usuário
      const palpitesRes = await fetch("/api/bolao/copa-2026/palpites");
      if (palpitesRes.ok) {
        const palpitesData: UserPalpite[] = await palpitesRes.json();
        const mappedPalpites: Record<string, UserPalpite> = {};
        const mappedInputs: Record<string, { golsMandante: string; golsVisitante: string; palpiteOverUnder: "OVER" | "UNDER" }> = {};

        palpitesData.forEach((p) => {
          mappedPalpites[p.matchId] = p;
          mappedInputs[p.matchId] = {
            golsMandante: String(p.golsMandante),
            golsVisitante: String(p.golsVisitante),
            palpiteOverUnder: p.palpiteOverUnder,
          };
        });

        setUserPalpites(mappedPalpites);
        
        // Inicializa inputs com palpites salvos ou valores vazios para os novos
        const initialInputs = { ...mappedInputs };
        data.matches.forEach((m: Match) => {
          if (!initialInputs[m.id]) {
            initialInputs[m.id] = {
              golsMandante: "",
              golsVisitante: "",
              palpiteOverUnder: "OVER",
            };
          }
        });
        setInputs(initialInputs);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro de conexão",
        description: error.message || "Não foi possível sincronizar os dados.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch do Ranking
  const fetchRanking = useCallback(async (page: number) => {
    try {
      setRankingLoading(true);
      const res = await fetch(`/api/bolao/copa-2026/ranking?page=${page}&limit=20`);
      if (!res.ok) throw new Error("Erro ao carregar ranking");
      const data = await res.json();
      setRanking(data.ranking);
      setRankingTotalPages(data.pages);
      setRankingPage(data.page);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao obter ranking",
        description: error.message || "Tente novamente mais tarde.",
      });
    } finally {
      setRankingLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchBolaoData();
  }, [fetchBolaoData]);

  useEffect(() => {
    if (activeTab === "ranking") {
      fetchRanking(1);
    }
  }, [activeTab, fetchRanking]);

  // Salvar palpite individual
  const handleSavePalpite = async (matchId: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    const inputData = inputs[matchId];
    if (!inputData) return;

    const golsMandante = parseInt(inputData.golsMandante, 10);
    const golsVisitante = parseInt(inputData.golsVisitante, 10);

    if (isNaN(golsMandante) || isNaN(golsVisitante) || golsMandante < 0 || golsVisitante < 0) {
      toast({
        variant: "destructive",
        title: "Palpite inválido",
        description: "Os placares devem ser números inteiros maiores ou iguais a 0.",
      });
      return;
    }

    try {
      setSavingMatches((prev) => ({ ...prev, [matchId]: true }));
      const response = await fetch("/api/bolao/copa-2026/palpite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          golsMandante,
          golsVisitante,
          palpiteOverUnder: inputData.palpiteOverUnder,
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.message || "Falha ao salvar palpite.");
      }

      toast({
        title: "Palpite salvo!",
        description: "Seu palpite foi registrado com sucesso.",
      });

      // Atualiza estado local de palpites salvos
      setUserPalpites((prev) => ({
        ...prev,
        [matchId]: {
          matchId,
          golsMandante,
          golsVisitante,
          palpiteOverUnder: inputData.palpiteOverUnder,
          pontos: 0,
          avaliado: false,
        },
      }));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message,
      });
    } finally {
      setSavingMatches((prev) => ({ ...prev, [matchId]: false }));
    }
  };

  // Helpers de cálculo de lock
  const getMatchLockTime = (utcDateStr: string) => {
    const matchDate = new Date(utcDateStr);
    return new Date(matchDate.getTime() - 60 * 60 * 1000); // 1h antes
  };

  const isMatchLocked = (match: Match) => {
    if (match.status !== "SCHEDULED") return true;
    const lockTime = getMatchLockTime(match.utcDate);
    return currentTime >= lockTime;
  };

  // Formatação de data em BRT
  const formatToBRT = (utcDateStr: string) => {
    if (!isMounted) return "";
    const date = new Date(utcDateStr);
    return date.toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Formatação da data de lock em BRT
  const formatLockTimeToBRT = (utcDateStr: string) => {
    if (!isMounted) return "";
    const date = new Date(utcDateStr);
    const lockDate = new Date(date.getTime() - 60 * 60 * 1000);
    return lockDate.toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Grouping de partidas por rodada
  const uniqueRounds = Array.from(new Set(matches.map((m) => m.round))).sort((a, b) => {
    if (a === null) return 1;
    if (b === null) return -1;
    return a - b;
  });

  const filteredMatches = matches.filter((match) => {
    // Filtro por rodada
    if (roundFilter !== "all") {
      const matchRound = match.round === null ? "null" : String(match.round);
      if (matchRound !== roundFilter) return false;
    }

    // Filtro de status
    const locked = isMatchLocked(match);
    if (matchFilter === "open") return !locked;
    if (matchFilter === "closed") return locked && match.status !== "FINISHED";
    if (matchFilter === "finished") return match.status === "FINISHED";
    return true;
  });

  if (loading || !isMounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <RefreshCw className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Carregando painel do bolão...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      {/* Header e Estatísticas Rápidas do Usuário */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
            {bolao?.nome || "Bolão Copa do Mundo 2026"}
          </h1>
          <p className="text-muted-foreground">
            Palpite nos placares, crave o resultado e concorra com outros membros!
          </p>
        </div>

        {userScore && (
          <div className="flex flex-wrap items-center gap-4 bg-card border border-border/80 px-4 py-3 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 border-r border-border/60 pr-3">
              <Award className="text-amber-500 w-5 h-5" />
              <div className="text-sm">
                <span className="text-muted-foreground block text-[11px] uppercase tracking-wider font-semibold">Média de Pontos</span>
                <span className="font-bold text-lg text-amber-500">{Number(userScore.pontosTotal).toFixed(2)} pts</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div>
                <span className="font-semibold text-foreground block">{userScore.quantidadePalpites}</span> Palpites
              </div>
              <div>
                <span className="font-semibold text-foreground block">{userScore.acertosPlacar}</span> Placar Exato (4pt)
              </div>
              <div>
                <span className="font-semibold text-foreground block">{userScore.acertosResultado}</span> Resultado (2pt)
              </div>
            </div>
            {userScore.quantidadePalpites < 10 && (
              <div className="text-[10px] text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded border border-amber-400/20 max-w-xs leading-tight sm:ml-auto">
                ⚠️ Mínimo de 10 palpites avaliados para ter direito aos prêmios.
              </div>
            )}
          </div>
        )}
      </div>

      <Tabs defaultValue="matches" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/40 p-1 rounded-lg border border-border/60">
          <TabsTrigger value="matches" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Partidas
          </TabsTrigger>
          <TabsTrigger value="ranking" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" /> Ranking Geral
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Regulamento & Regras
          </TabsTrigger>
        </TabsList>

        {/* Tab de Partidas */}
        <TabsContent value="matches" className="space-y-6">
          {/* Barra de Filtros */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20 border border-border/60 p-4 rounded-lg">
            <div className="flex flex-wrap items-center gap-2">
              <Button 
                variant={matchFilter === "all" ? "default" : "outline"} 
                size="sm"
                onClick={() => setMatchFilter("all")}
              >
                Todos
              </Button>
              <Button 
                variant={matchFilter === "open" ? "default" : "outline"} 
                size="sm"
                onClick={() => setMatchFilter("open")}
              >
                Abertos
              </Button>
              <Button 
                variant={matchFilter === "closed" ? "default" : "outline"} 
                size="sm"
                onClick={() => setMatchFilter("closed")}
              >
                Fechados
              </Button>
              <Button 
                variant={matchFilter === "finished" ? "default" : "outline"} 
                size="sm"
                onClick={() => setMatchFilter("finished")}
              >
                Finalizados
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Rodada:</span>
              <select 
                value={roundFilter} 
                onChange={(e) => setRoundFilter(e.target.value)}
                className="bg-background border border-border rounded px-2.5 py-1 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">Todas as fases</option>
                {uniqueRounds.map((r) => (
                  <option key={r === null ? "null" : r} value={r === null ? "null" : String(r)}>
                    {r === null ? "Fase Final" : `Rodada ${r}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lista de Partidas */}
          {filteredMatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-xl text-center">
              <ShieldAlert className="w-12 h-12 text-muted-foreground/60 mb-3" />
              <h3 className="font-semibold text-lg">Nenhuma partida encontrada</h3>
              <p className="text-muted-foreground text-sm max-w-sm mt-1">
                Não existem partidas registradas com estes filtros neste momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredMatches.map((match) => {
                const locked = isMatchLocked(match);
                const hasPalpite = !!userPalpites[match.id];
                const palpite = userPalpites[match.id];
                const input = inputs[match.id] || { golsMandante: "", golsVisitante: "", palpiteOverUnder: "OVER" };

                return (
                  <Card key={match.id} className="relative overflow-hidden border border-border/80 bg-card hover:border-border transition-all shadow-sm">
                    {/* Badge lateral com pontuação obtida */}
                    {match.status === "FINISHED" && palpite && (
                      <div className="absolute right-0 top-0 bg-amber-500/10 border-l border-b border-amber-500/20 text-amber-500 font-bold px-3.5 py-1.5 rounded-bl-lg text-sm flex items-center gap-1 shadow-sm">
                        <Star className="w-3.5 h-3.5 fill-amber-500" /> +{palpite.pontos} pts
                      </div>
                    )}

                    <CardHeader className="pb-3 border-b border-border/40">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium flex-wrap">
                          <Badge variant="outline" className="text-[10px] py-0.5">
                            {match.round ? `Rodada ${match.round}` : "Fase Final"}
                          </Badge>
                          <span className="font-semibold text-foreground">{formatToBRT(match.utcDate)} (BRT)</span>
                          <span>{"   |   "}</span>
                          <span className="text-muted-foreground flex items-center gap-1 font-normal">
                            <Lock className="w-3 h-3 text-muted-foreground/60 shrink-0" /> Limite: {formatLockTimeToBRT(match.utcDate)} (BRT)
                          </span>
                        </div>

                        {locked ? (
                          <Badge variant="secondary" className="flex items-center gap-1 text-[10px] py-0.5">
                            <Lock className="w-3 h-3 text-muted-foreground" /> Fechado
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 text-[10px] py-0.5 animate-pulse">
                            Aberto para palpite
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="pt-5 space-y-4">
                      {/* Times e Placares */}
                      <div className="flex items-center justify-between gap-4">
                        {/* Mandante */}
                        <div className="flex-1 flex items-center justify-end gap-3 text-right">
                          <span className="font-semibold text-sm md:text-base hidden sm:inline">{match.homeTeam.name}</span>
                          <span className="font-semibold text-sm sm:hidden">{match.homeTeam.shortName || match.homeTeam.name.substring(0, 3)}</span>
                          <Avatar className="w-8 h-8 bg-muted/60 border border-border/60">
                            {match.homeTeam.logoUrl && <AvatarImage src={match.homeTeam.logoUrl} />}
                            <AvatarFallback className="text-[10px] font-bold">{match.homeTeam.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        </div>

                        {/* inputs de gols */}
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            disabled={locked}
                            placeholder="-"
                            value={input.golsMandante}
                            onChange={(e) => setInputs(prev => ({
                              ...prev,
                              [match.id]: { ...prev[match.id], golsMandante: e.target.value }
                            }))}
                            className="w-12 h-10 text-center font-bold text-lg p-0 focus-visible:ring-primary disabled:opacity-100 disabled:bg-muted/20"
                          />
                          <span className="text-muted-foreground font-bold">x</span>
                          <Input
                            type="number"
                            min="0"
                            disabled={locked}
                            placeholder="-"
                            value={input.golsVisitante}
                            onChange={(e) => setInputs(prev => ({
                              ...prev,
                              [match.id]: { ...prev[match.id], golsVisitante: e.target.value }
                            }))}
                            className="w-12 h-10 text-center font-bold text-lg p-0 focus-visible:ring-primary disabled:opacity-100 disabled:bg-muted/20"
                          />
                        </div>

                        {/* Visitante */}
                        <div className="flex-1 flex items-center gap-3">
                          <Avatar className="w-8 h-8 bg-muted/60 border border-border/60">
                            {match.awayTeam.logoUrl && <AvatarImage src={match.awayTeam.logoUrl} />}
                            <AvatarFallback className="text-[10px] font-bold">{match.awayTeam.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-sm md:text-base hidden sm:inline">{match.awayTeam.name}</span>
                          <span className="font-semibold text-sm sm:hidden">{match.awayTeam.shortName || match.awayTeam.name.substring(0, 3)}</span>
                        </div>
                      </div>

                      {/* Botão de Ação / Placar Oficial se finalizado */}
                      <div className="flex items-center justify-between gap-4 border-t border-border/40 pt-4">
                        <div>
                          {match.status === "FINISHED" && (
                            <div className="text-xs">
                              <span className="text-muted-foreground">Placar Oficial: </span>
                              <span className="font-bold text-foreground">
                                {match.fthg} x {match.ftag}
                              </span>
                            </div>
                          )}
                        </div>

                        {!locked ? (
                          <Button
                            size="sm"
                            disabled={savingMatches[match.id]}
                            onClick={() => handleSavePalpite(match.id)}
                            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold h-8 text-xs flex items-center gap-1.5"
                          >
                            {savingMatches[match.id] && <RefreshCw className="w-3 h-3 animate-spin" />}
                            {hasPalpite ? (
                              <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Atualizar Palpite</span>
                            ) : (
                              "Salvar Palpite"
                            )}
                          </Button>
                        ) : (
                          hasPalpite ? (
                            <div className="flex items-center gap-1 text-xs text-emerald-500 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Palpite Salvo
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 bg-muted/40 px-2.5 py-1 rounded-md border border-border/40">
                              <Lock className="w-3 h-3" /> Sem Palpite
                            </div>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab de Ranking Geral */}
        <TabsContent value="ranking" className="space-y-6">
          <Card className="border border-border/80 shadow-sm bg-card">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" /> Classificação
              </CardTitle>
              <CardDescription>
                Tabela de classificação ordenada pela média de pontos. Critérios de desempate: 1º Palpites Feitos, 2º Placar Exato, 3º Resultado (1x2), 4º Cadastro mais antigo. (*) Necessário mínimo de 10 palpites para elegibilidade à premiação.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rankingLoading ? (
                <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground text-sm">
                  <RefreshCw className="w-5 h-5 animate-spin" /> Carregando classificação...
                </div>
              ) : ranking.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
                  <p className="font-semibold">O ranking estará disponível após o primeiro resultado!</p>
                  <p className="text-xs mt-1">Nenhum palpite foi avaliado ainda.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border border-border/60 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow>
                          <TableHead className="w-16 text-center font-bold">Pos</TableHead>
                          <TableHead>Participante</TableHead>
                          <TableHead className="text-center font-bold text-foreground">Média de Pontos</TableHead>
                          <TableHead className="text-center font-bold text-foreground">Palpites</TableHead>
                          <TableHead className="text-center">Placares Exatos</TableHead>
                          <TableHead className="text-center">Resultados (1X2)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ranking.map((row, index) => {
                          const position = (rankingPage - 1) * 20 + index + 1;
                          const name = row.user.name || row.user.email || "Usuário";
                          return (
                            <TableRow key={row.id} className="hover:bg-muted/10 transition-colors">
                              <TableCell className="text-center font-bold text-sm">
                                {position === 1 ? (
                                  <span className="inline-flex items-center justify-center bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full w-6 h-6 text-xs">🥇</span>
                                ) : position === 2 ? (
                                  <span className="inline-flex items-center justify-center bg-slate-300/10 border border-slate-300/20 text-slate-300 rounded-full w-6 h-6 text-xs">🥈</span>
                                ) : position === 3 ? (
                                  <span className="inline-flex items-center justify-center bg-amber-700/10 border border-amber-700/20 text-amber-700 rounded-full w-6 h-6 text-xs">🥉</span>
                                ) : (
                                  position
                                )}
                              </TableCell>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2.5">
                                  <Avatar className="w-7 h-7 bg-muted/70 border border-border/80">
                                    <AvatarFallback className="text-[10px] font-bold">
                                      {name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-sm leading-none flex items-center gap-1.5">
                                      {row.user.name || "Membro"}
                                      {row.quantidadePalpites < 10 && (
                                        <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-0.2 rounded font-normal">
                                          Sem mínimo (10)
                                        </span>
                                      )}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">{row.user.email}</span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-bold text-amber-500 text-sm">
                                {Number(row.pontosTotal).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-center text-xs text-muted-foreground font-semibold">
                                {row.quantidadePalpites}
                              </TableCell>
                              <TableCell className="text-center text-xs text-muted-foreground">{row.acertosPlacar}</TableCell>
                              <TableCell className="text-center text-xs text-muted-foreground">{row.acertosResultado}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginação do ranking */}
                  {rankingTotalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-border/40 pt-4">
                      <span className="text-xs text-muted-foreground">
                        Página {rankingPage} de {rankingTotalPages}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={rankingPage <= 1}
                          onClick={() => fetchRanking(rankingPage - 1)}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={rankingPage >= rankingTotalPages}
                          onClick={() => fetchRanking(rankingPage + 1)}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Instruções e Regras */}
        <TabsContent value="rules" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Como Funciona */}
            <Card className="border border-border/80 shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-primary" /> Como Palpitar & Prazos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed font-normal">
                <p>
                  Palpitar é simples: basta preencher o placar esperado para cada partida (gols do time mandante e do time visitante) antes do encerramento do prazo.
                </p>
                <div className="bg-muted/20 border border-border/40 rounded-lg p-3 flex flex-col gap-2.5">
                  <div className="flex gap-2.5 items-start">
                    <Lock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground">
                      <strong>Horário Limite:</strong> Os palpites são congelados individualmente exatamente <strong>1 hora antes</strong> do horário oficial de início da partida (BRT).
                    </p>
                  </div>
                  <div className="flex gap-2.5 items-start border-t border-border/40 pt-2.5">
                    <Award className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground">
                      <strong>Mínimo para Premiação:</strong> É necessário ter no mínimo **10 jogos com palpites avaliados** para ter direito a receber prêmios (caso esteja na zona de premiação).
                    </p>
                  </div>
                </div>
                <p>
                  Você pode salvar e <strong>alterar seus palpites quantas vezes quiser</strong> antes do encerramento do prazo. Lembre-se de sempre clicar no botão <strong>&quot;Salvar Palpite&quot;</strong> de cada partida para registrar suas previsões.
                </p>
              </CardContent>
            </Card>

            {/* Pontuação */}
            <Card className="border border-border/80 shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-500" /> Sistema de Pontuação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed font-normal">
                <p>
                  Seu sucesso é determined pela precisão das suas previsões. A pontuação final é composta pela **média simples dos pontos feitos** nos jogos em que você palpitou (se não palpitar, o jogo não conta). Cada partida pode render:
                </p>
                <ul className="space-y-2.5">
                  <li className="flex gap-2 items-start">
                    <span className="text-emerald-500 font-bold shrink-0">🎯 +4 pts</span>
                    <span><strong>Placar Exato:</strong> Se você acertar o placar exato da partida (ex: apostou 2x1 e o jogo terminou 2x1). Este acerto anula a pontuação por resultado.</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="text-emerald-500 font-bold shrink-0">⚖️ +2 pts</span>
                    <span><strong>Apenas Resultado (1X2):</strong> Se você acertar apenas quem venceu ou o empate, errando o placar exato (ex: apostou 3x0 e terminou 1x0).</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="text-muted-foreground font-bold shrink-0">❌ 0 pt</span>
                    <span><strong>Erro total:</strong> Se errar tanto o placar exato quanto o vencedor/empate da partida.</span>
                  </li>
                </ul>
                <div className="border-t border-border/40 pt-3 text-xs flex justify-between font-semibold text-foreground">
                  <span>Pontuação Mínima por jogo: 0 pts</span>
                  <span>Pontuação Máxima por jogo: 4 pts</span>
                </div>
              </CardContent>
            </Card>

            {/* Regras de Apuração & Desempate */}
            <Card className="border border-border/80 shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Scale className="w-5 h-5 text-amber-500" /> Regras de Apuração & Desempate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed font-normal">
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">1. Apuração por Média Simples</h4>
                  <p className="text-xs text-muted-foreground">
                    A pontuação geral do participante é a **média simples** de pontos dos jogos em que ele enviou palpite. Jogos não palpitados não contam e não penalizam a média. Cada jogo vale:
                  </p>
                  <ul className="list-disc list-inside text-xs pl-1.5 space-y-1 text-muted-foreground">
                    <li><strong>4 pontos:</strong> Acerto do Placar Exato.</li>
                    <li><strong>2 pontos:</strong> Acerto de apenas o vencedor/empate (Resultado 1x2).</li>
                    <li><strong>0 pontos:</strong> Erro total do confronto.</li>
                  </ul>
                </div>

                <div className="space-y-2 border-t border-border/40 pt-3">
                  <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">2. Elegibilidade à Premiação</h4>
                  <p className="text-xs text-muted-foreground">
                    Para ter direito a receber prêmios (caso termine nas posições premiadas do ranking), o participante precisa obrigatoriamente ter acumulado **no mínimo 10 jogos com palpites avaliados** ao final do torneio.
                  </p>
                </div>

                <div className="space-y-2 border-t border-border/40 pt-3">
                  <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">3. Critérios de Desempate</h4>
                  <p className="text-xs text-muted-foreground">
                    Havendo igualdade na média de pontos entre dois ou mais participantes no ranking final, o desempate para as colocações obedecerá rigidamente à seguinte ordem:
                  </p>
                  <ol className="space-y-1.5 list-decimal list-inside text-xs text-foreground">
                    <li>Maior <strong>quantidade de palpites feitos</strong> no bolão.</li>
                    <li>Maior número de acertos de <strong>Placar Exato</strong>.</li>
                    <li>Maior número de acertos de <strong>Resultado Correto (1x2)</strong>.</li>
                    <li>Data de criação de conta mais antiga na plataforma (<strong>Membro Pioneiro</strong>).</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* Premiação */}
            <Card className="border border-border/80 shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-500 animate-bounce" /> Premiação do Bolão
                </CardTitle>
              </CardHeader>
              <CardContent className="leading-relaxed font-normal">
                {bolao?.premiacao ? (
                  <div className="bg-muted/30 border border-border/60 rounded-lg p-4 text-sm whitespace-pre-wrap text-foreground font-medium">
                    {typeof bolao.premiacao === "string" 
                      ? bolao.premiacao 
                      : JSON.stringify(bolao.premiacao, null, 2)}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Os vencedores da classificação ao final do torneio serão premiados com pontos BDB Bônus conforme a tabela abaixo:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className="border border-border/40 rounded-lg p-3 bg-muted/10 text-center flex flex-col items-center justify-center">
                        <span className="text-2xl">🥇</span>
                        <h4 className="font-bold text-sm mt-1 text-amber-400">1º Colocado</h4>
                        <p className="text-xs font-bold text-foreground mt-1">1.500 pontos</p>
                      </div>
                      <div className="border border-border/40 rounded-lg p-3 bg-muted/10 text-center flex flex-col items-center justify-center">
                        <span className="text-2xl">🥈</span>
                        <h4 className="font-bold text-sm mt-1 text-slate-300">2º Colocado</h4>
                        <p className="text-xs font-bold text-foreground mt-1">1.000 pontos</p>
                      </div>
                      <div className="border border-border/40 rounded-lg p-3 bg-muted/10 text-center flex flex-col items-center justify-center">
                        <span className="text-2xl">🥉</span>
                        <h4 className="font-bold text-sm mt-1 text-amber-700">3º Colocado</h4>
                        <p className="text-xs font-bold text-foreground mt-1">500 pontos</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="border border-border/40 rounded-lg p-3 bg-muted/5 flex items-center justify-between px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🌟</span>
                          <span className="font-bold text-xs text-foreground">4º e 5º Colocados</span>
                        </div>
                        <span className="text-xs font-bold text-foreground">300 pontos (cada)</span>
                      </div>
                      <div className="border border-border/40 rounded-lg p-3 bg-muted/5 flex items-center justify-between px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🏅</span>
                          <span className="font-bold text-xs text-foreground">6º ao 10º Colocados</span>
                        </div>
                        <span className="text-xs font-bold text-foreground">100 pontos (cada)</span>
                      </div>
                    </div>

                    <div className="border-t border-border/40 pt-4 mt-4 space-y-2">
                      <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">Equivalência & Troca de Pontos</h4>
                      <p className="text-xs text-muted-foreground">
                        Os pontos obtidos podem ser trocados na aba <strong>BDB Bônus</strong> por descontos diretos em assinaturas/serviços ou no curso completo, na seguinte proporção:
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-center">
                        <div className="bg-muted/30 border border-border/40 rounded p-2 text-xs">
                          <div className="font-bold text-amber-400">1.500 pts</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">30% OFF</div>
                        </div>
                        <div className="bg-muted/30 border border-border/40 rounded p-2 text-xs">
                          <div className="font-bold text-slate-300">1.000 pts</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">20% OFF</div>
                        </div>
                        <div className="bg-muted/30 border border-border/40 rounded p-2 text-xs">
                          <div className="font-bold text-amber-700">500 pts</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">10% OFF</div>
                        </div>
                        <div className="bg-muted/30 border border-border/40 rounded p-2 text-xs">
                          <div className="font-bold text-foreground/80">300 pts</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">6% OFF</div>
                        </div>
                        <div className="bg-muted/30 border border-border/40 rounded p-2 text-xs col-span-2 sm:col-span-1">
                          <div className="font-bold text-foreground/80">100 pts</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">2% OFF</div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground pt-1.5">
                        💡 <strong>Vantagens extras:</strong> Além dos descontos na assinatura ou curso completo, você pode trocar seus pontos por módulos individuais de cursos, curso inicial de apostas, ferramentas analíticas de risco, ou liberação de mais ligas de futebol no painel de análises por período determinado.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
