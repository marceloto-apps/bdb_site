import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

// Roles com acesso ao CMS
const ROLES_CMS = ['AUTOR', 'REVISOR', 'EDITOR', 'ADMIN']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // --- Rotas do Dashboard: exigem autenticação ---
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  // --- Rotas do CMS: exigem autenticação + role específico ---
  if (pathname.startsWith('/cms')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    if (!ROLES_CMS.includes(session.user.role)) {
      // Membro comum não acessa o CMS — redireciona ao dashboard
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // --- APIs protegidas: artigos (POST/PATCH/DELETE) ---
  if (pathname.startsWith('/api/artigos')) {
    const method = req.method
    if (['POST', 'PATCH', 'DELETE'].includes(method)) {
      if (!session) {
        return NextResponse.json(
          { error: 'UNAUTHORIZED', message: 'Autenticação necessária' },
          { status: 401 }
        )
      }
      if (!ROLES_CMS.includes(session.user.role)) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'Sem permissão para esta ação' },
          { status: 403 }
        )
      }
    }
  }

  // --- APIs protegidas da Fase 2, do Bolão, de Cursos/Aulas e de Backtest ---
  if (
    pathname.startsWith('/api/ligas') ||
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/api/bolao') ||
    pathname.startsWith('/api/aulas') ||
    pathname.startsWith('/api/backtest') ||
    pathname.startsWith('/api/laboratorio')
  ) {
    if (!session) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Autenticação necessária' },
        { status: 401 }
      )
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/cms/:path*',
    '/api/artigos/:path*',
    '/api/ligas/:path*',
    '/api/admin/:path*',
    '/api/bolao/:path*',
    '/api/aulas/:path*',
    '/api/backtest/:path*',
    '/api/laboratorio/:path*',
  ],
}

