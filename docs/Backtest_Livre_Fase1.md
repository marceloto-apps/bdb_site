# Backtest Livre — Fase 1: Feature store (relatório, 25/09/2026)

Referência: `docs/Backtest_Livre_Plano.md` §4 e §8 (fases 1a e 1b). Decisões que entraram nesta fase: D11 (só bet365 e Pinnacle), D12 (ligas migrando da FPT para o núcleo), D13 (só chunks em storage, sem tabela larga).

## 1. Onde o código vive

| Papel | Repositório | Caminho |
| --- | --- | --- |
| Contrato (catálogo de campos, ligas só-FPT) | `bdb_site` | `lib/laboratorio/schema/` — `npm run lab:catalogo` gera o JSON e **copia** para o `bdb_ingest` |
| Builder puro (point-in-time) | `bdb_ingest` | `src/lib/laboratorio/{tipos,matematica,odds,janelas,liga,builder,chunk}.ts` |
| Loaders (núcleo + Flashscore + FPT) | `bdb_ingest` | `src/lib/laboratorio/carregar.ts` |
| Job | `bdb_ingest` | `src/jobs/laboratorio-build.ts` — `npm run lab:build [-- --apply] [--comp=slug] [--sem-fpt] [--so-padrao]` |
| Verificação contra o banco | `bdb_ingest` | `scripts/lab-verificar.ts <dir da versão> <slug>` |
| Testes | `bdb_ingest` | `src/lib/laboratorio/__tests__/` (vitest, 28 casos) |

Motivo da divisão: o produtor precisa do banco e roda na VPS (scheduler do `bdb_ingest`); o consumidor (engine + UI) roda no site. O JSON do catálogo é o contrato; o `manifest.json` de cada dataset registra `catalogoVersao` e `builderVersao`, e o engine recusa dataset com catálogo diferente do seu.

## 2. O que o builder faz (resumo do implementado)

- **Duas passagens**: (1) global, com o esqueleto de todas as partidas do universo (Elo, dias de descanso, jogos em 7/30 dias — cruzam competições); (2) por competição, com odds e estatísticas (janelas l5/l10/l20/season × all/venue, forma, sequências, tabela recalculada até a data, parâmetros da liga até a data, odds e derivados).
- **Point-in-time por construção**: cada linha é emitida antes de o jogo entrar em qualquer acumulador. ρ, π, variâncias e médias da liga usam só jogos anteriores; com menos de 20 jogos na temporada, usam o fim da temporada anterior (`league.params_src = prev_season`).
- **Carry-over**: janelas l5/l10/l20 atravessam temporadas dentro da mesma competição (é assim que 2021–2022 da FPT alimenta o início de 2023); `season` reinicia. Copas não entram nas janelas da liga (só no descanso e no Elo).
- **Chave FPT compartilhada** (Liga MX: "MEXICO 1" → Apertura e Clausura): a competição de menor `key` é a dona das partidas FPT sem vínculo; o teste "temporada coberta pelo núcleo" usa a união das temporadas das competições que compartilham a chave. Sem isso a mesma partida virava duas linhas (e o esqueleto global não batia com a carga).
- **Unificação** (§4.1.1 do plano): partida = núcleo; FPT vinculada só complementa (HT, CS, DC, EH, estatísticas quando o núcleo não tem); FPT sem vínculo entra apenas em temporadas que o núcleo não cobre; nas cobertas, o resíduo é contado (`fptResiduoTemporadaCore`) e fica fora. Odds: Flashscore (abertura/fechamento reais) → `MatchOdds` → FPT.
- **Chunks por grupo de colunas** (Fase 0 §5): 24 grupos por competição×temporada (`match` com `league`, `derived`, 4 de odds, 18 de time), Int32 escalado + gzip por coluna, dicionário para texto, chunk esparso (coluna toda nula não ocupa espaço), hash por grupo, `cobertura.json` por chunk e `manifest.json` por versão (competições, temporadas, cobertura de carga, nomes de times, aliases D12).

## 3. Testes (puros, dados sintéticos)

