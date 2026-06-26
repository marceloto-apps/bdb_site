# MODELOS_ESTATISTICOS_V2

# MODELOS ESTATÍSTICOS — Big Data Bet

> **Versão:** 2.0 | **Atualizado:** 05/05/2026
**Mudanças desde v1.1:**
> 
> - Arquitetura reestruturada: 4 modelos no painel
> (Poisson Simples, Poisson Dixon-Coles, ZIP, Binomial Negativa)
> - Dixon-Coles redefinido como camada de calibração sobre Poisson (τ exclusivo)
> - Decay temporal (ξ) aplicado nos 3 modelos avançados (DC, ZIP, BN)
> - Poisson Simples preservado sem decay para compatibilidade com planilha legada
> - Incorporadas fórmulas, restrições e recomendações validadas pela literatura
> (Dixon & Coles 1997, Constantinou 2021, Buchdahl, Ed Miller, Syrový)
> - Seção de estimação de parâmetros expandida com MLE, restrição de
> identificabilidade e decaimento temporal detalhado
> - Novas seções: fundamentação teórica, limitações conhecidas, validação de calibração
> - Seção de amostra mínima atualizada com recomendações da literatura

**Referência para:** Fase 2 — Engine de Cálculo Estatístico (`lib/analytics/`)
**Validação:** Toda implementação deve bater com `BRA1DASHv261.xlsx` (ground truth)
com diferença < 0.5%

---

## Sumário

