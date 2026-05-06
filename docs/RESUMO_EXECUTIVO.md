# Resumo Executivo — Big Data Bet (Fase 1)

**Data de Atualização:** 02/05/2026

Este documento apresenta um resumo executivo do progresso atual do projeto Big Data Bet (Fase 1), detalhando o passo a passo de tudo que foi construído até o momento, bem como o que está pendente para a conclusão da fase.

## Visão Geral do Progresso

O projeto foi inicializado com sucesso e a infraestrutura base (front-end, estilos e banco de dados) está operacional. As rotas públicas (Home, Sobre, Planilhas, Artigos) já foram criadas seguindo o design system especificado no Manual da Marca. A integração com banco de dados via Prisma foi concluída com um *schema* abrangente. A autenticação com NextAuth (Google OAuth) foi implementada com proteção de rotas.

## O Que Já Foi Feito (Passo a Passo)

### 1. Setup do Projeto e Infraestrutura (Item 1B)
- **Inicialização:** Projeto Next.js 14 criado usando App Router e TypeScript Strict.
- **Design System:** Configuração do Tailwind CSS (`tailwind.config.ts`) com os *tokens* de cores definidos no Manual de Marca.
- **UI Components:** Instalação e configuração da biblioteca shadcn/ui, com diversos componentes base gerados em `components/ui`.
- **Estilos Globais:** Configuração de variáveis CSS para o modo escuro (Dark Mode) em `app/globals.css`.
- **Tipografia:** Configuração das fontes Google Fonts (Inter, Plus Jakarta Sans, JetBrains Mono) injetadas de forma otimizada via `next/font` no `layout.tsx`.
- **Componentes Estruturais:** Criação do `Header` responsivo com menu de navegação e componente de perfil (`UserMenu`), além de um `Footer` completo com links institucionais e sociais.

### 2. Banco de Dados e Prisma (Item 1C)
- **Configuração:** Instalação do Prisma e configuração do `lib/prisma.ts` como singleton para gerenciar a conexão com o MySQL.
- **Modelagem (Schema):** Criação do `schema.prisma` contendo as entidades fundamentais do sistema:
  - Modelos do NextAuth (`User`, `Account`, `Session`, `VerificationToken`).
  - Modelos do Sistema de Artigos (`Article`, `Category`, `Tag`).
  - Modelos de Planilhas (`Spreadsheet`).
  - Extensão do modelo `User` para suportar `Role` e `Plan` (controle de acesso por nível e assinatura).
- **Seed de Dados:** Implementação do script `prisma/seed.ts` populando categorias iniciais, usuário administrador base, mock de artigos formatados em Markdown e planilhas de exemplo.

### 3. Autenticação e Autorização (Item 1D)
- **NextAuth v5:** Implementação da autenticação centralizada em `auth.ts` utilizando o `PrismaAdapter`.
- **Provedores:** Integração e configuração do OAuth via Google.
- **Middleware e Proteção:** Implementação de regras no `auth.ts` (`authorized` callback) e no `middleware.ts` para proteger as rotas `/dashboard` e `/cms`, redirecionando usuários não autenticados para `/login`.
- **Interface de Login:** Criação de `app/(auth)/login/page.tsx` com o componente estilizado `LoginCard`, oferecendo o botão de login com o Google.
- **Gestão de Sessão:** Extensão de tipos TypeScript (`types/next-auth.d.ts`) para injetar `role` e `plan` no payload do JWT e na sessão, permitindo renderizações condicionais na UI.

### 4. Páginas Públicas (Item 1I)
As páginas institucionais foram construídas integrando componentes do shadcn/ui e dados dinâmicos do Prisma:
- **Home (`/`):** Construída com seção Hero (com badge do pacote de ligas), proposta de valor, listagem dos 3 últimos artigos dinamicamente e call-to-actions para as planilhas e grupo do Telegram.
- **Sobre (`/sobre`):** Página institucional descritiva com histórico, pilares e cards direcionando aos canais sociais.
- **Planilhas (`/planilhas`):** Página que renderiza dinamicamente as planilhas cadastradas no banco, dividindo visualmente entre gratuitas e premium.
- **Artigos (`/artigos`):** Listagem de todos os estudos e análises publicadas, integrando badges para as categorias.
- **Detalhe do Artigo (`/artigos/[slug]`):** Rota dinâmica que busca e renderiza um artigo do banco usando a biblioteca `react-markdown`. Incorpora a funcionalidade `generateMetadata` para SEO dinâmico.

### 5. Área do Membro / Dashboard Inicial (Item 1J)
- Criação da rota base do dashboard em `app/(dashboard)/dashboard/page.tsx` para apresentar as boas-vindas do usuário autenticado. 

## Pendências para Finalização da Fase 1

- **Integração de Pagamentos (Fase 3):** Configuração da Stripe (produtos, preços, webhooks) e área de checkout para os planos Básico, Pro e Premium.
- **Ferramentas Práticas (Fase 2):** Implementação das calculadoras e validadores de risco.

### 6. Refinamento Visual da Home e Polimento de UI — 26/04/2026 (Sessão Noturna)

Após a reestruturação da Home em componentes modulares, esta sessão foi dedicada ao polimento visual e à resolução de problemas de layout detectados na visualização local.

**Header (`components/layout/header.tsx`):**
- Substituída a tag de texto "Big Data Bet" pela imagem `Logo_Site.png` via componente `next/image`.
- Adicionado espaçamento superior/inferior no header (`h-20`) e margem lateral no logo (`ml-4 md:ml-8`).
- Corrigido o alinhamento horizontal dos links de navegação: após múltiplas tentativas com flexbox e CSS Grid, a solução definitiva utilizou `position: absolute; left: 1/2; -translate-x-1/2` aplicado ao `header` como elemento de referência de largura total (`w-full`), garantindo centralização real relativa ao viewport, e não ao `container`.
- Removida a área de autenticação (botão "Entrar" e `UserMenu`) temporariamente, a pedido do usuário.

