# TASKS

# [TASKS.md](http://tasks.md/) — Big Data Bet | Fase 1

> **Versão:** 1.0 | **Atualizado:** 24/04/2026
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

## 1B — Setup do Projeto ⚪

> **Objetivo:** Projeto Next.js 14 configurado, rodando localmente e com preview deploy no Vercel.
> 

### Subtasks

- [ ]  **1B.1 — Criar projeto Next.js 14**
    - [ ]  Rodar `create-next-app` com flags: `-typescript --tailwind --app`
    - [ ]  Confirmar estrutura App Router gerada corretamente
    - [ ]  Remover arquivos de exemplo (`page.tsx` padrão, `globals.css` padrão)
- [ ]  **1B.2 — Configurar Tailwind com design system BDB**
    - [ ]  Atualizar `tailwind.config.ts` com paleta de cores definida no SPECS
    - [ ]  Configurar `darkMode: ['class']`
    - [ ]  Adicionar plugin `tailwindcss-animate`
    - [ ]  Atualizar `globals.css` com variáveis CSS do SPECS
    - [ ]  Validar cores aplicando um componente de teste
- [ ]  **1B.3 — Instalar e configurar shadcn/ui**
    - [ ]  Rodar `npx shadcn-ui@latest init` (tema: dark)
    - [ ]  Instalar todos os componentes listados no SPECS (button, card, input, label, textarea, badge, avatar, dropdown-menu, navigation-menu, sheet, tabs, toast, dialog, alert-dialog, separator, skeleton, form, select, checkbox)
    - [ ]  Validar que os componentes renderizam em dark mode
- [ ]  **1B.4 — Configurar fontes Google**
    - [ ]  Adicionar `Inter`, `Plus Jakarta Sans` e `JetBrains Mono` via `next/font/google`
    - [ ]  Injetar variáveis CSS no `layout.tsx` root
    - [ ]  Validar carregamento no browser (network tab)
- [ ]  **1B.5 — Configurar variáveis de ambiente**
    - [ ]  Criar `.env.local` com todas as variáveis do SPECS
    - [ ]  Criar `.env.example` com valores em branco documentados
    - [ ]  Confirmar `.env*.local` no `.gitignore`
- [ ]  **1B.6 — Configurar ESLint e TypeScript strict**
    - [ ]  Ativar `strict: true` no `tsconfig.json`
    - [ ]  Confirmar `@typescript-eslint` configurado
    - [ ]  Rodar `eslint .` sem erros ou warnings
- [ ]  **1B.7 — Estrutura de pastas App Router**
    - [ ]  Criar grupos de rotas: `(public)`, `(content)`, `(auth)`, `(dashboard)`, `(cms)`
    - [ ]  Criar pasta `app/api`
    - [ ]  Criar pastas base: `components/`, `lib/`, `types/`, `prisma/`
- [ ]  **1B.8 — Repositório e deploy preview**
    - [ ]  Criar repositório no GitHub (privado)
    - [ ]  Proteger branch `main` (require PR)
    - [ ]  Conectar repositório ao Vercel
    - [ ]  Configurar deploy automático em push para `develop`
    - [ ]  Confirmar preview URL acessível
- [ ]  **1B.9 — Validação final do setup**
    - [ ]  `next dev` roda sem erros
    - [ ]  `next build` roda sem erros
    - [ ]  Preview deploy Vercel retorna 200
    - [ ]  Dark mode aplicado globalmente

---

## 1C — Banco de Dados + Prisma ⚪

> **Objetivo:** Schema Prisma aplicado no MySQL Hostgator, seed rodando, Prisma Studio funcional.
**Depende de:** 1B
> 

### Subtasks

- [ ]  **1C.1 — Instalar dependências**
    - [ ]  `npm install prisma @prisma/client`
    - [ ]  `npm install -D prisma`
    - [ ]  `npx prisma init --datasource-provider mysql`
- [ ]  **1C.2 — Configurar conexão com MySQL Hostgator**
    - [ ]  Preencher `DATABASE_URL` no `.env.local`
    - [ ]  Liberar IP local no firewall do Hostgator (desenvolvimento)
    - [ ]  Rodar `npx prisma db pull` para confirmar conexão sem erros
    - [ ]  Confirmar que nenhuma tabela legada será afetada
