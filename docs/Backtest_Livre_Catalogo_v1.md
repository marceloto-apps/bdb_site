# Backtest Livre — Catálogo de campos v1.1.1 (Fase 0)

> Gerado por `scripts/laboratorio/gerar-catalogo.ts` a partir de `lib/laboratorio/schema/catalogo.ts`.
> Não editar à mão: ajustar os templates e regenerar. Coberturas são **estimativas** das medições de
> 24/09/2026; a medida por liga×temporada sai de `bt_coverage` na Fase 1.

## Resumo

| Bloco | Campos |
| --- | --- |
| match | 32 |
| odds | 188 |
| derived | 33 |
| team | 712 |
| league | 19 |
| **total** | **984** |

Campos por fonte (um campo pode ter várias): core 911 · fpt 834 · fs 123.
Funções virtuais (calculadas no engine): 14.

Convenção de nomes: `bloco.qualificadores.medida`.
- `odds.<casa>.<open|close>.<mercado>.<seleção>` — ex.: `odds.pinnacle.close.1x2.novig_h`
- `derived.<casa>.<medida>` — cruzamentos prontos (movimento, λ de mercado, edge)
- `<home|away>[.venue].<l5|l10|l20|season>.<estatística>` — ex.: `away.venue.l10.xg_against`
- `<home|away>.<medida>` — forma, descanso, tabela, Elo (sem janela)
- `league.<parâmetro>` — parâmetros da liga até a data
- `match.<campo>` — identificação e resultado (resultado só entra na liquidação)

Tipos (unidades): odd, prob, line, count, rate, pct, goals, xg, days, points, bool, int, id, date, text, ratio, elo.
O validador de fórmulas impede comparar unidades incompatíveis sem conversão (ex.: `odd > prob`).

## 1. Bloco `match` (32)

| Campo | Tipo | Fontes (precedência) | Cobertura estimada | Descrição |
| --- | --- | --- | --- | --- |
| `match.id` | id | core → fpt |  | ID da partida — `matches.id` ou `fpt:<fpt_match.id>` |
| `match.competition` | id | core → fpt |  | Competição — `Competition.id` ou `fpt:<rawLeague>` |
| `match.competition_level` | int | core → fpt |  | Nível da competição — 1 = elite; null para copas e torneios internacionais |
| `match.competition_type` | text | core → fpt |  | Tipo da competição — LEAGUE \| CUP \| INTERNATIONAL_CLUBS \| NATIONAL_TEAMS |
| `match.country` | text | core → fpt |  | País — pt-BR, padrão de `Competition.country` |
| `match.season` | id | core → fpt |  | Temporada — `Season.id` ou temporada da FPT |
| `match.season_label` | text | core → fpt |  | Rótulo da temporada — "2025" ou "24/25" |
| `match.round` | int | core → fpt | core 99% · fpt 60% | Rodada — Rodada oficial quando existe |
| `match.utc_date` | date | core → fpt |  | Data/hora (UTC) — Núcleo em UTC; FPT em hora local sem fuso (ver tz_uncertain) |
| `match.tz_uncertain` | bool | fpt |  | Fuso incerto — true quando a hora veio só da FPT |
| `match.dow` | int | core → fpt |  | Dia da semana — 0 = domingo … 6 = sábado |
| `match.hour_local` | int | core → fpt |  | Hora local — Hora local do jogo (null se tz_uncertain) |
| `match.home` | id | core → fpt |  | Mandante — `teams.id` ou `fpt:<nome>` provisório (D10) |
| `match.away` | id | core → fpt |  | Visitante — `teams.id` ou `fpt:<nome>` provisório (D10) |
| `match.home_provisional` | bool | fpt |  | Mandante sem vínculo — true quando o mandante ainda não está em `teams` |
| `match.away_provisional` | bool | fpt |  | Visitante sem vínculo — true quando o visitante ainda não está em `teams` |
| `match.ft_h` | goals | core → fpt | core 100% · fpt 100% | Gols mandante (FT) — Placar final — só para liquidação, nunca em regra |
| `match.ft_a` | goals | core → fpt | core 100% · fpt 100% | Gols visitante (FT) — Placar final — só para liquidação, nunca em regra |
| `match.ht_h` | goals | core → fpt | core 73% · fpt 100% | Gols mandante (HT) — Placar de intervalo — só para liquidação |
| `match.ht_a` | goals | core → fpt | core 73% · fpt 100% | Gols visitante (HT) — Placar de intervalo — só para liquidação |
| `match.corners_h` | count | core → fpt | core 96% · fpt 62% | Escanteios mandante — Só para liquidação de mercados de escanteios |
| `match.corners_a` | count | core → fpt | core 96% · fpt 62% | Escanteios visitante — Só para liquidação de mercados de escanteios |
| `match.has_xg` | bool | core → fpt |  | Tem xG — xG disponível no jogo (para cobertura, não para regra) |
| `match.has_ht` | bool | core → fpt |  | Tem placar HT |
| `match.referee` | text | core | core 59% | Árbitro |
| `match.src_core` | bool | core |  | Presente no núcleo |
| `match.src_fpt` | bool | fpt |  | Presente na FPT |
| `match.src_fs` | bool | fs |  | Presente no Flashscore |
| `match.n_sources` | int | core → fpt → fs |  | Nº de fontes |
| `match.stats_src` | text | core → fpt |  | Fonte das estatísticas — core \| fpt \| none |
| `match.odds_close_src` | text | fs → core → fpt |  | Fonte do fechamento — fs \| core \| fpt \| none |
| `match.odds_open_src` | text | fs → core |  | Fonte da abertura — fs \| core \| none |

## 2. Bloco `odds` (188)

Casas com largura total: pinnacle, bet365, avg, best. Casas reduzidas (1X2, BTTS, O/U principal, AH principal): betano, betfair, kambi, superbet, 1xbet, estrela_bet, f12, sportingbet, kto, betnacional. Snapshots: open, close (d1/h6/h1 reservados para D3).

### 2.1 bet365 fechamento — largura total (83)