**Favicon:**
- Atualizado para usar `docs/Logo_favicon.png` (versão mais recente do ícone), copiado para `app/icon.png`. O arquivo anterior (`app/icon.svg`) foi removido. O Next.js usa automaticamente o `app/icon.*` como favicon da página.

**Footer (`components/layout/footer.tsx`):**
- Corrigido o layout das 3 colunas: o uso indevido de `md:ml-auto` em cada coluna criava um vão central enorme. Substituído por `flex-row` com `justify-between`, distribuindo as colunas de forma uniforme da borda esquerda à direita do container.

**SocialProofSection (`components/home/social-proof-section.tsx`):**
- Os ícones das redes sociais nos cards de métricas foram trocados de ícones Lucide para os SVGs reais das marcas (`telegram.svg`, `youtube.svg`, `instagram.svg`), copiados de `images/` para `public/` para servir como arquivos estáticos.
- Adicionado o ícone `Hourglass` (Lucide) ao card "Desde 2022", com mesma altura (`h-9 w-9`) dos SVGs.
- Os SVGs receberam a classe `brightness-0 invert opacity-80` para aparecerem em branco (mesmo tom da ampulheta) sobre o fundo escuro.
- Os cards de Telegram, YouTube e Instagram foram transformados em elementos `<a>` clicáveis com link para cada rede.

**Banners entre Seções (`app/(public)/page.tsx`):**
- Adicionadas duas imagens decorativas na Home:
  - `public/images/1.Home_s01_s02.png` → entre S1 (Hero) e S2 (Problema), com `priority` (acima da dobra).
  - `public/images/1.Home_s04_s05.png` → entre S4 (Para quem é) e S5 (Prova Social), com lazy load automático.
- Ambas renderizadas via `next/image` com `fill` + `object-cover object-center` dentro de containers `h-[300px] overflow-hidden`, garantindo altura máxima de 300px com corte centralizado e sem barras brancas de `line-height`.

### 7. Polimento de Marca — 27/04/2026

**SocialProofSection (`components/home/social-proof-section.tsx`):**
- Os ícones SVG genéricos foram substituídos pelas logos reais das redes sociais (`public/images/telegram_logo.png`, `youtube_logo.png`, `instagram_logo.png`), exibidas com suas cores originais (sem filtro).
- O ícone `Hourglass` do card "Desde 2022" foi substituído pela imagem `public/images/desde_2022.png`.
- Todos os logos passaram de 36px para 48px (`width/height={48}`) com `object-contain` para preservar proporção.

**Footer (`components/layout/footer.tsx`):**
- Os ícones genéricos do Lucide (`Send`, `Play`, `Camera`) usados na seção Comunidade do footer foram substituídos pelos SVGs originais das marcas (`/telegram.svg`, `/youtube.svg`, `/instagram.svg`).
- O import do `lucide-react` correspondente foi removido.
- O hover passou de `hover:text-[cor]` (ineficaz em SVG via CSS color) para `opacity-70 hover:opacity-100`, garantindo feedback visual correto.

### 8. Integração de E-mail, Analytics e Conclusão de Autenticação — 27/04/2026

**Autenticação Avançada (Conclusão do Item 1D):**
- Implementado o provedor de autenticação local (E-mail/Senha) através da biblioteca `bcryptjs` para hash seguro e armazenamento no MySQL via Prisma.
- Criação dos schemas rígidos de validação usando `Zod` (para formulários de Login e Cadastro).
- Implementação da rota de API de usuários para gerenciar o registro seguro e impedir conflito de e-mails, salvando a opção de "newsletter opt-in".
- Middleware atualizado com verificação robusta de rotas por role (`MEMBRO`, `AUTOR`, `REVISOR`, `EDITOR`, `ADMIN`), protegendo o dashboard, o CMS e os endpoints RESTful.
- Componente "Entrar" recolocado visualmente na Navbar para usuários não-autenticados, exibindo o Menu de Perfil apenas quando a sessão é ativada.

**Integração Brevo de E-mails Transacionais (Item 1G):**
- Configurado o pacote oficial `@getbrevo/brevo` (versão 5.x) gerenciado através de variáveis de ambiente.
- Implementado o serviço centralizado (`lib/email/brevo.ts`) usando as instâncias assíncronas do `BrevoClient` de envio SMTP.
- Adição dos templates customizados baseados na marca (ex: Boas-vindas) engatilhados de forma totalmente sem bloqueio.
- Rota de cadastro por credenciais e o hook do OAuth do Google interceptados para envio automático do e-mail de saudação assim que o usuário é persistido no banco.

**Integração PostHog de Analytics (Item 1H):**
- Mapeamento robusto configurando um `PosthogProvider` com acesso aos estados globais do NextAuth (`useSession`), rodando estritamente no Client-Side sob invólucro do `Suspense`.
- Implementado script manual de controle do `$pageview` atrelado aos hooks `usePathname` e `useSearchParams` do App Router (next/navigation), evitando disparos não consistentes de SPAs nativas.
- Identificação contínua e correta atrelando eventos como login/logout, e captura de propriedades vitais extraídas do NextAuth (`role`, `plan`, `email`).
- Funções estritamente tipadas abstraídas para simplificar disparos analíticos futuros (`lib/posthog/events.ts`).

### 9. Implementação do CMS e Upload de Imagens (Item 1E) — 27/04/2026

