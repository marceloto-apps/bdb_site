# Fase 2 — Motor Analítico e Dashboard de Ligas

## Visão Geral

A Fase 2 implementa o motor estatístico de previsão de resultados de futebol 
baseado em modelos de distribuição (Poisson, Binomial Negativa, ZIP, ZINB) 
e o dashboard interativo para análise de confrontos.

**Data de implementação:** Maio 2026  
**Status:** ✅ Completa

---

## Atualizações Pós-Fase 2
- Implementado um filtro rigoroso (`getSeasonDateFilter`) em todas as rotas do motor analítico para garantir isolamento da temporada atual.
- **Integração de Expected Goals (xG)**: Adicionado suporte completo para cálculo de médias e forças usando xG.
- **Integração de Half-Time (HT)**: Adicionados campos `hthg` e `htag` no schema e no pipeline de ingestão, com aba de Gols HT no Dashboard.
- **Seletor de Lambdas**: Três métodos ortogonais adicionados para estimativa de λ (Média Simples, Forças Relativas, xG), com fallback automático em caso de insuficiência de dados de xG (mínimo de 20 jogos na liga e 5 por mando).
- Proteção contra *division by zero* implementada nas funções de calibração de médias da liga.
- UI Refatorada para exibição independente do Input (Seletor Lambda) e Distribuição (Seletor Modelo).
- **Estatísticas Detalhadas da Partida**: Implementado um painel tabulado com métricas agregadas dos últimos jogos das equipes (Mandante e Visitante) incluindo as abas:
  - **Odds/Profit**: Tracking de P&L, Odds Médias e Win Rate.
  - **Gols / xG / Fin.**: Comparativo de Finalizações, Gols no FT e no HT, e Expected Goals (xG).
  - **Escant. / Cartões / Faltas**: Médias disciplinares e de bolas paradas (Corners).
  - **Over / Under**: Distribuição percentual do mercado de Totais de Gols.
- **Projeção de Handicaps e Totais**: Motor de cálculo matemático adicionado para traduzir a Matriz de Placares em linhas de Handicap Asiático exatas (Mandante/Visitante) e Over Gols, incluindo probabilidades de *Push/Half* e Odd Justa Baseada em Expected Value (EV).

---

## Arquitetura

### Stack utilizada
- **Motor estatístico:** TypeScript puro (sem libs externas de ML)
- **API:** Next.js App Router (Route Handlers)
- **UI:** shadcn/ui + Tailwind CSS (dark mode)
- **Gráficos:** Recharts
- **Dados:** Prisma + MySQL (Hostgator)
- **Fonte de dados:** API-Football (api-sports.io)
- **Testes:** Vitest + Testing Library

### Fluxo de dados
```
API-Football → Sync Admin → MySQL → API Routes → Motor Analítico → Client Components
```

---

## Componentes Criados

### Motor Analítico (`lib/analytics/`)
| Arquivo | Responsabilidade |
|---------|-----------------|
| `poisson.ts` | Distribuição Poisson e cálculos fundamentais |
| `negative-binomial.ts` | Distribuição Binomial Negativa |
| `zip.ts` | Zero-Inflated Poisson |
| `zinb.ts` | Zero-Inflated Negative Binomial |
| `lambda-calculators.ts` | Dispatcher e cálculo de métodos de λ (Simples, Forças Relativas, xG) |
| `model-selector.ts` | Seleção automática via AIC |
| `market-calculator.ts` | Derivação de mercados (1X2, BTTS, O/U, AH) |
| `mapa-valor.ts` | Cálculo de ROI por faixa de odds |