- [ ]  **1C.3 — Escrever schema Prisma completo**
    - [ ]  Adicionar enums: `Role`, `ArticleStatus`, `ArticleType`
    - [ ]  Adicionar modelo `User`
    - [ ]  Adicionar modelo `Account`
    - [ ]  Adicionar modelo `Session`
    - [ ]  Adicionar modelo `VerificationToken`
    - [ ]  Adicionar modelo `Article` com índices documentados no SCHEMA
    - [ ]  Adicionar modelo `Category`
    - [ ]  Adicionar modelo `Tag`
    - [ ]  Adicionar modelo `ArticleTag`
    - [ ]  Adicionar modelo `ArticleRevision` com índices
    - [ ]  Adicionar modelo `Favorite`
    - [ ]  Adicionar modelo `ReadHistory`
- [ ]  **1C.4 — Criar e aplicar migration inicial**
    - [ ]  Rodar `npx prisma migrate dev --name init`
    - [ ]  Confirmar migration aplicada sem erros
    - [ ]  Confirmar todas as tabelas criadas no banco
- [ ]  **1C.5 — Criar singleton Prisma Client**
    - [ ]  Criar `lib/prisma.ts` conforme SPECS
    - [ ]  Confirmar logs habilitados apenas em desenvolvimento
- [ ]  **1C.6 — Criar seed**
    - [ ]  Instalar `bcryptjs` e `@types/bcryptjs`
    - [ ]  Criar `prisma/seed.ts` com categorias padrão e usuário admin
    - [ ]  Adicionar script `prisma.seed` no `package.json`
    - [ ]  Rodar `npx prisma db seed` sem erros
    - [ ]  Confirmar dados no Prisma Studio
- [ ]  **1C.7 — Validação final**
    - [ ]  `npx prisma studio` exibe todos os modelos e dados do seed
    - [ ]  Nenhuma tabela legada alterada
    - [ ]  Migration versionada no repositório (`prisma/migrations/`)

---

## 1D — Autenticação (NextAuth v5) ⚪

> **Objetivo:** Login email/senha e Google funcionando, sessão JWT com `id` e `role`, proteção de rotas via middleware.
**Depende de:** 1C
> 

### Subtasks

- [ ]  **1D.1 — Instalar dependências**
    - [ ]  `npm install next-auth@5 @auth/prisma-adapter`
    - [ ]  `npm install bcryptjs`
    - [ ]  `npm install -D @types/bcryptjs`
- [ ]  **1D.2 — Criar schemas de validação (Zod)**
    - [ ]  Instalar `zod` se ainda não instalado
    - [ ]  Criar `lib/validations/auth.ts`
    - [ ]  Implementar `loginSchema`
    - [ ]  Implementar `cadastroSchema` com refinamento de confirmação de senha
    - [ ]  Exportar tipos inferidos `LoginInput` e `CadastroInput`
- [ ]  **1D.3 — Configurar NextAuth**
    - [ ]  Criar `lib/auth.ts` com `PrismaAdapter`
    - [ ]  Configurar provider `Credentials` com validação Zod + bcrypt
    - [ ]  Configurar provider `Google`
    - [ ]  Implementar callback `jwt` injetando `id` e `role`
    - [ ]  Implementar callback `session` expondo `id` e `role`
    - [ ]  Definir `pages.signIn: '/login'` e `pages.error: '/login'`
- [ ]  **1D.4 — Extensão de tipos NextAuth**
    - [ ]  Criar `types/next-auth.d.ts`
    - [ ]  Estender `Session` com `id` e `role`
    - [ ]  Estender `JWT` com `id` e `role`
- [ ]  **1D.5 — Criar rota handlers NextAuth**
    - [ ]  Criar `app/api/auth/[...nextauth]/route.ts` exportando `handlers`
- [ ]  **1D.6 — Criar rota de cadastro**
    - [ ]  Criar `app/api/usuarios/route.ts`
    - [ ]  Implementar `POST`: validar → verificar duplicidade → hash bcrypt → criar user → disparar T1 → retornar 201
    - [ ]  Retornar 409 se email já cadastrado
    - [ ]  Nunca retornar campo `password` na resposta
