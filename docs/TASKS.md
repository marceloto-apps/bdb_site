# TASKS

# [TASKS.md](http://tasks.md/) — Big Data Bet

> **Versão:** 2.4 | **Atualizado:** 03/05/2026
> **Mudanças desde v2.1:**
> - Adicionada subseção "Ground Truth" em 2B com 4 tasks de validação contra planilha legada
> - Subtasks de validação adicionadas em 2B.1, 2B.5 e 2B.6
> - Tasks de UI adicionadas para tooltips educativos sobre modelos avançados
**Referências:** PRD v1.5 · SCHEMA.md v2.2 · SPECS.md v2.3
**Regra:** Nenhuma task marcada como concluída sem checklist interno 100% validado.
> 

---

## ✅ Fase 1 — Concluída em 01/05/2026

Toda a fundação está em produção. Próximas fases reorganizadas conforme PRD v1.2.

---

## ✅ Otimizações Pós-MVP (Fase 2.5) — Concluída em 10/05/2026

> **Objetivo:** Estabilizar o backfill, otimizar consumo da API, refinar filtros e melhorar usabilidade do dashboard.

- [x] **Backfill e API**
  - [x] Correção do parser de data (`YY/YY`) para focar nas temporadas mais recentes
  - [x] Detecção de jobs 'stale' no auto-backfill para retomar ingestão automaticamente
  - [x] Otimização da `maisevplus_webscraping` para alocar cota diária exclusivamente ao histórico
  - [x] Correção na rota `/proximas-partidas` (uso de `groupBy` para saltar rodadas vazias)
- [x] **Dashboard de Liga e Filtros**
  - [x] Correção do loop infinito no recálculo do `FiltroRodadas`
  - [x] Redução do requisito mínimo de partidas de 5 para 4
  - [x] Mudança do provedor padrão de odds de Pinnacle para Bet365 (maior cobertura)
  - [x] Auto-collapse e auto-reset dos filtros avançados ao calcular ou trocar confronto
  - [x] Resiliência a erros: manter estado visual e exibir motivos exatos da falta de dados (INSUFFICIENT_TEAM_DATA)
- [x] **Usabilidade e Acessos**
  - [x] Tags "Em breve" nas ferramentas do menu lateral (Backtest, Banca, Métodos, Aulas, Meu Progresso)
  - [x] Atualização da mensagem de ligas bloqueadas ("Disponível nos Planos Pagos" / "Em breve as opções de planos estarão disponíveis no site")
  - [x] Ligas FREE configuradas (Brasileirão, La Liga, Premier League, Serie A)

---

## ✅ Auditoria de Segurança (13/05/2026)

> **Objetivo:** Mitigar vulnerabilidades, aplicar Rate Limiting, proteger upload no CMS e adicionar headers de segurança.

- [x] **Proteção de Rotas API**
  - [x] Adicionar validação de role (`ADMIN`/`EDITOR`) nas rotas POST/PATCH/DELETE de `/api/categorias`
  - [x] Adicionar validação de role (`ADMIN`) na rota `/api/debug-match`
- [x] **Upload CMS e Cloudinary**
  - [x] Migrar `ImageUpload.tsx` do CMS de modo Unsigned para Signed
  - [x] Adaptar `/api/upload/signature` para responder corretamente ao plugin Next-Cloudinary
- [x] **Defesas Adicionais**
  - [x] Implementar e aplicar Rate Limiting em memória nas rotas sensíveis (ex: `/api/perfil/senha`)
  - [x] Configurar Security Headers HTTP no `next.config.mjs` (X-Frame-Options, HSTS, etc.)
  - [x] Instalar `isomorphic-dompurify` e sanitizar renderização de Markdown contra XSS

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

## 1I — Páginas Públicas 🟢

> **Objetivo:** Home, Sobre, Comunidade, Planos, listagens e página de artigo publicados e com SEO correto.
> **Depende de:** 1C (listagens) · 1D (favoritar, histórico)
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
    - [x]  Artigo anterior / próximo (Adiadas para Fase 2)
    - [x]  Botão favoritar (toggle, redireciona para `/login` se não autenticado)
    - [x]  Share buttons (Web Share API + fallback) (Adiadas para Fase 2)
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
> **Depende de:** 1C · 1D
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

## 1K — Deploy + Domínio 🟢

> **Objetivo:** Aplicação rodando em produção com todas as integrações ativas.
> **Depende de:** 1B · 1C · 1D · 1E · 1G · 1H · 1I · 1J
> 

### Subtasks

- [x]  **1K.1 — Configurar banco em produção**
    - [x]  Liberar IPs Vercel no firewall do Hostgator
    - [x]  Criar `DATABASE_URL` de produção separada do desenvolvimento
    - [x]  Testar conexão via `prisma db pull` apontando para produção
- [x]  **1K.2 — Configurar variáveis de ambiente no Vercel**
    - [x]  Adicionar todas as variáveis do SPECS em Production
    - [x]  Adicionar todas as variáveis em Preview (com `NEXTAUTH_URL` da preview URL)
    - [x]  Confirmar que nenhuma `NEXT_PUBLIC_*` está ausente
- [x]  **1K.3 — Configurar domínio**
    - [x]  Adicionar projeto no painel Vercel (`bdb-site-red`)
    - [x]  Atualizar DNS no registrador para apontar para Vercel
    - [x]  Aguardar propagação e confirmar SSL ativo
- [x]  **1K.4 — Executar migrations em produção**
    - [x]  Geração automática via `postinstall` no `package.json` configurada
    - [x]  Confirmar deploy limpo e sucesso de types/linting
- [x]  **1K.5 — Configurar OAuth Google para produção**
    - [x]  Adicionar URI autorizada no Google Cloud Console
    - [x]  Adicionar callback de autenticação configurado
    - [x]  Testar login Google em produção
- [x]  **1K.6 — Verificar domínio no Brevo**
    - [x]  Confirmar registros SPF e DKIM publicados no DNS
    - [x]  Verificar status no painel Brevo
    - [x]  Enviar email de teste em produção