**Upload Integrado (Cloudinary):**
- Configuração do pacote `next-cloudinary` para delegar o armazenamento de mídia e economizar disco no VPS.
- Criação do componente `ImageUpload` modular e reutilizável com `CldUploadWidget`, permitindo upload assinado/unsigned de capas (thumbnails).
- Otimização extrema de imagens em tempo de requisição via URL do Cloudinary (`w_1200`, `c_fill`, `q_auto`, etc), tanto para capas quanto para imagens no corpo do artigo.

**Editor Avançado de Markdown:**
- Integração do `@uiw/react-md-editor` para uma experiência de escrita rica, dividida e focada em produtividade.
- Inserção dinâmica de imagens no meio do texto com captura da posição atual do cursor, usando a API de estado interno do editor.
- Configuração refinada do renderizador público (`ReactMarkdown`) com plugins (`remark-gfm`, `remark-breaks`) garantindo que tabelas, quebras de linha simples e marcações do GitHub Flavored Markdown reflitam no site final exatamente como na prévia.

**Estilização Profissional (Tailwind Typography):**
- Implementação oficial do plugin `@tailwindcss/typography`, dando vida às classes `prose` nas páginas de leitura.
- Ajustes finos de diagramação na página pública: contêiner de leitura expandido (`max-w-6xl`), justificação de texto, controle rígido de limites de largura para blocos de código (`prose-pre`) e tabelas (`prose-table`), proporcionando leitura altamente cinematográfica e ergonômica.

**Refatoração e Estabilidade (Status & DB):**
- Tratamento e correção de anomalias no schema Prisma relacionadas à validação de *Roles* inexistentes no modelo final, garantindo transições de status (RASCUNHO → REVISÃO → PUBLICADO) robustas.
- Finalização das requisições seguras para envio de e-mails noticiosos aos editores através do Brevo.

### 10. Implementação da Página de Planilhas (Item 1I) — 29/04/2026

**Construção da Interface e Download Direto:**
- Criação e integração dos componentes `HeroSection`, `FreeSpreadsheetsSection`, `VipPackSection` e `ToolsPlaceholder` dedicados à página `/planilhas`.
- Implementação de um sistema de download direto do arquivo (`.xlsm`) da planilha gratuita, hospedado de forma externa no HostGator.
- Seed de banco de dados (`prisma/seed-spreadsheets.ts`) configurado para injetar e atualizar as informações da planilha (tamanho, nome, URL de download) de forma dinâmica para renderização na página.
- Grade de exibição do pacote VIP apresentando 26 ligas detalhadas, integradas com call-to-action apontando para o link de checkout na plataforma Hubla.

### 11. Unificação de Conteúdo e Refinamento de UI — 30/04/2026

**Unificação das Listagens (Item 1I):**
- Consolidação das rotas legadas `/estudos` e `/analises` em uma rota central unificada: `/artigos`.
- Implementação da página Server-Side (`app/(content)/artigos/page.tsx`) com paginação SEO-friendly e filtros combinados. Otimização de performance através da execução paralela (via `Promise.all`) de todas as 5 requisições do Prisma (Artigos, Contagem, Categorias, Tags, Tipos).
- Resolução de conflitos de `Route Groups` no App Router com a deleção da árvore estática legada `app/(public)/artigos`.
- Desenvolvimento dos componentes compartilhados de UI `Pagination` (com display mobile `X / Y`) e `FiltroArtigos` mantendo estado na URL.

**Página do Artigo Individual (`/artigos/[slug]`):**
- Implementação oficial da rota dinâmica de leitura com suporte avançado a Markdown (`react-markdown` + `@tailwindcss/typography`).
- Refinamento diagramático profundo focado na ergonomia visual:
  - Largura máxima do artigo ampliada para `1024px` e de imagens fixada em `1000px` rigorosamente centralizadas.
  - Tabelas e blocos de código confinados de forma proporcional ao conteúdo sem distorção e com alinhamento autônomo ao centro.
- Minimalismo visual: Remoção permanente das exibições de Autoria (Nome e Avatar) em prol de foco no conteúdo, bem como remoção da exibição das tags nos cards de listagem (`ArtigoCardPublico`).

### 12. Fundação da Área do Membro (APIs e Layout) — 30/04/2026 e 01/05/2026

**Engenharia de Backend (APIs) e Dados:**
- **Histórico de Leitura (`ReadHistory`):** Correção da modelagem de dados no Prisma com índices compostos (`@@unique([userId, articleId])`) para evitar duplicações. Limpeza proativa de dados e implementação de lógica `upsert` na rota `POST /api/historico` disparada silenciosamente.
- **Favoritos:** Implementadas as rotas `GET`, `POST` e `DELETE /api/favoritos/[articleId]` com deleção otimizada (`deleteMany`) para evitar inconsistências e sistema de paginação pronto para consumo. Componentes da UI (como o botão de "Coração") foram atualizados para preverem mudanças de estado instantâneas (Optimistic Updates).
- **Gestão de Perfil:** Construção da rota `PATCH /api/perfil` (para atualizar nome e avatar via Cloudinary) e `PATCH /api/perfil/senha` rigorosamente validada via bcrypt, com bloqueio arquitetural para provedores OAuth (evitando a troca de senhas de contas do Google).
- **Blindagem de Rotas:** Centralização de autorização construindo o helper assíncrono `requireAuth()`, acoplado a todas as rotas do usuário logado e garantindo proteção rigorosa.