| Grupo | Casos | O que garantem |
| --- | --- | --- |
| contrato | 3 | o builder emite **exatamente** as chaves do catálogo (nem a mais, nem a menos), em todas as linhas |
| anti-vazamento | 7 | apagar todo o futuro e reconstruir dá a **mesma linha**; o próprio jogo não entra nas médias; parâmetros da liga só com 20 jogos anteriores, senão temporada anterior |
| janelas e forma | 5 | carry-over entre temporadas, isolamento de copas, escopo venue, tabela só em LEAGUE, forma/sequências |
| odds e derivados | 6 | probabilidades justas somam 1, linha principal, movimento, edge, λ de mercado, mercados só-FPT, jogo só-FPT |
| robustez | 2 | partida sem placar é ignorada; ordem de entrada não altera o resultado |
| chunk | 5 | grupos da convenção, ida e volta dentro da precisão, esparsidade, chave desconhecida, hash |

`npx vitest run` no `bdb_ingest`: 28 testes, todos verdes. `tsc --noEmit` limpo nos dois repositórios.

## 4. Verificação com dados reais (Brasileirão Série A, 25/09/2026)

Execução: `npm run lab:build -- --apply --comp=brasileirao-serie-a` (17,6 s, dos quais ~9 s para carregar o esqueleto do universo inteiro).

| Medida | Valor |
| --- | --- |
| Linhas | 2.176 em 6 temporadas (2024–2026 do núcleo; 2021–2023 só-FPT) |
| Cobertura de carga | núcleo 1.036 · FPT vinculada 1.036 · só-FPT 1.140 · resíduo em temporada coberta 1 · com Flashscore 655 · times provisórios 0 |
| Tamanho | 3 MB nos 24 grupos (≈ 1,4 KB por jogo com todos os grupos; uma regra típica carrega 4–8) |
| Colunas presentes | 959 de 984 (as ausentes são escanteios da Pinnacle e afins, sem dado na liga) |
| **Paridade com `match_team_stats`** (janela 10, jogos com ≥ 10 jogos na temporada) | **1.272/1.272 iguais, diferença máxima 0,000** |
| **bet365 fechamento: Flashscore vs `MatchOdds`** | 418/418 quando o `MatchOdds` já vem do Flashscore (100 %); 118/237 quando o `MatchOdds` é o legado da TheStatsAPI (captura em outro momento). A feature store adota o Flashscore como verdade |
| Cobertura média por família | pinnacle close 45 % (só núcleo 2024+), bet365 close 91 %, bet365 open 37 %, derived.bet365 69 %, home.l10 87 %, league 93 % |

Amostra decodificada (São Paulo × Vitória, 07/12/2025, rodada 38): bet365 abertura 1,86 → fechamento 2,50 (movimento +34 %), Pinnacle 2,55 (prob. justa 37,2 %), linha principal O/U 2,25, AH 0, λ de mercado 1,30 × 1,22, xG l10 do mandante 1,13, Elo 1.585, 18º na tabela com 42 pontos, μ da liga 1,53 × 1,00, ρ 0,03 com 378 jogos na temporada.

## 4.1 Construção completa do núcleo (`--apply --sem-fpt`, 25/09/2026, máquina local contra o banco de produção)

| Medida | Valor |
| --- | --- |
| Tempo total | 5 min 44 s (81 competições do núcleo, incluindo as recém-cadastradas sem jogos) |
| Linhas | **117.877** = 56.659 do núcleo + 61.274 só-FPT (temporadas 2021–2022 das ligas do núcleo e ligas recém-cadastradas) |
| Chunks / grupos | 462 chunks (competição×temporada) × 24 grupos; 1.831 times |
| Tamanho | **170 MB** com todos os grupos (1,5 KB por jogo). Maiores grupos: `odds.bet365.close` 15 MB, `match` 11 MB, cada janela de time 7–9 MB, `odds.pinnacle.*` 1,3 MB. Uma regra que use `match` + `odds.bet365.close` + `team.*.l10` carrega ~42 MB para o universo inteiro e ~4 MB para 10 ligas × 3 temporadas |
| FPT vinculada | 52.346 dos 56.659 jogos do núcleo (92 %) |
| Flashscore (abertura/fechamento reais) | 28.906 jogos (51 %; a coleta retroativa do scraper começou em ago/2026 e cobre 2024+) |
| Placar corrigido pela FPT (0-0 falso do núcleo) | 88 |
| Placar divergente mantido do núcleo | 118 (J2 League 30, Liga MX Apertura 8, Challenge League 9 — candidatos a vínculo errado, para o `identity:resolve`) |
| Resíduo FPT em temporada coberta (falha de reconciliação, fora da base) | 7.207 (12 % das FPT em temporadas cobertas). Maiores: National League 557, Primera A Colômbia 553, Primera Nacional 526, USL 518, Paraguai 430, Uruguai 361, J2 360 |
| Times provisórios (`fpt:` sem `teams.id`) | 13.525 aparições, concentradas em ligas recém-cadastradas no núcleo ainda sem resolver identidade (National League 3.231, 1ª Divisão dinamarquesa 1.350, League One escocesa 728, Primera Nacional 569, USL 463, 3. Liga 448) — vão sumindo conforme o `identity:resolve` roda (D10/D12) |
| Corrida com o sync | 1 partida terminou durante a execução e foi pulada com aviso (fica para a próxima execução) |