- [x]  **1K.7 — Validação final de produção**
    - [x]  Todas as rotas principais retornam 200
    - [x]  Menu mobile adaptativo operando com correta visualização
    - [x]  Variáveis de `NEXTAUTH_URL` corretamente alinhadas com Vercel
    - [x]  Sem erros no console do browser ou build (Clean compilation)

---

## Resumo Geral

| Item | Descrição | Status | Depende de |
| --- | --- | --- | --- |
| 1B | Setup do Projeto | 🟢 | — |
| 1C | Banco + Prisma | 🟢 | 1B |
| 1D | Autenticação | 🟢 | 1C |
| 1E | CMS Interno | 🟢 | 1C · 1D · 1G |
| 1G | Email (Brevo) | 🟢 | 1D |
| 1H | Analytics (Posthog) | 🟢 | 1B |
| 1I | Páginas Públicas | 🟢 | 1C · 1D |
| 1J | Dashboard | 🟢 | 1C · 1D |
| 1K | Deploy + Domínio | 🟢 | Todos |

---

> **Regra para o agente:** Marcar subtask como concluída somente após todos os itens do checklist interno validados manualmente ou por teste automatizado. Nunca pular a validação final de cada item.
>

---

# TASKS.md — Fase 2: Dashboards de Liga

> **Versão:** 2.5 | **Status:** 🟢 Concluída | **MVP:** Brasileirão Série A\n> **Atualizado:** Maio 2026\n> **Notas:** Motor estatístico completo implementado. Filtro isolando dados apenas da temporada corrente adicionado para evitar contaminação por dados históricos na mesma collection.
> **Depende de:** Fase 1 (concluída)

## 2A — Schema e Modelagem (Normalizado) 🟢
- [x] 2A.1 — Adicionar enums CompetitionTier, MatchStatus, OddsType, PlayerPosition, etc.
- [x] 2A.2 — Criar modelos Competition e Season no Prisma
- [x] 2A.3 — Expandir Team com TeamAlias e TeamSeason
- [x] 2A.4 — Criar modelo Match e tabelas granulares MatchStats e MatchOdds
- [x] 2A.5 — Criar tabelas granulares Player, PlayerMatchStats e Shot
- [x] 2A.6 — Atualizar modelos MatchImport e ApiQuotaLog
- [x] 2A.7 — Adicionar relações no User (matchImports)
- [x] 2A.8 — Rodar migration para normalização do schema (Bloco 1-5)
- [x] 2A.9 — Migrar dados legados (Match e League) para o novo schema (Bloco 6)
- [x] 2A.10 — Verificar que tabelas legadas da Fase 1 não foram afetadas

## 2B — Engine de Cálculo Estatístico ⚪

### Ground Truth — Validação contra Planilha Legada

> **Referência:** docs/MODELOS_ESTATISTICOS.md seção 10 e planilha BRA1DASHv261.xlsx

#### - [x] Task 2B.0.1 — Criar arquivo de ground truth
- **Arquivo:** `__tests__/analytics/ground-truth/bra1-2026.ts`
- **Descrição:** Criar arquivo TypeScript exportando as constantes do ground truth do Brasileirão 2026
- **Conteúdo obrigatório:**
  - Constante `GROUND_TRUTH_BRA1_2026` com μ_h=1.57, μ_a=1.05, totalJogos=117
  - Array `CASOS_GROUND_TRUTH` com os 5 confrontos extraídos da planilha
  - Caso especial `ATHLETICO_VS_ATHLETICO` (auto-confronto da aba CS)
- **Validação:** arquivo importado nos testes 2B.0.2 e 2B.0.3 sem erros

#### - [x] Task 2B.0.2 — Teste de validação Poisson contra ground truth
- **Arquivo:** `__tests__/analytics/ground-truth/poisson.test.ts`
- **Descrição:** Implementar suíte de testes que valida o modelo Poisson contra o ground truth
- **Casos obrigatórios:**
  - Athletico-PR vs Athletico-PR: validar lambdas, matriz 11x11 (5 células-chave) e mercados (1X2, BTTS, O/U)
  - Os 5 confrontos do array CASOS_GROUND_TRUTH: validar lambdas e mercados principais
- **Tolerância:** conforme tabela 10.3 do MODELOS_ESTATISTICOS.md
- **Validação:** 100% dos testes passando

#### - [x] Task 2B.0.3 — Teste de regressão das forças por time
- **Arquivo:** `__tests__/analytics/ground-truth/forcas.test.ts`
- **Descrição:** Validar que o cálculo de FCAtC, FCDfC, FCAtV, FCDfV bate com os valores da planilha BDBRA1
- **Times mínimos:** Athletico-PR, Flamengo RJ, Cruzeiro, Palmeiras, Vasco
- **Tolerância:** < 0.02 absoluto
- **Validação:** 100% dos testes passando

#### - [x] Task 2B.0.4 — Documentar processo de atualização do ground truth
- **Arquivo:** `__tests__/analytics/ground-truth/README.md`
- **Descrição:** Documentar como atualizar o ground truth quando uma nova temporada for importada
- **Conteúdo:**
  - Passo a passo para extrair médias da liga via SQL
  - Como rodar os testes de regressão localmente
  - Quando atualizar (anualmente ao final de cada temporada)
- **Validação:** README acessível pelo time

- [x] 2B.1 — Implementar `lib/analytics/poisson.ts` (modelo padrão)
  - [x] 2B.1.1 — Validar matriz 11x11 do confronto Athletico-PR vs Athletico-PR contra a aba CS da planilha (5 células-chave, tolerância < 0.5%)
  - [x] 2B.1.2 — Validar mercados derivados (1X2, BTTS, O/U) dos 5 confrontos do CASOS_GROUND_TRUTH (tolerância < 1%)
