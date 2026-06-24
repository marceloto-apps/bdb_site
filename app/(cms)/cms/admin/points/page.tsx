"use client"

import { useState, useEffect } from "react"
import { 
  Coins, 
  Settings, 
  Gift, 
  History, 
  UserRound,
  Plus, 
  Edit, 
  Save, 
  X, 
  Search,
  Check,
  AlertTriangle
} from "lucide-react"
import { 
  getPointRules, 
  savePointRule, 
  getRewardOptions, 
  saveRewardOption, 
  createManualAdjustment, 
  getGlobalHistory 
} from "@/lib/points/actions/admin"

interface PointRule {
  id: string
  action: string
  label: string
  points: number
  dailyCap: number | null
  monthlyCap: number | null
  countsToCap: boolean
  active: boolean
}

interface RewardOption {
  id: string
  label: string
  pointsCost: number
  discountPct: number
  appliesTo: string
  couponValidityDays: number
  active: boolean
  order: number
}

interface GlobalTransaction {
  id: string
  type: string
  amount: number
  reason: string
  createdAt: any
  user: {
    name: string | null
    email: string | null
  }
}

export default function PointsAdminPage() {
  const [activeTab, setActiveTab] = useState<"rules" | "rewards" | "adjust" | "history">("rules")
  
  // Data States
  const [rules, setRules] = useState<PointRule[]>([])
  const [rewards, setRewards] = useState<RewardOption[]>([])
  const [historyData, setHistoryData] = useState<{
    transactions: GlobalTransaction[]
    pagination: { page: number; totalPages: number; total: number }
  } | null>(null)
  
  // Forms & Edit States
  const [editingRule, setEditingRule] = useState<Partial<PointRule> | null>(null)
  const [editingReward, setEditingReward] = useState<Partial<RewardOption> | null>(null)
  const [historyPage, setHistoryPage] = useState(1)

  // Adjustment Form States
  const [adjustEmail, setAdjustEmail] = useState("")
  const [adjustAmount, setAdjustAmount] = useState(0)
  const [adjustReason, setAdjustReason] = useState("")

  // Feedback States
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Carregar dados
  useEffect(() => {
    if (activeTab === "rules") loadRules()
    if (activeTab === "rewards") loadRewards()
    if (activeTab === "history") loadHistory()
  }, [activeTab, historyPage])

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setErrorMsg(null)
    setTimeout(() => setSuccessMsg(null), 4000)
  }

  const showError = (msg: string) => {
    setErrorMsg(msg)
    setSuccessMsg(null)
  }

  const loadRules = async () => {
    setLoading(true)
    try {
      const data = await getPointRules()
      setRules(data as PointRule[])
    } catch (err: any) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadRewards = async () => {
    setLoading(true)
    try {
      const data = await getRewardOptions()
      setRewards(data as RewardOption[])
    } catch (err: any) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async () => {
    setLoading(true)
    try {
      const data = await getGlobalHistory(historyPage, 15)
      setHistoryData(data as any)
    } catch (err: any) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Ações de Regras
  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRule?.action || !editingRule?.label || editingRule.points === undefined) {
      showError("Preencha todos os campos obrigatórios.")
      return
    }

    try {
      await savePointRule(editingRule as any)
      showSuccess("Regra salva com sucesso!")
      setEditingRule(null)
      loadRules()
    } catch (err: any) {
      showError(err.message)
    }
  }

  // Ações de Recompensas
  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingReward?.label || editingReward.pointsCost === undefined || editingReward.discountPct === undefined) {
      showError("Preencha todos os campos obrigatórios.")
      return
    }

    try {
      await saveRewardOption({
        ...editingReward,
        appliesTo: editingReward.appliesTo || "SUBSCRIPTION",
        couponValidityDays: editingReward.couponValidityDays ?? 15,
        active: editingReward.active ?? true,
        order: editingReward.order ?? 0
      } as any)
      showSuccess("Recompensa salva com sucesso!")
      setEditingReward(null)
      loadRewards()
    } catch (err: any) {
      showError(err.message)
    }
  }

  // Ajuste Manual
  const handleManualAdjust = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjustEmail || !adjustAmount || !adjustReason) {
      showError("Preencha todos os campos do ajuste.")
      return
    }

    setLoading(true)
    try {
      await createManualAdjustment(adjustEmail, adjustAmount, adjustReason)
      showSuccess(`Ajuste de ${adjustAmount} pts criado para o email ${adjustEmail}!`)
      setAdjustEmail("")
      setAdjustAmount(0)
      setAdjustReason("")
    } catch (err: any) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 text-zinc-100 bg-zinc-950 p-6 rounded-lg min-h-screen">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Coins className="text-amber-500 h-6 w-6" />
            Painel BDB Bônus Admin
          </h1>
          <p className="text-zinc-500 text-xs mt-1">
            Configure regras de acúmulo, crie recompensas e aplique ajustes manuais.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-850 gap-2">
        <button 
          onClick={() => setActiveTab("rules")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "rules" ? "border-amber-500 text-amber-500 bg-amber-500/5" : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <Settings className="h-4 w-4" />
          Regras de Acúmulo
        </button>
        <button 
          onClick={() => setActiveTab("rewards")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "rewards" ? "border-amber-500 text-amber-500 bg-amber-500/5" : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <Gift className="h-4 w-4" />
          Recompensas (Cupons)
        </button>
        <button 
          onClick={() => setActiveTab("adjust")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "adjust" ? "border-amber-500 text-amber-500 bg-amber-500/5" : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <UserRound className="h-4 w-4" />
          Ajuste Manual
        </button>
        <button 
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "history" ? "border-amber-500 text-amber-500 bg-amber-500/5" : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <History className="h-4 w-4" />
          Histórico Global
        </button>
      </div>

      {/* Feedbacks */}
      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg flex items-center gap-2 text-xs font-bold">
          <Check className="h-4 w-4" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg flex items-center gap-2 text-xs font-bold">
          <AlertTriangle className="h-4 w-4" />
          {errorMsg}
        </div>
      )}

      {/* Loading Overlay */}
      {loading && <div className="text-zinc-500 text-xs animate-pulse">Carregando dados...</div>}

      {/* TAB: RULES */}
      {activeTab === "rules" && !loading && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Regras de Ganho Ativas</h2>
            <button 
              onClick={() => setEditingRule({ action: "", label: "", points: 10, countsToCap: true, active: true })}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar Regra
            </button>
          </div>

          {/* Form Regra */}
          {editingRule && (
            <form onSubmit={handleSaveRule} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white">{editingRule.id ? "Editar Regra" : "Nova Regra"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Ação / Identificador (ex: LER_ESTUDO)</label>
                  <input 
                    type="text" 
                    required
                    disabled={!!editingRule.id}
                    value={editingRule.action || ""}
                    onChange={(e) => setEditingRule({...editingRule, action: e.target.value})}
                    className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Descrição legível</label>
                  <input 
                    type="text" 
                    required
                    value={editingRule.label || ""}
                    onChange={(e) => setEditingRule({...editingRule, label: e.target.value})}
                    className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Pontos concedidos</label>
                  <input 
                    type="number" 
                    required
                    value={editingRule.points ?? 0}
                    onChange={(e) => setEditingRule({...editingRule, points: parseInt(e.target.value) || 0})}
                    className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Limite Diário (Transações)</label>
                  <input 
                    type="number" 
                    value={editingRule.dailyCap ?? ""}
                    onChange={(e) => setEditingRule({...editingRule, dailyCap: e.target.value ? parseInt(e.target.value) : null})}
                    placeholder="Sem limite"
                    className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Limite Mensal (Transações)</label>
                  <input 
                    type="number" 
                    value={editingRule.monthlyCap ?? ""}
                    onChange={(e) => setEditingRule({...editingRule, monthlyCap: e.target.value ? parseInt(e.target.value) : null})}
                    placeholder="Sem limite"
                    className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100"
                  />
                </div>
                <div className="flex items-center gap-6 mt-6">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={editingRule.countsToCap ?? true}
                      onChange={(e) => setEditingRule({...editingRule, countsToCap: e.target.checked})}
                      className="rounded border-zinc-800 bg-zinc-950 text-amber-500 focus:ring-0 focus:ring-offset-0"
                    />
                    Contabiliza no Teto do Plano?
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={editingRule.active ?? true}
                      onChange={(e) => setEditingRule({...editingRule, active: e.target.checked})}
                      className="rounded border-zinc-800 bg-zinc-950 text-amber-500 focus:ring-0 focus:ring-offset-0"
                    />
                    Ativo?
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-zinc-800 pt-4 mt-2">
                <button 
                  type="button" 
                  onClick={() => setEditingRule(null)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-xs font-bold rounded"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold rounded flex items-center gap-1"
                >
                  <Save className="h-3.5 w-3.5" /> Salvar Regra
                </button>
              </div>
            </form>
          )}

          {/* Lista Regras */}
          <div className="rounded-xl border border-zinc-850 bg-zinc-900/10 overflow-hidden">
            <table className="w-full text-sm text-left text-zinc-400">
              <thead className="text-xs uppercase bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-3">Ação</th>
                  <th className="px-6 py-3">Título</th>
                  <th className="px-6 py-3">Pontos</th>
                  <th className="px-6 py-3">Limites</th>
                  <th className="px-6 py-3">Teto Plano</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-zinc-900/25">
                    <td className="px-6 py-3 font-semibold text-zinc-200">{rule.action}</td>
                    <td className="px-6 py-3 text-xs">{rule.label}</td>
                    <td className="px-6 py-3 font-bold text-amber-500">{rule.points} pts</td>
                    <td className="px-6 py-3 text-xs text-zinc-500">
                      Dia: {rule.dailyCap ?? "∞"} | Mês: {rule.monthlyCap ?? "∞"}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rule.countsToCap ? "bg-amber-500/10 text-amber-500" : "bg-zinc-800 text-zinc-500"}`}>
                        {rule.countsToCap ? "Sim" : "Não"}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rule.active ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                        {rule.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button 
                        onClick={() => setEditingRule(rule)}
                        className="p-1 hover:text-white transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: REWARDS */}
      {activeTab === "rewards" && !loading && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Opções de Recompensa</h2>
            <button 
              onClick={() => setEditingReward({ label: "", pointsCost: 500, discountPct: 10, appliesTo: "SUBSCRIPTION", couponValidityDays: 15, active: true, order: 0 })}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar Recompensa
            </button>
          </div>

          {/* Form Recompensa */}
          {editingReward && (
            <form onSubmit={handleSaveReward} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white">{editingReward.id ? "Editar Recompensa" : "Nova Recompensa"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Título da Recompensa (ex: 10% off na assinatura)</label>
                  <input 
                    type="text" 
                    required
                    value={editingReward.label || ""}
                    onChange={(e) => setEditingReward({...editingReward, label: e.target.value})}
                    className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Porcentagem de Desconto (%)</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    max="100"
                    value={editingReward.discountPct ?? 0}
                    onChange={(e) => {
                      const pct = parseInt(e.target.value) || 0
                      setEditingReward({
                        ...editingReward,
                        discountPct: pct,
                        pointsCost: pct * 50
                      })
                    }}
                    className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Custo em Pontos (Auto-calculado)</label>
                  <input 
                    type="number" 
                    disabled
                    value={editingReward.pointsCost ?? 0}
                    className="w-full text-sm bg-zinc-900 border border-zinc-850 rounded px-3 py-2 text-zinc-500 cursor-not-allowed font-bold"
                  />
                  <span className="text-[10px] text-zinc-550 mt-1 block">Regra: 50 pontos para cada 1% de desconto.</span>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Validade do Cupom (Dias)</label>
                  <input 
                    type="number" 
                    required
                    value={editingReward.couponValidityDays ?? 15}
                    onChange={(e) => setEditingReward({...editingReward, couponValidityDays: parseInt(e.target.value) || 15})}
                    className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Aplica-se a</label>
                  <select 
                    value={editingReward.appliesTo || "SUBSCRIPTION"}
                    onChange={(e) => setEditingReward({...editingReward, appliesTo: e.target.value})}
                    className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100"
                  >
                    <option value="SUBSCRIPTION">Assinatura (Stripe)</option>
                    <option value="COURSE">Curso Avulso</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Ordenação no Dashboard</label>
                  <input 
                    type="number" 
                    value={editingReward.order ?? 0}
                    onChange={(e) => setEditingReward({...editingReward, order: parseInt(e.target.value) || 0})}
                    className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100"
                  />
                </div>
                <div className="flex items-center gap-6 mt-6">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={editingReward.active ?? true}
                      onChange={(e) => setEditingReward({...editingReward, active: e.target.checked})}
                      className="rounded border-zinc-800 bg-zinc-950 text-amber-500 focus:ring-0 focus:ring-offset-0"
                    />
                    Disponível para Resgate?
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-zinc-800 pt-4 mt-2">
                <button 
                  type="button" 
                  onClick={() => setEditingReward(null)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-xs font-bold rounded"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold rounded flex items-center gap-1"
                >
                  <Save className="h-3.5 w-3.5" /> Salvar Recompensa
                </button>
              </div>
            </form>
          )}

          {/* Lista Recompensas */}
          <div className="rounded-xl border border-zinc-850 bg-zinc-900/10 overflow-hidden">
            <table className="w-full text-sm text-left text-zinc-400">
              <thead className="text-xs uppercase bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-3">Título</th>
                  <th className="px-6 py-3">Custo Pontos</th>
                  <th className="px-6 py-3">Desconto</th>
                  <th className="px-6 py-3">Aplica-se</th>
                  <th className="px-6 py-3">Validade</th>
                  <th className="px-6 py-3">Ordenação</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {rewards.map((reward) => (
                  <tr key={reward.id} className="hover:bg-zinc-900/25">
                    <td className="px-6 py-3 font-semibold text-zinc-200">{reward.label}</td>
                    <td className="px-6 py-3 font-bold text-amber-500">{reward.pointsCost} pts</td>
                    <td className="px-6 py-3 font-bold text-emerald-400">{reward.discountPct}%</td>
                    <td className="px-6 py-3 text-xs">{reward.appliesTo === "SUBSCRIPTION" ? "Assinatura" : "Curso"}</td>
                    <td className="px-6 py-3 text-xs">{reward.couponValidityDays} dias</td>
                    <td className="px-6 py-3 text-xs text-zinc-500">{reward.order}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${reward.active ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                        {reward.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button 
                        onClick={() => setEditingReward(reward)}
                        className="p-1 hover:text-white transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: MANUAL ADJUSTMENT */}
      {activeTab === "adjust" && (
        <div className="max-w-xl bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UserRound className="h-5 w-5 text-amber-500" />
            Lançar Ajuste Manual de Pontos
          </h2>
          <p className="text-zinc-500 text-xs">
            Esta ação adiciona ou retira pontos da carteira de um usuário criando um evento transacional de AJUSTE.
          </p>

          <form onSubmit={handleManualAdjust} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">E-mail do Usuário</label>
              <input 
                type="email" 
                required
                placeholder="exemplo@bigdatabet.com.br"
                value={adjustEmail}
                onChange={(e) => setAdjustEmail(e.target.value)}
                className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Quantidade de Pontos (Use sinal negativo para retirar)</label>
              <input 
                type="number" 
                required
                placeholder="ex: 150 ou -100"
                value={adjustAmount || ""}
                onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
                className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Motivo / Razão (Auditoria pública)</label>
              <input 
                type="text" 
                required
                placeholder="ex: Correção de erro na bonificação de artigo"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-zinc-950 font-bold rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
            >
              Lançar Ajuste Transacional
            </button>
          </form>
        </div>
      )}

      {/* TAB: GLOBAL HISTORY */}
      {activeTab === "history" && !loading && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="h-5 w-5 text-amber-500" />
            Transações Gerais (Auditoria do Sistema)
          </h2>

          <div className="rounded-xl border border-zinc-850 bg-zinc-900/10 overflow-hidden">
            <table className="w-full text-sm text-left text-zinc-400">
              <thead className="text-xs uppercase bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-3.5">Usuário</th>
                  <th className="px-6 py-3.5">Tipo</th>
                  <th className="px-6 py-3.5">Valor</th>
                  <th className="px-6 py-3.5">Motivo</th>
                  <th className="px-6 py-3.5">Data Criação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {historyData?.transactions.map((tx) => {
                  const isPositive = tx.amount > 0
                  return (
                    <tr key={tx.id} className="hover:bg-zinc-900/20 bg-zinc-900/5">
                      <td className="px-6 py-3">
                        <div className="text-sm font-semibold text-zinc-200">{tx.user.name || "Sem nome"}</div>
                        <div className="text-xs text-zinc-500">{tx.user.email}</div>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.type === "GANHO" || tx.type === "AJUSTE" && isPositive
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-rose-500/10 text-rose-400"
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className={`px-6 py-3 font-black ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                        {isPositive ? `+${tx.amount}` : tx.amount}
                      </td>
                      <td className="px-6 py-3 text-xs text-zinc-300">{tx.reason}</td>
                      <td className="px-6 py-3 text-xs text-zinc-500">
                        {new Date(tx.createdAt).toLocaleString("pt-BR")}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Paginação */}
            {historyData && historyData.pagination.totalPages > 1 && (
              <div className="flex justify-between items-center bg-zinc-900/50 px-6 py-4 border-t border-zinc-800">
                <span className="text-xs text-zinc-500">
                  Página {historyPage} de {historyData.pagination.totalPages} ({historyData.pagination.total} transações)
                </span>
                <div className="flex gap-2">
                  <button 
                    disabled={historyPage <= 1}
                    onClick={() => setHistoryPage(historyPage - 1)}
                    className="px-3 py-1 bg-zinc-950 border border-zinc-850 rounded hover:bg-zinc-900 text-xs disabled:opacity-30"
                  >
                    Anterior
                  </button>
                  <button 
                    disabled={historyPage >= historyData.pagination.totalPages}
                    onClick={() => setHistoryPage(historyPage + 1)}
                    className="px-3 py-1 bg-zinc-950 border border-zinc-850 rounded hover:bg-zinc-900 text-xs disabled:opacity-30"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