| Campo | Tipo | Fontes (precedência) | Cobertura estimada | Descrição |
| --- | --- | --- | --- | --- |
| `odds.bet365.close.1x2.h` | odd | fs → core → fpt | core 95% · fpt 95% · fs 85% (2024+) | 1X2 mandante — bet365 fechamento |
| `odds.bet365.close.1x2.d` | odd | fs → core → fpt | core 95% · fpt 95% · fs 85% (2024+) | 1X2 empate — bet365 fechamento |
| `odds.bet365.close.1x2.a` | odd | fs → core → fpt | core 95% · fpt 95% · fs 85% (2024+) | 1X2 visitante — bet365 fechamento |
| `odds.bet365.close.1x2.overround` | pct | fs → core → fpt | core 95% · fpt 95% · fs 85% (2024+) | 1X2 margem — bet365 fechamento — Σ 1/odd − 1 |
| `odds.bet365.close.1x2.novig_h` | prob | fs → core → fpt | core 95% · fpt 95% · fs 85% (2024+) | 1X2 prob. justa mandante — bet365 fechamento — Remoção proporcional da margem |
| `odds.bet365.close.1x2.novig_d` | prob | fs → core → fpt | core 95% · fpt 95% · fs 85% (2024+) | 1X2 prob. justa empate — bet365 fechamento |
| `odds.bet365.close.1x2.novig_a` | prob | fs → core → fpt | core 95% · fpt 95% · fs 85% (2024+) | 1X2 prob. justa visitante — bet365 fechamento |
| `odds.bet365.close.btts.yes` | odd | fs → core → fpt | core 95% · fpt 95% · fs 85% (2024+) | Ambos marcam sim — bet365 fechamento |
| `odds.bet365.close.btts.no` | odd | fs → core → fpt | core 95% · fpt 95% · fs 85% (2024+) | Ambos marcam não — bet365 fechamento |
| `odds.bet365.close.btts.overround` | pct | fs → core → fpt | core 95% · fpt 95% · fs 85% (2024+) | BTTS margem — bet365 fechamento |
| `odds.bet365.close.ou.main_line` | line | fs → core → fpt | core 95% · fpt 95% · fs 85% (2024+) | O/U linha principal — bet365 fechamento — Linha com odds mais equilibradas |
| `odds.bet365.close.ou.over_main` | odd | fs → core → fpt | core 95% · fpt 95% · fs 85% (2024+) | Over na linha principal — bet365 fechamento |
| `odds.bet365.close.ou.under_main` | odd | fs → core → fpt | core 95% · fpt 95% · fs 85% (2024+) | Under na linha principal — bet365 fechamento |
| `odds.bet365.close.ou.novig_over_main` | prob | fs → core → fpt | core 95% · fpt 95% · fs 85% (2024+) | Prob. justa over principal — bet365 fechamento |
| `odds.bet365.close.ou.over_0_5` | odd | fs → core → fpt | core 95% · fpt 95% · fs 85% (2024+) | Over 0.5 — bet365 fechamento |
| `odds.bet365.close.ou.under_0_5` | odd | fs → core → fpt | core 95% · fpt 95% · fs 85% (2024+) | Under 0.5 — bet365 fechamento |
| `odds.bet365.close.ou.over_1_5` | odd | fs → core → fpt | core 95% · fpt 95% · fs 85% (2024+) | Over 1.5 — bet365 fechamento |
| `odds.bet365.close.ou.under_1_5` | odd | fs → core → fpt | core 95% · fpt 95% · fs 85% (2024+) | Under 1.5 — bet365 fechamento |
| `odds.bet365.close.ou.over_2_5` | odd | fs → core → fpt | core 95% · fpt 95% · fs 85% (2024+) | Over 2.5 — bet365 fechamento |
| `odds.bet365.close.ou.under_2_5` | odd | fs → core → fpt | core 95% · fpt 95% · fs 85% (2024+) | Under 2.5 — bet365 fechamento |
| `odds.bet365.close.ou.over_3_5` | odd | fs → core → fpt | core 95% · fpt 95% · fs 85% (2024+) | Over 3.5 — bet365 fechamento |
| `odds.bet365.close.ou.under_3_5` | odd | fs → core → fpt | core 95% · fpt 95% · fs 85% (2024+) | Under 3.5 — bet365 fechamento |
| `odds.bet365.close.ou.over_4_5` | odd | fs → core → fpt | core 95% · fpt 95% · fs 85% (2024+) | Over 4.5 — bet365 fechamento |
| `odds.bet365.close.ou.under_4_5` | odd | fs → core → fpt | core 95% · fpt 95% · fs 85% (2024+) | Under 4.5 — bet365 fechamento |
| `odds.bet365.close.ah.main_line` | line | fs → core → fpt | core 95% · fpt 95% · fs 85% (2024+) | AH linha principal — bet365 fechamento — Do ponto de vista do mandante |
| `odds.bet365.close.ah.home_main` | odd | fs → core → fpt | core 95% · fpt 95% · fs 85% (2024+) | AH mandante (principal) — bet365 fechamento |
| `odds.bet365.close.ah.away_main` | odd | fs → core → fpt | core 95% · fpt 95% · fs 85% (2024+) | AH visitante (principal) — bet365 fechamento |
| `odds.bet365.close.corners.main_line` | line | core | core 40% | Escanteios linha principal — bet365 fechamento |
| `odds.bet365.close.corners.over_main` | odd | core | core 40% | Escanteios over — bet365 fechamento |
| `odds.bet365.close.corners.under_main` | odd | core | core 40% | Escanteios under — bet365 fechamento |
| `odds.bet365.close.ht_1x2.h` | odd | fs → fpt | fpt 95% · fs 85% (2024+) | 1X2 1º tempo mandante — bet365 fechamento |
| `odds.bet365.close.ht_1x2.d` | odd | fs → fpt | fpt 95% · fs 85% (2024+) | 1X2 1º tempo empate — bet365 fechamento |
| `odds.bet365.close.ht_1x2.a` | odd | fs → fpt | fpt 95% · fs 85% (2024+) | 1X2 1º tempo visitante — bet365 fechamento |
| `odds.bet365.close.ht_ou.main_line` | line | fs → fpt | fpt 95% · fs 85% (2024+) | O/U 1º tempo linha principal — bet365 fechamento |
| `odds.bet365.close.ht_ou.over_main` | odd | fs → fpt | fpt 95% · fs 85% (2024+) | Over 1º tempo principal — bet365 fechamento |
| `odds.bet365.close.ht_ou.under_main` | odd | fs → fpt | fpt 95% · fs 85% (2024+) | Under 1º tempo principal — bet365 fechamento |
| `odds.bet365.close.ht_ou.over_0_5` | odd | fs → fpt | fpt 95% · fs 85% (2024+) | Over 0.5 1º tempo — bet365 fechamento |
| `odds.bet365.close.ht_ou.under_0_5` | odd | fs → fpt | fpt 95% · fs 85% (2024+) | Under 0.5 1º tempo — bet365 fechamento |
| `odds.bet365.close.ht_ou.over_1_5` | odd | fs → fpt | fpt 95% · fs 85% (2024+) | Over 1.5 1º tempo — bet365 fechamento |
| `odds.bet365.close.ht_ou.under_1_5` | odd | fs → fpt | fpt 95% · fs 85% (2024+) | Under 1.5 1º tempo — bet365 fechamento |
| `odds.bet365.close.ht_ou.over_2_5` | odd | fs → fpt | fpt 95% · fs 85% (2024+) | Over 2.5 1º tempo — bet365 fechamento |
| `odds.bet365.close.ht_ou.under_2_5` | odd | fs → fpt | fpt 95% · fs 85% (2024+) | Under 2.5 1º tempo — bet365 fechamento |
| `odds.bet365.close.ht_ah.main_line` | line | fs | fs 85% (2024+) | AH 1º tempo linha principal — bet365 fechamento |
| `odds.bet365.close.ht_ah.home_main` | odd | fs | fs 85% (2024+) | AH 1º tempo mandante — bet365 fechamento |
| `odds.bet365.close.ht_ah.away_main` | odd | fs | fs 85% (2024+) | AH 1º tempo visitante — bet365 fechamento |
| `odds.bet365.close.dc.1x` | odd | fs → fpt | fpt 95% · fs 85% (2024+) | Dupla chance 1X — bet365 fechamento |
| `odds.bet365.close.dc.x2` | odd | fs → fpt | fpt 95% · fs 85% (2024+) | Dupla chance X2 — bet365 fechamento |
| `odds.bet365.close.dc.12` | odd | fs → fpt | fpt 95% · fs 85% (2024+) | Dupla chance 12 — bet365 fechamento |
| `odds.bet365.close.eh.h_m1` | odd | fpt | fpt 75% | Handicap europeu −1 mandante — bet365 fechamento |
| `odds.bet365.close.eh.d_m1` | odd | fpt | fpt 75% | Handicap europeu −1 empate — bet365 fechamento |
| `odds.bet365.close.eh.a_m1` | odd | fpt | fpt 75% | Handicap europeu −1 visitante — bet365 fechamento |
| `odds.bet365.close.eh.h_m2` | odd | fpt | fpt 75% | Handicap europeu −2 mandante — bet365 fechamento |
| `odds.bet365.close.eh.d_m2` | odd | fpt | fpt 75% | Handicap europeu −2 empate — bet365 fechamento |
| `odds.bet365.close.eh.a_m2` | odd | fpt | fpt 75% | Handicap europeu −2 visitante — bet365 fechamento |
| `odds.bet365.close.eh.h_m3` | odd | fpt | fpt 75% | Handicap europeu −3 mandante — bet365 fechamento |
| `odds.bet365.close.eh.d_m3` | odd | fpt | fpt 75% | Handicap europeu −3 empate — bet365 fechamento |
| `odds.bet365.close.eh.a_m3` | odd | fpt | fpt 75% | Handicap europeu −3 visitante — bet365 fechamento |
| `odds.bet365.close.eh.h_p1` | odd | fpt | fpt 75% | Handicap europeu +1 mandante — bet365 fechamento |
| `odds.bet365.close.eh.d_p1` | odd | fpt | fpt 75% | Handicap europeu +1 empate — bet365 fechamento |
| `odds.bet365.close.eh.a_p1` | odd | fpt | fpt 75% | Handicap europeu +1 visitante — bet365 fechamento |
| `odds.bet365.close.eh.h_p2` | odd | fpt | fpt 75% | Handicap europeu +2 mandante — bet365 fechamento |
| `odds.bet365.close.eh.d_p2` | odd | fpt | fpt 75% | Handicap europeu +2 empate — bet365 fechamento |
| `odds.bet365.close.eh.a_p2` | odd | fpt | fpt 75% | Handicap europeu +2 visitante — bet365 fechamento |
| `odds.bet365.close.eh.h_p3` | odd | fpt | fpt 75% | Handicap europeu +3 mandante — bet365 fechamento |
| `odds.bet365.close.eh.d_p3` | odd | fpt | fpt 75% | Handicap europeu +3 empate — bet365 fechamento |
| `odds.bet365.close.eh.a_p3` | odd | fpt | fpt 75% | Handicap europeu +3 visitante — bet365 fechamento |
| `odds.bet365.close.cs.0_0` | odd | fpt | fpt 93% | Placar exato 0-0 — bet365 fechamento |
| `odds.bet365.close.cs.0_1` | odd | fpt | fpt 93% | Placar exato 0-1 — bet365 fechamento |
| `odds.bet365.close.cs.0_2` | odd | fpt | fpt 93% | Placar exato 0-2 — bet365 fechamento |
| `odds.bet365.close.cs.0_3` | odd | fpt | fpt 93% | Placar exato 0-3 — bet365 fechamento |
| `odds.bet365.close.cs.1_0` | odd | fpt | fpt 93% | Placar exato 1-0 — bet365 fechamento |
| `odds.bet365.close.cs.1_1` | odd | fpt | fpt 93% | Placar exato 1-1 — bet365 fechamento |
| `odds.bet365.close.cs.1_2` | odd | fpt | fpt 93% | Placar exato 1-2 — bet365 fechamento |
| `odds.bet365.close.cs.1_3` | odd | fpt | fpt 93% | Placar exato 1-3 — bet365 fechamento |
| `odds.bet365.close.cs.2_0` | odd | fpt | fpt 93% | Placar exato 2-0 — bet365 fechamento |
| `odds.bet365.close.cs.2_1` | odd | fpt | fpt 93% | Placar exato 2-1 — bet365 fechamento |
| `odds.bet365.close.cs.2_2` | odd | fpt | fpt 93% | Placar exato 2-2 — bet365 fechamento |
| `odds.bet365.close.cs.2_3` | odd | fpt | fpt 93% | Placar exato 2-3 — bet365 fechamento |
| `odds.bet365.close.cs.3_0` | odd | fpt | fpt 93% | Placar exato 3-0 — bet365 fechamento |
| `odds.bet365.close.cs.3_1` | odd | fpt | fpt 93% | Placar exato 3-1 — bet365 fechamento |
| `odds.bet365.close.cs.3_2` | odd | fpt | fpt 93% | Placar exato 3-2 — bet365 fechamento |
| `odds.bet365.close.cs.3_3` | odd | fpt | fpt 93% | Placar exato 3-3 — bet365 fechamento |
| `odds.bet365.close.cs.other` | odd | fpt | fpt 93% | Placar exato outro — bet365 fechamento |