### APIs (`app/api/`)
| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/ligas/[slug]/info` | GET | Metadados da liga + médias |
| `/api/ligas/[slug]/times` | GET | Lista de times da temporada |
| `/api/ligas/[slug]/partidas` | GET | Partidas com filtros |
| `/api/ligas/[slug]/previsao` | GET | Previsão completa de confronto |
| `/api/ligas/[slug]/mapa-valor` | GET | ROI por faixa de odds |
| `/api/ligas/[slug]/estatisticas` | GET | Agregação completa de MatchStats para o confronto (Gols, xG, Escanteios, Cartões, Profit) |
| `/api/admin/sync/partidas` | POST | Sincronizar partidas |
| `/api/admin/sync/odds` | POST | Sincronizar odds |
| `/api/admin/sync/status` | GET | Status de sincronizações |
| `/api/admin/quota` | GET | Uso da API-Football |

### Componentes UI (`components/ligas/`)
| Componente | Tipo | Descrição |
|-----------|------|-----------|
| `SeletorConfronto` | Client | Seleção de times + filtros avançados |
| `SeletorModelo` | Client | Escolha auto/manual do modelo estatístico |
| `SeletorLambda` | Client | Escolha do método de input do λ |
| `FiltroRodadas` | Client | Slider de range de rodadas |
| `FiltroMes` | Client | Seleção multi de meses |
| `FiltroFaixaOdds` | Client | Toggle de faixas de odds |
| `BadgeModeloAuto` | Client | Badge de confiança do modelo automático |
| `PainelMedias` | Client | Cards de médias, forças relativas e Expected Goals (xG) |
| `PainelMatrizPlacares` | Client | Grid 11×11 com heatmap |
| `PainelProjecaoHandicaps` | Client | Projeção avançada de Handicaps e Odds Justas baseadas em Matriz |
| `PainelMercados` | Client | Tabelas 1X2, BTTS, O/U, AH com EV% |
| `PainelEvolucao` | Client | Gráfico Recharts de gols por rodada |
| `PainelMapaValor` | Client | ROI por faixa com tabs por mercado |
| `TabOddsProfit` | Client | Aba de P&L, Win Rate e Média de Odds |
| `TabGolsXg` | Client | Aba de Gols FT/HT, Expected Goals e Finalizações |
| `TabEscanteiosCartoes` | Client | Aba de métricas disciplinares e cantos |
| `TabOverUnder` | Client | Aba com percentuais de batimento do mercado Over/Under |
| `LigaCard` | Server | Card clicável no grid de ligas |

### Componentes Admin (`components/admin/`)
| Componente | Descrição |
|-----------|-----------|
| `SyncPanel` | Painel de sincronização de dados |
| `QuotaPanel` | Monitor visual de quota da API |
| `SyncLogTable` | Tabela de histórico de sincronizações |

### Páginas
| Rota | Tipo | Descrição |
|------|------|-----------|
| `/dashboard/ligas` | Server | Grid de ligas disponíveis |
| `/dashboard/ligas/[slug]` | Server+Client | Dashboard completo da liga |
| `/dashboard/analises` | Server | Placeholder (Fase futura) |
| `/dashboard/admin/sync` | Server | Painel de sincronização |
| `/dashboard/admin/quota` | Server | Monitor de quota |

### Hooks e Utilitários
| Arquivo | Descrição |
|---------|-----------|
| `useLeagueFilters` | Hook de state management para filtros |
| `api-football.ts` | Client wrapper da API-Football |
| `sync-partidas.ts` | Lógica de sync de partidas |
| `sync-odds.ts` | Lógica de sync de odds |

### Modelos Prisma adicionados
| Modelo | Tabela | Descrição |
|--------|--------|-----------|
| `ApiQuota` | `api_quotas` | Registro diário de uso da API |
| `SyncLog` | `sync_logs` | Log de operações de sincronização |

---

## Modelos Estatísticos

### Distribuições implementadas
1. **Poisson** — modelo base, assume média = variância
2. **Binomial Negativa (NB)** — para dados com superdispersão (variância > média)
3. **Zero-Inflated Poisson (ZIP)** — para excesso de empates 0×0
4. **Zero-Inflated NB (ZINB)** — combina NB + excesso de zeros

### Seleção automática via AIC
- Calcula AIC para cada modelo
- Rankeia do menor (melhor) para o maior
- Classifica confiança: ALTA (gap > 10), MÉDIA (4-10), BAIXA (< 4)

### Mercados derivados
- **1X2:** soma das probabilidades da matriz por região (H > A, H = A, H < A)
- **BTTS:** P(ambos marcam) = 1 - P(coluna 0) - P(linha 0) + P(0×0)
- **Over/Under:** soma cumulativa das probabilidades por total de gols
- **Handicap Asiático:** redistribuição das probabilidades por offset

---

## Como usar

### Primeiro setup (após deploy)
1. Configurar `API_FOOTBALL_KEY` no `.env`
2. Rodar `npx prisma db push` para criar tabelas novas
3. Acessar `/dashboard/admin/sync` como ADMIN
4. Sincronizar partidas do Brasileirão
5. Sincronizar odds (10-30 por vez, respeitando quota)
6. Acessar `/dashboard/ligas` e selecionar o Brasileirão

### Fluxo do usuário
1. Acessa `/dashboard/ligas` → vê grid de ligas
2. Clica no Brasileirão → `/dashboard/ligas/brasileirao-serie-a`
3. Seleciona time mandante e visitante
4. (Opcional) Ajusta filtros avançados
5. Clica "Calcular Previsão"
6. Visualiza: médias, matriz, mercados, evolução, mapa de valor
7. Pode trocar modelo (auto/manual) para recalcular

### Manutenção
- Sincronizar partidas semanalmente (após cada rodada)
- Sincronizar odds em lotes de 10-30 (respeitando 100 req/dia)
- Monitorar quota em `/dashboard/admin/quota`

---

## Limitações conhecidas (MVP)
- Apenas Brasileirão Série A disponível (FREE)
- Odds dependem de sincronização manual
- Sem cron/automação de sync (planejado para Fase 5)
- Mapa de Valor depende de odds Pinnacle (nem toda partida tem)
- Sem cache de previsões (recalcula a cada request)

## Próximos passos (Fase 3)
- Backtest interativo com filtros → query → cálculo → gráficos
- Histórico de previsões salvas
- Comparação de modelos lado a lado
- Cache de previsões frequentes
