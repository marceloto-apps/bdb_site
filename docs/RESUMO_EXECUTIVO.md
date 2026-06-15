# Resumo Executivo — Big Data Bet (Fase 1)

**Data de Atualização:** 15/06/2026

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

## Estado Atual do Projeto (15/06/2026)

| Fase | Status |
|------|--------|
| Fase 1 — Infraestrutura e Site Institucional | 100% concluida, em producao na Vercel |
| Fase 2 — Onda 1 (Fundacao: Engine + Ingestao) | 100% concluida, validada em producao |
| Fase 2 — Onda 2, Bloco 1 (Sync Inicial Brasileirão) | 100% concluido |
| Fase 2 — Refatoração Schema Normalizado (Bloco 7) | 100% concluido |
| Fase 2 — UI Dashboard de Ligas | 100% concluido |
| Fase 2 — Feature Bolão (Copa 2026) | 100% concluida |
| Fase 3 — Ferramentas Analiticas | 100% concluida |
| Onda A — Estrutura de Cursos e BDB Bônus (Gamificação) | 100% concluída (com suíte de testes de integração e higiene de produção) |
| Fase 4 — Multi-Liga + Pagamentos (Stripe + Hubla Legacy) | 100% concluída (checkout, webhooks, idempotência, acessos VIP e legados) |

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

### 26. Otimizações Pós-MVP e Estabilidade do Backfill (Fase 2.5) — 10/05/2026

**Estabilização da Ingestão de Dados:**
- Correção crítica no parser de datas (`YY/YY`) do auto-backfill para garantir o foco em temporadas recentes em vez de anos históricos isolados.
- Implementação de um mecanismo robusto de detecção de *stale jobs*, permitindo que processos travados sejam resetados e a ingestão histórica seja retomada autonomamente (auto-healing).
- Isolamento da quota da API API-Football, direcionando as 100 requisições diárias integralmente para o backfill histórico (`apifootball_backfill`), desativando momentaneamente rotinas não vitais.

**Refinamentos do Dashboard Analítico:**
- O requisito mínimo de jogos para cálculo preditivo foi reduzido de 5 para 4, aumentando o volume de partidas processáveis na interface sem comprometer a validade estatística.
- Correção de loop de renderização infinita nos filtros de rodadas (FiltroRodadas).
- O provedor base de odds mudou de Pinnacle para Bet365, assegurando uma cobertura substancialmente maior nas cotações listadas. A interface foi higienizada removendo os rótulos de provedor ("Odds Casa", "Odds Visitante").
- **Auto-Collapse nos Filtros:** O painel de Filtros Avançados agora obedece a regras inteligentes, fechando automaticamente sempre que o usuário recalcula a previsão ou seleciona um novo confronto, com função de "Limpar Filtros" implementada nativamente.
- **Resiliência a Erros:** Erros como `INSUFFICIENT_TEAM_DATA` deixaram de corromper o estado visual da tela. Agora o painel preserva o último estado válido e exibe uma mensagem detalhada com a contagem exata dos jogos encontrados por mando de campo.

**Usabilidade e Monetização Preview:**
- Atualização visual no menu lateral (Sidebar) integrando tags de "Em breve" nas ferramentas secundárias e futuros módulos educacionais (Aulas, Backtest, Métodos).
- Acesso segmentado a ligas: O sistema exibe o status de ligas "FREE" no painel principal, enquanto as ligas restritas bloqueiam o acesso do usuário exibindo uma interface padronizada "Disponível nos Planos Pagos", preparando o terreno para a Fase 4 (integração de checkout).

### 27. Otimização da Ferramenta Over/Under 2.5 (Market Analyzer) — 12/05/2026

**Blindagem Matemática:**
- O cálculo do $\lambda$ a partir das odds da linha `2.50` (`encontrarLambdaIterativo`) foi refatorado. Substituiu-se a busca iterativa legada pelo método matemático de **Bisecção**, garantindo convergência exata e prevenindo loops infinitos em cotações extremamente desbalanceadas.
- Adicionada documentação (JSDoc) extensiva e proteção de entradas (inputs) via `zod`.