### 2.2 pinnacle fechamento (30)

| Campo | Tipo | Fontes (precedência) | Cobertura estimada | Descrição |
| --- | --- | --- | --- | --- |
| `odds.pinnacle.close.1x2.h` | odd | core | core 60% | 1X2 mandante — pinnacle fechamento |
| `odds.pinnacle.close.1x2.d` | odd | core | core 60% | 1X2 empate — pinnacle fechamento |
| `odds.pinnacle.close.1x2.a` | odd | core | core 60% | 1X2 visitante — pinnacle fechamento |
| `odds.pinnacle.close.1x2.overround` | pct | core | core 60% | 1X2 margem — pinnacle fechamento — Σ 1/odd − 1 |
| `odds.pinnacle.close.1x2.novig_h` | prob | core | core 60% | 1X2 prob. justa mandante — pinnacle fechamento — Remoção proporcional da margem |
| `odds.pinnacle.close.1x2.novig_d` | prob | core | core 60% | 1X2 prob. justa empate — pinnacle fechamento |
| `odds.pinnacle.close.1x2.novig_a` | prob | core | core 60% | 1X2 prob. justa visitante — pinnacle fechamento |
| `odds.pinnacle.close.btts.yes` | odd | core | core 60% | Ambos marcam sim — pinnacle fechamento |
| `odds.pinnacle.close.btts.no` | odd | core | core 60% | Ambos marcam não — pinnacle fechamento |
| `odds.pinnacle.close.btts.overround` | pct | core | core 60% | BTTS margem — pinnacle fechamento |
| `odds.pinnacle.close.ou.main_line` | line | core | core 60% | O/U linha principal — pinnacle fechamento — Linha com odds mais equilibradas |
| `odds.pinnacle.close.ou.over_main` | odd | core | core 60% | Over na linha principal — pinnacle fechamento |
| `odds.pinnacle.close.ou.under_main` | odd | core | core 60% | Under na linha principal — pinnacle fechamento |
| `odds.pinnacle.close.ou.novig_over_main` | prob | core | core 60% | Prob. justa over principal — pinnacle fechamento |
| `odds.pinnacle.close.ou.over_0_5` | odd | core | core 60% | Over 0.5 — pinnacle fechamento |
| `odds.pinnacle.close.ou.under_0_5` | odd | core | core 60% | Under 0.5 — pinnacle fechamento |
| `odds.pinnacle.close.ou.over_1_5` | odd | core | core 60% | Over 1.5 — pinnacle fechamento |
| `odds.pinnacle.close.ou.under_1_5` | odd | core | core 60% | Under 1.5 — pinnacle fechamento |
| `odds.pinnacle.close.ou.over_2_5` | odd | core | core 60% | Over 2.5 — pinnacle fechamento |
| `odds.pinnacle.close.ou.under_2_5` | odd | core | core 60% | Under 2.5 — pinnacle fechamento |
| `odds.pinnacle.close.ou.over_3_5` | odd | core | core 60% | Over 3.5 — pinnacle fechamento |
| `odds.pinnacle.close.ou.under_3_5` | odd | core | core 60% | Under 3.5 — pinnacle fechamento |
| `odds.pinnacle.close.ou.over_4_5` | odd | core | core 60% | Over 4.5 — pinnacle fechamento |
| `odds.pinnacle.close.ou.under_4_5` | odd | core | core 60% | Under 4.5 — pinnacle fechamento |
| `odds.pinnacle.close.ah.main_line` | line | core | core 60% | AH linha principal — pinnacle fechamento — Do ponto de vista do mandante |
| `odds.pinnacle.close.ah.home_main` | odd | core | core 60% | AH mandante (principal) — pinnacle fechamento |
| `odds.pinnacle.close.ah.away_main` | odd | core | core 60% | AH visitante (principal) — pinnacle fechamento |
| `odds.pinnacle.close.corners.main_line` | line | core | core 50% | Escanteios linha principal — pinnacle fechamento |
| `odds.pinnacle.close.corners.over_main` | odd | core | core 50% | Escanteios over — pinnacle fechamento |
| `odds.pinnacle.close.corners.under_main` | odd | core | core 50% | Escanteios under — pinnacle fechamento |

