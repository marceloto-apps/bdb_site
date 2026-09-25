# Backtest Livre — Fase 0: Fundações (relatório, 24/09/2026)

Referência: `docs/Backtest_Livre_Plano.md` §8. Entregas da fase: catálogo de campos v1, mapa das ligas só-FPT e spike de desempenho do engine.

## 1. Entregas

| Entrega | Onde | Estado |
| --- | --- | --- |
| Catálogo de campos v1 (templates) | `lib/laboratorio/schema/catalogo.ts` | feito — 1.315 campos na v1.0; **984 na v1.1.1** após a D11 (só bet365 e Pinnacle ativas: bloco odds 520 → 188) |
| Catálogo exportado | `lib/laboratorio/schema/catalogo.v1.json` (máquina) e `docs/Backtest_Livre_Catalogo_v1.md` (revisão) | gerado por `npm run lab:catalogo` |
| Mapa das 86 ligas só-FPT | `lib/laboratorio/schema/ligas-fpt.ts` | feito — país, ISO, nível, tipo, feminino, inclusão padrão |
| Spike de desempenho | `scripts/laboratorio/spike-engine.ts` (`npm run lab:spike [linhas] [colunas]`) | rodado em 55 k e 300 k linhas |
| Testes | `tests/laboratorio/catalogo.test.ts` | 13 casos (unicidade, convenção, precedência de fontes, simetria do bloco team, ligas) |

## 2. Catálogo v1 — números

| Bloco | Campos | Observação |
| --- | --- | --- |
| match | 32 | identificação, resultado (só liquidação), flags de origem |
| odds | 520 | 4 casas completas (pinnacle, bet365, avg, best) + 10 reduzidas × abertura/fechamento; CS/EH/DC só no fechamento (FPT); 1º tempo só Flashscore/FPT |
| derived | 33 | movimento de linha, λ de mercado, edge bet365 × Pinnacle, nº de casas |
| team | 712 | 2 lados × 2 escopos (all, venue) × 4 janelas (l5, l10, l20, season) × 42 estatísticas + 20 medidas sem janela por lado |
| league | 18 | μ, var, π, ρ, xG, margens médias — sempre até a data |
| **total** | **1.315** | |

Campos por fonte: core 1.050 · fpt 833 · fs 431 (um campo pode ter várias fontes, em ordem de precedência).

Decisões embutidas no catálogo (revisar na leitura do `Backtest_Livre_Catalogo_v1.md`):
- Nomes em inglês curto e estável para fórmulas (`home.venue.l10.xg_against`), rótulos em pt-BR para a UI.
- Tipos como unidades (odd, prob, line, goals, xg, pct…) para o validador barrar comparações sem sentido.
- Resultado do jogo (`match.ft_*`, `match.ht_*`, `match.corners_*`) existe só para liquidação; o validador de regras recusa esses campos em condições de entrada.
- Casas reduzidas carregam só 1X2, BTTS, O/U principal e AH principal (12 campos por snapshot) para conter o tamanho.

## 3. Ligas só-FPT — resumo

86 chaves: 60 ligas, 17 copas, 5 torneios internacionais de clubes, 4 de seleções; 7 femininas. 44 entram por padrão (69,5 k jogos de 131,6 k). Fora do padrão: femininas, amostra < 300 jogos, ligas sem estatística nem odds consistentes (Serie D, Segunda Federación, National 2, segundas divisões de Bósnia, Chipre, Egito, Irlanda do Norte, África do Sul, Ucrânia e Venezuela) e copas de eliminação (o usuário pode ligar qualquer uma).

Pendências para a Fase 1b:
- `SPAIN Primera Rfef Group 1/2` são chaves novas de 2026/27 da mesma competição de `SPAIN 3`: unificar.
- `WORLD WORLD CUP` mistura Copa e eliminatórias; o núcleo tem só a Copa 2026. Manter separado como seleções.
- `ENGLAND CUP` e `ARGENTINA 3` juntam competições distintas numa chave; tratar como uma competição virtual cada.

## 4. Spike de desempenho — resultados

Ambiente: Node (V8, o mesmo motor do Chrome/Edge) em `worker_threads`, dados sintéticos com aparência real (odds com 2 casas, taxas, contagens, 8 % de nulos, 30 % das colunas ausentes por liga como acontece com xG e casas do Flashscore). Regra de teste com 5 colunas: `odd_open × novig_close − 1 > $p1 and xg_l10 >= $p2 and close/open < 1.3`.

### 4.1 Cálculo (55.496 linhas — o núcleo inteiro)

