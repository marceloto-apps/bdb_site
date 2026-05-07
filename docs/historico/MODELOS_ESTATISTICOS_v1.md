# MODELOS_ESTATISTICOS

# MODELOS ESTATÍSTICOS — Big Data Bet

> **Versão:** 1.1 | **Atualizado:** 02/05/2026
> **Mudanças desde v1.0:**
> - Notação alinhada com a planilha legada (FCAtC, FCDfC, FCAtV, FCDfV)
> - Seção 2 reescrita com algoritmo da planilha BRA1DASHv261.xlsx
> - Seção 10 substituída por ground truth real do Brasileirão 2026
> - Adicionada seção 11 documentando evoluções vs planilha legada
**Referência para:** Fase 2 — Engine de Cálculo Estatístico (`lib/analytics/`)
**Validação:** Toda implementação deve bater com `BRA1DASHv261.xlsx` (ground truth) com diferença < 0.5%
> 

---

## Sumário

1. [Notação e Conceitos Comuns](https://www.notion.so/MODELOS_ESTATISTICOS-35445372e262804e99aff89e90b62476?pvs=21)
2. [Cálculo de Forças (Base de Todos os Modelos)](https://www.notion.so/MODELOS_ESTATISTICOS-35445372e262804e99aff89e90b62476?pvs=21)
3. [Modelo 1 — Poisson Padrão](https://www.notion.so/MODELOS_ESTATISTICOS-35445372e262804e99aff89e90b62476?pvs=21)
4. [Modelo 2 — Poisson Zero-Inflacionado (ZIP)](https://www.notion.so/MODELOS_ESTATISTICOS-35445372e262804e99aff89e90b62476?pvs=21)
5. [Modelo 3 — Binomial Negativa](https://www.notion.so/MODELOS_ESTATISTICOS-35445372e262804e99aff89e90b62476?pvs=21)
6. [Modelo 4 — Dixon-Coles](https://www.notion.so/MODELOS_ESTATISTICOS-35445372e262804e99aff89e90b62476?pvs=21)
7. [Cálculos Derivados (Mercados, Odds Justas, EV)](https://www.notion.so/MODELOS_ESTATISTICOS-35445372e262804e99aff89e90b62476?pvs=21)
8. [Decisões de Calibração Aprovadas](https://www.notion.so/MODELOS_ESTATISTICOS-35445372e262804e99aff89e90b62476?pvs=21)
9. [Casos de Borda e Tratamento de Erros](https://www.notion.so/MODELOS_ESTATISTICOS-35445372e262804e99aff89e90b62476?pvs=21)
10. [Validação contra Ground Truth](https://www.notion.so/MODELOS_ESTATISTICOS-35445372e262804e99aff89e90b62476?pvs=21)

---

## 1. Notação e Conceitos Comuns

### Variáveis

| Símbolo | Significado |
| --- | --- |
| $$\lambda_h$$ | Gols esperados do mandante no confronto |
| $$\lambda_a$$ | Gols esperados do visitante no confronto |
| `FCAtC[T]` | Força ofensiva do time T como mandante |
| `FCDfC[T]` | Força defensiva do time T como mandante |
| `FCAtV[T]` | Força ofensiva do time T como visitante |
| `FCDfV[T]` | Força defensiva do time T como visitante |
| `MGC[T]` | Média de gols marcados pelo time T quando mandante |
| `MGV[T]` | Média de gols marcados pelo time T quando visitante |
| `MGSC[T]` | Média de gols sofridos pelo time T quando mandante |
| `MGSV[T]` | Média de gols sofridos pelo time T quando visitante |
| $$\gamma$$ | Vantagem de mando (home advantage) — embutida na separação por mando |
| $$\mu_h^{liga}$$ | Média de gols do mandante na liga |
| $$\mu_a^{liga}$$ | Média de gols do visitante na liga |
| $$\rho$$ | Parâmetro tau do Dixon-Coles |
| $$\xi$$ | Decaimento temporal do Dixon-Coles |
| $$\pi$$ | Inflação de zeros do ZIP |

> **Nota:** a notação foi alinhada com as colunas da planilha BDBRA1 (BRA1DASHv261.xlsx) para facilitar manutenção e validação contra o ground truth.

### Convenções de Implementação

- Todas as funções recebem `lambda` em `number` (não `bigint`)
- Limite máximo de gols na matriz: `10` (grid 11x11, índices 0..10)
- Probabilidades sempre normalizadas: $$\\sum P(x,y) \\approx 1.0$$ (tolerância 0.001)
- Funções puras (sem side effects) — facilita testes unitários
- Arredondamento apenas na exibição final, nunca durante cálculos intermediários

---

## 2. Cálculo de Forças (Base de Todos os Modelos)

### 2.1 Médias da Liga

Calculadas uma única vez por temporada/liga, usando TODOS os jogos da liga (sem filtros):

$$
\mu_h^{liga} = \frac{\sum \text{FTHG}}{\text{total de jogos}}
$$

$$
\mu_a^{liga} = \frac{\sum \text{FTAG}}{\text{total de jogos}}
$$

### 2.2 Médias Individuais por Time (separadas por mando)

Para cada time T da liga, calcular 4 médias usando TODOS os jogos da temporada do time:

$$
\text{MGC}[T] = \text{média de gols marcados por } T \text{ em jogos como mandante}
$$

$$
\text{MGSC}[T] = \text{média de gols sofridos por } T \text{ em jogos como mandante}
$$

$$
\text{MGV}[T] = \text{média de gols marcados por } T \text{ em jogos como visitante}
$$

$$
\text{MGSV}[T] = \text{média de gols sofridos por } T \text{ em jogos como visitante}
$$

### 2.3 Forças Individuais

A força é a razão entre o desempenho do time e o desempenho médio da liga:

$$
\text{FCAtC}[T] = \frac{\text{MGC}[T]}{\mu_h^{liga}}
$$

$$
\text{FCDfC}[T] = \frac{\text{MGSC}[T]}{\mu_a^{liga}}
$$

$$
\text{FCAtV}[T] = \frac{\text{MGV}[T]}{\mu_a^{liga}}
$$

$$
\text{FCDfV}[T] = \frac{\text{MGSV}[T]}{\mu_h^{liga}}
$$

> **Interpretação:**
> - FCAtC > 1 → time marca mais gols em casa do que a média da liga
> - FCDfC < 1 → time sofre menos gols em casa do que a média da liga
> - Times equilibrados têm forças próximas de 1,0

### 2.4 Lambdas do Confronto (Home vs Away)

$$
\lambda_h = \text{FCAtC}[\text{Home}] \cdot \text{FCDfV}[\text{Away}] \cdot \mu_h^{liga}
$$

$$
\lambda_a = \text{FCAtV}[\text{Away}] \cdot \text{FCDfC}[\text{Home}] \cdot \mu_a^{liga}
$$

> **Nota importante:** A vantagem de mando (home advantage) está **embutida na separação por mando**. Não multiplicar parâmetro \gamma separadamente.

### 2.5 Pseudocódigo

```typescript
interface MediasLigaCalculadas {
  muH: number   // \mu_h^liga
  muA: number   // \mu_a^liga
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
 * Calcula \mu_h e \mu_a usando TODOS os jogos da liga.
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
 * Calcula as 4 médias individuais do time.
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

---

## 3. Modelo 1 — Poisson Padrão

### 3.1 Fórmula

$$
P(X = x) = \frac{e^{-\lambda} \lambda^x}{x!}
$$

Probabilidade do placar exato (assume independência):

$$
P(H = x, A = y) = P(X_h = x) \cdot P(X_a = y)
$$

### 3.2 Pseudocódigo

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

### 3.3 Características

- ✅ Simples, rápido, ground truth da BDB
- ⚠️ Subestima placares 0x0 e 1x1
- ⚠️ Assume independência entre os times (limitação conhecida)

---

## 4. Modelo 2 — Poisson Zero-Inflacionado (ZIP)

### 4.1 Fórmula

$$
P(X = 0) = \pi + (1 - \pi) \cdot e^{-\lambda}
$$

$$
P(X = x) = (1 - \pi) \cdot \frac{e^{-\lambda} \lambda^x}{x!}, \quad x \geq 1
$$

### 4.2 Estimação de π (DECISÃO APROVADA: Global da liga — opção A)

Calcula-se um único $$\pi$$ por liga/temporada, separadamente para casa e visitante:

$$
\pi_h = \max\left(0,\ \frac{\#\{j : \text{FTHG}_j = 0\}}{N} - e^{-\mu_h^{liga}}\right)
$$

$$
\pi_a = \max\left(0,\ \frac{\#\{j : \text{FTAG}_j = 0\}}{N} - e^{-\mu_a^{liga}}\right)
$$

### 4.3 Pseudocódigo

```tsx
function estimarPiLiga(
  jogos: Match[],
  medias: MediasLigaCalculadas
): { piH: number; piA: number } {
  const N = jogos.length

  // Frequência observada de zero gols
  const freqZeroCasa = jogos.filter(j => j.fthg === 0).length / N
  const freqZeroFora = jogos.filter(j => j.ftag === 0).length / N

  // Frequência prevista por Poisson
  const probZeroPoissonCasa = Math.exp(-medias.mediaGolsCasa)
  const probZeroPoissonFora = Math.exp(-medias.mediaGolsVis)

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

### 4.4 Características

- ✅ Corrige excesso de 0x0 em ligas defensivas
- ✅ Estimação simples, sem otimização numérica
- ⚠️ Assume independência (igual Poisson)

---

## 5. Modelo 3 — Binomial Negativa

### 5.1 Fórmula

$$
P(X = x) = \binom{x + r - 1}{x} (1-p)^x p^r
$$

Relações:

$$
\lambda = \frac{r(1-p)}{p}, \quad \sigma^2 = \frac{r(1-p)}{p^2}
$$

Resolvendo para $$r$$ e $$p$$ a partir de $$\lambda$$ e $$\sigma^2$$:

$$
p = \frac{\lambda}{\sigma^2}, \quad r = \frac{\lambda^2}{\sigma^2 - \lambda}
$$

### 5.2 Tratamento de Variância ≤ Média (DECISÃO APROVADA: Alerta visual — opção B)

Quando $$\sigma^2 \leq \lambda$$, a NB **não é apropriada** (degeneraria em Poisson com $$r \to \infty$$).

**Comportamento:**

1. Internamente: fazer fallback automático para Poisson padrão
2. Na resposta da API: incluir flag `nbWarning: true` com mensagem
3. Na UI: exibir banner amarelo:
    
    > ⚠️ A Binomial Negativa não é estatisticamente adequada para esta liga (sem superdispersão). Resultados exibidos são equivalentes a Poisson padrão. Considere usar outro modelo.
    > 

### 5.3 Pseudocódigo

```tsx
function calcularVarianciaGols(
  jogos: Match[],
  medias: MediasLigaCalculadas
): { varCasa: number; varFora: number } {
  const N = jogos.length
  const varCasa = jogos.reduce(
    (s, j) => s + Math.pow(j.fthg - medias.mediaGolsCasa, 2), 0
  ) / N
  const varFora = jogos.reduce(
    (s, j) => s + Math.pow(j.ftag - medias.mediaGolsVis, 2), 0
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
    // Sem superdispersão — fallback
    return { r: Infinity, p: 1, fallbackParaPoisson: true }
  }
  const p = lambda / variancia
  const r = (lambda * lambda) / (variancia - lambda)
  return { r, p, fallbackParaPoisson: false }
}

// Coeficiente binomial generalizado para r não-inteiro
function logGamma(z: number): number {
  // Aproximação de Lanczos
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

---

## 6. Modelo 4 — Dixon-Coles

### 6.1 Função tau de correção

$$
\tau(x, y, \lambda_h, \lambda_a, \rho) = \begin{cases}
1 - \lambda_h \lambda_a \rho & \text{se } (x,y) = (0,0) \\
1 + \lambda_h \rho & \text{se } (x,y) = (0,1) \\
1 + \lambda_a \rho & \text{se } (x,y) = (1,0) \\
1 - \rho & \text{se } (x,y) = (1,1) \\
1 & \text{caso contrário}
\end{cases}
$$

Probabilidade do placar:

$$
P_{DC}(H=x, A=y) = \tau(x, y, \lambda_h, \lambda_a, \rho) \cdot P_{Poisson}(x,y)
$$

### 6.2 Estimação de ρ (DECISÃO APROVADA: Empírica — opção A)

Algoritmo de busca em grid:

```
1. Calcular matriz Poisson padrão da liga (médias gerais)
2. Para cada ρ no grid [-0.30, -0.29, ..., 0.29, 0.30]:
   a. Calcular probabilidades teóricas para placares 0x0, 0x1, 1x0, 1x1 com τ(ρ)
   b. Calcular soma dos quadrados das diferenças vs frequências observadas
3. Escolher ρ que minimiza essa soma
```

### 6.3 Decay temporal (DECISÃO APROVADA: ξ = 0.0065 — opção A)

$$
w_t = e^{-\xi \Delta t}, \quad \xi = 0.0065
$$

Aplicado **apenas no cálculo das forças individuais dos times**, não nas médias da liga.

### 6.4 Pseudocódigo

```tsx
const XI_DEFAULT = 0.0065  // meia-vida ~107 dias

function tauDixonColes(
  x: number,
  y: number,
  lambdaH: number,
  lambdaA: number,
  rho: number
): number {
  if (x === 0 && y === 0) return 1 - lambdaH * lambdaA * rho
  if (x === 0 && y === 1) return 1 + lambdaH * rho
  if (x === 1 && y === 0) return 1 + lambdaA * rho
  if (x === 1 && y === 1) return 1 - rho
  return 1
}

function pesoTemporal(
  dataJogo: Date,
  dataReferencia: Date,
  xi: number = XI_DEFAULT
): number {
  const msPorDia = 1000 * 60 * 60 * 24
  const diasAtras = (dataReferencia.getTime() - dataJogo.getTime()) / msPorDia
  return Math.exp(-xi * Math.max(0, diasAtras))
}

function calcularForcasComDecay(
  teamId: string,
  jogos: Match[],
  medias: MediasLigaCalculadas,
  dataReferencia: Date,
  xi: number = XI_DEFAULT
): ForcasTime {
  // Aplicar peso temporal e calcular médias ponderadas
  // (mesma lógica de calcularForcasTime, mas com pesos)
  // ... implementação detalhada na subtask 2B.4 ...
}

function estimarRhoEmpirico(
  jogos: Match[],
  medias: MediasLigaCalculadas
): number {
  const N = jogos.length

  // Frequências observadas dos placares baixos
  const freqObservada: Record<string, number> = {
    '0,0': jogos.filter(j => j.fthg === 0 && j.ftag === 0).length / N,
    '0,1': jogos.filter(j => j.fthg === 0 && j.ftag === 1).length / N,
    '1,0': jogos.filter(j => j.fthg === 1 && j.ftag === 0).length / N,
    '1,1': jogos.filter(j => j.fthg === 1 && j.ftag === 1).length / N,
  }

  // Probabilidades Poisson das médias gerais
  const lh = medias.mediaGolsCasa
  const la = medias.mediaGolsVis

  let melhorRho = 0
  let menorErro = Infinity

  for (let rho = -0.30; rho <= 0.30; rho += 0.01) {
    let erro = 0
    for (const [chave, freq] of Object.entries(freqObservada)) {
      const [x, y] = chave.split(',').map(Number)
      const probTeorica = tauDixonColes(x, y, lh, la, rho) * poissonPmf(lh, x) * poissonPmf(la, y)
      erro += Math.pow(freq - probTeorica, 2)
    }
    if (erro < menorErro) {
      menorErro = erro
      melhorRho = rho
    }
  }

  return melhorRho
}

function matrizPlacaresDixonColes(
  lambdaH: number,
  lambdaA: number,
  rho: number,
  max = 10
): number[][] {
  const matriz: number[][] = []
  for (let h = 0; h <= max; h++) {
    matriz[h] = []
    for (let a = 0; a <= max; a++) {
      const tau = tauDixonColes(h, a, lambdaH, lambdaA, rho)
      matriz[h][a] = tau * poissonPmf(lambdaH, h) * poissonPmf(lambdaA, a)
    }
  }
  // Normalizar (correção tau pode somar levemente diferente de 1)
  const soma = matriz.flat().reduce((s, v) => s + v, 0)
  return matriz.map(linha => linha.map(v => v / soma))
}
```

---

## 7. Cálculos Derivados

### 7.1 Mercados 1X2

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

### 7.2 Over/Under

$$
P(\text{Over } k) = \sum_{h+a > k} M[h][a]
$$

$$
P(\text{Under } k) = 1 - P(\text{Over } k)
$$

Linhas calculadas: 0.5, 1.5, 2.5, 3.5, 4.5

### 7.3 BTTS (Both Teams To Score)

$$
P(\text{BTTS Sim}) = \sum_{h \geq 1, a \geq 1} M[h][a]
$$

$$
P(\text{BTTS Não}) = 1 - P(\text{BTTS Sim})
$$

### 7.4 Handicap Asiático

Para linha $$L$$ (negativa = handicap pro mandante):

$$
P(\text{Casa AH } L) = \sum_{(h+L) > a} M[h][a] + 0.5 \cdot \sum_{(h+L) = a} M[h][a]
$$

Linhas calculadas: -2.5, -2.0, -1.5, -1.0, -0.5, 0, +0.5, +1.0, +1.5, +2.0, +2.5

### 7.5 Odd Justa

$$
\text{Odd Justa} = \frac{1}{P(\text{evento})}
$$

### 7.6 Expected Value (EV%)

$$
\text{EV\%} = \left(P(\text{evento}) \cdot \text{Odd Mercado} - 1\right) \times 100
$$

- EV > 0 → aposta de valor
- EV < 0 → aposta sem valor

---

## 8. Decisões de Calibração Aprovadas

| # | Tópico | Decisão | Justificativa |
| --- | --- | --- | --- |
| P1 | Cálculo de força | Separação por mando (A) | Padrão acadêmico, mais preciso |
| P2 | π do ZIP | Global da liga (A) | Simples, estável com poucos jogos |
| P3 | Fallback NB | Alerta visual (B) | Transparência ao usuário |
| P4 | ρ Dixon-Coles | Estimativa empírica (A) | Suficiente para MVP, sem otimização numérica |
| P5 | ξ decay | Fixo 0.0065 (A) | Meia-vida ~107 dias cobre temporada inteira |

> Decisões podem ser revistas após validação contra ground truth da `BRA1DASHv261.xlsx`.
> 

---

## 9. Casos de Borda

### 9.1 Time sem jogos suficientes

Se um time tem **menos de 5 jogos** como mandante ou visitante:

- Retornar erro `INSUFFICIENT_DATA` na API
- Exibir mensagem na UI: "Time com poucos dados — previsão indisponível"

### 9.2 Lambda muito baixo ou muito alto

- Se $$\lambda < 0.1$$: usar 0.1 como mínimo (evita divisão por zero)
- Se $$\lambda > 5.0$$: emitir warning (suspeito) mas calcular normalmente

### 9.3 Time sem confronto direto

Não exigir histórico H2H direto. Os modelos usam apenas estatísticas individuais.

### 9.4 Importação parcial da temporada

Aceitar liga com mínimo de **20 jogos** para calcular médias. Abaixo disso, bloquear cálculos.

### 9.5 Soma da matriz ≠ 1

Após truncamento em max=10, soma fica ~0.999. Aceitar tolerância de 0.001. Se diferença > 0.01, logar warning.

---

## 10. Validação contra Ground Truth

### 10.1 Fonte da Verdade

Planilha `BRA1DASHv261.xlsx` (Brasileirão Série A — temporada 2026), abas:
- **DASH**: tabela dinâmica com médias por time e μ da liga
- **CS**: matriz Poisson 11×11 e cálculos de mercados
- **BDBRA1**: base de dados bruta com colunas FCAtC, FCDfC, FCAtV, FCDfV por time
- **MAPVAL**: ROI por faixa de odds (validação de fase posterior)

### 10.2 Ground Truth Confirmado — Brasileirão 2026

Constantes extraídas da planilha (117 jogos completos da temporada):

```typescript
export const GROUND_TRUTH_BRA1_2026 = {
  totalJogos: 117,
  muH: 1.57,        // μ_h liga (Média de FTHG)
  muA: 1.05,        // μ_a liga (Média de FTAG)
  dpFthg: 1.15,
  dpFtag: 0.95,
} as const
```

### 10.3 Tolerância de Diferença

| Tipo de cálculo | Tolerância |
| --- | --- |
| Médias da liga (μ_h, μ_a) | < 0.01 absoluto |
| Médias individuais por time | < 0.05 absoluto |
| Forças (FCAt, FCDf) | < 0.02 absoluto |
| Lambdas | < 0.05 absoluto |
| Probabilidades de placar individual | < 0.5% |
| Mercados 1X2, O/U, BTTS | < 1.0% |
| Soma total da matriz | 1.0 ± 0.001 |

> Tolerância maior em mercados (1%) considera arredondamentos do Excel ao longo da cadeia de cálculo.

### 10.4 Caso de Teste de Referência — Athletico-PR vs Athletico-PR

Confronto padrão da aba CS da planilha (auto-confronto que serve como teste). Valores extraídos diretamente da planilha:

```typescript
// __tests__/analytics/ground-truth/athletico-vs-athletico.test.ts
describe('Poisson — Athletico-PR vs Athletico-PR (CS padrão da planilha)', () => {
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
    // Valores extraídos da matriz CS da planilha
    expect(matriz[0][0]).toBeCloseTo(0.0725, 2)   // 7,25%
    expect(matriz[1][1]).toBeCloseTo(0.1199, 2)   // 11,99%
    expect(matriz[2][1]).toBeCloseTo(0.0943, 2)   //  9,43%
    expect(matriz[1][0]).toBeCloseTo(0.1140, 2)   // 11,40%
    expect(matriz[2][0]).toBeCloseTo(0.0897, 2)   //  8,97%
  })

  test('mercados derivados', () => {
    const matriz = matrizPlacaresPoisson(2.04, 0.54)
    const mercados = calcularMercados(matriz)
    // Probabilidades da planilha aba CS
    expect(mercados.casa).toBeCloseTo(0.4942, 2)      // 49,42%
    expect(mercados.empate).toBeCloseTo(0.2521, 2)    // 25,21%
    expect(mercados.visit).toBeCloseTo(0.2537, 2)     // 25,37%
    expect(mercados.btts).toBeCloseTo(0.5155, 2)      // 51,55%
    expect(mercados.bttsNao).toBeCloseTo(0.4845, 2)   // 48,45%
    expect(mercados.over05).toBeCloseTo(0.9275, 2)    // 92,75%
    expect(mercados.over15).toBeCloseTo(0.7372, 2)    // 73,72%
    expect(mercados.over25).toBeCloseTo(0.4876, 2)    // 48,76%
    expect(mercados.over35).toBeCloseTo(0.2692, 2)    // 26,92%
    expect(mercados.goleadaCasa).toBeCloseTo(0.0738, 2)  //  7,38%
    expect(mercados.goleadaVis).toBeCloseTo(0.0209, 2)   //  2,09%
  })
})
```

### 10.5 Casos de Teste Adicionais

Os 5 confrontos abaixo (extraídos das telas DASH+CS da planilha) servem como casos secundários de validação:

```typescript
export const CASOS_GROUND_TRUTH = [
  {
    nome: 'Flamengo RJ vs Vasco',
    home: 'Flamengo RJ', away: 'Vasco',
    expected: { lambdaH: 1.93, lambdaA: 0.78 }, // tolerância: ver 10.3
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

---

## 11. Diferenças entre a Planilha Legada e o Sistema Novo

A planilha `BRA1DASHv261.xlsx` é o ground truth para o **modelo Poisson padrão**. Os demais modelos são evoluções deliberadas — não devem replicar comportamento da planilha:

| Aspecto | Planilha Legada | Sistema Big Data Bet (novo) |
| --- | --- | --- |
| **Modelo Poisson** | ✅ Implementado | ✅ Replica 100% (validado por ground truth) |
| **Modelo ZIP** | ❌ Não tem | ✅ Implementado (evolução) |
| **Modelo Binomial Negativa** | ❌ Não tem | ✅ Implementado (evolução) |
| **Modelo Dixon-Coles** | ❌ Não tem | ✅ Implementado (evolução) |
| **Decay temporal** | ❌ Todos jogos pesam igual | ✅ Decay no Dixon-Coles (ξ = 0,0065) |
| **Validação de amostra mínima** | ❌ Calcula com qualquer N | ✅ Bloqueia se time tem < 5 jogos casa/fora |
| **Validação de liga** | ❌ Calcula com qualquer total | ✅ Bloqueia se liga tem < 20 jogos |
| **Filtros de odd no DASH** | ✅ Afeta visualização | ✅ Afeta visualização (mas não o modelo) |
| **Goleada Casa/Visit** | ✅ Definida como h≥4 e diferença ≥3 | ✅ Mesma definição |
| **Tratamento de #N/A** | ⚠️ Mostra `#N/A` na célula | ✅ Retorna erro `INSUFFICIENT_DATA` na API |

### 11.1 Por que evoluir o modelo?

A planilha cumpre seu papel para análise rápida no Excel, mas tem limitações:

- **Subestima 0x0 e 1x1** (problema clássico de Poisson) → ZIP e Dixon-Coles corrigem
- **Não considera variância** (assume σ² = λ) → NB corrige quando há superdispersão
- **Não considera "forma recente"** → Dixon-Coles com decay corrige

### 11.2 Recomendação ao usuário (UI)

Na ferramenta interativa, deixar **Poisson como modelo default** (compatível com a planilha que os usuários já conhecem) e oferecer os outros 3 modelos como "modelos avançados" com tooltip explicativo de quando usar cada um.

---

> **Regra para o agente:** Implementar exatamente conforme especificado neste documento. Qualquer ambiguidade ou divergência com o ground truth deve ser **reportada antes de seguir** — nunca "ajustar a olho".
>
