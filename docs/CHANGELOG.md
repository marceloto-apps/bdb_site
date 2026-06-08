# Changelog — Big Data Bet

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
