"use client"

import { useState, useEffect } from "react"
import { 
  Play, 
  BookOpen, 
  Video, 
  FileText, 
  ChevronRight, 
  ChevronDown, 
  Loader2, 
  AlertTriangle,
  GraduationCap,
  ArrowLeft,
  Check,
  Tv
} from "lucide-react"
import { toggleLessonProgress } from "@/lib/courses/actions/admin"

interface Lesson {
  id: string
  title: string
  order: number
  durationSec: number | null
  contentHtml: string | null
  hasVideo: boolean
  completed: boolean
  watchedPct: number
}

interface Module {
  id: string
  title: string
  order: number
  lessons: Lesson[]
}

interface Course {
  id: string
  title: string
  description: string | null
  coverUrl: string | null
  access: "GRATIS" | "INCLUSO_BASICO" | "INCLUSO_PRO" | "AVULSO"
  modules: Module[]
}

interface CoursePlayerClientProps {
  courses: Course[]
}

function linkify(text: string): string {
  if (!text) return ""
  
  // Divide o texto pelas tags HTML existentes para linkificar apenas o texto livre
  const parts = text.split(/(<[^>]+>)/g)
  return parts
    .map((part) => {
      if (part.startsWith("<")) {
        return part // Mantém a tag HTML intacta
      }
      // Procura por URLs no texto plano
      return part.replace(/(https?:\/\/[^\s<>]+)/g, (url) => {
        let cleanUrl = url
        let trailing = ""
        // Remove pontuações finais comuns do link (ex: pontos finais ao término da frase)
        const match = url.match(/[.,;:?]+$/)
        if (match) {
          cleanUrl = url.substring(0, url.length - match[0].length)
          trailing = match[0]
        }
        return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="text-amber-500 hover:underline">${cleanUrl}</a>${trailing}`
      })
    })
    .join("")
}

export function CoursePlayerClient({ courses }: CoursePlayerClientProps) {
  // Controle de Visualização Principal: Vitrine vs Player de Curso
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null)
  
  // Dados de Cursos em estado reativo local para atualizar progresso em tempo real
  const [coursesState, setCoursesState] = useState<Course[]>(courses)
  
  // Aula selecionada
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [loadingVideo, setLoadingVideo] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [completingLessonId, setCompletingLessonId] = useState<string | null>(null)

  // Módulos abertos
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({})

  // Encontra o curso ativo
  const activeCourse = coursesState.find((c) => c.id === activeCourseId)

  // Encontra a aula, módulo selecionados
  let selectedModule: Module | null = null
  let selectedLesson: Lesson | null = null

  if (activeCourse) {
    for (const mod of activeCourse.modules) {
      const found = mod.lessons.find((l) => l.id === selectedLessonId)
      if (found) {
        selectedModule = mod
        selectedLesson = found
        break
      }
    }
  }

  // Efeito para buscar a embedUrl do vídeo seguro quando a aula mudar
  useEffect(() => {
    if (!selectedLesson) {
      setEmbedUrl(null)
      return
    }

    if (!selectedLesson.hasVideo) {
      setEmbedUrl(null)
      setVideoError(null)
      return
    }

    const fetchVideo = async () => {
      setLoadingVideo(true)
      setVideoError(null)
      setEmbedUrl(null)

      try {
        const response = await fetch(`/api/aulas/${selectedLesson!.id}/video`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.erro || "Falha ao carregar o vídeo.")
        }

        setEmbedUrl(data.embedUrl)
      } catch (err: any) {
        console.error("[CoursePlayer] Erro ao buscar vídeo:", err)
        setVideoError(err.message || "Erro de conexão ao carregar o vídeo.")
      } finally {
        setLoadingVideo(false)
      }
    }

    fetchVideo()
  }, [selectedLessonId, activeCourseId])

  // Trata a seleção de um curso na Vitrine
  const handleSelectCourse = (courseId: string) => {
    setActiveCourseId(courseId)
    const course = coursesState.find((c) => c.id === courseId)
    if (course) {
      if (course.modules.length > 0) {
        // Expande o primeiro módulo por padrão
        setExpandedModules({ [course.modules[0].id]: true })
        if (course.modules[0].lessons.length > 0) {
          setSelectedLessonId(course.modules[0].lessons[0].id)
        } else {
          setSelectedLessonId(null)
        }
      } else {
        setSelectedLessonId(null)
      }
    }
  }

  // Salva a conclusão da aula no banco de dados e atualiza o estado local reativo
  const handleToggleComplete = async (lessonId: string, currentCompleted: boolean) => {
    setCompletingLessonId(lessonId)
    const newCompleted = !currentCompleted
    try {
      await toggleLessonProgress(lessonId, newCompleted)
      
      // Atualiza o progresso local imediatamente
      setCoursesState((prev) =>
        prev.map((course) => ({
          ...course,
          modules: course.modules.map((mod) => ({
            ...mod,
            lessons: mod.lessons.map((lesson) => {
              if (lesson.id === lessonId) {
                return {
                  ...lesson,
                  completed: newCompleted,
                  watchedPct: newCompleted ? 100 : 0,
                }
              }
              return lesson
            }),
          })),
        }))
      )
    } catch (err) {
      console.error("[CoursePlayer] Erro ao salvar progresso:", err)
    } finally {
      setCompletingLessonId(null)
    }
  }

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }))
  }

  const formatDuration = (sec: number | null): string => {
    if (!sec) return ""
    const mins = Math.round(sec / 60)
    return `${mins} min`
  }

  // Calcula a porcentagem geral de conclusão de um curso
  const calculateCourseProgress = (course: Course): number => {
    const lessons = course.modules.flatMap((m) => m.lessons)
    if (lessons.length === 0) return 0
    const completed = lessons.filter((l) => l.completed).length
    return Math.round((completed / lessons.length) * 100)
  }

  const getAccessBadgeColor = (access: string) => {
    switch (access) {
      case "GRATIS":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
      case "INCLUSO_BASICO":
        return "bg-sky-500/10 text-sky-400 border border-sky-500/20"
      case "INCLUSO_PRO":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold"
      case "AVULSO":
        return "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
      default:
        return "bg-zinc-500/10 text-zinc-400"
    }
  }

  const getAccessLabel = (access: string) => {
    switch (access) {
      case "GRATIS":
        return "Grátis"
      case "INCLUSO_BASICO":
        return "VIP Básico"
      case "INCLUSO_PRO":
        return "VIP Pro"
      case "AVULSO":
        return "Avulso"
      default:
        return access
    }
  }

  // ==========================================
  // VIEW 1: VITRINE DE CURSOS (Grid Layout)
  // ==========================================
  if (!activeCourseId) {
    return (
      <div className="space-y-8 p-6 bg-zinc-950 rounded-xl min-h-screen">
        {/* Banner de Apresentação Premium */}
        <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-purple-950/20 to-black border border-zinc-850 rounded-3xl p-8 md:p-12 flex flex-col justify-center min-h-[220px]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
          <div className="relative space-y-3 max-w-2xl">
            <span className="text-amber-500 font-bold text-xs uppercase tracking-widest flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4" /> BDB Educação
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none">
              Módulos de Capacitação Esportiva
            </h1>
            <p className="text-zinc-400 text-xs md:text-sm leading-relaxed">
              Domine as técnicas de análise, precificação e estatísticas baseadas em métodos científicos, matemática e ciência de dados.
            </p>
          </div>
        </div>

        {/* Grade de Cursos */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Tv className="h-5 w-5 text-amber-500" /> Nossos Cursos
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {coursesState.map((course) => {
              const progressPct = calculateCourseProgress(course)
              const lessonsCount = course.modules.flatMap(m => m.lessons).length
              const modulesCount = course.modules.length

              return (
                <div
                  key={course.id}
                  onClick={() => handleSelectCourse(course.id)}
                  className="group relative flex flex-col bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-950/5 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
                >
                  {/* Capa do Curso */}
                  <div className="aspect-[16/9] w-full bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-zinc-950 relative flex items-center justify-center border-b border-zinc-850 overflow-hidden">
                    {course.coverUrl ? (
                      <img 
                        src={course.coverUrl} 
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="text-center p-6 space-y-1.5 select-none">
                        <GraduationCap className="h-10 w-10 text-purple-400/80 mx-auto opacity-70 group-hover:rotate-6 transition-transform" />
                        <span className="text-[10px] font-black text-zinc-500 tracking-wider uppercase block">BDB EDUCAÇÃO</span>
                      </div>
                    )}
                    
                    {/* Badge de Acesso */}
                    <div className="absolute top-3 left-3">
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${getAccessBadgeColor(course.access)}`}>
                        {getAccessLabel(course.access)}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                        {course.title}
                      </h3>
                      <p className="text-[11px] text-zinc-400 line-clamp-2">
                        {course.description || "Aprenda com profundidade as dinâmicas estratégicas aplicadas ao mercado."}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      {/* Estatísticas */}
                      <div className="flex items-center justify-between text-[10px] text-zinc-500">
                        <span>{modulesCount} {modulesCount === 1 ? "módulo" : "módulos"}</span>
                        <span>{lessonsCount} {lessonsCount === 1 ? "aula" : "aulas"}</span>
                      </div>

                      {/* Progresso do Aluno */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                          <span>Progresso</span>
                          <span>{progressPct}%</span>
                        </div>
                        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // VIEW 2: PLAYER DE AULAS (Timeline Sidebar + Player)
  // ==========================================
  const progressPct = activeCourse ? calculateCourseProgress(activeCourse) : 0
  const isLessonCompleted = selectedLesson?.completed || false

  return (
    <div className="space-y-6 p-6 bg-zinc-950 rounded-xl min-h-screen">
      {/* Cabeçalho do Player */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveCourseId(null)}
            className="p-2 bg-zinc-900 hover:bg-zinc-850 rounded-lg text-zinc-400 hover:text-white transition-colors border border-zinc-800"
            title="Voltar para a Vitrine de Cursos"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-zinc-500 tracking-wider uppercase">Curso Ativo</span>
            <h2 className="text-lg font-black text-white leading-tight">{activeCourse?.title}</h2>
          </div>
        </div>

        {/* Progresso do Aluno no Curso */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[9px] font-bold text-zinc-500 block">MEU PROGRESSO</span>
            <span className="text-xs font-black text-amber-500">{progressPct}% concluído</span>
          </div>
          <div className="w-32 md:w-44 bg-zinc-800 h-2 rounded-full overflow-hidden border border-zinc-850">
            <div 
              className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Coluna da Esquerda: Player de Vídeo e Material */}
        <div className="flex-1 space-y-6">
          {selectedLesson ? (
            <div className="space-y-6">
              {/* Vídeo */}
              {selectedLesson.hasVideo ? (
                <div className="w-full aspect-video bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 relative flex items-center justify-center shadow-xl">
                  {loadingVideo && (
                    <div className="flex flex-col items-center gap-2 text-zinc-400">
                      <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                      <span className="text-xs">Carregando player seguro...</span>
                    </div>
                  )}

                  {videoError && (
                    <div className="p-6 text-center max-w-md space-y-3">
                      <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto" />
                      <h4 className="text-sm font-bold text-zinc-200">Não foi possível exibir o vídeo</h4>
                      <p className="text-xs text-zinc-500">{videoError}</p>
                    </div>
                  )}

                  {embedUrl && (
                    <iframe
                      src={embedUrl}
                      className="w-full h-full"
                      allowFullScreen
                      allow="autoplay; encrypted-media; picture-in-picture"
                    />
                  )}
                </div>
              ) : null}

              {/* Status de Conclusão / Ações */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-850 rounded-2xl p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                    <span>Módulo: {selectedModule?.title}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{selectedLesson.title}</h3>
                </div>

                <button
                  onClick={() => handleToggleComplete(selectedLesson!.id, isLessonCompleted)}
                  disabled={completingLessonId === selectedLesson.id}
                  className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shrink-0 ${
                    isLessonCompleted
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                      : "bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-750"
                  }`}
                >
                  {completingLessonId === selectedLesson.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isLessonCompleted ? (
                    <div className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center text-zinc-950">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-zinc-500" />
                  )}
                  {isLessonCompleted ? "Aula Concluída" : "Marcar como Concluída"}
                </button>
              </div>

              {/* Notas de Aula */}
              {selectedLesson.contentHtml && (
                <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-5 md:p-6 space-y-4">
                  <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest border-b border-zinc-850 pb-2 flex items-center gap-1.5">
                    <FileText className="h-4 w-4" /> Notas de Aula
                  </h4>
                  <div 
                    className="text-xs md:text-sm text-zinc-300 leading-relaxed space-y-4 prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: linkify(selectedLesson.contentHtml) }}
                  />
                </div>
              )}

              {!selectedLesson.hasVideo && !selectedLesson.contentHtml && (
                <div className="text-center py-12 border border-dashed border-zinc-850 rounded-xl">
                  <FileText className="h-10 w-10 text-zinc-650 mx-auto mb-2" />
                  <p className="text-xs text-zinc-550">Esta aula não possui notas textuais ou vídeo cadastrados.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Tv className="h-12 w-12 text-zinc-750 mb-3" />
              <h3 className="text-sm font-bold text-zinc-350">Selecione uma Aula</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Utilize a grade curricular ao lado para selecionar uma aula e iniciar.
              </p>
            </div>
          )}
        </div>

        {/* Coluna da Direita: Grade Curricular Timeline */}
        <div className="w-full lg:w-96 shrink-0 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 self-start space-y-4">
          <h3 className="text-xs font-bold text-zinc-400 px-1 tracking-wider uppercase flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-amber-500" /> Grade Curricular
          </h3>

          <div className="space-y-3">
            {activeCourse?.modules.map((mod) => {
              const isModExpanded = !!expandedModules[mod.id]
              const totalModLessons = mod.lessons.length
              const completedModLessons = mod.lessons.filter(l => l.completed).length

              return (
                <div key={mod.id} className="border border-zinc-850 rounded-xl bg-zinc-950/40 overflow-hidden">
                  {/* Cabeçalho do Módulo */}
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-zinc-850/30 transition-colors text-left"
                  >
                    <div className="space-y-1 flex-1 pr-2">
                      <h4 className="font-bold text-zinc-200 text-xs leading-tight line-clamp-1">{mod.title}</h4>
                      <span className="text-[9px] text-zinc-500 block font-medium">
                        {completedModLessons}/{totalModLessons} concluídas
                      </span>
                    </div>
                    {isModExpanded ? <ChevronDown className="h-4 w-4 text-zinc-500" /> : <ChevronRight className="h-4 w-4 text-zinc-500" />}
                  </button>

                  {/* Lista de Aulas no Formato Timeline */}
                  {isModExpanded && (
                    <div className="border-t border-zinc-850 bg-zinc-950/20 p-4 space-y-0">
                      {mod.lessons.length === 0 ? (
                        <p className="text-[10px] text-zinc-650 italic p-1">Nenhuma aula neste módulo.</p>
                      ) : (
                        mod.lessons.map((lesson, index) => {
                          const isSelected = lesson.id === selectedLessonId
                          const isCompleted = lesson.completed
                          const hasLine = index < mod.lessons.length - 1

                          return (
                            <div key={lesson.id} className="relative flex gap-3">
                              {/* Timeline Linha e Conector */}
                              <div className="flex flex-col items-center shrink-0 w-5">
                                <button
                                  onClick={() => handleToggleComplete(lesson.id, isCompleted)}
                                  disabled={completingLessonId === lesson.id}
                                  className="group relative flex items-center justify-center mt-1 focus:outline-none"
                                >
                                  {isCompleted ? (
                                    <div className="h-4 w-4 rounded-full bg-emerald-500 border border-emerald-400 flex items-center justify-center text-zinc-950 group-hover:scale-110 transition-transform">
                                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                                    </div>
                                  ) : isSelected ? (
                                    <div className="h-4 w-4 rounded-full bg-amber-500 ring-4 ring-amber-500/20 border border-amber-400" />
                                  ) : (
                                    <div className="h-4 w-4 rounded-full bg-zinc-900 border border-zinc-700 hover:border-zinc-500" />
                                  )}
                                </button>
                                {hasLine && (
                                  <div className="w-[1px] flex-1 border-l border-dashed border-zinc-800 my-1 min-h-[30px]" />
                                )}
                              </div>

                              {/* Conteúdo Textual da Aula */}
                              <div className="flex-1 pb-4">
                                <button
                                  onClick={() => setSelectedLessonId(lesson.id)}
                                  className={`w-full text-left font-medium leading-snug transition-all ${
                                    isSelected 
                                      ? "text-amber-400 font-bold text-xs" 
                                      : "text-zinc-400 hover:text-zinc-100 text-xs"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="line-clamp-2">{lesson.title}</span>
                                    {lesson.durationSec && (
                                      <span className="text-[9px] text-zinc-650 font-normal mt-0.5 shrink-0">
                                        {formatDuration(lesson.durationSec)}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
