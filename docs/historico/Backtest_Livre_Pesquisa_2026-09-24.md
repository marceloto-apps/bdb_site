# Backtest Livre — Pesquisa de referências (24/09/2026)

Material de apoio ao `docs/Backtest_Livre_Plano.md`. Fontes verificadas via web em 24/09/2026; itens marcados "(indireto)" foram lidos por conteúdo indexado ou por fontes que reproduzem o mesmo material.

## 1. Produtos de backtest para apostas

### Betaminic / Betamin Builder
- https://www.betaminic.com/betamin-builder/ · FAQ https://www.betaminic.com/betamin-builder/faqs-support/ · tutorial https://www.betaminic.com/how-to-create-profitable-strategies-with-betamin-builder/
- 111 ligas desde 2012; odds de abertura e fechamento de casas asiáticas; P&L a 1 unidade sobre odds de fechamento; mercados 1X2, O/U 2.5, Double Chance, DNB.
- Filtros: ligas, faixas de odds, streaks/forma, % over/under por janela, posição. Métricas: profit, yield, max drawdown, nº picks; P&L acumulado, mensal; aggregator de portfólio; paper trading.
- Crítica (trial 9 meses, 2.190 apostas, https://www.bettingexchangetrials.com/betaminic-review/): drawdown real 51,5% do banco; seleção com abertura e P&L com fechamento; sem train/test, p-valor, CLV.

### Football Backtester (grátis)
- https://www.footballbacktester.com/ — dados Football-Data (closing) 2010+, 18 ligas.
- Métricas: retorno líquido, %, hit rate, max drawdown, sequências, "stability score", buckets de preço, mensal; curva e gráfico underwater; comparação de 5 estratégias; 5 métodos de staking (Kelly, Fibonacci); Monte Carlo e train/test.

### Outros
- StatisticSports https://statisticsports.com/en/backtesting-features (indireto): "notifications" testadas contra jogos finalizados; limite 25–50 k jogos.
- BetLab https://betlab.club/en/retro-analysis: ROI, win rate, drawdown, odd média; clonagem; CSV.
- Futbolpractice https://futbolpractice.com/backtesting-betting-systems/: yield, units, hit ratio, sample, avg odd, MDD por janela.
- Predictology https://www.predictology.co/blog/backtesting-betting-strategies-how-to-build-a-winning-football-system/: centenas de variáveis (xG, splits casa/fora, forma), recomenda 3–5 variáveis núcleo.
- FootyStats https://footystats.org/matches: filtro por estatísticas → retorno para todos os mercados (últimos 300 jogos).
- Bet-Analytix https://www.bet-analytix.com/: tracker/bankroll com 50+ estatísticas.

### CLV e testes de habilidade
- Pinnacle CLV: https://www.pinnacle.com/betting-resources/en/educational/what-is-closing-line-value-clv-in-sports-betting
- Pinnacle, credibilidade de tipster: https://www.pinnacle.com/betting-resources/en/betting-strategy/how-to-test-the-credibility-of-a-tipsters-record/k2s22nq86vuu67ba
- Pinnacle, faixa de retornos: https://www.pinnacle.com/betting-resources/en/educational/how-to-model-your-range-of-possible-betting-returns/yzhj2hseamwsy89k
- Pinnacle, Kelly fracionário: https://www.pinnacle.com/betting-resources/en/betting-strategy/revisiting-the-kelly-criterion-part-2-fractional-kelly/gbd27z9nljvgflgg
- Buchdahl CLV (indireto): https://www.pinnacleoddsdropper.com/blog/closing-line-value--clv-demystified-by-expert-joseph-buchdahl
- Football-Data notes (odds coletadas sexta/terça; colunas C de fechamento): https://www.football-data.co.uk/notes.txt
- Football-Data, testar modelo (TTEST esperado × real): https://www.football-data.co.uk/blog/model_testing.php
- Football-Data, sorte × habilidade: https://www.football-data.co.uk/blog/luck_skill_sports_betting.php
- Buchdahl, *The Wisdom of the Crowd*: https://www.football-data.co.uk/The_Wisdom_of_the_Crowd_updated.pdf
- The Staking Machine, t-score: https://www.thestakingmachine.com/t-score-and-p-value/
- RebelBetting CLV: https://www.rebelbetting.com/valuebetting/closing-line · FAQ https://www.rebelbetting.com/faq/expected-value-and-variance
- WinnerOdds p-valor e drawdown esperado: https://winnerodds.com/valuebettingblog/p-value-and-expected-maximum-drawdown-spreadsheet-for-sports-betting/ · https://winnerodds.com/valuebettingblog/testing-your-betting-system
- Sportmonks CLV: https://www.sportmonks.com/glossary/closing-line-value-clv/
- Trademate review: https://thetradingreview.com/trademate-sports-review/ · BetBurger: https://www.betburger.com/valuebet

### Open source e papers
- penaltyblog backtest: https://penaltyblog.readthedocs.io/en/master/backtest/backtest.html · https://github.com/martineastwood/penaltyblog
- sports-betting (georgedouzas): https://georgedouzas.github.io/sports-betting/
- flumine: https://betcode-org.github.io/flumine/quickstart/ · https://betfair-datascientists.github.io/tutorials/flumineSimulations/ · dados Betfair https://historicdata.betfair.com/
- OddsPapi, como backtestar: https://oddspapi.io/blog/backtest-betting-model-free-historical-odds/
- Kaunitz, Zhong & Kreiner 2017: https://arxiv.org/abs/1710.02824
- Uhrín et al. 2021, staking ótimo: https://arxiv.org/abs/2107.08827
- Kaggle: https://www.kaggle.com/code/ronaldoaf/creating-a-betting-strategy-using-only-the-bookies · https://www.kaggle.com/datasets/austro/beat-the-bookie-worldwide-football-dataset
- Betmok Monte Carlo drawdown: https://www.betmok.com/blog/2024/04/15/drawdown-monte-carlo-simulation-calculator-for-sports-betting/

## 2. Engines financeiras (conceitos transferíveis)
- vectorbt: https://github.com/polakowo/vectorbt (vetorização, grades de parâmetros)
- backtrader cheat-on-open: https://www.backtrader.com/docu/cerebro/cheat-on-open/cheat-on-open/
- quantstats tearsheet: https://github.com/ranaroussi/quantstats
- Walk-forward: https://www.susanpotter.net/quant/walk-forward-optimization/ · https://blog.quantinsti.com/walk-forward-optimization-introduction/
- Purged CV: https://en.wikipedia.org/wiki/Purged_cross-validation · https://github.com/eslazarev/purged-cross-validation
- PBO/CSCV: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2326253
- Deflated Sharpe: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2460551 · https://en.wikipedia.org/wiki/Deflated_Sharpe_ratio

## 3. Rule builders e linguagens de expressão
- react-querybuilder: https://react-querybuilder.js.org/ · json-logic fork: https://github.com/react-querybuilder/json-logic-js
- react-awesome-query-builder: https://github.com/ukrbublik/react-awesome-query-builder
- JsonLogic: https://jsonlogic.com
- math.js segurança (CVE-2026-41139, escape de sandbox 13.1.0 → <15.2.0): https://mathjs.org/docs/expressions/security.html
- expr-eval: https://github.com/silentmatt/expr-eval · Jexl: https://github.com/TomFrost/Jexl

## 4. Leakage
- https://www.greatbets.co.uk/how-to-backtest-a-sports-betting-strategy-without-overfitting/
- https://dev.to/matthieu_david_9bfe2b8e4f/your-backtest-is-lying-to-you-6-ways-future-data-leaks-in-5d9m
- https://stablebet.co.uk/ai-race-predictor/lab/methodology/

## 5. Fórmulas-chave anotadas
- CLV bruto: `odd / odd_close − 1`. CLV no-vig: `odd · q̂_close − 1`, com `q̂_close` = probabilidade sem margem do fechamento (Pinnacle).
- Margem: `Σ 1/odds − 1`. Métodos de remoção: proporcional, aditivo, power, Shin, odds-ratio (penaltyblog `implied`).
- Yield: `lucro / turnover`. ROI sobre banco: `(B_final − B_0) / B_0`.
- Aproximação do desvio do yield (Buchdahl): `sd ≈ √(odd_média − 1) / √n`; `z ≈ yield · √n / √(odd_média − 1)`. Preferir t exato sobre retornos por aposta.
- Max drawdown: `min(cum − cummax(cum))`.
- Kelly: `f* = (o·q̂ − 1)/(o − 1)`; crescimento `g = q̂·ln(1 + f(o−1)) + (1−q̂)·ln(1−f)`.
- Deflated Sharpe (H0, N tentativas): `E[max SR] ≈ √V · [(1−γ)Φ⁻¹(1−1/N) + γΦ⁻¹(1−1/(N·e))]`, γ = 0,5772.