### 4.2 Reconstrução após o sync de placares e a regra de cobertura por rodada (25/09/2026, 16:47)

| Medida | Antes | Depois |
| --- | --- | --- |
| Linhas | 117.877 | **122.958** (57.595 núcleo + 65.363 só-FPT) |
| Resíduo FPT (fora da base) | 7.207 | **2.000** (USL 187, Chile 167, Challenger Pro League 157, Uruguai 132, 3. Liga 126, Colômbia 111, National League 104, MLS 103) |
| Placar corrigido pela FPT | 88 | 61 (os 42 corrigidos na fonte saíram da conta; os ~30 errados na própria API ficam) |
| Placar divergente mantido | 118 | 124 |
| Times provisórios (aparições) | 13.525 | 10.683 |
| Tamanho / tempo | 170 MB, 5 min 44 s | 182 MB (1,55 KB por jogo), 6 min 05 s, 529 chunks |

## 5. Estado dos critérios de aceite

| Critério (plano §8) | Estado |
| --- | --- |
| Teste "truncar futuro ⇒ bytes idênticos" | feito (linhas idênticas por `toEqual` em 4 pontos do dataset sintético; chunk determinístico por hash) |
| Paridade com `MatchTeamStats` nas médias existentes | feito, 100 % |
| ρ/π/var point-in-time | feito (acumuladores só com jogos anteriores; teste de fonte dos parâmetros) |
| bet365 Flashscore vs `MatchOdds` ±0,02 em ≥ 90 % | feito onde a base compara o mesmo dado (100 %); documentada a divergência com o legado |
| Relatório de cobertura por liga | `cobertura` por competição no manifest + `cobertura.json` por chunk |
| 1b: placar núcleo = FPT em ≥ 99,5 % dos vinculados | feito: **52.143/52.349 = 99,6 %** (2 invertidos; 0 com data distante). Dos 206 divergentes, a maioria é um defeito do **núcleo**: rodadas de 22–24/05/2026 (e 09/03 e 16/03/2025) gravadas FINISHED com 0-0 e sem estatística, enquanto a FPT tem o placar real. O loader corrige esse padrão com a FPT (`placarCorrigidoPelaFpt`) e conta o resto como `placarDivergente` mantendo o núcleo. **Ação fora do laboratório**: reprocessar esses dias no `sync-historical-scores` do núcleo |
| 1b: janelas de 2023 usam 2021–2022 da FPT | feito (carry-over medido: `home.l10.n_used > 0` no 1º jogo da temporada) |
| 1b: isolamento de jogo só-FPT | feito (teste: sem Pinnacle, sem abertura, `src_core = 0`) |
| Job no scheduler | registrado fora de processo, **desligado** (`LAB_BUILD_CRON` vazio) até existir consumidor e storage |
| Backfill completo na VPS | **pendente** (depende de decidir o storage R2 e de ligar o cron) |

## 5.1 Ações executadas no núcleo em 25/09/2026 (a pedido)

**Placares 0-0 falsos.** O `sync-historical-scores` só cobria uma janela fixa (8 a 5 dias atrás, temporada corrente). Ganhou `--from/--to` (temporada escolhida pela data), `--dry-run`, e o filtro padrão "só ligas com suspeitos na janela" (FINISHED 0-0 sem `MatchStats`). Executado nas quatro janelas:

| Janela | Partidas relidas da API | Placares corrigidos |
| --- | --- | --- |
| 22–24/05/2026 | 120 | 31 |
| 30/05/2026 | 18 | 5 |
| 06/06/2026 | 22 | 4 |
| 09–16/03/2025 | 69 | 2 |

Sobraram ~30 jogos (1ª Divisão irlandesa 22/05, J1 23/05, 2. Bundesliga, Allsvenskan, USL e Primera Nacional em mar/2025, Saudi 25/09/2025…) em que **a própria TheStatsAPI devolve 0-0 com status finished** — conferido com `GET /matches/{id}`. Aí o defeito é da fonte; a feature store continua cobrindo-os pela regra `placarCorrigidoPelaFpt`. Paridade núcleo × FPT nos vinculados passou de 99,6 % para **99,65 % (53.282/53.467)**.