- [x] 2B.2 — Implementar `lib/analytics/zero-inflated.ts` (ZIP)
- [x] 2B.3 — Implementar `lib/analytics/negative-binomial.ts`
- [x] 2B.4 — Implementar `lib/analytics/dixon-coles.ts` com tau + decay
- [x] 2B.5 — Implementar `lib/analytics/medias.ts` (médias, DP, CV)
  - [x] 2B.5.1 — Validar μ_h e μ_a calculados contra GROUND_TRUTH_BRA1_2026 (tolerância < 0.01)
  - [x] 2B.5.2 — Bloquear cálculo se liga tem < 20 jogos (lançar erro `INSUFFICIENT_LEAGUE_DATA`)
- [x] 2B.6 — Implementar `lib/analytics/forca-time.ts`
  - [x] 2B.6.1 — Implementar cálculo de MGC, MGSC, MGV, MGSV separados rigorosamente por mando
  - [x] 2B.6.2 — Implementar cálculo de FCAtC, FCDfC, FCAtV, FCDfV conforme seção 2.3 do MODELOS_ESTATISTICOS.md
  - [x] 2B.6.3 — Bloquear cálculo se time tem < 5 jogos casa OU < 5 jogos fora (lançar erro `INSUFFICIENT_TEAM_DATA`)
  - [x] 2B.6.4 — Validar forças do Athletico-PR contra ground truth (FCAtC=1.24, FCDfC=0.64, FCAtV=0.80, FCDfV=1.05)
  - [x] 2B.6.5 — Implementar cálculo de Dispersão (DP, CV) e Frequências Observadas (Over, BTTS) rigorosamente focados no mando
- [x] 2B.7 — Implementar `lib/analytics/mapa-valor.ts`
- [x] 2B.8 — Implementar `lib/analytics/ev-calculator.ts`
- [x] 2B.9 — Criar API unificada em `lib/analytics/index.ts`
- [x] 2B.10 — Escrever testes unitários validados contra BRA1DASHv261.xlsx

## 2C — Ingestão de Dados (Híbrida: API + CSV) ⚪

### Dependências entre subtasks
```
2C.1 (Client API)
  ├── 2C.2 (Rate Limiter) — dependência direta
  └── 2C.3 (Mappers)
        └── 2C.4 (Sync Engine)
              ├── 2C.5 (Rota Sync API)
              └── 2C.6 (Tela Sync Admin)
2C.7 (Parser CSV) — independente
2C.8 (Normalização nomes) — usado por 2C.3 e 2C.7
2C.9 (Quota Dashboard) — depende de 2C.2
2C.10 (Validação cruzada) — depende de 2C.5 e 2C.7
```

- [x] **2C.1 — Criar client TheStatsAPI**
  - [x] 2C.1.1 — Criar `lib/ingest/thestatsapi/client.ts` com singleton e Bearer auth
  - [x] 2C.1.2 — Implementar método `get<T>(path, params)` com tipagem genérica
  - [x] 2C.1.3 — Implementar método `getAllPages<T>(path)` com paginação automática
  - [x] 2C.1.4 — Implementar retry com exponential backoff em HTTP 429 (rate limited)
  - [x] 2C.1.5 — Adicionar `THESTATSAPI_KEY` e `THESTATSAPI_BASE_URL` ao `.env.example`

- [x] **2C.2 — Implementar rate limiter + quota tracking**
  - [x] 2C.2.1 — Criar `lib/ingest/thestatsapi/rate-limiter.ts` (token bucket, 30 req/min)
  - [x] 2C.2.2 — Integrar rate limiter no client (throttle automático)
  - [x] 2C.2.3 — Implementar logging de requests em `ApiQuotaLog` via Prisma
  - [x] 2C.2.4 — Implementar `getQuotaUsage(month)` para consulta do consumo
  - [x] 2C.2.5 — Implementar bloqueio automático quando quota atingir 100%
  - [x] 2C.2.6 — Implementar alerta quando quota atingir 90%

- [x] **2C.3 — Criar tipos e mappers**
  - [x] 2C.3.1 — Criar `lib/ingest/thestatsapi/types.ts` com interfaces da resposta da API
  - [x] 2C.3.2 — Criar `lib/ingest/thestatsapi/mappers.ts`
  - [x] 2C.3.3 — Implementar `mapApiMatchToPrisma()` — converte resposta da API para input Prisma
  - [x] 2C.3.4 — Implementar `extractOdds()` — extrai odds dos 4 bookmakers com prioridade Pinnacle
  - [x] 2C.3.5 — Implementar auto-preenchimento dos campos legados (`oddHome`, `oddDraw`, `oddAway`) a partir de Pinnacle

- [x] **2C.4 — Criar sync engine**
  - [x] 2C.4.1 — Criar `lib/ingest/sync-engine.ts`
  - [x] 2C.4.2 — Implementar sync FULL: busca todas as partidas com paginação → upsert Teams → upsert Matches → busca odds
  - [x] 2C.4.3 — Implementar sync INCREMENTAL: busca apenas partidas com data > último `syncedAt`
  - [x] 2C.4.4 — Implementar upsert por `externalId` como chave de deduplicação
  - [x] 2C.4.5 — Implementar busca de odds apenas para jogos que têm `odds_available=true` e odds ainda não salvas no banco
  - [x] 2C.4.6 — Implementar registro de `MatchImport` a cada sync com contadores (created/updated/skipped)
  - [x] 2C.4.7 — Implementar contagem de requests consumidos e retornar no `SyncResult`

- [x] **2C.5 — Criar rota de sync via API**
  - [x] 2C.5.1 — Criar `POST /api/admin/ligas/[slug]/sync`
  - [x] 2C.5.2 — Validar role ADMIN via `requireAuth()`
  - [x] 2C.5.3 — Aceitar body `{ mode: 'full' | 'incremental', includeOdds: boolean }`
  - [x] 2C.5.4 — Retornar `SyncResult` com estatísticas detalhadas
  - [x] 2C.5.5 — Retornar 429 se quota mensal esgotada

