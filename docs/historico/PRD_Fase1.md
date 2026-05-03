# PRD — Fase 1 (Histórico Arquivado)

> **Status:** ✅ Concluída em 01/05/2026
> **Versão original:** PRD v1.1
> **Motivo do arquivamento:** Documentação histórica preservada para referência futura. Para roadmap atual, ver `docs/PRD.md`.

---

## 1B — Setup do Projeto

**Objetivo:** Repositório funcional com toda a stack configurada, tokens de marca aplicados e estrutura de pastas pronta.

### Critérios de Aceite

- [ ]  `create-next-app` com TypeScript strict, Tailwind, App Router
- [ ]  shadcn/ui instalado, tema dark, accent verde `#22c55e`
- [ ]  Fontes Google configuradas: Plus Jakarta Sans · Inter · JetBrains Mono
- [ ]  `tailwind.config.ts` com tokens do Manual de Marca
- [ ]  `globals.css` com CSS variables shadcn (dark)
- [ ]  `.env.example` documentado com todas as variáveis necessárias
- [ ]  ESLint + Prettier configurados
- [ ]  Logo SVG em `/public/logo.svg` e `/public/logo-icon.svg`
- [ ]  Favicon gerado a partir do ícone BDB
- [ ]  Estrutura de pastas criada conforme App Router
- [ ]  Repositório com branch `main` protegida + branch `develop`
- [ ]  Preview deploy funcional no Vercel apontando para `develop`

### Estrutura de Pastas

```
bigdatabet/
├── app/
│   ├── (public)/
│   │   ├── page.tsx              → Home
│   │   ├── sobre/page.tsx
│   │   ├── planos/page.tsx       → Estático, sem checkout
│   │   ├── planilhas/page.tsx    → Planilhas gratuitas e VIP
│   │   └── artigos/
│   │       ├── page.tsx          → Listagem unificada (Estudos e Análises)
│   │       └── [slug]/page.tsx   → Leitura do artigo
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── cadastro/page.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   ├── dashboard/perfil/page.tsx
│   │   ├── dashboard/historico/page.tsx
│   │   └── dashboard/favoritos/page.tsx
│   ├── (cms)/
│   │   ├── cms/page.tsx          → Listagem de artigos
│   │   ├── cms/novo/page.tsx     → Criar artigo
│   │   └── cms/[id]/page.tsx     → Editar artigo
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── artigos/route.ts
│       ├── artigos/[id]/route.ts
│       └── usuarios/route.ts
├── components/
│   ├── ui/                       → shadcn/ui (gerados)
│   ├── layout/                   → Header, Footer, Sidebar
│   ├── artigos/                  → Cards, listagem, editor
│   └── shared/                   → Badges de plano, avatares, etc.
├── lib/
│   ├── prisma.ts                 → Cliente Prisma singleton
│   ├── auth.ts                   → Config NextAuth
│   ├── brevo.ts                  → Helper emails
│   └── posthog.ts                → Helper analytics
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── middleware.ts                 → Proteção de rotas
└── .env.example
```

### Tokens Tailwind (Manual de Marca)

```tsx
// tailwind.config.ts
colors: {
  background: '#0d0d0d',
  surface:    '#1f2937',  // gray-800
  border:     '#374151',  // gray-700
  primary: {
    DEFAULT: '#22c55e',   // green-500
    dark:    '#16a34a',   // green-600
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
  }
}
```

---

## 1C — Banco de Dados + Modelos Prisma

**Objetivo:** Schema Prisma completo, conectado ao MySQL Hostgator em database separado das tabelas legadas. Migrations e seed funcionando.

### Critérios de Aceite

- [ ]  Conexão Prisma → MySQL Hostgator validada
- [ ]  Schema sem conflito com tabelas legadas (usar prefixo `bdb_` ou database exclusivo)
- [ ]  Migrations executadas sem erro
- [ ]  Seed com dados iniciais: categorias padrão e usuário admin
- [ ]  Todos os modelos com relações e tipos corretos
- [ ]  Nenhuma query SQL raw (exceto performance crítica documentada)

