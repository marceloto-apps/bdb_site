# SPECS

# SPECS.md — Big Data Bet

> **Versão:** 2.3 | **Atualizado:** 03/05/2026
> **Referências:** PRD v1.5 · SCHEMA.md v2.2
> **Escopo:** Fase 1 concluída, Fase 2 mapeada, Fase 3 especificada — especificações técnicas por item para implementação pelo agente
> 

---

## Convenções Gerais

- Toda rota de API retorna `{ data, error, message }` como envelope padrão
- Erros de validação Zod retornam HTTP `400` com `{ error: "VALIDATION_ERROR", fields: [...] }`
- Erros de autenticação retornam HTTP `401`
- Erros de autorização retornam HTTP `403`
- Erros de recurso não encontrado retornam HTTP `404`
- Erros internos retornam HTTP `500` com log (nunca expor stack trace ao cliente)
- Todos os inputs de API são validados com Zod antes de qualquer operação Prisma
- Datas sempre em ISO 8601 UTC nas respostas de API

---

## 1B — Setup do Projeto

### Comandos de Inicialização

```bash
# Criar projeto
npx create-next-app@14 bigdatabet \\
  --typescript \\
  --tailwind \\
  --app \\
  --src-dir=false \\
  --import-alias="@/*"

# Instalar shadcn/ui
npx shadcn-ui@latest init

# Componentes shadcn necessários na Fase 1
npx shadcn-ui@latest add button card input label
  textarea badge avatar dropdown-menu
  navigation-menu sheet tabs toast
  dialog alert-dialog separator skeleton
  form select checkbox
```

### Configuração Tailwind

```tsx
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0d0d0d',
        surface:    '#1f2937',
        border:     '#374151',
        primary: {
          DEFAULT: '#22c55e',
          dark:    '#16a34a',
        },
        text: {
          primary:   '#ffffff',
          secondary: '#e5e7eb',
          muted:     '#6b7280',
        },
        data: {
          blue:   '#3b82f6',
          yellow: '#eab308',
          red:    '#ef4444',
        },
      },
      fontFamily: {
        sans:  ['Inter', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
        mono:  ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

### Fontes (layout.tsx root)

```tsx
// app/layout.tsx
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})
```

### Variáveis CSS (globals.css)

```css
/* app/globals.css */
@layer base {
  :root {
    --background: 0 0% 5%;
    --foreground: 0 0% 100%;
    --card: 217 19% 17%;
    --card-foreground: 0 0% 100%;
    --primary: 142 71% 45%;
    --primary-foreground: 0 0% 100%;
    --muted: 217 10% 25%;
    --muted-foreground: 220 9% 46%;
    --border: 215 14% 22%;
    --input: 215 14% 22%;
    --ring: 142 71% 45%;
    --radius: 0.5rem;
  }
}

* { @apply border-border; }
body { @apply bg-background text-text-primary font-sans; }
```

### .env.example

```bash
# Banco de dados
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE"

# NextAuth
NEXTAUTH_SECRET="gerar-com-openssl-rand-base64-32"
NEXTAUTH_URL="<http://localhost:3000>"

# OAuth Google
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Brevo
BREVO_API_KEY=""
BREVO_SENDER_EMAIL="contato@bigdatabet.com.br"
BREVO_SENDER_NAME="Big Data Bet"

# Posthog
NEXT_PUBLIC_POSTHOG_KEY=""
NEXT_PUBLIC_POSTHOG_HOST="<https://app.posthog.com>"

# Seed
SEED_ADMIN_PASSWORD=""

# TheStatsAPI
THESTATSAPI_KEY=""
THESTATSAPI_BASE_URL="https://api.thestatsapi.com/api/football"
THESTATSAPI_RATE_LIMIT="30"           # requests por minuto
THESTATSAPI_MONTHLY_QUOTA="100000"    # requests por mês
```

### Checklist de Validação do Setup

```
[ ] next dev roda sem erros
[ ] Tailwind aplicando cores customizadas
[ ] shadcn/ui renderizando em dark mode
[ ] Fontes carregando (inspecionar network)
[ ] .env.example documentado e .env no .gitignore
[ ] ESLint sem warnings no projeto limpo
[ ] Branch main protegida no GitHub
[ ] Preview deploy Vercel ativo em develop
```

---

## 1C — Banco de Dados + Prisma

### Conexão e Configuração

```tsx
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

// Singleton para evitar múltiplas instâncias em dev (hot reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

### Comandos de Migration

```bash
# Criar migration inicial
npx prisma migrate dev --name init

# Aplicar em produção
npx prisma migrate deploy

# Rodar seed
npx prisma db seed

# Visualizar dados
npx prisma studio
```

### Seed Completo

```tsx
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Categorias padrão
  const categorias = [
    { name: 'Estatística',      slug: 'estatistica' },
    { name: 'Mercados',         slug: 'mercados' },
    { name: 'Futebol',          slug: 'futebol' },
    { name: 'Metodologia',      slug: 'metodologia' },
    { name: 'Análise de Dados', slug: 'analise-de-dados' },
  ]

  for (const cat of categorias) {
    await prisma.category.upsert({
      where:  { slug: cat.slug },
      update: {},
      create: cat,
    })
  }

  // Usuário admin inicial
  const senhaHash = await bcrypt.hash(
    process.env.SEED_ADMIN_PASSWORD!,
    12
  )

  await prisma.user.upsert({
    where:  { email: 'admin@bigdatabet.com.br' },
    update: {},
    create: {
      name:     'Admin BDB',
      email:    'admin@bigdatabet.com.br',
      password: senhaHash,
      role:     'ADMIN',
    },
  })

  console.log('✅ Seed concluído')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

### package.json — Adicionar script de seed

```json
"prisma": {
  "seed": "ts-node --compiler-options {\\"module\\":\\"CommonJS\\"} prisma/seed.ts"
}
```

### Checklist de Validação

```
[ ] DATABASE_URL conectando sem erro
[ ] npx prisma migrate dev roda sem conflito com tabelas legadas
[ ] npx prisma db seed cria admin e categorias
[ ] npx prisma studio exibe todos os modelos
[ ] Nenhuma tabela legada alterada ou removida
```

---

## 1D — Autenticação (NextAuth v5)

### Configuração Principal

```tsx
// lib/auth.ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { loginSchema } from '@/lib/validations/auth'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn:  '/login',
    error:   '/login',
  },
  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      async authorize(credentials) {
        // Valida com Zod
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })

        if (!user || !user.password) return null

        const senhaValida = await bcrypt.compare(
          parsed.data.password,
          user.password
        )
        if (!senhaValida) return null

        return user
      },
    }),
  ],
  callbacks: {
    // Injeta id e role no token JWT
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id
        token.role = (user as any).role
      }
      return token
    },
    // Injeta id e role na sessão
    async session({ session, token }) {
      if (token) {
        session.user.id   = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
})
```

### Extensão de Tipos NextAuth

```tsx
// types/next-auth.d.ts
import { Role } from '@prisma/client'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id:   string
      role: Role
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id:   string
    role: Role
  }
}
```

### Schemas de Validação (Zod)

```tsx
// lib/validations/auth.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

export const cadastroSchema = z.object({
  name:            z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email:           z.string().email('Email inválido'),
  password:        z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  confirmPassword: z.string(),
  newsletterOptIn: z.boolean().default(false),
}).refine(
  (data) => data.password === data.confirmPassword,
  { message: 'Senhas não coincidem', path: ['confirmPassword'] }
)

export type LoginInput    = z.infer<typeof loginSchema>
export type CadastroInput = z.infer<typeof cadastroSchema>
```

### Rota de Cadastro (API)

```
POST /api/usuarios
Body: { name, email, password, confirmPassword, newsletterOptIn }

Fluxo:
1. Validar com cadastroSchema (Zod)
2. Verificar se email já existe → 409 CONFLICT
3. Hash bcrypt (rounds: 12)
4. prisma.user.create com role: MEMBRO
5. Disparar email T1 (Boas-vindas) via Brevo
6. Retornar { data: { id, email, name } } → 201
```

### Middleware de Proteção de Rotas

```tsx
// middleware.ts
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas que exigem autenticação
const ROTAS_AUTENTICADAS = ['/dashboard']

// Rotas que exigem roles específicos
const ROTAS_CMS = ['/cms']
const ROLES_CMS = ['AUTOR', 'REVISOR', 'EDITOR', 'ADMIN']

