# Backtest Livre — Fase 2: Engine (25/09/2026)

Plano: `docs/Backtest_Livre_Plano.md` §5 (engine), §6 (métricas) e §8 (fases). Entrega: AST + parser +
compilador + universo + entradas + liquidação + staking + métricas núcleo + `run.ts`, o leitor de chunks
(navegador e Node) e a CLI `npm run lab:run`. Tudo puro (sem Prisma, `next` ou DOM) em
`lib/laboratorio/engine` e `lib/laboratorio/data`, o mesmo código para Worker, rota Node e testes.

## 1. O que foi construído

| Arquivo | Responsabilidade |
| --- | --- |
| `engine/tipos.ts` | `Dataset` em memória (colunas `Float64Array`, NaN = nulo; texto como `(string\|null)[]`), `Estrategia` (JSON persistido), `Entrada`, `Staking`, `Aposta`, `RunResult`, `ENGINE_VERSAO` |
| `engine/ast.ts` | Nós do AST (JSON puro), `resolver()` (id → campo / indicador / seleção), `validar()` (limites de 2 000 nós e profundidade 64, allow-list de 24 funções, tipagem por unidade: rejeita `odd > prob`, `implied(prob)`, `ev(odd, prob)`, `if(home, 2)`; avisa `goals > xg`), `camposReferenciados()` (inclui os implícitos de `model()` e `rank()`) |
| `engine/parser.ts` | Tokenizador + recursivo-descendente sem `eval`: precedência `or < and < not < comparação < + − < × ÷ < unário < ^` (direita), identificadores com ponto e dígito (`odds.bet365.close.1x2.h`), `$p`, strings, `#`/`//`, `&&`/`\|\|`/`!`, `model(DC, FORCAS, l10).p_over(2.5)`, `rank(expr, day)`; programa com `nome = expr` por linha e continuação por parêntese/operador; `imprimir()` faz AST → texto (ida e volta testada) |
| `engine/compile.ts` | AST → `(i) => number`. Lógica de três valores (`false and null = false`, `true or null = true`), comparações de texto com string/seleção, 24 funções, `rank`/`pct_rank` por escopo (`day`, `round`, `league_season`) com cache |
| `engine/matematica.ts` | No-vig proporcional / power / Shin / odds-ratio; Poisson, Dixon-Coles (ρ limitado ao domínio válido), ZIP, binomial negativa; 1X2, BTTS, placar, totais e AH em qualquer linha (quartos divididos em duas metades) sobre a matriz; RNG mulberry32; normal, t → p-valor; `hash64` |
| `engine/modelos.ts` | `model(...)`: λ como no backtest atual (`projections.ts`: MEDIA, FORCAS, XG) + MERCADO (`derived.<casa>.market_lambda_*`), matriz por linha com cache de uma entrada; saídas `p_h/p_d/p_a/p_btts/p_over(L)/p_under(L)/p_ah(L, lado)/p_cs(h, a)/lambda_h/lambda_a` |
| `engine/entradas.ts` | Mapa (mercado, casa, snapshot, seleção, linha) → colunas do catálogo (96 combinações válidas; Pinnacle sem HT/DC/EH/CS; DC/EH/CS só no fechamento); resolução por linha (seleção/linha por expressão, `main` ou fixa, slippage, filtros de odd, preço de decisão ≠ liquidação); referência q̂ = no-vig do fechamento Pinnacle com fallback bet365 rotulado "soft" (DC usa o 1X2 da Pinnacle) |
| `engine/liquidacao.ts` | 11 mercados: 1x2, btts, ou, ah, corners, ht_1x2, ht_ou, ht_ah, dc, eh, cs; mesma aritmética ×4 do `settlement.ts` atual; VOID sem placar |
| `engine/staking.ts` | flat, % do banco (mín/máx), Kelly fracionário (prob por expressão, cap, mínimo), to-win; unidade flat para comparabilidade |
| `engine/universo.ts` | competições, temporadas (chave ou rótulo), datas, fontes (`core`/`fpt`), tipo, feminino (manifesto), rodadas iniciais, cobertura mínima |
| `engine/metricas.ts` | §6.1 resultado (yield, ROI banco, lucro flat, hit, break-even, PF, payoff, odd média/ponderada); §6.2 caminho (banco, MDD u/%, duração, recuperação, underwater, 5 maiores DDs, sequências, Sharpe/Sortino/Calmar); §6.3 EV e CLV bruto/no-vig/pontos, beat rate, curvas real × esperado × CLV, t do CLV, % soft; §6.4 t e p (H0 yield = −margem), z de Buchdahl, n mínimo, bootstrap em blocos por dia (IC95 de yield, MDD e CLV); §6.5 segmentos (competição, temporada, mês, odd, mercado, entrada, seleção, favorito/zebra, faixa de EV, faixa de CLV) |
| `engine/estrategia.ts` | `prepararEstrategia()`: parse (fórmula) ou AST (builder), resolução, ordenação de indicadores por dependência (ciclo = erro), validação de entradas/staking/universo com **todos os erros de uma vez**, campos a carregar, aviso de **leakage** (perna na abertura com fórmula que lê o fechamento ou `derived.*.move_*`/`line_shift_*`) |
| `engine/run.ts` | Orquestra: universo → indicadores → regra → candidatas por perna → ordem cronológica → staking (exposição/dia, stop de drawdown) → liquidação → referência → métricas → avisos (cobertura, amostra < 300, referência soft, viés de disponibilidade de odds < 80 %) → hash de reprodutibilidade |
| `engine/catalogo.ts` | Ponte com `lib/laboratorio/schema` (única dependência externa do engine; o Worker pode receber o JSON) |
| `data/chunk.ts` | Leitor do formato 1 (header JSON + gzip por coluna, Int32 escalado, dicionário, data em minutos) com `DecompressionStream` (navegador/Node ≥ 18) e fallback `zlib`; decodifica só as colunas pedidas |
| `data/dataset.ts` | Manifesto, `filtroDoUniverso()` (competição/temporada/datas/feminino), aliases D12, `carregarDataset()` concatenando chunks com um `Buscador` abstrato (URL assinada, disco, R2), paralelismo 6 |
| `scripts/laboratorio/run.ts` | CLI `npm run lab:run -- estrategia.json [--dir=… \| R2] [--versao=] [--json=] [--csv=] [--bootstrap=]`; tearsheet resumido no terminal |
| `scripts/laboratorio/paridade-backtest.ts` | Paridade com o backtest atual (§3) |
| `scripts/laboratorio/exemplos/*.json` | Os 5 exemplos da §5.2 do plano + Kelly com lado por expressão |