### Schema Prisma

```
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ─── Enums ───────────────────────────────────────────

enum Role {
  ADMIN
  EDITOR
  REVISOR
  AUTOR
  MEMBRO
}

enum ArticleStatus {
  RASCUNHO
  REVISAO
  PUBLICADO
}

enum ArticleType {
  ESTUDO
  ANALISE
}

// ─── Autenticação (NextAuth) ──────────────────────────

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?   // null se OAuth
  role          Role      @default(MEMBRO)
  newsletterOptIn Boolean @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]
  articles      Article[]        @relation("AutorArticles")
  revisions     ArticleRevision[]
  favorites     Favorite[]
  readHistory   ReadHistory[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ─── Conteúdo ─────────────────────────────────────────

model Article {
  id        String        @id @default(cuid())
  title     String
  slug      String        @unique
  excerpt   String?       @db.Text
  content   String        @db.LongText
  thumbnail String?
  type      ArticleType
  status    ArticleStatus @default(RASCUNHO)
  authorId  String
  categoryId String?
  publishedAt DateTime?
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  author    User          @relation("AutorArticles", fields: [authorId], references: [id])
  category  Category?     @relation(fields: [categoryId], references: [id])
  tags      ArticleTag[]
  revisions ArticleRevision[]
  favorites Favorite[]
  readHistory ReadHistory[]
}

model Category {
  id        String    @id @default(cuid())
  name      String
  slug      String    @unique
  createdAt DateTime  @default(now())

  articles  Article[]
}

model Tag {
  id        String       @id @default(cuid())
  name      String
  slug      String       @unique
  createdAt DateTime     @default(now())

  articles  ArticleTag[]
}

model ArticleTag {
  articleId String
  tagId     String

  article   Article @relation(fields: [articleId], references: [id], onDelete: Cascade)
  tag       Tag     @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([articleId, tagId])
}

// ─── CMS ──────────────────────────────────────────────

model ArticleRevision {
  id        String   @id @default(cuid())
  articleId String
  editorId  String
  fromStatus ArticleStatus
  toStatus   ArticleStatus
  note      String?  @db.Text
  createdAt DateTime @default(now())

  article   Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)
  editor    User     @relation(fields: [editorId], references: [id])
}

// ─── Área do Membro ───────────────────────────────────

model Favorite {
  id        String   @id @default(cuid())
  userId    String
  articleId String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  article   Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@unique([userId, articleId])
}

model ReadHistory {
  id        String   @id @default(cuid())
  userId    String
  articleId String
  readAt    DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  article   Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@unique([userId, articleId])
}
```

---

## 1D — Autenticação (NextAuth v5)

**Objetivo:** Login seguro com controle de sessão por role. Todos os cadastros criam usuário com role `MEMBRO`. Estrutura de middleware preparada para planos futuros.

### Critérios de Aceite

- [ ]  Login email/senha funcional com hash bcrypt
- [ ]  Login com Google (OAuth)
- [ ]  Cadastro cria `User` com `role: MEMBRO` automaticamente
- [ ]  Checkbox de opt-in newsletter no cadastro (LGPD)
- [ ]  Sessão JWT contém: `id`, `email`, `role`
- [ ]  `middleware.ts` protege rotas por role
- [ ]  Redirecionamento pós-login para `/dashboard`
- [ ]  Páginas de login e cadastro com layout dark (Manual de Marca)
- [ ]  Validação de formulários com Zod

### Proteção de Rotas (middleware.ts)

| Rota | Acesso mínimo |
| --- | --- |
| `/dashboard/*` | Autenticado (qualquer role) |
| `/cms/*` | `AUTOR`, `REVISOR`, `EDITOR`, `ADMIN` |
| `/api/artigos` POST/PATCH/DELETE | `AUTOR`+ |
| Demais rotas | Público |