**Paridade de Mercado e Ajuste Empírico (Overdispersion):**
- A injeção de margem (*juice*) nas odds da ferramenta foi reescrita. O novo sistema suporta *juice* negativo nas linhas distantes, impõe um piso de odd operacional (clamp em `1.01`) e recalcula o juice efetivo para a linha dinamicamente após o clamp, refletindo com precisão as grades das plataformas de referência.
- Em resposta ao comportamento natural de superdispersão das casas de aposta asiáticas, foi implementado um **Ajuste Empírico de Variância**. O algoritmo agora desloca linearmente `-0.9%` de probabilidade por cada 1 gol de distância da linha eixo de `2.50`. Essa correção preserva a injeção do *juice* proporcional e o eixo original intactos, mas blinda inteligentemente as zebras nas extremidades (ex: cotação de um Under 1.50 não inflaciona para `8.03`, sendo travada em `7.45`), entregando paridade perfeita contra os modelos de mercado-alvo.

### 28. Refinamentos Analíticos e Visuais (Fase 3) — 12/05/2026

**Dashboard de Ligas — Escala de Confiança (CV):**
- As faixas de avaliação do **Coeficiente de Variação (CV)** foram ajustadas para garantir uma leitura de risco muito mais estrita. A nova classificação exige que a dispersão seja menor que `0.3` (30%) para ser considerada de Confiança Alta, e pune variações acima de `0.7` (70%) com classificação Baixa, refletindo maior rigor matemático no painel central.

**Ferramenta de Validação e Risco:**
- O painel de *Score de Qualidade* (Eficiência do Método) recebeu aprimoramento visual em sua barra de progresso.
- A escala visual foi expandida de 0 a 10.
- A barra e a iconografia correspondente agora exibem formatação condicional baseada na lucratividade relativa ao Drawdown: Vermelho (score $\le$ 2), Amarelo (score entre 2 e 5) e Verde (score $>$ 5).

### 29. Integração de Gols HT e Projeção de Handicaps (Fase 2) — 12/05/2026

**Estatísticas de Half-Time (HT):**
- O schema do banco de dados e o motor analítico foram expandidos para capturar e calcular estatísticas focadas exclusivamente no primeiro tempo das partidas (`hthg` e `htag`).
- As abas "Gols / xG / Fin." e "Over / Under" foram atualizadas para exibir quadros completos de "Gols 1H" e totais combinados do HT.

**Novo Motor de Projeção de Handicaps:**
- Implementado o `PainelProjecaoHandicaps`, que varre matematicamente a Matriz de Placares do modelo atual (Poisson, ZIP, etc) e gera um quadro completo das linhas de mercado.
- A UI calcula instantaneamente a chance de Full Win (`%Win`), a chance de Meio-Ganho/Push (`%Push`) e deriva a **Odd Justa** utilizando a fórmula exata de Valor Esperado ($EV=0$) para dezenas de linhas Asiáticas do Mandante, Visitante e Over Gols.
- O Layout do Dashboard de Liga foi refeito: o Gráfico de Evolução de Gols desceu ocupando toda a largura da tela, dando destaque ao novo quadro de Handicaps que foi fixado ao lado da Matriz de Placares.

### 30. Reorganização e Refinamento do Módulo de Jogadores (Fase 2+) — Junho/2026

**Reestruturação Visual por Categoria:**
- A aba de análise de atletas foi completamente reformulada. Em vez da visualização clássica por posições fixas de campo, as estatísticas de desempenho agora estão agrupadas em quatro sub-abas dinâmicas de categoria: **Sumário**, **Ofensividade**, **Passes** e **Defesa**.
- **Novo Piso de Minutos**: Reduzimos o critério de inclusão de minutagem mínima na temporada de 270 para 180 minutos totais, permitindo a análise de um leque maior de atletas e reservas ativos.

**Engine de Escala Dinâmica (Client-side):**
- Implementação de toggles no frontend para alternar as estatísticas volumétricas dinamicamente entre **Valores Totais**, **Por 90 Minutos** e **Por Jogo**.
- O cálculo é feito de forma responsiva no cliente:
  - Totais: valor bruto.
  - Por 90: `(valorTotal / totalMinutes) * 90`.
  - Por Jogo: `valorTotal / matchesPlayed`.