Estratégia (JSON persistido na Fase 3):

```json
{ "versao": 1, "nome": "…",
  "universo": { "competicoes": [], "temporadasLabel": ["2025"], "de": "2025-01-01", "fontes": ["core"], "tipos": ["LEAGUE"], "excluirRodadasIniciais": 3, "coberturaMinima": ["odds.pinnacle.close.1x2.h"] },
  "parametros": { "p1": 0.05 },
  "indicadores": [{ "nome": "edge_h", "expressao": { "formula": "…", "ast": {…} } }],
  "regra": { "formula": "edge_h > $p1" },
  "entradas": [{ "mercado": "ou", "selecao": "over", "linha": "main", "preco": { "casa": "bet365", "snapshot": "close" }, "liquidacao": {…}, "condicao": {…}, "oddMin": 1.5, "slippage": 0.01, "stakeMult": 1 }],
  "staking": { "metodo": "kelly", "fracao": 0.25, "cap": 0.05, "prob": { "formula": "…" } },
  "bancoInicial": 1000, "exposicaoMaxDia": 50, "stopDrawdown": 0.4, "referencia": { "casa": "pinnacle", "snapshot": "close" }, "seed": 42, "bootstrap": 1000 }
```

## 2. Testes

`npm run lab:test` → **165 testes puros** em `tests/laboratorio` (10 arquivos, ~2 s), sem banco: 151 novos da Fase 2 + 14 do catálogo (Fase 0):