export default auth((req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl
  const session      = req.auth

  // Verificar rotas autenticadas
  const precisaAuth = ROTAS_AUTENTICADAS.some(r => pathname.startsWith(r))
  if (precisaAuth && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Verificar rotas CMS
  const precisaCMS = ROTAS_CMS.some(r => pathname.startsWith(r))
  if (precisaCMS) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    if (!ROLES_CMS.includes(session.user.role)) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/dashboard/:path*', '/cms/:path*', '/api/artigos/:path*'],
}
```

### Rotas de API Auth

```
app/api/auth/[...nextauth]/route.ts  → handlers NextAuth (GET + POST)
app/api/usuarios/route.ts           → POST cadastro
```

### Checklist de Validação

```
[ ] Login email/senha funciona com usuário do seed
[ ] Login Google redireciona corretamente
[ ] Cadastro cria User com role MEMBRO
[ ] Sessão JWT contém id, email e role
[ ] /dashboard redireciona para /login se não autenticado
[ ] /cms redireciona para /dashboard se role MEMBRO
[ ] Senha nunca retorna em nenhuma resposta de API
[ ] Email de boas-vindas (T1) disparado no cadastro
```

---

## 1E — CMS Interno

### Dependência

```bash
# Único pacote extra justificado: editor Markdown leve sem dependências pesadas
npm install @uiw/react-md-editor
```

### Rotas do CMS

```
/cms                  → listagem de artigos (filtros: status, tipo, autor)
/cms/novo             → criar artigo
/cms/[id]             → editar artigo
```

### Rotas de API do CMS

```
GET    /api/artigos              → listar artigos (com filtros e paginação)
POST   /api/artigos              → criar artigo
GET    /api/artigos/[id]         → buscar artigo por ID
PATCH  /api/artigos/[id]         → atualizar artigo
PATCH  /api/artigos/[id]/status  → mudar status (registra revisão + email)
DELETE /api/artigos/[id]         → deletar artigo (apenas ADMIN)
```

### Schemas de Validação (Zod)

```tsx
// lib/validations/artigos.ts
import { z } from 'zod'
import { ArticleStatus, ArticleType } from '@prisma/client'

export const criarArtigoSchema = z.object({
  title:      z.string().min(3, 'Título obrigatório'),
  slug:       z.string().min(3).regex(/^[a-z0-9-]+$/, 'Slug inválido'),
  excerpt:    z.string().max(300).optional(),
  content:    z.string().min(1, 'Conteúdo obrigatório'),
  thumbnail:  z.string().url().optional().or(z.literal('')),
  type:       z.nativeEnum(ArticleType),
  categoryId: z.string().cuid().optional(),
  tags:       z.array(z.string()).default([]),
})

export const atualizarArtigoSchema = criarArtigoSchema.partial()

export const mudarStatusSchema = z.object({
  status: z.nativeEnum(ArticleStatus),
  note:   z.string().optional(),
}).refine(
  // Nota obrigatória ao devolver para RASCUNHO
  (data) => data.status !== 'RASCUNHO' || (data.note && data.note.length > 0),
  { message: 'Comentário obrigatório ao devolver artigo', path: ['note'] }
)

export type CriarArtigoInput    = z.infer<typeof criarArtigoSchema>
export type AtualizarArtigoInput = z.infer<typeof atualizarArtigoSchema>
export type MudarStatusInput    = z.infer<typeof mudarStatusSchema>
```

### Fluxo: PATCH /api/artigos/[id]/status

```
1. Autenticar sessão → 401 se ausente
2. Validar body com mudarStatusSchema (Zod)
3. Buscar artigo no banco
4. Verificar permissão da transição por role:
   - RASCUNHO → REVISAO:  AUTOR (próprio) | EDITOR | ADMIN
   - REVISAO  → RASCUNHO: REVISOR | EDITOR | ADMIN
   - REVISAO  → PUBLICADO: EDITOR | ADMIN
   - PUBLICADO → RASCUNHO: EDITOR | ADMIN
   Se não permitido → 403
5. prisma.article.update (novo status)
6. Se status === 'PUBLICADO' → setar publishedAt = new Date()
7. Se status === 'RASCUNHO' e era PUBLICADO → setar publishedAt = null
8. prisma.articleRevision.create (fromStatus, toStatus, note, editorId)
9. sendEmail() conforme template mapeado:
   - → REVISAO:   T2 para REVISORES e EDITORES
   - → RASCUNHO:  T3 para o AUTOR
   - → PUBLICADO: T4 para o AUTOR
10. Retornar artigo atualizado → 200
```

### Lógica de Slug Auto-gerado

```tsx
// lib/utils/slug.ts

// Gera slug a partir do título
export function gerarSlug(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9\\s-]/g, '')   // remove especiais
    .trim()
    .replace(/\\s+/g, '-')           // espaços → hífens
    .replace(/-+/g, '-')            // hífens duplos → simples
}

// Valida unicidade consultando banco
export async function slugEstaDisponivel(
  slug: string,
  ignorarId?: string    // usado ao editar (ignora o próprio artigo)
): Promise<boolean> {
  const artigo = await prisma.article.findUnique({ where: { slug } })
  if (!artigo) return true
  return artigo.id === ignorarId
}
```

### Regras de Visibilidade no CMS (Listagem)

```
AUTOR   → WHERE authorId = session.user.id
REVISOR → WHERE status = REVISAO
EDITOR  → todos os artigos
ADMIN   → todos os artigos
```

### Componentes CMS

| Componente | Localização | Responsabilidade |
| --- | --- | --- |
| `ArtigoEditor` | `components/artigos/ArtigoEditor.tsx` | Form completo com MDEditor |
| `ArtigoCard` | `components/artigos/ArtigoCard.tsx` | Card da listagem CMS |
| `ArtigoListagem` | `components/artigos/ArtigoListagem.tsx` | Tabela com filtros |
| `StatusBadge` | `components/artigos/StatusBadge.tsx` | Badge colorido por status |
| `MudarStatusDialog` | `components/artigos/MudarStatusDialog.tsx` | Dialog de confirmação + nota |
| `TagInput` | `components/artigos/TagInput.tsx` | Input com autocomplete de tags |

### Checklist de Validação

```
[ ] Criar artigo salva com status RASCUNHO
[ ] Slug gerado automaticamente, editável, validado como único
[ ] Markdown renderiza corretamente no editor e na preview
[ ] Transições de status respeitam permissões por role
[ ] ArticleRevision criado a cada mudança de status
[ ] Nota obrigatória ao devolver para RASCUNHO
[ ] publishedAt preenchido ao publicar e zerado ao despublicar
[ ] AUTOR vê apenas seus artigos na listagem
[ ] Email disparado corretamente em cada transição
```

---

## 1G — Email (Brevo)

### Helper Principal

```tsx
// lib/brevo.ts
import * as brevo from '@getbrevo/brevo'

// Inicializa client com API key
const apiInstance = new brevo.TransactionalEmailsApi()
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY!
)

interface SendEmailParams {
  to:         { email: string; name?: string }
  templateId: number
  params:     Record<string, string | number>
}

// Helper genérico — todos os emails passam por aqui
export async function sendEmail({
  to,
  templateId,
  params,
}: SendEmailParams): Promise<void> {
  const email = new brevo.SendSmtpEmail()

  email.to         = [to]
  email.templateId = templateId
  email.params     = params
  email.sender     = {
    email: process.env.BREVO_SENDER_EMAIL!,
    name:  process.env.BREVO_SENDER_NAME!,
  }

  try {
    await apiInstance.sendTransacEmail(email)
  } catch (err) {
    // Log do erro mas não quebra o fluxo principal
    console.error('[Brevo] Erro ao enviar email:', err)
  }
}
```

### IDs de Templates e Parâmetros

```tsx
// lib/brevo-templates.ts

export const TEMPLATES = {
  BOAS_VINDAS:        1,  // T1
  ARTIGO_EM_REVISAO:  2,  // T2
  ARTIGO_DEVOLVIDO:   3,  // T3
  ARTIGO_PUBLICADO:   4,  // T4
} as const

// T1 — Boas-vindas
// Params: { NOME, EMAIL }

// T2 — Artigo em revisão
// Params: { NOME_REVISOR, TITULO_ARTIGO, AUTOR_ARTIGO, LINK_CMS }

// T3 — Artigo devolvido
// Params: { NOME_AUTOR, TITULO_ARTIGO, COMENTARIO, LINK_CMS }

// T4 — Artigo publicado
// Params: { NOME_AUTOR, TITULO_ARTIGO, LINK_ARTIGO }
```

### Disparo de T2 (Múltiplos Destinatários)

```tsx
// Para T2, busca todos os REVISORES e EDITORES ativos e envia individualmente
const revisores = await prisma.user.findMany({
  where: { role: { in: ['REVISOR', 'EDITOR', 'ADMIN'] } },
  select: { email: true, name: true },
})