- Campos especiais como nota/rating (`weightedRating`), partidas (`matchesPlayed`) e taxas percentuais (`passesAccuratePct`) possuem regras de escape de escala. A coluna `MIN` de minutos responde à escala de jogo exibindo a média de minutos por jogo do atleta.

**Polimento Visual e Otimização de Espaço:**
- **Remoção de Controles Redundantes**: Ocultamos os seletores globais de mando (Casa/Visitante/Geral) especificamente na aba de jogadores para despoluir a visualização.
- **Abreviaturas Compactas**: Renomeação de todas as colunas das tabelas para siglas enxutas (e.g. `MIN`, `G`, `CHT`, `CHG`, `P%`, `PCH`, `DES`, `COR`) garantindo que as tabelas caibam na tela de forma fluida sem rolagem horizontal.
- **Legenda Dinâmica**: Implementação de um card explicativo no rodapé que detecta a aba de estatística ativa e exibe as descrições detalhadas de cada sigla.
- **Isolamento de Gols**: Ajuste da coluna `G` do Sumário para representar estritamente os gols marcados, desvinculando-se do fallback de defesas do goleiro.

**Coluna de Posições (P) com Ordenação Tática:**
- Introduzida a coluna `P` de posição no início das tabelas base, com alinhamento centralizado e exibindo as siglas: `GK` (Goleiro), `DF` (Defensor), `MC` (Meio Campo) e `AT` (Atacante).
- O algoritmo de ordenação da coluna foi estruturado para agrupar e ordenar os atletas logicamente de trás para frente no campo (`GK` $\rightarrow$ `DF` $\rightarrow$ `MC` $\rightarrow$ `AT`).

**Integração do Ingestor e Schema DB:**
- Sincronização e ingestão em `PlayerMatchStats` de mais de 35 novos campos de métricas refinadas de passes, finalizações, duelos e goleiro fornecidas pela *TheStatsAPI*, garantindo a consistência das estatísticas detalhadas no site.

### 31. Incorporação do Gráfico de Histórico de Odds (Fase 2) — Junho/2026

**Backend (API de Histórico):**
- Criação da nova rota de API `/api/ligas/[slug]/odds-mercado/historico` para retornar a série temporal de odds movimentadas (`OddsMovement`) desde a abertura até o valor atual.
- Implementação de algoritmo de **Forward Fill** para preencher valores ausentes no tempo (gaps de crawl), garantindo linhas de gráfico contínuas e sem fragmentação no frontend.

**Painel e Gráfico Recharts (`PainelOddsMercado.tsx`):**
- Inclusão do gráfico de linha `LineChart` usando a biblioteca `recharts` para o mercado selecionado, com tooltip estilizado e design escuro premium integrado ao Manual da Marca.
- Exibição de uma tabela de resumo contendo as odds **Mínima**, **Máxima** e **Atual** registradas para cada seleção do mercado.
- Integração de um dropdown/select para alternar de forma responsiva entre os mercados (`1X2`, `BTTS` e as linhas do `Over/Under` de 0.5 a 4.5), sendo o 1X2 o padrão.
- Blindagem de filtros: O histórico do gráfico reconecta-se dinamicamente ao trocar de bookmaker, porém ignora o seletor "Atuais/Abertura" (pois exibe o histórico completo).
- Reajuste do grid de colunas no `DashboardLigaClient.tsx` de `4/8` para `5/7` de largura relativa, conferindo maior espaço e perfeita legibilidade ao gráfico.

### 32. Expansão e Reestruturação do Mapa de Valor (Fase 2) — Junho/2026

**Expansão Analítica (Bet365 e Novos Mercados):**
- O motor de ROI foi reescrito para consultar as cotações da **Bet365** como base (a cobertura mais completa do banco de dados).
- A API `/api/ligas/[slug]/mapa-valor` foi expandida para incluir os mercados de **Ambas Marcam (BTTS Sim/Não)** e **Over/Under 2.5 (Over/Under)**, gerando taxas de acertos e ROI por faixas para os 3 mercados.
- Atualização das interfaces de tipos no arquivo `types/liga.ts` para tipar estritamente o payload estendido com as 7 seleções sem coerções indesejadas de tipo.