### 2.3 Exemplo de casa reduzida — betano fechamento (0)

| Campo | Tipo | Fontes (precedência) | Cobertura estimada | Descrição |
| --- | --- | --- | --- | --- |

As mesmas famílias existem para `open` (exceto dc/eh/cs, que só existem no fechamento da FPT) e para as demais casas.

## 3. Bloco `derived` (33)

| Campo | Tipo | Fontes (precedência) | Cobertura estimada | Descrição |
| --- | --- | --- | --- | --- |
| `derived.pinnacle.move_1x2_h` | ratio | core |  | Movimento 1X2 mandante (pinnacle) — close/open − 1 |
| `derived.pinnacle.move_1x2_d` | ratio | core |  | Movimento 1X2 empate (pinnacle) — close/open − 1 |
| `derived.pinnacle.move_1x2_a` | ratio | core |  | Movimento 1X2 visitante (pinnacle) — close/open − 1 |
| `derived.pinnacle.move_novig_h` | prob | core |  | Δ prob. justa mandante (pinnacle) — novig_h(close) − novig_h(open), em pontos de probabilidade |
| `derived.pinnacle.move_ou_over_main` | ratio | core |  | Movimento over principal (pinnacle) — close/open − 1 na mesma linha; null se a linha mudou |
| `derived.pinnacle.line_shift_ou` | line | core |  | Deslocamento da linha O/U (pinnacle) — main_line(close) − main_line(open) |
| `derived.pinnacle.line_shift_ah` | line | core |  | Deslocamento da linha AH (pinnacle) — main_line(close) − main_line(open) |
| `derived.pinnacle.fav_side` | text | core |  | Favorito (pinnacle) — home \| away pela menor odd de fechamento |
| `derived.pinnacle.fav_odd` | odd | core |  | Odd do favorito (pinnacle) |
| `derived.pinnacle.odd_gap` | ratio | core |  | Gap de odds (pinnacle) — odd_a − odd_h no fechamento |
| `derived.pinnacle.market_lambda_h` | xg | core |  | λ mandante implícito (pinnacle) — Via calibrarLambdas (1X2 + O/U 2.5 sem margem) |
| `derived.pinnacle.market_lambda_a` | xg | core |  | λ visitante implícito (pinnacle) — Via calibrarLambdas |
| `derived.pinnacle.market_total` | xg | core |  | Total implícito (pinnacle) — λ_h + λ_a |
| `derived.bet365.move_1x2_h` | ratio | fs → core |  | Movimento 1X2 mandante (bet365) — close/open − 1 |
| `derived.bet365.move_1x2_d` | ratio | fs → core |  | Movimento 1X2 empate (bet365) — close/open − 1 |
| `derived.bet365.move_1x2_a` | ratio | fs → core |  | Movimento 1X2 visitante (bet365) — close/open − 1 |
| `derived.bet365.move_novig_h` | prob | fs → core |  | Δ prob. justa mandante (bet365) — novig_h(close) − novig_h(open), em pontos de probabilidade |
| `derived.bet365.move_ou_over_main` | ratio | fs → core |  | Movimento over principal (bet365) — close/open − 1 na mesma linha; null se a linha mudou |
| `derived.bet365.line_shift_ou` | line | fs → core |  | Deslocamento da linha O/U (bet365) — main_line(close) − main_line(open) |
| `derived.bet365.line_shift_ah` | line | fs → core |  | Deslocamento da linha AH (bet365) — main_line(close) − main_line(open) |
| `derived.bet365.fav_side` | text | fs → core |  | Favorito (bet365) — home \| away pela menor odd de fechamento |
| `derived.bet365.fav_odd` | odd | fs → core |  | Odd do favorito (bet365) |
| `derived.bet365.odd_gap` | ratio | fs → core |  | Gap de odds (bet365) — odd_a − odd_h no fechamento |
| `derived.bet365.market_lambda_h` | xg | fs → core |  | λ mandante implícito (bet365) — Via calibrarLambdas (1X2 + O/U 2.5 sem margem) |
| `derived.bet365.market_lambda_a` | xg | fs → core |  | λ visitante implícito (bet365) — Via calibrarLambdas |
| `derived.bet365.market_total` | xg | fs → core |  | Total implícito (bet365) — λ_h + λ_a |
| `derived.pinnacle_vs_bet365.edge_h` | ratio | fs → core |  | Edge bet365 vs Pinnacle mandante — bet365.close.1x2.h × pinnacle.close.novig_h − 1 |
| `derived.pinnacle_vs_bet365.edge_d` | ratio | fs → core |  | Edge bet365 vs Pinnacle empate |
| `derived.pinnacle_vs_bet365.edge_a` | ratio | fs → core |  | Edge bet365 vs Pinnacle visitante |
| `derived.pinnacle_vs_bet365.edge_over_main` | ratio | fs → core |  | Edge bet365 vs Pinnacle over principal — Só quando as linhas principais coincidem |
| `derived.pinnacle_vs_bet365.edge_open_h` | ratio | fs → core |  | Edge bet365 abertura vs Pinnacle fechamento mandante — bet365.open.1x2.h × pinnacle.close.novig_h − 1 (o "CLV disponível na abertura") |
| `derived.n_books_close` | int | fs → core → fpt |  | Nº de casas ativas com fechamento |
| `derived.n_books_open` | int | fs → core |  | Nº de casas ativas com abertura |