### Variáveis de Ambiente

```bash
NEXTAUTH_SECRET=
NEXTAUTH_URL=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## 1E — CMS Interno

**Objetivo:** Fluxo completo de criação e publicação de artigos com múltiplos autores e controle de status.

### Critérios de Aceite

- [ ]  Editor Markdown (`@uiw/react-md-editor`) — leve, sem dependências extras
- [ ]  Campos: título, slug (auto-gerado e editável), tipo (ESTUDO ou ANALISE), excerpt, conteúdo, categoria, tags, thumbnail, status
- [ ]  Slug validado como único antes de salvar (API + Zod)
- [ ]  Workflow de status com permissões por role:

| Transição | Quem pode |
| --- | --- |
| RASCUNHO → REVISAO | AUTOR, EDITOR, ADMIN |
| REVISAO → RASCUNHO (devolver) | REVISOR, EDITOR, ADMIN |
| REVISAO → PUBLICADO | EDITOR, ADMIN |
| PUBLICADO → RASCUNHO (despublicar) | EDITOR, ADMIN |
- [ ]  Cada mudança de status salva registro em `ArticleRevision`
- [ ]  Email Brevo disparado a cada mudança de status (ver 1G)
- [ ]  Listagem do CMS filtrável por: status, tipo, autor
- [ ]  AUTOR vê apenas seus próprios artigos; EDITOR/ADMIN veem todos

### Fluxo Visual

```
AUTOR cria rascunho
      ↓
  [RASCUNHO] → clica "Enviar para revisão"
      ↓
  [REVISÃO]  → notifica REVISOR e EDITOR por email
      ↓
  Aprovado? ──Não──→ devolve com comentário → [RASCUNHO] → notifica AUTOR
      │
     Sim
      ↓
  EDITOR clica "Publicar"
      ↓
  [PUBLICADO] → aparece no site → notifica AUTOR
```

---

## 1G — Email (Brevo)

**Objetivo:** Emails transacionais com identidade visual BDB em PT-BR.

### Critérios de Aceite

- [ ]  SDK Brevo configurado (`@getbrevo/brevo`)
- [ ]  Helper `lib/brevo.ts` com função `sendEmail(to, templateId, params)`
- [ ]  Todos os templates criados no painel Brevo (HTML com identidade BDB)
- [ ]  Opt-in de newsletter salvo em `User.newsletterOptIn` (LGPD)
- [ ]  Limite de 300 emails/dia respeitado (free tier)

### Templates

| # | Template | Gatilho | Destinatário |
| --- | --- | --- | --- |
| T1 | Boas-vindas | Cadastro confirmado | Novo usuário |
| T2 | Artigo enviado para revisão | RASCUNHO → REVISAO | REVISOREs + EDITOREs |
| T3 | Artigo devolvido | REVISAO → RASCUNHO | AUTOR do artigo |
| T4 | Artigo publicado | REVISAO → PUBLICADO | AUTOR do artigo |

### Variáveis de Ambiente

```bash
BREVO_API_KEY=
BREVO_SENDER_EMAIL=contato@bigdatabet.com.br
BREVO_SENDER_NAME=Big Data Bet
```

---

## 1H — Analytics (Posthog)

**Objetivo:** Tracking de comportamento desde o primeiro acesso.

### Critérios de Aceite

- [ ]  Provider Posthog no `layout.tsx` root (client-side)
- [ ]  `posthog.identify()` chamado após login com `id` e `role`
- [ ]  `posthog.reset()` chamado no logout
- [ ]  Eventos customizados implementados:

| Evento | Propriedades | Onde |
| --- | --- | --- |
| `user_signed_up` | `method: email\|google` | Cadastro |
| `user_logged_in` | `method: email\|google` | Login |
| `article_viewed` | `slug, type, category` | Abertura de artigo |
| `article_favorited` | `slug, type` | Clique em favoritar |
| `cms_article_created` | `type` | Rascunho salvo |
| `cms_status_changed` | `from, to, articleId` | Mudança de status |

### Variáveis de Ambiente

```bash
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