**Interface Premium em Linha Única (`PainelMapaValor.tsx`):**
- Reestruturação da UI adotando navegação em dois níveis de seletores:
  - **Nível 1 (Mercado)**: Resultado (1x2), Ambas Marcam (BTTS) e Over/Under 2.5, posicionados à **esquerda**.
  - **Nível 2 (Opções)**: Seleções dinâmicas de acordo com o mercado (Ex: Casa/Empate/Visitante, Sim/Não, Over/Under), posicionadas à **direita**.
- No desktop, os seletores de nível 1 e 2 alinham-se horizontalmente na mesma linha (otimizando espaço vertical), empilhando-se de forma flexível em telas mobile.

### 33. Onda A — Estrutura de Cursos e BDB Bônus (Gamificação) — 07/06/2026

**Modelagem do Banco de Dados (Prisma Schema):**
- **Enum Plan Atualizado:** Atualização do enum de planos para `{ FREE, VIP_BASICO, VIP_PRO }` no [schema.prisma](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/prisma/schema.prisma) com migração segura de dados executada manualmente em três etapas.
- **Novos Enums de Domínio:** Introdução dos enums `CourseAccess` (tipo de acesso a cursos) e `PointTxType` (crédito/débito/expiração).
- **Tabelas de Cursos:** Implementação dos modelos `Course`, `Module`, `Lesson`, `LessonProgress` (progresso do aluno por aula), `Quiz` e `QuizAttempt` para suporte ao portal de aulas.
- **Tabelas de Pontuação:** Criação de `PointRule` (configuração de regras de ganho de pontos), `PointTransaction` (extrato de transações), `Coupon` (cupons de desconto ou prêmios resgatados) e `RewardOption` (opções de recompensas físicas/digitais).

**Regras de Negócio e Domínio de Pontos (`lib/points/`):**
- **Configuração (`config.ts`):** Estabelecidas as faixas de status de fidelidade (`'Bronze' | 'Prata' | 'Ouro' | 'Diamante'`) com base nos pontos acumulados nos últimos 12 meses e limites/tetos mensais de acúmulo parametrizados por plano em [config.ts](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/lib/points/config.ts).
- **Saldo e Expiração (`balance.ts`, `fifo.ts`, `expire.ts`):** Implementada a função `getBalance` (no [balance.ts](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/lib/points/balance.ts)) para somar pontos via Event Sourcing direto e o motor `getRemainingBalances` (no [fifo.ts](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/lib/points/fifo.ts)) usando a lógica PEPS (FIFO - Primeiro a Entrar, Primeiro a Sair) para controle de expiração rigorosa em janela de 60 dias (no [expire.ts](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/lib/points/expire.ts)).
- **Concessão e Idempotência (`award.ts`):** Concessão de pontos controlada em [award.ts](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/lib/points/award.ts) com proteção contra ganhos duplicados através da chave composta de idempotência (`idempotencyKey`), controle de limite diário (cap) e truncamento caso exceda o teto mensal da conta.
- **Resgate de Prêmios (`redeem.ts`):** Fluxo transacional `redeemReward` em [redeem.ts](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/lib/points/redeem.ts) contendo travas de estoque, limite de uso por usuário, expiração da recompensa e débito instantâneo no saldo de pontos.

**APIs e Integrações:**
- **Endpoints de Pontos:** Criadas as rotas de API `/api/points/balance`, `/api/points/history`, `/api/points/redeem` e `/api/points/rewards`.
- **Gatilhos de Ações (Server Action):** Implementada a action `awardOnAccountEvents` em [auth.ts](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/lib/points/actions/auth.ts) acoplada aos fluxos de criação de conta (`CRIAR_CONTA`) por credenciais/OAuth e edição do perfil do usuário (`COMPLETAR_PERFIL`).

**Painéis de Interface (UI/UX) e Administração:**
- **Área do Usuário (/dashboard/bdb-points):** Desenvolvimento do painel completo [page.tsx](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/app/(dashboard)/dashboard/bdb-points/page.tsx) com visualização do progresso de nível, barra de fidelidade, histórico detalhado de pontos ganhos/resgatados e vitrine de cupons de recompensa.
- **CMS Administrativo de Pontos (/cms/admin/points):** Interface administrativa [page.tsx](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/app/(cms)/cms/admin/points/page.tsx) permitindo aos administradores criar/editar regras de pontuação, gerenciar estoque de recompensas, realizar ajustes de saldo manuais e auditar transações do sistema.
- **CMS de Cursos (/cms/admin/courses):** CRUD completo em [page.tsx](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/app/(cms)/cms/admin/courses/page.tsx) para gerenciar cursos, módulos estruturados, vídeo-aulas e a criação de quizzes interativos (perguntas e respostas com validação).