## 4. Bloco `team` (712)

Gerado por lado (home, away) × escopo (all, venue) × janela (l5, l10, l20, season) × 42 estatísticas, mais 20 medidas sem janela por lado. Todas calculadas só com jogos anteriores à data (§4.1 do plano). `venue` = só jogos em casa para o mandante e só fora para o visitante.

### 4.1 Estatísticas por janela — exemplo `home.l10.*` (42)

| Campo | Tipo | Fontes (precedência) | Cobertura estimada | Descrição |
| --- | --- | --- | --- | --- |
| `home.l10.gf` | goals | core → fpt | core 100% · fpt 100% | Mandante — Gols marcados (média) (todos os jogos, últimos 10) |
| `home.l10.ga` | goals | core → fpt | core 100% · fpt 100% | Mandante — Gols sofridos (média) (todos os jogos, últimos 10) |
| `home.l10.gd` | goals | core → fpt | core 100% · fpt 100% | Mandante — Saldo de gols (média) (todos os jogos, últimos 10) |
| `home.l10.pts_pg` | points | core → fpt | core 100% · fpt 100% | Mandante — Pontos por jogo (todos os jogos, últimos 10) |
| `home.l10.win_pct` | pct | core → fpt | core 100% · fpt 100% | Mandante — % vitórias (todos os jogos, últimos 10) |
| `home.l10.draw_pct` | pct | core → fpt | core 100% · fpt 100% | Mandante — % empates (todos os jogos, últimos 10) |
| `home.l10.loss_pct` | pct | core → fpt | core 100% · fpt 100% | Mandante — % derrotas (todos os jogos, últimos 10) |
| `home.l10.btts_pct` | pct | core → fpt | core 100% · fpt 100% | Mandante — % ambos marcam (todos os jogos, últimos 10) |
| `home.l10.over15_pct` | pct | core → fpt | core 100% · fpt 100% | Mandante — % over 1.5 (todos os jogos, últimos 10) |
| `home.l10.over25_pct` | pct | core → fpt | core 100% · fpt 100% | Mandante — % over 2.5 (todos os jogos, últimos 10) |
| `home.l10.over35_pct` | pct | core → fpt | core 100% · fpt 100% | Mandante — % over 3.5 (todos os jogos, últimos 10) |
| `home.l10.cs_pct` | pct | core → fpt | core 100% · fpt 100% | Mandante — % sem sofrer gol (todos os jogos, últimos 10) |
| `home.l10.fts_pct` | pct | core → fpt | core 100% · fpt 100% | Mandante — % sem marcar (todos os jogos, últimos 10) |
| `home.l10.ht_gf` | goals | core → fpt | core 73% · fpt 100% | Mandante — Gols marcados 1º tempo (média) (todos os jogos, últimos 10) |
| `home.l10.ht_ga` | goals | core → fpt | core 73% · fpt 100% | Mandante — Gols sofridos 1º tempo (média) (todos os jogos, últimos 10) |
| `home.l10.ht_lead_pct` | pct | core → fpt | core 73% · fpt 100% | Mandante — % em vantagem no intervalo (todos os jogos, últimos 10) |
| `home.l10.xg_for` | xg | core → fpt | core 80% · fpt 30% (2023+) | Mandante — xG criado (média) (todos os jogos, últimos 10) |
| `home.l10.xg_against` | xg | core → fpt | core 80% · fpt 30% (2023+) | Mandante — xG sofrido (média) (todos os jogos, últimos 10) |
| `home.l10.xg_diff` | xg | core → fpt | core 80% · fpt 30% (2023+) | Mandante — Saldo de xG (média) (todos os jogos, últimos 10) |
| `home.l10.xg_perf` | xg | core → fpt | core 80% · fpt 30% (2023+) | Mandante — Gols − xG (média) (todos os jogos, últimos 10) — Positivo = converte acima do esperado |
| `home.l10.xga_perf` | xg | core → fpt | core 80% · fpt 30% (2023+) | Mandante — Gols sofridos − xG sofrido (média) (todos os jogos, últimos 10) |
| `home.l10.xg_1h_for` | xg | core → fpt | core 44% · fpt 30% (2023+) | Mandante — xG criado 1º tempo (média) (todos os jogos, últimos 10) |
| `home.l10.shots_for` | count | core → fpt | core 96% · fpt 62% | Mandante — Chutes (média) (todos os jogos, últimos 10) |
| `home.l10.shots_against` | count | core → fpt | core 96% · fpt 62% | Mandante — Chutes sofridos (média) (todos os jogos, últimos 10) |
| `home.l10.sot_for` | count | core → fpt | core 96% · fpt 62% | Mandante — Chutes no alvo (média) (todos os jogos, últimos 10) |
| `home.l10.sot_against` | count | core → fpt | core 96% · fpt 62% | Mandante — Chutes no alvo sofridos (média) (todos os jogos, últimos 10) |
| `home.l10.sot_pct` | pct | core → fpt | core 96% · fpt 62% | Mandante — % chutes no alvo (todos os jogos, últimos 10) |
| `home.l10.conv_pct` | pct | core → fpt | core 96% · fpt 62% | Mandante — % conversão (gols/chutes) (todos os jogos, últimos 10) |
| `home.l10.shots_inbox_for` | count | core → fpt | core 96% · fpt 25% (2025+) | Mandante — Chutes na área (média) (todos os jogos, últimos 10) |
| `home.l10.big_chances_for` | count | core → fpt | core 91% · fpt 25% (2025+) | Mandante — Grandes chances (média) (todos os jogos, últimos 10) |
| `home.l10.big_chances_against` | count | core → fpt | core 91% · fpt 25% (2025+) | Mandante — Grandes chances cedidas (média) (todos os jogos, últimos 10) |
| `home.l10.corners_for` | count | core → fpt | core 96% · fpt 62% | Mandante — Escanteios (média) (todos os jogos, últimos 10) |
| `home.l10.corners_against` | count | core → fpt | core 96% · fpt 62% | Mandante — Escanteios cedidos (média) (todos os jogos, últimos 10) |
| `home.l10.possession` | pct | core → fpt | core 96% · fpt 62% | Mandante — Posse (média %) (todos os jogos, últimos 10) |
| `home.l10.pass_acc` | pct | core → fpt | core 96% · fpt 25% | Mandante — Precisão de passe (média %) (todos os jogos, últimos 10) |
| `home.l10.touches_pa` | count | core → fpt | core 93% · fpt 25% | Mandante — Toques na área (média) (todos os jogos, últimos 10) |
| `home.l10.fouls` | count | core → fpt | core 96% · fpt 62% | Mandante — Faltas (média) (todos os jogos, últimos 10) |
| `home.l10.yc` | count | core → fpt | core 96% · fpt 62% | Mandante — Cartões amarelos (média) (todos os jogos, últimos 10) |
| `home.l10.rc` | count | core → fpt | core 96% · fpt 62% | Mandante — Cartões vermelhos (média) (todos os jogos, últimos 10) |
| `home.l10.cv_goals` | ratio | core → fpt | core 100% · fpt 100% | Mandante — CV dos gols marcados (todos os jogos, últimos 10) — desvio-padrão / média |
| `home.l10.std_gf` | goals | core → fpt | core 100% · fpt 100% | Mandante — Desvio-padrão dos gols marcados (todos os jogos, últimos 10) |
| `home.l10.n_used` | int | core → fpt | core 100% · fpt 100% | Mandante — Jogos usados na janela (todos os jogos, últimos 10) — Para filtro de amostra mínima |