- parser (22): tokens, precedência, `model`/`rank`, programa multi-linha, ida e volta `imprimir()`, os 5 exemplos do plano;
- ast (19): resolução, limites, allow-list, aridade, unidades (`odd × prob`, `implied`, `ev`, `if` misto, `novig`);
- matemática (24): 4 métodos de no-vig (soma 1, ordem, viés favorito-zebra, odds justas); **paridade célula a célula com `lib/analytics`** (Poisson, Dixon-Coles, ZIP a 1e-6, NB com e sem fallback) e com `calcularMercados`; linhas de quarto (EV = média das metades); AH espelhado; estatística e RNG;
- liquidação (16): todos os mercados e **fuzz de 2 000 apostas contra `liquidarAposta`** do backtest atual (mesmo resultado, mesmo pnl);
- compilador (20): três valores, NaN, texto, funções, `model` (Σ = 1 nos 16 pares modelo × λ), `rank`/`pct_rank`;
- entradas (15): 96 combinações válidas apontam para campos existentes, `main`/fixa/expressão, slippage, decisão ≠ liquidação, referência com fallback soft;
- métricas (12): KPIs alinhados a `calcularKPIs` (hit rate, pnl, contagens), MDD/duração/recuperação/underwater, CLV, inferência (estratégia sem edge → p ≈ 1; com edge → t > 5), determinismo do bootstrap, buckets;
- run (16): flat no mandante jogo a jogo = `liquidarAposta`; apostar no fechamento Pinnacle ⇒ CLV bruto 0 e no-vig < 0; regra/universo/indicadores; 5 exemplos; duas pernas + seleção por expressão; % banco, Kelly (respeita cap e banco), to-win, exposição/dia, stop de drawdown; determinismo/hash/serialização; fallback soft; leakage;
- chunks (7): decodificação por tipo, colunas pedidas, formato/truncamento, grupos, montagem multi-chunk com colunas ausentes, filtro do universo e aliases, divergência de linhas.

`npx tsc --noEmit` limpo no projeto.

## 3. Paridade com o backtest atual (critério da §8)

Estratégia "1X2 mandante, flat 1u, bet365 fechamento", legado = `matches` FINISHED + `MatchOdds` PREMATCH_CLOSING
(bet365 preferida) + `liquidarAposta`; novo = engine sobre os chunks (`npx tsx scripts/laboratorio/paridade-backtest.ts`):

| Competição × temporada | Jogos (legado = novo) | Idênticos (odd e P&L) | Odd diferente | Resultado W/L diferente | P&L legado × novo |
| --- | --- | --- | --- | --- | --- |
| Brasileirão 2025 | 379 = 379 | 245 (64,6 %) | 134 | **0** | 11,16 × 10,05 |
| Premier League 24/25 | 380 = 380 | 347 (91,3 %) | 33 | **0** | −69,97 × −69,61 |
| Serie A 24/25 | 377 = 377 | 209 (55,4 %) | 168 | **0** | −62,87 × −61,86 |

Mesmos jogos, mesmos resultados; **todas** as odds diferentes vêm de `MatchOdds.source = HISTORICAL` (TheStatsAPI),
enquanto a feature store prefere o fechamento Flashscore (`bdbs_odds_snapshot`, decisão D9 e Fase 1 §5).
Onde o `MatchOdds` já é Flashscore a paridade é 100 %, como medido na Fase 1. A diferença típica é de
0,01–0,15 na odd (Flamengo × Internacional: 1,75 legado, 1,80 Flashscore).

## 4. Exemplos da §5.2 em dados reais (núcleo, 81 ligas, 57 903 jogos de liga, versão `20260925-1756`)

