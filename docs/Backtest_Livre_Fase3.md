# Backtest Livre — Fase 3: Dados e API (25/09/2026)

Plano: `docs/Backtest_Livre_Plano.md` §3 (arquitetura), §8 (fases). Entrega: Web Worker com cache de
chunks, rota de execução no servidor, persistência de estratégias/runs/indicadores/tentativas e a
API que a UI (Fase 4) consome. Storage + URL assinada por plano já vinham da Fase 1 (§5.2).

## 1. O que foi construído

### Worker (D1) — `lib/laboratorio/worker/`

| Arquivo | Responsabilidade |
| --- | --- |
| `sessao.ts` | `Sessao`: núcleo do Worker sem `self`/postMessage (testável em Node). Recebe catálogo (JSON), manifesto e um `Buscador`; `validar()` sem executar; `executar()` carrega só os grupos referenciados pelos chunks do universo e chama o mesmo `executarCompilada()` do servidor. Cache em dois níveis: memória (bytes por chave, LRU simples até 256 MB) e persistente (`CacheBytes`). `buscadorAssinado()` agrupa os pedidos do mesmo tick numa chamada a `/api/laboratorio/dataset?chaves=` (lotes de 200) e baixa do R2; `cacheApi()` guarda os chunks na Cache API (chaves versionadas → imutáveis). |
| `protocolo.ts` | Mensagens tipadas: `preparar` (catálogo + manifesto + endpoint), `validar`, `executar`, `limpar` → `pronto`, `validacao`, `progresso` (baixando/executando), `resultado` (RunResult serializado + carga), `erro` (com `erros[]` da estratégia). |
| `laboratorio.worker.ts` | O Worker em si (thin): mantém uma `Sessao` e responde ao protocolo. |
| `cliente.ts` | `criarLaboratorio()`: API em Promises para a UI (`preparar` busca `/api/laboratorio/catalogo`, `validar`, `executar` com `aoProgresso`, `limpar`, `encerrar`); `new Worker(new URL('./laboratorio.worker.ts', import.meta.url))`. |

### Servidor — `lib/laboratorio/data/servidor.ts`, `r2.ts`

- `lerManifest(versao?)` com cache de 60 s; `executarNoServidor(estrategia)` = mesmo pipeline do Worker com `buscadorR2` (GetObject direto, paralelismo 16); `resumoManifest()` para a UI (competições × temporadas, aliases).
- `resolverAliases(universo, manifest)` agora aceita **slug** do núcleo (`brasileirao-serie-a`), chave FPT crua e os aliases D12; todos os caminhos (Worker, servidor, CLI) passam por ela.
- `chunk.ts`: import de `node:zlib` marcado `webpackIgnore` (no navegador só a `DecompressionStream` é usada).

### Persistência — `prisma/schema.prisma` + migração `20260925230000_add_laboratorio_models`

| Modelo (tabela) | Campos principais |
| --- | --- |
| `BacktestStrategy` (`backtest_strategies`) | `definicao` (JSON `Estrategia`), `engineVersao`, `catalogoVersao`, `publica`, `tentativas`, `holdoutAberto` (Fase 5) |
| `BacktestRun` (`backtest_runs`) | `origem` WORKER/SERVIDOR, `datasetVersao`, `engineVersao`, `catalogoVersao`, `hash`, `nUniverso`, `nApostas`, `resumo` (kpis, caminho e CLV amostrados a 500 pontos, inferência, segmentos, avisos), `apostas` (≤ 2 000), `definicao` (cópia) |
| `BacktestIndicator` (`backtest_indicators`) | `formula`, `ast`, `tipo` (unidade), `publico`; único por (usuário, nome) |
| `BacktestTrialLog` (`backtest_trial_logs`) | `hashRegra` por usuário × estratégia — contador de tentativas (§6.6) |

A migração foi gerada com `prisma migrate diff` e **ainda não foi aplicada** ao banco (ver §4).

### API — `app/api/laboratorio/` (gate: sessão + `hasBacktestAccess`, D4; middleware já cobria o prefixo)