### 4.2 Escopo `venue` — exemplo (3 de 336)

| Campo | Tipo | Fontes (precedência) | Cobertura estimada | Descrição |
| --- | --- | --- | --- | --- |
| `home.venue.l10.gf` | goals | core → fpt | core 100% · fpt 100% | Mandante — Gols marcados (média) (só em casa, últimos 10) |
| `home.venue.l10.ga` | goals | core → fpt | core 100% · fpt 100% | Mandante — Gols sofridos (média) (só em casa, últimos 10) |
| `home.venue.l10.gd` | goals | core → fpt | core 100% · fpt 100% | Mandante — Saldo de gols (média) (só em casa, últimos 10) |

### 4.3 Sem janela — `home.*` (20)

| Campo | Tipo | Fontes (precedência) | Cobertura estimada | Descrição |
| --- | --- | --- | --- | --- |
| `home.form5_pts` | points | core → fpt | core 100% · fpt 100% | Mandante — Pontos nos últimos 5 |
| `home.form5` | text | core → fpt | core 100% · fpt 100% | Mandante — Forma (VEDVV) |
| `home.streak_win` | int | core → fpt | core 100% · fpt 100% | Mandante — Sequência de vitórias |
| `home.streak_unbeaten` | int | core → fpt | core 100% · fpt 100% | Mandante — Sequência invicta |
| `home.streak_scoring` | int | core → fpt | core 100% · fpt 100% | Mandante — Sequência marcando |
| `home.streak_btts` | int | core → fpt | core 100% · fpt 100% | Mandante — Sequência de ambos marcam |
| `home.elo` | elo | core → fpt | core 100% · fpt 100% | Mandante — Elo — Rating Elo atualizado jogo a jogo, K fixo, ponto inicial 1500 por liga (P1) |
| `home.rest_days` | days | core → fpt | core 100% · fpt 100% | Mandante — Dias de descanso — Dias desde o último jogo em qualquer competição conhecida |
| `home.matches_last_7d` | int | core → fpt | core 100% · fpt 100% | Mandante — Jogos nos últimos 7 dias |
| `home.matches_last_30d` | int | core → fpt | core 100% · fpt 100% | Mandante — Jogos nos últimos 30 dias |
| `home.season_matches_played` | int | core → fpt | core 100% · fpt 100% | Mandante — Jogos na temporada |
| `home.table_pos` | int | core → fpt | core 100% · fpt 100% | Mandante — Posição na tabela — Classificação recalculada até a data (só LEAGUE) |
| `home.table_pts` | points | core → fpt | core 100% · fpt 100% | Mandante — Pontos na tabela |
| `home.table_pts_gap_top` | points | core → fpt | core 100% · fpt 100% | Mandante — Distância para o líder |
| `home.table_pts_gap_bottom` | points | core → fpt | core 100% · fpt 100% | Mandante — Distância para o lanterna |
| `home.clv_hist_l10` | ratio | fs → core | core 50% · fs 85% | Mandante — CLV histórico (10 jogos) — Média de open/close − 1 da odd do próprio time nos últimos 10 jogos (positivo = o time vinha encurtando) |
| `home.fav_pct_l10` | pct | fs → core → fpt | core 95% · fpt 95% | Mandante — % de vezes favorito (10 jogos) |
| `home.fav_win_pct_l10` | pct | fs → core → fpt | core 95% · fpt 95% | Mandante — % vitórias quando favorito (10 jogos) |
| `home.avg_odd_l10` | odd | fs → core → fpt | core 95% · fpt 95% | Mandante — Odd média do time (10 jogos) — Odd de fechamento bet365 do time em cada jogo |
| `home.roi_flat_l10` | pct | fs → core → fpt | core 95% · fpt 95% | Mandante — ROI apostando no time (10 jogos) |

## 5. Bloco `league` (19)

| Campo | Tipo | Fontes (precedência) | Cobertura estimada | Descrição |
| --- | --- | --- | --- | --- |
| `league.mu_h` | goals | core → fpt | core 100% · fpt 100% | Média de gols do mandante — Temporada até a data; ≥ 20 jogos |
| `league.mu_a` | goals | core → fpt | core 100% · fpt 100% | Média de gols do visitante |
| `league.var_h` | goals | core → fpt | core 100% · fpt 100% | Variância de gols do mandante — Para Binomial Negativa |
| `league.var_a` | goals | core → fpt | core 100% · fpt 100% | Variância de gols do visitante |
| `league.pi_h` | prob | core → fpt | core 100% · fpt 100% | Excesso de zeros mandante — Para ZIP |
| `league.pi_a` | prob | core → fpt | core 100% · fpt 100% | Excesso de zeros visitante |
| `league.rho` | ratio | core → fpt | core 100% · fpt 100% | ρ de Dixon-Coles — Estimado só com jogos anteriores à data (corrige o vazamento do backtest atual) |
| `league.mu_h_xg` | xg | core → fpt | core 80% · fpt 30% | Média de xG do mandante |
| `league.mu_a_xg` | xg | core → fpt | core 80% · fpt 30% | Média de xG do visitante |
| `league.n_matches_season` | int | core → fpt | core 100% · fpt 100% | Jogos da temporada até a data |
| `league.avg_goals` | goals | core → fpt | core 100% · fpt 100% | Média de gols por jogo |
| `league.home_win_pct` | pct | core → fpt | core 100% · fpt 100% | % vitórias do mandante |
| `league.draw_pct` | pct | core → fpt | core 100% · fpt 100% | % empates |
| `league.over25_pct` | pct | core → fpt | core 100% · fpt 100% | % over 2.5 |
| `league.btts_pct` | pct | core → fpt | core 100% · fpt 100% | % ambos marcam |
| `league.avg_overround_pinnacle` | pct | core | core 60% | Margem média Pinnacle 1X2 |
| `league.avg_overround_bet365` | pct | fs → core → fpt | core 95% · fpt 95% | Margem média bet365 1X2 |
| `league.fav_win_pct` | pct | fs → core → fpt | core 95% · fpt 95% | % vitórias do favorito |
| `league.params_src` | text | core → fpt |  | Origem dos parâmetros — season (temporada corrente, ≥ 20 jogos) \| prev_season (fim da temporada anterior) \| none |