- [x] **2C.6 — Criar tela de sync admin**
  - [x] 2C.6.1 — Criar rota `/cms/ligas/sync`
  - [x] 2C.6.2 — Componente `SyncButton` com loading state e feedback de resultado
  - [x] 2C.6.3 — Toggle de modo (Full / Incremental)
  - [x] 2C.6.4 — Checkbox "Incluir Odds" (default: true)
  - [x] 2C.6.5 — Log de últimas sincronizações (últimos 10 MatchImport)
  - [x] 2C.6.6 — Exibir badge de quota no header da tela

- [x] **2C.7 — Parser CSV football-data (fallback)**
  - [x] 2C.7.1 — Instalar `papaparse` (com justificativa documentada)
  - [x] 2C.7.2 — Criar `lib/ingest/football-data/csv-parser.ts`
  - [x] 2C.7.3 — Implementar detecção dinâmica de colunas no header
  - [x] 2C.7.4 — Validar colunas obrigatórias (Date, HomeTeam, AwayTeam, FTHG, FTAG, FTR)
  - [x] 2C.7.5 — Mapear colunas desejáveis ausentes para `null`
  - [x] 2C.7.6 — Preencher `dataSource = FOOTBALL_DATA` nos registros importados
  - [x] 2C.7.7 — Criar rota `POST /api/admin/ligas/[slug]/importar`
  - [x] 2C.7.8 — Criar tela `/cms/ligas/importar` com upload e feedback (restrita a ADMIN)

- [x] **2C.8 — Normalização de nomes de time**
  - [x] 2C.8.1 — Criar `lib/ingest/team-normalizer.ts` com tabela de aliases do Brasileirão
  - [x] 2C.8.2 — Aplicar normalização no mapper da API e no parser CSV
  - [x] 2C.8.3 — Documentar divergências encontradas entre API e CSV

- [x] **2C.9 — Dashboard de quota**
  - [x] 2C.9.1 — Criar rota `GET /api/admin/quota`
  - [x] 2C.9.2 — Criar componente `QuotaDashboard` com barra de progresso
  - [x] 2C.9.3 — Integrar na tela `/cms/ligas/sync` e no header admin
  - [x] 2C.9.4 — Exibir breakdown por endpoint (matches, odds)

- [x] **2C.10 — Validação cruzada API vs CSV**
  - [x] 2C.10.1 — Importar Brasileirão 2026 via API (sync full)
  - [x] 2C.10.2 — Importar mesmo período via CSV do football-data
  - [x] 2C.10.3 — Comparar placares: confirmar 100% de match
  - [x] 2C.10.4 — Comparar odds: documentar divergências entre Pinnacle (API) e B365 (CSV)
  - [x] 2C.10.5 — Comparar nomes de time: ajustar tabela de aliases
  - [x] 2C.10.6 — Documentar resultado da validação em `docs/validacao-cruzada.md`

## 2D — Telas do Dashboard de Liga ⚪
- [x] 2D.1 — Criar rota `/dashboard/ligas` com grid de ligas
- [x] 2D.2 — Criar rota `/dashboard/ligas/[slug]` (Server Component base)
- [x] 2D.3 — Componente `SeletorConfronto` com filtros
- [x] 2D.4 — Componente `SeletorModelo` (toggle 4 modelos)
- [x] 2D.5 — Componente `PainelMedias`
- [x] 2D.6 — Componente `PainelMatrizPlacares` (grid 11x11)
- [x] 2D.7 — Componente `PainelMercados` (1X2, BTTS, O/U, AH)
- [x] 2D.8 — Componente `PainelMapaValor`
- [x] 2D.9 — Componente `PainelEvolucao` com Recharts
- [x] 2D.10 — Integração Cliente: troca de modelo recalcula painéis
- [x] 2D.11 — Adicionar tooltip educativo nos seletores de modelo (ZIP/NB/Dixon-Coles) explicando as evoluções em relação ao Poisson padrão (referência: seção 11 do MODELOS_ESTATISTICOS.md)
- [x] 2D.12 — Definir Poisson como modelo default no seletor (compatibilidade com planilha legada)
- [x] 2D.13 — Quando usuário selecionar NB e variância ≤ λ, exibir banner amarelo conforme seção 5.2 do MODELOS_ESTATISTICOS.md
- [x] 2D.14 — Componente `FiltroMes` (multi-select JAN..DEZ)
- [x] 2D.15 — Componente `FiltroFaixaOdds` (9 faixas com drag-select, portado do protótipo Brasil1)
- [x] 2D.16 — Componente `FiltroRodadas` (range slider de..até)
- [x] 2D.17 — Integrar todos os filtros no `SeletorConfronto` com state combinado
- [x] 2D.18 — Implementar modo AUTO no `SeletorModelo` (seleção via AIC como default)
- [x] 2D.19 — Implementar `rankearModelos()` em `lib/analytics/model-selector.ts`
- [x] 2D.20 — Componente `BadgeModeloAuto` (exibe modelo + nível de confiança)
- [x] 2D.21 — Toggle AUTO/MANUAL no `SeletorModelo` com transição visual
- [x] 2D.22 — Criar placeholder `/dashboard/analises` (nome provisório) com estrutura de abas vazia
- [x] 2D.24 — Expandir PainelMedias com sub-seções de Confiança (DP, CV) e Frequências Observadas
- [x] 2D.25 — Refatorar `PainelMedias` movendo as médias da liga para uma barra de cabeçalho global e compactando métricas em linha única.
- [x] 2D.26 — Alinhar `SeletorModelo` e `SeletorLambda` horizontalmente (grid 60/40) garantindo a mesma altura para os dois containers (`items-stretch`).
- [x] 2D.27 — Alinhar botões internos dos seletores sempre à base usando `mt-auto` e flex-grow.
- [x] 2D.28 — Ajustar orientação do título do eixo Y (Gols do Mandante) na matriz de placares para modo vertical (`writing-mode:vertical-rl`) com leitura bottom-to-top e remover setas indicativas.
- [x] 2D.29 — Criar `PainelOddsMercado` e rota API para busca automática das odds reais (Bet365 e Pinnacle).
- [x] 2D.30 — Integrar `PainelOddsMercado` com `PainelMercados` para recalcular EV% dinamicamente no frontend com suporte a fallback manual (`rawInputs`).
- [x] 2D.31 — Ajustar grid de visualização: proporção 50/50 (lg:col-span-6) para Matriz de Placares e Evolução de Gols.
- [x] 2D.32 — Adicionar abas de filtro (Ambos, Mandante, Visitante) no gráfico de Evolução de Gols.
- [x] 2D.33 — Reorganizar sidebar do dashboard (remoção do grupo CONTEÚDO, subir ANÁLISE ESPORTIVA, descer GESTÃO).
- [x] 2D.34 — Ajustar texto da seção Prova Social na Home de "Desde 2022" para "Desde 2019".
- [x] 2D.35 — Integração completa de Expected Goals (xG) no Painel de Médias (cálculos de dispersão e retorno na API).
- [x] 2D.36 — Refinamento de UI: seção de Confiança com métricas de Gols e xG lado a lado, e cabeçalho de médias da liga dividido em duas linhas distintas.
- [x] 2D.37 — Criação da API de Estatísticas (`/api/ligas/[slug]/estatisticas`) e do motor de agregação (`estatisticas-builder.ts`) para compilar MatchStats brutos em resumos por time.
- [x] 2D.38 — Implementação das novas abas de estatísticas detalhadas no Dashboard da Liga: Odds/Profit, Gols / xG / Fin., Escant. / Cartões / Faltas, e Over / Under.
- [x] 2D.39 — Integração de estatísticas de Half-Time (HT): adição de `hthg` e `htag` ao schema e ao motor analítico; inclusão de um quadro "Gols 1H" e totais nas abas estatísticas.
- [x] 2D.40 — Implementação do `PainelProjecaoHandicaps`: painel visual ao lado da Matriz de Placares com cálculos precisos de Win%, Push% e Odd Justa (EV=0) para as linhas asiáticas de Mandante, Visitante e Over Gols.