for (const revisor of revisores) {
  await sendEmail({
    to:         { email: revisor.email, name: revisor.name ?? '' },
    templateId: TEMPLATES.ARTIGO_EM_REVISAO,
    params: {
      NOME_REVISOR:   revisor.name ?? 'Revisor',
      TITULO_ARTIGO:  artigo.title,
      AUTOR_ARTIGO:   artigo.author.name ?? '',
      LINK_CMS:       `${process.env.NEXTAUTH_URL}/cms/${artigo.id}`,
    },
  })
}
```

### Checklist de Validação

```
[ ] sendEmail não quebra o fluxo se Brevo retornar erro
[ ] T1 disparado no cadastro
[ ] T2 disparado para todos revisores/editores ao enviar para revisão
[ ] T3 disparado para o autor ao devolver
[ ] T4 disparado para o autor ao publicar
[ ] Templates criados no painel Brevo com identidade BDB
[ ] Limite de 300 emails/dia monitorado
```

---

## 1H — Analytics (Posthog)

### Provider (Client Component)

### Provider (Client Component com Suspense)

```tsx
// lib/posthog/provider.tsx
'use client'

import React, { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { getPosthogClient } from './client'
import { trackPageView } from './events'

// Rastreador isolado para não suspender a aplicação inteira
function PosthogPageTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname) {
      const url = searchParams?.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname
      trackPageView(window.location.origin + url, document.referrer)
    }
  }, [pathname, searchParams])

  return null
}