- [ ]  **1D.7 — Criar páginas de auth**
    - [ ]  Criar `app/(auth)/login/page.tsx` com form email/senha + botão Google
    - [ ]  Criar `app/(auth)/cadastro/page.tsx` com form + checkbox newsletter
    - [ ]  Usar componentes shadcn: `Form`, `Input`, `Button`, `Checkbox`, `Label`
    - [ ]  Feedback de erro inline por campo (Zod messages)
    - [ ]  Loading state no botão durante submit
    - [ ]  Redirecionar para `/dashboard` após login bem-sucedido
- [ ]  **1D.8 — Configurar middleware de proteção de rotas**
    - [ ]  Criar `middleware.ts` na raiz do projeto
    - [ ]  Proteger `/dashboard` (qualquer role autenticado)
    - [ ]  Proteger `/cms` (roles: AUTOR, REVISOR, EDITOR, ADMIN)
    - [ ]  Proteger `/api/artigos` (autenticado)
    - [ ]  Configurar `matcher` corretamente
- [ ]  **1D.9 — Configurar OAuth Google**
    - [ ]  Criar projeto no Google Cloud Console
    - [ ]  Configurar OAuth consent screen
    - [ ]  Gerar `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`
    - [ ]  Adicionar URIs de redirecionamento (localhost + produção)
    - [ ]  Preencher variáveis no `.env.local`
- [ ]  **1D.10 — Validação final**
    - [ ]  Login email/senha funciona com usuário do seed
    - [ ]  Login Google redireciona e cria User no banco
    - [ ]  `session.user.id` e `session.user.role` disponíveis em Server Components
    - [ ]  Cadastro cria User com `role: MEMBRO`
    - [ ]  `/dashboard` redireciona para `/login` sem sessão
    - [ ]  `/cms` redireciona para `/dashboard` com role MEMBRO
    - [ ]  Campo `password` nunca aparece em resposta alguma

---

## 1E — CMS Interno ⚪

> **Objetivo:** Workflow completo RASCUNHO → REVISÃO → PUBLICADO funcionando com notificações por email.
**Depende de:** 1C · 1D · 1G (para emails)
> 

### Subtasks

- [ ]  **1E.1 — Instalar dependências**
    - [ ]  `npm install @uiw/react-md-editor` (justificativa: editor Markdown leve sem deps pesadas)
- [ ]  **1E.2 — Criar schemas de validação (Zod)**
    - [ ]  Criar `lib/validations/artigos.ts`
    - [ ]  Implementar `criarArtigoSchema`
    - [ ]  Implementar `atualizarArtigoSchema` (partial do criar)
    - [ ]  Implementar `mudarStatusSchema` com refinamento (nota obrigatória ao devolver)
    - [ ]  Exportar tipos inferidos
- [ ]  **1E.3 — Criar utilitário de slug**
    - [ ]  Criar `lib/utils/slug.ts`
    - [ ]  Implementar `gerarSlug(titulo)` com normalização de acentos
    - [ ]  Implementar `slugEstaDisponivel(slug, ignorarId?)` com query Prisma
- [ ]  **1E.4 — Criar rotas de API**
    - [ ]  `GET /api/artigos` — listar com filtros (status, tipo, authorId) e paginação
        - [ ]  Aplicar visibilidade por role (AUTOR vê apenas os seus)
        - [ ]  Retornar total e dados paginados
    - [ ]  `POST /api/artigos` — criar artigo
        - [ ]  Validar com Zod
        - [ ]  Gerar slug a partir do título se não fornecido
        - [ ]  Validar unicidade do slug
        - [ ]  Criar tags novas se não existirem
        - [ ]  Salvar com `status: RASCUNHO`
    - [ ]  `GET /api/artigos/[id]` — buscar por ID
        - [ ]  Incluir author, category, tags, revisions
    - [ ]  `PATCH /api/artigos/[id]` — atualizar conteúdo
        - [ ]  Validar permissão (AUTOR só edita o próprio)
        - [ ]  Revalidar slug se título alterado
    - [ ]  `PATCH /api/artigos/[id]/status` — mudar status
        - [ ]  Implementar fluxo completo do SPECS (permissões + revisão + email + publishedAt)
    - [ ]  `DELETE /api/artigos/[id]` — deletar (apenas ADMIN)