## 2E — Seed e Dados Iniciais ⚪
- [x] 2E.1 — Criar seed da liga Brasileirão A (`prisma/seed-leagues.ts`)
- [x] 2E.2 — Importar CSV inicial via tela admin
- [x] 2E.3 — Validar dados com Prisma Studio

## 2F — Validação Final Fase 2 ⚪
- [x] 2F.1 — Cálculos Poisson batem com a planilha (< 0.5% diferença)
- [x] 2F.2 — ZIP, NB e Dixon-Coles produzem resultados coerentes
- [x] 2F.3 — Tela carrega em < 2s com dados completos do Brasileirão
- [x] 2F.4 — Layout responsivo (mobile + desktop)
- [x] 2F.5 — Acesso liberado para qualquer autenticado (MEMBRO+)
- [x] 2F.6 — Importação de CSV restrita a ADMIN
- [x] 2F.7 — Build sem erros TypeScript ou ESLint
- [x] 2F.8 — Deploy em produção validado
- [x] 2F.9 — Parser tolera diferenças de tier sem quebrar
- [x] 2F.10 — `MatchImport` registra histórico completo de cada importação
- [x] 2F.11 — Client TheStatsAPI respeita rate limit de 30 req/min
- [x] 2F.12 — Quota mensal tracking funcional com alerta em 90%
- [x] 2F.13 — Sync incremental consome < 15 requests por rodada
- [x] 2F.14 — Dados da API e do CSV produzem resultados consistentes nos modelos
- [x] 2F.15 — Filtros de mês e faixa de odds funcionam corretamente
- [x] 2F.16 — Modo AUTO seleciona modelo via AIC e exibe badge de confiança
- [x] 2F.17 — Modo MANUAL permite override sem perda de estado dos filtros
- [x] 2F.18 — Placeholder "Análises" acessível na navegação

---

## Resumo Geral da Fase 2

| Item | Descrição | Status | Depende de |
|---|---|---|---|
| 2A | Schema e Modelagem | 🟢 | Fase 1 |
| 2B | Engine de Cálculo Estatístico | 🟢 | 2A |
| 2C | Ingestão de Dados (API + CSV) | 🟢 | 2A |
| 2D | Telas do Dashboard de Liga | 🟢 | 2B · 2C |
| 2E | Seed e Dados Iniciais | 🟢 | 2C |
| 2F | Validação Final Fase 2 | 🟢 | Todos |

---

# TASKS — Fase 3: Ferramentas Gratuitas (Migração Gemini)

> **Status:** 🟢 Concluída — migração, layout e paridade estatística finalizados
> **Ordem de implementação:** Validação e Risco → Over/Under Linhas → Over/Under 2.5 → Simulador de Distribuição

## Dependências entre Tasks

```
2B (Engine Fase 2 — poissonPmf, fatorial)
  └── 3A.3 (reutilizar funções)

3A (Setup + Estrutura)
  ├── 3B (Validação e Risco)
  ├── 3C (Over/Under Linhas)
  ├── 3D (Over/Under 2.5)
  └── 3E (Simulador de Distribuição)

3F (Grid + Sidebar) ← depende de 3B, 3C, 3D, 3E
3G (Validação Final) ← depende de todos
```

## 3A — Estrutura e Setup 🟢

- [x] **3A.1** — Criar estrutura de pastas `lib/ferramentas/` e `components/ferramentas/` conforme SPECS
- [x] **3A.2** — Criar schemas de validação Zod em `lib/validations/ferramentas.ts`
  - [x] Schema `validacaoRiscoSchema` com todos os campos e ranges
  - [x] Schema `overUnderLinhasSchema` com validação de odds (≥ 1.01) e linha âncora
  - [x] Schema `overUnder25Schema` com validação de odds (≥ 1.01)
  - [x] Schema `distribuicaoSchema` com ranges dos sliders
- [x] **3A.3** — Configurar módulo compartilhado de Poisson
  - [x] Se Fase 2 concluída: importar `poissonPmf` e `fatorial` de `lib/analytics/poisson.ts`
  - [x] Se não: criar `lib/ferramentas/shared/poisson.ts` com implementação + cache de fatorial + TODO migração
