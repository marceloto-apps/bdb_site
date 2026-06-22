"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Send, Reply, User, Loader2, CornerDownRight, X, AlertTriangle } from "lucide-react"
import { getLessonComments, createLessonComment } from "@/lib/courses/actions/comments"

interface CommentUser {
  id: string
  name: string | null
  email: string | null
  role: string
  image: string | null
}

interface LessonComment {
  id: string
  lessonId: string
  userId: string
  content: string
  parentId: string | null
  createdAt: Date
  updatedAt: Date
  user: CommentUser
}

interface LessonCommentsProps {
  lessonId: string
  currentUser: {
    id: string
    name: string | null
    role: string
  } | null
}

export function LessonComments({ lessonId, currentUser }: LessonCommentsProps) {
  const [comments, setComments] = useState<LessonComment[]>([])
  const [newComment, setNewComment] = useState("")
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [replySubmitLoading, setReplySubmitLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const isStaff = currentUser?.role === "ADMIN" || currentUser?.role === "EDITOR"

  // Carrega os comentários da aula
  const loadComments = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const data = await getLessonComments(lessonId)
      setComments(data as any)
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao carregar comentários.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComments()
    setNewComment("")
    setReplyingToId(null)
    setReplyContent("")
  }, [lessonId])

  // Cria um comentário principal (dúvida)
  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmitLoading(true)
    setErrorMsg(null)
    try {
      const created = await createLessonComment({
        lessonId,
        content: newComment.trim()
      })
      
      // Insere o comentário no estado local
      setComments((prev) => [...prev, created as any])
      setNewComment("")
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao enviar comentário.")
    } finally {
      setSubmitLoading(false)
    }
  }

  // Cria uma resposta a um comentário
  const handleCreateReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault()
    if (!replyContent.trim()) return

    setReplySubmitLoading(true)
    setErrorMsg(null)
    try {
      const created = await createLessonComment({
        lessonId,
        content: replyContent.trim(),
        parentId
      })

      // Insere a resposta no estado local
      setComments((prev) => [...prev, created as any])
      setReplyingToId(null)
      setReplyContent("")
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao enviar resposta.")
    } finally {
      setReplySubmitLoading(false)
    }
  }

  // Formata a data de exibição
  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  // Define as cores e rótulos dos crachás (badges) de papel de usuário
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Admin
          </span>
        )
      case "EDITOR":
        return (
          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Editor
          </span>
        )
      case "AUTOR":
        return (
          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Autor
          </span>
        )
      default:
        return (
          <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-zinc-800 text-zinc-400">
            Aluno
          </span>
        )
    }
  }

  // Agrupa comentários principais (sem parentId)
  const mainComments = comments.filter((c) => !c.parentId)

  // Retorna as respostas de um comentário específico
  const getRepliesFor = (parentId: string) => {
    return comments.filter((c) => c.parentId === parentId)
  }

  return (
    <div className="space-y-6 pt-6 border-t border-zinc-850">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-amber-500" />
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
          Dúvidas e Comentários ({comments.length})
        </h4>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center gap-2 text-xs font-bold">
          <AlertTriangle className="h-4 w-4" />
          {errorMsg}
        </div>
      )}

      {/* Formulário para Novo Comentário Principal */}
      <form onSubmit={handleCreateComment} className="space-y-3 bg-zinc-900 border border-zinc-850 p-4 rounded-2xl shadow-md">
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
            Tem alguma dúvida ou comentário sobre esta aula?
          </label>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Digite sua dúvida ou comentário aqui..."
            rows={3}
            required
            className="w-full text-xs md:text-sm bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-zinc-700 resize-none transition-colors"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitLoading || !newComment.trim()}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
          >
            {submitLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Enviar Comentário
          </button>
        </div>
      </form>

      {/* Lista de Comentários */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      ) : mainComments.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-zinc-850 rounded-2xl bg-zinc-900/10">
          <MessageSquare className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-xs text-zinc-550">Nenhum comentário cadastrado para esta aula ainda. Seja o primeiro a perguntar!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {mainComments.map((comment) => {
            const replies = getRepliesFor(comment.id)
            const isReplying = replyingToId === comment.id

            return (
              <div key={comment.id} className="space-y-4 bg-zinc-950/20 border border-zinc-900 rounded-2xl p-4 md:p-5 shadow-sm">
                {/* Dúvida Principal */}
                <div className="flex gap-3">
                  {/* Avatar */}
                  <div className="shrink-0">
                    {comment.user.image ? (
                      <img
                        src={comment.user.image}
                        alt={comment.user.name || ""}
                        className="h-8 w-8 rounded-full border border-zinc-800 object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                        <User className="h-4.5 w-4.5" />
                      </div>
                    )}
                  </div>

                  {/* Detalhes do Autor e Conteúdo */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-white">
                        {comment.user.name || "Usuário"}
                      </span>
                      {getRoleBadge(comment.user.role)}
                      <span className="text-[10px] text-zinc-500 font-medium">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs md:text-sm text-zinc-300 whitespace-pre-line leading-relaxed">
                      {comment.content}
                    </p>

                    {/* Botão Responder (Somente para ADMIN/EDITOR) */}
                    {isStaff && !isReplying && (
                      <div className="pt-1">
                        <button
                          onClick={() => {
                            setReplyingToId(comment.id)
                            setReplyContent("")
                          }}
                          className="text-[10px] font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors"
                        >
                          <Reply className="h-3 w-3" />
                          Responder
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Respostas Indentadas */}
                {replies.length > 0 && (
                  <div className="pl-6 md:pl-10 space-y-4 border-l border-zinc-850 ml-4 md:ml-4">
                    {replies.map((reply) => (
                      <div key={reply.id} className="flex gap-3 relative">
                        {/* Ícone de conexão visual */}
                        <CornerDownRight className="absolute -left-6 md:-left-8 top-1 h-3.5 w-3.5 text-zinc-700" />

                        {/* Avatar Resposta */}
                        <div className="shrink-0">
                          {reply.user.image ? (
                            <img
                              src={reply.user.image}
                              alt={reply.user.name || ""}
                              className="h-6 w-6 rounded-full border border-zinc-800 object-cover"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                              <User className="h-3 w-3" />
                            </div>
                          )}
                        </div>

                        {/* Conteúdo Resposta */}
                        <div className="flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-white">
                              {reply.user.name || "Staff"}
                            </span>
                            {getRoleBadge(reply.user.role)}
                            <span className="text-[9px] text-zinc-500 font-medium">
                              {formatDate(reply.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs md:text-sm text-zinc-300 whitespace-pre-line leading-relaxed">
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Caixa de Texto para Escrever Resposta (Apenas quando selecionado) */}
                {isReplying && (
                  <form
                    onSubmit={(e) => handleCreateReply(e, comment.id)}
                    className="pl-6 md:pl-10 mt-3 space-y-2 border-l border-zinc-850 ml-4 md:ml-4 relative"
                  >
                    <CornerDownRight className="absolute -left-6 md:-left-8 top-2 h-3.5 w-3.5 text-zinc-700" />
                    <div className="bg-zinc-900 border border-zinc-850 p-3 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                          Escrever Resposta (Staff)
                        </span>
                        <button
                          type="button"
                          onClick={() => setReplyingToId(null)}
                          className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"
                          title="Cancelar"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Escreva a resposta administrativa aqui..."
                        rows={2}
                        required
                        className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-zinc-700 resize-none transition-colors"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={replySubmitLoading || !replyContent.trim()}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-bold rounded-lg text-[10px] flex items-center gap-1 transition-all"
                        >
                          {replySubmitLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Send className="h-3 w-3" />
                          )}
                          Enviar Resposta
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