### 34. Correções Pós-Onda A — Higienização, Isolamento de Testes e Rotação de Senha — 08/06/2026

**Higiene do Repositório (git):**
- Os scripts e arquivos temporários de teste na raiz do projeto (`get-slugs.js`, `test-groupby.ts` e `validate.js`) foram devidamente removidos do cache do Git (`git rm --cached`) e inseridos nas regras de exclusão do `.gitignore` para manter a limpeza do repositório.
- Atualizado o `.gitignore` para cobrir de forma robusta `.env.test`, a pasta temporária de auditoria `/scripts/_local/` e todos os arquivos de log (`*.log`).
- Realizada auditoria de segurança sob o histórico e arquivos do repositório em busca de chaves ou credenciais vazadas. O resultado foi limpo.

**Remoção de Resíduos na Produção:**
- Identificada a regra de pontos temporária `TEST_ACTION` (ID: `cmq3zc441000110im6br7nd0y`) no banco de produção.
- Desenvolvido e executado o script `scripts/_local/cleanup-test-residue.ts` encapsulado em transação Prisma (`prisma.$transaction`) com uma trava que abortaria o processo caso alguma transação estivesse associada à regra. A PointRule foi removida com sucesso (0 transações associadas detectadas).

**Validação de Migration do Enum Plan:**
- O comando `migrate deploy` foi executado no banco MySQL de testes do Docker totalmente do zero, validando de forma concluiva toda a sequência de DDL de migração e a transição segura do enum `Plan` (a-b-c-d) em `users` e `articles`.

**Ambiente de Testes Isolado (Docker):**
- Criada a configuração local `docker-compose.test.yml` na porta `3307` e o arquivo `.env.test` de conexão de testes locais (`127.0.0.1:3307/bdb_test`).
- O arquivo `vitest.setup.ts` foi estendido com um ganho de segurança (`beforeAll`) para bloquear a execução se a `DATABASE_URL` não apontar para a porta de teste `3307` no host local, prevenindo qualquer escrita acidental em bancos de produção.
- Refatorado `tests/points/domain.test.ts` para abolir os `upserts` defensivos que sobreviviam a resíduos, adotando criação direta com actions prefixed de teste (`__TEST_CAPPED__` e `__TEST_BIG__`) e limpeza sistemática de tabelas antes de cada teste (`beforeEach`).
- Adicionado teste integrado concorrente com `Promise.all` simulando chamadas paralelas para provar a idempotência estrita da ação `COMPLETAR_PERFIL`.
- Todos os 6 testes de integração de pontos passaram com sucesso no Docker em apenas 493ms.

**Validação de Rotação de Senha:**
- Após o usuário efetuar a rotação da senha de produção no cPanel Hostgator e atualizar os arquivos `.env`/`.env.local` locais e as variáveis de ambiente da Vercel, o script `scripts/_local/check-conn.ts` validou com sucesso a conexão (`Conexão de produção: OK`). O script de validação foi removido após o teste.

**Auditoria e Tipagem de Domínio:**
- O cálculo de saldo em tempo real no `lib/points/balance.ts` foi validado como Event Sourcing puro via `SUM` agregado (sem FIFO redundante).
- O tipo de retorno de fidelidade `getStatus` foi refatorado para tipagem estrita com união de strings literais `'Bronze' | 'Prata' | 'Ouro' | 'Diamante'` (tipo `BDBStatus`).
- A PointRule `CONFIRMAR_EMAIL` foi validada como regra legítima de seed e placeholder de desenvolvimento, sendo adicionado um comentário `// TODO` na rota de cadastro e atualizado em `docs/SPECS.md`.

**Build e Testes Unitários de Produção:**
- Rodada a suíte completa de testes unitários que não dependem do banco de dados (25 arquivos, 113 testes), com todos eles passando com sucesso.
- O build de produção (`npm run build`) compilou com sucesso na Vercel e localmente sem qualquer erro de tipagem.