- [ ]  **1E.5 — Criar componentes CMS**
    - [ ]  `components/artigos/StatusBadge.tsx` — badge colorido por status
    - [ ]  `components/artigos/ArtigoCard.tsx` — card da listagem CMS
    - [ ]  `components/artigos/ArtigoListagem.tsx` — tabela com filtros de status/tipo/autor
    - [ ]  `components/artigos/MudarStatusDialog.tsx` — dialog de confirmação + campo nota
    - [ ]  `components/artigos/TagInput.tsx` — input com autocomplete das tags existentes
    - [ ]  `components/artigos/ArtigoEditor.tsx` — form completo com MDEditor, todos os campos
- [ ]  **1E.6 — Criar páginas CMS**
    - [ ]  `app/(cms)/layout.tsx` — layout com sidebar e header de contexto
    - [ ]  `app/(cms)/cms/page.tsx` — listagem com filtros
    - [ ]  `app/(cms)/cms/novo/page.tsx` — formulário de criação
    - [ ]  `app/(cms)/cms/[id]/page.tsx` — formulário de edição
- [ ]  **1E.7 — Validação final**
    - [ ]  Criar artigo salva com `status: RASCUNHO`
    - [ ]  Slug gerado automaticamente, editável e validado como único
    - [ ]  MDEditor renderiza preview do Markdown em tempo real
    - [ ]  Tags criadas on-the-fly se não existirem
    - [ ]  Todas as transições de status respeitam permissões por role
    - [ ]  `ArticleRevision` criado a cada mudança de status
    - [ ]  Nota obrigatória ao devolver para `RASCUNHO`
    - [ ]  `publishedAt` preenchido ao publicar e zerado ao despublicar
    - [ ]  AUTOR vê apenas seus próprios artigos na listagem

---

## 1G — Email (Brevo) ⚪

> **Objetivo:** 4 templates criados no Brevo e helper `sendEmail` funcional, disparando nos eventos corretos.
**Depende de:** 1D (para dados do usuário nos disparos)
> 

### Subtasks

- [ ]  **1G.1 — Instalar dependências**
    - [ ]  `npm install @getbrevo/brevo`