## 1I — Páginas Públicas

**Objetivo:** Site institucional completo com SEO e identidade visual BDB.

### Páginas

### `/` — Home

- Hero com headline, subheadline e CTA principal ("Cadastre-se grátis")
- Métricas da comunidade: 1.600 Telegram · 2.800 YouTube · 819 Instagram
- Seção de proposta de valor (o que é o BDB, metodologia em 3 pontos)
- Preview dos planos (card estático, sem checkout — "em breve")
- Últimos artigos publicados (máx. 3, dinâmico)
- CTA final para cadastro

### `/sobre`

- Quem somos + metodologia
- Pilares do projeto (dados, estatística, transparência)
- Links para as comunidades (Telegram, YouTube, Instagram)

### `/planos`

- Tabela comparativa dos 4 planos (Free · Básico · Pro · Premium)
- Conteúdo estático com badge "Em breve" nos planos pagos
- CTA de cadastro gratuito

### `/artigos`

- Listagem unificada de Estudos e Análises
- Filtro integrado (categoria, tag, tipo) via barra superior
- Busca por título
- Paginação (20 artigos por página)
- Exibe apenas artigos com `status: PUBLICADO`

### `/artigos/[slug]`

- Conteúdo completo do artigo renderizado (Markdown → HTML)
- Metadados: autor, data, categoria, tags
- Botão de favoritar (requer login)
- Navegação: artigo anterior / próximo
- Share buttons (Twitter/X, WhatsApp, copiar link)

### SEO — Obrigatório em Todas as Páginas

- [ ]  `metadata` estático nas páginas institucionais
- [ ]  `generateMetadata()` dinâmico em `[slug]`
- [ ]  Open Graph + Twitter Card em artigos
- [ ]  `sitemap.xml` gerado via `app/sitemap.ts`
- [ ]  `robots.txt` via `app/robots.ts`
- [ ]  Canonical URL configurado

---

## 1J — Dashboard (Área do Membro)

**Objetivo:** Área autenticada com informações e histórico do usuário.

### Critérios de Aceite

- [x]  Layout com sidebar (desktop) e menu inferior (mobile)
- [x]  Badge de role visível no header

### Páginas

| Rota | Conteúdo |
| --- | --- |
| `/dashboard` | Visão geral: últimas leituras, artigos favoritos, atalhos rápidos |
| `/dashboard/perfil` | Editar nome, avatar (upload ou URL), senha |
| `/dashboard/historico` | Lista de artigos lidos ordenados por data (últimos 30) |
| `/dashboard/favoritos` | Artigos salvos como favorito com opção de remover |

---

## 1K — Deploy + Domínio

**Objetivo:** Ambiente de produção estável com CI/CD via Vercel.

### Critérios de Aceite

- [ ]  Projeto conectado ao Vercel via GitHub
- [ ]  Todas as variáveis de ambiente configuradas no Vercel (production + preview)
- [ ]  Domínio `bigdatabet.com.br` apontado para Vercel
- [ ]  SSL ativo (automático Vercel)
- [ ]  Deploy automático no push para `main`
- [ ]  Preview deploy ativo em PRs
- [ ]  MySQL Hostgator com acesso externo liberado para IPs Vercel
- [ ]  Health check: todas as rotas principais retornando 200

### Variáveis de Ambiente — Consolidado

```bash
# Banco
DATABASE_URL=mysql://user:pass@host:3306/database

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://bigdatabet.com.br
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Brevo
BREVO_API_KEY=
BREVO_SENDER_EMAIL=contato@bigdatabet.com.br
BREVO_SENDER_NAME=Big Data Bet

# Posthog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```