1. [Notação e Conceitos Comuns](https://www.notion.so/MODELOS_ESTATISTICOS_V2-35745372e262808aa845eacd47694775?pvs=21)
2. [Fundamentação Teórica](https://www.notion.so/MODELOS_ESTATISTICOS_V2-35745372e262808aa845eacd47694775?pvs=21)
3. [Cálculo de Forças (Base Compartilhada)](https://www.notion.so/MODELOS_ESTATISTICOS_V2-35745372e262808aa845eacd47694775?pvs=21)
4. [Modelo 1 — Poisson Simples (Default)](https://www.notion.so/MODELOS_ESTATISTICOS_V2-35745372e262808aa845eacd47694775?pvs=21)
5. [Modelo 2 — Poisson + Dixon-Coles (Calibrado)](https://www.notion.so/MODELOS_ESTATISTICOS_V2-35745372e262808aa845eacd47694775?pvs=21)
6. [Modelo 3 — ZIP (Zero-Inflated Poisson)](https://www.notion.so/MODELOS_ESTATISTICOS_V2-35745372e262808aa845eacd47694775?pvs=21)
7. [Modelo 4 — Binomial Negativa](https://www.notion.so/MODELOS_ESTATISTICOS_V2-35745372e262808aa845eacd47694775?pvs=21)
8. [Cálculos Derivados (Mercados, Odds Justas, EV)](https://www.notion.so/MODELOS_ESTATISTICOS_V2-35745372e262808aa845eacd47694775?pvs=21)
9. [Decisões de Calibração Aprovadas](https://www.notion.so/MODELOS_ESTATISTICOS_V2-35745372e262808aa845eacd47694775?pvs=21)
10. [Amostra Mínima e Estabilidade de Parâmetros](https://www.notion.so/MODELOS_ESTATISTICOS_V2-35745372e262808aa845eacd47694775?pvs=21)
11. [Validação e Métricas de Calibração](https://www.notion.so/MODELOS_ESTATISTICOS_V2-35745372e262808aa845eacd47694775?pvs=21)
12. [Casos de Borda e Tratamento de Erros](https://www.notion.so/MODELOS_ESTATISTICOS_V2-35745372e262808aa845eacd47694775?pvs=21)
13. [Validação contra Ground Truth](https://www.notion.so/MODELOS_ESTATISTICOS_V2-35745372e262808aa845eacd47694775?pvs=21)
14. [Limitações Conhecidas](https://www.notion.so/MODELOS_ESTATISTICOS_V2-35745372e262808aa845eacd47694775?pvs=21)
15. [Roadmap de Evolução (Fase 3+)](https://www.notion.so/MODELOS_ESTATISTICOS_V2-35745372e262808aa845eacd47694775?pvs=21)
16. [Diferenças entre a Planilha Legada e o Sistema Novo](https://www.notion.so/MODELOS_ESTATISTICOS_V2-35745372e262808aa845eacd47694775?pvs=21)

---

## 1. Notação e Conceitos Comuns

### Variáveis

| Símbolo | Significado |
| --- | --- |
| $$\\lambda_h$$ | Gols esperados do mandante no confronto |
| $$\\lambda_a$$ | Gols esperados do visitante no confronto |
| `FCAtC[T]` | Força ofensiva do time T como mandante |
| `FCDfC[T]` | Força defensiva do time T como mandante |
| `FCAtV[T]` | Força ofensiva do time T como visitante |
| `FCDfV[T]` | Força defensiva do time T como visitante |
| `MGC[T]` | Média de gols marcados pelo time T quando mandante |
| `MGV[T]` | Média de gols marcados pelo time T quando visitante |
| `MGSC[T]` | Média de gols sofridos pelo time T quando mandante |
| `MGSV[T]` | Média de gols sofridos pelo time T quando visitante |
| $$\\gamma$$ | Vantagem de mando — embutida na separação por mando |
| $$\\mu_h^{liga}$$ | Média de gols do mandante na liga |
| $$\\mu_a^{liga}$$ | Média de gols do visitante na liga |
| $$\\rho$$ | Parâmetro de dependência do Dixon-Coles |
| $$\\xi$$ | Taxa de decaimento temporal |
| $$\\pi$$ | Parâmetro de inflação de zeros (ZIP) |
| $$r$$ | Parâmetro de dispersão da Binomial Negativa |
| $$\\alpha_i$$ | Parâmetro de ataque do time i (MLE Dixon-Coles) |
| $$\\beta_i$$ | Parâmetro de defesa do time i (MLE Dixon-Coles) |
| $$\\phi(t)$$ | Função de peso temporal: $$e^{-\\xi t}$$ |

> **Nota:** a notação foi alinhada com as colunas da planilha BDBRA1
(BRA1DASHv261.xlsx) para facilitar manutenção e validação contra o ground truth.
> 

### Convenções de Implementação

- Todas as funções recebem `lambda` em `number` (não `bigint`)
- Limite máximo de gols na matriz: `10` (grid 11×11, índices 0..10)
- Probabilidades sempre normalizadas: $$\\sum P(x,y) \\approx 1.0$$ (tolerância 0.001)
- Funções puras (sem side effects) — facilita testes unitários
- Arredondamento apenas na exibição final, nunca durante cálculos intermediários

### Arquitetura dos 4 Modelos no Painel

┌───────────────────────────────────────────────────────────┐
│                   CAMADA COMPARTILHADA                    │
│                                                           │
│  • Médias da liga (μ_h, μ_a)                              │
│  • Médias individuais por time (MGC, MGSC, MGV, MGSV)     │
│  • Forças (FCAtC, FCDfC, FCAtV, FCDfV)                    │
│  • Lambdas do confronto (λ_h, λ_a)                        │
│                                                           │
│  Sem decay:  Modelo 1                                     │
│  Com decay:  Modelos 2, 3 e 4 (médias ponderadas por ξ)  │
└──────────┬────────────┬──────────────┬────────────────────┘
│            │              │
┌─────┴─────┐ ┌────┴─────┐  ┌────┴──────┐
│  Modelo 1 │ │ Modelo 2 │  │ Modelo 3  │  ┌───────────┐
│  Poisson  │ │ Poisson  │  │   ZIP     │  │ Modelo 4  │
│  Simples  │ │ Dixon-   │  │           │  │ Binomial  │
│           │ │ Coles    │  │ + π (inf. │  │ Negativa  │
│ (sem τ)   │ │          │  │   zeros)  │  │           │
│ (sem ξ)   │ │ + τ(ρ)   │  │ + ξ decay │  │ + r (disp)│
│           │ │ + ξ decay│  │           │  │ + ξ decay │
└─────┬─────┘ └────┬─────┘  └─────┬─────┘  └─────┬─────┘
│            │              │               │
▼            ▼              ▼               ▼
Matriz 11×11  Matriz 11×11  Matriz 11×11    Matriz 11×11
(indep.)      (corrigida)   (zeros inflados) (superdispersa)
│            │              │               │
└────────────┴──────┬───────┴───────────────┘
▼
Cálculos Derivados
(1X2, O/U, BTTS, AH, EV)

```

### Compatibilidade τ × Distribuição

| Distribuição | Razão P(1)/P(0) | Igual a μ? | τ preserva marginais? | Decay compatível? |
|---|---|---|---|---|
| **Poisson** | $$\\mu$$ | ✅ | ✅ | ✅ |
| **ZIP** | Inflação artificial no zero | ❌ | ❌ **Incompatível** | ✅ |
| **Binomial Negativa** | Depende de r e p | ❌ | ❌ **Incompatível** | ✅ |

> **Regra:** τ(ρ) aplica-se **exclusivamente** ao Modelo 2 (Poisson Dixon-Coles).
> O decay temporal (ξ) aplica-se aos Modelos 2, 3 e 4.

### Seleção de Modelo na UI

| Modelo | Rótulo no Painel | Badge | Default? |
|--------|-----------------|-------|----------|
| 1 | Poisson Simples | `Default` (verde) | ✅ |
| 2 | Poisson Dixon-Coles | `Avançado` (roxo) | — |
| 3 | ZIP | `Avançado` (roxo) | — |
| 4 | Binomial Negativa | `Avançado` (roxo) | — |

---

## 2. Fundamentação Teórica

### 2.1 Por que Poisson?

O modelo de Poisson para futebol foi proposto por **Maher (1982)** e refinado por
**Dixon & Coles (1997)**. A premissa é que gols são eventos raros e discretos
que ocorrem de forma aproximadamente independente ao longo do tempo de jogo,
sendo bem modelados por uma distribuição de Poisson.

**Propriedade central:** Na Poisson, média = variância ($$E[X] = Var(X) = \\lambda$$).

### 2.2 Limitações do Poisson Independente (documentadas na literatura)

| Limitação | Descrição | Corrigido por | Fonte |
|-----------|-----------|---------------|-------|
| **Correlação entre gols** | Gols do mandante e visitante não são independentes, especialmente em placares baixos | Modelo 2 (τ) | Dixon & Coles (1997) |
| **Excesso de zeros** | Placares 0×0, 1×0, 0×1, 1×1 sistematicamente sub/superestimados | Modelo 2 (τ) e Modelo 3 (π) | Dixon & Coles (1997) |
| **Superdispersão** | Variância dos gols frequentemente excede a média ($$\\sigma^2 > \\lambda$$) | Modelo 4 (r) | Moroney (1956), Reep et al. (1971) |
| **Estacionariedade** | Todos os jogos pesam igual, ignora forma recente | Modelos 2, 3, 4 (ξ) | Dixon & Coles (1997) |
| **Insuficiência de gols como proxy** | Gols são eventos raros e ruidosos; xG seria mais estável | Fase 5+ | Constantinou (2021) |
| **Variáveis externas** | Contratações, demissões de técnico, clima, lesões | Não capturado | Dixon & Coles (1997) |

### 2.3 Por que Dixon-Coles é calibração exclusiva do Poisson?

A função τ de Dixon-Coles foi derivada **especificamente** para preservar as
marginais de Poisson. A condição matemática que sustenta a correção é:

$$
P(Y=1) = \\mu \\cdot P(Y=0)
$$

Essa propriedade **só existe na distribuição de Poisson** (onde $$P(k) = \\frac{e^{-\\mu} \\mu^k}{k!}$$).

Aplicar τ sobre ZIP ou Binomial Negativa **quebra a consistência das marginais** —
o modelo preveria uma média de gols diferente dos λ e μ inseridos, invalidando
a interpretação dos parâmetros de ataque e defesa.

Para compor τ com ZIP ou BN de forma rigorosa, seria necessário **re-derivar
os coeficientes da função τ** para as novas proporções P(1)/P(0) de cada distribuição.
A literatura não reporta essa derivação.

### 2.4 O que cada modelo corrige

| Problema | Modelo 1 | Modelo 2 | Modelo 3 | Modelo 4 |
|----------|----------|----------|----------|----------|
| Correlação placares baixos | ❌ | ✅ τ(ρ) | ❌ | ❌ |
| Excesso de zeros | ❌ | ✅ parcial (τ em 0×0) | ✅ total (π) | ❌ |
| Superdispersão | ❌ | ❌ | ❌ | ✅ r |
| Forma recente | ❌ | ✅ ξ | ✅ ξ | ✅ ξ |
| Compatível com planilha | ✅ 100% | ❌ evolução | ❌ evolução | ❌ evolução |

---

## 3. Cálculo de Forças (Base Compartilhada)

> Todos os 4 modelos utilizam esta seção para obter λ_h e λ_a.
> A diferença: Modelo 1 usa médias simples; Modelos 2, 3 e 4 usam médias
> ponderadas pelo decay temporal.

### 3.1 Médias da Liga

Calculadas uma única vez por temporada/liga, usando TODOS os jogos da liga
(sem filtros, sem decay):

$$
\\mu_h^{liga} = \\frac{\\sum \\text{FTHG}}{\\text{total de jogos}}
$$

$$
\\mu_a^{liga} = \\frac{\\sum \\text{FTAG}}{\\text{total de jogos}}
$$

### 3.2 Médias Individuais por Time (separadas por mando)

Para cada time T da liga, calcular 4 médias usando TODOS os jogos da temporada do time:

$$
\\text{MGC}[T] = \\text{média de gols marcados por } T \\text{ em jogos como mandante}
$$

$$
\\text{MGSC}[T] = \\text{média de gols sofridos por } T \\text{ em jogos como mandante}
$$

$$
\\text{MGV}[T] = \\text{média de gols marcados por } T \\text{ em jogos como visitante}
$$

$$
\\text{MGSV}[T] = \\text{média de gols sofridos por } T \\text{ em jogos como visitante}
$$

### 3.3 Forças Individuais

A força é a razão entre o desempenho do time e o desempenho médio da liga:

$$
\\text{FCAtC}[T] = \\frac{\\text{MGC}[T]}{\\mu_h^{liga}}
$$

$$
\\text{FCDfC}[T] = \\frac{\\text{MGSC}[T]}{\\mu_a^{liga}}
$$

$$
\\text{FCAtV}[T] = \\frac{\\text{MGV}[T]}{\\mu_a^{liga}}
$$

$$
\\text{FCDfV}[T] = \\frac{\\text{MGSV}[T]}{\\mu_h^{liga}}
$$

> **Interpretação:**
> - FCAtC > 1 → time marca mais gols em casa do que a média da liga
> - FCDfC < 1 → time sofre menos gols em casa do que a média da liga
> - Times equilibrados têm forças próximas de 1,0

### 3.4 Os Três Métodos de Estimativa de Lambda

O Big Data Bet v2.0 suporta três métodos ortogonais de cálculo do \\(\\lambda\\) (input para os modelos):

#### 3.4.1 Média Simples (Baseline)
O método mais direto que cruza o ataque de um com a defesa do outro. Usado como baseline de referência.
$$
\\lambda_h = \\frac{\\text{MGC}[\\text{Home}] + \\text{MGSV}[\\text{Away}]}{2}
$$

$$
\\lambda_a = \\frac{\\text{MGV}[\\text{Away}] + \\text{MGSC}[\\text{Home}]}{2}
$$

#### 3.4.2 Forças Relativas (Clássico)
O método preditivo padrão. Usa o fator de ataque e defesa relativos à média da liga (\\(\\mu^{liga}\\)).
$$
\\lambda_h = \\text{FCAtC}[\\text{Home}] \\cdot \\text{FCDfV}[\\text{Away}] \\cdot \\mu_h^{liga}
$$

$$
\\lambda_a = \\text{FCAtV}[\\text{Away}] \\cdot \\text{FCDfC}[\\text{Home}] \\cdot \\mu_a^{liga}
$$

#### 3.4.3 Expected Goals (xG)
Usa as métricas avançadas de qualidade de finalização. Funciona exatamente como Forças Relativas, mas as forças e médias da liga são baseadas em gols esperados (xG) em vez de gols marcados.
$$
\\lambda_h = \\text{FCAtC}_{xg}[\\text{Home}] \\cdot \\text{FCDfV}_{xg}[\\text{Away}] \\cdot \\mu_{h,xg}^{liga}
$$

$$
\\lambda_a = \\text{FCAtV}_{xg}[\\text{Away}] \\cdot \\text{FCDfC}_{xg}[\\text{Home}] \\cdot \\mu_{a,xg}^{liga}
$$

> **Nota importante:** A vantagem de mando (home advantage) está **embutida
> na separação por mando**. Não multiplicar parâmetro \\(\\gamma\\) separadamente.
>
> **Fallback Automático:** Caso a liga ou os times não tenham amostragem suficiente de xG (mínimo 20 jogos para liga e 5 para cada mando do time), o sistema realiza um *fallback automático* transparente para o método **Forças Relativas**, alertando a interface visualmente. O cálculo garante proteção contra *division by zero* usando fallback na divisão (`liga.muH || 1`).

### 3.5 Pseudocódigo — Forças Sem Decay (Modelo 1)

```typescript
interface MediasLigaCalculadas {
  muH: number   // μ_h liga
  muA: number   // μ_a liga
  totalJogos: number
}

interface MediasTime {
  mgc: number    // gols marcados como mandante
  mgsc: number   // gols sofridos como mandante
  mgv: number    // gols marcados como visitante
  mgsv: number   // gols sofridos como visitante
  jogosCasa: number
  jogosFora: number
}

interface ForcasTime {
  fcAtC: number   // ataque como mandante
  fcDfC: number   // defesa como mandante
  fcAtV: number   // ataque como visitante
  fcDfV: number   // defesa como visitante
}

/**
 * Calcula μ_h e μ_a usando TODOS os jogos da liga.
 * Não aplicar filtros de odd ou data nesta etapa.
 */
function calcularMediasLiga(jogos: Match[]): MediasLigaCalculadas {
  const totalJogos = jogos.length
  if (totalJogos < 20) {
    throw new Error('Liga com menos de 20 jogos não permite cálculo confiável')
  }
  const muH = jogos.reduce((s, j) => s + j.fthg, 0) / totalJogos
  const muA = jogos.reduce((s, j) => s + j.ftag, 0) / totalJogos
  return { muH, muA, totalJogos }
}

/**
 * Calcula as 4 médias individuais do time (sem peso temporal).
 * Separa rigorosamente por mando — jogos em casa vs jogos fora.
 */
function calcularMediasTime(teamId: string, jogos: Match[]): MediasTime {
  const jogosCasa = jogos.filter(j => j.homeTeamId === teamId)
  const jogosFora = jogos.filter(j => j.awayTeamId === teamId)

  if (jogosCasa.length < 5 || jogosFora.length < 5) {
    throw new Error(`Time ${teamId} com poucos dados (mínimo 5 jogos casa + 5 fora)`)
  }

  return {
    mgc: jogosCasa.reduce((s, j) => s + j.fthg, 0) / jogosCasa.length,
    mgsc: jogosCasa.reduce((s, j) => s + j.ftag, 0) / jogosCasa.length,
    mgv: jogosFora.reduce((s, j) => s + j.ftag, 0) / jogosFora.length,
    mgsv: jogosFora.reduce((s, j) => s + j.fthg, 0) / jogosFora.length,
    jogosCasa: jogosCasa.length,
    jogosFora: jogosFora.length,
  }
}

/**
 * Calcula as 4 forças do time a partir das médias individuais e da liga.
 */
function calcularForcasTime(
  medias: MediasTime,
  ligaMedias: MediasLigaCalculadas
): ForcasTime {
  return {
    fcAtC: medias.mgc / ligaMedias.muH,
    fcDfC: medias.mgsc / ligaMedias.muA,
    fcAtV: medias.mgv / ligaMedias.muA,
    fcDfV: medias.mgsv / ligaMedias.muH,
  }
}

/**
 * Combina forças dos dois times no confronto e retorna lambdas esperados.
 */
function calcularLambdas(
  forcasHome: ForcasTime,
  forcasAway: ForcasTime,
  ligaMedias: MediasLigaCalculadas
): { lambdaH: number; lambdaA: number } {
  const lambdaH = forcasHome.fcAtC * forcasAway.fcDfV * ligaMedias.muH
  const lambdaA = forcasAway.fcAtV * forcasHome.fcDfC * ligaMedias.muA
  return { lambdaH, lambdaA }
}
```

### 3.6 Pseudocódigo — Forças Com Decay (Modelos 2, 3 e 4)

```tsx
const XI_DEFAULT = 0.0065 // unidade: meia-semana (paper original)
// Meia-vida: ln(2) / 0.0065 ≈ 107 meias-semanas ≈ 373 dias ≈ 1 temporada

/**
 * Calcula peso temporal de um jogo em relação à data de referência.
 * Δt é medido em meias-semanas (≈3.5 dias) para compatibilidade
 * com o valor original de ξ = 0.0065 do paper Dixon & Coles (1997).
 */
function pesoTemporal(
  dataJogo: Date,
  dataReferencia: Date,
  xi: number = XI_DEFAULT
): number {
  const msPorMeiaSemana = 1000 * 60 * 60 * 24 * 3.5
  const meiasSemanasAtras =
    (dataReferencia.getTime() - dataJogo.getTime()) / msPorMeiaSemana
  return Math.exp(-xi * Math.max(0, meiasSemanasAtras))
}

/**
 * Calcula médias ponderadas pelo decay temporal.
 * Cada jogo contribui proporcionalmente ao seu peso φ(t).
 * Médias da liga NÃO usam decay — apenas as individuais.
 */
function calcularMediasTimeComDecay(
  teamId: string,
  jogos: Match[],
  dataReferencia: Date,
  xi: number = XI_DEFAULT
): MediasTime {
  const jogosCasa = jogos.filter(j => j.homeTeamId === teamId)
  const jogosFora = jogos.filter(j => j.awayTeamId === teamId)

  if (jogosCasa.length < 5 || jogosFora.length < 5) {
    throw new Error(`Time ${teamId} com poucos dados (mínimo 5 jogos casa + 5 fora)`)
  }

  // Pesos para jogos em casa
  const pesosCasa = jogosCasa.map(j => pesoTemporal(j.date, dataReferencia, xi))
  const somaPesosCasa = pesosCasa.reduce((s, w) => s + w, 0)

  // Pesos para jogos fora
  const pesosFora = jogosFora.map(j => pesoTemporal(j.date, dataReferencia, xi))
  const somaPesosFora = pesosFora.reduce((s, w) => s + w, 0)

  // Médias ponderadas
  const mgc = jogosCasa.reduce((s, j, i) => s + j.fthg * pesosCasa[i], 0) / somaPesosCasa
  const mgsc = jogosCasa.reduce((s, j, i) => s + j.ftag * pesosCasa[i], 0) / somaPesosCasa
  const mgv = jogosFora.reduce((s, j, i) => s + j.ftag * pesosFora[i], 0) / somaPesosFora
  const mgsv = jogosFora.reduce((s, j, i) => s + j.fthg * pesosFora[i], 0) / somaPesosFora

  return {
    mgc, mgsc, mgv, mgsv,
    jogosCasa: jogosCasa.length,
    jogosFora: jogosFora.length,
  }
}
```

---

## 4. Modelo 1 — Poisson Simples (Default)

> **Rótulo no painel:** "Poisson Simples"
**Badge:** `Default` (verde)
**Tooltip:** "Modelo clássico de previsão de placares. Calcula a probabilidade
de cada placar assumindo que gols de cada time são independentes.
Compatível com a planilha BDB."
> 

### 4.1 Fórmula

$$
P(X = x) = \frac{e^{-\lambda} \lambda^x}{x!}
$$

Probabilidade do placar exato (assume independência):

$$
P(H = x, A = y) = P(X_h = x) \cdot P(X_a = y)
$$

### 4.2 Pipeline

```
Jogos da liga
  → Médias da liga (μ_h, μ_a)                    [Seção 3.1]
  → Médias individuais SEM decay                  [Seção 3.2]
  → Forças (FCAtC, FCDfC, FCAtV, FCDfV)           [Seção 3.3]
  → Lambdas (λ_h, λ_a)                            [Seção 3.4]
  → Matriz Poisson 11×11 (independente)            [Seção 4.3]
  → Mercados derivados                             [Seção 8]
```

### 4.3 Pseudocódigo

```tsx
// Cálculo de fatorial com cache para evitar recomputação
const cacheFatorial: number[] = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800]

function fatorial(n: number): number {
  if (n < 0) throw new Error('Fatorial de negativo não definido')
  if (n < cacheFatorial.length) return cacheFatorial[n]
  let r = cacheFatorial[cacheFatorial.length - 1]
  for (let i = cacheFatorial.length; i <= n; i++) {
    r *= i
    cacheFatorial.push(r)
  }
  return r
}

function poissonPmf(lambda: number, x: number): number {
  if (lambda <= 0) return x === 0 ? 1 : 0
  return (Math.exp(-lambda) * Math.pow(lambda, x)) / fatorial(x)
}

function matrizPlacaresPoisson(
  lambdaH: number,
  lambdaA: number,
  max = 10
): number[][] {
  const matriz: number[][] = []
  for (let h = 0; h <= max; h++) {
    matriz[h] = []
    for (let a = 0; a <= max; a++) {
      matriz[h][a] = poissonPmf(lambdaH, h) * poissonPmf(lambdaA, a)
    }
  }
  return matriz
}
```

### 4.4 Características

- ✅ Simples, rápido, ground truth da BDB
- ✅ Compatível 100% com a planilha legada
- ⚠️ Subestima placares 0×0 e 1×1
- ⚠️ Assume independência entre os times
- ⚠️ Todos os jogos pesam igual (sem forma recente)

---

## 5. Modelo 2 — Poisson + Dixon-Coles (Calibrado)

> **Rótulo no painel:** "Poisson Dixon-Coles"
**Badge:** `Avançado` (roxo)
**Tooltip:** "Evolução do modelo Poisson com duas correções: (1) ajuste de
correlação em placares baixos (0×0, 1×0, 0×1, 1×1) e (2) peso maior
para jogos recentes. Mais preciso, especialmente em jogos equilibrados."
> 

### 5.1 Fundamentação (Dixon & Coles, 1997)

O modelo corrige duas limitações do Poisson Simples:

1. **Correlação em placares baixos:** a função τ(ρ) ajusta as probabilidades
dos 4 placares que o Poisson independente mais erra
2. **Estacionariedade:** o decaimento temporal dá mais peso a jogos recentes,
refletindo a forma atual dos times

A probabilidade conjunta de um placar (x, y) é:

$$
P_{DC}(H=x, A=y) = \tau_{\lambda_h, \lambda_a}(x, y) \cdot \frac{e^{-\lambda_h} \lambda_h^x}{x!} \cdot \frac{e^{-\lambda_a} \lambda_a^y}{y!}
$$

### 5.2 Função τ de Correção

$$
\tau_{\lambda_h, \lambda_a}(x, y) = \begin{cases}
1 - \lambda_h \lambda_a \rho & \text{se } (x,y) = (0,0) \\
1 + \lambda_a \rho & \text{se } (x,y) = (1,0) \\
1 + \lambda_h \rho & \text{se } (x,y) = (0,1) \\
1 - \rho & \text{se } (x,y) = (1,1) \\
1 & \text{caso contrário}
\end{cases}
$$

**Propriedade crucial:** esta formulação preserva as distribuições marginais
de Poisson com médias $$\lambda_h$$ e $$\lambda_a$$, pois depende da relação
$$P(1) = \mu \cdot P(0)$$ que só vale na Poisson.

> **⚠️ τ é EXCLUSIVO deste modelo.** Não aplicar sobre ZIP ou Binomial Negativa.
> 

### 5.3 Restrições do Parâmetro ρ

Para que todas as probabilidades permaneçam válidas (entre 0 e 1):

$$
\max\left(-\frac{1}{\lambda_h},\ -\frac{1}{\lambda_a}\right) \leq \rho \leq \min\left(\frac{1}{\lambda_h \lambda_a},\ 1\right)
$$

Na prática, ρ tende a ser **negativo e pequeno** (tipicamente entre -0.10 e -0.03),
indicando que placares 0×0 e 1×1 ocorrem mais do que o Poisson independente prevê.

### 5.4 Decaimento Temporal

Função de peso do paper original:

$$
\phi(t) = e^{-\xi t}
$$

Onde:

- $$t$$ = tempo em **meias-semanas** entre o jogo e a data de referência
- $$\xi = 0.0065$$ = valor otimizado por Dixon & Coles (1997)
- Meia-vida: $$t_{1/2} = \frac{\ln 2}{\xi} \approx 107$$ meias-semanas ≈ 373 dias

| Valor de ξ | Comportamento |
| --- | --- |
| $$\xi = 0$$ | Modelo estático — todos os jogos pesam igual |
| $$\xi = 0.0065$$ | Valor otimizado — meia-vida ~1 temporada |
| $$\xi$$ grande | Modelo reativo — só jogos recentes importam |

> **Decisão:** ξ = 0.0065 fixo. Robustez confirmada pelo paper original
(resultados estáveis em faixa próxima ao valor otimizado).
Aplicado via `calcularMediasTimeComDecay()` [Seção 3.6].
> 

### 5.5 Estimação de ρ

**Método aprovado:** Estimativa empírica via grid search (sem MLE completo).

**Algoritmo:**

```
1. Calcular λ_h e λ_a médios da liga (μ_h, μ_a)
2. Calcular frequências observadas de 0×0, 1×0, 0×1, 1×1 na liga
3. Para cada ρ no grid [-0.30, -0.29, ..., +0.30], passo 0.01:
   a. Verificar se ρ respeita as restrições (seção 5.3)
   b. Calcular probabilidades teóricas dos 4 placares com τ(ρ)
   c. Calcular SSE (soma dos quadrados dos erros) vs frequências observadas
4. Escolher ρ que minimiza SSE
5. Validar: se |ρ| < 0.001, usar ρ = 0 (sem correção significativa)
```

### 5.6 Log-Verossimilhança (referência para evolução futura)

A formulação completa do paper original, incluindo decay:

$$
l_t = \sum_{k \in A_t} \phi(t - t_k) \left[ \log \tau_{\lambda_k, \mu_k}(x_k, y_k) - \lambda_k + x_k \log \lambda_k - \mu_k + y_k \log \mu_k \right]
$$

Onde:

- $$\lambda_k = \alpha_{i(k)} \beta_{j(k)} \gamma$$ (gols esperados do mandante)
- $$\mu_k = \alpha_{j(k)} \beta_{i(k)}$$ (gols esperados do visitante)
- $$\phi(t - t_k) = e^{-\xi(t - t_k)}$$ (peso temporal)

**Restrição de identificabilidade:**

$$
\frac{1}{n} \sum_{i=1}^{n} \alpha_i = 1
$$

> **Nota:** a estimação por MLE completo (otimização simultânea de todos os α, β, ρ, γ)
é reservada para evolução futura. Na v2.0, usamos médias por mando (forças)
como proxy dos parâmetros de ataque/defesa, e ρ estimado por grid search.
> 

### 5.7 Pipeline

```
Jogos da liga
  → Médias da liga (μ_h, μ_a)                    [Seção 3.1]     (sem decay)
  → Médias individuais COM decay                  [Seção 3.6]     (peso temporal)
  → Forças ponderadas                              [Seção 3.3]     (sobre médias com decay)
  → Lambdas (λ_h, λ_a)                            [Seção 3.4]
  → Estimar ρ da liga                              [Seção 5.5]
  → Matriz Poisson 11×11                           [Seção 4.3]
  → Aplicar τ(ρ) nas 4 células baixas              [Seção 5.2]
  → Normalizar matriz                              [Seção 5.8]
  → Mercados derivados                             [Seção 8]
```

### 5.8 Pseudocódigo

```tsx
/**
 * Calcula τ de Dixon-Coles para um placar (x, y).
 * Só atua em placares onde x ≤ 1 E y ≤ 1.
 * EXCLUSIVO do Modelo 2 — não usar com ZIP ou Binomial Negativa.
 */
function tauDixonColes(
  x: number,
  y: number,
  lambdaH: number,
  lambdaA: number,
  rho: number
): number {
  if (x === 0 && y === 0) return 1 - lambdaH * lambdaA * rho
  if (x === 1 && y === 0) return 1 + lambdaA * rho
  if (x === 0 && y === 1) return 1 + lambdaH * rho
  if (x === 1 && y === 1) return 1 - rho
  return 1
}

/**
 * Valida se ρ está dentro dos limites matemáticos permitidos.
 */
function validarRho(
  rho: number,
  lambdaH: number,
  lambdaA: number
): boolean {
  const limInf = Math.max(-1 / lambdaH, -1 / lambdaA)
  const limSup = Math.min(1 / (lambdaH * lambdaA), 1)
  return rho >= limInf && rho <= limSup
}

/**
 * Clamp de ρ para limites válidos de um confronto específico.
 * O ρ é estimado com médias da liga mas aplicado com λ do confronto.
 */
function clampRho(
  rho: number,
  lambdaH: number,
  lambdaA: number
): { rho: number; clamped: boolean } {
  const limInf = Math.max(-1 / lambdaH, -1 / lambdaA)
  const limSup = Math.min(1 / (lambdaH * lambdaA), 1)
  if (rho < limInf) return { rho: limInf, clamped: true }
  if (rho > limSup) return { rho: limSup, clamped: true }
  return { rho, clamped: false }
}

/**
 * Estima ρ por grid search minimizando SSE contra frequências observadas.
 * Valida limites de ρ para cada candidato.
 */
function estimarRhoEmpirico(
  jogos: Match[],
  medias: MediasLigaCalculadas
): number {
  const N = jogos.length

  const freqObservada = {
    '0,0': jogos.filter(j => j.fthg === 0 && j.ftag === 0).length / N,
    '0,1': jogos.filter(j => j.fthg === 0 && j.ftag === 1).length / N,
    '1,0': jogos.filter(j => j.fthg === 1 && j.ftag === 0).length / N,
    '1,1': jogos.filter(j => j.fthg === 1 && j.ftag === 1).length / N,
  }

  const lh = medias.muH
  const la = medias.muA

  let melhorRho = 0
  let menorErro = Infinity

  for (let rho = -0.30; rho <= 0.30; rho += 0.01) {
    if (!validarRho(rho, lh, la)) continue

    let erro = 0
    for (const [chave, freq] of Object.entries(freqObservada)) {
      const [x, y] = chave.split(',').map(Number)
      const probTeorica =
        tauDixonColes(x, y, lh, la, rho) *
        poissonPmf(lh, x) *
        poissonPmf(la, y)
      erro += Math.pow(freq - probTeorica, 2)
    }
    if (erro < menorErro) {
      menorErro = erro
      melhorRho = rho
    }
  }

  if (Math.abs(melhorRho) < 0.001) return 0
  return Math.round(melhorRho * 100) / 100
}

/**
 * Gera a matriz Dixon-Coles: Poisson × τ(ρ), normalizada.
 */
function matrizPlacaresDixonColes(
  lambdaH: number,
  lambdaA: number,
  rho: number,
  max = 10
): number[][] {
  // Clamp ρ para limites do confronto específico
  const { rho: rhoSafe, clamped } = clampRho(rho, lambdaH, lambdaA)
  if (clamped) {
    console.warn(`ρ clampado de ${rho} para ${rhoSafe} (λH=${lambdaH}, λA=${lambdaA})`)
  }

  const matriz: number[][] = []
  for (let h = 0; h <= max; h++) {
    matriz[h] = []
    for (let a = 0; a <= max; a++) {
      const tau = tauDixonColes(h, a, lambdaH, lambdaA, rhoSafe)
      matriz[h][a] = tau * poissonPmf(lambdaH, h) * poissonPmf(lambdaA, a)
    }
  }

  // Normalizar — correção τ pode fazer soma ≠ 1
  const soma = matriz.flat().reduce((s, v) => s + v, 0)
  if (Math.abs(soma - 1) > 0.001) {
    return matriz.map(linha => linha.map(v => v / soma))
  }
  return matriz
}
```

---

## 6. Modelo 3 — ZIP (Zero-Inflated Poisson)

> **Rótulo no painel:** "ZIP (Inflação de Zeros)"
**Badge:** `Avançado` (roxo)
**Tooltip:** "Corrige o excesso de placares 0×0 observado em ligas defensivas.
Usa decay temporal para priorizar jogos recentes."
> 

### 6.1 Fundamentação

O modelo ZIP assume que há dois processos gerando zeros:

1. O processo "normal" de Poisson (time teve chance mas não marcou)
2. Um processo extra de "zeros estruturais" (jogo travado, ultra-defensivo)

O parâmetro π captura a proporção de zeros que **não são explicados** pelo Poisson.

> **Nota da literatura:** o modelo ZIP não é mencionado nos papers de Dixon & Coles,
Constantinou ou Buchdahl para futebol. É uma extensão natural proposta pelo
BigDataBet para ligas com perfil defensivo acentuado.
> 

### 6.2 Fórmula

$$
P(X = 0) = \pi + (1 - \pi) \cdot e^{-\lambda}
$$

$$
P(X = x) = (1 - \pi) \cdot \frac{e^{-\lambda} \lambda^x}{x!}, \quad x \geq 1
$$

### 6.3 Estimação de π (DECISÃO APROVADA: Global da liga — opção A)

Calcula-se um único $$\pi$$ por liga/temporada, separadamente para casa e visitante:

$$
\pi_h = \max\left(0,\ \frac{\#\{j : \text{FTHG}_j = 0\}}{N} - e^{-\mu_h^{liga}}\right)
$$

$$
\pi_a = \max\left(0,\ \frac{\#\{j : \text{FTAG}_j = 0\}}{N} - e^{-\mu_a^{liga}}\right)
$$

### 6.4 Pipeline

```
Jogos da liga
  → Médias da liga (μ_h, μ_a)                    [Seção 3.1]     (sem decay)
  → Médias individuais COM decay                  [Seção 3.6]     (peso temporal)
  → Forças ponderadas                              [Seção 3.3]
  → Lambdas (λ_h, λ_a)                            [Seção 3.4]
  → Estimar π_h e π_a da liga                      [Seção 6.3]
  → Matriz ZIP 11×11 (independente, zeros inflados)[Seção 6.5]
  → Mercados derivados                             [Seção 8]
```

### 6.5 Pseudocódigo

```tsx
/**
 * Estima π (inflação de zeros) global da liga.
 * Separado por mando: πH para mandante, πA para visitante.
 */
function estimarPiLiga(
  jogos: Match[],
  medias: MediasLigaCalculadas
): { piH: number; piA: number } {
  const N = jogos.length

  // Frequência observada de zero gols
  const freqZeroCasa = jogos.filter(j => j.fthg === 0).length / N
  const freqZeroFora = jogos.filter(j => j.ftag === 0).length / N

  // Frequência prevista por Poisson
  const probZeroPoissonCasa = Math.exp(-medias.muH)
  const probZeroPoissonFora = Math.exp(-medias.muA)

  // π é o "excesso" de zeros não explicado por Poisson
  const piH = Math.max(0, freqZeroCasa - probZeroPoissonCasa)
  const piA = Math.max(0, freqZeroFora - probZeroPoissonFora)

  return { piH, piA }
}

function zipPmf(lambda: number, x: number, pi: number): number {
  if (x === 0) {
    return pi + (1 - pi) * Math.exp(-lambda)
  }
  return (1 - pi) * (Math.exp(-lambda) * Math.pow(lambda, x)) / fatorial(x)
}

function matrizPlacaresZIP(
  lambdaH: number,
  lambdaA: number,
  piH: number,
  piA: number,
  max = 10
): number[][] {
  const matriz: number[][] = []
  for (let h = 0; h <= max; h++) {
    matriz[h] = []
    for (let a = 0; a <= max; a++) {
      matriz[h][a] = zipPmf(lambdaH, h, piH) * zipPmf(lambdaA, a, piA)
    }
  }
  return matriz
}
```

### 6.6 Características

- ✅ Corrige excesso de 0×0 em ligas defensivas
- ✅ Estimação simples, sem otimização numérica
- ✅ Decay temporal via forças ponderadas
- ⚠️ Assume independência entre os times (como Poisson)
- ⚠️ τ(ρ) de Dixon-Coles **incompatível** — não aplicar

---

## 7. Modelo 4 — Binomial Negativa

> **Rótulo no painel:** "Binomial Negativa"
**Badge:** `Avançado` (roxo)
**Tooltip:** "Lida com superdispersão (variância maior que a média).
Mais robusto em ligas com alta variabilidade de gols.
Usa decay temporal para priorizar jogos recentes."
> 

### 7.1 Fundamentação

A Poisson exige $$\sigma^2 = \lambda$$. Quando a variância dos gols excede a média
(superdispersão), a Binomial Negativa é mais apropriada por ter um parâmetro
extra de dispersão (r).

Dixon & Coles citam **Moroney (1956)** e **Reep et al. (1971)** como proponentes
da Binomial Negativa para futebol, argumentando que "o acaso domina o jogo"
e que esta distribuição acomoda melhor a variabilidade real dos dados.

### 7.2 Fórmula

$$
P(X = x) = \binom{x + r - 1}{x} (1-p)^x p^r
$$

Relações com λ e σ²:

$$
p = \frac{\lambda}{\sigma^2}, \quad r = \frac{\lambda^2}{\sigma^2 - \lambda}
$$

### 7.3 Tratamento de Variância ≤ Média (DECISÃO APROVADA: Alerta visual — opção B)

Quando $$\sigma^2 \leq \lambda$$, a BN **não é apropriada** (degeneraria em Poisson
com $$r \to \infty$$).

**Comportamento:**

1. Internamente: fazer fallback automático para Poisson padrão
2. Na resposta da API: incluir flag `nbWarning: true` com mensagem
3. Na UI: exibir banner amarelo:
    
    > ⚠️ A Binomial Negativa não é estatisticamente adequada para esta liga
    (sem superdispersão). Resultados exibidos são equivalentes a Poisson padrão.
    Considere usar outro modelo.
    > 

### 7.4 Pipeline

```
Jogos da liga
  → Médias da liga (μ_h, μ_a)                    [Seção 3.1]     (sem decay)
  → Variâncias da liga (σ²_h, σ²_a)               [Seção 7.5]
  → Médias individuais COM decay                  [Seção 3.6]     (peso temporal)
  → Forças ponderadas                              [Seção 3.3]
  → Lambdas (λ_h, λ_a)                            [Seção 3.4]
  → Parâmetros NB (r, p) ou fallback Poisson       [Seção 7.5]
  → Matriz NB 11×11 (independente, superdispersa)  [Seção 7.6]
  → Mercados derivados                             [Seção 8]
```

### 7.5 Estimação de Parâmetros

```tsx
function calcularVarianciaGols(
  jogos: Match[],
  medias: MediasLigaCalculadas
): { varCasa: number; varFora: number } {
  const N = jogos.length
  const varCasa = jogos.reduce(
    (s, j) => s + Math.pow(j.fthg - medias.muH, 2), 0
  ) / N
  const varFora = jogos.reduce(
    (s, j) => s + Math.pow(j.ftag - medias.muA, 2), 0
  ) / N
  return { varCasa, varFora }
}

interface ParametrosNB {
  r: number
  p: number
  fallbackParaPoisson: boolean
}

function estimarParametrosNB(
  lambda: number,
  variancia: number
): ParametrosNB {
  if (variancia <= lambda) {
    // Sem superdispersão — fallback para Poisson
    return { r: Infinity, p: 1, fallbackParaPoisson: true }
  }
  const p = lambda / variancia
  const r = (lambda * lambda) / (variancia - lambda)
  return { r, p, fallbackParaPoisson: false }
}
```

### 7.6 Pseudocódigo

```tsx
// Aproximação de Lanczos para log-gamma (r não-inteiro)
function logGamma(z: number): number {
  const g = 7
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ]
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z)
  }
  z -= 1
  let x = c[0]
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i)
  const t = z + g + 0.5
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x)
}

function nbPmf(x: number, r: number, p: number): number {
  // P(X = x) usando log-gama para estabilidade numérica
  const logCoef = logGamma(x + r) - logGamma(x + 1) - logGamma(r)
  const logProb = logCoef + x * Math.log(1 - p) + r * Math.log(p)
  return Math.exp(logProb)
}

function matrizPlacaresNB(
  lambdaH: number,
  lambdaA: number,
  varH: number,
  varA: number,
  max = 10
): { matriz: number[][]; warning: boolean } {
  const paramsH = estimarParametrosNB(lambdaH, varH)
  const paramsA = estimarParametrosNB(lambdaA, varA)
  const warning = paramsH.fallbackParaPoisson || paramsA.fallbackParaPoisson

  const matriz: number[][] = []
  for (let h = 0; h <= max; h++) {
    matriz[h] = []
    for (let a = 0; a <= max; a++) {
      const probH = paramsH.fallbackParaPoisson
        ? poissonPmf(lambdaH, h)
        : nbPmf(h, paramsH.r, paramsH.p)
      const probA = paramsA.fallbackParaPoisson
        ? poissonPmf(lambdaA, a)
        : nbPmf(a, paramsA.r, paramsA.p)
      matriz[h][a] = probH * probA
    }
  }
  return { matriz, warning }
}
```

### 7.7 Características

- ✅ Lida com superdispersão (variância > média)
- ✅ Fallback automático para Poisson quando não há superdispersão
- ✅ Decay temporal via forças ponderadas
- ⚠️ Assume independência entre os times
- ⚠️ τ(ρ) de Dixon-Coles **incompatível** — não aplicar

---

## 8. Cálculos Derivados

> Aplicam-se **identicamente** a qualquer matriz de placares (Modelos 1, 2, 3 ou 4).
A função `calcularMercados` recebe a matriz e não precisa saber qual modelo a gerou.
> 

### 8.1 Mercados 1X2

A partir da matriz de placares $$M[h][a]$$:

$$
P(\text{Casa}) = \sum_{h > a} M[h][a]
$$

$$
P(\text{Empate}) = \sum_{h = a} M[h][a]
$$

$$
P(\text{Fora}) = \sum_{h < a} M[h][a]
$$

### 8.2 Over/Under

$$
P(\text{Over } k) = \sum_{h+a > k} M[h][a]
$$

$$
P(\text{Under } k) = 1 - P(\text{Over } k)
$$

Linhas calculadas: 0.5, 1.5, 2.5, 3.5, 4.5

### 8.3 BTTS (Both Teams To Score)

$$
P(\text{BTTS Sim}) = \sum_{h \geq 1,\ a \geq 1} M[h][a]
$$

$$
P(\text{BTTS Não}) = 1 - P(\text{BTTS Sim})
$$

### 8.4 Handicap Asiático

Para linha $$L$$ (negativa = handicap pro mandante):

$$
P(\text{Casa AH } L) = \sum_{(h+L) > a} M[h][a] + 0.5 \cdot \sum_{(h+L) = a} M[h][a]
$$

Linhas calculadas: -2.5, -2.0, -1.5, -1.0, -0.5, 0, +0.5, +1.0, +1.5, +2.0, +2.5

### 8.5 Odd Justa

$$
\text{Odd Justa} = \frac{1}{P(\text{evento})}
$$

### 8.6 Expected Value (EV%)

$$
\text{EV\%} = \left(P(\text{evento}) \cdot \text{Odd Mercado} - 1\right) \times 100
$$

- EV > 0 → aposta de valor
- EV < 0 → aposta sem valor

### 8.7 Pseudocódigo dos Mercados

```tsx
interface MercadosCalculados {
  casa: number
  empate: number
  visit: number
  btts: number
  bttsNao: number
  over05: number
  over15: number
  over25: number
  over35: number
  over45: number
  under05: number
  under15: number
  under25: number
  under35: number
  under45: number
  goleadaCasa: number   // h ≥ 4 e diferença ≥ 3
  goleadaVis: number    // a ≥ 4 e diferença ≥ 3
}

/**
 * Calcula todos os mercados a partir de qualquer matriz 11×11.
 * Agnóstico ao modelo — funciona com Poisson, Dixon-Coles, ZIP ou NB.
 */
function calcularMercados(matriz: number[][]): MercadosCalculados {
  let casa = 0, empate = 0, visit = 0
  let btts = 0
  const overMap: Record<number, number> = { 0.5: 0, 1.5: 0, 2.5: 0, 3.5: 0, 4.5: 0 }
  let goleadaCasa = 0, goleadaVis = 0

  for (let h = 0; h < matriz.length; h++) {
    for (let a = 0; a < matriz[h].length; a++) {
      const p = matriz[h][a]
      // 1X2
      if (h > a) casa += p
      else if (h === a) empate += p
      else visit += p
      // BTTS
      if (h >= 1 && a >= 1) btts += p
      // Over
      const totalGols = h + a
      for (const linha of [0.5, 1.5, 2.5, 3.5, 4.5]) {
        if (totalGols > linha) overMap[linha] += p
      }
      // Goleada
      if (h >= 4 && (h - a) >= 3) goleadaCasa += p
      if (a >= 4 && (a - h) >= 3) goleadaVis += p
    }
  }

  return {
    casa, empate, visit,
    btts, bttsNao: 1 - btts,
    over05: overMap[0.5], over15: overMap[1.5],
    over25: overMap[2.5], over35: overMap[3.5], over45: overMap[4.5],
    under05: 1 - overMap[0.5], under15: 1 - overMap[1.5],
    under25: 1 - overMap[2.5], under35: 1 - overMap[3.5], under45: 1 - overMap[4.5],
    goleadaCasa, goleadaVis,
  }
}
```

---

## 9. Decisões de Calibração Aprovadas

| # | Tópico | Decisão | Justificativa |
| --- | --- | --- | --- |
| P1 | Cálculo de força | Separação por mando (A) | Padrão acadêmico, mais preciso |
| P2 | Modelos no painel | 4 modelos: Poisson, Dixon-Coles, ZIP, Binomial Negativa | Cobertura completa das limitações |
| P3 | τ de Dixon-Coles | Aplica-se **exclusivamente** sobre Poisson (Modelo 2) | Preservação das marginais exige P(1)=μ·P(0) |
| P4 | ρ Dixon-Coles | Estimativa empírica via grid search (A) | Suficiente para MVP, sem otimização numérica |
| P5 | ξ decay | Fixo 0.0065 em meias-semanas (A) | Valor otimizado no paper original, robusto |
| P6 | Decay aplicado em | Modelos 2, 3 e 4 (não no Modelo 1) | Modelo 1 = planilha legada; avançados = forma recente |
| P7 | Decay aplicado onde | Médias individuais (forças) — não nas médias da liga | Liga deve refletir a temporada inteira |
| P8 | π do ZIP | Global da liga (A) | Simples, estável com poucos jogos |
| P9 | Fallback NB | Alerta visual + fallback para Poisson (B) | Transparência ao usuário |
| P10 | MLE completo | Reservado para evolução futura | Grid search + médias por mando suficiente p/ v2.0 |
| P11 | Validação de ρ | Clamp automático nos limites matemáticos por confronto | Evita probabilidades negativas |

---

## 10. Amostra Mínima e Estabilidade de Parâmetros

### 10.1 Recomendações da Literatura

| Fonte | Recomendação |
| --- | --- |
| **Dixon & Coles (1997)** | Mínimo de 60 meias-semanas (~1 temporada) para parâmetros estáveis |
| **Constantinou (2021)** | 38 partidas por time para convergência de ratings; 5+ temporadas para priors robustos |
| **Buchdahl** | 6 primeiros jogos de cada time são "inelegíveis" para ratings estáveis; 250-500 apostas para validação estatística |

### 10.2 Limites Implementados no Sistema

| Regra | Limite | Comportamento |
| --- | --- | --- |
| Liga mínima | 20 jogos | Bloqueia todos os cálculos |
| Time mínimo | 5 jogos casa + 5 fora | Retorna `INSUFFICIENT_DATA` |
| Alerta de instabilidade | < 10 jogos casa ou < 10 fora | Warning visual: "Amostra pequena — resultados podem ser instáveis" |
| ρ instável | < 40 jogos na liga | Warning: "ρ estimado com amostra reduzida" |
| π instável | < 40 jogos na liga | Warning: "π estimado com amostra reduzida" |
| NB instável | < 30 jogos na liga | Warning: "variância pode ser não-representativa" |

### 10.3 Times Promovidos (Sem Histórico)

Estratégias documentadas na literatura para lidar com times novos na divisão:

| Estratégia | Fonte | Status no BigDataBet |
| --- | --- | --- |
| Carry-over de ratings da temporada anterior | Buchdahl | Fase 3+ |
| Taxa de aprendizado acelerada (3× λ nos primeiros 38 jogos) | Constantinou | Fase 3+ |
| Regressão à média (forçar forças = 1.0 nos primeiros jogos) | Padrão | **Implementado** — se < 5 jogos, bloqueia |
| Usar médias da divisão inferior como prior | Padrão acadêmico | Fase 3+ (requer dados multi-divisão) |

---

## 11. Validação e Métricas de Calibração

### 11.1 Métricas Recomendadas pela Literatura

| Métrica | Descrição | Threshold | Fonte |
| --- | --- | --- | --- |
| **P-valor (Teste t)** | Valida se lucro é habilidade ou sorte | < 0.01 (1%) | Buchdahl |
| **R²** | Consistência da tendência de lucro vs ruído | Próximo de 1.0 | Buchdahl |
| **RPS** (Rank Probability Score) | Precisão da distribuição 1X2 | < 0.200 | Constantinou |
| **Brier Score** | Acurácia de desfecho binário (AH) | < 0.250 | Constantinou |
| **Acurácia (Hit Rate)** | Proporção de vencedores previstos corretamente | 42-48% | Syrový |
| **ROI / Yield** | Retorno sobre investimento | > margem da casa | Todos |
| **CLV** (Closing Line Value) | Modelo bate as odds de fechamento? | Positivo | Buchdahl |

### 11.2 Validação Interna — Comparação entre os 4 Modelos

```tsx
interface ValidacaoModelo {
  modelo: 'poisson' | 'dixonColes' | 'zip' | 'binomialNegativa'
  jogosAvaliados: number
  rps: number          // média do RPS em todos os jogos
  brierScore: number   // média do Brier Score (1X2 como 3 binários)
  logLoss: number      // log-loss médio
  calibracao: {        // frequência real vs prevista por faixa
    faixa: string      // ex: "0.20-0.30"
    previsto: number   // média das probabilidades previstas
    observado: number  // frequência real de ocorrência
  }[]
}
```

### 11.3 Tamanho de Amostra para Validação

| Objetivo | Amostra mínima | Fonte |
| --- | --- | --- |
| Comparar modelos internamente | 100+ jogos | Padrão estatístico |
| Validar lucratividade | 250-500 apostas | Buchdahl |
| Provar habilidade com significância | 1.000+ apostas | Buchdahl |

---

## 12. Casos de Borda e Tratamento de Erros

### 12.1 Time sem jogos suficientes

Se um time tem **menos de 5 jogos** como mandante ou visitante:

- Retornar erro `INSUFFICIENT_DATA` na API
- Exibir mensagem na UI: "Time com poucos dados — previsão indisponível"

### 12.2 Lambda muito baixo ou muito alto

- Se $$\lambda < 0.1$$: usar 0.1 como mínimo (evita divisão por zero)
- Se $$\lambda > 5.0$$: emitir warning (suspeito) mas calcular normalmente

### 12.3 Time sem confronto direto

Não exigir histórico H2H direto. Os modelos usam apenas estatísticas individuais.

### 12.4 Importação parcial da temporada

Aceitar liga com mínimo de **20 jogos** para calcular médias. Abaixo disso, bloquear cálculos.

### 12.5 Soma da matriz ≠ 1

- **Poisson Simples e ZIP:** após truncamento em max=10, soma fica ~0.999.
Aceitar tolerância de 0.001. Se diferença > 0.01, logar warning.
- **Dixon-Coles:** normalização obrigatória após aplicar τ.
Se soma pré-normalização difere > 0.02, logar warning (ρ pode estar fora dos limites).
- **Binomial Negativa:** mesma tolerância do Poisson. Se houve fallback parcial
(um lado Poisson, outro NB), logar para auditoria.

### 12.6 ρ fora dos limites no confronto específico

O ρ é estimado com as médias da liga, mas aplicado com os λ do confronto específico.
Os limites de ρ dependem de λ_h e λ_a, que variam por confronto.

**Comportamento:** clamp automático para o limite mais próximo + log de warning.

### 12.7 ZIP com π = 0

Se π_h = 0 e π_a = 0, o modelo ZIP degenera em Poisson puro.
**Comportamento:** calcular normalmente (resultado será idêntico ao Modelo 1,
exceto pelo decay temporal nas forças). Não exibir warning — é comportamento esperado.

### 12.8 NB com fallback parcial

Se apenas um lado (casa ou fora) tem superdispersão e o outro não:
**Comportamento:** usar NB para o lado com superdispersão e Poisson para o outro.
Incluir flag `nbPartialFallback: true` na resposta da API.

---

## 13. Validação contra Ground Truth

### 13.1 Fonte da Verdade

Planilha `BRA1DASHv261.xlsx` (Brasileirão Série A — temporada 2026), abas:

- **DASH**: tabela dinâmica com médias por time e μ da liga
- **CS**: matriz Poisson 11×11 e cálculos de mercados
- **BDBRA1**: base de dados bruta com colunas FCAtC, FCDfC, FCAtV, FCDfV por time
- **MAPVAL**: ROI por faixa de odds (validação de fase posterior)

> **Importante:** O ground truth valida **apenas o Modelo 1 (Poisson Simples)**.
Os Modelos 2, 3 e 4 são evoluções que, por definição, produzem resultados
diferentes da planilha — serão validados por RPS e Brier Score contra
resultados reais, não contra a planilha.
> 

### 13.2 Ground Truth Confirmado — Brasileirão 2026

Constantes extraídas da planilha (117 jogos completos da temporada):

```tsx
export const GROUND_TRUTH_BRA1_2026 = {
  totalJogos: 117,
  muH: 1.57,        // μ_h liga (Média de FTHG)
  muA: 1.05,        // μ_a liga (Média de FTAG)
  dpFthg: 1.15,
  dpFtag: 0.95,
} as const
```

### 13.3 Tolerância de Diferença

| Tipo de cálculo | Tolerância | Aplica-se a |
| --- | --- | --- |
| Médias da liga (μ_h, μ_a) | < 0.01 absoluto | Todos os modelos |
| Médias individuais por time | < 0.05 absoluto | Modelo 1 apenas |
| Forças (FCAt, FCDf) | < 0.02 absoluto | Modelo 1 apenas |
| Lambdas | < 0.05 absoluto | Modelo 1 apenas |
| Probabilidades de placar individual | < 0.5% | Modelo 1 apenas |
| Mercados 1X2, O/U, BTTS | < 1.0% | Modelo 1 apenas |
| Soma total da matriz | 1.0 ± 0.001 | Todos os modelos |

### 13.4 Caso de Teste de Referência — Poisson Simples

Confronto padrão da aba CS da planilha:

```tsx
describe('Modelo 1 — Poisson — Athletico-PR vs Athletico-PR (CS padrão)', () => {
  const muH = 1.57
  const muA = 1.05

  // Forças do Athletico-PR (linha BDBRA1)
  const fcAtC = 1.24
  const fcDfC = 0.64
  const fcAtV = 0.80
  const fcDfV = 1.05

  test('lambdas calculados', () => {
    const lambdaH = fcAtC * fcDfV * muH   // 1.24 × 1.05 × 1.57
    const lambdaA = fcAtV * fcDfC * muA   // 0.80 × 0.64 × 1.05
    expect(lambdaH).toBeCloseTo(2.04, 1)
    expect(lambdaA).toBeCloseTo(0.54, 1)
  })

  test('matriz de placares — células-chave', () => {
    const matriz = matrizPlacaresPoisson(2.04, 0.54)
    expect(matriz[0][0]).toBeCloseTo(0.0725, 2)   // 7,25%
    expect(matriz[1][1]).toBeCloseTo(0.1199, 2)   // 11,99%
    expect(matriz[2][1]).toBeCloseTo(0.0943, 2)   //  9,43%
    expect(matriz[1][0]).toBeCloseTo(0.1140, 2)   // 11,40%
    expect(matriz[2][0]).toBeCloseTo(0.0897, 2)   //  8,97%
  })

  test('mercados derivados', () => {
    const matriz = matrizPlacaresPoisson(2.04, 0.54)
    const mercados = calcularMercados(matriz)
    expect(mercados.casa).toBeCloseTo(0.4942, 2)
    expect(mercados.empate).toBeCloseTo(0.2521, 2)
    expect(mercados.visit).toBeCloseTo(0.2537, 2)
    expect(mercados.btts).toBeCloseTo(0.5155, 2)
    expect(mercados.bttsNao).toBeCloseTo(0.4845, 2)
    expect(mercados.over05).toBeCloseTo(0.9275, 2)
    expect(mercados.over15).toBeCloseTo(0.7372, 2)
    expect(mercados.over25).toBeCloseTo(0.4876, 2)
    expect(mercados.over35).toBeCloseTo(0.2692, 2)
    expect(mercados.goleadaCasa).toBeCloseTo(0.0738, 2)
    expect(mercados.goleadaVis).toBeCloseTo(0.0209, 2)
  })
})
```

### 13.5 Casos de Teste Adicionais — Poisson Simples

```tsx
export const CASOS_GROUND_TRUTH = [
  {
    nome: 'Flamengo RJ vs Vasco',
    home: 'Flamengo RJ', away: 'Vasco',
    expected: { lambdaH: 1.93, lambdaA: 0.78 },
    mercados: { casa: 0.6447, empate: 0.2111, visit: 0.1441, btts: 0.4645, over25: 0.5104 },
  },
  {
    nome: 'Athletico-PR vs Grêmio',
    home: 'Athletico-PR', away: 'Gremio',
    expected: { lambdaH: 1.86, lambdaA: 0.64 },
    mercados: { casa: 0.6648, empate: 0.2135, visit: 0.1217, btts: 0.4002, over25: 0.4562 },
  },
  {
    nome: 'Cruzeiro vs Atlético-MG',
    home: 'Cruzeiro', away: 'Atletico-MG',
    expected: { lambdaH: 0.96, lambdaA: 0.81 },
    mercados: { casa: 0.3761, empate: 0.3301, visit: 0.2938, btts: 0.3443, over25: 0.2632 },
  },
  {
    nome: 'São Paulo vs Bahia',
    home: 'Sao Paulo', away: 'Bahia',
    expected: { lambdaH: 1.02, lambdaA: 0.79 },
    mercados: { casa: 0.3987, empate: 0.3248, visit: 0.2765, btts: 0.3493, over25: 0.2719 },
  },
  {
    nome: 'Chapecoense-SC vs Bragantino',
    home: 'Chapecoense-SC', away: 'Bragantino',
    expected: { lambdaH: 0.83, lambdaA: 1.33 },
    mercados: { casa: 0.2342, empate: 0.2821, visit: 0.4837, btts: 0.4162, over25: 0.3680 },
  },
] as const
```

### 13.6 Caso de Teste — Dixon-Coles (validação estrutural)

> Sem ground truth na planilha. Valida propriedades matemáticas, não valores absolutos.
> 

```tsx
describe('Modelo 2 — Dixon-Coles — validação estrutural', () => {
  const lambdaH = 2.04
  const lambdaA = 0.54
  const rho = -0.05

  test('τ preserva marginais de Poisson', () => {
    const matrizDC = matrizPlacaresDixonColes(lambdaH, lambdaA, rho)
    const matrizPoisson = matrizPlacaresPoisson(lambdaH, lambdaA)

    // Marginal do mandante: soma das linhas deve ≈ Poisson(λ_h)
    for (let h = 0; h <= 5; h++) {
      const marginalDC = matrizDC[h].reduce((s, v) => s + v, 0)
      const marginalPoisson = matrizPoisson[h].reduce((s, v) => s + v, 0)
      expect(marginalDC).toBeCloseTo(marginalPoisson, 2)
    }

    // Marginal do visitante: soma das colunas deve ≈ Poisson(λ_a)
    for (let a = 0; a <= 5; a++) {
      const marginalDC = matrizDC.reduce((s, linha) => s + linha[a], 0)
      const marginalPoisson = matrizPoisson.reduce((s, linha) => s + linha[a], 0)
      expect(marginalDC).toBeCloseTo(marginalPoisson, 2)
    }
  })

  test('soma da matriz normalizada = 1', () => {
    const matriz = matrizPlacaresDixonColes(lambdaH, lambdaA, rho)
    const soma = matriz.flat().reduce((s, v) => s + v, 0)
    expect(soma).toBeCloseTo(1.0, 3)
  })

  test('ρ negativo → P(0×0) e P(1×1) aumentam vs Poisson', () => {
    const matrizDC = matrizPlacaresDixonColes(lambdaH, lambdaA, rho)
    const matrizP = matrizPlacaresPoisson(lambdaH, lambdaA)
    expect(matrizDC[0][0]).toBeGreaterThan(matrizP[0][0])
    expect(matrizDC[1][1]).toBeGreaterThan(matrizP[1][1])
  })

  test('ρ = 0 → resultado idêntico ao Poisson', () => {
    const matrizDC = matrizPlacaresDixonColes(lambdaH, lambdaA, 0)
    const matrizP = matrizPlacaresPoisson(lambdaH, lambdaA)
    for (let h = 0; h <= 10; h++) {
      for (let a = 0; a <= 10; a++) {
        expect(matrizDC[h][a]).toBeCloseTo(matrizP[h][a], 6)
      }
    }
  })

  test('limites de ρ são respeitados', () => {
    expect(validarRho(-0.49, lambdaH, lambdaA)).toBe(true)
    expect(validarRho(-0.50, lambdaH, lambdaA)).toBe(false)
    expect(validarRho(0.90, lambdaH, lambdaA)).toBe(true)
    expect(validarRho(0.95, lambdaH, lambdaA)).toBe(false)
  })
})
```

### 13.7 Caso de Teste — ZIP (validação estrutural)

```tsx
describe('Modelo 3 — ZIP — validação estrutural', () => {
  const lambdaH = 1.57
  const lambdaA = 1.05
  const piH = 0.05
  const piA = 0.03

  test('P(0) do ZIP > P(0) do Poisson quando π > 0', () => {
    expect(zipPmf(lambdaH, 0, piH)).toBeGreaterThan(poissonPmf(lambdaH, 0))
    expect(zipPmf(lambdaA, 0, piA)).toBeGreaterThan(poissonPmf(lambdaA, 0))
  })

  test('P(x) do ZIP < P(x) do Poisson para x ≥ 1 quando π > 0', () => {
    for (let x = 1; x <= 5; x++) {
      expect(zipPmf(lambdaH, x, piH)).toBeLessThan(poissonPmf(lambdaH, x))
    }
  })

  test('soma da PMF = 1', () => {
    let soma = 0
    for (let x = 0; x <= 20; x++) soma += zipPmf(lambdaH, x, piH)
    expect(soma).toBeCloseTo(1.0, 4)
  })

  test('π = 0 → resultado idêntico ao Poisson', () => {
    const matrizZIP = matrizPlacaresZIP(lambdaH, lambdaA, 0, 0)
    const matrizP = matrizPlacaresPoisson(lambdaH, lambdaA)
    for (let h = 0; h <= 10; h++) {
      for (let a = 0; a <= 10; a++) {
        expect(matrizZIP[h][a]).toBeCloseTo(matrizP[h][a], 6)
      }
    }
  })
})
```

### 13.8 Caso de Teste — Binomial Negativa (validação estrutural)

```tsx
describe('Modelo 4 — Binomial Negativa — validação estrutural', () => {
  const lambda = 1.57
  const varComSuperdispersao = 2.50  // σ² > λ
  const varSemSuperdispersao = 1.20  // σ² < λ

  test('fallback para Poisson quando σ² ≤ λ', () => {
    const params = estimarParametrosNB(lambda, varSemSuperdispersao)
    expect(params.fallbackParaPoisson).toBe(true)
  })

  test('NB ativada quando σ² > λ', () => {
    const params = estimarParametrosNB(lambda, varComSuperdispersao)
    expect(params.fallbackParaPoisson).toBe(false)
    expect(params.r).toBeGreaterThan(0)
    expect(params.p).toBeGreaterThan(0)
    expect(params.p).toBeLessThan(1)
  })

  test('NB tem mais massa nas caudas que Poisson', () => {
    const params = estimarParametrosNB(lambda, varComSuperdispersao)
    // Probabilidade de 5+ gols deve ser maior na NB
    let caudaNB = 0, caudaPoisson = 0
    for (let x = 5; x <= 10; x++) {
      caudaNB += nbPmf(x, params.r, params.p)
      caudaPoisson += poissonPmf(lambda, x)
    }
    expect(caudaNB).toBeGreaterThan(caudaPoisson)
  })

  test('média da NB ≈ λ', () => {
    const params = estimarParametrosNB(lambda, varComSuperdispersao)
    // Média da NB = r(1-p)/p
    const mediaNB = params.r * (1 - params.p) / params.p
    expect(mediaNB).toBeCloseTo(lambda, 2)
  })

  test('soma da PMF = 1', () => {
    const params = estimarParametrosNB(lambda, varComSuperdispersao)
    let soma = 0
    for (let x = 0; x <= 30; x++) soma += nbPmf(x, params.r, params.p)
    expect(soma).toBeCloseTo(1.0, 3)
  })
})
```

---

## 14. Limitações Conhecidas

### 14.1 Limitações do Modelo 1 (Poisson Simples)

| Limitação | Impacto | Mitigação |
| --- | --- | --- |
| Independência entre gols | Subestima 0×0 e 1×1 | Usar Modelo 2 |
| Variância = média | Não captura superdispersão | Usar Modelo 4 |
| Sem forma recente | Todos os jogos pesam igual | Usar Modelos 2, 3 ou 4 |
| Apenas gols como proxy | Ignora processo do jogo | Fase 5+ (xG) |

### 14.2 Limitações do Modelo 2 (Dixon-Coles)

| Limitação | Impacto | Fonte |
| --- | --- | --- |
| Variáveis externas ignoradas | Contratações, técnicos, lesões | Dixon & Coles (1997) |
| Decay "simplista" | Assume parâmetros localmente constantes | Dixon & Coles (1997) |
| Dependência só em placares baixos | Placares > 1 gol tratados como independentes | Dixon & Coles (1997) |
| ρ estimado com médias da liga | Aplica-se igualmente a todos os confrontos | Limitação do grid search |
| Subestima outliers | Placar 0×3 reportado como subestimado | Dixon & Coles (1997) |
| Times promovidos | Sem histórico = ratings "ignorantes" | Constantinou (2021) |

### 14.3 Limitações do Modelo 3 (ZIP)

| Limitação | Impacto |
| --- | --- |
| Não validado na literatura esportiva | Nenhum paper referência usa ZIP para futebol |
| Assume independência | Mesma limitação do Poisson |
| π global da liga | Não captura times específicos mais defensivos |
| τ incompatível | Não se beneficia da correção de placares baixos |

### 14.4 Limitações do Modelo 4 (Binomial Negativa)

| Limitação | Impacto |
| --- | --- |
| Assume independência | Mesma limitação do Poisson |
| Variância global da liga | Não captura variabilidade por time |
| τ incompatível | Não se beneficia da correção de placares baixos |
| Reep et al. (1971) | Não encontrou melhoria prática na previsão de desfechos vs Poisson |

### 14.5 Limitações Estruturais (todos os modelos)

| Limitação | Descrição |
| --- | --- |
| Baseado apenas em gols | xG seria mais estável como input (Constantinou reduz erro de ~2.6 para ~1.5) |
| Sem informação de mercado | Odds de abertura carregam informação que o modelo ignora |
| Sem variáveis contextuais | Importância do jogo, descanso entre partidas, desfalques |

---

## 15. Roadmap de Evolução (Fase 3+)

| Prioridade | Evolução | Impacto | Esforço | Fase |
| --- | --- | --- | --- | --- |
| 🟢 1 | 4 modelos no painel (Poisson, DC, ZIP, NB) | Alto | Médio | **2 (atual)** |
| 🟡 2 | Backtest comparativo entre os 4 modelos | Alto | Médio | 3 |
| 🟡 3 | MLE completo para Dixon-Coles (α, β, ρ, γ) | Médio | Alto | 3 |
| 🟡 4 | Re-derivação de τ para ZIP e BN | Médio | Alto | 3 |
| 🟡 5 | π e variância por time (não só liga) | Médio | Médio | 3 |
| 🔵 6 | xG como input (quando disponível) | Alto | Alto | 5 |
| 🔵 7 | Ensemble de modelos (média ponderada) | Alto | Alto | 5 |
| 🔵 8 | Atualização estocástica de parâmetros | Médio | Alto | 5 |

---

## 16. Diferenças entre a Planilha Legada e o Sistema Novo

A planilha `BRA1DASHv261.xlsx` é o ground truth para o **Modelo 1 (Poisson Simples)**.
Os Modelos 2, 3 e 4 são evoluções deliberadas — não devem replicar comportamento da planilha.

| Aspecto | Planilha Legada | Sistema Big Data Bet (novo) |
| --- | --- | --- |
| **Modelo Poisson** | ✅ Implementado | ✅ Modelo 1 — replica 100% (ground truth) |
| **Dixon-Coles** | ❌ Não tem | ✅ Modelo 2 — calibração τ(ρ) + decay |
| **ZIP** | ❌ Não tem | ✅ Modelo 3 — inflação de zeros + decay |
| **Binomial Negativa** | ❌ Não tem | ✅ Modelo 4 — superdispersão + decay |
| **Decay temporal** | ❌ Todos jogos pesam igual | ✅ Modelos 2, 3 e 4 (ξ = 0.0065) |
| **Correção τ(ρ)** | ❌ Não tem | ✅ Modelo 2 exclusivamente |
| **Validação de amostra mínima** | ❌ Calcula com qualquer N | ✅ Bloqueia se time tem < 5 jogos casa/fora |
| **Validação de liga** | ❌ Calcula com qualquer total | ✅ Bloqueia se liga tem < 20 jogos |
| **Filtros de odd no DASH** | ✅ Afeta visualização | ✅ Afeta visualização (mas não o modelo) |
| **Goleada Casa/Visit** | ✅ h≥4 e diferença ≥3 | ✅ Mesma definição |
| **Tratamento de #N/A** | ⚠️ Mostra `#N/A` na célula | ✅ Retorna erro `INSUFFICIENT_DATA` na API |

### 16.1 O que os Modelos Avançados melhoram sobre a planilha

| Problema da planilha | Modelo que corrige | Como |
| --- | --- | --- |
| Subestima 0×0 e 1×1 | Modelo 2 (DC) | τ(ρ) corrige placares baixos |
| Todos os jogos pesam igual | Modelos 2, 3, 4 | Decay temporal prioriza forma recente |
| Excesso de zeros em ligas defensivas | Modelo 3 (ZIP) | π modela zeros estruturais |
| Variância rígida (σ² = λ) | Modelo 4 (NB) | Parâmetro r permite σ² > λ |

### 16.2 Recomendação ao Usuário (UI)

No painel da ferramenta:

- **Dropdown:** "Modelo: Poisson Simples | Poisson Dixon-Coles | ZIP | Binomial Negativa"
- **Default:** Poisson Simples
- **Badges:** `Default` (verde) e `Avançado` (roxo)
- **Quando Dixon-Coles selecionado:** destacar na matriz as 4 células que mudam
(0×0, 1×0, 0×1, 1×1) com borda/cor diferente
- **Quando ZIP selecionado:** destacar coluna 0 e linha 0 da matriz
- **Quando NB selecionado:** exibir banner amarelo se houve fallback para Poisson
- **Info (todos avançados):** ao trocar, exibir tooltip explicando a diferença
em relação ao modelo simples

### 16.3 Tooltips por Modelo

| Modelo | Tooltip |
| --- | --- |
| Poisson Simples | "Modelo clássico de previsão de placares. Compatível com a planilha BDB. Todos os jogos da temporada pesam igual." |
| Poisson Dixon-Coles | "Corrige placares baixos (0×0, 1×0, 0×1, 1×1) e prioriza jogos recentes. Mais preciso em jogos equilibrados." |
| ZIP | "Modela o excesso de jogos sem gols em ligas defensivas. Prioriza jogos recentes." |
| Binomial Negativa | "Lida melhor com ligas de alta variabilidade de gols (goleadas frequentes). Prioriza jogos recentes." |

---

> **Regra para o agente:** Implementar exatamente conforme especificado neste
documento. Qualquer ambiguidade ou divergência com o ground truth deve ser
**reportada antes de seguir** — nunca "ajustar a olho".
>

---

## 17. Seleção Automática de Modelos (Modo AUTO)

O painel BDB possui um modo `AUTO` que escolhe o melhor modelo para o confronto em vez de exigir que o usuário conheça as nuances estatísticas de cada um. A seleção é fundamentada no **Critério de Informação de Akaike (AIC)** com penalizações dinâmicas e heurísticas.

### 17.1 Log-Verossimilhança (Log-Likelihood)

Para cada modelo, calculamos a verossimilhança de prever o histórico passado (os mesmos jogos que geraram as médias).
Para evitar estouros com $log(0)$, garantimos um piso mínimo de probabilidade (`1e-10`).

$$
LL = \sum_{i=1}^{N} \log P_{modelo}(x_i, y_i)
$$

### 17.2 AIC — Akaike Information Criterion

O AIC balanceia a acurácia (Log-Likelihood) com a complexidade do modelo (parâmetros extras que podem causar overfitting):

$$
AIC = -2 \cdot LL + 2 \cdot k
$$

O número de parâmetros livres ($k$) varia:
- **Poisson:** $k=2$ (λ_h, λ_a)
- **Dixon-Coles:** $k=3$ (Poisson + ρ)
- **ZIP:** $k=4$ (Poisson + π_h + π_a)
- **Binomial Negativa:** $k=4$ (Poisson + r_h + r_a)

**Ajuste Dinâmico de $k$ na Binomial Negativa:**
Se a Binomial Negativa realizar fallback parcial (apenas um lado usa Poisson devido a ausência de superdispersão), o número de parâmetros é penalizado justamente ($k=3$). Se for fallback total, a NB compete como Poisson puro ($k=2$).

### 17.3 Regimes de Amostra e Sinais de Triagem

Para proteger o seletor contra ruído amostral e falsos diagnósticos, o modo `AUTO` segmenta a decisão em três regimes distintos baseados no volume total de jogos da liga ($N$):

1. **Regime `FALLBACK` ($N < 10$):**
   - O diagnóstico de dispersão e a triagem são desativados.
   - O seletor força a escolha de **Dixon-Coles** como modelo robusto base com a flag `selecaoAutomatica: false` exposta na API.
   - Os sinais de triagem são reportados como `INDETERMINADO`.

2. **Regime `AIC_PURO` ($10 \le N < 140$):**
   - A triagem ativa é desativada para evitar instabilidade. Os sinais de triagem retornam como `INDETERMINADO`.
   - A seleção é feita puramente com base no AIC bruto. Em caso de empate ($\Delta AIC < 2.0$), resolve-se pela ordem de robustez padrão: $\text{DIXON\_COLES} > \text{POISSON} > \text{ZIP} > \text{NB}$.
   - Nenhum boost ou reordenação por sinais é aplicado.

3. **Regime `COMPLETO` ($N \ge 140$):**
   - Triagem ativa é executada calculando os sinais `zip` e `dc` para a liga.
   - **Sinal ZIP ($R_{zero}$):** Avalia os zeros marginais (gols marcados = 0 por time por jogo), calculando a razão:
     $$R_{zero} = \frac{P_{obs}(g=0)}{e^{-\mu}}$$
     onde $\mu$ é a média de gols da liga por time/jogo. A classificação é:
     - `zip === 'FORTE'` se $R_{zero} > 1.25$
     - `zip === 'LEVE'` se $R_{zero} > 1.10$
     - `zip === 'AUSENTE'` caso contrário.
   - **Sinal Dixon-Coles ($D_{baixos}$):** Mede a distorção absoluta de probabilidade acumulada nas 4 células baixas ($0\times0$, $1\times0$, $0\times1$, $1\times1$) comparando as frequências observadas da liga contra a Poisson simples:
     $$D_{baixos} = \sum_{(i,j)\in\{0,1\}^2}\left|P_{obs}(i,j)-P_{poisson}(i,j)\right|$$
     onde $P_{poisson}(i,j)$ usa a média de gols da liga $\mu_h^{liga}$ e $\mu_a^{liga}$. O sinal indica `dc === 'INDICADO'` se $D_{baixos} > 0.04$ combinando com correlação empírica relevante ($|\rho| \ge 0.05$); caso contrário, retorna `dc === 'AUSENTE'`.

#### Classificação de Dispersão (UNDER / NORMAL / OVER)

Índice de dispersão: $D = s^2/\bar{x}$ (gols marginais agregados, 2 obs por jogo).
Sob Poisson, $E[D] = 1$ e $(N-1)\cdot D \sim \chi^2(N-1)$.

Banda de normalidade ($\pm 2\cdot\text{SE}$, $\text{SE} \approx \sqrt{2/(N-1)}$):
    NORMAL  ⟺  1 - 2·sqrt(2/(N-1)) ≤ D ≤ 1 + 2·sqrt(2/(N-1))
    UNDER   ⟺  D < limite inferior
    OVER    ⟺  D > limite superior

| N_obs | NORMAL (banda) | UNDER se | OVER se |
|-------|----------------|----------|---------|
| 200   | 0.80 – 1.20    | < 0.80   | > 1.20  |
| 400   | 0.86 – 1.14    | < 0.86   | > 1.14  |
| 760   | 0.90 – 1.10    | < 0.90   | > 1.10  |

Nota de domínio: gols de futebol são tipicamente levemente over-dispersos
(D real entre 1.05 e 1.30). UNDER genuíno é raro; com N grande, investigar
filtro de dados ou liga atípica antes de confiar no sinal.

### 17.4 Soberania do AIC, Ordem de Robustez e Desempate (Burnham & Anderson)

O modelo com menor AIC bruto é o candidato a líder. Para manter a soberania estatística do AIC e evitar distorções, **não há boost (subtração direta) no AIC bruto**. Os sinais de triagem atuam EXCLUSIVAMENTE como desempate se os modelos estiverem na janela de equivalência estatística ($\Delta AIC < 2.0$). Fora desta janela, o modelo com menor AIC vence.

Se múltiplos modelos caírem dentro de $\Delta AIC < 2.0$ em relação ao líder do AIC, a prioridade de reordenação é definida deterministicamente em conformidade com o regime e o diagnóstico condicional de dispersão dos gols:

* **Em regime `COMPLETO` com diagnóstico condicional `'OVER'` (superdispersão):**
  * Se o sinal de triagem `zip === 'FORTE'`:
    $$\text{ZIP} > \text{NB} > \text{DIXON\_COLES} > \text{POISSON}$$
  * Caso contrário:
    $$\text{NB} > \text{ZIP} > \text{DIXON\_COLES} > \text{POISSON}$$

* **Em regime `COMPLETO` com diagnóstico condicional `'UNDER'` (sub-dispersão) ou `'POISSON'` (neutro / undefined):**
  * Se o sinal de triagem `dc === 'INDICADO'`:
    $$\text{DIXON\_COLES} > \text{POISSON} > \text{ZIP} > \text{NB}$$
  * Caso contrário:
    $$\text{POISSON} > \text{DIXON\_COLES} > \text{ZIP} > \text{NB}$$

* **Regime `AIC_PURO` ou `FALLBACK` (ou qualquer outro caso genérico):**
  * Usa a ordem fixa de robustez padrão:
    $$\text{POISSON} > \text{DIXON\_COLES} > \text{ZIP} > \text{NB}$$

> **Decisão sobre Sub-Dispersão (COM-Poisson):**
> O modelo Conway-Maxwell-Poisson (COM-Poisson) foi avaliado para mitigar sob/sub-dispersão gerais. Contudo, foi formalmente descartado devido à alta complexidade de cálculo em tempo real e retorno estatístico muito baixo (ROI estatístico irrelevante para futebol, onde a sub-dispersão é fraca e rara). Nos raros cenários de sub-dispersão, o sistema adota os aproximadores conservadores robustos **Dixon-Coles** e **Poisson Simples** conforme as prioridades acima.

A classificação de confiança final é computada comparando o AIC do modelo vencedor com o segundo colocado pós-desempate:
- **Alta:** $\Delta AIC > 4.0$
- **Média:** $2.0 < \Delta AIC \leq 4.0$
- **Baixa:** $\Delta AIC \leq 2.0$

---

## 18. Anexo: Ferramentas Independentes

### 18.1 Over/Under 2.5 (Market Analyzer)
A ferramenta analítica **Over/Under 2.5** opera de forma modular, recebendo as odds reais da casa de apostas para a linha `2.50` (eixo de referência) e extraindo a probabilidade justa implícita.

**Metodologia:**
1. **Extração de $\lambda$:** Utiliza o método matemático de **Bisecção** (`encontrarLambdaIterativo`) para encontrar o parâmetro Poisson ($\lambda$) que gera exatamente a proporção Justa de probabilidade na linha de 2.50 gols.
2. **Projeção Base:** Utiliza as funções PMF e CDF de Poisson puras para calcular as probabilidades *fair* em todas as linhas asiáticas (de 1.50 a 3.75, em degraus de 0.25).
3. **Overdispersion e Ajuste Empírico:**
   As casas asiáticas dilatam as probabilidades das "zebras" nos limites marginais da curva para conter riscos de assimetria. Para espelhar este comportamento nativo de *superdispersão* sem migrar a ferramenta para a pesada Binomial Negativa, aplica-se o **Fator Empírico de Achatamento**:
   $$
   P_{ajustada}(U) = P_{poisson}(U) + [-0.009 \cdot (\text{Linha} - 2.50)]
   $$
   Este ajuste transfere precisamente $0.9\%$ de probabilidade de ocorrência para cada gol de distância da âncora `2.50`.
4. **Juice (Margem):** O motor extrai o "Overround" da referência 2.50 e aplica *Proportional Distribution*, inflando o *juice* da casa com um delta de $+0.25\%$ estático por cada degrau distante da linha de maior probabilidade (~50/50), suportando inclusive *juice* teórico negativo nas extremidades para possibilitar o *clamping* de odd em `1.01`.