export function PosthogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    getPosthogClient()
  }, [])

  return (
    <>
      <Suspense fallback={null}>
        <PosthogPageTracker />
      </Suspense>
      {children}
    </>
  )
}
```

### Configuração Reverse Proxy

Para contornar adblockers e DNS filters, o Next.js deve rotear `ingest/*` para `us.i.posthog.com`:

```javascript
// next.config.mjs
const nextConfig = {
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ]
  },
}
export default nextConfig
```

### Identify e Reset

```tsx
// lib/posthog.ts

// Chamar após login bem-sucedido
export function identifyUser(id: string, role: string, email: string) {
  if (typeof window === 'undefined') return
  import('posthog-js').then(({ default: posthog }) => {
    posthog.identify(id, { role, email })
  })
}

// Chamar no logout
export function resetPosthog() {
  if (typeof window === 'undefined') return
  import('posthog-js').then(({ default: posthog }) => {
    posthog.reset()
  })
}
```

### Mapa de Eventos

| Evento | Onde disparar | Propriedades |
| --- | --- | --- |
| `user_signed_up` | `POST /api/usuarios` (sucesso) | `method: 'email'` |
| `user_signed_up` | Callback OAuth Google | `method: 'google'` |
| `user_logged_in` | Callback `jwt` NextAuth | `method: 'email' \| 'google'` |
| `article_viewed` | `GET /artigos/[slug]` | `slug, type, category` |
| `article_favorited` | `POST /api/favoritos` | `slug, type` |
| `cms_article_created` | `POST /api/artigos` (sucesso) | `type` |
| `cms_status_changed` | `PATCH /api/artigos/[id]/status` | `from, to, articleId` |

### Checklist de Validação

```
[ ] PHProvider no layout.tsx root sem SSR
[ ] Pageview capturado a cada mudança de rota
[ ] identify chamado após login
[ ] reset chamado após logout
[ ] Eventos aparecendo no painel Posthog
[ ] Sem dados sensíveis (senha, token) enviados ao Posthog
```

---

## 1I — Páginas Públicas

### SEO — Funções Reutilizáveis

```tsx
// lib/seo.ts
import { Metadata } from 'next'

const BASE_URL = '<https://bigdatabet.com.br>'

// Metadata base (herdada por todas as páginas)
export const metadataBase: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default:  'Big Data Bet — Análise Esportiva Baseada em Dados',
    template: '%s | Big Data Bet',
  },
  description: 'Plataforma brasileira de análise esportiva e estatísticas para apostas inteligentes.',
  openGraph: {
    siteName: 'Big Data Bet',
    locale:   'pt_BR',
    type:     'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

// Metadata dinâmica para artigos
export function gerarMetadataArtigo(artigo: {
  title:     string
  excerpt:   string | null
  slug:      string
  thumbnail: string | null
  type:      'ESTUDO' | 'ANALISE'
}): Metadata {
  const url   = `${BASE_URL}/artigos/${artigo.slug}`

  return {
    title:       artigo.title,
    description: artigo.excerpt ?? '',
    alternates:  { canonical: url },
    openGraph: {
      title:       artigo.title,
      description: artigo.excerpt ?? '',
      url,
      type:        'article',
      images:      artigo.thumbnail ? [artigo.thumbnail] : [],
    },
  }
}
```

### Sitemap

```tsx
// app/sitemap.ts
import { prisma } from '@/lib/prisma'
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE = '<https://bigdatabet.com.br>'

  // Páginas estáticas
  const estaticas = ['', '/sobre', '/comunidade', '/planos'].map((path) => ({
    url:          `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority:     path === '' ? 1 : 0.8,
  }))

  // Artigos publicados
  const artigos = await prisma.article.findMany({
    where:  { status: 'PUBLICADO' },
    select: { slug: true, type: true, updatedAt: true },
  })

  const artigosMap = artigos.map((a) => ({
    url:          `${BASE}/artigos/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: 'weekly' as const,
    priority:     0.7,
  }))

  return [...estaticas, ...artigosMap]
}
```

### Robots.txt

```tsx
// app/robots.ts
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow:     '/',
      disallow:  ['/cms/', '/dashboard/', '/api/'],
    },
    sitemap: '<https://bigdatabet.com.br/sitemap.xml>',
  }
}
```

### Especificações por Página

### `/` — Home

```
Seções (ordem):
1. Hero
   - Headline: tipografia display (Plus Jakarta Sans)
   - Subheadline: benefício em 1 linha
   - CTA primário: Button variant="default" → /cadastro
   - CTA secundário: Button variant="outline" → /planos

2. Métricas da Comunidade
   - 3 cards: Telegram (1.600) · YouTube (2.800) · Instagram (819)
   - Ícones dos canais

3. Proposta de Valor
   - 3 pilares: Dados · Estatística · Transparência
   - Layout: grid 3 colunas (mobile: 1 coluna)

4. Preview de Planos
   - 4 cards estáticos: Free · Básico · Pro · Premium
   - Badge "Em breve" nos planos pagos
   - CTA: "Cadastre-se grátis" (apenas Free funcional)

5. Últimos Artigos
   - Query: 3 artigos mais recentes (status: PUBLICADO)
   - Componente ArtigoCardPublico
   - Link "Ver todos os artigos"

6. CTA Final
   - Fundo verde primary
   - "Comece agora gratuitamente"
   - Button → /cadastro
```

### `/planos`

```
- Tabela comparativa: 4 colunas (Free · Básico · Pro · Premium)
- Linha por feature com ✅ / ❌ / texto
- Preços dos planos pagos exibidos mas sem checkout
- Badge "Em breve" em planos pagos
- CTA Free: botão → /cadastro
- CTA pagos: texto "Em breve"
```

### `/artigos`

```
Query params aceitos:
- ?categoria=slug
- ?tag=slug
- ?busca=texto
- ?pagina=N (default: 1)

Paginação:
- 20 artigos por página
- Componente Pagination (shadcn)

Query Prisma:
WHERE status = 'PUBLICADO'
  AND type   = 'ESTUDO' | 'ANALISE'
  AND (categoryId = ? se filtro ativo)
  AND (tags.some slug = ? se filtro ativo)
  AND (title CONTAINS ? se busca ativa)
ORDER BY publishedAt DESC
```

### `/artigos/[slug]`

```
Dados carregados (Server Component):
- Artigo completo com author, category, tags
- Artigo anterior e próximo (publishedAt próximo)

Comportamentos:
- Slug não encontrado ou status ≠ PUBLICADO → notFound()
- Usuário autenticado → registra ReadHistory via API
- Botão favoritar:
  - Não logado → redireciona para /login
  - Logado → toggle via POST/DELETE /api/favoritos
- Share buttons: Web Share API com fallback para links diretos
```

### Checklist de Validação

```
[ ] Home carrega em < 2s (Vercel Edge)
[ ] Metadata correto em todas as páginas institucionais
[ ] generateMetadata dinâmico funcionando em [slug]
[ ] Open Graph testado com og:debugger do Facebook
[ ] sitemap.xml acessível e válido
[ ] robots.txt bloqueando /cms e /dashboard
[ ] Listagens exibem apenas artigos PUBLICADOS
[ ] Paginação funcionando com query params
[ ] Filtros por categoria e tag funcionando
[ ] notFound() disparado para slug inválido
[ ] ReadHistory registrado ao abrir artigo (usuário logado)
```

---

## 1J — Dashboard (Área do Membro)

### Layout

```tsx
// Estrutura do layout autenticado
app/(dashboard)/layout.tsx

// Desktop: sidebar fixa à esquerda (240px) + conteúdo à direita
// Mobile:  bottom navigation bar (4 ícones)
// Header:  logo + nome do usuário + badge de role + botão sair

// Itens de navegação:
[
  { label: 'Visão Geral',  href: '/dashboard',             icon: LayoutDashboard },
  { label: 'Perfil',       href: '/dashboard/perfil',      icon: User },
  { label: 'Histórico',    href: '/dashboard/historico',   icon: Clock },
  { label: 'Favoritos',    href: '/dashboard/favoritos',   icon: Bookmark },
]
```

### Rotas de API do Dashboard

```
GET  /api/favoritos              → listar favoritos do usuário logado
POST /api/favoritos              → { articleId } → favoritar artigo
DELETE /api/favoritos/[id]       → desfavoritar

GET  /api/historico              → últimos 30 registros do usuário logado

PATCH /api/usuarios/perfil       → { name, image } → atualizar perfil
PATCH /api/usuarios/senha        → { currentPassword, newPassword } → trocar senha
```

### Schemas de Validação (Zod)

```tsx
// lib/validations/usuario.ts
import { z } from 'zod'

export const atualizarPerfilSchema = z.object({
  name:  z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  image: z.string().url('URL inválida').optional().or(z.literal('')),
})

export const trocarSenhaSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual obrigatória'),
  newPassword:     z.string().min(8, 'Nova senha deve ter pelo menos 8 caracteres'),
  confirmPassword: z.string(),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  { message: 'Senhas não coincidem', path: ['confirmPassword'] }
)
```

### Especificações por Página

### `/dashboard` — Visão Geral

```
Seções:
1. Saudação: "Olá, [nome]" + badge de role
2. Últimas leituras: últimos 5 artigos do ReadHistory
3. Favoritos recentes: últimos 4 artigos favoritados
4. Atalhos rápidos:
   - "Ver todos os artigos" → /artigos
   - Se role AUTOR+: "Criar artigo" → /cms/novo
```

### `/dashboard/perfil`

```
Formulário:
- Avatar: exibe imagem atual + campo URL ou upload
- Nome: input text
- Email: exibido, não editável
- Role: exibido como Badge, não editável
- Botão salvar → PATCH /api/usuarios/perfil

Seção separada — Trocar Senha:
- Senha atual (input password)
- Nova senha (input password)
- Confirmar nova senha (input password)
- Botão salvar → PATCH /api/usuarios/senha
- Feedback: Toast de sucesso ou erro
```

### `/dashboard/historico`

```
Query: últimos 30 ReadHistory do usuário, ordenados por readAt DESC
Exibe: thumbnail, título, tipo, data de leitura
Sem paginação (limite fixo de 30)
```

### `/dashboard/favoritos`

```
Query: todos os Favorites do usuário, ordenados por createdAt DESC
Exibe: thumbnail, título, tipo, data em que favoritou
Botão "Remover" → DELETE /api/favoritos/[id]
Feedback de remoção com atualização otimista da UI
```

### Checklist de Validação

```
[x] /dashboard redireciona para /login se não autenticado
[x] Badge de role visível no header
[x] Layout responsivo (sidebar desktop, bottom nav mobile)
[x] Perfil atualiza name e image sem recarregar página
[x] Troca de senha valida senha atual antes de salvar
[x] Histórico exibe últimas 30 leituras
[x] Favoritar/desfavoritar atualiza UI de forma otimista
[x] Atalho "Criar artigo" visível apenas para AUTOR+
```

---

## 1K — Deploy + Domínio

### Checklist de Deploy

```
Vercel:
[ ] Projeto conectado ao repositório GitHub
[ ] Build command: next build (padrão)
[ ] Output: automático (App Router)
[ ] Todas as env vars configuradas em Production e Preview
[ ] Domínio bigdatabet.com.br adicionado no Vercel
[ ] SSL ativo (automático)
[ ] Deploy automático em push para main

Hostgator MySQL:
[ ] Usuário do banco com permissão de conexão externa
[ ] IPs Vercel liberados no firewall do Hostgator
  → IPs atuais: <https://vercel.com/docs/edge-network/regions>
[ ] DATABASE_URL testada via prisma db pull em produção

Pós-deploy:
[ ] npx prisma migrate deploy executado
[ ] npx prisma db seed executado (apenas 1x)
[ ] Todas as rotas principais retornando 200
[ ] Login funcional em produção
[ ] Email de boas-vindas disparado em produção
[ ] Posthog recebendo eventos de produção
```

### Variáveis no Vercel — Mapeamento Final

| Variável | Ambiente |
| --- | --- |
| `DATABASE_URL` | Production + Preview |
| `NEXTAUTH_SECRET` | Production + Preview |
| `NEXTAUTH_URL` | Production (`https://bigdatabet.com.br`) |
| `GOOGLE_CLIENT_ID` | Production + Preview |
| `GOOGLE_CLIENT_SECRET` | Production + Preview |
| `BREVO_API_KEY` | Production + Preview |
| `BREVO_SENDER_EMAIL` | Production + Preview |
| `BREVO_SENDER_NAME` | Production + Preview |
| `NEXT_PUBLIC_POSTHOG_KEY` | Production + Preview |
| `NEXT_PUBLIC_POSTHOG_HOST` | Production + Preview |

> ⚠️ `NEXTAUTH_URL` em Preview deve ser a URL de preview gerada pelo Vercel, não o domínio de produção.
> 

---

## Ordem de Implementação Recomendada

```
Semana 1
  1B → Setup completo + deploy preview Vercel

Semana 2
  1C → Schema Prisma + migrations + seed
  1D → NextAuth (email/senha primeiro, Google depois)

Semana 3
  1G → Brevo (helper + templates)
  1H → Posthog (provider + eventos)

Semana 4
  1E → CMS completo (API + interface)

Semana 5
  1I → Páginas públicas (Home + Sobre + Comunidade + Planos + Listagens + Artigo)
  1J → Dashboard (área do membro)

Semana 6
  1K → Deploy produção + domínio + validação final
```

---

> **Regra para o agente:** Antes de implementar qualquer feature, confirmar que está descrita neste SPECS. Em caso de ambiguidade, perguntar antes de assumir.
>

---

## 2A — Engine de Cálculo Estatístico

### Estrutura de pastas

```
lib/analytics/
├── poisson.ts             # Poisson padrão
├── zero-inflated.ts       # Poisson Zero-Inflacionado (ZIP)
├── negative-binomial.ts   # Binomial Negativa
├── dixon-coles.ts         # Dixon-Coles com tau + decay temporal
├── medias.ts              # médias móveis, DP, CV, custo/peso do gol
├── forca-time.ts          # força ofensiva/defensiva por mando
├── mapa-valor.ts          # ROI por faixa de odds
├── ev-calculator.ts       # odd justa vs mercado, EV%
└── index.ts               # API pública unificada
```

### Contrato de API

```typescript
type ModeloEstatistico = 'POISSON' | 'ZIP' | 'NB' | 'DIXON_COLES'

interface MediasTime {
  golsMarcados:   number
  golsSofridos:   number
  pontos:         number
  pesoGol:        number   // peso médio do gol (replica DASH)
  custoGol:       number   // custo médio do gol (replica DASH)
}

interface MediasLiga {
  mediaGolsCasa:  number
  mediaGolsVis:   number
  mediaGolsTotal: number
}

interface ForcaTime {
  ataque: number   // alpha — força ofensiva
  defesa: number   // beta  — força defensiva
}

interface PrevisaoConfronto {
  modelo:  ModeloEstatistico

  medias: {
    home: MediasTime
    away: MediasTime
    liga: MediasLiga
  }

  forcas: {
    home: ForcaTime
    away: ForcaTime
    homeAdvantage: number   // gamma — vantagem de mando
  }

  lambdas: {
    home: number   // gols esperados do mandante
    away: number   // gols esperados do visitante
  }

  matrizPlacares: number[][]   // grid 11x11 com probabilidades

  mercados: {
    home:       { prob: number; oddJusta: number }
    draw:       { prob: number; oddJusta: number }
    away:       { prob: number; oddJusta: number }
    btts:       { sim: number; nao: number }
    overUnder:  Record<string, { over: number; under: number }>   // 0.5, 1.5, 2.5, 3.5, 4.5
    handicaps:  Array<{ linha: number; home: number; away: number }>
  }

  evPorMercado: Record<string, number>   // EV% calculado vs odds de mercado
}

function calcularPrevisao(
  homeTeamId: string,
  awayTeamId: string,
  modelo: ModeloEstatistico,
  filtros?: {
    ultimasRodadas?: number
    mandoOnly?:      boolean
  }
): Promise<PrevisaoConfronto>
```

## 2B — Ingestão de Dados (Híbrida: API + CSV)

### Estratégia

A TheStatsAPI é a fonte primária de dados. Todo dado buscado na API é imediatamente persistido no MySQL. Requisições subsequentes lêem exclusivamente do banco. O CSV do football-data.co.uk é mantido como fallback para importação offline e validação cruzada.

### Estrutura de pastas

```
lib/ingest/
├── thestatsapi/
│   ├── client.ts          # Client HTTP com auth e rate limiting
│   ├── rate-limiter.ts    # Controle de 30 req/min + quota mensal
│   ├── types.ts           # Tipos das respostas da API
│   ├── mappers.ts         # Conversão API response → Prisma models
│   └── endpoints.ts       # Funções por endpoint (matches, odds, competitions)
├── football-data/
│   ├── csv-parser.ts      # Parser CSV (mantido do spec anterior)
│   └── column-map.ts      # Mapeamento de colunas por tier
├── sync-engine.ts         # Orquestrador de sincronização
├── team-normalizer.ts     # Normalização de nomes entre fontes
└── index.ts               # API pública
```

### Client TheStatsAPI — `lib/ingest/thestatsapi/client.ts`

```typescript
interface TheStatsApiConfig {
  apiKey: string
  baseUrl: string
  rateLimit: number      // req/min (default: 30)
  monthlyQuota: number   // req/mês (default: 100000)
}

interface ApiResponse<T> {
  data: T
  meta?: { page: number; per_page: number; total: number }
}

/**
 * Client HTTP singleton para TheStatsAPI.
 * - Bearer token via env
 * - Rate limiting automático (30 req/min)
 * - Tracking de quota mensal via ApiQuotaLog
 * - Paginação automática
 * - Retry com backoff em 429
 */