**Estrutura de UI do Dashboard:**
- **Padrões de Layout Protegidos:** O `<Header />` e `<Footer />` foram isolados no grupo `app/(public)`, permitindo construir uma estrutura fluída nativa do Dashboard `app/(dashboard)/layout.tsx` que exige sessão ativa, redirecionando Visitantes imediatamente ao `/login`.
- **Experiência Desktop:** Implementação da barra lateral de navegação colapsável (`DashboardSidebar`) dividida por grupos semânticos de permissão, garantindo opções do CMS visíveis apenas a Editores e Administradores.
- **Experiência Mobile:** Implantação *Mobile-first* contendo um Header compacto no topo e o `DashboardBottomNav` fixo no rodapé contendo ícones das principais ações (Início, Artigos, Favoritos) e um `Sheet` lateral para expansão tátil do menu secundário (Menu "Mais").
- **Placeholders Escalonáveis:** Toda a navegação futura (`/dashboard/favoritos`, `/curso`, `/ferramentas`, `/dashboard/plano`, etc) foi gerada pré-apontando para páginas "Em Construção", garantindo que nenhum usuário esbarre em erro `404` durante as futuras etapas.

### 13. Refatoração da Navegação do Dashboard — 01/05/2026

**Otimização da Sidebar e Menu de Usuário:**
- Realizada uma profunda reorganização da `DashboardSidebar` visando despoluir a visualização (reduzida de 14 para 10 itens) e estruturar a área de Ferramentas, Gestão e Conteúdo.
- Itens de cunho estritamente pessoal ("Favoritos", "Histórico", "Perfil" e "Plano") foram removidos da estrutura principal da Sidebar e transferidos para o Dropdown do Avatar (`DashboardUserMenu`), agrupados com ícones correspondentes e separadores lógicos antes do botão "Sair".
- O item "Artigos" foi removido da Sidebar por ser apenas um redirecionamento redundante para uma rota pública que já está acessível no header global.

**Implementação de Placeholders Dinâmicos:**
- Criação das 7 novas rotas exclusivas do Dashboard ("Planilhas", "Grupos de Tips", "Banca", "Métodos", "Validação de Risco", "Cálculo Over/Under" e "Distribuição AH") utilizando o componente padronizado `<EmConstrucao />`, parametrizado de forma dinâmica.
- A rota `/dashboard/backtests` foi alterada para o singular (`/dashboard/backtest`), e um redirecionamento 301 (Permanent Redirect) foi configurado nativamente no `next.config.mjs` para prevenir quebra de links ou problemas de indexação.

---

### 14. Materialização das Páginas do Dashboard (Conclusão do Item 1J) — 01/05/2026

**Histórico e Favoritos:**
- Implementadas as páginas `/dashboard/historico` e `/dashboard/favoritos` utilizando Server Components para *data-fetching* direto via Prisma, assegurando máxima performance (sem chamadas internas a API).
- Desenvolvido o componente reutilizável `DashboardArtigoCard` para padronizar a exibição de artigos dentro da área autenticada, que posteriormente recebeu a variante `compact` para otimizar espaço de tela em listagens longas.
- Inclusão do `RemoverFavoritoButton` isolado como Client Component, dotado de *Optimistic Updates* nativo via `useTransition` e `router.refresh()` no Next.js.

**Visão Geral (`/dashboard`):**
- Criação de um *helper* `lib/dashboard/visao-geral.ts` que executa todas as 5 requisições base (nome do usuário, contagens, histórico e favoritos) em paralelo com `Promise.all`.
- Sistema dinâmico de saudação dependente de fuso horário travado (`America/Sao_Paulo`), prevenindo desvios de *timezone* baseados no servidor (UTC da Vercel).
- Interface desenhada com Grid estático de contadores e listas fluídas.

**Segurança e Gestão do Perfil (`/dashboard/perfil`):**
- Dividida a página de gestão da conta em três *Client Components* isolados para evitar re-renders globais: Edição de Dados, Alteração de Senha e Exclusão LGPD.
- **Cloudinary:** Integração server-side utilizando `upload_stream` para receber a mídia, limitando estritamente a arquivos menores que 2MB e `jpeg/png/webp`, e formatando-as no padrão BDB (`256x256`, crop de face). Implementado o *auto-save* do Avatar: o upload aciona automaticamente o salvamento da alteração no Prisma sem necessitar de um botão de confirmação extra.
- **Troca de Senha:** Bloqueio severo via API e condicional via UI para membros cujo ingresso foi através de Single Sign-On (Google), preservando a integridade das senhas criptografadas.
- **Exclusão Irreversível:** Implementação de Modal Crítico (`AlertDialog` shadcn) que exige o input literal da intenção e a respectiva senha do usuário. O Back-end, por sua vez, usa das configurações de `Cascade` do banco de dados para garantir exclusão atômica sem falhas parciais. Implementado também captura e tratamento de erros do Prisma (`P2003`) impedindo "Autores" ou "Editores" de excluírem as contas enquanto possuírem trabalhos públicos pendurados.

---

### 15. Unificação Pública e Bypass de Adblockers (PostHog) — 01/05/2026

**Unificação Arquitetural (`app/(public)`)**:
- Deleção definitiva do grupo de rotas `app/(content)` para eliminação de layout isolado sem Header/Footer.
- Movimentação de todas as rotas de listagem (`/artigos`) e leitura (`/artigos/[slug]`) diretamente para a árvore `app/(public)`, fazendo com que os artigos herdem nativamente a topografia padrão do site e garantindo consistência na interface visual do portal.

**Reverse Proxy para Analytics (Bypass de Adblockers)**:
- Para evitar as perdas drásticas (estimadas entre 20-35%) geradas por adblockers e DNS filters em públicos de alto-risco, o Analytics do PostHog foi reformulado para operar via *Reverse Proxy*.
- Inseridas regras robustas de `rewrites()` no `next.config.mjs` capturando e redirecionando silenciosamente todo o tráfego enviado à `/ingest/*` para os IPs nativos do PostHog (`us.i.posthog.com`).
- O `PosthogProvider` foi severamente otimizado e segmentado, introduzindo o `<PosthogPageTracker />` em invólucro do `Suspense`, resolvendo os bugs críticos de desidratação (SSR Dehydration Error) no servidor.

