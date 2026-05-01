# TASKS

# [TASKS.md](http://tasks.md/) — Big Data Bet | Fase 1

> **Versão:** 1.1 | **Atualizado:** 26/04/2026
**Referências:** PRD v1.1 · [SCHEMA.md](http://schema.md/) v1.0 · [SPECS.md](http://specs.md/) v1.0
**Regra:** Nenhuma task marcada como concluída sem checklist interno 100% validado.
> 

---

## Legenda de Status

```
🔴 Bloqueada     — depende de outra task não concluída
🟡 Em andamento  — em progresso
🟢 Concluída     — checklist 100% validado
⚪ Pendente      — aguardando início
```

---

## Dependências entre Items

```
1B (Setup)
  └── 1C (Banco)
        └── 1D (Auth)
              ├── 1E (CMS)
              ├── 1G (Email)      ← depende de 1D para disparos pós-ação
              └── 1J (Dashboard)
1H (Posthog)   ← depende de 1B apenas
1I (Páginas)   ← depende de 1C (listagens) e 1D (favoritar/histórico)
1K (Deploy)    ← depende de todos
```

---

## 1B — Setup do Projeto 🟢

> **Objetivo:** Projeto Next.js 14 configurado, rodando localmente e com preview deploy no Vercel.
> 

### Subtasks

- [x]  **1B.1 — Criar projeto Next.js 14**
    - [x]  Rodar `create-next-app` com flags: `-typescript --tailwind --app`
    - [x]  Confirmar estrutura App Router gerada corretamente
    - [x]  Remover arquivos de exemplo (`page.tsx` padrão, `globals.css` padrão)
- [x]  **1B.2 — Configurar Tailwind com design system BDB**
    - [x]  Atualizar `tailwind.config.ts` com paleta de cores definida no SPECS
    - [x]  Configurar `darkMode: ['class']`
    - [x]  Adicionar plugin `tailwindcss-animate`
    - [x]  Atualizar `globals.css` com variáveis CSS do SPECS
    - [x]  Validar cores aplicando um componente de teste
- [x]  **1B.3 — Instalar e configurar shadcn/ui**
    - [x]  Rodar `npx shadcn-ui@latest init` (tema: dark)
    - [x]  Instalar todos os componentes listados no SPECS
    - [x]  Validar que os componentes renderizam em dark mode
- [x]  **1B.4 — Configurar fontes Google**
    - [x]  Adicionar `Inter`, `Plus Jakarta Sans` e `JetBrains Mono` via `next/font/google`
    - [x]  Injetar variáveis CSS no `layout.tsx` root
    - [x]  Validar carregamento no browser (network tab)
- [x]  **1B.5 — Configurar variáveis de ambiente**
    - [x]  Criar `.env.local` com todas as variáveis do SPECS
    - [x]  Criar `.env.example` com valores em branco documentados
    - [x]  Confirmar `.env*.local` no `.gitignore`
- [x]  **1B.6 — Configurar ESLint e TypeScript strict**
    - [x]  Ativar `strict: true` no `tsconfig.json`
    - [x]  Confirmar `@typescript-eslint` configurado
    - [x]  Rodar `eslint .` sem erros ou warnings
- [x]  **1B.7 — Estrutura de pastas App Router**
    - [x]  Criar grupos de rotas: `(public)`, `(content)`, `(auth)`, `(dashboard)`, `(cms)`
    - [x]  Criar pasta `app/api`
    - [x]  Criar pastas base: `components/`, `lib/`, `types/`, `prisma/`
- [x]  **1B.8 — Repositório e deploy preview**
    - [x]  Criar repositório no GitHub (privado)
    - [x]  Proteger branch `main` (require PR)
    - [x]  Conectar repositório ao Vercel
    - [x]  Configurar deploy automático em push para `develop`
    - [x]  Confirmar preview URL acessível
- [x]  **1B.9 — Validação final do setup**
    - [x]  `next dev` roda sem erros
    - [x]  `next build` roda sem erros
    - [x]  Preview deploy Vercel retorna 200
    - [x]  Dark mode aplicado globalmente

---

## 1C — Banco de Dados + Prisma 🟢

> **Objetivo:** Schema Prisma aplicado no MySQL Hostgator, seed rodando, Prisma Studio funcional.
**Depende de:** 1B
> 

### Subtasks

- [x]  **1C.1 — Instalar dependências**
    - [x]  `npm install prisma @prisma/client`
    - [x]  `npm install -D prisma`
    - [x]  `npx prisma init --datasource-provider mysql`
- [x]  **1C.2 — Configurar conexão com MySQL Hostgator**
    - [x]  Preencher `DATABASE_URL` no `.env.local`
    - [x]  Liberar IP local no firewall do Hostgator (desenvolvimento)
    - [x]  Rodar `npx prisma db pull` para confirmar conexão sem erros
    - [x]  Confirmar que nenhuma tabela legada será afetada
- [x]  **1C.3 — Escrever schema Prisma completo**
    - [x]  Adicionar enums: `Role`, `ArticleStatus`, `ArticleType`
    - [x]  Adicionar modelo `User`
    - [x]  Adicionar modelo `Account`
    - [x]  Adicionar modelo `Session`
    - [x]  Adicionar modelo `VerificationToken`
    - [x]  Adicionar modelo `Article` com índices documentados no SCHEMA
    - [x]  Adicionar modelo `Category`
    - [x]  Adicionar modelo `Tag`
    - [x]  Adicionar modelo `ArticleTag`
    - [x]  Adicionar modelo `ArticleRevision` com índices
    - [x]  Adicionar modelo `Favorite`
    - [x]  Adicionar modelo `ReadHistory`
- [x]  **1C.4 — Criar e aplicar migration inicial**
    - [x]  Rodar `npx prisma migrate dev --name init`
    - [x]  Confirmar migration aplicada sem erros
    - [x]  Confirmar todas as tabelas criadas no banco
- [x]  **1C.5 — Criar singleton Prisma Client**
    - [x]  Criar `lib/prisma.ts` conforme SPECS
    - [x]  Confirmar logs habilitados apenas em desenvolvimento
- [x]  **1C.6 — Criar seed**
    - [x]  Instalar `bcryptjs` e `@types/bcryptjs`
    - [x]  Criar `prisma/seed.ts` com categorias padrão e usuário admin
    - [x]  Adicionar script `prisma.seed` no `package.json`
    - [x]  Rodar `npx prisma db seed` sem erros
    - [x]  Confirmar dados no Prisma Studio
- [x]  **1C.7 — Validação final**
    - [x]  `npx prisma studio` exibe todos os modelos e dados do seed
    - [x]  Nenhuma tabela legada alterada
    - [x]  Migration versionada no repositório (`prisma/migrations/`)

---

## 1D — Autenticação (NextAuth v5) 🟢

> **Objetivo:** Login email/senha e Google funcionando, sessão JWT com `id` e `role`, proteção de rotas via middleware.
**Depende de:** 1C
> 

### Subtasks

- [x]  **1D.1 — Instalar dependências**
    - [x]  `npm install next-auth@5 @auth/prisma-adapter`
    - [x]  `npm install bcryptjs`
    - [x]  `npm install -D @types/bcryptjs`
- [x]  **1D.2 — Criar schemas de validação (Zod)**
    - [x]  Instalar `zod` se ainda não instalado
    - [x]  Criar `lib/validations/auth.ts`
    - [x]  Implementar `loginSchema`
    - [x]  Implementar `cadastroSchema` com refinamento de confirmação de senha
    - [x]  Exportar tipos inferidos `LoginInput` e `CadastroInput`
- [x]  **1D.3 — Configurar NextAuth**
    - [x]  Criar `lib/auth.ts` com `PrismaAdapter`
    - [x]  Configurar provider `Credentials` com validação Zod + bcrypt
    - [x]  Configurar provider `Google`
    - [x]  Implementar callback `jwt` injetando `id` e `role`
    - [x]  Implementar callback `session` expondo `id` e `role`
    - [x]  Definir `pages.signIn: '/login'` e `pages.error: '/login'`
- [x]  **1D.4 — Extensão de tipos NextAuth**
    - [x]  Criar `types/next-auth.d.ts`
    - [x]  Estender `Session` com `id` e `role`
    - [x]  Estender `JWT` com `id` e `role`
- [x]  **1D.5 — Criar rota handlers NextAuth**
    - [x]  Criar `app/api/auth/[...nextauth]/route.ts` exportando `handlers`
- [x]  **1D.6 — Criar rota de cadastro**
    - [x]  Criar `app/api/usuarios/route.ts`
    - [x]  Implementar `POST`: validar → verificar duplicidade → hash bcrypt → criar user → disparar T1 → retornar 201
    - [x]  Retornar 409 se email já cadastrado
    - [x]  Nunca retornar campo `password` na resposta
- [x]  **1D.7 — Criar páginas de auth**
    - [x]  Criar `app/(auth)/login/page.tsx` com form email/senha + botão Google
    - [x]  Criar `app/(auth)/cadastro/page.tsx` com form + checkbox newsletter
    - [x]  Usar componentes shadcn: `Form`, `Input`, `Button`, `Checkbox`, `Label`
    - [x]  Feedback de erro inline por campo (Zod messages)
    - [x]  Loading state no botão durante submit
    - [x]  Redirecionar para `/dashboard` após login bem-sucedido
- [x]  **1D.8 — Configurar middleware de proteção de rotas**
    - [x]  Criar `middleware.ts` na raiz do projeto
    - [x]  Proteger `/dashboard` (qualquer role autenticado)
    - [x]  Proteger `/cms` (roles: AUTOR, REVISOR, EDITOR, ADMIN)
    - [x]  Proteger `/api/artigos` (autenticado)
    - [x]  Configurar `matcher` corretamente
- [x]  **1D.9 — Configurar OAuth Google**
    - [x]  Criar projeto no Google Cloud Console
    - [x]  Configurar OAuth consent screen
    - [x]  Gerar `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`
    - [x]  Adicionar URIs de redirecionamento (localhost + produção)
    - [x]  Preencher variáveis no `.env.local`
- [x]  **1D.10 — Validação final**
    - [x]  Login email/senha funciona com usuário do seed
    - [x]  Login Google redireciona e cria User no banco
    - [x]  `session.user.id` e `session.user.role` disponíveis em Server Components
    - [x]  Cadastro cria User com `role: MEMBRO`
    - [x]  `/dashboard` redireciona para `/login` sem sessão
    - [x]  `/cms` redireciona para `/dashboard` com role MEMBRO
    - [x]  Campo `password` nunca aparece em resposta alguma

---

## 1E — CMS Interno 🟢

> **Objetivo:** Workflow completo RASCUNHO → REVISÃO → PUBLICADO funcionando com notificações por email.
**Depende de:** 1C · 1D · 1G (para emails)
> 

### Subtasks

- [x]  **1E.1 — Instalar dependências**
    - [x]  `npm install @uiw/react-md-editor` (justificativa: editor Markdown leve sem deps pesadas)
- [x]  **1E.2 — Criar schemas de validação (Zod)**
    - [x]  Criar `lib/validations/artigos.ts`
    - [x]  Implementar `criarArtigoSchema`
    - [x]  Implementar `atualizarArtigoSchema` (partial do criar)
    - [x]  Implementar `mudarStatusSchema` com refinamento (nota obrigatória ao devolver)
    - [x]  Exportar tipos inferidos
- [x]  **1E.3 — Criar utilitário de slug**
    - [x]  Criar `lib/utils/slug.ts`
    - [x]  Implementar `gerarSlug(titulo)` com normalização de acentos
    - [x]  Implementar `slugEstaDisponivel(slug, ignorarId?)` com query Prisma
- [x]  **1E.4 — Criar rotas de API**
    - [x]  `GET /api/artigos` — listar com filtros (status, tipo, authorId) e paginação
        - [x]  Aplicar visibilidade por role (AUTOR vê apenas os seus)
        - [x]  Retornar total e dados paginados
    - [x]  `POST /api/artigos` — criar artigo
        - [x]  Validar com Zod
        - [x]  Gerar slug a partir do título se não fornecido
        - [x]  Validar unicidade do slug
        - [x]  Criar tags novas se não existirem
        - [x]  Salvar com `status: RASCUNHO`
    - [x]  `GET /api/artigos/[id]` — buscar por ID
        - [x]  Incluir author, category, tags, revisions
    - [x]  `PATCH /api/artigos/[id]` — atualizar conteúdo
        - [x]  Validar permissão (AUTOR só edita o próprio)
        - [x]  Revalidar slug se título alterado
    - [x]  `PATCH /api/artigos/[id]/status` — mudar status
        - [x]  Implementar fluxo completo do SPECS (permissões + revisão + email + publishedAt)
    - [x]  `DELETE /api/artigos/[id]` — deletar (apenas ADMIN)
- [x]  **1E.5 — Criar componentes CMS**
    - [x]  `components/artigos/StatusBadge.tsx` — badge colorido por status
    - [x]  `components/artigos/ArtigoCard.tsx` — card da listagem CMS
    - [x]  `components/artigos/ArtigoListagem.tsx` — tabela com filtros de status/tipo/autor
    - [x]  `components/artigos/MudarStatusDialog.tsx` — dialog de confirmação + campo nota
    - [x]  `components/artigos/TagInput.tsx` — input com autocomplete das tags existentes
    - [x]  `components/artigos/ArtigoEditor.tsx` — form completo com MDEditor, todos os campos
- [x]  **1E.6 — Criar páginas CMS**
    - [x]  `app/(cms)/layout.tsx` — layout com sidebar e header de contexto
    - [x]  `app/(cms)/cms/page.tsx` — listagem com filtros
    - [x]  `app/(cms)/cms/novo/page.tsx` — formulário de criação
    - [x]  `app/(cms)/cms/[id]/page.tsx` — formulário de edição
- [x]  **1E.7 — Validação final**
    - [x]  Criar artigo salva com `status: RASCUNHO`
    - [x]  Slug gerado automaticamente, editável e validado como único
    - [x]  MDEditor renderiza preview do Markdown em tempo real
    - [x]  Tags criadas on-the-fly se não existirem
    - [x]  Todas as transições de status respeitam permissões por role
    - [x]  `ArticleRevision` criado a cada mudança de status
    - [x]  Nota obrigatória ao devolver para `RASCUNHO`
    - [x]  `publishedAt` preenchido ao publicar e zerado ao despublicar
    - [x]  AUTOR vê apenas seus próprios artigos na listagem

---

## 1G — Email (Brevo) 🟢

> **Objetivo:** 4 templates criados no Brevo e helper `sendEmail` funcional, disparando nos eventos corretos.
**Depende de:** 1D (para dados do usuário nos disparos)
> 

### Subtasks

- [x]  **1G.1 — Instalar dependências**
    - [x]  `npm install @getbrevo/brevo`
- [x]  **1G.2 — Configurar conta Brevo**
    - [x]  Criar conta em [brevo.com](http://brevo.com/)
    - [x]  Gerar API key e adicionar ao `.env.local`
    - [x]  Verificar domínio `bigdatabet.com.br` no painel Brevo (DNS SPF/DKIM)
    - [x]  Configurar remetente `contato@bigdatabet.com.br`
- [x]  **1G.3 — Criar templates no painel Brevo**
    - [x]  **T1 — Boas-vindas** (ID: 1)
        - [x]  Assunto: "Bem-vindo à Big Data Bet, {{params.NOME}}!"
        - [x]  Corpo: saudação + link para acessar a plataforma
        - [x]  Params: `NOME`, `EMAIL`
    - [x]  **T2 — Artigo em revisão** (ID: 2)
        - [x]  Assunto: "Novo artigo aguardando revisão: {{params.TITULO_ARTIGO}}"
        - [x]  Corpo: quem enviou + título + link para o CMS
        - [x]  Params: `NOME_REVISOR`, `TITULO_ARTIGO`, `AUTOR_ARTIGO`, `LINK_CMS`
    - [x]  **T3 — Artigo devolvido** (ID: 3)
        - [x]  Assunto: "Seu artigo foi devolvido para revisão"
        - [x]  Corpo: título + comentário do revisor + link para editar
        - [x]  Params: `NOME_AUTOR`, `TITULO_ARTIGO`, `COMENTARIO`, `LINK_CMS`
    - [x]  **T4 — Artigo publicado** (ID: 4)
        - [x]  Assunto: "Seu artigo foi publicado! 🎉"
        - [x]  Corpo: título + link público do artigo
        - [x]  Params: `NOME_AUTOR`, `TITULO_ARTIGO`, `LINK_ARTIGO`
- [x]  **1G.4 — Criar helper de email**
    - [x]  Criar `lib/email/brevo.ts` com função `sendEmail` genérica
    - [x]  Criar templates de html e params documentados
    - [x]  Garantir que erro no Brevo gera log mas não quebra o fluxo principal (`try/catch`)
- [x]  **1G.5 — Integrar disparos nos fluxos**
    - [x]  T1 disparado em `POST /api/usuarios` (cadastro)
    - [x]  T2 disparado em `PATCH /api/artigos/[id]/status` → `REVISAO`
    - [x]  T3 disparado em `PATCH /api/artigos/[id]/status` → `RASCUNHO` (devolução)
    - [x]  T4 disparado em `PATCH /api/artigos/[id]/status` → `PUBLICADO`
- [x]  **1G.6 — Validação final**
    - [x]  T1 recebido no email após cadastro
    - [x]  T2 recebido por todos os REVISORES/EDITORES ao enviar para revisão
    - [x]  T3 recebido pelo AUTOR ao ter artigo devolvido
    - [x]  T4 recebido pelo AUTOR ao ter artigo publicado
    - [x]  Erro de envio não quebra a operação nem retorna 500 para o cliente
    - [x]  Domínio verificado (sem cair em spam)

---

## 1H — Analytics (Posthog) 🟢

> **Objetivo:** Pageviews, identify e eventos customizados capturados no painel Posthog.
**Depende de:** 1B
> 

### Subtasks

- [x]  **1H.1 — Instalar dependências**
    - [x]  `npm install posthog-js`
- [x]  **1H.2 — Configurar conta Posthog**
    - [x]  Criar projeto em [posthog.com](http://posthog.com/)
    - [x]  Copiar `NEXT_PUBLIC_POSTHOG_KEY` para `.env.local`
    - [x]  Confirmar `NEXT_PUBLIC_POSTHOG_HOST`
- [x]  **1H.3 — Criar PHProvider**
    - [x]  Criar `lib/posthog/provider.tsx` (Client Component)
    - [x]  Inicializar com `capture_pageview: false`
    - [x]  Adicionar ao `app/layout.tsx` com `<Suspense>`
- [x]  **1H.4 — Criar captura de pageview**
    - [x]  Integrar `trackPageView` no `PosthogProvider` com useEffect
    - [x]  Capturar `$pageview` a cada mudança de `pathname` + `searchParams`
- [x]  **1H.5 — Criar helpers de identify e reset**
    - [x]  Criar `lib/posthog/identify.ts` com `identifyUser`
    - [x]  Criar `resetUser()` para uso no logout
    - [x]  Chamar automaticamente no `useEffect` do `PosthogProvider` ouvindo `useSession`
- [x]  **1H.6 — Implementar eventos customizados**
    - [x]  `user_signed_up`, `user_logged_in`, `article_viewed`, `plan_changed`, etc. criados em `lib/posthog/events.ts`
- [x]  **1H.7 — Validação final**
    - [x]  Pageview aparece no painel a cada troca de rota
    - [x]  Usuário identificado após login (coluna Person no Posthog)
    - [x]  Reset ao fazer logout (novo anônimo na próxima sessão)
    - [x]  Todos os eventos customizados prontos para uso nas páginas
    - [x]  Nenhum dado sensível (senha, token) enviado ao Posthog

---

## 1I — Páginas Públicas 🟡

> **Objetivo:** Home, Sobre, Comunidade, Planos, listagens e página de artigo publicados e com SEO correto.
**Depende de:** 1C (listagens) · 1D (favoritar, histórico)
> 

### Subtasks

- [x]  **1I.1 — SEO base**
    - [x]  Criar `lib/seo.ts` com `metadataBase` e `gerarMetadataArtigo`
    - [x]  Aplicar `metadataBase` no `app/layout.tsx`
    - [x]  Criar `app/sitemap.ts` com páginas estáticas + artigos publicados
    - [x]  Criar `app/robots.ts` bloqueando `/cms`, `/dashboard`, `/api`
- [x]  **1I.2 — Componentes compartilhados**
    - [x]  `components/shared/Header.tsx` — navbar com logo, links, botão entrar/avatar
    - [x]  `components/shared/Footer.tsx` — links, redes sociais, copyright
    - [x]  `components/shared/ArtigoCardPublico.tsx` — card de artigo para listagens públicas
    - [x]  `components/shared/Pagination.tsx` — paginação com query params
    - [x]  `components/shared/FiltroArtigos.tsx` — dropdowns de categoria e tag + busca
- [x]  **1I.3 — Página Home (`/`)**
    - [x]  Seção Hero com headline, subheadline e CTAs
    - [x]  Seção Problema (ProblemSection)
    - [x]  Seção Solução (SolutionSection)
    - [x]  Seção Para quem é (AudienceSection)
    - [x]  Seção Prova Social / Comunidade com métricas e depoimentos (SocialProofSection)
    - [x]  Seção Conteúdo em Destaque com fallback estático (FeaturedContentSection)
    - [x]  Seção CTA Final — link Telegram (CtaFooterSection)
    - [x]  Banners decorativos entre S1/S2 e S4/S5 com `next/image` (max 300px, lazy load)
- [x]  **1I.4 — Página Sobre (`/sobre`)**
    - [x]  Conteúdo institucional: missão, história, equipe
    - [x]  Layout responsivo com imagens e texto
    - [x]  Metadata estático
- [x]  ~~**1I.5 — Página Comunidade (`/comunidade`)**~~ *(Cancelada: Conteúdo unificado na página `/sobre`)*
    - [x]  ~~Links para Telegram, YouTube, Instagram~~
    - [x]  ~~Cards com contagem de membros~~
    - [x]  ~~CTA para cada canal~~
- [x]  **1I.6 — Página Planos (`/planos`)**
    - [x]  Tabela comparativa: Free · Básico · Pro · Premium
    - [x]  Linha por feature com ✅ / ❌
    - [x]  Preços exibidos mas sem checkout funcional
    - [x]  Badge "Em breve" em planos pagos
    - [x]  CTA Free → `/cadastro`
- [x]  **1I.7 — Layout de conteúdo (Integrado ao Public)**
    - [x]  Header + Footer compartilhados herdados do grupo `(public)`
    - [x]  Filtros integrados à página de listagem via `<FiltroArtigos>` em vez de Sidebar/Sheet isolado
- [x]  **1I.8 — Listagem Única de Artigos (`/artigos`)**
    - [x]  Unificar `/estudos` e `/analises` em `/artigos`
    - [x]  Query com filtros: categoria, tag, busca, tipo e paginação
    - [x]  Aceitar query params: `?categoria`, `?tag`, `?tipo`, `?page`
    - [x]  Usar `FiltroArtigos` e `Pagination`
    - [x]  Exibir apenas artigos `PUBLICADO`
- [x]  **1I.10 — Página de Artigo (`/artigos/[slug]`)**
    - [x]  Server Component com `generateMetadata` dinâmico
    - [x]  `notFound()` para slug inválido ou status ≠ PUBLICADO
    - [x]  Renderizar Markdown do campo `content` (React Markdown)
    - [x]  Exibir: thumbnail, título, data, categoria
    - [x]  Configuração de tipografia (Tailwind Typography, `remark-gfm`)
    - [x]  Polimento de UI (max-width restrito, imagens centralizadas)
    - [ ]  Artigo anterior / próximo
    - [x]  Botão favoritar (toggle, redireciona para `/login` se não autenticado)
    - [ ]  Share buttons (Web Share API + fallback)
    - [x]  Registrar `ReadHistory` via API se usuário autenticado
- [x]  **1I.11 — Página Planilhas (`/planilhas`)**
    - [x]  Criar seed de planilhas no Prisma (`brasileirao-serie-a-free`)
    - [x]  Seção Hero com badge e chamadas
    - [x]  Seção Planilha Free com instruções e link de download direto
    - [x]  Seção Pacote VIP com grade de ligas e CTA
    - [x]  Componente Em Breve para ferramentas
- [x]  **1I.12 — Validação final**
    - [x]  Home carrega sem erros e com dados reais
    - [x]  `generateMetadata` correto em páginas de artigo
    - [x]  Open Graph testado (og:debugger Facebook)
    - [x]  `sitemap.xml` acessível e válido
    - [x]  `robots.txt` bloqueando rotas privadas
    - [x]  Listagens exibem apenas artigos `PUBLICADO`
    - [x]  Paginação e filtros funcionando via query params
    - [x]  `notFound()` disparado para slugs inválidos
    - [x]  `ReadHistory` registrado ao abrir artigo (usuário logado)
    - [x]  Layout responsivo em mobile (375px) e desktop (1440px)

---

## 1J — Dashboard (Área do Membro) 🟢

> **Objetivo:** Área autenticada com visão geral, perfil, histórico e favoritos funcionando.
**Depende de:** 1C · 1D
> 

### Subtasks

- [x]  **1J.1 — Criar schemas de validação (Zod)**
    - [x]  Criar `lib/validations/usuario.ts`
    - [x]  Implementar `atualizarPerfilSchema`
    - [x]  Implementar `trocarSenhaSchema` com refinamento de confirmação
- [x]  **1J.2 — Criar rotas de API**
    - [x]  `GET /api/favoritos` — listar favoritos do usuário logado
    - [x]  `POST /api/favoritos` — favoritar artigo (`{ articleId }`)
    - [x]  `DELETE /api/favoritos/[articleId]` — desfavoritar
    - [x]  `GET /api/historico` — últimos 30 itens do usuário logado
    - [x]  `PATCH /api/perfil` — atualizar `name` e `image`
    - [x]  `PATCH /api/perfil/senha` — trocar senha (verificar atual antes)
- [x]  **1J.3 — Criar layout do Dashboard**
    - [x]  `app/(dashboard)/layout.tsx`
    - [x]  Sidebar fixa (240px) em desktop (agrupada com suporte a modo icon)
    - [x]  Bottom navigation bar em mobile (4 ícones com Sheet)
    - [x]  Header: logo + nome do usuário + badge de role + botão sair
    - [x]  Páginas de "Em Construção" para rotas não implementadas
- [x]  **1J.4 — Página Visão Geral (`/dashboard`)**
    - [x]  Saudação: "Olá, [nome]" + badge de role
    - [x]  Últimas 5 leituras (ReadHistory)
    - [x]  Últimos 4 favoritos
    - [x]  Atalhos rápidos (incluindo "Criar artigo" para AUTOR+)
- [x]  **1J.5 — Página Perfil (`/dashboard/perfil`)**
    - [x]  Formulário: avatar, nome, email (read-only), role (read-only)
    - [x]  Submit → `PATCH /api/usuarios/perfil`
    - [x]  Seção separada de troca de senha
    - [x]  Submit → `PATCH /api/usuarios/senha`
    - [x]  Toast de sucesso e erro para cada ação
- [x]  **1J.6 — Página Histórico (`/dashboard/historico`)**
    - [x]  Query: últimos 30 ReadHistory ordenados por `readAt DESC`
    - [x]  Exibir: thumbnail, título, tipo, data de leitura
    - [x]  Estado vazio com CTA para `/artigos`
- [x]  **1J.7 — Página Favoritos (`/dashboard/favoritos`)**
    - [x]  Query: todos os Favorites ordenados por `createdAt DESC`
    - [x]  Exibir: thumbnail, título, tipo, data em que favoritou
    - [x]  Botão "Remover" com atualização otimista da UI
    - [x]  Estado vazio com CTA para `/artigos`
- [x]  **1J.8 — Validação final**
    - [x]  `/dashboard` redireciona para `/login` sem sessão
    - [x]  Badge de role visível no header
    - [x]  Layout responsivo (sidebar desktop, bottom nav mobile)
    - [x]  Perfil atualiza nome/imagem sem reload
    - [x]  Troca de senha valida senha atual antes de salvar
    - [x]  Histórico exibe corretamente as últimas 30 leituras
    - [x]  Favoritar/desfavoritar atualiza UI de forma otimista
    - [x]  Atalho "Criar artigo" visível apenas para AUTOR+

---

## 1K — Deploy + Domínio ⚪

> **Objetivo:** Aplicação rodando em produção no domínio `bigdatabet.com.br` com todas as integrações ativas.
**Depende de:** 1B · 1C · 1D · 1E · 1G · 1H · 1I · 1J
> 

### Subtasks

- [ ]  **1K.1 — Configurar banco em produção**
    - [ ]  Liberar IPs Vercel no firewall do Hostgator
    - [ ]  Criar `DATABASE_URL` de produção separada do desenvolvimento
    - [ ]  Testar conexão via `prisma db pull` apontando para produção
- [ ]  **1K.2 — Configurar variáveis de ambiente no Vercel**
    - [ ]  Adicionar todas as variáveis do SPECS em Production
    - [ ]  Adicionar todas as variáveis em Preview (com `NEXTAUTH_URL` da preview URL)
    - [ ]  Confirmar que nenhuma `NEXT_PUBLIC_*` está ausente
- [ ]  **1K.3 — Configurar domínio**
    - [ ]  Adicionar `bigdatabet.com.br` no painel Vercel
    - [ ]  Atualizar DNS no registrador para apontar para Vercel (A + CNAME)
    - [ ]  Aguardar propagação e confirmar SSL ativo
- [ ]  **1K.4 — Executar migrations em produção**
    - [ ]  Rodar `npx prisma migrate deploy` apontando para banco de produção
    - [ ]  Confirmar todas as migrations aplicadas sem erro
    - [ ]  Rodar `npx prisma db seed` (apenas 1 vez — usuário admin + categorias)
- [ ]  **1K.5 — Configurar OAuth Google para produção**
    - [ ]  Adicionar `https://bigdatabet.com.br` como URI autorizada no Google Cloud Console
    - [ ]  Adicionar callback `https://bigdatabet.com.br/api/auth/callback/google`
    - [ ]  Testar login Google em produção
- [ ]  **1K.6 — Verificar domínio no Brevo**
    - [ ]  Confirmar registros SPF e DKIM publicados no DNS
    - [ ]  Verificar status no painel Brevo
    - [ ]  Enviar email de teste em produção
- [ ]  **1K.7 — Validação final de produção**
    - [ ]  Todas as rotas principais retornam 200
    - [ ]  Login email/senha funcional em produção
    - [ ]  Login Google funcional em produção
    - [ ]  Cadastro dispara T1 (email de boas-vindas)
    - [ ]  CMS funcional (criar, editar, mudar status)
    - [ ]  Emails T2, T3, T4 chegando corretamente
    - [ ]  Posthog recebendo eventos de produção
    - [ ]  `sitemap.xml` acessível em produção
    - [ ]  Lighthouse score: Performance ≥ 80, SEO = 100, Accessibility ≥ 90
    - [ ]  Sem erros no console do browser
    - [ ]  Sem erros nos logs do Vercel (Functions)

---

## Resumo Geral

| Item | Descrição | Status | Depende de |
| --- | --- | --- | --- |
| 1B | Setup do Projeto | 🟢 | — |
| 1C | Banco + Prisma | 🟢 | 1B |
| 1D | Autenticação | 🟡 | 1C |
| 1E | CMS Interno | ⚪ | 1C · 1D · 1G |
| 1G | Email (Brevo) | 🟢 | 1D |
| 1H | Analytics (Posthog) | 🟢 | 1B |
| 1I | Páginas Públicas | 🟡 | 1C · 1D |
| 1J | Dashboard | 🟡 | 1C · 1D |
| 1K | Deploy + Domínio | ⚪ | Todos |

---

> **Regra para o agente:** Marcar subtask como concluída somente após todos os itens do checklist interno validados manualmente ou por teste automatizado. Nunca pular a validação final de cada item.
>