class TheStatsApiClient {
  private queue: Array<() => Promise<void>> = []
  private processing = false
  private requestsThisMinute = 0

  async get<T>(path: string, params?: Record<string, string>): Promise<ApiResponse<T>>
  async getAllPages<T>(path: string, params?: Record<string, string>): Promise<T[]>
  async getQuotaUsage(month?: string): Promise<{ used: number; limit: number; percent: number }>

  private async throttle(): Promise<void>     // espera se 30 req/min atingido
  private async checkQuota(): Promise<void>   // bloqueia se 100k/mês atingido
  private async logRequest(endpoint: string, status: number): Promise<void>
}
```

### Rate Limiter — `lib/ingest/thestatsapi/rate-limiter.ts`

```typescript
/**
 * Token bucket rate limiter.
 * Capacidade: 30 tokens, reposição: 1 token a cada 2 segundos.
 * Se bucket vazio, aguarda até próximo token disponível.
 */
class RateLimiter {
  constructor(private maxTokens: number = 30, private refillRateMs: number = 2000)
  async acquire(): Promise<void>
  getAvailableTokens(): number
}
```

### Endpoints — `lib/ingest/thestatsapi/endpoints.ts`

```typescript
// Endpoints disponíveis e utilizados:

// 1. Listar competições
GET /competitions
// Retorna lista de competições disponíveis

// 2. Buscar partidas de uma competição
GET /matches?competition_id={comp_id}&status=finished&limit=20&page={page}
// Retorna partidas finalizadas com paginação

// 3. Buscar fixtures (próximos jogos)
GET /matches?competition_id={comp_id}&status=scheduled&limit=20
// Retorna jogos agendados

// 4. Buscar odds de uma partida
GET /matches/{match_id}/odds
// Retorna odds de 4 bookmakers × múltiplos mercados

// 5. Buscar estatísticas de uma partida
GET /matches/{match_id}
// Retorna detalhes incluindo stats, xG, eventos
```

### Mappers — `lib/ingest/thestatsapi/mappers.ts`

```typescript
/**
 * Interface exata do Payload recebido da TheStatsAPI
 */
export interface ApiMatch {
  id: string
  utc_date: string      // a API usa utc_date e não date
  home_team: {          // aninhado, não na raiz
    id: string
    name: string
  }
  away_team: {
    id: string
    name: string
  }
  score?: {
    home: number
    away: number
  }
}

/**
 * Converte resposta da API para formato Prisma.
 * Assegura o uso da chave composta externalId_leagueId para Teams
 * e os mapeamentos homeXg/awayXg corretos.
 */
function mapApiMatchToPrisma(apiMatch: ApiMatch, leagueId: string): Prisma.MatchCreateInput

/**
 * Extrai odds de um array de bookmakers.
 * Prioridade: Pinnacle > Bet365 > Betfair > Kambi
 * Preenche campos legados (oddHome, oddDraw, oddAway) com Pinnacle.
 */
function extractOdds(bookmakers: ApiBookmaker[]): OddsFields

/**
 * Converte nome de time da API para nome normalizado.
 * Exemplo: "Athletico Paranaense" → "Athletico-PR"
 */
function normalizeTeamName(apiName: string, leagueSlug: string): string
```

### Sync Engine — `lib/ingest/sync-engine.ts`

```typescript
interface SyncOptions {
  leagueSlug: string
  competitionId: string     // ex: "comp_4795"
  mode: 'full' | 'incremental'
  includeOdds: boolean
  includeFuture: boolean    // buscar fixtures agendados
}

interface SyncResult {
  matchesProcessed: number
  matchesCreated: number
  matchesUpdated: number
  matchesSkipped: number
  oddsUpdated: number
  requestsUsed: number
  errors: string[]
}

/**
 * Orquestra a sincronização de uma liga.
 *
 * Modo FULL:
 * 1. Busca TODAS as partidas da competição (com paginação)
 * 2. Upsert de Teams por externalId
 * 3. Upsert de Matches por externalId
 * 4. Para cada match com odds_available, busca odds
 * 5. Registra MatchImport com estatísticas
 *
 * Modo INCREMENTAL:
 * 1. Busca partidas com data > último syncedAt da liga
 * 2. Upsert apenas novos
 * 3. Busca odds apenas de jogos sem odds no banco
 * 4. Registra MatchImport
 *
 * Estimativa de requests por sync:
 * - Full (380 jogos): ~20 (partidas) + ~380 (odds) = ~400 req
 * - Incremental (10 jogos): ~2 (partidas) + ~10 (odds) = ~12 req
 */
async function syncLeague(options: SyncOptions): Promise<SyncResult>
```

### Rota de API — Sync

```
POST /api/admin/ligas/[slug]/sync
Body: { mode: 'full' | 'incremental', includeOdds: boolean }
Restrição: role ADMIN
Response: SyncResult
```

### Rota de API — Upload CSV (mantida)

```
POST /api/admin/ligas/[slug]/importar
Body: FormData com arquivo CSV
Restrição: role ADMIN
Response: ImportResult
```

Mapeamento de colunas mantido conforme spec anterior (seção 2B original).

### Rota de API — Quota

```
GET /api/admin/quota
Restrição: role ADMIN
Response: { month: string, used: number, limit: number, percent: number, byEndpoint: Record<string, number> }
```

### Normalização de Nomes de Time

```typescript
// lib/ingest/team-normalizer.ts

/**
 * Mapa de aliases para normalizar nomes entre fontes.
 * Chave: nome exato que vem da API ou CSV.
 * Valor: nome canônico usado no banco.
 *
 * Exemplos para Brasileirão:
 * "Athletico Paranaense" → "Athletico-PR"
 * "Atletico Mineiro" → "Atletico-MG"
 * "Red Bull Bragantino" → "Bragantino"
 *
 * Esta tabela é carregada do banco (futuramente editável pelo admin).
 * No MVP, hardcoded para o Brasileirão.
 */
const TEAM_ALIASES: Record<string, string> = { ... }