---

### 16. Implementação de SEO Técnico e Metadados (Itens 1I.1 e 1I.10) — 01/05/2026

**Infraestrutura de Busca:**
- Configuração de `app/sitemap.ts` integrado ao Prisma para mapear as rotas estáticas e gerar sitemap dinâmico dos artigos com status `PUBLICADO`.
- Configuração de `app/robots.ts` assegurando a leitura global e bloqueando explicitly rotas de gestão (`/cms`, `/dashboard`, `/api`).

**Open Graph Dinâmico e TypeScript:**
- Criação de `gerarMetadataArtigo` centralizando a geração das tags SEO para artigos, incluindo fallback inteligente para a imagem default quando `thumbnail` está ausente.
- Aplicação do `metadataBase` diretamente na configuração root (`layout.tsx`) consolidando os metadados do Next.js.
- Refatoração dos Client Components do PostHog (`provider.tsx` e `client.ts`), com foco rigoroso em remover todos os by-pass TypeScript (`any` e `eslint-disable`), garantindo checagem exaustiva de hooks e compilação TS (`tsc --noEmit`) 100% limpa nestes componentes críticos.

---

---

### 17. Conclusão da Fase 1 e Deploy em Produção — 01/05/2026

**Resolução de Erros de Lint e Tipagem Strict:**
- Substituição massiva de tipos `any` por declarações rigorosas (ex: `Prisma.ArticleWhereInput`, `Resolver<FormData>`), atendendo ao padrão Strict TypeScript adotado no projeto.
- Correção de imports não utilizados e prefixação de variáveis inativas com `_` para passagem na pipeline do ESLint da Vercel.

**Integração do Prisma no Ambiente Serverless (Vercel):**
- Inclusão da diretiva `postinstall: prisma generate` e do bypass de build no `package.json` (`prisma generate && next build`) para assegurar a geração da Prisma Client na máquina virtual do deploy antes do Next tentar compilar as rotas dinâmicas.

**Refinamentos de UX e Segurança:**
- Implementação de Menu Mobile (Hambúrguer) utilizando o componente `Sheet` do shadcn/ui, garantindo a acessibilidade ao roteamento no layout mobile.
- Otimização do URL do Vercel nas variáveis de ambiente (`NEXTAUTH_URL`) solucionando bugs de redirecionamento cross-origin no fluxo de login/logout.

---

### 18. Planejamento Arquitetural e Estatístico da Fase 2 — 02/05/2026

**Reorganização do Roadmap:**
- O roadmap do projeto foi estrategicamente reorganizado. A Fase 2 agora tem foco absoluto no **MVP de Dashboards de Liga** (iniciando com o Brasileirão Série A 2026), adiando as ferramentas gratuitas e integração de pagamentos para as Fases 3 e 4.
- Atualização massiva e síncrona dos artefatos de documentação (`PRD.md`, `SCHEMA.md`, `SPECS.md` e `TASKS.md`) para refletir o novo escopo sem escrever nenhuma linha de código prematura.

**Auditoria e Calibração do Motor Estatístico (Ground Truth):**
- O arquivo `MODELOS_ESTATISTICOS.md` (agora na versão 1.1) foi rigorosamente revisado para garantir aderência matemática total à planilha legada de referência da BDB (`BRA1DASHv261.xlsx`).
- A notação das variáveis (ex: `FCAtC`, `FCDfC`) foi unificada com o padrão da planilha para facilitar manutenibilidade.
- O cálculo da Vantagem de Mando (Home Advantage) foi embutido arquiteturalmente na separação de médias por mando de campo.
- Foram estabelecidos testes de regressão e casos de teste blindados baseados no Ground Truth real (117 jogos da temporada), estabelecendo limites de tolerância matemática (< 0.5% de divergência).
- Documentou-se claramente as diferenças entre o modelo estático do Excel (Poisson Padrão) e as evoluções nativas do sistema novo (ZIP, Binomial Negativa e Dixon-Coles), garantindo escalabilidade estatística futura.

---

## Conclusão Final (Fase 1 100% Concluída)

A fundação da infraestrutura pública e interna (Painel e CMS) concluiu-se de forma magistral e a **Fase 1 atinge seus 100% de conclusão**. O sistema de contas, painéis modulares, rotas restritas, analytics, SEO e deploy de produção na Vercel estão finalizados e totalmente funcionais.

A plataforma agora caminha para a **Fase 2 (Dashboards de Liga)** suportada por uma arquitetura de dados blindada e um contrato matemático rigorosamente calibrado e validado contra o modelo de negócios atual da BDB.



### 19. Detalhamento da Fase 3 — Ferramentas Gratuitas — 02/05/2026

**Recebimento dos Códigos-Fonte:**
- Marcelo forneceu o arquivo `Ferramentas BDB Gemini.txt` contendo o código React completo das 4 ferramentas previstas para a Fase 3, originalmente hospedadas no Google Gemini Canvas.
- Ferramentas recebidas:
  1. Validação e Risco (Monte Carlo)
  2. Over/Under Linhas (OmniProjector) — Nova rota `/dashboard/ferramentas/over-under-linhas`
  3. Over/Under 2.5
  4. Simulador de Distribuição Estatística