### 35. Implementação da Feature Bolão (Copa 2026) — 08/06/2026

**Modelagem do Banco de Dados (Prisma Schema):**
- Adicionados os modelos `Bolao`, `BolaoPalpite` e `BolaoScore` no `schema.prisma` mapeados para as tabelas `boloes`, `bolao_palpites` e `bolao_scores`.
- Adicionados os enums `BolaoStatus` e `PalpiteOverUnder`.
- Aplicada a migração `20260608164000_add_bolao_models` no banco de dados.

**Engine de Pontuação e Avaliação Transacional:**
- Criado o módulo `lib/bolao/avaliarPalpite.ts` contendo:
  - Função pura de pontuação: Placar exato (4 pts) e Apenas Resultado (2 pts). Over/Under 2.5 gols desativado do processo (0 pt).
  - Função `avaliarPalpitesDePartida` processada em chunks de 50 registros para mitigar condições de corrida concorrente através de `updateMany({ where: { id, avaliado: false } })` e atualização atômica de ranking (`BolaoScore`). O score agora acumula a **média simples de pontos** dos jogos palpitados e a **quantidade de palpites feitos** pelo participante.

**Integração com Motores de Sincronização:**
- Integrado o gancho de avaliação automática de palpites no momento exato em que uma partida transiciona de `!= FINISHED` para `FINISHED` nos motores `lib/ingest/sync-engine.ts` e `lib/sync/sync-partidas.ts`.

**APIs e Validação (App Router & Zod):**
- Implementados os endpoints:
  - `GET /api/bolao/[bolaoId]`: Retorna metadados, lista de partidas e pontuação do usuário logado (com auto-inicialização segura se `bolaoId === "copa-2026"`).
  - `GET /api/bolao/[bolaoId]/palpites`: Obtém os palpites do usuário.
  - `POST /api/bolao/[bolaoId]/palpite`: Salva/atualiza palpites com trava rígida de 1 hora antes do horário do jogo (`utcDate`), sendo o campo `palpiteOverUnder` opcional e com valor padrão `"UNDER"`.
  - `GET /api/bolao/[bolaoId]/ranking`: Leaderboard paginado com a ordenação atualizada: 1º Média de Pontos, 2º Quantidade de Palpites Feitos (primeiro desempate), 3º Placar Exato, 4º Resultado 1x2 e 5º Data de criação da conta.

**Dashboard e Regulamento (UI/UX Premium):**
- Desenvolvimento da página de visualização `/dashboard/bolao` com visual escuro premium e abas organizadas:
  - **Partidas**: Exibição dos confrontos agrupados por rodadas com cards de palpites e o horário limite destacando `   |   🔒 Limite: DD/MM, HH:MM (BRT)`.
  - **Ranking Geral**: Classificação dinâmica com exibição de Média de Pontos formatada com 2 casas decimais, nova coluna exibindo a quantidade de Palpites Feitos e sinalização visual ("Sem mínimo (10)") para participantes com menos de 10 jogos palpitados.
  - **Regulamento & Regras**: Explicação detalhada da média simples de pontos (se não palpitar, o jogo não conta), a regra de elegibilidade a prêmios exigindo **no mínimo 10 palpites avaliados**, a ordenação atualizada de critérios de desempate e a tabela de premiação expandida (1º: 1500 pontos/30% OFF; 2º: 1000 pontos/20% OFF; 3º: 500 pontos/10% OFF; 4º-5º: 300 pontos/6% OFF; 6º-10º: 100 pontos/2% OFF), com indicação de que os pontos podem ser resgatados por módulos de cursos, ferramentas e ligas adicionais.
- Atualizado o sidebar global do dashboard (`DashboardSidebarContent`) direcionando para `/dashboard/bolao` com ícone de troféu animado (`Trophy`).

### 36. Onda A — Dicionário do Mercado e Otimizações de Cursos — 13/06/2026