- [x] **3A.4** — Criar rotas de página:
  - [x] `app/(dashboard)/dashboard/ferramentas/page.tsx`
  - [x] `app/(dashboard)/dashboard/ferramentas/validacao-risco/page.tsx`
  - [x] `app/(dashboard)/dashboard/ferramentas/over-under-linhas/page.tsx` 🆕
  - [x] `app/(dashboard)/dashboard/ferramentas/over-under-25/page.tsx`
  - [x] `app/(dashboard)/dashboard/ferramentas/distribuicao/page.tsx`
- [x] **3A.5** — Atualizar sidebar do dashboard
  - [x] Renomear "Validação de Risco" → **"Validação e Risco"**
  - [x] Renomear "Cálculo Over/Under" → **"Over/Under 2.5"**
  - [x] Renomear "Distribuição AH" → **"Simulador de Distribuição"**
  - [x] Adicionar item **"Over/Under Linhas"** apontando para `/dashboard/ferramentas/over-under-linhas`
  - [x] Manter agrupamento visual sob header "FERRAMENTAS"
  - [x] Ordem na sidebar: Validação e Risco, Over/Under 2.5, Over/Under Linhas, Simulador de Distribuição

## 3B — Ferramenta: Validação e Risco (Monte Carlo) 🟢

- [x] **3B.1** — Implementar `lib/ferramentas/validacao-risco/types.ts`
  - [x] Interfaces: `MonteCarloInputs`, `MonteCarloResults`, `DrawdownBucket`, `PatrimonioPoint`
- [x] **3B.2** — Implementar `lib/ferramentas/validacao-risco/estatisticas.ts`
  - [x] Função `cumulativeNormal(z)` com coeficientes de Abramowitz & Stegun documentados
  - [x] Função `calcularPValue(prob, numBets, odds)`
  - [x] Função `calcularVolumeValidador(prob, odds, roi)`
  - [x] Função `calcularIntervaloConfianca(prob, odds, roi, numBets)`
- [x] **3B.3** — Implementar `lib/ferramentas/validacao-risco/monte-carlo.ts`
  - [x] Função `executarMonteCarlo(inputs)` — simulação completa
  - [x] Gerar histograma de drawdown (10 buckets)
  - [x] Gerar 12 curvas de patrimônio para visualização (amostrar a cada N bets)
  - [x] Calcular probLucro, survivalRate, avgMDD, worstDD
  - [x] Remover `setTimeout` artificial — execução direta
- [x] **3B.4** — Implementar componente `PainelEntradas.tsx`
  - [x] Converter inputs para `<Input>` shadcn/ui
  - [x] Slider de drawdown com `<Slider>` shadcn/ui (se disponível) ou input range estilizado
  - [x] Campo derivado `entradasPorMes` como `useMemo` (não `useEffect`)
  - [x] Validação visual (borda vermelha em inputs inválidos)
- [x] **3B.5** — Implementar componente `PainelResultados.tsx`
  - [x] 4 cards: Volume Validador, Prob. Lucro, Sobrevivência, P-Value
  - [x] Cores condicionais: verde se bom (>90%, <0.05), vermelho/laranja se ruim
  - [x] Painel ROI IC (pior/melhor caso)
  - [x] Card de lucro total estimado
- [x] **3B.6** — Implementar componente `CurvasPatrimonio.tsx`
  - [x] `<LineChart>` Recharts com 12 linhas
  - [x] Primeira curva: azul, strokeWidth 3
  - [x] Demais: cinza translúcido (opacity 0.3)
  - [x] `isAnimationActive={false}`
  - [x] Tooltip com estilo dark
- [x] **3B.7** — Implementar componente orquestrador `ValidacaoRiscoTool.tsx`
  - [x] Layout: `lg:grid-cols-12` (4+8)
  - [x] Estado vazio com CTA
  - [x] Botão "Simular X Cenários" usando `<Button>` shadcn
  - [x] Loading state com `isCalculating`
- [x] **3B.8** — Escrever testes unitários
  - [x] `__tests__/ferramentas/validacao-risco/estatisticas.test.ts`
  - [x] `__tests__/ferramentas/validacao-risco/monte-carlo.test.ts`
  - [x] Edge cases: banca 0, odds 1.01, ROI negativo, stake 100%

## 3C — Ferramenta: Over/Under Linhas (OmniProjector) 🟢

- [x] **3C.1** — Implementar `lib/ferramentas/over-under-linhas/types.ts`
  - [x] Interfaces: `AncoraInput`, `LinhaProjetada`, `ProjecaoStats`
- [x] **3C.2** — Implementar `lib/ferramentas/over-under-linhas/poisson-linhas.ts`
  - [x] Função `calcularProbUnderLinha(lambda, line)` com tratamento de inteiras, meias, quartos e três quartos
  - [x] Função `encontrarLambdaBisection(fairProbUnder, anchorLine, iterations=20)` — busca binária [0.1, 15]
  - [x] Usar `poissonPmf` do módulo compartilhado
- [x] **3C.3** — Implementar `lib/ferramentas/over-under-linhas/juice.ts`
  - [x] Função `extrairJuiceAncora(input)` — juice e fair probs
  - [x] Função `calcularTabelaProjecao(lambda, juiceBase, anchorLine)` — tabela completa
  - [x] Margem dinâmica: `juice + (distância_da_âncora * 0.5)`
  - [x] Odds piso: 1.01
- [x] **3C.4** — Implementar componente `InputsAncora.tsx`
  - [x] `<Select>` shadcn/ui para linha âncora (17 opções: 1.5 a 5.5)
  - [x] 2 `<Input>` para odds Under/Over
  - [x] Exibição de Juice e Lambda no header
- [x] **3C.5** — Implementar componente `TabelaProjecao.tsx`
  - [x] `<Table>` shadcn/ui
  - [x] Destaque visual na linha âncora (borda esquerda + fundo)
  - [x] Cores: Under em verde, Over em vermelho
  - [x] Status: "Âncora" vs "Projetada"
