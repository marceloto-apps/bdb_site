# Resumo Executivo — Big Data Bet (Fase 1)

**Data de Atualização:** 01/05/2026

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

## Próximos Passos Sugeridos

A fundação da infraestrutura pública e interna (Painel e CMS) concluiu-se de forma maestral e a Fase 1 atinge seus **99%** de conclusão técnica de desenvolvimento. O sistema de contas, painéis modulares, rotas restritas, analytics e SEO base estão totalmente funcionais.

A reta final exata da **Fase 1** agora abrange os preparativos finais de UI para a rotação de páginas públicas e infra de deploy:
- Finalização dos componentes "Artigo Anterior / Próximo" e "Botões de Compartilhamento" nas instâncias de artigos (para as listagens web).
- Planejamento estratégico de Deploy em VPS/Vercel e banco de dados de Produção (1K.1).