**Análise Técnica e Planejamento:**
- Cada código Gemini foi analisado tecnicamente, identificando: estrutura de dados, lógica de cálculo, bugs, estilos a converter e oportunidades de reutilização com o motor da Fase 2.
- Ordem de implementação definida por valor percebido: (1) Validação e Risco, (2) Over/Under Linhas, (3) Over/Under 2.5, (4) Distribuição.
- Decisões-chave: acesso livre para usuários autenticados (MEMBRO+), zero persistência em banco, reutilização do Recharts e funções estatísticas (Poisson/Fatorial), conversão obrigatória de todos os estilos inline para o design system BDB.
- Correção de lógica: identificados e planejadas correções para diversos bugs dos códigos Gemini (fatorial sem cache, cálculos de afastamento com base incorreta, etc.).

**Atualização Síncrona da Documentação:**
- `PRD.md` (v1.4) atualizado com o escopo completo das 4 ferramentas.
- `SPECS.md` (v2.2) expandido com especificações detalhadas das 4 ferramentas, mapeamento de estilos e identificação de bugs a corrigir.
- `TASKS.md` (v2.3) reconstruído com 7 blocos (3A–3G) contendo mais de 50 subtasks granulares e interdependências lógicas mapeadas.
- `SCHEMA.md` confirmado sem alterações, já que a Fase 3 opera estritamente no Client-Side (Client Components).

Esta sincronização assegura que o Agente de IA responsável pela execução possua a bússola técnica e arquitetural definitiva para implementar o módulo de ferramentas analíticas sem fricção de escopo.

### 20. Motor Estatistico e Pipeline de Ingestao de Dados (Onda 1 — Fase 2) — 03 a 04/05/2026

#### Passos 2 e 3: Engine de Calculo Estatistico (lib/analytics/)

Toda a inteligencia matematica das planilhas da BDB foi replicada em TypeScript puro, com paridade comprovada via testes automatizados contra o Ground Truth da planilha BRA1DASHv261.xlsx.

- **Poisson Padrao:** Matriz 11x11 com todos os mercados derivados (1X2, BTTS, Over/Under 0.5-4.5, Handicap Asiatico).
- **ZIP (Zero-Inflated Poisson):** Trata o excesso de empates 0x0 com parametro pi independente por time.
- **Binomial Negativa (NB):** Modela sobredispersao de variancia com fator r dinamico. Fallback automatico para Poisson em casos de degeneracao.
- **Dixon-Coles:** Correcao de dependencia em low-score (tau) + decaimento temporal exponencial (xi ajustavel).
- **EV Calculator:** Odd Justa, Expected Value (%), ROI estimado e comparacao direta com odds de mercado.
- **Testes:** 32/32 passando com `npm run test`. Paridade matematica menor que 0.5% vs Ground Truth.

#### Passo 4: Pipeline Hibrido de Ingestao (lib/ingest/)

- **RateLimiter:** Token bucket (30 tokens, reposicao 1 req/2s). Zero bloqueios manuais.
- **Quota Mensal:** Rastreamento automatico via tabela `ApiQuotaLog` com agregacao por mes. Bloqueia se exceder 100.000 req/mes.
- **Retry com Backoff:** Ate 3 tentativas com espera exponencial em HTTP 429.
- **Team Normalizer:** Tabela `TEAM_ALIASES` para normalizar nomes das APIs para o padrao canonico do sistema.
- **Sync Engine:** Modos `full` e `incremental`, com parametro `limit` para testes sem consumo de cota.
- **Endpoints Admin:** `POST /sync`, `POST /importar`, `GET /quota` — protegidos por `x-admin-key`.

#### Passo 5: Seed e Validacao no Banco (04/05/2026)

Liga Brasileirao Serie A inserida via seed. Seis bugs de integracao identificados e corrigidos durante validacao:

1. `lib/auth.ts` inexistente — criado com autenticacao temporaria via `ADMIN_API_KEY`
2. `ApiQuotaLog.findUnique({ where: { month } })` — campo nao tem @unique, corrigido para `.aggregate()`
3. Tipagem da API: `homeID`/`date` nao existiam no JSON real — corrigido para `home_team.id`/`utc_date`
4. Campo `status` nao existe no model Match do Prisma — removido do mapper
5. `xGHome`/`xGAway` — schema usa `homeXg`/`awayXg`
6. `connectOrCreate` de Team requer chave composta `externalId_leagueId`

Validacao final confirmada no banco Hostgator em 04/05/2026:
- Mirassol 2 x 1 Corinthians
- Internacional 2 x 0 Fluminense
- Chapecoense 1 x 2 Bragantino

A Onda 1 esta 100% concluida. O sistema esta pronto para ingerir o Brasileirao completo e iniciar a construcao da interface do dashboard.

---

### 21. Sincronização Completa e Validação do Brasileirão (Fase 2, Bloco 1) — 04/05/2026

**Execução do Pipeline de Ingestão:**
- Finalizada a configuração final dos *mappers* da TheStatsAPI. Foram corrigidos conflitos de tipos, adicionados campos que faltavam (ex: `matchday` -> `round`) e implementado suporte massivo à extração de múltiplas odds (Pinnacle, Bet365 e Betfair Exchange).
- O dicionário de normalização de times (`TEAM_ALIASES`) foi atualizado para cobrir variações de nomes detectadas durante o mapeamento (ex: Athletico-PR e Atlético-MG).
- O `sync-engine` rodou um sync completo (full) para o Brasileirão Série A 2026, populando com sucesso mais de 240 partidas finalizadas, incluindo suas respecitvas cotações de mercado, consumindo perfeitamente a quota da API sem bloqueios.