- [ ]  **1G.2 — Configurar conta Brevo**
    - [ ]  Criar conta em [brevo.com](http://brevo.com/)
    - [ ]  Gerar API key e adicionar ao `.env.local`
    - [ ]  Verificar domínio `bigdatabet.com.br` no painel Brevo (DNS SPF/DKIM)
    - [ ]  Configurar remetente `contato@bigdatabet.com.br`
- [ ]  **1G.3 — Criar templates no painel Brevo**
    - [ ]  **T1 — Boas-vindas** (ID: 1)
        - [ ]  Assunto: "Bem-vindo à Big Data Bet, {{params.NOME}}!"
        - [ ]  Corpo: saudação + link para acessar a plataforma
        - [ ]  Params: `NOME`, `EMAIL`
    - [ ]  **T2 — Artigo em revisão** (ID: 2)
        - [ ]  Assunto: "Novo artigo aguardando revisão: {{params.TITULO_ARTIGO}}"
        - [ ]  Corpo: quem enviou + título + link para o CMS
        - [ ]  Params: `NOME_REVISOR`, `TITULO_ARTIGO`, `AUTOR_ARTIGO`, `LINK_CMS`
    - [ ]  **T3 — Artigo devolvido** (ID: 3)
        - [ ]  Assunto: "Seu artigo foi devolvido para revisão"
        - [ ]  Corpo: título + comentário do revisor + link para editar
        - [ ]  Params: `NOME_AUTOR`, `TITULO_ARTIGO`, `COMENTARIO`, `LINK_CMS`
    - [ ]  **T4 — Artigo publicado** (ID: 4)
        - [ ]  Assunto: "Seu artigo foi publicado! 🎉"
        - [ ]  Corpo: título + link público do artigo
        - [ ]  Params: `NOME_AUTOR`, `TITULO_ARTIGO`, `LINK_ARTIGO`
- [ ]  **1G.4 — Criar helper de email**
    - [ ]  Criar `lib/brevo.ts` com função `sendEmail` genérica
    - [ ]  Criar `lib/brevo-templates.ts` com mapa de IDs e params documentados
    - [ ]  Garantir que erro no Brevo gera log mas não quebra o fluxo principal (`try/catch`)
- [ ]  **1G.5 — Integrar disparos nos fluxos**
    - [ ]  T1 disparado em `POST /api/usuarios` (cadastro)
    - [ ]  T2 disparado em `PATCH /api/artigos/[id]/status` → `REVISAO`
    - [ ]  T3 disparado em `PATCH /api/artigos/[id]/status` → `RASCUNHO` (devolução)
    - [ ]  T4 disparado em `PATCH /api/artigos/[id]/status` → `PUBLICADO`
- [ ]  **1G.6 — Validação final**
    - [ ]  T1 recebido no email após cadastro
    - [ ]  T2 recebido por todos os REVISORES/EDITORES ao enviar para revisão
    - [ ]  T3 recebido pelo AUTOR ao ter artigo devolvido
    - [ ]  T4 recebido pelo AUTOR ao ter artigo publicado
    - [ ]  Erro de envio não quebra a operação nem retorna 500 para o cliente
    - [ ]  Domínio verificado (sem cair em spam)

---

## 1H — Analytics (Posthog) ⚪

> **Objetivo:** Pageviews, identify e eventos customizados capturados no painel Posthog.
**Depende de:** 1B
> 

### Subtasks

- [ ]  **1H.1 — Instalar dependências**
    - [ ]  `npm install posthog-js posthog-node`
- [ ]  **1H.2 — Configurar conta Posthog**
    - [ ]  Criar projeto em [posthog.com](http://posthog.com/)
    - [ ]  Copiar `NEXT_PUBLIC_POSTHOG_KEY` para `.env.local`
    - [ ]  Confirmar `NEXT_PUBLIC_POSTHOG_HOST`
- [ ]  **1H.3 — Criar PHProvider**
    - [ ]  Criar `components/shared/PosthogProvider.tsx` (Client Component)
    - [ ]  Inicializar com `capture_pageview: false`
    - [ ]  Adicionar ao `app/layout.tsx` envolvendo `{children}`
- [ ]  **1H.4 — Criar captura de pageview**
    - [ ]  Criar `components/shared/PosthogPageview.tsx`
    - [ ]  Capturar `$pageview` a cada mudança de `pathname` + `searchParams`
    - [ ]  Adicionar ao layout dentro do `PHProvider`
- [ ]  **1H.5 — Criar helpers de identify e reset**
    - [ ]  Criar `lib/posthog.ts` com `identifyUser(id, role, email)`
    - [ ]  Criar `resetPosthog()` para uso no logout
    - [ ]  Chamar `identifyUser` após login bem-sucedido
    - [ ]  Chamar `resetPosthog` no handler de logout
- [ ]  **1H.6 — Implementar eventos customizados**
    - [ ]  `user_signed_up` — método email/google — em `POST /api/usuarios` e callback OAuth
    - [ ]  `user_logged_in` — em callback `jwt`
    - [ ]  `article_viewed` — em `GET /estudos/[slug]` e `/analises/[slug]`
    - [ ]  `article_favorited` — em `POST /api/favoritos`
    - [ ]  `cms_article_created` — em `POST /api/artigos`
    - [ ]  `cms_status_changed` — em `PATCH /api/artigos/[id]/status`
- [ ]  **1H.7 — Validação final**
    - [ ]  Pageview aparece no painel a cada troca de rota
    - [ ]  Usuário identificado após login (coluna Person no Posthog)
    - [ ]  Reset ao fazer logout (novo anônimo na próxima sessão)
    - [ ]  Todos os eventos customizados aparecendo com propriedades corretas
    - [ ]  Nenhum dado sensível (senha, token) enviado ao Posthog

---

## 1I — Páginas Públicas ⚪

> **Objetivo:** Home, Sobre, Comunidade, Planos, listagens e página de artigo publicados e com SEO correto.
**Depende de:** 1C (listagens) · 1D (favoritar, histórico)
> 

### Subtasks

- [ ]  **1I.1 — SEO base**
    - [ ]  Criar `lib/seo.ts` com `metadataBase` e `gerarMetadataArtigo`
    - [ ]  Aplicar `metadataBase` no `app/layout.tsx`
    - [ ]  Criar `app/sitemap.ts` com páginas estáticas + artigos publicados
    - [ ]  Criar `app/robots.ts` bloqueando `/cms`, `/dashboard`, `/api`
- [ ]  **1I.2 — Componentes compartilhados**
    - [ ]  `components/shared/Header.tsx` — navbar com logo, links, botão entrar/avatar
    - [ ]  `components/shared/Footer.tsx` — links, redes sociais, copyright
    - [ ]  `components/shared/ArtigoCardPublico.tsx` — card de artigo para listagens públicas
    - [ ]  `components/shared/Pagination.tsx` — paginação com query params
    - [ ]  `components/shared/FiltroArtigos.tsx` — dropdowns de categoria e tag + busca
- [ ]  **1I.3 — Página Home (`/`)**
    - [ ]  Seção Hero com headline, subheadline e CTAs
    - [ ]  Seção Métricas da Comunidade (Telegram · YouTube · Instagram)
    - [ ]  Seção Proposta de Valor (3 pilares)
    - [ ]  Seção Preview de Planos (4 cards estáticos, badge "Em breve" nos pagos)
    - [ ]  Seção Últimos Artigos (query: 3 mais recentes publicados)
    - [ ]  Seção CTA Final
- [ ]  **1I.4 — Página Sobre (`/sobre`)**
    - [ ]  Conteúdo institucional: missão, história, equipe
    - [ ]  Layout responsivo com imagens e texto
    - [ ]  Metadata estático
- [ ]  **1I.5 — Página Comunidade (`/comunidade`)**
    - [ ]  Links para Telegram, YouTube, Instagram
    - [ ]  Cards com contagem de membros
    - [ ]  CTA para cada canal
- [ ]  **1I.6 — Página Planos (`/planos`)**
    - [ ]  Tabela comparativa: Free · Básico · Pro · Premium
    - [ ]  Linha por feature com ✅ / ❌
    - [ ]  Preços exibidos mas sem checkout funcional
    - [ ]  Badge "Em breve" em planos pagos
    - [ ]  CTA Free → `/cadastro`
- [ ]  **1I.7 — Layout de conteúdo (`(content)/layout.tsx`)**
    - [ ]  Header + Footer compartilhados
    - [ ]  Sidebar com filtros (categoria, tag) em desktop
    - [ ]  Filtros em Sheet (shadcn) no mobile
- [ ]  **1I.8 — Listagem de Estudos (`/estudos`)**
    - [ ]  Query com filtros: categoria, tag, busca, paginação (20/página)
    - [ ]  Aceitar query params: `?categoria`, `?tag`, `?busca`, `?pagina`
    - [ ]  Usar `FiltroArtigos` e `Pagination`
    - [ ]  Exibir apenas artigos `PUBLICADO` e `type: ESTUDO`
- [ ]  **1I.9 — Listagem de Análises (`/analises`)**
    - [ ]  Mesma lógica de `/estudos` com `type: ANALISE`
- [ ]  **1I.10 — Página de Artigo (`/estudos/[slug]` e `/analises/[slug]`)**
    - [ ]  Server Component com `generateMetadata` dinâmico
    - [ ]  `notFound()` para slug inválido ou status ≠ PUBLICADO
    - [ ]  Renderizar Markdown do campo `content`
    - [ ]  Exibir: thumbnail, título, autor, data, categoria, tags
    - [ ]  Artigo anterior / próximo
    - [ ]  Botão favoritar (toggle, redireciona para `/login` se não autenticado)
    - [ ]  Share buttons (Web Share API + fallback)
    - [ ]  Registrar `ReadHistory` via API se usuário autenticado
- [ ]  **1I.11 — Validação final**
    - [ ]  Home carrega sem erros e com dados reais
    - [ ]  `generateMetadata` correto em páginas de artigo
    - [ ]  Open Graph testado (og:debugger Facebook)
    - [ ]  `sitemap.xml` acessível e válido
    - [ ]  `robots.txt` bloqueando rotas privadas
    - [ ]  Listagens exibem apenas artigos `PUBLICADO`
    - [ ]  Paginação e filtros funcionando via query params
    - [ ]  `notFound()` disparado para slugs inválidos
    - [ ]  `ReadHistory` registrado ao abrir artigo (usuário logado)
    - [ ]  Layout responsivo em mobile (375px) e desktop (1440px)

---

## 1J — Dashboard (Área do Membro) ⚪

> **Objetivo:** Área autenticada com visão geral, perfil, histórico e favoritos funcionando.
**Depende de:** 1C · 1D
> 

### Subtasks

- [ ]  **1J.1 — Criar schemas de validação (Zod)**
    - [ ]  Criar `lib/validations/usuario.ts`
    - [ ]  Implementar `atualizarPerfilSchema`
    - [ ]  Implementar `trocarSenhaSchema` com refinamento de confirmação
- [ ]  **1J.2 — Criar rotas de API**
    - [ ]  `GET /api/favoritos` — listar favoritos do usuário logado
    - [ ]  `POST /api/favoritos` — favoritar artigo (`{ articleId }`)
    - [ ]  `DELETE /api/favoritos/[id]` — desfavoritar
    - [ ]  `GET /api/historico` — últimos 30 itens do usuário logado
    - [ ]  `PATCH /api/usuarios/perfil` — atualizar `name` e `image`
    - [ ]  `PATCH /api/usuarios/senha` — trocar senha (verificar atual antes)
- [ ]  **1J.3 — Criar layout do Dashboard**
    - [ ]  `app/(dashboard)/layout.tsx`
    - [ ]  Sidebar fixa (240px) em desktop com 4 itens de navegação
    - [ ]  Bottom navigation bar em mobile (4 ícones)
    - [ ]  Header: logo + nome do usuário + badge de role + botão sair
    - [ ]  Chamar `resetPosthog` no handler de logout
- [ ]  **1J.4 — Página Visão Geral (`/dashboard`)**
    - [ ]  Saudação: "Olá, [nome]" + badge de role
    - [ ]  Últimas 5 leituras (ReadHistory)
    - [ ]  Últimos 4 favoritos
    - [ ]  Atalhos rápidos (incluindo "Criar artigo" para AUTOR+)
- [ ]  **1J.5 — Página Perfil (`/dashboard/perfil`)**
    - [ ]  Formulário: avatar, nome, email (read-only), role (read-only)
    - [ ]  Submit → `PATCH /api/usuarios/perfil`
    - [ ]  Seção separada de troca de senha
    - [ ]  Submit → `PATCH /api/usuarios/senha`
    - [ ]  Toast de sucesso e erro para cada ação
- [ ]  **1J.6 — Página Histórico (`/dashboard/historico`)**
    - [ ]  Query: últimos 30 ReadHistory ordenados por `readAt DESC`
    - [ ]  Exibir: thumbnail, título, tipo, data de leitura
    - [ ]  Estado vazio com CTA para `/estudos`
- [ ]  **1J.7 — Página Favoritos (`/dashboard/favoritos`)**
    - [ ]  Query: todos os Favorites ordenados por `createdAt DESC`
    - [ ]  Exibir: thumbnail, título, tipo, data em que favoritou
    - [ ]  Botão "Remover" com atualização otimista da UI
    - [ ]  Estado vazio com CTA para `/estudos`
- [ ]  **1J.8 — Validação final**
    - [ ]  `/dashboard` redireciona para `/login` sem sessão
    - [ ]  Badge de role visível no header
    - [ ]  Layout responsivo (sidebar desktop, bottom nav mobile)
    - [ ]  Perfil atualiza nome/imagem sem reload
    - [ ]  Troca de senha valida senha atual antes de salvar
    - [ ]  Histórico exibe corretamente as últimas 30 leituras
    - [ ]  Favoritar/desfavoritar atualiza UI de forma otimista
    - [ ]  Atalho "Criar artigo" visível apenas para AUTOR+

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
| 1B | Setup do Projeto | ⚪ | — |
| 1C | Banco + Prisma | ⚪ | 1B |
| 1D | Autenticação | ⚪ | 1C |
| 1E | CMS Interno | ⚪ | 1C · 1D · 1G |
| 1G | Email (Brevo) | ⚪ | 1D |
| 1H | Analytics (Posthog) | ⚪ | 1B |
| 1I | Páginas Públicas | ⚪ | 1C · 1D |
| 1J | Dashboard | ⚪ | 1C · 1D |
| 1K | Deploy + Domínio | ⚪ | Todos |

---

> **Regra para o agente:** Marcar subtask como concluída somente após todos os itens do checklist interno validados manualmente ou por teste automatizado. Nunca pular a validação final de cada item.
>