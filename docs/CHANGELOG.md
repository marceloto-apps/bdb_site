# Changelog — Big Data Bet

## [Fase 4 — Multi-Liga + Pagamentos] — 2026-06-15

### Adicionado
- **Mecanismo de Checkout e Portal**: Endpoints `/api/checkout` e `/api/portal` para integração com Stripe Checkout (assinaturas dos planos VIP_BASICO e VIP_PRO) e Stripe Customer Portal (gerenciamento e cancelamento de assinaturas).
- **Processador de Webhook do Stripe**: Endpoint `/api/webhook/stripe` com validação de assinatura (`stripe-signature`), verificação do corpo bruto (*raw body*), idempotência via tabela `StripeWebhookEvent` e processamento dos eventos `checkout.session.completed`, `customer.subscription.updated` e `customer.subscription.deleted`.
- **Validador de Acesso VIP**: Função `hasVipAccess` em `lib/auth/check-access.ts` que valida se o usuário possui cargo de `ADMIN`/`EDITOR`, se tem plano pago ativo, ou se possui registro de acesso legado vitalício.
- **Importador de Usuários Legados**: Script CLI `scripts/import-legacy.ts` para importação massiva de assinantes vitalícios do Hubla para a tabela `LegacyAccess`.

### Alterado
- **Controle de Acesso de Ligas**: Modificadas as rotas do Dashboard (`/dashboard/ligas/[slug]`) e os Route Handlers das APIs de ligas (`/api/ligas/[slug]/**/*`) para verificar dinamicamente a permissão de acesso via `hasVipAccess`, retornando 403 ou exibindo tela com CTA de planos.
- **Integração no Dashboard**: Atualizada a sidebar de navegação para mostrar ligas restritas bloqueadas para usuários sem acesso e atualizada a página `/dashboard/plano` com status da assinatura e links de gerenciamento.
- **Modelagem do Banco**: Adicionadas as tabelas `Subscription`, `LegacyAccess` e `StripeWebhookEvent` e atualizada a tabela `User` com `stripeCustomerId` no [schema.prisma](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/prisma/schema.prisma).

## [Onda A — Dicionário do Mercado] — 2026-06-13

### Adicionado
- **Dicionário do Mercado**: Integração de um glossário estático contendo 99 termos de apostas esportivas, divididos em 5 categorias: Mercado, Estatística, Risco, Operação e Modelos.
- **Arquivo de Dados Estáticos**: Novo arquivo [glossary.ts](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/lib/courses/glossary.ts) contendo todos os termos e definições com tags HTML.
- **Interface de Busca e Filtros**: Campo de pesquisa e botões de filtro na visualização do glossário.

