# PRD — Plataforma Big Data Bet

**Versão:** 1.4 | **Atualizado:** 02/05/2026 | **Prazo:** 01/06/2026

---

## Visão Geral

| Fase | Nome | Status |
|---|---|---|
| 1 | Fundação (Site + CMS + Auth + Dashboard) | 🟢 Concluída |
| **2** | **Dashboards de Liga (MVP Brasileirão A)** | ⚪ Próxima |
| **3** | **Ferramentas Gratuitas (Migração Gemini)** | 🟢 Concluída |
| **4** | **Multi-Liga + Pagamentos (Stripe + Hubla Legacy)** | ⚪ Pendente |
| **5** | **Curso + Backtest Interativo** | ⚪ Pendente |
| **6** | **Automações + Bases Históricas (Bull + Redis)** | ⚪ Pendente |

---

## Stack

| Camada | Tecnologia |
| --- | --- |
| Frontend | Next.js 14 (App Router) + TypeScript strict |
| UI | shadcn/ui (dark) + Tailwind CSS |
| Banco | MySQL Hostgator via Prisma (schema novo) |
| Auth | NextAuth.js v5 |
| Email | Brevo |
| Analytics | Posthog |
| Deploy | Vercel + domínio [bigdatabet.com.br](http://bigdatabet.com.br/) |

---

## Status Geral — Fase 1 ✅ Concluída

Toda a infraestrutura, CMS, Auth, Dashboard, Email, Analytics, Páginas Públicas e Deploy foram entregues em **01/05/2026**.

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

**Objetivo:** Migrar a inteligência das planilhas BDB (.xlsm) para uma tela web nativa na área logada, expandindo os modelos estatísticos com Poisson Zero-Inflacionado, Binomial Negativa e Dixon-Coles.

## Escopo MVP
- Liga única: Brasileirão Série A (acesso FREE para todos os usuários autenticados)
- Tela única consolidada com todos os painéis (DASH + CS + FT + EVOL + MAPVAL)
- Origem dos dados: football-data.co.uk via upload manual de CSV pelo admin
- 4 modelos estatísticos selecionáveis pelo usuário

## O que NÃO entra na Fase 2
- Outras ligas (Fase 4, atrelado a planos pagos)
- Ingestão automática (Fase 6)
- Backtest interativo (Fase 5)

## Modelos Estatísticos Suportados
1. Poisson padrão (já presente na planilha original)
2. Poisson Zero-Inflacionado (ZIP) — corrige excesso de 0x0
3. Binomial Negativa — lida com superdispersão (variância > média)
4. Dixon-Coles — correção tau para placares baixos + decaimento temporal

## Painéis da Tela Única (`/dashboard/ligas/[slug]`)
1. **Seletor de Confronto** — dropdown casa/visitante + filtros (rodadas, mando, faixa de odds)
2. **Painel de Médias** — gols, pontos, peso e custo do gol (replica aba DASH)
3. **Matriz de Placares** — grid 11x11 com modelo selecionável (replica aba CS)
4. **Painel de Mercados** — 1X2, BTTS, Over/Under, Handicaps Asiáticos com odds justas e EV%
5. **Mapa de Valor** — ROI por faixa de odds (replica aba MAPVAL)
6. **Evolução de Gols** — gráfico Recharts por rodada (replica aba EVOL)
7. **Seletor de Modelo** — toggle Poisson | ZIP | NB | Dixon-Coles aplicado em tempo real

## Ingestão de Dados (Admin)
- Botão "Importar CSV" na área administrativa (`/cms/ligas/importar` — restrito a ADMIN)
- Upload de arquivo CSV no padrão football-data.co.uk
- Parser converte em upsert de Teams + Matches com log de importação
- MVP é 100% manual (sem cron)

## Critérios de Aceite Fase 2
- [ ] Schema Prisma com League, Team, Match aplicado sem afetar tabelas legadas
- [ ] Upload de CSV do Brasileirão A funciona e popula o banco
- [ ] Tela única `/dashboard/ligas/brasileirao-serie-a` renderiza todos os painéis
- [ ] 4 modelos estatísticos calculam corretamente e podem ser alternados
- [ ] Cálculos validados contra a planilha BRA1DASHv261.xlsx (ground truth)
- [ ] Performance: tela carrega em < 2s com dados do Brasileirão completo
- [ ] Acesso liberado para qualquer usuário autenticado (MEMBRO+)

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
- [ ] Lista de assinantes Hubla importada para tabela LegacyAccess
- [ ] Stripe configurado com plano Básico mensal
- [ ] Checkout funcional e webhook processando eventos
- [ ] Ligas VIP visíveis no seletor para usuários habilitados
- [ ] Usuários sem acesso veem CTA de upgrade
- [ ] Cancelamento de assinatura revoga acesso (não afeta legacy)

---

# Fase 5: Curso + Backtest Interativo
- Player de vídeo protegido por plano Premium
- Progresso por aula salvo no banco
- Backtest com filtros → query → cálculo Node → gráficos Recharts + tabela + resumo

---

# Fase 6: Automações + Bases Históricas
- Bull + Redis para fila de processamento
- Ingestão automática football-data via cron
- Bases históricas para múltiplas temporadas
- Otimização de índices para queries de larga escala