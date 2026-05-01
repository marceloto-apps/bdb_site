import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { mudarStatusSchema } from '@/lib/validations/artigos'
import { sendEmail } from '@/lib/email/brevo'
import { cmsNotificationTemplate } from '@/lib/email/templates/cms-notification'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!dbUser) {
      return NextResponse.json({ error: 'Sessão inválida ou usuário não existe no banco. Faça logout e login novamente.' }, { status: 401 })
    }

    const { id } = params
    const artigo = await prisma.article.findUnique({
      where: { id },
      include: { author: { select: { name: true, email: true } } }
    })

    if (!artigo) {
      return NextResponse.json({ error: 'Artigo não encontrado' }, { status: 404 })
    }

    const body = await req.json()
    const parsed = mudarStatusSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', fields: parsed.error.format() }, { status: 400 })
    }

    const role = session.user.role as string
    const novoStatus = parsed.data.status
    const statusAtual = artigo.status

    if (novoStatus === statusAtual) {
      return NextResponse.json({ data: artigo }) // Nada a mudar
    }

    // Regras de transição
    let permitida = false
    if (statusAtual === 'RASCUNHO' && novoStatus === 'REVISAO') {
      permitida = (role === 'AUTOR' && artigo.authorId === session.user.id) || role === 'EDITOR' || role === 'ADMIN'
    } else if (statusAtual === 'REVISAO' && novoStatus === 'RASCUNHO') {
      permitida = ['EDITOR', 'ADMIN'].includes(role)
    } else if (statusAtual === 'REVISAO' && novoStatus === 'PUBLICADO') {
      permitida = ['EDITOR', 'ADMIN'].includes(role)
    } else if (statusAtual === 'PUBLICADO' && novoStatus === 'RASCUNHO') {
      permitida = ['EDITOR', 'ADMIN'].includes(role)
    } else if (statusAtual === 'RASCUNHO' && novoStatus === 'PUBLICADO') {
       // Opcional, alguns fluxos permitem ADMIN pular direto
      permitida = ['EDITOR', 'ADMIN'].includes(role)
    }

    if (!permitida) {
      return NextResponse.json({ error: 'Transição não permitida para o seu cargo' }, { status: 403 })
    }

    let publishedAt = artigo.publishedAt
    if (novoStatus === 'PUBLICADO' && statusAtual !== 'PUBLICADO') {
      publishedAt = new Date()
    } else if (statusAtual === 'PUBLICADO' && novoStatus === 'RASCUNHO') {
      publishedAt = null
    }

    // Usando transaction para garantir a consistência
    const [atualizado] = await prisma.$transaction([
      prisma.article.update({
        where: { id },
        data: { status: novoStatus, publishedAt }
      }),
      prisma.articleRevision.create({
        data: {
          articleId: id,
          editorId: session.user.id,
          fromStatus: statusAtual,
          toStatus: novoStatus,
          note: parsed.data.note || null,
        }
      })
    ])

    // Lógica de envio de e-mails
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    if (novoStatus === 'REVISAO') {
      // Disparar para Editores e Admins
      const revisores = await prisma.user.findMany({
        where: { role: { in: [Role.EDITOR, Role.ADMIN] } },
        select: { email: true, name: true },
      })
      
      for (const rev of revisores) {
        if (!rev.email) continue
        const { subject, htmlContent } = cmsNotificationTemplate({
          recipientName: rev.name || 'Revisor',
          articleTitle: artigo.title,
          oldStatus: statusAtual,
          newStatus: novoStatus,
          articleUrl: `${baseUrl}/cms/${artigo.id}`
        })
        await sendEmail({ to: { email: rev.email, name: rev.name || undefined }, subject, htmlContent })
      }
    } else if (novoStatus === 'RASCUNHO' && statusAtual === 'REVISAO') {
      // Disparar para o autor
      if (artigo.author.email) {
        const { subject, htmlContent } = cmsNotificationTemplate({
          recipientName: artigo.author.name || 'Autor',
          articleTitle: artigo.title,
          oldStatus: statusAtual,
          newStatus: novoStatus,
          articleUrl: `${baseUrl}/cms/${artigo.id}`
        })
        await sendEmail({ to: { email: artigo.author.email, name: artigo.author.name || undefined }, subject, htmlContent })
      }
    } else if (novoStatus === 'PUBLICADO') {
       if (artigo.author.email) {
        const { subject, htmlContent } = cmsNotificationTemplate({
          recipientName: artigo.author.name || 'Autor',
          articleTitle: artigo.title,
          oldStatus: statusAtual,
          newStatus: novoStatus,
          articleUrl: `${baseUrl}/artigos/${artigo.slug}`
        })
        await sendEmail({ to: { email: artigo.author.email, name: artigo.author.name || undefined }, subject, htmlContent })
      }
    }

    return NextResponse.json({ data: atualizado })
  } catch (error: unknown) {
    console.error('[PATCH /api/artigos/[id]/status]', error)
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