- [x] **3C.6** — Implementar componente orquestrador `OverUnderLinhasTool.tsx`
  - [x] Recálculo automático via `useMemo`
  - [x] Layout responsivo
- [x] **3C.7** — Escrever testes unitários
  - [x] `__tests__/ferramentas/over-under-linhas/poisson-linhas.test.ts`
  - [x] `__tests__/ferramentas/over-under-linhas/juice.test.ts`
  - [x] Testar: lambda com odds extremas, linhas inteiras vs quartos, âncora fora do range de projeção

## 3D — Ferramenta: Over/Under 2.5 🟢

- [x] **3D.1** — Implementar `lib/ferramentas/over-under-25/types.ts`
  - [x] Interfaces: `OddsReferencia25`, `LinhaCalculada25`, `MarketStats25`
- [x] **3D.2** — Implementar `lib/ferramentas/over-under-25/poisson-25.ts`
  - [x] Função `probUnder25(lambda)` — P(X≤2)
  - [x] Função `encontrarLambdaIterativo(fairProbUnder25)` — 10 iterações multiplicativas
  - [x] Usar `poissonPmf` do módulo compartilhado
- [x] **3D.3** — Implementar `lib/ferramentas/over-under-25/juice.ts`
  - [x] Função `extrairJuice25(refs)` — juice, fair probs, lambda
  - [x] Função `calcularLinhas25(lambda, juiceBase)` — tabela 10 linhas
  - [x] **Corrigir bug:** afastamento relativo à 2.5 (não 3.5)
  - [x] **Corrigir bug:** juice dinâmica baseada na distância da 2.5 (não 3.5)
  - [x] Documentar limitação de linhas de quartos como nota no código
- [x] **3D.4** — Implementar componente `InputsReferencia.tsx`
  - [x] 2 `<Input>` de odds (Under/Over 2.5)
  - [x] Exibição de Juice e Lambda
- [x] **3D.5** — Implementar componente `TabelaLinhas.tsx`
  - [x] `<Table>` shadcn/ui com destaque na linha 2.5
  - [x] Coluna de afastamento corrigida
- [x] **3D.6** — Implementar componente orquestrador `OverUnder25Tool.tsx`
  - [x] Recálculo automático via `useMemo`
  - [x] Layout responsivo
- [x] **3D.7** — Escrever testes unitários
  - [x] `__tests__/ferramentas/over-under-25/poisson-25.test.ts`
  - [x] `__tests__/ferramentas/over-under-25/juice.test.ts`
  - [x] Testar: odds padrão (3.30/1.33), odds extremas, lambda resultante

## 3E — Ferramenta: Simulador de Distribuição 🟢

- [x] **3E.1** — Implementar `lib/ferramentas/distribuicao/types.ts`
  - [x] Interfaces: `DistribuicaoParams`, `CurvePoint`, `MedidasCentrais`
- [x] **3E.2** — Implementar `lib/ferramentas/distribuicao/gram-charlier.ts`
  - [x] Função `calcularMediaReal(baseMean, skewness, stdDev)` — ajuste pela assimetria
  - [x] Função `gramCharlierPdf(x, mean, sd, skew, kurt)` — com clamp ≥ 0
  - [x] Função `gerarPontosCurva(mean, sd, skew, kurt)` — array com zonas σ
  - [x] Documentar fórmulas da série A de Gram-Charlier nos comentários
- [x] **3E.3** — Implementar `lib/ferramentas/distribuicao/medidas-centrais.ts`
  - [x] Função `calcularMedidasCentrais(mean, skew, sd)` — retorna moda e mediana
- [x] **3E.4** — Implementar componente `PainelParametros.tsx`
  - [x] 4 sliders com label e valor atual
  - [x] Legenda de cores (média/mediana/moda)
  - [x] **Converter para dark mode** — remover todos os estilos light do Gemini
- [x] **3E.5** — Implementar componente `GraficoCurva.tsx`
  - [x] `<ComposedChart>` Recharts com áreas (zonas σ) + linha principal
  - [x] 3 `<ReferenceLine>` para média, mediana e moda com labels
  - [x] Marcadores ±1σ no eixo X
  - [x] **Fundo dark** — converter `fill` das áreas para variações de `surface` com opacidade
  - [x] **Linha principal branca** — converter `stroke="#0f172a"` para `#ffffff` ou token
  - [x] **Grid lines dark** — converter `stroke="#f1f5f9"` para token `border`
- [x] **3E.6** — Implementar componente orquestrador `DistribuicaoTool.tsx`
  - [x] Layout: flex-row desktop (painel w-80 + gráfico flex-1), flex-col mobile
  - [x] Cards pedagógicos em grid 2 colunas abaixo do gráfico (dark mode)
  - [x] Badge "Amplitude Pico" no header
  - [x] Recálculo em tempo real via `useMemo`
- [x] **3E.7** — Escrever testes unitários
  - [x] `__tests__/ferramentas/distribuicao/gram-charlier.test.ts`
  - [x] `__tests__/ferramentas/distribuicao/medidas-centrais.test.ts`
  - [x] Testar: normal padrão (skew=0, kurt=3), extremos dos sliders, PDF nunca negativa

## 3F — Grid de Ferramentas e Navegação 🟢

- [x] **3F.1** — Implementar componente `FerramentasGrid.tsx`
  - [x] Grid responsivo com 4 cards `<Card>` shadcn/ui
  - [x] Ícones `lucide-react` por ferramenta (ShieldCheck, TrendingUp, Target, BarChart3)
  - [x] Hover effect e link para cada rota
- [x] **3F.2** — Atualizar bottom nav mobile (se aplicável)
  - [x] Garantir acesso ao grid de ferramentas via menu mobile

## 3G — Validação Final Fase 3 🟢

