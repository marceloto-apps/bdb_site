"use client"

import { useState, useEffect } from "react"
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Trash, 
  Save, 
  Check, 
  AlertTriangle,
  ListPlus
} from "lucide-react"
import { getPlans, savePlan, deletePlan } from "@/lib/plans/actions/admin"

interface PlanConfig {
  id: string
  name: string
  priceCents: number
  stripePriceId: string
  description: string | null
  features: string // JSON string
  order: number
  active: boolean
}

export default function PlansAdminPage() {
  const [plans, setPlans] = useState<PlanConfig[]>([])
  const [editingPlan, setEditingPlan] = useState<Partial<PlanConfig> & { featuresText?: string } | null>(null)
  
  // Feedback States
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadPlans()
  }, [])

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setErrorMsg(null)
    setTimeout(() => setSuccessMsg(null), 4000)
  }

  const showError = (msg: string) => {
    setErrorMsg(msg)
    setSuccessMsg(null)
  }

  const loadPlans = async () => {
    setLoading(true)
    try {
      const data = await getPlans()
      setPlans(data)
    } catch (err: any) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPlan?.name || !editingPlan?.stripePriceId) {
      showError("Preencha o nome do plano e o ID de preço do Stripe.")
      return
    }

    // Converter features do texto (linha por linha) para JSON string
    const featuresArr = editingPlan.featuresText
      ? editingPlan.featuresText.split("\n").map(f => f.trim()).filter(Boolean)
      : []
    const featuresJson = JSON.stringify(featuresArr)

    try {
      await savePlan({
        id: editingPlan.id,
        name: editingPlan.name,
        priceCents: editingPlan.priceCents ?? 0,
        stripePriceId: editingPlan.stripePriceId,
        description: editingPlan.description ?? null,
        features: featuresJson,
        order: editingPlan.order ?? 0,
        active: editingPlan.active ?? false
      })
      showSuccess("Plano salvo com sucesso!")
      setEditingPlan(null)
      loadPlans()
    } catch (err: any) {
      showError(err.message)
    }
  }

  const handleDeletePlan = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este plano?")) return
    try {
      await deletePlan(id)
      showSuccess("Plano excluído!")
      loadPlans()
    } catch (err: any) {
      showError(err.message)
    }
  }

  const startEditing = (plan: PlanConfig) => {
    // Converter JSON de features para texto linha por linha para edição
    let featuresText = ""
    try {
      const arr = JSON.parse(plan.features)
      if (Array.isArray(arr)) {
        featuresText = arr.join("\n")
      }
    } catch (e) {
      featuresText = ""
    }

    setEditingPlan({
      ...plan,
      featuresText
    })
  }

  const startAdding = () => {
    setEditingPlan({
      name: "",
      priceCents: 0,
      stripePriceId: "",
      description: "",
      featuresText: "",
      order: plans.length + 1,
      active: false
    })
  }

  // Helpers para exibição de preço
  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  return (
    <div className="space-y-6 text-zinc-100 bg-zinc-950 p-6 rounded-lg min-h-screen">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <CreditCard className="text-[#22c55e] h-6 w-6" />
            Gestão de Planos e Preços
          </h1>
          <p className="text-zinc-500 text-xs mt-1">
            Administre os planos de assinatura exibidos no site e associados aos IDs de preços do Stripe.
          </p>
        </div>
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

      {/* PLANS LIST */}
      {!editingPlan && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ListPlus className="h-5 w-5 text-[#22c55e]" />
              Planos Cadastrados
            </h2>
            <button 
              onClick={startAdding}
              className="px-3 py-1.5 bg-[#22c55e] hover:bg-[#16a34a] text-black text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar Plano
            </button>
          </div>

          {loading && (
            <p className="text-xs text-zinc-500 text-center py-8">Carregando planos...</p>
          )}

          {!loading && plans.length === 0 ? (
            <div className="text-center py-12 border border-zinc-800 rounded-xl bg-zinc-900/20">
              <p className="text-sm text-zinc-500">Nenhum plano cadastrado no banco de dados.</p>
              <p className="text-xs text-zinc-650 mt-1">Use o botão acima para cadastrar o primeiro plano.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plans.map((plan) => {
                let featuresList: string[] = []
                try {
                  featuresList = JSON.parse(plan.features)
                } catch (e) {
                  featuresList = []
                }

                return (
                  <div 
                    key={plan.id}
                    className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-750 transition-all relative overflow-hidden"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                          Ordem {plan.order}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          plan.active 
                            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
                            : "text-zinc-500 bg-zinc-800/40 border-zinc-800"
                        }`}>
                          {plan.active ? "Ativo no Site" : "Oculto/Inativo"}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-white mt-3 flex items-baseline gap-2">
                        {plan.name}
                        <span className="text-xs text-zinc-400 font-normal">
                          ({formatPrice(plan.priceCents)})
                        </span>
                      </h3>
                      
                      <p className="text-xs text-zinc-500 mt-1">{plan.description || "Sem descrição."}</p>
                      
                      <div className="mt-4 space-y-1">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">ID do Preço Stripe</span>
                        <code className="text-xs text-zinc-400 bg-zinc-950 px-2 py-1 rounded block border border-zinc-900 truncate font-mono">
                          {plan.stripePriceId || "Não configurado"}
                        </code>
                      </div>

                      {featuresList.length > 0 && (
                        <div className="mt-4">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Vantagens</span>
                          <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
                            {featuresList.slice(0, 3).map((f, i) => (
                              <li key={i} className="truncate">{f}</li>
                            ))}
                            {featuresList.length > 3 && (
                              <li className="text-zinc-500 text-[10px] list-none">+{featuresList.length - 3} mais...</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 mt-6 border-t border-zinc-850 pt-4">
                      <button 
                        onClick={() => startEditing(plan)}
                        className="px-3 py-1 bg-zinc-800 hover:bg-zinc-750 text-xs font-bold rounded flex items-center gap-1 transition-colors"
                      >
                        <Edit className="h-3.5 w-3.5" /> Editar
                      </button>
                      <button 
                        onClick={() => handleDeletePlan(plan.id)}
                        className="px-3 py-1 bg-zinc-850 hover:bg-rose-500/10 hover:text-rose-400 rounded text-zinc-400 text-xs font-bold transition-colors"
                      >
                        <Trash className="h-3.5 w-3.5" /> Excluir
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* EDIT / CREATE FORM */}
      {editingPlan && (
        <form onSubmit={handleSavePlan} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 max-w-2xl">
          <h2 className="text-lg font-bold text-white border-b border-zinc-800 pb-2">
            {editingPlan.id ? "Editar Plano" : "Novo Plano"}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Nome do Plano (Ex: VIP Básico)</label>
              <input 
                type="text" 
                required
                value={editingPlan.name || ""}
                onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100 focus:border-zinc-700 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Preço em R$ (Ex: 39,90)</label>
              <input 
                type="number" 
                step="0.01"
                required
                value={editingPlan.priceCents !== undefined ? (editingPlan.priceCents / 100) : ""}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0
                  setEditingPlan({...editingPlan, priceCents: Math.round(val * 100)})
                }}
                placeholder="0.00"
                className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100 focus:border-zinc-700 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-zinc-400 mb-1">ID de Preço do Stripe (Ex: price_...)</label>
              <input 
                type="text" 
                required
                placeholder="Copie do painel do Stripe (Live ou Test)"
                value={editingPlan.stripePriceId || ""}
                onChange={(e) => setEditingPlan({...editingPlan, stripePriceId: e.target.value})}
                className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100 focus:border-zinc-700 outline-none font-mono text-xs"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-zinc-400 mb-1">Descrição Curta</label>
              <input 
                type="text"
                value={editingPlan.description || ""}
                onChange={(e) => setEditingPlan({...editingPlan, description: e.target.value})}
                className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100 focus:border-zinc-700 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-zinc-400 mb-1">
                Recursos / Features (Uma vantagem por linha)
              </label>
              <textarea 
                value={editingPlan.featuresText || ""}
                onChange={(e) => setEditingPlan({...editingPlan, featuresText: e.target.value})}
                placeholder="Ex:&#10;Todas as 25+ ligas VIP inclusas&#10;Previsões Dixon-Coles e NB&#10;Gráficos avançados de xG"
                rows={5}
                className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100 focus:border-zinc-700 outline-none h-32"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Ordem de Exibição</label>
              <input 
                type="number" 
                required
                value={editingPlan.order ?? 0}
                onChange={(e) => setEditingPlan({...editingPlan, order: parseInt(e.target.value) || 0})}
                className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100 focus:border-zinc-700 outline-none"
              />
            </div>

            <div className="flex items-center gap-6 mt-6">
              <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={editingPlan.active ?? false}
                  onChange={(e) => setEditingPlan({...editingPlan, active: e.target.checked})}
                  className="rounded border-zinc-800 bg-zinc-950 text-[#22c55e] focus:ring-0 focus:ring-offset-0"
                />
                Ativo no site público?
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-zinc-800 pt-4 mt-2">
            <button 
              type="button" 
              onClick={() => setEditingPlan(null)}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-xs font-bold rounded"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-3 py-1.5 bg-[#22c55e] hover:bg-[#16a34a] text-black text-xs font-bold rounded flex items-center gap-1"
            >
              <Save className="h-3.5 w-3.5" /> Salvar Plano
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