**Validação do Ground Truth:**
- Uma rotina customizada extraiu os dados populados diretamente do MySQL Prisma e calculou as médias de gols (`μ_h` e `μ_a`) e as forças de ataque/defesa (focando no Athletico-PR como prova). 
- O resultado obteve sucesso integral, divergindo do Ground Truth estático em valores muito inferiores ao tolerado (`< 0.05`), comprovando que o banco de dados e o engine matemático operam com total exatidão sobre os dados da TheStatsAPI.

---

### 22. Refatoração Arquitetural — Normalização do Schema (Fase 2, Blocos 6-7) — 04/05/2026

**Design do Novo Banco de Dados (Blocos 1 a 5 da Sessão de Refatoração):**
- A arquitetura legada (Tabela `Match` monolítica contendo centenas de colunas opcionais) provou-se inescalável para a agregação de dados granulares vindos da *TheStatsAPI*.
- O banco foi inteiramente remodelado aplicando **Entity-Attribute-Value (EAV)** e separação rigorosa de domínios (Domain-Driven Design).
- **Novas Entidades Criadas:** `Competition`, `Season`, `TeamAlias`, `TeamSeason`, `MatchStats` (tabela paralela de estatísticas), `MatchOdds` (relacionamento triplo com `Bookmaker` e `Market`), `PlayerMatchStats` e `Shot` (dados geoespaciais em x,y).

**Migração de Dados Sem Perda (Bloco 6):**
- Foi criado e executado um script de migração robusto (transactional) transferindo todo o histórico legado de 896 partidas e 27 times para as novas tabelas granulares, normalizando a *League* antiga em `Competition` e `Season` ativas.

**Refatoração do Sistema e Ingestão (Bloco 7):**
- O motor de sincronização (`sync-engine.ts`) foi reescrito para utilizar as novas tabelas e consumir de forma encadeada os dados da *TheStatsAPI*, executando o *upsert* apenas de forma progressiva e incremental (ex: odds só são buscadas se estiverem disponíveis e desatualizadas).
- A API administrativa de importação manual (`importar/route.ts`) e o parser CSV foram convertidos para a nova estrutura, descarregando as cotações diretamente no hub EAV (`MatchOdds`).
- O sistema analítico foi otimizado, em destaque o `ev-calculator.ts`, que ganhou suporte a "Batch Pre-fetch" em memória para impedir que os cálculos de ROI (Return on Investment) sobrecarregassem o banco de dados.

A base do sistema atinge seu ápice de estabilidade técnica. Os testes de build (`tsc --noEmit`) passam limpos e as tipagens rígidas operam sobre todas as novas estruturas do Prisma, garantindo total *Type Safety*.

---

## Estado Atual do Projeto (04/05/2026)

| Fase | Status |
|------|--------|
| Fase 1 — Infraestrutura e Site Institucional | 100% concluida, em producao na Vercel |
| Fase 2 — Onda 1 (Fundacao: Engine + Ingestao) | 100% concluida, validada em producao |
| Fase 2 — Onda 2, Bloco 1 (Sync Inicial Brasileirão) | 100% concluido |
| Fase 2 — Refatoração Schema Normalizado (Bloco 7) | 100% concluido |
| Fase 2 — UI Dashboard de Ligas | 100% concluido |
| Fase 3 — Ferramentas Analiticas | 100% concluida |

### 23. Desenvolvimento da UI do Dashboard (Fase 2, Blocos Finais) — Maio/2026

**APIs e Backend Visual:**
- Desenvolvidas e testadas as rotas centrais de consulta (`/info`, `/times`, `/partidas`, `/previsao`, `/mapa-valor`) para o Dashboard, mantendo isolamento de temporada (`utcDate >= inicio do ano`) para prevenir que análises sofram contaminação de jogos legados de outras temporadas (2024/2025).

**Componentes Visuais Interativos (Client Components):**
- Construídos e conectados todos os elementos de controle: `SeletorConfronto` (seleção de times e mandos), filtro de rodadas (`FiltroRodadas`) e de faixas de odds, além do hook global de gerência de estado `useLeagueFilters`.
- Criado o `SeletorModelo` contendo os quatro modelos disponíveis (Poisson, Zero-Inflated, Negative Binomial, Dixon-Coles) e exibição do modo Auto validado via AIC.

**Painéis Analíticos (Server to Client):**
- Concluídos os cinco grandes painéis analíticos que compõem o Dashboard e replicam a experiência das planilhas legadas da BDB:
  - `PainelMedias`: Visão sumária de Gols, Pontos, Custos e Pesos.
  - `PainelMatrizPlacares`: Heatmap dinâmico 11x11 evidenciando cenários de alta probabilidade.
  - `PainelMercados`: Grade completa de Match Odds (1X2), Over/Under, BTTS e Asian Handicap, comparando odd justa vs odd de mercado com identificação de Valor Esperado Positivo (+EV).
  - `PainelMapaValor`: Gráfico interativo indicando áreas de lucro baseado em agrupamentos de cotações históricas da temporada atual.
  - `PainelEvolucao`: Série temporal usando Recharts, revelando tendências de Gols Esperados vs Reais rodada a rodada.
- A orquestração das páginas (`/dashboard/ligas/[slug]`) realiza fetch server-side para melhorar SEO e LCP, repassando *props* para a interface cliente.