## 6. Funções virtuais

| Função | Assinatura | Retorno | Descrição |
| --- | --- | --- | --- |
| implied | `implied(odd)` | prob | 1/odd |
| novig | `novig(o1, o2[, o3], method?)` | prob | Probabilidade sem margem do 1º argumento; method ∈ proportional | power | shin | odds_ratio |
| fair_odd | `fair_odd(prob)` | odd | 1/prob |
| ev | `ev(prob, odd)` | ratio | prob × odd − 1 |
| edge | `edge(prob, odd)` | prob | prob − 1/odd |
| kelly | `kelly(prob, odd)` | pct | (prob × odd − 1)/(odd − 1), clamp em 0 |
| model | `model(POISSON|DC|ZIP|NB, MEDIA|FORCAS|XG|MERCADO, janela).p_h|p_d|p_a|p_btts|p_over(L)|p_under(L)|p_ah(L, side)|fair_odd(...)|lambda_h|lambda_a` | prob | Matriz 11×11 a partir das médias do time e parâmetros da liga na linha (lib/analytics) |
| quarter | `quarter(x)` | line | Arredonda para múltiplo de 0.25 |
| rank | `rank(expr, scope)` | int | Posição de expr entre os jogos do mesmo scope ∈ day | round | league_season, calculada dentro do run |
| pct_rank | `pct_rank(expr, scope)` | pct | Percentil de expr no scope |
| zscore | `zscore(x, mean, sd)` | ratio | (x − mean)/sd |
| ifnull | `ifnull(x, y)` | ratio | x se não nulo, senão y |
| if | `if(cond, a, b)` | ratio | Condicional |
| abs/min/max/log/exp/sqrt/round/clamp | `como em JS` | ratio | Aritmética básica |

## 7. Ligas só-FPT (86)

44 incluídas por padrão (69.529 jogos de 131.565); 7 femininas; por tipo: LEAGUE 60, CUP 17, INTERNATIONAL_CLUBS 5, NATIONAL_TEAMS 4.

