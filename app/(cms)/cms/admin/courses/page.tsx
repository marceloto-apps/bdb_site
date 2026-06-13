"use client"

import { useState, useEffect } from "react"
import { 
  GraduationCap, 
  BookOpen, 
  Layers, 
  Play, 
  Plus, 
  Edit, 
  Trash, 
  Save, 
  X, 
  ChevronRight, 
  Check, 
  AlertTriangle,
  ArrowLeft,
  HelpCircle,
  FileQuestion
} from "lucide-react"
import { 
  getCourses, 
  saveCourse, 
  deleteCourse, 
  getModules, 
  saveModule, 
  deleteModule, 
  getLessons, 
  saveLesson, 
  deleteLesson 
} from "@/lib/courses/actions/admin"
import { ImageUpload } from "@/components/cms/ImageUpload"

interface Course {
  id: string
  slug: string
  title: string
  description: string | null
  coverUrl: string | null
  access: "GRATIS" | "INCLUSO_BASICO" | "INCLUSO_PRO" | "AVULSO"
  priceCents: number | null
  pointsUnlockCost: number | null
  published: boolean
  order: number
}

interface Module {
  id: string
  courseId: string
  title: string
  order: number
}

interface Lesson {
  id: string
  moduleId: string
  title: string
  order: number
  videoUrl: string | null
  coverUrl: string | null
  contentHtml: string | null
  durationSec: number | null
  quiz?: {
    id: string
    passScore: number
    questions: any
  } | null
}