| # | Estratégia | Carga | Avaliação | n | Yield | CLV no-vig | Observação |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | edge da abertura bet365 vs fechamento Pinnacle > 3 %, mandante | 32 MB, 1,5 s | 89 ms | 3 531 | +10,9 % | +11,9 % (beat 100 %) | **aviso de leakage**: a regra lê o fechamento e aposta na abertura — é "bater o fechamento" com o fechamento na mão |
| 2 | Pinnacle encurtou ≥ 7 % e mandante em forma | 38 MB, 1,2 s | 53 ms | 989 | −3,7 % | −3,8 % | apostar no fechamento Pinnacle: CLV bruto 0, yield ≈ −margem (2,1 %) ± ruído |
| 3 | Dixon-Coles (forças, l10) 5 p.p. acima do mercado no over 2.5 | 46 MB, 1,4 s | 733 ms | 9 669 | −7,0 % | −5,4 % | 69 % das referências soft (bet365); IC95 [−9,0 %, −5,0 %]: o modelo simples não bate o mercado |
| 4 | AH ≤ −0.75 e O/U ≥ 3.0 → over | 30 MB, 1,3 s | 36 ms | 395 | −2,1 % | −3,9 % | amostra pequena (aviso) |
| 5 | xG combinado > 1.7 e over 2.5 < 55 % | 47 MB, 2,7 s | 78 ms | 2 048 | −3,4 % | −4,5 % | 56 % soft |
| 6 | lado com maior edge vs Pinnacle, Kelly ¼ cap 5 % | 30 MB, 0,8 s | 71 ms | 1 453 | −3,8 % (ROI banco −31 %) | +7,1 % (beat 100 %) | edge só na diferença de margem bet365 × Pinnacle no fechamento; CLV positivo não virou lucro (t = −2,1): amostra e variância do Kelly |

Metas da §5.3: avaliação de regra 36–89 ms (meta < 100 ms), com `model()` 733 ms sobre 57 k linhas (11×11 por jogo);
carga do núcleo inteiro 0,8–2,7 s do disco local (meta de 3 s era para 10 ligas × 3 temporadas com cache no
navegador); bootstrap de 500 reamostras em blocos < 1 s. O exemplo 1 mostra o valor do aviso de leakage:
sem ele o usuário veria um yield de 11 % com beat rate de 100 % e acreditaria.

## 5. Decisões de implementação (dentro das decisões do plano)

- **Turnover inclui devoluções** (REFUND) e `n` também; VOID (sem placar) fica fora de tudo. O legado usa "exposição efetiva"; o KPI `hitRate` e as contagens batem.
- **EV e CLV no-vig coincidem na v1** (`o·q̂ − 1` com q̂ do fechamento): passam a diferir quando o EV vier de probabilidade de modelo (Fase 5, calibração).
- **DC/EH/CS só bet365 fechamento; HT só bet365** (catálogo D11); referência de DC usa o 1X2 da Pinnacle (q̂) e a odd de DC da bet365 (CLV bruto).
- **Kelly** usa a probabilidade da expressão do usuário e o banco corrente; cap e mínimo opcionais; `stakeMult` por perna.
- **Ordem cronológica** por (data, matchId, entrada); banco atualizado aposta a aposta; exposição/dia por dia UTC.
- **H0 da inferência**: yield = −margem média (1/odd − q̂) quando há referência; sem referência, yield = 0.
- **Segmentação favorito/zebra** = odd ≤ 2 nas seleções 1X2 (a definição por `derived.*.fav_side` exige carregar o grupo `derived`; fica para a UI escolher).
- **Sem `lib/analytics` no engine**: as distribuições foram reimplementadas (o barrel importa Prisma) e a paridade é garantida por teste.

## 6. Pendências e próximos passos

1. **Fase 3 — dados e API**: Worker (`lib/laboratorio/worker`) com cache de grupos por hash (Cache API), `POST /api/laboratorio/run` (Node) reutilizando `executar()`, modelos Prisma `BacktestStrategy`/`BacktestRun`/`BacktestIndicator`/`BacktestTrialLog`; o `Buscador` do navegador é `fetch` da URL assinada de `/api/laboratorio/dataset?chaves=`.
2. **Fase 5** (já com gancho): `sweep` de `$p`, walk-forward, holdout selado, contador de tentativas/deflação, Monte Carlo, calibração (Brier/log-loss vs Pinnacle), estratégia aleatória nos mesmos jogos.
3. Métodos de no-vig alternativos (power/Shin/odds-ratio) só existem em `novig(...)`; a referência q̂ é proporcional (plano). Configurável na Fase 4 se fizer sentido.
4. `pct_rank`/`rank` recalculam por run sem cache entre runs; ok para < 300 k linhas (medido: regra com dois ranks sobre 57 903 jogos em 108 ms).
5. Hora local (`match.hour_local`) segue pendente da Fase 1b; `match.dow` já serve para filtros por dia da semana.