**Dicionário do Mercado (Glossário):**
- **Base de Dados Estática:** Criado o arquivo [glossary.ts](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/lib/courses/glossary.ts) contendo 99 termos técnicos com traduções e definições detalhadas em HTML, classificados em cinco categorias: *Mercado*, *Estatística*, *Risco*, *Operação* e *Modelos*.
- **Interface de Usuário:** Integração de uma página interna responsiva para busca de termos em tempo real e filtragem rápida por categorias de forma fluida.
- **Timeline Curricular:** Adicionado o item "Dicionário do Mercado" na barra lateral de navegação curricular, posicionado imediatamente antes do Módulo 1.

**Lógica de Navegação e Inicialização de Cursos:**
- **Inicialização Dinâmica:** Implementação da função auxiliar `getStartingLessonId` para varrer o progresso do aluno. O player abre diretamente na última aula assistida pelo aluno (com base em `watchedPct > 0` ou `completed` igual a `true`), ou na primeira aula do curso caso ele ainda não tenha começado. O glossário nunca intercepta a inicialização padrão do curso.
- **Navegação Linear:** Adicionados botões "Próxima Aula" e "Aula Anterior" conectando linearmente as aulas e permitindo a transição fluida entre o glossário e a primeira aula.
- **Renomeação da Sidebar:** O item correspondente na barra lateral de navegação foi renomeado de "Aulas" para "Vitrine de Cursos".

**Gamificação de Aulas:**
- **Conclusão Automática:** A aula é marcada automaticamente como concluída (sistemicamente) e o progresso é atualizado para 100% assim que o tempo assistido (`watchedPct`) atinge ou ultrapassa **90%** do tempo total da aula. A opção manual de marcar como concluída foi removida da interface para evitar abusos.
- **Lançamento de Pontos:** Implementado o ganho automático de **50 pontos BDB** na carteira do aluno ao completar a regra dos 90% de visualização de uma aula, com controle rígido de concorrência e idempotência de transações de pontos.

---

### 37. Fase 4 — Multi-Liga + Pagamentos (Stripe + Hubla Legacy) — 15/06/2026

**Integração do Stripe (Checkout e Portal):**
- **Checkout de Planos:** Implementação do endpoint `/api/checkout` utilizando o Stripe SDK para criar sessões de pagamento de forma dinâmica. As rotas são validadas com Zod e limitadas aos Price IDs configurados no `.env`.
- **Portal do Cliente:** Rota `/api/portal` criada para redirecionar os assinantes autenticados ao Billing Portal oficial do Stripe, permitindo o gerenciamento autônomo de formas de pagamento, cancelamentos e upgrades.
- **Visualização de Plano:** Painel `/dashboard/plano` desenvolvido para exibir o status atual da assinatura, botão para o portal de faturamento e redirecionamentos adequados.

**Segurança e Controle de Acessos (Acesso VIP):**
- **Motor de Permissão (`hasVipAccess`):** Helper unificado para verificar permissões de acesso a ligas fechadas. Valida se o usuário é Administrador/Editor, se possui plano `VIP_BASICO`/`VIP_PRO` ativo, ou se possui registro de acesso legado vitalício (`LegacyAccess`).
- **Middleware Serverless-friendly:** Para evitar problemas de conexão com banco de dados em Edge runtimes, a validação de acesso das ligas e previsões foi delegada do Middleware do Next.js para os Route Handlers da API e Server Components individuais.
- **Proteção Visual:** A visualização de ligas restritas no menu e nas rotas bloqueia acessos de usuários sem permissões, apresentando a tela e o CTA de planos/upgrade.

**Processador de Webhooks e Resiliência:**
- **Webhook do Stripe:** Handler robusto `/api/webhook/stripe` configurado com runtime `nodejs` clássico para suportar a validação do corpo bruto (*raw body*) e da assinatura digital (`stripe-signature`).
- **Garantia de Idempotência:** Prevenção de processamento duplicado através de registros únicos no modelo `StripeWebhookEvent`, filtrando retransmissões do Stripe.
- **Sincronização de Assinatura:** Eventos de `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated` e `customer.subscription.deleted` persistem o estado e os períodos da assinatura no modelo `Subscription`.
- **Interoperabilidade com Legados:** No cancelamento ou rebaixamento da assinatura do Stripe, o sistema realiza uma verificação por e-mail no modelo `LegacyAccess`. Usuários legados mantêm acesso vitalício e não sofrem rebaixamento para o plano `FREE`.
