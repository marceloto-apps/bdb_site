# SPECS

# SPECS.md — Big Data Bet | Fase 1

> **Versão:** 1.0 | **Atualizado:** 24/04/2026
**Referências:** PRD v1.1 · [SCHEMA.md](http://schema.md/) v1.0
**Escopo:** Fase 1 completa — especificações técnicas por item para implementação pelo agente
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

```tsx
// components/shared/PosthogProvider.tsx
'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host:          process.env.NEXT_PUBLIC_POSTHOG_HOST,
      capture_pageview:  false,  // captura manual via usePathname
      persistence:       'localStorage',
    })
  }, [])

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
```

### Pageview Automático (App Router)

```tsx
// components/shared/PosthogPageview.tsx
'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'

export function PosthogPageview() {
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const posthog      = usePostHog()

  useEffect(() => {
    if (pathname) {
      const url = searchParams.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname
      posthog.capture('$pageview', { $current_url: url })
    }
  }, [pathname, searchParams, posthog])

  return null
}
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
| `article_viewed` | `GET /estudos/[slug]` ou `/analises/[slug]` | `slug, type, category` |
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
  const secao = artigo.type === 'ESTUDO' ? 'estudos' : 'analises'
  const url   = `${BASE_URL}/${secao}/${artigo.slug}`

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
    url:          `${BASE}/${a.type === 'ESTUDO' ? 'estudos' : 'analises'}/${a.slug}`,
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
   - Link "Ver todos os estudos"

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

### `/estudos` e `/analises`

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

### `/estudos/[slug]` e `/analises/[slug]`

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
   - "Ver todos os estudos" → /estudos
   - "Ver todas as análises" → /analises
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
[ ] /dashboard redireciona para /login se não autenticado
[ ] Badge de role visível no header
[ ] Layout responsivo (sidebar desktop, bottom nav mobile)
[ ] Perfil atualiza name e image sem recarregar página
[ ] Troca de senha valida senha atual antes de salvar
[ ] Histórico exibe últimas 30 leituras
[ ] Favoritar/desfavoritar atualiza UI de forma otimista
[ ] Atalho "Criar artigo" visível apenas para AUTOR+
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