| Medida | f32 | i32 escalado | Meta (§5.3) |
| --- | --- | --- | --- |
| Ler cabeçalho | 0,8 ms | 0,5 ms | — |
| Decodificar só as 5 colunas da regra | 8,9 ms | 6,6 ms | — |
| Decodificar todas as 910 colunas presentes | 918 ms | 838 ms | — |
| Avaliar a regra (55 k linhas) | 3,4 ms | 8,0 ms | < 100 ms |
| Liquidar 7,7 k apostas + curva + drawdown | 2,3 ms | 1,9 ms | — |
| Bootstrap em blocos, 2.000 reamostras | 187 ms | 162 ms | < 2 s |
| Monte Carlo, 2.000 caminhos × 7,7 k apostas | 225 ms | 216 ms | < 2 s |
| Varredura de 200 combinações (regra + liquidação + métricas) | 493 ms | 460 ms | < 10 s |

### 4.2 Escala do universo completo (300.000 linhas — núcleo + FPT)

| Medida | f32 | i32 |
| --- | --- | --- |
| Decodificar 5 colunas | 38 ms | 34 ms |
| Regra | 7 ms | 8 ms |
| Bootstrap 2.000 (41 k apostas) | 1,2 s | 2,0 s |
| Monte Carlo 2.000 | 1,1 s | 1,2 s |
| Varredura 200 | 2,4 s | 2,4 s |

**Cálculo não é gargalo.** Todas as metas foram batidas com folga de 10× a 30×, mesmo no universo completo.

### 4.3 Tamanho dos dados (o gargalo real)

| Medida | f32 | i32 escalado |
| --- | --- | --- |
| Bruto (910 colunas × 55 k) | 193 MB | 193 MB |
| gzip | 80,6 MB | 72,4 MB |
| gzip por jogo | 1.523 B | 1.368 B |
| Universo típico (10 ligas × 3 temporadas ≈ 11,4 k jogos) | 16,6 MB | 14,9 MB |
| Núcleo inteiro (55 k) | 81 MB | 72 MB |
| Universo completo com FPT (300 k) | 436 MB | 391 MB |

Um chunk monolítico por liga×temporada com todas as colunas **não atende** a meta de carregar o universo típico em < 3 s (15 MB), e o núcleo inteiro (72 MB) é inviável no navegador. Dados reais comprimem melhor que os sintéticos (valores repetidos, muitos nulos, inteiros), mas não a ponto de mudar a conclusão.

## 5. Decisões de projeto que saem da Fase 0

1. **Chunk por grupos de colunas, carregado sob demanda.** Cada liga×temporada vira um diretório com um arquivo por grupo: `match` (com `league`), `derived`, `odds.<casa>.<snapshot>` (28 grupos), `team.<lado>.<escopo>.<janela>` (16 grupos), `team.<lado>.extra` (2). O manifesto lista grupos, tamanhos e hash. O Worker resolve os campos referenciados pela regra e pelas entradas → grupos → baixa só esses. Uma regra típica toca 4 a 8 grupos, ou seja, 100 a 250 B por jogo em vez de 1.400: universo típico ≈ 1,5–3 MB, núcleo inteiro ≈ 6–14 MB, universo completo ≈ 30–75 MB (este último com aviso e opção de rodar no servidor).
2. **Int32 escalado por coluna** (odds ×1000, probabilidades ×10000, linhas ×4, estatísticas ×100), sentinela para nulo. 10 % menor que Float32 e sem ruído de mantissa; decodifica para Float64 no Worker.
3. **gzip** como compressão (o navegador descomprime nativamente com `DecompressionStream`); brotli fica como otimização opcional no storage.
4. **Cache no navegador por hash do grupo** (`Cache API`): republicar um chunk só invalida os grupos que mudaram.
5. **Formato de referência para a Fase 1**: cabeçalho JSON + blocos por coluna, como no protótipo do spike (`codificarChunk`/`decodificarColuna`); Arrow/Parquet descartados por não trazerem ganho que justifique a dependência.
6. **Modo servidor** (rota Node da Fase 3) continua no plano para o universo completo e para runs salvas; o mesmo código do Worker roda lá lendo `bt_match_features`.

## 6. Critério de aceite da Fase 0

| Critério | Resultado |
| --- | --- |
| Metas da §5.3 atingidas no spike | sim, com folga; a meta de carga exige o formato por grupos (item 5.1) |
| Catálogo v1 revisado pelo usuário | **pendente** — `docs/Backtest_Livre_Catalogo_v1.md` |
| Mapa das ligas só-FPT | feito, com 3 pendências para a Fase 1b (§3) |

## 7. Próximo passo

Fase 1a (feature store do núcleo + Flashscore): builder puro em `lib/laboratorio/features`, job no `bdb_ingest`, tabelas `bt_match_features` e `bt_coverage`, gerador de chunks por grupo, teste "truncar futuro ⇒ bytes idênticos".