export default function CoursesAdminPage() {
  // Navigation Flow States
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)

  // Data Lists
  const [courses, setCourses] = useState<Course[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])

  // Edit / Form States
  const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null)
  const [editingModule, setEditingModule] = useState<Partial<Module> | null>(null)
  const [editingLesson, setEditingLesson] = useState<any | null>(null)

  // Feedback States
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Carregar cursos no início
  useEffect(() => {
    loadCourses()
  }, [])

  // Carregar módulos quando selecionar curso
  useEffect(() => {
    if (selectedCourse) {
      loadModules(selectedCourse.id)
      setSelectedModule(null)
      setLessons([])
    }
  }, [selectedCourse])

  // Carregar aulas quando selecionar módulo
  useEffect(() => {
    if (selectedModule) {
      loadLessons(selectedModule.id)
    }
  }, [selectedModule])

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setErrorMsg(null)
    setTimeout(() => setSuccessMsg(null), 4000)
  }

  const showError = (msg: string) => {
    setErrorMsg(msg)
    setSuccessMsg(null)
  }

  const loadCourses = async () => {
    setLoading(true)
    try {
      const data = await getCourses()
      setCourses(data)
    } catch (err: any) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadModules = async (courseId: string) => {
    setLoading(true)
    try {
      const data = await getModules(courseId)
      setModules(data)
    } catch (err: any) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadLessons = async (moduleId: string) => {
    setLoading(true)
    try {
      const data = await getLessons(moduleId)
      setLessons(data as any)
    } catch (err: any) {
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ==========================================
  // COURSE HANDLERS
  // ==========================================

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCourse?.title || !editingCourse?.slug) {
      showError("Preencha o título e slug do curso.")
      return
    }

    try {
      await saveCourse({
        ...editingCourse,
        access: editingCourse.access || "GRATIS",
        published: editingCourse.published ?? false,
        order: editingCourse.order ?? 0
      } as any)
      showSuccess("Curso salvo com sucesso!")
      setEditingCourse(null)
      loadCourses()
    } catch (err: any) {
      showError(err.message)
    }
  }

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este curso e todos os seus módulos/aulas?")) return
    try {
      await deleteCourse(id)
      showSuccess("Curso excluído!")
      if (selectedCourse?.id === id) setSelectedCourse(null)
      loadCourses()
    } catch (err: any) {
      showError(err.message)
    }
  }

  // ==========================================
  // MODULE HANDLERS
  // ==========================================

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingModule?.title || !selectedCourse) return

    try {
      await saveModule({
        ...editingModule,
        courseId: selectedCourse.id,
        order: editingModule.order ?? 0
      } as any)
      showSuccess("Módulo salvo com sucesso!")
      setEditingModule(null)
      loadModules(selectedCourse.id)
    } catch (err: any) {
      showError(err.message)
    }
  }

  const handleDeleteModule = async (id: string) => {
    if (!confirm("Excluir este módulo e todas as suas aulas?")) return
    try {
      await deleteModule(id)
      showSuccess("Módulo excluído!")
      if (selectedModule?.id === id) setSelectedModule(null)
      if (selectedCourse) loadModules(selectedCourse.id)
    } catch (err: any) {
      showError(err.message)
    }
  }

  // ==========================================
  // LESSON HANDLERS
  // ==========================================

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLesson?.title || !selectedModule) return

    try {
      await saveLesson({
        ...editingLesson,
        moduleId: selectedModule.id,
        order: editingLesson.order ?? 0
      })
      showSuccess("Aula/Quiz salvos com sucesso!")
      setEditingLesson(null)
      loadLessons(selectedModule.id)
    } catch (err: any) {
      showError(err.message)
    }
  }

  const handleDeleteLesson = async (id: string) => {
    if (!confirm("Excluir esta aula?")) return
    try {
      await deleteLesson(id)
      showSuccess("Aula excluída!")
      if (selectedModule) loadLessons(selectedModule.id)
    } catch (err: any) {
      showError(err.message)
    }
  }

  // Normalizar quiz de formatos antigos no cliente ao editar
  const startEditingLesson = (lesson: any) => {
    let normalizedQuiz = null
    if (lesson.quiz) {
      const rawQuestions = Array.isArray(lesson.quiz.questions) ? lesson.quiz.questions : []
      const questions = rawQuestions.map((q: any) => {
        // Se já está no formato novo
        if (q.enunciado !== undefined && q.opcoes !== undefined) {
          return q
        }
        // Se for o formato legado
        const questionText = q.question || ""
        const legacyOptions = Array.isArray(q.options) ? q.options : []
        const answerIdx = typeof q.answerIndex === "number" ? q.answerIndex : 0
        
        const opcoes = legacyOptions.map((opt: any, idx: number) => {
          const idStr = String.fromCharCode(97 + idx) // a, b, c, d
          return {
            id: idStr,
            texto: typeof opt === "string" ? opt : (opt?.texto || "")
          }
        })
        const respostaCorreta = opcoes[answerIdx]?.id || "a"
        
        return {
          id: q.id || `q-${Date.now()}-${Math.random()}`,
          enunciado: questionText,
          tipo: "multipla_escolha",
          opcoes,
          respostaCorreta,
          explicacao: q.explicacao || ""
        }
      })
      
      normalizedQuiz = {
        ...lesson.quiz,
        questions
      }
    }
    setEditingLesson({
      ...lesson,
      quiz: normalizedQuiz
    })
  }

  // Helper para Quiz
  const handleAddQuestion = () => {
    const currentQuestions = editingLesson.quiz?.questions || []
    const newQuestion = {
      id: `q-${Date.now()}`,
      enunciado: "Nova Pergunta?",
      tipo: "multipla_escolha",
      opcoes: [
        { id: "a", texto: "Opção A" },
        { id: "b", texto: "Opção B" },
        { id: "c", texto: "Opção C" },
        { id: "d", texto: "Opção D" }
      ],
      respostaCorreta: "a",
      explicacao: ""
    }
    setEditingLesson({
      ...editingLesson,
      quiz: {
        passScore: editingLesson.quiz?.passScore ?? 70,
        questions: [...currentQuestions, newQuestion]
      }
    })
  }

  const handleRemoveQuestion = (qId: string) => {
    const currentQuestions = editingLesson.quiz?.questions || []
    setEditingLesson({
      ...editingLesson,
      quiz: {
        passScore: editingLesson.quiz?.passScore ?? 70,
        questions: currentQuestions.filter((q: any) => q.id !== qId)
      }
    })
  }

  const handleQuestionChange = (qId: string, field: string, value: any) => {
    const currentQuestions = editingLesson.quiz?.questions || []
    const updated = currentQuestions.map((q: any) => {
      if (q.id === qId) {
        return { ...q, [field]: value }
      }
      return q
    })
    setEditingLesson({
      ...editingLesson,
      quiz: {
        ...editingLesson.quiz,
        questions: updated
      }
    })
  }

  return (
    <div className="space-y-6 text-zinc-100 bg-zinc-950 p-6 rounded-lg min-h-screen">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <GraduationCap className="text-amber-500 h-6 w-6" />
            Gestão de Cursos e Quizzes
          </h1>
          <p className="text-zinc-500 text-xs mt-1">
            Administre a estrutura dos cursos, as aulas e as avaliações associadas.
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

      {/* Breadcrumbs / Nível de Navegação */}
      <div className="flex items-center gap-2 text-xs bg-zinc-900/40 p-3 rounded-lg border border-zinc-850">
        <button 
          onClick={() => { setSelectedCourse(null); setSelectedModule(null); }}
          className="text-amber-500 font-bold hover:underline"
        >
          Cursos
        </button>
        {selectedCourse && (
          <>
            <ChevronRight className="h-3 w-3 text-zinc-650" />
            <button 
              onClick={() => { setSelectedModule(null); }}
              className="text-amber-500 font-bold hover:underline max-w-[150px] truncate"
            >
              {selectedCourse.title}
            </button>
          </>
        )}
        {selectedModule && (
          <>
            <ChevronRight className="h-3 w-3 text-zinc-650" />
            <span className="text-zinc-400 max-w-[150px] truncate">{selectedModule.title}</span>
          </>
        )}
      </div>

      {/* LEVEL 1: COURSE LIST */}
      {!selectedCourse && !editingCourse && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-amber-500" />
              Cursos Cadastrados
            </h2>
            <button 
              onClick={() => setEditingCourse({ slug: "", title: "", description: "", access: "GRATIS", published: false, order: 0 })}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar Curso
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => (
              <div 
                key={course.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between hover:border-zinc-750 transition-all"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                      {course.access}
                    </span>
                    <span className={`text-[10px] font-bold ${course.published ? "text-emerald-400" : "text-rose-400"}`}>
                      {course.published ? "Publicado" : "Rascunho"}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-2">{course.title}</h3>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{course.description || "Sem descrição."}</p>
                </div>

                <div className="flex justify-between items-center mt-6 border-t border-zinc-850 pt-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setEditingCourse(course)}
                      className="p-1 text-zinc-400 hover:text-white transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteCourse(course.id)}
                      className="p-1 text-zinc-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                  <button 
                    onClick={() => setSelectedCourse(course)}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-750 text-xs font-bold rounded flex items-center gap-1"
                  >
                    Módulos <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FORM: COURSE EDIT / CREATE */}
      {editingCourse && (
        <form onSubmit={handleSaveCourse} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4 max-w-2xl">
          <h2 className="text-base font-bold text-white">{editingCourse.id ? "Editar Curso" : "Novo Curso"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Título</label>
              <input 
                type="text" 
                required
                value={editingCourse.title || ""}
                onChange={(e) => setEditingCourse({...editingCourse, title: e.target.value})}
                className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Slug (Link amigável)</label>
              <input 
                type="text" 
                required
                value={editingCourse.slug || ""}
                onChange={(e) => setEditingCourse({...editingCourse, slug: e.target.value})}
                className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-zinc-400 mb-1">Descrição</label>
              <textarea 
                value={editingCourse.description || ""}
                onChange={(e) => setEditingCourse({...editingCourse, description: e.target.value})}
                className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100 h-20"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs text-zinc-400">Imagem de Capa (Curso)</label>
              <ImageUpload 
                value={editingCourse.coverUrl || ""}
                onChange={(url) => setEditingCourse({...editingCourse, coverUrl: url})}
                onRemove={() => setEditingCourse({...editingCourse, coverUrl: ""})}
                buttonText="Fazer upload de capa do curso"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Acesso</label>
              <select 
                value={editingCourse.access || "GRATIS"}
                onChange={(e) => setEditingCourse({...editingCourse, access: e.target.value as any})}
                className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100"
              >
                <option value="GRATIS">Grátis</option>
                <option value="INCLUSO_BASICO">Incluso VIP Básico</option>
                <option value="INCLUSO_PRO">Incluso VIP Pro</option>
                <option value="AVULSO">Vendido Avulso</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Preço Avulso (Centavos)</label>
              <input 
                type="number" 
                value={editingCourse.priceCents ?? ""}
                onChange={(e) => setEditingCourse({...editingCourse, priceCents: e.target.value ? parseInt(e.target.value) : null})}
                placeholder="ex: 9900 para R$ 99,00"
                className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Custo para desbloquear com Pontos</label>
              <input 
                type="number" 
                value={editingCourse.pointsUnlockCost ?? ""}
                onChange={(e) => setEditingCourse({...editingCourse, pointsUnlockCost: e.target.value ? parseInt(e.target.value) : null})}
                placeholder="Sem resgate por pontos se vazio"
                className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Ordem de Exibição</label>
              <input 
                type="number" 
                required
                value={editingCourse.order ?? 0}
                onChange={(e) => setEditingCourse({...editingCourse, order: parseInt(e.target.value) || 0})}
                className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100"
              />
            </div>
            <div className="flex items-center gap-6 mt-6">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input 
                  type="checkbox"
                  checked={editingCourse.published ?? false}
                  onChange={(e) => setEditingCourse({...editingCourse, published: e.target.checked})}
                  className="rounded border-zinc-800 bg-zinc-950 text-amber-500 focus:ring-0 focus:ring-offset-0"
                />
                Publicado? (Visível no site)
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-zinc-800 pt-4 mt-2">
            <button 
              type="button" 
              onClick={() => setEditingCourse(null)}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-xs font-bold rounded"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold rounded flex items-center gap-1"
            >
              <Save className="h-3.5 w-3.5" /> Salvar Curso
            </button>
          </div>
        </form>
      )}

      {/* LEVEL 2: MODULES OF SELECTED COURSE */}
      {selectedCourse && !selectedModule && !editingModule && (
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-zinc-850 pb-2">
            <button 
              onClick={() => setSelectedCourse(null)}
              className="text-zinc-400 hover:text-white flex items-center gap-1 text-xs"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar para Cursos
            </button>
            <h2 className="text-base font-black text-white">{selectedCourse.title} (Módulos)</h2>
          </div>

          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-zinc-350 flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-500" />
              Lista de Módulos
            </h3>
            <button 
              onClick={() => setEditingModule({ title: "", order: 0 })}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold rounded flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar Módulo
            </button>
          </div>

          {/* Lista Módulos */}
          <div className="space-y-3">
            {modules.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-8">Nenhum módulo cadastrado neste curso.</p>
            ) : (
              modules.map((mod) => (
                <div 
                  key={mod.id}
                  className="bg-zinc-900 border border-zinc-850 rounded-xl p-4 flex items-center justify-between hover:border-zinc-800"
                >
                  <div>
                    <h4 className="text-sm font-bold text-white">{mod.title}</h4>
                    <span className="text-[10px] text-zinc-500">Ordem: {mod.order}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2 border-r border-zinc-800 pr-4">
                      <button 
                        onClick={() => setEditingModule(mod)}
                        className="p-1 text-zinc-400 hover:text-white transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteModule(mod.id)}
                        className="p-1 text-zinc-400 hover:text-rose-450 transition-colors"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                    <button 
                      onClick={() => setSelectedModule(mod)}
                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-750 text-xs font-bold rounded flex items-center gap-1"
                    >
                      Aulas / Conteúdo <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* FORM: MODULE EDIT / CREATE */}
      {editingModule && (
        <form onSubmit={handleSaveModule} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4 max-w-md">
          <h2 className="text-sm font-bold text-white">{editingModule.id ? "Editar Módulo" : "Novo Módulo"}</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Título do Módulo</label>
              <input 
                type="text" 
                required
                value={editingModule.title || ""}
                onChange={(e) => setEditingModule({...editingModule, title: e.target.value})}
                className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Ordem de Exibição</label>
              <input 
                type="number" 
                required
                value={editingModule.order ?? 0}
                onChange={(e) => setEditingModule({...editingModule, order: parseInt(e.target.value) || 0})}
                className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-zinc-800 pt-4 mt-2">
            <button 
              type="button" 
              onClick={() => setEditingModule(null)}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-xs font-bold rounded"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold rounded"
            >
              Salvar Módulo
            </button>
          </div>
        </form>
      )}

      {/* LEVEL 3: LESSONS OF SELECTED MODULE */}
      {selectedModule && !editingLesson && (
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-zinc-850 pb-2">
            <button 
              onClick={() => setSelectedModule(null)}
              className="text-zinc-400 hover:text-white flex items-center gap-1 text-xs"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar para Módulos
            </button>
            <h2 className="text-base font-black text-white">{selectedModule.title} (Aulas)</h2>
          </div>

          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-zinc-350 flex items-center gap-2">
              <Play className="h-4 w-4 text-amber-500" />
              Aulas e Quizzes
            </h3>
            <button 
              onClick={() => setEditingLesson({ title: "", order: 0, videoUrl: "", contentHtml: "", durationSec: 0, quiz: null })}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold rounded flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar Aula
            </button>
          </div>

          {/* Lista Aulas */}
          <div className="space-y-3">
            {lessons.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-8">Nenhuma aula cadastrada neste módulo.</p>
            ) : (
              lessons.map((lesson) => (
                <div 
                  key={lesson.id}
                  className="bg-zinc-900 border border-zinc-850 rounded-xl p-4 flex items-center justify-between hover:border-zinc-800"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{lesson.title}</h4>
                      {lesson.quiz && (
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                          <FileQuestion className="h-3 w-3" /> Possui Quiz
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-500 space-x-3">
                      <span>Ordem: {lesson.order}</span>
                      {lesson.durationSec ? <span>Duração: {Math.round(lesson.durationSec / 60)} min</span> : null}
                      {lesson.videoUrl ? <span className="text-zinc-400">Vídeo configurado</span> : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => startEditingLesson(lesson)}
                      className="p-1.5 bg-zinc-850 hover:bg-zinc-800 hover:text-white rounded text-zinc-400 transition-colors"
                      title="Editar Aula e Quiz"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteLesson(lesson.id)}
                      className="p-1.5 bg-zinc-850 hover:bg-rose-500/10 hover:text-rose-400 rounded text-zinc-400 transition-colors"
                      title="Deletar Aula"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* FORM: LESSON & QUIZ EDIT / CREATE */}
      {editingLesson && (
        <form onSubmit={handleSaveLesson} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6 max-w-3xl">
          <h2 className="text-base font-bold text-white border-b border-zinc-850 pb-2">
            {editingLesson.id ? "Editar Aula e Quiz" : "Nova Aula"}
          </h2>
          
          {/* Dados Gerais da Aula */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider">Informações da Aula</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Título</label>
                <input 
                  type="text" 
                  required
                  value={editingLesson.title || ""}
                  onChange={(e) => setEditingLesson({...editingLesson, title: e.target.value})}
                  className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Ordem</label>
                <input 
                  type="number" 
                  required
                  value={editingLesson.order ?? 0}
                  onChange={(e) => setEditingLesson({...editingLesson, order: parseInt(e.target.value) || 0})}
                  className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Video URL (ex: Vimeo/YouTube/Wistia)</label>
                <input 
                  type="text" 
                  value={editingLesson.videoUrl || ""}
                  onChange={(e) => setEditingLesson({...editingLesson, videoUrl: e.target.value})}
                  className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100"
                  placeholder="Sem vídeo se vazio"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Duração (Segundos)</label>
                <input 
                  type="number" 
                  value={editingLesson.durationSec ?? ""}
                  onChange={(e) => setEditingLesson({...editingLesson, durationSec: e.target.value ? parseInt(e.target.value) : null})}
                  className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100"
                  placeholder="ex: 600 para 10 minutos"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs text-zinc-400">Imagem de Capa (Aula)</label>
                <ImageUpload 
                  value={editingLesson.coverUrl || ""}
                  onChange={(url) => setEditingLesson({...editingLesson, coverUrl: url})}
                  onRemove={() => setEditingLesson({...editingLesson, coverUrl: ""})}
                  buttonText="Fazer upload de capa da aula"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-zinc-400 mb-1">Conteúdo Html / Notas da Aula</label>
                <textarea 
                  value={editingLesson.contentHtml || ""}
                  onChange={(e) => setEditingLesson({...editingLesson, contentHtml: e.target.value})}
                  className="w-full text-sm bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-zinc-100 h-28"
                  placeholder="Você pode inserir Html ou texto explicativo aqui..."
                />
              </div>
            </div>
          </div>

          {/* Editor de Quiz */}
          <div className="border-t border-zinc-850 pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                <HelpCircle className="h-4 w-4" /> Configuração do Quiz
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (editingLesson.quiz) {
                    setEditingLesson({ ...editingLesson, quiz: null })
                  } else {
                    setEditingLesson({ ...editingLesson, quiz: { passScore: 70, questions: [] } })
                  }
                }}
                className={`px-3 py-1 rounded text-xs font-bold border transition-all ${
                  editingLesson.quiz 
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20" 
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                }`}
              >
                {editingLesson.quiz ? "Remover Quiz" : "Adicionar Quiz"}
              </button>
            </div>

            {editingLesson.quiz && (
              <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 space-y-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Pontuação Mínima para Passar (%)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="100"
                    required
                    value={editingLesson.quiz.passScore ?? 70}
                    onChange={(e) => setEditingLesson({
                      ...editingLesson,
                      quiz: { ...editingLesson.quiz, passScore: parseInt(e.target.value) || 70 }
                    })}
                    className="w-48 text-sm bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-100"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-zinc-300">Questões</h4>
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="px-2 py-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-bold rounded flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Nova Pergunta
                    </button>
                  </div>

                  {editingLesson.quiz.questions.length === 0 ? (
                    <p className="text-xs text-zinc-650 italic text-center py-4">Nenhuma pergunta criada ainda.</p>
                  ) : (
                    editingLesson.quiz.questions.map((q: any, idx: number) => (
                      <div key={q.id || idx} className="bg-zinc-900 border border-zinc-850 rounded-lg p-4 space-y-3 relative">
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(q.id)}
                          className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-rose-400"
                          title="Remover Pergunta"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">Pergunta {idx + 1}</label>
                          <input
                            type="text"
                            required
                            value={q.enunciado || ""}
                            onChange={(e) => handleQuestionChange(q.id, "enunciado", e.target.value)}
                            className="w-full text-sm bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {(q.opcoes || []).map((opt: any, optIdx: number) => (
                            <div key={opt.id || optIdx} className="flex items-center gap-2">
                              <span className="text-xs font-bold text-zinc-500">{String.fromCharCode(65 + optIdx)})</span>
                              <input
                                type="text"
                                required
                                value={opt.texto || ""}
                                onChange={(e) => {
                                  const opts = [...q.opcoes]
                                  opts[optIdx] = { ...opts[optIdx], texto: e.target.value }
                                  handleQuestionChange(q.id, "opcoes", opts)
                                }}
                                className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-zinc-150"
                              />
                            </div>
                          ))}
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">Opção Correta</label>
                          <select
                            value={q.respostaCorreta || ""}
                            onChange={(e) => handleQuestionChange(q.id, "respostaCorreta", e.target.value)}
                            className="text-xs bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-zinc-150"
                          >
                            {(q.opcoes || []).map((opt: any, oIdx: number) => (
                              <option key={opt.id || oIdx} value={opt.id}>
                                Opção {String.fromCharCode(65 + oIdx)} ({opt.id})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">Explicação / Feedback (Opcional)</label>
                          <textarea
                            value={q.explicacao || ""}
                            onChange={(e) => handleQuestionChange(q.id, "explicacao", e.target.value)}
                            className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 h-16"
                            placeholder="Explicação exibida após o aluno responder..."
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-zinc-800 pt-4">
            <button 
              type="button" 
              onClick={() => setEditingLesson(null)}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-xs font-bold rounded"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold rounded flex items-center gap-1"
            >
              <Save className="h-3.5 w-3.5" /> Salvar Conteúdo
            </button>
          </div>
        </form>
      )}

    </div>
  )
}
