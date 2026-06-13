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
  GraduationCap
} from "lucide-react"

interface Lesson {
  id: string
  title: string
  order: number
  durationSec: number | null
  contentHtml: string | null
  hasVideo: boolean
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
  // Encontra a primeira aula válida para deixar selecionada por padrão
  const getFirstLessonId = (): string | null => {
    for (const course of courses) {
      for (const mod of course.modules) {
        if (mod.lessons.length > 0) {
          return mod.lessons[0].id
        }
      }
    }
    return null
  }

  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(getFirstLessonId())
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [loadingVideo, setLoadingVideo] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>(() => {
    // Expande o primeiro curso por padrão
    if (courses.length > 0) {
      return { [courses[0].id]: true }
    }
    return {}
  })
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => {
    // Expande o primeiro módulo por padrão
    if (courses.length > 0 && courses[0].modules.length > 0) {
      return { [courses[0].modules[0].id]: true }
    }
    return {}
  })

  // Encontra a aula, módulo e curso selecionados atualmente
  let selectedCourse: Course | null = null
  let selectedModule: Module | null = null
  let selectedLesson: Lesson | null = null

  for (const course of courses) {
    for (const mod of course.modules) {
      const found = mod.lessons.find((l) => l.id === selectedLessonId)
      if (found) {
        selectedCourse = course
        selectedModule = mod
        selectedLesson = found
        break
      }
    }
    if (selectedLesson) break
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
  }, [selectedLessonId])

  const toggleCourse = (courseId: string) => {
    setExpandedCourses((prev) => ({ ...prev, [courseId]: !prev[courseId] }))
  }

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }))
  }

  const formatDuration = (sec: number | null): string => {
    if (!sec) return ""
    const mins = Math.round(sec / 60)
    return `${mins} min`
  }

  const getAccessBadgeColor = (access: string) => {
    switch (access) {
      case "GRATIS":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
      case "INCLUSO_BASICO":
        return "bg-sky-500/10 text-sky-400 border border-sky-500/20"
      case "INCLUSO_PRO":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold"
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

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <GraduationCap className="h-16 w-16 text-zinc-650 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-zinc-100">Nenhum curso publicado ainda</h2>
        <p className="text-zinc-500 text-sm max-w-sm mt-2">
          Volte mais tarde. Nossos administradores estão preparando novos conteúdos incríveis para você.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-6rem)]">
      {/* Sidebar de Aulas */}
      <div className="w-full lg:w-80 shrink-0 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 self-start space-y-4">
        <h3 className="text-sm font-bold text-zinc-400 px-1 tracking-wider uppercase">Conteúdo do Curso</h3>
        
        <div className="space-y-3">
          {courses.map((course) => {
            const isCourseExpanded = !!expandedCourses[course.id]
            return (
              <div key={course.id} className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/40">
                {/* Cabeçalho do Curso */}
                <button
                  onClick={() => toggleCourse(course.id)}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-zinc-850/50 transition-colors text-left"
                >
                  <div className="space-y-1 pr-2">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${getAccessBadgeColor(course.access)}`}>
                      {getAccessLabel(course.access)}
                    </span>
                    <h4 className="font-bold text-zinc-150 text-xs line-clamp-1 mt-1">{course.title}</h4>
                  </div>
                  {isCourseExpanded ? <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" /> : <ChevronRight className="h-4 w-4 text-zinc-500 shrink-0" />}
                </button>

                {/* Módulos do Curso */}
                {isCourseExpanded && (
                  <div className="border-t border-zinc-850 bg-zinc-950/25 p-2 space-y-2">
                    {course.modules.length === 0 ? (
                      <p className="text-[10px] text-zinc-555 italic p-2">Sem módulos cadastrados.</p>
                    ) : (
                      course.modules.map((mod) => {
                        const isModExpanded = !!expandedModules[mod.id]
                        return (
                          <div key={mod.id} className="space-y-1">
                            <button
                              onClick={() => toggleModule(mod.id)}
                              className="w-full flex items-center justify-between p-2 rounded hover:bg-zinc-900 text-left"
                            >
                              <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5">
                                <BookOpen className="h-3.5 w-3.5 text-amber-500/80 shrink-0" />
                                <span className="line-clamp-1">{mod.title}</span>
                              </span>
                              {isModExpanded ? <ChevronDown className="h-3 w-3 text-zinc-650 shrink-0" /> : <ChevronRight className="h-3 w-3 text-zinc-650 shrink-0" />}
                            </button>

                            {/* Aulas do Módulo */}
                            {isModExpanded && (
                              <div className="pl-4 pr-1 py-1 space-y-1">
                                {mod.lessons.length === 0 ? (
                                  <p className="text-[10px] text-zinc-650 italic p-1">Sem aulas.</p>
                                ) : (
                                  mod.lessons.map((lesson) => {
                                    const isSelected = lesson.id === selectedLessonId
                                    return (
                                      <button
                                        key={lesson.id}
                                        onClick={() => setSelectedLessonId(lesson.id)}
                                        className={`w-full flex items-start gap-2 p-2 rounded text-left transition-all ${
                                          isSelected 
                                            ? "bg-amber-500/10 text-amber-400 font-medium border border-amber-500/20" 
                                            : "hover:bg-zinc-900/60 text-zinc-350 hover:text-zinc-100"
                                        }`}
                                      >
                                        {lesson.hasVideo ? (
                                          <Video className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                        ) : (
                                          <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                        )}
                                        <div className="space-y-0.5">
                                          <p className="text-[11px] leading-tight line-clamp-2">{lesson.title}</p>
                                          {lesson.durationSec && (
                                            <span className="text-[9px] text-zinc-500 block">
                                              {formatDuration(lesson.durationSec)}
                                            </span>
                                          )}
                                        </div>
                                      </button>
                                    )
                                  })
                                )}
                              </div>
                            )}
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

      {/* Player de Conteúdo Principal */}
      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 lg:p-6 space-y-6">
        {selectedLesson ? (
          <div className="space-y-6">
            {/* Breadcrumb e Cabeçalho da Aula */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-550">
                <span className="truncate max-w-[120px]">{selectedCourse?.title}</span>
                <ChevronRight className="h-2.5 w-2.5" />
                <span className="truncate max-w-[120px]">{selectedModule?.title}</span>
              </div>
              <h2 className="text-xl font-black text-white">{selectedLesson.title}</h2>
            </div>

            {/* Container do Vídeo */}
            {selectedLesson.hasVideo && (
              <div className="w-full aspect-video bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 relative flex items-center justify-center">
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
            )}

            {/* Conteúdo Textual / Notas de Aula */}
            {selectedLesson.contentHtml && (
              <div className="border-t border-zinc-800 pt-6 space-y-3">
                <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider">Notas de Aula</h3>
                <div 
                  className="text-sm text-zinc-300 leading-relaxed space-y-4 prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: linkify(selectedLesson.contentHtml) }}
                />
              </div>
            )}

            {!selectedLesson.hasVideo && !selectedLesson.contentHtml && (
              <div className="text-center py-12 border border-dashed border-zinc-850 rounded-xl">
                <FileText className="h-10 w-10 text-zinc-650 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">Esta aula não possui conteúdo ou vídeo cadastrados.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Play className="h-12 w-12 text-zinc-700 mb-3 animate-pulse" />
            <h3 className="text-sm font-bold text-zinc-300">Selecione uma Aula</h3>
            <p className="text-xs text-zinc-550 mt-1 max-w-xs">
              Escolha uma das aulas disponíveis no menu lateral para começar a assistir.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