### Alterado
- **Inicialização do Player**: Atualizado o comportamento em [CoursePlayerClient.tsx](file:///c:/Users/MASTER/OneDrive/Projetos/Gits/bdb_site/app/%28dashboard%29/curso/CoursePlayerClient.tsx) para iniciar na última aula assistida pelo usuário (ou na primeira, se nenhuma tiver progresso) ao invés do glossário.
- **Timeline Curricular**: Posicionamento do glossário como um item selecionável opcional antes do Módulo 1 na timeline lateral.

## [Onda A — Correções e Segurança] — 2026-06-08

### Adicionado
- **Isolamento de Testes (Docker)**: Criada configuração `docker-compose.test.yml` e arquivo `.env.test` para isolar a base de dados de testes locais na porta `3307`.
- **Trava Anti-Produção**: Consolidado no arquivo `vitest.setup.ts` um hook `beforeAll` que aborta os testes caso a URL de conexão do Prisma não aponte estritamente para `127.0.0.1:3307/bdb_test` (prevenindo qualquer escrita acidental em bancos de produção).
- **Carregamento Automático de Env**: Atualizado `vitest.config.ts` para injetar variáveis do `.env.test` via `loadEnv` da biblioteca `vite`.
- **Scripts de Comandos**: Adicionados scripts `"test:db:up"` e `"test:db:down"` no `package.json` para gerenciamento do ciclo de vida do container de testes.
- **Teste de Idempotência COMPLETAR_PERFIL**: Novo teste concorrente simulando requisições simultâneas e assegurando a criação de apenas 1 transação de ganho para o usuário sob a chave `"COMPLETAR_PERFIL:${userId}"`.

### Alterado
- **Refatoração de Testes de Domínio**: Removidos upserts defensivos nos limites e caps de pontos, migrando-os para criação direta (`create`) e adotando nomenclaturas de teste prefixed (`__TEST_CAPPED__` e `__TEST_BIG__`).
- **Limpeza Sistemática**: Introduzida exclusão profunda de tabelas (`beforeEach`) para isolamento absoluto entre cenários de testes locais.

### Removido
- **Resíduos em Produção**: Removida a regra órfã `TEST_ACTION` (ID: `cmq3zc441000110im6br7nd0y`) de forma transacional e com trava de segurança de zero transações ativas.
- **Higiene do Repositório**: Removidos do cache Git (`git rm --cached`) os scripts auxiliares temporários (`get-slugs.js`, `test-groupby.ts`, `validate.js`) e adicionados ao `.gitignore` junto a `.env.test` e logs gerais.

## [Onda A] — 2026-06-07

### Adicionado
- **Enum Plan Atualizado:** Modificado para `{ FREE, VIP_BASICO, VIP_PRO }` com transição e migração de dados segura de forma manual no MySQL (3 etapas).
- **Novos Enums do Banco:** `CourseAccess` e `PointTxType`.
- **Modelagem de Cursos (Metadados):** Criadas as tabelas `Course`, `Module`, `Lesson`, `LessonProgress`, `Quiz` e `QuizAttempt` no Prisma Schema.
- **Modelagem do BDB Points:** Criadas as tabelas `PointRule`, `PointTransaction`, `Coupon` e `RewardOption` com suporte a idempotencyKey.
- **Camada de Domínio de Pontos (`lib/points/`):**
  - `config.ts`: Configurações de limites mensais por plano e faixas de status (Bronze, Prata, Ouro, Diamante).
  - `balance.ts`: Função `getBalance` (cálculo de saldo por Event Sourcing puro) e `getExpiringSoonPoints` (janela de 60 dias).
  - `fifo.ts`: Lógica FIFO (`getRemainingBalances`) para abatimento e expiração.
  - `status.ts`: Cálculo de status de fidelidade com base nos pontos ganhos nos últimos 12 meses.
  - `award.ts`: Função `awardPoints` controlando regras de cap diário/mensal da regra, teto do plano (com truncamento) e idempotência no banco de dados.
  - `redeem.ts`: Fluxo transacional `redeemReward` de resgate de cupons com validação e debito.
  - `expire.ts`: Processamento de expiração de pontos (`expirePoints`) idempotente usando FIFO.
- **Rotas de API de Pontos:**
  - `GET /api/points/balance`: Retorno do saldo e status atualizado.
  - `GET /api/points/history`: Histórico paginado e validado com Zod.
  - `POST /api/points/redeem`: Ação de resgate.
  - `GET /api/points/rewards`: Lista dinâmica de recompensas.
- **Server Action & Hooks de Autenticação:**
  - Server Action `awardOnAccountEvents`.
  - Acoplados gatilhos de concessão de pontos em `CRIAR_CONTA` (cadastro por credenciais e OAuth Google) e `COMPLETAR_PERFIL` (edição de perfil).
- **Interface do Usuário (UI):**
  - Painel de pontos `/dashboard/bdb-points` com visualização de saldo, progresso de status, troca por recompensas e histórico.
  - Painel administrativo de pontos `/cms/admin/points` para gerenciamento de regras, recompensas, ajuste manual e auditoria global.
  - Painel administrativo de cursos `/cms/admin/courses` para CRUD completo de cursos, módulos, aulas e quizzes (perguntas/respostas).
  - Sidebar atualizada com os links correspondentes.
- **Documentação:** Atualizados os arquivos `PRD.md`, `SCHEMA.md` e `SPECS.md`.
