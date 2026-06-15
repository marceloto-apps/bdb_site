# PRD — Plataforma Big Data Bet

**Versão:** 1.5 | **Atualizado:** 03/05/2026 | **Prazo:** 01/06/2026

---

## Visão Geral

| Fase | Nome | Status |
|---|---|---|
| 1 | Fundação (Site + CMS + Auth + Dashboard) | 🟢 Concluída |
| **2** | **Dashboards de Liga (MVP Brasileirão A)** | 🟢 Concluída |
| **2.5**| **Otimizações Pós-MVP e Backfill** | 🟢 Concluída |
| **3** | **Ferramentas Gratuitas (Migração Gemini)** | 🟢 Concluída |
| **4** | **Multi-Liga + Pagamentos (Stripe + Hubla Legacy)** | 🟢 Concluída |
| **5** | **Curso + Backtest Interativo** | 🟡 Em Progresso (Onda A Concluída) |
| **6** | **Automações + Bases Históricas (Bull + Redis)** | ⚪ Pendente |

---

## Stack

| Camada | Tecnologia |
| --- | --- |
| Frontend | Next.js 14 (App Router) + TypeScript strict |
| UI | shadcn/ui (dark) + Tailwind CSS |
| Banco | MySQL Hostgator via Prisma (schema novo) |
| Dados Esportivos | TheStatsAPI (API primária) + football-data.co.uk (CSV fallback) |
| Auth | NextAuth.js v5 |
| Email | Brevo |
| Analytics | Posthog |
| Deploy | Vercel + domínio [bigdatabet.com.br](http://bigdatabet.com.br/) |

---

## Status Geral — Fases 1 e 2 ✅ Concluídas

Toda a infraestrutura, CMS, Auth, Dashboard, Email, Analytics, Páginas Públicas e Deploy (Fase 1) foram entregues em **01/05/2026**.
O Motor Analítico completo, as rotas de API robustas com filtros isolados de temporada, os seletores e painéis de Dashboard da Liga (Fase 2) foram concluídos em **04/05/2026**.

Detalhamento histórico de cada subtask em `TASKS.md` (seção "Fase 1 — Concluída").
Especificações técnicas originais arquivadas em `docs/historico/PRD_Fase1.md`.

---

## Ordem de Execução

```
Fase 2: Dashboards de Liga
   ↓
Fase 3: Ferramentas Gratuitas (standby)
   ↓
Fase 4: Multi-Liga + Pagamentos
   ↓
Fase 5: Curso + Backtest
   ↓
Fase 6: Automações
```

---

## Dependências Externas — Resolver Antes de Codar

| Item | Responsável |
| --- | --- |
| Host, porta, usuário e senha do MySQL Hostgator | Marcelo |
| Conta Brevo criada + API key | Marcelo |
| Conta Posthog criada + project key | Marcelo |
| Acesso DNS do domínio `bigdatabet.com.br` | Marcelo |
| Repositório GitHub criado | Marcelo |
| API key TheStatsAPI (variável `THESTATSAPI_KEY`) | Marcelo ✅ Resolvido |

---

> 📚 Documentação técnica detalhada da Fase 1 disponível em [`docs/historico/PRD_Fase1.md`](./historico/PRD_Fase1.md)

---

## Regras Gerais para o Agente

```
- TypeScript estrito em todos os arquivos
- Zod para validação de todas as entradas de API
- Prisma para todas as queries (nunca SQL raw, exceto performance crítica documentada)
- Proteção de rotas exclusivamente via middleware.ts
- Componentes UI exclusivamente via shadcn/ui
- Código comentado em português
- Nenhuma lib nova sem justificativa explícita
- Cores, fontes e espaçamentos conforme Manual de Marca
- Perguntar antes de implementar qualquer feature não listada neste PRD
```

---

# PRD — Fase 2: Dashboards de Liga (MVP Brasileirão A)

**Objetivo:** Migrar a inteligência das planilhas BDB (.xlsm) para uma tela web nativa na área logada, expandindo os modelos estatísticos com Poisson Zero-Inflacionado, Binomial Negativa e Dixon-Coles. Dados ingeridos via TheStatsAPI com persistência em banco para eliminar requests repetidos.

## Escopo MVP
- Liga única: Brasileirão Série A (acesso FREE para todos os usuários autenticados)
- Tela única consolidada com todos os painéis (DASH + CS + FT + EVOL + MAPVAL)
- Origem dos dados: TheStatsAPI (primária) + football-data.co.uk CSV (fallback/validação)
- 4 modelos estatísticos com modo automático (AIC) e override manual
- Odds de 4 bookmakers: Pinnacle (referência), Bet365, Betfair Exchange, Kambi
- Dados persistidos em MySQL — nunca buscar na API o que já está no banco

## O que NÃO entra na Fase 2
- Outras ligas além do Brasileirão A (Fase 4, atrelado a planos pagos)
- Ingestão automática via cron (Fase 6)
- Backtest interativo (Fase 5)
- Aba Mercado/EV+Kelly (placeholder — nome provisório "Análises")

## Fonte de Dados — Estratégia Híbrida

### TheStatsAPI (fonte primária)
- Base URL: `https://api.thestatsapi.com/api/football`
- Auth: Bearer token via variável de ambiente `THESTATSAPI_KEY`
- Rate limit: 30 req/min, 100.000 req/mês (plano Starter $50/mês)
- Dados disponíveis: resultados, odds (4 bookmakers), xG, stats de partida, standings
- 80 competições padrão, até 1.196 sob demanda
- ID do Brasileirão A: `comp_4795`

### football-data.co.uk (fallback/validação)
- Upload manual de CSV pelo admin
- Usado para validação cruzada de dados e como backup offline
- Mantido como opção visível apenas para ADMIN

### Regra de ouro
Todo dado buscado na API é imediatamente salvo no banco. Buscas subsequentes lêem do banco. A API só é chamada para dados novos (sync incremental por `syncedAt`).

## Modelos Estatísticos Suportados
1. Poisson padrão (ground truth da planilha legada)
2. Poisson Zero-Inflacionado (ZIP) — corrige excesso de 0x0
3. Binomial Negativa — lida com superdispersão (variância > média)
4. Dixon-Coles — correção tau para placares baixos + decaimento temporal

## Seleção de Modelo
- **Modo AUTO (default):** Seleciona automaticamente o melhor modelo via AIC. Badge visual indica o modelo escolhido e confiança (Alta/Média).
- **Modo MANUAL (override):** Toggle entre Poisson | ZIP | NB | Dixon-Coles. Quando NB selecionado e variância ≤ λ, exibir banner amarelo de alerta.

## Painéis da Tela Única (`/dashboard/ligas/[slug]`)
1. **Seletor de Confronto** — dropdown casa/visitante + filtros (rodadas, mês, mando, faixa de odds)
2. **Painel de Médias** — gols, pontos, peso e custo do gol (replica aba DASH)
3. **Matriz de Placares** — grid 11x11 com modelo selecionável (replica aba CS)
4. **Painel de Mercados** — 1X2, BTTS, Over/Under, Handicaps Asiáticos com odds justas e EV%
5. **Mapa de Valor** — ROI por faixa de odds (replica aba MAPVAL)
6. **Evolução de Gols** — gráfico Recharts por rodada (replica aba EVOL)
7. **Seletor de Modelo** — modo AUTO (AIC) | modo MANUAL (toggle 4 modelos)

## Filtros do Seletor de Confronto
| Filtro | Tipo | Comportamento |
|---|---|---|
| Time Casa | Dropdown único | Filtra jogos como mandante |
| Time Visitante | Dropdown único | Filtra jogos como visitante |
| Rodadas | Range (de X a Y) | Filtra por intervalo de rodadas |
| Mês | Multi-select (JAN..DEZ) | Filtra por mês do jogo |
| Faixa de Odds Casa | Multi-select com drag | 9 faixas: 1.21-1.4, 1.41-1.7, ..., 9.01-16 |
| Faixa de Odds Visitante | Multi-select com drag | Mesmas 9 faixas |
| Mando | Toggle casa/fora/ambos | Filtra por mando de campo |

## Ingestão de Dados (Admin)
- **Sync via API:** Botão "Sincronizar Liga" na área administrativa (`/cms/ligas/sync` — restrito a ADMIN). Executa sync incremental com rate limiting.
- **Upload CSV:** Botão "Importar CSV" na área administrativa (`/cms/ligas/importar` — restrito a ADMIN). Parser de CSV football-data.co.uk como fallback.
- **Dashboard de Quota:** Exibe requests consumidos no mês vs limite de 100k.
- **Log de importações:** Histórico de cada sync/import com contadores.

## Navegação — Renomeação
- O item "Planilhas" na sidebar/navegação passa a se chamar **"Análises"** (nome provisório)
- Dentro de "Análises", as funcionalidades serão organizadas em abas
- Fase 2 entrega apenas placeholder com a estrutura de abas preparada

## Critérios de Aceite Fase 2
- [x] Schema Prisma Normalizado (Competition, Season, Match, Stats, Odds, PlayerStats, Shot) aplicado sem afetar tabelas legadas
- [x] Dados legados da Fase 1 integralmente migrados para o novo Schema Normalizado
- [x] Client TheStatsAPI refatorado com rate limiting funcional (30 req/min)
- [x] Sync granular de partidas, estatísticas, odds, jogadores e chutes do Brasileirão A funciona e popula o banco
- [x] Upload de CSV do Brasileirão A refatorado e funcional como fallback com suporte à transação de MatchOdds
- [x] Validação cruzada: dados da API vs CSV com divergência documentada e testada
- [x] Tela única `/dashboard/ligas/brasileirao-serie-a` renderiza todos os painéis
- [x] 4 modelos estatísticos calculam corretamente em modo AUTO e MANUAL
- [x] Modo AUTO seleciona via AIC e exibe badge de modelo + confiança
- [x] Filtros funcionais: rodada, mês, faixa de odds, mando
- [x] Cálculos validados contra a planilha BRA1DASHv261.xlsx (ground truth)
- [x] Performance: tela carrega em < 2s com dados do Brasileirão completo
- [x] Acesso liberado para qualquer usuário autenticado (MEMBRO+)
- [x] Quota de API não excede 100k req/mês com 1 liga ativa
- [x] Placeholder "Análises" visível na navegação

---

# PRD — Fase 2.5: Otimizações Pós-MVP (Maio 2026)

**Objetivo:** Estabilizar o backfill de dados históricos e refinar a experiência do usuário nos dashboards de liga, preparando o sistema para integração de pagamentos e tráfego orgânico.

## Principais Alterações
- **Backfill Estável:** Parser de data otimizado e auto-healing (`stale jobs`) implementado para recuperação sem intervenção manual.
- **Filtros e UI:** Mínimo de jogos reduzido de 5 para 4, interface resiliente a dados insuficientes sem corromper estado, auto-collapse no cálculo.
- **Dados:** Integração massiva Bet365 para cobertura de odds de 100% onde a Pinnacle falhava.
- **Preparação de Negócios:** Identificação clara de ligas FREE vs VIP ("Disponível nos Planos Pagos") e tags "Em breve" nas features de gestão (Banca, Métodos, Backtest).

---

# PRD — Fase 3: Ferramentas Gratuitas (Migração Gemini)

**Objetivo:** Migrar 4 ferramentas hospedadas no Google Gemini Canvas para a área logada da plataforma, convertendo-as em componentes React nativos com design system BDB (shadcn/ui dark + tokens Tailwind).

## Ferramentas e Códigos-Fonte
| # | Ferramenta | Código Gemini | Rota |
|---|---|---|---|
| 1 | Validação e Risco (Monte Carlo) | ✅ Disponível | `/dashboard/ferramentas/validacao-risco` |
| 2 | Over/Under Linhas (OmniProjector) | ✅ Disponível | `/dashboard/ferramentas/over-under-linhas` 🆕 |
| 3 | Over/Under 2.5 | ✅ Disponível | `/dashboard/ferramentas/over-under-25` |
| 4 | Simulador de Distribuição | ✅ Disponível | `/dashboard/ferramentas/distribuicao` |

## Ordem de Implementação
1. **Validação e Risco** — ferramenta mais completa, maior valor percebido
2. **Over/Under Linhas (OmniProjector)** — linha âncora dinâmica, mais flexível
3. **Over/Under 2.5** — versão fixa na linha 2.5, complementar
4. **Simulador de Distribuição** — pedagógica, menor prioridade de negócio

## Escopo Técnico
- Acesso: **FREE** — qualquer usuário autenticado (MEMBRO+)
- Persistência: **nenhuma** — cálculos 100% client-side, sem banco de dados
- Gráficos: **Recharts** (já na stack desde Fase 2)
- UI: converter todos os estilos inline/Gemini para **tokens do design system BDB** (shadcn/ui + Tailwind config)
- Lógica: isolar em `lib/ferramentas/` como funções puras testáveis
- Lib nova: **nenhuma** — Recharts já previsto, cálculos implementados manualmente

## Alterações na Sidebar do Dashboard
| Label Atual | Label Novo | Rota | Ação |
|---|---|---|---|
| Validação de Risco | **Validação e Risco** | `/dashboard/ferramentas/validacao-risco` | Renomear |
| Cálculo Over/Under | **Over/Under 2.5** | `/dashboard/ferramentas/over-under-25` | Renomear |
| Distribuição AH | **Simulador de Distribuição** | `/dashboard/ferramentas/distribuicao` | Renomear |
| *(não existe)* | **Over/Under Linhas** | `/dashboard/ferramentas/over-under-linhas` | Criar |

## Estrutura de Rotas
- `/dashboard/ferramentas` — grid com cards das 4 ferramentas
- `/dashboard/ferramentas/validacao-risco`
- `/dashboard/ferramentas/over-under-linhas`
- `/dashboard/ferramentas/over-under-25`
- `/dashboard/ferramentas/distribuicao`

## Critérios de Aceite Fase 3
- [x] 4 ferramentas funcionais e acessíveis na área logada
- [x] Sidebar atualizada com labels corretos e item novo (Over/Under Linhas)
- [x] Cada ferramenta convertida em Client Component com shadcn/ui
- [x] Estilos 100% aderentes ao design system BDB (zero estilos inline do Gemini)
- [x] Lógica de cálculo isolada em `lib/ferramentas/` com funções puras
- [x] Testes unitários para funções de cálculo críticas
- [x] Acesso liberado para qualquer usuário autenticado (MEMBRO+)
- [x] Sem persistência de dados (cálculos client-side puros)
- [x] Responsivo: mobile (375px) e desktop (1440px)
- [x] Build sem erros TypeScript strict ou ESLint

---
---

# PRD — Fase 4: Multi-Liga + Pagamentos (Stripe + Hubla Legacy)

**Objetivo:** Liberar as 25+ ligas adicionais para usuários do plano Básico, mantendo acesso vitalício para assinantes legados do Hubla.

*Nota: A expansão para 60+ ligas reutiliza a infraestrutura de ingestão da Fase 2 (TheStatsAPI). O custo de requests para 60 ligas é estimado em ~24.000 req/mês (carga completa), cabendo no plano Starter de 100k/mês.*

## Estratégia Híbrida de Acesso
- Brasileirão A → FREE (todos os autenticados)
- Demais ligas → Plano Básico ou superior
  - Usuário com flag LegacyAccess (assinantes Hubla) → acesso vitalício gratuito
  - Novo usuário → checkout Stripe mensal

## Componentes
1. Migração de assinantes legados do Hubla (importação de e-mails → LegacyAccess)
2. Configuração de produtos e preços no Stripe
3. Webhooks Stripe (checkout.completed, subscription.updated, etc.)
4. Tela de checkout integrada ao /planos
5. Middleware estendido com requirePlan(['BASICO', 'PRO', 'PREMIUM']) ou flag LegacyAccess
6. UI: badge visual diferenciando "Acesso Vitalício" vs "Assinante Ativo"

## Critérios de Aceite Fase 4
- [x] Lista de assinantes Hubla importada para tabela LegacyAccess
- [x] Stripe configurado com plano Básico mensal
- [x] Checkout funcional e webhook processando eventos
- [x] Ligas VIP visíveis no seletor para usuários habilitados
- [x] Usuários sem acesso veem CTA de upgrade
- [x] Cancelamento de assinatura revoga acesso (não afeta legacy)

---

# Fase 5: Curso + Backtest Interativo
- Player de vídeo protegido por plano Premium
- Progresso por aula salvo no banco
- Backtest com filtros → query → cálculo Node → gráficos Recharts + tabela + resumo

---

# Onda A: Estrutura de Cursos e BDB Points (Gamificação)

**Objetivo:** Implementar o motor de gamificação por acúmulo de pontos (BDB Points) e a modelagem estrutural (metadados) para cursos e quizzes.

## Componentes da Onda A
1. **Gamificação (BDB Points):** Event sourcing puro para saldo e status móvel de 12 meses, expiração FIFO, controle de concorrência e idempotência.
2. **Loja de Recompensas:** Troca de pontos acumulados por cupons de desconto para assinaturas e cursos.
3. **Estrutura de Cursos:** Modelos de Curso, Módulo, Aula e Quiz (perguntas/respostas) para a área de membros.
4. **Painéis Administrativos:** Gerenciamento de regras de pontos, opções de recompensa e estrutura de cursos diretamente no CMS.
5. **Dicionário do Mercado (Glossário):** Integração de um glossário estático contendo 99 termos técnicos com busca em tempo real, filtragem por categorias e navegação linear entre as aulas.
6. **Lógica de Conclusão e Pontuação de Aulas:** Conclusão automática de aula ao assistir 90% ou mais (concedendo 50 pontos) e inicialização dinâmica no último conteúdo assistido pelo aluno. Renomeação do item de menu para "Vitrine de Cursos".

---

# Fase 6: Automações + Bases Históricas
- Ingestão automática football-data via cron
- Bases históricas para múltiplas temporadas
- Otimização de índices para queries de larga escala