**Vínculos FPT.** `fpt-resolve-teams-auto` (2 times: FC Halifax Town e Tamworth) e `fpt-reconcile` (bet365, append) executados: **0 partidas novas vinculadas** de 57.820 qualificadas. Diagnóstico: o resíduo não é falha de reconciliação, é **jogo que o núcleo não tem**. USL 2025 tem 43 jogos no núcleo (só março) contra 375 na FPT; Primera Nacional 2024 não existe no núcleo e 2025 só tem fev–mar; Colômbia tem só o Apertura (a FPT publica a temporada inteira como "COLOMBIA 1"); National League 23/24 não existe. A correção é **backfill dessas temporadas no núcleo** (`backfill-league` / `auto-backfill`), fora do laboratório.

**Consequência na feature store.** A regra "FPT sem vínculo só entra em temporada que o núcleo não cobre" descartava essas rodadas inteiras. Passou a ser por **rodada**: a partida FPT sem vínculo só é resíduo se o núcleo tem jogo daquela competição em ±1 dia (`datasCobertasPorRaw` / `rodadaCoberta` em `carregar.ts`). Efeito: USL passou de 1.106 para 1.737 linhas só-FPT com 187 de resíduo (antes 518); Colômbia de 553 de resíduo para 111. O que sobra de resíduo é jogo isolado numa rodada coberta — candidato real a falha de vínculo ou adiamento.

## 5.2 Storage R2 (25/09/2026)

Bucket `bdb-laboratorio` (ENAM) criado pelo usuário, com dois tokens restritos ao bucket: leitura e escrita no `bdb_ingest` (variáveis `R2_*` no `.env`), somente leitura no site (`.env.local` e Vercel). CORS do bucket liberado para `GET`/`HEAD` dos domínios do site.

- `bdb_ingest/src/lib/laboratorio/storage.ts`: cliente S3 apontando para `https://<account>.r2.cloudflarestorage.com`, upload em paralelo (8), `Cache-Control: immutable` nos chunks e `no-cache` no `latest.json`, que é gravado por último; poda mantendo `LAB_R2_MANTER_VERSOES` (5) versões. O job publica sozinho quando as variáveis existem (`--sem-publicar` desliga).
- `bdb_site/lib/laboratorio/data/r2.ts` + `GET /api/laboratorio/dataset`: URL assinada de 15 min por chave, validação estrita do formato da chave, gate por login e plano do backtest, rota no middleware.
- Teste ponta a ponta: Série A publicada (152 objetos, 3,2 MB, versão `20260925-1755`); o site leu `latest.json` e o manifesto com o token somente leitura, assinou a URL de `odds.bet365.close.bin` e baixou 39.682 bytes idênticos ao esperado em 466 ms, cabeçalho decodificado (380 linhas, 76 colunas).
- Layout no bucket: `latest.json`, `<versao>/manifest.json`, `<versao>/<competição>/<temporada>/<grupo>.bin|cobertura.json`. O `dir` do manifesto usa sempre `/`.
- Publicação completa do núcleo (25/09/2026, versão `20260925-1756`, `--apply --sem-fpt`): 81 competições, 535 chunks, 123.187 linhas, 13.377 objetos, 199,3 MB no bucket (182,8 MB de chunks + `cobertura.json`/manifesto); o site leu `latest.json` e o manifesto da versão nova com o token somente leitura. Token do site verificado: leitura e download assinado ok, `PutObject` negado (403). Uma partida entrou no núcleo durante a carga e foi pulada com aviso (`foraDoContexto`), como previsto.

## 6. Pendências e próximos passos

1. **Storage (D13)**: feito (§5.2), com o núcleo inteiro já no bucket. Falta subir o `bdb_ingest` na VPS com as `R2_*` e rodar o primeiro build lá.
2. **Ligar o cron** (`LAB_BUILD_CRON='30 9 * * *'`) depois do primeiro backfill manual na VPS.
3. **Fase 1b — pendências de identidade**: unificar `SPAIN Primera Rfef Group 1/2` com `SPAIN 3`; checar placar núcleo × FPT nos vinculados; hora local (fuso) para `match.hour_local` (hoje é hora UTC no núcleo e null na FPT).
4. **Fase 2 — engine** no site: leitor de chunks (browser + Node), parser/compilador de fórmulas, entradas, liquidação, staking, métricas.
