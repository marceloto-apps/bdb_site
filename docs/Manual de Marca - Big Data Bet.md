# Manual de Marca — Big Data Bet

## 1. Identidade Visual

### Logo

- **Versão primária:** Ícone BDB + logotipo "BIG DATA BET" lado a lado
- **Versão ícone:** Somente o símbolo BDB (uso em favicon, app, avatar)
- **Versão dark:** Fundo `#0d0d0d` / `#0d1117` — preferencial
- **Versão light:** Fundo branco — apenas quando o contexto exigir

### Elementos do símbolo

| Elemento | Descrição |
| --- | --- |
| Letras BDB | Verde sólido, peso bold, mesma altura |
| Linha de tendência | Branca, ascendente, 3 nós circulares |
| Fundo | Dark navy / preto puro |
| Forma do ícone | Quadrado com bordas arredondadas (app icon) |

---

## 2. Paleta de Cores

### Cores primárias

| Nome | Hex | Uso |
| --- | --- | --- |
| Verde Primário | `#22c55e` | CTAs, destaques, ícone |
| Verde Escuro | `#16a34a` | Hover, gradiente secundário |
| Preto Base | `#0d0d0d` | Fundo principal |
| Navy Dark | `#0d1117` | Fundo alternativo / cards |

### Cores secundárias

| Nome | Hex | Uso |
| --- | --- | --- |
| Branco Puro | `#ffffff` | Texto principal, linha do gráfico |
| Cinza Claro | `#e5e7eb` | Texto secundário |
| Cinza Médio | `#6b7280` | Placeholder, labels, metadados |
| Cinza Escuro | `#1f2937` | Bordas, separadores, cards |

### Cores de suporte *(não restritivas)*

| Nome | Hex | Uso |
| --- | --- | --- |
| Azul Dados | `#3b82f6` | Gráficos, séries de dados alternativas |
| Azul Claro | `#60a5fa` | Linha de tendência alternativa |
| Amarelo Alerta | `#eab308` | Badges, avisos, destaques pontuais |
| Vermelho Perda | `#ef4444` | Indicadores negativos em gráficos |

> **Regra:** Verde + Branco + Dark são os pilares. Azul e amarelo entram como dados/gráficos. Vermelho só para indicadores negativos.
> 

---

## 3. Tipografia

### Fontes recomendadas (Google Fonts — gratuitas)

### Títulos e logotipo

```
Font: "Plus Jakarta Sans"
Weights: 700 (Bold), 800 (ExtraBold)
Uso: H1, H2, nome da marca, CTAs
```

> Moderna, geométrica, personalidade forte. Lembra a fonte da logo gerada.
> 

### Corpo e leitura

```
Font: "Inter"
Weights: 400 (Regular), 500 (Medium), 600 (SemiBold)
Uso: parágrafos, artigos, labels, UI geral
```

> Padrão de mercado para SaaS/dados. Legibilidade excepcional em telas.
> 

### Dados e números

```
Font: "JetBrains Mono" ou "Fira Code"
Weights: 400, 500
Uso: odds, estatísticas, backtests, tabelas numéricas
```

> Monospace deixa números alinhados e profissional em tabelas.
> 

### Hierarquia tipográfica

| Nível | Fonte | Tamanho | Peso |
| --- | --- | --- | --- |
| H1 | Plus Jakarta Sans | 48–64px | 800 |
| H2 | Plus Jakarta Sans | 32–40px | 700 |
| H3 | Plus Jakarta Sans | 24–28px | 700 |
| Body | Inter | 16px | 400 |
| Body SM | Inter | 14px | 400 |
| Label | Inter | 12px | 500 |
| Número/Dado | JetBrains Mono | 14–16px | 500 |

---

## 4. Espaçamento e Grid

```
Base unit: 4px
Espaçamento padrão: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64px
Border radius padrão: 8px (cards), 12px (modais), 999px (badges/pills)
Max-width conteúdo: 1280px
Colunas: 12 (desktop) / 4 (mobile)
```

---

## 5. Componentes — Tom Visual

| Elemento | Estilo |
| --- | --- |
| Cards | Fundo `#1f2937`, borda `#374151`, radius 8px |
| Botão primário | Verde `#22c55e`, texto preto, hover `#16a34a` |
| Botão secundário | Transparente, borda `#374151`, texto branco |
| Badge / Plano | Pills coloridas: Free cinza, Básico azul, Pro verde, Premium amarelo |
| Input | Fundo `#111827`, borda `#374151`, focus borda verde |
| Gráficos | Fundo dark, linha principal verde, secundária azul, negativo vermelho |

---

## 6. Tom de Voz

| Atributo | Descrição |
| --- | --- |
| **Direto** | Dados falam por si. Sem enrolação. |
| **Confiável** | Base em estatística, não em achismo |
| **Acessível** | Técnico quando necessário, simples por padrão |
| **Brasileiro** | PT-BR natural, sem anglicismos desnecessários |

---

## 7. Regras de Uso — Para Agentes de IA

```
IDENTIDADE
- Nome oficial: Big Data Bet
- Domínio: bigdatabet.com.br
- Sigla do ícone: BDB

CORES OBRIGATÓRIAS
- Fundo: #0d0d0d ou #0d1117
- Primária: #22c55e
- Texto: #ffffff e #e5e7eb
- Nunca usar fundo branco em dark mode

FONTES
- Títulos: Plus Jakarta Sans
- Corpo: Inter
- Números/dados: JetBrains Mono
- Importar via Google Fonts

LOGO
- Sempre usar versão SVG
- Mínimo 32px de altura para o ícone isolado
- Nunca distorcer proporções
- Nunca trocar a cor verde por outra cor primária
- Espaço de respiro ao redor: mínimo 16px em todos os lados

TAILWIND CONFIG
- primary: #22c55e (já é green-500 nativo)
- background: #0d0d0d
- surface: #1f2937 (gray-800)
- border: #374151 (gray-700)

SHADCN/UI
- Tema: dark
- Accent: green
```

---