function normalizeTeamName(rawName: string): string
```

### Validação Cruzada (API vs CSV)

Procedimento manual pelo admin após importar dados de ambas as fontes:

1. Importar Brasileirão A 2026 via API (sync full)
2. Importar mesmo período via CSV do football-data
3. Query de comparação: `SELECT * FROM Match WHERE leagueId = X GROUP BY date, homeTeamId` para detectar duplicatas e divergências
4. Documentar diferenças encontradas (nomes de time, odds, datas)
5. Ajustar tabela de aliases conforme necessário

## 2C — Telas e Componentes

### Rotas
```
/dashboard/ligas                       → grid de ligas (MVP: só Brasileirão A)
/dashboard/ligas/[slug]                → dashboard único da liga
/dashboard/analises                    → placeholder "Análises" (nome provisório) com abas preparadas
/cms/ligas/sync                        → tela de sync via API (ADMIN)
/cms/ligas/importar                    → tela de upload CSV (ADMIN, fallback)
/cms/ligas/quota                       → dashboard de quota da API (ADMIN)
```

### Componentes
| Componente | Localização | Responsabilidade |
|---|---|---|
| `SeletorConfronto` | `components/ligas/SeletorConfronto.tsx` | Dropdown casa/visitante + filtros expandidos |
| `FiltroMes` | `components/ligas/FiltroMes.tsx` | Multi-select meses (JAN..DEZ) |
| `FiltroFaixaOdds` | `components/ligas/FiltroFaixaOdds.tsx` | Seleção por faixa de odds com drag |
| `FiltroRodadas` | `components/ligas/FiltroRodadas.tsx` | Range slider de rodadas |
| `SeletorModelo` | `components/ligas/SeletorModelo.tsx` | Toggle AUTO/MANUAL + seletor de 4 modelos |
| `BadgeModeloAuto` | `components/ligas/BadgeModeloAuto.tsx` | Badge com modelo selecionado + confiança (AIC) |
| `PainelMedias` | `components/ligas/PainelMedias.tsx` | Replicação aba DASH |
| `PainelMatrizPlacares` | `components/ligas/PainelMatrizPlacares.tsx` | Grid 11x11 |
| `PainelMercados` | `components/ligas/PainelMercados.tsx` | 1X2, BTTS, O/U, AH |
| `PainelMapaValor` | `components/ligas/PainelMapaValor.tsx` | ROI por faixa |
| `PainelEvolucao` | `components/ligas/PainelEvolucao.tsx` | Gráfico Recharts |
| `BotaoImportarCSV` | `components/ligas/BotaoImportarCSV.tsx` | Upload CSV (ADMIN) |
| `SyncButton` | `components/ligas/SyncButton.tsx` | Botão de sync com loading + resultado |
| `QuotaDashboard` | `components/ligas/QuotaDashboard.tsx` | Barra de progresso de quota mensal |

## 2C.1 — Seleção Automática de Modelo (AIC)

### Contrato

```typescript
interface ModeloRanking {
  modelo: ModeloEstatistico
  aic: number
  logLikelihood: number
  parametros: number
  confianca: 'ALTA' | 'MEDIA' | 'BAIXA'
}

/**
 * Calcula AIC para cada modelo e retorna ranking ordenado.
 * AIC = -2 × logLikelihood + 2 × k (número de parâmetros)
 *
 * Parâmetros por modelo:
 * - Poisson: k=2 (λH, λA)
 * - ZIP: k=4 (λH, λA, πH, πA)
 * - NB: k=4 (rH, pH, rA, pA)
 * - Dixon-Coles: k=3 (λH, λA, ρ)
 *
 * Confiança:
 * - ALTA: delta AIC entre 1° e 2° > 4
 * - MEDIA: delta AIC entre 1° e 2° entre 2 e 4
 * - BAIXA: delta AIC < 2 (modelos muito próximos)
 */
function rankearModelos(
  jogos: Match[],
  medias: MediasLigaCalculadas
): ModeloRanking[]
```

### Critérios de seleção automática (do protótipo Brasil1)

Além do AIC puro, considerar heurísticas validadas:
- Var/Média > 1.15 **E** freq 0-0 > 8% → Dixon-Coles
- Var/Média > 1.15 **E** freq 0-0 ≤ 8% → Binomial Negativa
- Var/Média ≈ 1.0 → Poisson

## 2D — Validação contra Ground Truth

A planilha `BRA1DASHv261.xlsx` é a fonte de verdade dos cálculos atuais. Toda implementação do modelo Poisson padrão deve ser validada contra os valores das abas DASH e CS dessa planilha. Diferenças aceitáveis: < 0.5% por arredondamento.

Criar arquivo `__tests__/analytics/poisson.test.ts` com casos de teste extraídos da planilha.

## 2E — Bibliotecas Permitidas

Justificativas obrigatórias antes de incluir:

| Lib | Uso | Justificativa |
|---|---|---|
| `papaparse` | Parsing CSV | Padrão de mercado, leve, sem deps |
| *(nenhuma lib nova para a API)* | Client HTTP usa `fetch` nativo do Node 18+ | Sem dependência extra |

---

> SPECS detalhados das Fases 3+ serão escritos sob demanda, conforme cada fase for desbloqueada.

# SPECS — Fase 3: Ferramentas Gratuitas (Migração Gemini)

> **Referências:** PRD v1.4 · Arquivo fonte: `Ferramentas BDB Gemini.txt`
> **Princípio:** Converter código Gemini Canvas → componentes React nativos com design system BDB.
> **Regra:** Nenhum estilo inline do código Gemini deve sobreviver na versão final. Tudo passa pelos tokens Tailwind e componentes shadcn/ui.

---

## Estrutura de Pastas

```
lib/ferramentas/
├── validacao-risco/
│   ├── monte-carlo.ts          # Simulação Monte Carlo (funções puras)
│   ├── estatisticas.ts         # P-value, volume validador, IC
│   └── types.ts                # Interfaces e tipos
├── over-under-linhas/
│   ├── poisson.ts              # Cálculo Poisson para linhas O/U
│   ├── juice.ts                # Extração de juice e fair odds
│   └── types.ts
├── distribuicao/
│   ├── gram-charlier.ts        # PDF com ajuste Gram-Charlier
│   ├── medidas-centrais.ts     # Média, mediana, moda
│   └── types.ts
└── index.ts                    # Re-export público

components/ferramentas/
├── FerramentasGrid.tsx         # Grid da página /dashboard/ferramentas
├── validacao-risco/
│   ├── ValidacaoRiscoTool.tsx  # Client Component principal
│   ├── PainelEntradas.tsx      # Painel lateral de inputs
│   ├── PainelResultados.tsx    # Cards de métricas + gráficos
│   └── CurvasPatrimonio.tsx    # Gráfico Recharts de stress test
├── over-under-linhas/
│   ├── OverUnderLinhasTool.tsx  # Client Component principal
│   ├── InputsReferencia.tsx    # Barra superior de odds de referência
│   └── TabelaLinhas.tsx        # Tabela de linhas calculadas
├── distribuicao/
│   ├── DistribuicaoTool.tsx    # Client Component principal
│   ├── PainelParametros.tsx    # Sliders de μ, σ, skew, curtose
│   └── GraficoCurva.tsx        # Gráfico Recharts da curva
└── EmBreve.tsx                 # Placeholder para ferramenta 4
```

---

## 3A — Ferramenta 1: Validação e Risco (Monte Carlo)

### Descrição
Simulador de risco que roda N cenários de Monte Carlo para avaliar a viabilidade estatística de uma estratégia de apostas. Calcula p-value, volume validador, intervalo de confiança do ROI, probabilidade de lucro, taxa de sobrevivência e drawdown máximo.

### Rota
```
/dashboard/ferramentas/validacao-risco
```

### Inputs (State do Client Component)

| Campo | Tipo | Default | Range/Validação |
|---|---|---|---|
| `banca` | number | 1000 | > 0 |
| `oddsMedia` | number | 2.00 | ≥ 1.01 |
| `roiEsperado` | number | 5.0 | -100 a 100 (%) |
| `numBets` | number | 1000 | ≥ 10 |
| `tempoMeses` | number | 6 | ≥ 1 |
| `limiteDrawdown` | number | 25 | 5 a 95 (%) |
| `stakeEscolhida` | number | 1.0 | 0.1 a 100 (%) |
| `simulacoesCount` | number | 1000 | 100 a 10000 |

### Outputs Calculados

| Métrica | Descrição |
|---|---|
| `volumeNecessario` | Número mínimo de apostas para validação estatística (95% confiança) |
| `pValue` | Significância estatística do ROI observado vs hipótese nula |
| `probLucro` | % de simulações que terminaram com lucro |
| `survivalRate` | % de simulações que não atingiram o drawdown limite |
| `piorROI` / `melhorROI` | Intervalo de confiança 95% do ROI |
| `totalProfit` | Lucro total estimado em unidades |
| `avgMDD` / `worstDD` | Drawdown máximo médio e pior caso |
| `histData` | Distribuição de drawdown em 10 buckets |
| `chartData` | 12 curvas de patrimônio (stress test visual) |

### Derivado Calculado Automaticamente
```
entradasPorMes = numBets / tempoMeses
```

### Lógica Crítica — `lib/ferramentas/validacao-risco/monte-carlo.ts`

```typescript
interface MonteCarloInputs {
  banca: number
  oddsMedia: number
  roiEsperado: number       // percentual
  numBets: number
  tempoMeses: number
  limiteDrawdown: number    // percentual
  stakeEscolhida: number   // percentual da banca
  simulacoesCount: number
}