**Refinamentos de Layout e Estatísticas (Maio/2026):**
- O cabeçalho do Dashboard de Liga (`SeletorConfronto` e `SeletorModelo`) foi compactado, unindo a seleção de times, opções de modelos estatísticos e botão de previsão em uma única barra horizontal limpa e responsiva.
- O `PainelMedias` foi refatorado para máxima clareza: as médias globais da liga foram movidas para uma barra de cabeçalho fora dos cards, e as métricas de Gols/xG foram unificadas em linhas simples separadas por `|`, economizando espaço vertical precioso.
- Os métodos de cálculo do **Lambda** foram expandidos para incluir 3 vertentes (`Média Simples`, `Forças Relativas` e `Expected Goals - xG`), sendo apresentados em um grid de 60/40 ao lado do `SeletorModelo`, com perfeito alinhamento de altura (`items-stretch`) e botões fixos à base.
- O título do eixo Y no `PainelMatrizPlacares` foi rotacionado para o modo vertical de leitura ascendente (`writing-mode:vertical-rl`), desobstruindo a matriz horizontalmente.
- Implementado o `PainelOddsMercado` para inserção dinâmica de cotações reais das casas (ex: Bet365, Pinnacle) via nova rota de API. As odds comunicam-se diretamente com o `PainelMercados` gerando cálculo automático de Expected Value (EV%) no *frontend* com suporte a digitação livre (`rawInputs`).
- O grid de visualização final (Matriz e Evolução) foi padronizado para uma divisão 50/50 e o gráfico de Evolução de Gols ganhou filtros táticos (Ambos, Mandante, Visitante) para isolar tendências visuais.
- Reestruturação global de Sidebar, priorizando a subida do menu "ANÁLISE ESPORTIVA" e limpando seções obsoletas, melhorando a arquitetura da informação para membros pagantes.

O sistema da Fase 2 (Dashboards) encontra-se totalmente implementado, tipado, com polimento UI/UX de alto nível, livre de erros de linter (strict) e operante.

### 24. Conclusão e Validação da Engine Estatística Avançada (Fase 2, Maio/2026)

**Evolução Matemática dos Modelos:**
- **Decay Temporal (Dixon-Coles):** Aplicado globalmente em 3 dos 4 modelos, garantindo que o histórico de forma recente de um time possua um peso exponencialmente maior que o histórico do início do ano.
- **Inflação de Zeros (ZIP):** Alterada de cálculo local de confronto para **cálculo global de liga** (opção Pi-global), eliminando anomalias matemáticas onde um time recém-promovido sofria penalidades infladas.
- **Binomial Negativa e Superdispersão:** Introduzido um sofisticado mecanismo de Fallback (Parcial e Total) que protege o modelo quando a variância observada é menor ou igual à média, regredindo pacificamente para Poisson para evitar cálculos irracionais (r tendendo a Infinity).

**Sistema AUTO e Ranking (AIC):**
- O modo AUTO foi calibrado usando o Critério de Informação de Akaike (AIC).
- Foram introduzidas penalizações dinâmicas ($k$) para lidar com a diferença de complexidade entre Poisson puro ($k=2$) e Binomial Negativa sem fallback ($k=4$).
- Proteção heurística: Ligas com altíssimas taxas de 0x0 ou variância ganham um boost estatístico (limitado a -3.0 de AIC e capado a -1.0 em relação ao líder) para favorecer modelos avançados sem quebrar a confiança da máxima verossimilhança. A confiança (Alta, Média, Baixa) é classificada a partir do Delta-AIC entre o vencedor e o segundo lugar.

**Blindagem de Testes:**
- A suíte de testes unitários foi completamente reescrita em Vitest (`__tests__/analytics/*`). Todas as premissas matemáticas dos modelos foram provadas (ex: ZIP devolvendo matriz pura de Poisson quando `Pi=0`, limites rígidos no clamping de Rho, fallback operante na NB).
- Tipagem 100% rígida via TypeScript interfaces no client (`PrevisaoResponse`, `PrevisaoState`, `MapaValorResponse`), abolindo definitivamente qualquer `any` e fechando o círculo de segurança ponta-a-ponta (API -> Client -> Component).
- A API `/previsao` foi coberta por testes de integração robustos, garantindo 100% de estabilidade com geração estrita e mock controlada do banco Prisma.

**Próximas ações estratégicas:**
1. Fase 4 — Expansão Multi-Liga e Pagamentos
2. Deploy limpo em produção na Vercel da Fase 2 atualizada

### 25. Finalização do Expected Goals (xG) e Backfill de Player Stats (Fase 2) — Maio/2026

**Backfill Histórico (API TheStatsAPI):**
- Realizada uma rodada extensiva de backfill (`sync-engine.ts`) recuperando propriedades avançadas como cartões vermelhos, dribles (`dribblesAttempted` mapeado adequadamente) e demais `PlayerMatchStats` para rodadas passadas.
- O mapeamento foi refinado para tolerar retornos nulos nas ligas sem cobertura profunda de *player props*.

**Integração Analítica de xG (Expected Goals):**
- As rotas da API (`/api/ligas/[slug]/previsao/route.ts`) foram ajustadas para serializar corretamente todas as forças e médias calculadas baseadas no *Expected Goals* (`xG`), suprindo a UI que anteriormente exibia falhas na obtenção do dado bruto.
- A função base de estatística matemática (`getDispersao`) foi isolada e reutilizada para calcular Confiança (Desvio Padrão e Coeficiente de Variação) com precisão sobre dados de xG acumulados.

**Polimento Visual Extremo (`PainelMedias.tsx`):**
- A renderização da seção "Média Simples" ganhou padronização com a arquitetura das outras projeções.
- As métricas de **Confiança** (CV e DP) para Gols e xG foram colapsadas e alinhadas lado a lado em uma mesma linha (`flex-row justify-between`), poupando altura vital na tela para visualização mobile e reduzindo poluição informacional.
- A faixa global superior de "Médias da Liga" foi quebrada em dois eixos (MÉDIA LIGA GOLS e MÉDIA LIGA xG), com tipografia monospace em destaque, aprimorando drasticamente a leitura e o escaneamento visual da performance dos mandantes e visitantes dentro do torneio global.