- [x] **3G.1** — 4 ferramentas funcionais e acessíveis via grid e sidebar
- [x] **3G.2** — Sidebar com labels corretos e item novo (Over/Under Linhas)
- [x] **3G.3** — Estilos 100% aderentes ao design system BDB (zero resquícios Gemini)
- [x] **3G.4** — Lógica de cálculo isolada em `lib/ferramentas/` com funções puras
- [x] **3G.5** — Testes unitários passando para todas as funções de cálculo
- [x] **3G.6** — Responsivo: mobile (375px) e desktop (1440px) validado
- [x] **3G.7** — Acesso liberado para qualquer autenticado (MEMBRO+)
- [x] **3G.8** — Sem persistência (100% client-side)
- [x] **3G.9** — Build sem erros TypeScript strict ou ESLint
- [x] **3G.10** — Deploy em produção validado

# TASKS — Onda A: Estrutura de Cursos e BDB Bônus (Gamificação)

> **Status:** 🟢 Concluída — Cursos e BDB Bônus implementados com testes de integração e segurança.
> **Notas:** Motor de gamificação, loja de recompensas, modelos de cursos, dashboards administrativos no CMS e testes integrados no Docker concluídos.

## Subtasks

- [x] **A.1 — Modelagem do Banco de Dados (Prisma Schema)**
  - [x] Atualizar enum `Plan` para `{ FREE, VIP_BASICO, VIP_PRO }` no [schema.prisma](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/prisma/schema.prisma) e migrar dados legados
  - [x] Adicionar enums `CourseAccess` e `PointTxType`
  - [x] Criar modelos `Course`, `Module`, `Lesson`, `LessonProgress`, `Quiz` e `QuizAttempt` no [schema.prisma](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/prisma/schema.prisma)
  - [x] Criar modelos `PointRule`, `PointTransaction`, `Coupon` e `RewardOption`
  - [x] Rodar migrations e validar no banco de dados local/produção

- [x] **A.2 — Camada de Domínio de Pontos (lib/points/)**
  - [x] Implementar configurações e limites de plano em [config.ts](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/lib/points/config.ts)
  - [x] Implementar cálculo de saldo por Event Sourcing em [balance.ts](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/lib/points/balance.ts)
  - [x] Implementar lógica FIFO para expiração de pontos em [fifo.ts](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/lib/points/fifo.ts) e [expire.ts](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/lib/points/expire.ts)
  - [x] Implementar concessão de pontos com controle de cap e idempotência em [award.ts](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/lib/points/award.ts)
  - [x] Implementar resgate de cupons de recompensa com controle de estoque e saldo em [redeem.ts](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/lib/points/redeem.ts)
  - [x] Implementar cálculo de status móvel de fidelidade de 12 meses em [status.ts](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/lib/points/status.ts)

- [x] **A.3 — Rotas de API e Server Actions**
  - [x] Criar endpoints `/api/points/balance`, `/api/points/history`, `/api/points/redeem` e `/api/points/rewards`
  - [x] Implementar server action `awardOnAccountEvents` em [auth.ts](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/lib/points/actions/auth.ts)
  - [x] Conectar triggers de concessão de pontos à criação de conta (`CRIAR_CONTA`) e completação de perfil (`COMPLETAR_PERFIL`)

- [x] **A.4 — Painéis e Interface do Usuário (UI/UX)**
  - [x] Desenvolver o dashboard de pontos do usuário em [page.tsx](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/app/(dashboard)/dashboard/bdb-points/page.tsx) (saldo, progresso de nível, recompensas e histórico)
  - [x] Desenvolver o CMS de administração de pontos em [page.tsx](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/app/(cms)/cms/admin/points/page.tsx) (CRUD de regras, recompensas, ajuste manual e auditoria)
  - [x] Desenvolver o CMS de administração de cursos em [page.tsx](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/app/(cms)/cms/admin/courses/page.tsx) (CRUD de cursos, módulos, aulas e quizzes)
  - [x] Atualizar sidebar de navegação do usuário e painel administrativo do CMS

- [x] **A.5 — Segurança e Isolamento de Testes**
  - [x] Desenvolver script de limpeza transacional para resíduos em produção e deletar a PointRule `TEST_ACTION` com segurança
  - [x] Configurar Docker MySQL de testes isolado na porta `3307` e criar arquivo `.env.test`
  - [x] Implementar trava anti-produção em [vitest.setup.ts](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/vitest.setup.ts) e configurar [vitest.config.ts](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/vitest.config.ts) para carregar `.env.test`
  - [x] Refatorar testes unitários e de integração de domínio para rodar de forma isolada e paralela
  - [x] Rodar suíte completa de testes de integração e validar build de produção sem erros

---

# TASKS — Fase 4: Multi-Liga + Pagamentos
> **Status:** ⚪ Pendente — depende da Fase 2

# TASKS — Fase 5: Curso + Backtest
> **Status:** 🟡 Em Progresso (Onda A - Cursos & Gamificação Concluída)

## Onda A: Cursos & Gamificação — Concluída em 13/06/2026

- [x] **A.6 — Dicionário do Mercado (Glossário)**
  - [x] Criar base de dados tipada de 99 termos em [glossary.ts](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/lib/courses/glossary.ts)
  - [x] Integrar card "Dicionário do Mercado" na timeline do player [CoursePlayerClient.tsx](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/app/%28dashboard%29/curso/CoursePlayerClient.tsx)
  - [x] Implementar busca em tempo real e filtros de categorias (Mercado, Estatística, Risco, Operação, Modelos)
- [x] **A.7 — Lógica de Player e Navegação**
  - [x] Implementar a inicialização baseada no histórico de progresso do aluno (última aula vista ou primeira aula)
  - [x] Implementar botões de navegação linear ("Aula Anterior" e "Próxima Aula") respeitando a grade
  - [x] Mudar o nome do link da sidebar de "Aulas" para "Vitrine de Cursos"
- [x] **A.8 — Conclusão Automática e Gamificação**
  - [x] Remover a opção manual de marcar como concluída no frontend
  - [x] Adicionar o trigger automático de conclusão ao atingir >= 90% de visualização
  - [x] Conectar o trigger automático com o ganho de 50 BDB Points e chave de idempotência exclusiva

# TASKS — Fase 6: Automações
> **Status:** ⚪ Pendente — depende da Fase 5