| Chave FPT | Nome | País | Nível | Tipo | Padrão | Jogos | Observação |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ARGENTINA 3` | Primera B Metropolitana / Federal A | Argentina | 3 | LEAGUE | sim | 3.149 | A FPT junta as duas terceiras divisões numa chave só |
| `ARGENTINA CUP` | Copa Argentina | Argentina | — | CUP | não | 203 |  |
| `AUSTRALIA 1` | A-League | Austrália | 1 | LEAGUE | sim | 995 |  |
| `AUSTRALIA 2` | NPL / Australia Cup (fase final) | Austrália | 2 | LEAGUE | não | 55 | Amostra mínima |
| `BOLIVIA CUP` | Copa Bolívia | Bolívia | — | CUP | não | 236 |  |
| `BOSNIA 1` | Premijer Liga | Bósnia e Herzegovina | 1 | LEAGUE | sim | 1.007 |  |
| `BOSNIA 2` | Prva Liga FBiH / RS | Bósnia e Herzegovina | 2 | LEAGUE | não | 1.152 | Sem estatísticas; odds 1X2 em 53% |
| `BRAZIL 3` | Brasileirão Série C | Brasil | 3 | LEAGUE | sim | 1.268 |  |
| `BRAZIL 4` | Brasileirão Série D | Brasil | 4 | LEAGUE | sim | 3.168 |  |
| `BRAZIL CUP` | Copa do Brasil | Brasil | — | CUP | não | 760 |  |
| `WOM BRAZIL 1` | Brasileirão Feminino A1 (fem.) | Brasil | 1 | LEAGUE | não | 833 |  |
| `BULGARIA 2` | Vtora Liga | Bulgária | 2 | LEAGUE | sim | 1.703 |  |
| `CHILE 2` | Primera B | Chile | 2 | LEAGUE | sim | 1.467 |  |
| `CHILE CUP` | Copa Chile | Chile | — | CUP | não | 585 |  |
| `CHINA 2` | China League One | China | 2 | LEAGUE | sim | 1.519 |  |
| `COLOMBIA 2` | Primera B | Colômbia | 2 | LEAGUE | sim | 1.703 |  |
| `COLOMBIA CUP` | Copa Colombia | Colômbia | — | CUP | não | 86 |  |
| `CROATIA 2` | Prva NL | Croácia | 2 | LEAGUE | sim | 1.078 |  |
| `CYPRUS 2` | Segunda Divisão | Chipre | 2 | LEAGUE | não | 1.164 | Sem estatísticas; odds 1X2 em 73% |
| `CZECH 2` | FNL | República Tcheca | 2 | LEAGUE | sim | 1.264 |  |
| `DENMARK 2` | 1. Division | Dinamarca | 2 | LEAGUE | sim | 1.008 |  |
| `ECUADOR 2` | Serie B | Equador | 2 | LEAGUE | sim | 1.067 |  |
| `ECUADOR CUP` | Copa Ecuador | Equador | — | CUP | não | 182 |  |
| `EGYPT 2` | Segunda Divisão | Egito | 2 | LEAGUE | não | 1.029 | Sem estatísticas |
| `ENGLAND 5` | National League | Inglaterra | 5 | LEAGUE | sim | 2.835 |  |
| `ENGLAND CUP` | FA Cup / EFL Cup / EFL Trophy | Inglaterra | — | CUP | não | 2.982 | A FPT junta as copas inglesas numa chave só; odds 1X2 em 66% |
| `WOM ENGLAND 1` | Women's Super League (fem.) | Inglaterra | 1 | LEAGUE | não | 675 |  |
| `ESTONIA 1` | Meistriliiga | Estônia | 1 | LEAGUE | sim | 1.026 |  |
| `ESTONIA 2` | Esiliiga | Estônia | 2 | LEAGUE | não | 1.023 | Estatísticas em 13% |
| `EUROPA CHAMPIONS LEAGUE` | UEFA Champions League | Europa | — | INTERNATIONAL_CLUBS | sim | 1.289 |  |
| `EUROPA LEAGUE` | UEFA Europa League | Europa | — | INTERNATIONAL_CLUBS | sim | 1.147 |  |
| `EUROPA CONFERENCE LEAGUE` | UEFA Conference League | Europa | — | INTERNATIONAL_CLUBS | sim | 1.908 |  |
| `WORLD EUROCUP` | Eurocopa (e eliminatórias) | Europa | — | NATIONAL_TEAMS | não | 2.017 | Inclui 1998–2020 com odds parciais |
| `WORLD UEFA NATIONS LEAGUE` | UEFA Nations League | Europa | — | NATIONAL_TEAMS | não | 656 |  |
| `FRANCE 3` | National | França | 3 | LEAGUE | sim | 1.517 |  |
| `FRANCE 4` | National 2 | França | 4 | LEAGUE | não | 3.522 | Sem estatísticas; odds 1X2 em 68% |
| `FRANCE CUP` | Coupe de France | França | — | CUP | não | 989 |  |
| `WOM FRANCE 1` | Première Ligue (fem.) | França | 1 | LEAGUE | não | 682 |  |
| `GERMANY CUP` | DFB-Pokal | Alemanha | — | CUP | não | 347 |  |
| `WOM GERMANY 1` | Frauen-Bundesliga (fem.) | Alemanha | 1 | LEAGUE | não | 738 |  |
| `GREECE 2` | Super League 2 | Grécia | 2 | LEAGUE | sim | 1.872 | Estatísticas em 11% |
| `ICELAND 1` | Besta deild | Islândia | 1 | LEAGUE | sim | 918 |  |
| `ICELAND 2` | 1. deild | Islândia | 2 | LEAGUE | sim | 811 |  |
| `ISRAEL 2` | Liga Leumit | Israel | 2 | LEAGUE | sim | 1.532 | Estatísticas em 5% |
| `ITALY 3` | Serie C | Itália | 3 | LEAGUE | sim | 5.805 |  |
| `ITALY 4` | Serie D | Itália | 4 | LEAGUE | não | 15.055 | Sem estatísticas; odds 1X2 em 68%; maior liga da FPT |
| `ITALY CUP` | Coppa Italia | Itália | — | CUP | não | 253 |  |
| `WOM ITALY 1` | Serie A Femminile (fem.) | Itália | 1 | LEAGUE | não | 658 |  |
| `JAPAN 3` | J3 League | Japão | 3 | LEAGUE | sim | 1.728 |  |
| `MEXICO 2` | Liga de Expansión MX | México | 2 | LEAGUE | sim | 1.445 |  |
| `NETHERLANDS CUP` | KNVB Beker | Holanda | — | CUP | não | 533 |  |
| `NORTHERN IRELAND 1` | NIFL Premiership | Irlanda do Norte | 1 | LEAGUE | sim | 1.205 |  |
| `NORTHERN IRELAND 2` | NIFL Championship | Irlanda do Norte | 2 | LEAGUE | não | 1.204 | Sem estatísticas |
| `PARAGUAY 2` | División Intermedia | Paraguai | 2 | LEAGUE | sim | 1.458 |  |
| `PARAGUAY CUP` | Copa Paraguay | Paraguai | — | CUP | não | 32 |  |
| `PERU 2` | Liga 2 | Peru | 2 | LEAGUE | sim | 1.007 |  |
| `POLAND 2` | I liga | Polônia | 2 | LEAGUE | sim | 1.616 |  |
| `PORTUGAL 3` | Liga 3 | Portugal | 3 | LEAGUE | sim | 1.612 |  |
| `PORTUGAL CUP` | Taça de Portugal | Portugal | — | CUP | não | 951 |  |
| `ROMANIA 2` | Liga II | Romênia | 2 | LEAGUE | sim | 1.475 |  |
| `SAUDI ARABIA 2` | Yelo League | Arábia Saudita | 2 | LEAGUE | sim | 1.655 |  |
| `SCOTLAND 3` | League One | Escócia | 3 | LEAGUE | sim | 964 | Sem estatísticas |
| `SCOTLAND 4` | League Two | Escócia | 4 | LEAGUE | sim | 955 | Sem estatísticas |
| `SCOTLAND CUP` | Scottish Cup / League Cup | Escócia | — | CUP | não | 1.085 |  |
| `SERBIA 2` | Prva Liga | Sérvia | 2 | LEAGUE | sim | 1.556 |  |
| `SLOVAKIA 2` | 2. Liga | Eslováquia | 2 | LEAGUE | sim | 1.208 |  |
| `SLOVENIA 2` | 2. SNL | Eslovênia | 2 | LEAGUE | sim | 1.248 | Estatísticas em 3% |
| `SOUTH AFRICA 2` | Motsepe Foundation Championship | África do Sul | 2 | LEAGUE | não | 1.240 | Sem estatísticas; odds 1X2 em 73% |
| `COPA LIBERTADORES` | Copa Libertadores | América do Sul | — | INTERNATIONAL_CLUBS | sim | 925 |  |
| `COPA SUDAMERICANA` | Copa Sul-Americana | América do Sul | — | INTERNATIONAL_CLUBS | sim | 937 |  |
| `WORLD AMERICA CUP` | Copa América | América do Sul | — | NATIONAL_TEAMS | não | 230 |  |
| `SPAIN 3` | Primera Federación | Espanha | 3 | LEAGUE | sim | 3.800 |  |
| `SPAIN 4` | Segunda Federación | Espanha | 4 | LEAGUE | não | 7.740 | Sem estatísticas |
| `SPAIN CUP` | Copa del Rey | Espanha | — | CUP | não | 642 |  |
| `SPAIN Primera Rfef Group 1` | Primera Federación — Grupo 1 (2026/27) | Espanha | 3 | LEAGUE | não | 30 | Chave nova da FPT em 2026/27; unificar com SPAIN 3 na Fase 1b |
| `SPAIN Primera Rfef Group 2` | Primera Federación — Grupo 2 (2026/27) | Espanha | 3 | LEAGUE | não | 30 | Chave nova da FPT em 2026/27; unificar com SPAIN 3 na Fase 1b |
| `WOM SPAIN 1` | Liga F (fem.) | Espanha | 1 | LEAGUE | não | 1.224 |  |
| `TURKEY CUP` | Türkiye Kupası | Turquia | — | CUP | não | 811 |  |
| `UKRAINE 2` | Persha Liga | Ucrânia | 2 | LEAGUE | não | 1.121 | Sem estatísticas |
| `URUGUAY 2` | Segunda División | Uruguai | 2 | LEAGUE | sim | 1.176 |  |
| `WOM USA 1` | NWSL (fem.) | Estados Unidos | 1 | LEAGUE | não | 969 |  |
| `VENEZUELA 1` | Liga FUTVE | Venezuela | 1 | LEAGUE | sim | 1.456 |  |
| `VENEZUELA 2` | Segunda División | Venezuela | 2 | LEAGUE | não | 1.303 | Sem estatísticas; odds 1X2 em 68% |
| `WALES 1` | Cymru Premier | País de Gales | 1 | LEAGUE | sim | 1.047 |  |
| `WALES CUP` | Welsh Cup | País de Gales | — | CUP | não | 722 | Odds 1X2 em 51% |
| `WORLD WORLD CUP` | Copa do Mundo e eliminatórias | Mundo | — | NATIONAL_TEAMS | não | 6.287 | A FPT junta Copa e eliminatórias; o núcleo tem só a Copa 2026 (Competition "Copa do Mundo 2026") |