interface MonteCarloResults {
  pValue: number
  probLucro: number         // percentual
  survivalRate: number      // percentual
  volumeNecessario: number
  piorROI: number           // percentual
  melhorROI: number         // percentual
  totalProfit: number       // em unidades
  avgMDD: number            // percentual
  worstDD: number           // percentual
  histData: DrawdownBucket[]
  chartData: PatrimonioPoint[]
}

interface DrawdownBucket {
  range: string             // "0%", "10%", ..., "90%"
  percent: number           // % de simulações neste bucket
  danger: boolean           // true se bucket >= limiteDrawdown
}

interface PatrimonioPoint {
  bet: number
  [key: `s${number}`]: number   // valor da banca em cada simulação
}

/**
 * Executa a simulação completa de Monte Carlo.
 * Função pura — sem side effects.
 */
function executarMonteCarlo(inputs: MonteCarloInputs): MonteCarloResults
```

### Lógica Crítica — `lib/ferramentas/validacao-risco/estatisticas.ts`

```typescript
/**
 * Distribuição normal cumulativa (aproximação de Abramowitz & Stegun).
 * Usada para calcular p-value.
 */
function cumulativeNormal(z: number): number

/**
 * Calcula p-value: probabilidade de obter o ROI observado
 * assumindo que a hipótese nula (ROI = 0) é verdadeira.
 */
function calcularPValue(
  probVitoria: number,
  numBets: number,
  oddsMedia: number
): number

/**
 * Volume mínimo de apostas necessário para validar o ROI
 * com 95% de confiança e precisão de ±20% do ROI esperado.
 */
function calcularVolumeValidador(
  probVitoria: number,
  oddsMedia: number,
  roiDecimal: number
): number

/**
 * Intervalo de confiança do ROI a 95%.
 */
