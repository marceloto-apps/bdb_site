"use client"

import { useState, useEffect } from "react"
import { 
  Coins, 
  Award, 
  Clock, 
  Gift, 
  History, 
  Check, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Ticket
} from "lucide-react"

interface Transaction {
  id: string
  type: string
  amount: number
  reason: string
  createdAt: string
  expiresAt: string | null
}

interface BalanceResponse {
  balance: number
  status: string
  nextStatus: string | null
  pointsToProgress: number | null
  progressPercentage: number
  expiringSoon: number
}

interface HistoryResponse {
  transactions: Transaction[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

interface RewardOption {
  id: string
  label: string
  pointsCost: number
  discountPct: number
  appliesTo: string
}

export default function BdbPointsPage() {
  // Estados da página
  const [balanceData, setBalanceData] = useState<BalanceResponse | null>(null)
  const [historyData, setHistoryData] = useState<HistoryResponse | null>(null)
  const [rewards, setRewards] = useState<RewardOption[]>([])
  const [page, setPage] = useState(1)
  
  // UI States
  const [loadingBalance, setLoadingBalance] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [redeemingId, setRedeemingId] = useState<string | null>(null)
  const [couponCode, setCouponCode] = useState<string | null>(null)
  const [redeemedRewardLabel, setRedeemedRewardLabel] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Carregar dados principais
  useEffect(() => {
    fetchBalance()
    fetchHistory()
    fetchRewards()
  }, [page])

  const fetchBalance = async () => {
    try {
      const res = await fetch("/api/points/balance")
      if (res.ok) {
        const data = await res.json()
        setBalanceData(data)
      }
    } catch (err) {
      console.error("Erro ao carregar saldo:", err)
    } finally {
      setLoadingBalance(false)
    }
  }

  const fetchHistory = async () => {
    setLoadingHistory(true)
    try {
      const res = await fetch(`/api/points/history?page=${page}&pageSize=8`)
      if (res.ok) {
        const data = await res.json()
        setHistoryData(data)
      }
    } catch (err) {
      console.error("Erro ao carregar histórico:", err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const fetchRewards = async () => {
    try {
      // Como não criamos um endpoint público para listar as opções, podemos listá-las via API temporária 
      // ou fazer fetch de uma API específica, ou renderizar do banco.
      // Vamos criar um endpoint rápido em /api/points/rewards para isso, ou usar uma lista estática.
      // Espera, para ser premium e dinâmico, vamos criar uma rota em `/api/points/rewards` mais tarde.
      // Por ora, vamos buscar da api se estiver disponível, caso contrário fallback para as opções do seed.
      const res = await fetch("/api/points/rewards")
      if (res.ok) {
        const data = await res.json()
        setRewards(data)
      } else {
        // Fallback seed se a api falhar
        setRewards([
          { id: "opt-1", label: "10% off na assinatura", pointsCost: 500, discountPct: 10, appliesTo: "SUBSCRIPTION" },
          { id: "opt-2", label: "20% off na assinatura", pointsCost: 1200, discountPct: 20, appliesTo: "SUBSCRIPTION" },
          { id: "opt-3", label: "15% off em curso avulso", pointsCost: 800, discountPct: 15, appliesTo: "COURSE" }
        ])
      }
    } catch (err) {
      console.error("Erro ao carregar recompensas:", err)
    }
  }

  // Resgatar recompensa
  const handleRedeem = async (rewardId: string, label: string) => {
    setRedeemingId(rewardId)
    setErrorMsg(null)
    setSuccessMsg(null)
    setCouponCode(null)
    
    try {
      const res = await fetch("/api/points/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardOptionId: rewardId })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setCouponCode(data.coupon.code)
        setRedeemedRewardLabel(label)
        setSuccessMsg("Recompensa resgatada com sucesso!")
        // Recarregar dados
        fetchBalance()
        fetchHistory()
      } else {
        setErrorMsg(data.error || "Erro ao realizar o resgate.")
      }
    } catch (err) {
      setErrorMsg("Erro de conexão com o servidor.")
    } finally {
      setRedeemingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Bronze": return "text-amber-700 bg-amber-700/10 border-amber-700/20"
      case "Prata": return "text-slate-400 bg-slate-400/10 border-slate-400/20"
      case "Ouro": return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
      case "Diamante": return "text-cyan-400 bg-cyan-400/10 border-cyan-400/20"
      default: return "text-primary bg-primary/10 border-primary/20"
    }
  }

  return (
    <div className="flex-1 space-y-8 p-8 md:p-10 bg-zinc-950 text-zinc-100 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Coins className="text-amber-500 h-8 w-8 animate-pulse" />
            BDB Bônus
          </h1>
          <p className="text-zinc-400 mt-1">
            Acumule bônus lendo análises, completando desafios e troque por cupons exclusivos.
          </p>
        </div>
      </div>

      {/* Grid de Informações */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card de Saldo */}
        <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-md">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Coins className="h-24 w-24 text-amber-500" />
          </div>
          <div className="flex items-center gap-2 text-zinc-400 font-semibold text-sm">
            <Coins className="h-4 w-4 text-amber-500" />
            SALDO DISPONÍVEL
          </div>
          {loadingBalance ? (
            <div className="h-10 w-24 bg-zinc-800 rounded animate-pulse mt-4" />
          ) : (
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-black text-white">
                {balanceData?.balance ?? 0}
              </span>
              <span className="text-zinc-500 text-lg font-bold">pts</span>
            </div>
          )}
          <p className="text-xs text-zinc-500 mt-4">
            Pontos ativos prontos para uso em resgates.
          </p>
        </div>

        {/* Card de Status / Nível */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-400 font-semibold text-sm">
              <Award className="h-4 w-4 text-amber-500" />
              STATUS DO USUÁRIO
            </div>
            {balanceData?.status && (
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${getStatusColor(balanceData.status)}`}>
                {balanceData.status}
              </span>
            )}
          </div>

          {loadingBalance ? (
            <div className="space-y-3 mt-5">
              <div className="h-6 bg-zinc-800 rounded animate-pulse w-3/4" />
              <div className="h-2 bg-zinc-800 rounded animate-pulse w-full" />
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {balanceData?.nextStatus ? (
                <>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Progresso para {balanceData.nextStatus}</span>
                    <span className="text-white font-bold">{balanceData.pointsToProgress} pts faltam</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2">
                    <div 
                      className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${balanceData.progressPercentage}%` }}
                    />
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-sm text-yellow-500 font-semibold bg-yellow-500/5 border border-yellow-500/10 p-2.5 rounded-lg">
                  <Sparkles className="h-4 w-4" />
                  Nível Máximo Atingido! (Diamante)
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-zinc-500 mt-4">
            Calculado com base nos ganhos dos últimos 12 meses.
          </p>
        </div>

        {/* Card de Expiração */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 text-zinc-400 font-semibold text-sm">
            <Clock className="h-4 w-4 text-amber-500" />
            EXPIRANDO EM BREVE
          </div>
          {loadingBalance ? (
            <div className="h-10 w-24 bg-zinc-800 rounded animate-pulse mt-4" />
          ) : (
            <div className="mt-4 flex items-baseline gap-2">
              <span className={`text-4xl font-extrabold ${balanceData?.expiringSoon ? "text-orange-400" : "text-white"}`}>
                {balanceData?.expiringSoon ?? 0}
              </span>
              <span className="text-zinc-500 text-sm font-semibold">pts</span>
            </div>
          )}
          <p className="text-xs text-zinc-500 mt-4">
            Pontos que expiram nos próximos 60 dias.
          </p>
        </div>

      </div>

      {/* Modais ou mensagens de Feedback */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg flex flex-col gap-3">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Check className="h-5 w-5 bg-emerald-500 text-zinc-950 rounded-full p-0.5" />
            {successMsg}
          </div>
          {couponCode && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 mt-1">
              <div>
                <p className="text-xs text-zinc-500">Cupom de Desconto para {redeemedRewardLabel}</p>
                <div className="text-2xl font-black tracking-widest text-emerald-400 mt-1 bg-emerald-500/5 border border-emerald-500/20 px-3 py-1.5 rounded font-mono">
                  {couponCode}
                </div>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(couponCode)
                  alert("Código copiado!")
                }}
                className="w-full md:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Ticket className="h-4 w-4" />
                Copiar Código
              </button>
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg flex items-center gap-2 text-sm font-semibold">
          <AlertTriangle className="h-5 w-5" />
          {errorMsg}
        </div>
      )}

      {/* Recompensas & Resgates */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Gift className="h-5 w-5 text-amber-500" />
          Recompensas Disponíveis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rewards.map((reward) => {
            const hasBalance = balanceData ? balanceData.balance >= reward.pointsCost : false
            const isRedeeming = redeemingId === reward.id
            
            return (
              <div 
                key={reward.id} 
                className="flex flex-col justify-between rounded-xl border border-zinc-850 bg-zinc-900/40 p-6 transition-all hover:border-zinc-800"
              >
                <div>
                  <span className="text-xs text-amber-500 font-bold uppercase tracking-wider bg-amber-500/5 px-2.5 py-1 rounded">
                    {reward.appliesTo === "SUBSCRIPTION" ? "Assinatura" : "Curso Avulso"}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-3">{reward.label}</h3>
                  <div className="mt-4 flex items-center gap-2 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 w-fit">
                    <Coins className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-black text-amber-500">{reward.pointsCost}</span>
                    <span className="text-zinc-500 text-xs">pontos</span>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    disabled={!hasBalance || isRedeeming}
                    onClick={() => handleRedeem(reward.id, reward.label)}
                    className={`w-full py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                      hasBalance 
                        ? "bg-amber-500 hover:bg-amber-600 text-zinc-950" 
                        : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    }`}
                  >
                    {isRedeeming ? (
                      <span className="h-4 w-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Gift className="h-4 w-4" />
                        {hasBalance ? "Resgatar Recompensa" : "Pontos Insuficientes"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Histórico de Transações */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <History className="h-5 w-5 text-amber-500" />
          Histórico de Bônus
        </h2>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-zinc-400">
              <thead className="text-xs uppercase bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Ação / Motivo</th>
                  <th className="px-6 py-4">Valor</th>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Expiração</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {loadingHistory ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="bg-zinc-900/10">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="h-4 bg-zinc-800 rounded animate-pulse w-full" />
                      </td>
                    </tr>
                  ))
                ) : historyData && historyData.transactions.length > 0 ? (
                  historyData.transactions.map((tx) => {
                    const isPositive = tx.amount > 0
                    return (
                      <tr key={tx.id} className="hover:bg-zinc-900/20 bg-zinc-900/5">
                        <td className="px-6 py-4 font-bold">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            tx.type === "GANHO" || tx.type === "AJUSTE" && isPositive
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-rose-500/10 text-rose-400"
                          }`}>
                            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-200">{tx.reason}</td>
                        <td className={`px-6 py-4 font-black ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                          {isPositive ? `+${tx.amount}` : tx.amount}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          {new Date(tx.createdAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-500">
                          {tx.expiresAt 
                            ? new Date(tx.expiresAt).toLocaleDateString("pt-BR") 
                            : "-"
                          }
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                      Nenhuma transação de bônus registrada ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {historyData && historyData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900/50 px-6 py-4">
              <span className="text-xs text-zinc-500">
                Página {historyData.pagination.page} de {historyData.pagination.totalPages} ({historyData.pagination.total} transações)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  disabled={page >= historyData.pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