| Rota | Função |
| --- | --- |
| `GET /catalogo[?versao=]` | catálogo de campos (key, label, tipo, bloco, descrição, cobertura), funções virtuais, manifesto (o Worker precisa dos chunks) e resumo de competições×temporadas |
| `GET /dataset` · `GET /dataset?chaves=` | (Fase 1) `latest.json` e URLs assinadas de 15 min, até 400 chaves |
| `POST /run` | executa no servidor (`maxDuration` 60 s); `{ estrategia, salvar?, strategyId?, maxApostas?, bootstrap? }` → `{ resultado, carga, tentativas, runId }`; 422 com a lista de erros da estratégia |
| `GET/POST /runs`, `GET/DELETE /runs/[id]` | lista/salva (run do Worker: `{ strategyId?, definicao, resultado }`), lê completo, apaga |
| `GET/POST /estrategias`, `GET/PATCH/DELETE /estrategias/[id]` | CRUD; a definição é validada na forma (zod, `lib/laboratorio/api/schemas.ts`) e na semântica (`prepararEstrategia`); públicas de outros usuários são legíveis |
| `GET/POST /indicadores`, `PATCH/DELETE /indicadores/[id]` | "meus indicadores": fórmula → AST + unidade gravados; 409 em nome duplicado |

Helpers: `lib/laboratorio/api/auth.ts` (gate), `schemas.ts` (zod), `runs.ts` (`gravarRun`, `resumoParaBanco`, `hashRegra`, `registrarTentativa`), `indicadores.ts`.

## 2. Testes e build

- `npm run lab:test` → **183 testes** (12 arquivos): +18 nesta fase — `fase3.test.ts` (Sessao: run pelo Worker = run direto com **mesmo hash e KPIs**, só baixa grupos/chunks do universo, cache em memória e persistente, progresso, `validar`; `buscadorAssinado` agrupa pedidos; schemas; `hashRegra` ignora staking/seed; `amostrar`) e `rotas.test.ts` (auth 401/403, estratégias 400/422/201/404, runs do Worker + contador de tentativas, indicadores 422/201/409) com Prisma/auth mockados.
- `npx tsc --noEmit` limpo; `npx next build` passa (rotas `/api/laboratorio/*` compiladas como dinâmicas). O Worker ainda não entra em nenhum bundle porque nenhuma página o importa (Fase 4).

## 3. Critério de aceite: "run servidor reproduz o do Worker (mesmo hash)"

| Caminho | Universo | Carga | Hash |
| --- | --- | --- | --- |
| Worker (`Sessao`, teste) | sintético, 2 chunks | — | = run direto |
| CLI disco local | núcleo inteiro (532 chunks, 29,5 MB) | 1,7 s | `284cee4e21fbb225` |
| CLI R2 (GetObject direto, 8 paralelos, do Brasil) | idem | 37 s | `284cee4e21fbb225` |
| CLI disco local | típico: 10 ligas × 3 temporadas (27 chunks, 9 973 jogos, 2,5 MB) | 0,1 s | `2ffd9e543ff43b88` |
| CLI R2 | idem | 2,0 s | `2ffd9e543ff43b88` |

Conclusão operacional: o universo inteiro pelo servidor leva dezenas de segundos (latência por objeto ×
1 064 objetos) e é caso para o Worker com cache; a rota `/run` serve para runs salvos e universos
típicos (segundos). Da Vercel (mesma região do R2) a latência por objeto é menor que a medida aqui.

## 4. Pendências

1. **Aplicar a migração** no banco de produção: `npx prisma migrate deploy` (cria 4 tabelas vazias; sem alteração nas existentes). Até lá as rotas de estratégias/runs/indicadores falham com erro de tabela inexistente; `/catalogo`, `/dataset` e `/run` sem `salvar` funcionam.
2. Fase 4 (UI) valida o Worker de verdade no navegador: bundling pelo webpack, `DecompressionStream`, Cache API e cookies na chamada de URLs assinadas a partir do Worker (same-origin).
3. Limite de tamanho do `resumo`/`apostas` em JSON no MySQL compartilhado: 2 000 apostas ≈ 600 KB por run; se a tabela crescer, arquivar runs antigos ou guardar só o hash.
4. Rate limit da rota `/run` (custo de R2 + CPU) — hoje só o gate de plano.