function calcularIntervaloConfianca(
  probVitoria: number,
  oddsMedia: number,
  roiDecimal: number,
  numBets: number
): { piorROI: number; melhorROI: number }
```

### Componentes UI

| Componente | Tipo | Responsabilidade |
|---|---|---|
| `ValidacaoRiscoTool` | Client Component | Orquestra state + cálculos + layout |
| `PainelEntradas` | Client Component | Grid de inputs com validação visual |
| `PainelResultados` | Client Component | 4 cards de métricas + ROI IC + lucro estimado |
| `CurvasPatrimonio` | Client Component | Gráfico Recharts LineChart com 12 curvas |

### Mapeamento de Estilo Gemini → BDB

| Gemini (remover) | BDB (usar) |
|---|---|
| `bg-[#0d1117]` | `bg-background` |
| `bg-[#161b22]` | `bg-surface` ou `bg-card` |
| `border-slate-800` | `border-border` |
| `text-blue-600` / `bg-blue-600` | `bg-primary` / `text-primary` |
| `text-emerald-400` | `text-primary` (verde BDB) |
| `text-red-400` | `text-data-red` |
| `font-black uppercase text-[9px]` | Classes semânticas do design system |
| Inputs inline `<input className="bg-transparent...">` | `<Input />` shadcn/ui |
| Botão inline | `<Button />` shadcn/ui |
| Range slider inline | Componente `<Slider />` shadcn/ui se disponível, senão estilizar com tokens |

### Bugs e Melhorias Identificados no Código Gemini

1. **Template literals quebrados:** O código usa backticks sem escape correto em vários locais (ex: `` `s${idx}` ``, `` `Simular ${inputs...}` ``). Corrigir na conversão.
2. **setTimeout artificial:** A simulação usa `setTimeout(400)` para simular loading. Substituir por execução real — se for pesada (>100ms), usar `requestIdleCallback` ou Web Worker.
3. **Seed aleatório:** `Math.random()` não é reproduzível. Aceitável para MVP, mas documentar como melhoria futura (seed determinístico para testes).
4. **Validação de inputs ausente:** Nenhum input é validado (banca negativa, odds < 1, etc.). Adicionar validação Zod client-side.
5. **Magic numbers:** Constantes como `0.2316419`, `0.3989423` são coeficientes da aproximação normal — documentar com comentários.

---

## 3B — Ferramenta 2: Market Analyzer (Linhas Over/Under)

### Descrição
Calculador de linhas de gols (Over/Under) baseado em Poisson. A partir de uma odd de referência na linha 2.5, extrai o lambda (média de gols implícita) e projeta odds justas para todas as linhas adjacentes (1.5 a 3.75).

### Rota
```
/dashboard/ferramentas/over-under-linhas
```

### Inputs

| Campo | Tipo | Default | Descrição |
|---|---|---|---|
| `underRef` | number | 3.30 | Odd Under 2.5 de referência |
| `overRef` | number | 1.33 | Odd Over 2.5 de referência |

### Outputs (por linha)

| Campo | Descrição |
|---|---|
| `line` | Linha de gols (1.50, 1.75, ..., 3.75) |
| `under` | Odd projetada Under |
| `over` | Odd projetada Over |
| `probU` / `probO` | Probabilidade justa (%) |
| `juice` | Margem da casa (%) |
| `afastamento` | Distância da linha base |

### Derivados Exibidos no Header
```
juice = (1/underRef + 1/overRef - 1) × 100
lambda = encontrado por aproximação numérica a partir da fairProbUnder
```

### Lógica Crítica — `lib/ferramentas/over-under-linhas/poisson.ts`

```typescript
/**
 * Calcula P(X = k) para distribuição Poisson.
 * Reutiliza a função poissonPmf de lib/analytics/poisson.ts se já existir na Fase 2.
 */
function poissonPmf(lambda: number, k: number): number

/**
 * Calcula P(X ≤ n) = soma de P(X=0) até P(X=n).
 */
function poissonCdf(lambda: number, n: number): number

/**
 * Encontra o lambda implícito a partir da probabilidade justa de Under 2.5.
 * Usa aproximação numérica iterativa (10 iterações).
 */
function encontrarLambda(fairProbUnder25: number): number
```

### Lógica Crítica — `lib/ferramentas/over-under-linhas/juice.ts`

```typescript
interface OddsReferencia {
  under: number
  over: number
}

interface LinhaCalculada {
  line: string           // "1.50", "1.75", ..., "3.75"
  under: string          // odd formatada
  over: string           // odd formatada
  probU: string          // percentual formatado
  probO: string          // percentual formatado
  juice: string          // percentual formatado
  afastamento: string    // distância da base
  isBase: boolean        // true para linha 2.5 (ou linha de ref)
}

/**
 * Extrai juice e fair probs das odds de referência.
 */
function extrairJuice(refs: OddsReferencia): {
  juice: number
  fairProbUnder: number
  fairProbOver: number
}

/**
 * Gera tabela completa de linhas projetadas.
 * Linhas: [1.50, 1.75, 2.00, 2.25, 2.50, 2.75, 3.00, 3.25, 3.50, 3.75]
 */
function calcularLinhas(lambda: number, juiceBase: number): LinhaCalculada[]
```

### Componentes UI

| Componente | Tipo | Responsabilidade |
|---|---|---|
| `OverUnderLinhasTool` | Client Component | Orquestra state + cálculos + layout |
| `InputsReferencia` | Client Component | Barra superior com inputs de odds + juice + lambda |
| `TabelaLinhas` | Client Component | Tabela estilizada com destaque na linha base |

### Bugs e Melhorias Identificados

1. **Fatorial recursivo sem cache:** O código Gemini tem `factorial = (n) => n <= 1 ? 1 : n * factorial(n - 1)`. Substituir pela implementação com cache já existente em `lib/analytics/poisson.ts` (Fase 2).
2. **Cálculo de linhas de quartos (.25/.75) incompleto:** O código contém comentário `// Placeholder para complexidade de quartos` e a lógica é uma interpolação simplificada. Documentar como limitação conhecida do MVP e refinar posteriormente.
3. **Linhas hardcoded:** Array `[1.50, 1.75, ..., 3.75]` está fixo. Aceitar para MVP, mas preparar para ser configurável.
4. **Reutilização:** A função `poissonPmf` já existe no motor da Fase 2 (`lib/analytics/poisson.ts`). Importar em vez de reimplementar.
5. **Afastamento calculado incorretamente:** O código Gemini calcula afastamento relativo à linha 3.50 (hardcoded), mas a linha base deveria ser a linha de referência (2.5 por padrão). Corrigir na migração.

---

## 3C — Ferramenta 3: Simulador de Distribuição Estatística

### Descrição
Laboratório visual interativo para explorar distribuições estatísticas. O usuário manipula 4 parâmetros (média, desvio padrão, assimetria e curtose) via sliders e observa em tempo real o efeito na curva de distribuição e nas medidas de tendência central (média, mediana, moda).

### Rota
```
/dashboard/ferramentas/distribuicao
```

### Inputs (Sliders)

| Campo | Tipo | Default | Range | Step |
|---|---|---|---|---|
| `baseMean` | number | 0 | -4 a 4 | 0.1 |
| `stdDev` | number | 1 | 0.6 a 2.5 | 0.1 |
| `skewness` | number | 0 | -2 a 2 | 0.1 |
| `kurtosis` | number | 3.0 | 1.5 a 6.0 | 0.1 |

### Outputs Visuais

| Elemento | Descrição |
|---|---|
| Curva principal | PDF ajustada por Gram-Charlier |
| Linha vermelha | Média (desloca com skew) |
| Linha verde tracejada | Mediana (intermediária) |
| Linha âmbar pontilhada | Moda (ponto mais alto) |
| Áreas sombreadas | Zonas de ±1σ, ±2σ, ±3σ |
| Cards pedagógicos | Explicações sobre deslocamento da média e controle de amplitude |

### Lógica Crítica — `lib/ferramentas/distribuicao/gram-charlier.ts`

```typescript
/**
 * Calcula a média real ajustada pela assimetria.
 * Em distribuições assimétricas, a média é puxada pela cauda.
 */
function calcularMediaReal(baseMean: number, skewness: number, stdDev: number): number

/**
 * Calcula a PDF (densidade de probabilidade) usando aproximação de Gram-Charlier.
 * Inclui ajuste de amplitude pela curtose.
 *
 * Parâmetros:
 * - x: ponto no eixo X
 * - mean: média real (já ajustada)
 * - sd: desvio padrão
 * - skew: coeficiente de assimetria
 * - kurt: curtose (3 = normal, >3 leptocúrtica, <3 platicúrtica)
 *
 * Retorna: valor da densidade (≥ 0)
 */
function gramCharlierPdf(
  x: number,
  mean: number,
  sd: number,
  skew: number,
  kurt: number
): number

/**
 * Gera array de pontos para renderização do gráfico.
 * Range fixo: -12 a 12, step 0.15.
 * Cada ponto inclui: x, y (PDF), z1/z2/z3 (zonas de desvio padrão).
 */
function gerarPontosCurva(
  mean: number,
  sd: number,
  skew: number,
  kurt: number
): CurvePoint[]
```

### Lógica Crítica — `lib/ferramentas/distribuicao/medidas-centrais.ts`

```typescript
/**
 * Calcula posições relativas da moda e mediana em função da assimetria.
 * Relação pedagógica: em assimetria positiva → Moda < Mediana < Média
 */
function calcularMedidasCentrais(
  mean: number,
  skewness: number,
  stdDev: number
): { mode: number; median: number }
```

### Componentes UI

| Componente | Tipo | Responsabilidade |
|---|---|---|
| `DistribuicaoTool` | Client Component | Orquestra state + cálculos + layout |
| `PainelParametros` | Client Component | 4 sliders + legenda de cores |
| `GraficoCurva` | Client Component | ComposedChart Recharts com áreas + linhas de referência |

### Mapeamento de Estilo Específico

| Gemini (remover) | BDB (usar) |
|---|---|
| `bg-slate-900 text-white` (painel lateral) | `bg-surface` com tokens do dark theme |
| `bg-white` (área do gráfico) | `bg-card` (manter dark) |
| `text-blue-400` (parâmetro μ) | `text-data-blue` |
| `text-emerald-400` (parâmetro σ) | `text-primary` |
| `text-amber-400` (skew) | `text-data-yellow` |
| `text-purple-400` (curtose) | Adicionar token `data.purple: '#a855f7'` se não existir, ou usar `text-data-blue` |
| Cards pedagógicos `bg-rose-50` / `bg-purple-50` | `bg-surface` com borda colorida |

### Bugs e Melhorias Identificados

1. **Layout light mode:** O código Gemini usa fundo branco no gráfico (`bg-white`, `bg-slate-50`). Converter para dark mode obrigatoriamente.
2. **Range fixo do eixo X:** Vai de -12 a 12, mas o domínio visual é -10 a 10. Consistir ambos.
3. **Tooltip com template literal:** `` `Valor: ${v}` `` — corrigir escape para JSX.
4. **`isAnimationActive={false}`:** Bom para performance — manter.
5. **Nenhuma validação de input:** Os sliders têm min/max no HTML, mas a lógica não valida. Adicionar clamp nas funções puras.
6. **Responsividade:** O layout `flex-row` do Gemini não funciona bem em mobile. Converter para `flex-col` em breakpoints menores.

---

## 3D — Ferramenta 4: Over/Under 2.5 (Placeholder)

### Status: ❌ Aguardando código do Marcelo

### Rota
```
/dashboard/ferramentas/over-under-25
```

### Implementação Temporária
- Renderizar componente `<EmBreve />` com mensagem "Ferramenta em desenvolvimento"
- Manter no grid de ferramentas com badge visual "Em breve"
- Quando o código for fornecido, criar tasks 3D.1–3D.N seguindo o mesmo padrão das ferramentas anteriores

---

## 3E — Grid de Ferramentas (`/dashboard/ferramentas`)

### Componente: `FerramentasGrid`

```typescript
const FERRAMENTAS = [
  {
    nome: 'Validação e Risco',
    descricao: 'Simulação Monte Carlo para avaliar viabilidade estatística de estratégias',
    href: '/dashboard/ferramentas/validacao-risco',
    icone: 'ShieldCheck',       // lucide-react
    disponivel: true,
  },
  {
    nome: 'Linhas Over/Under',
    descricao: 'Projeção de odds para todas as linhas de gols a partir de Poisson',
    href: '/dashboard/ferramentas/over-under-linhas',
    icone: 'TrendingUp',
    disponivel: true,
  },
  {
    nome: 'Distribuição Estatística',
    descricao: 'Laboratório visual interativo de distribuições e medidas de tendência central',
    href: '/dashboard/ferramentas/distribuicao',
    icone: 'BarChart3',
    disponivel: true,
  },
  {
    nome: 'Over/Under 2.5',
    descricao: 'Em breve',
    href: '/dashboard/ferramentas/over-under-25',
    icone: 'Target',
    disponivel: false,          // renderiza badge "Em breve"
  },
] as const
```

### Layout
- Grid responsivo: 1 coluna mobile, 2 colunas tablet, 2-3 colunas desktop
- Cada card usa `<Card>` do shadcn/ui com hover effect
- Cards indisponíveis: opacidade reduzida + badge "Em breve" + sem link clicável

---

## Convenções Gerais da Fase 3

### Reutilização de Código
- `poissonPmf` e `fatorial` devem ser importados de `lib/analytics/poisson.ts` (Fase 2), não reimplementados
- Se a Fase 2 ainda não estiver implementada quando a Fase 3 iniciar, criar as funções em `lib/ferramentas/shared/poisson.ts` e migrar depois

### Validação de Inputs
- Todas as ferramentas devem usar schemas Zod para validação client-side dos inputs
- Um schema por ferramenta em `lib/validations/ferramentas.ts`: `validacaoRiscoSchema`, `overUnderLinhasSchema`, `overUnder25Schema`, `distribuicaoSchema`

### Performance
- Monte Carlo com >1000 simulações: usar `requestIdleCallback` ou chunking
- Gráficos Recharts: `isAnimationActive={false}` em todos

### Testes
- `__tests__/ferramentas/validacao-risco/` — estatisticas.test.ts, monte-carlo.test.ts
- `__tests__/ferramentas/over-under-linhas/` — poisson-linhas.test.ts, juice.test.ts
- `__tests__/ferramentas/over-under-25/` — poisson-25.test.ts, juice.test.ts
- `__tests__/ferramentas/distribuicao/` — gram-charlier.test.ts, medidas-centrais.test.ts
- Testar edge cases: inputs extremos, banca zero, odds 1.01, desvio padrão mínimo

# SPECS — Fase 4: Multi-Liga + Pagamentos
# SPECS — Fase 5: Curso + Backtest
# SPECS — Fase 6: Automações