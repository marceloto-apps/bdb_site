# Backtest Livre — Fase 5: Validação avançada (26/09/2026)

Plano: `docs/Backtest_Livre_Plano.md` §6.4 (Monte Carlo, estratégia aleatória), §6.6 (validação temporal e
controle de tentativas) e §6.7 (calibração). Tudo roda no mesmo engine puro (Worker no navegador, Node no
servidor e na CLI), sobre o mesmo run, num passo à parte ("Rodar validação avançada") porque a varredura
pode custar alguns segundos.

## 1. O que foi construído

### 1.1 Engine — `lib/laboratorio/engine/validacao.ts`

`executarCompilada(…, { validacao: true })` anexa `resultado.validacao: ValidacaoResult` (tipos em `tipos.ts`).
A estratégia ganhou o bloco `validacao` (persistido no JSON e validado por zod):

```json
"validacao": {
  "holdout": "selado" | "aberto",
  "folds": "temporada" | "ano",
  "walkForward": { "janelas": 4, "expandindo": true },
  "varredura": { "p1": { "de": 0.02, "ate": 0.10, "passo": 0.01 } },
  "monteCarlo": { "caminhos": 2000, "ruinaPct": 0.5 },
  "calibracao": { "prob": { "formula": "model(DC, FORCAS, l10).p_over(2.5)" } }
}
```

| Bloco | Como funciona | Saída |
| --- | --- | --- |
| **Holdout selado** | `aplicarHoldout()` (`data/dataset.ts`) resolve pelo manifesto a última temporada de cada competição (`temporadasHoldout`: chunk com maior `ate`) e, quando `selado`, põe as chaves em `universo.temporadasExcluidas`; o filtro de chunks nem baixa esses blocos e `aplicarUniverso` exclui as linhas. Conta os jogos ocultos pelos `linhas` dos chunks. Quando `aberto`, o run inclui tudo e a validação separa as apostas em "anteriores" × "holdout" pelo `match.season` da linha | `holdout: { modo, temporadas, jogosOcultos, anteriores, holdout }` |
| **Folds** | Apostas do run agrupadas por rótulo de temporada ou ano civil; cada fold com n, yield, lucro, acerto, CLV e p-valor (t contra −margem) | `folds.itens[]`, `positivos/total` |
| **Walk-forward** | Janelas fixadas antes do resultado, por **quantis das datas do universo** (robusto ao intervalo entre temporadas). Para k = 1..K−1: treino = janelas anteriores (expansivo) ou só a anterior; teste = janela k. **Com varredura**, a combinação com melhor yield no treino (n ≥ 20) é escolhida e avaliada no teste; sem varredura, mede a estabilidade da regra fixa. OOS = concatenação dos testes; WFE = yield OOS / yield IS (NaN se IS ≤ 0) | `walkForward: { janelas[], nOos, yieldOos, yieldIs, wfe, oosCumulativo }` |
| **Varredura `$p`** | Produto cartesiano das faixas (máx. **200** combinações, `truncada` quando corta); cada combinação é um run completo (bootstrap 0, sem extras) — as apostas ficam em memória e servem ao walk-forward e ao PBO sem re-executar. Heatmap quando há exatamente 2 parâmetros. **PBO-lite**: 4 períodos por quantis, C(4,2) = 6 divisões treino/teste; PBO = fração em que a melhor no treino fica abaixo da mediana no teste | `varredura: { combos[], melhor, pbo, pboTestes, heatmap }` |
| **Deflação por tentativas** | N = combinações da varredura (≥ 1) + `tentativasPrevias` (as registradas no servidor para a estratégia). `p_defl = 1 − (1 − p)^N` (Šidák) e `t_defl = t − E[max de N normais]` (Bailey & López de Prado; `normalInv` de Acklam em `matematica.ts`). `provavelSelecao` quando p < 0,05 e p_defl ≥ 0,05 | `deflacao` |
| **Monte Carlo** | Reamostra as apostas do run (com reposição, n apostas por caminho) aplicando o staking: flat/to-win usa o stake original; % do banco e Kelly usam a fração `stake / banco anterior` sobre o banco simulado. Lucro final P5/25/50/75/95, MDD P50/95/99 (u e %), P(lucro), P(ruína = queda ≥ `ruinaPct` do banco), histograma de 20 faixas, 12 caminhos amostrados | `monteCarlo` |
| **Seleção aleatória** (Kaunitz) | 300 sorteios: as mesmas entradas (mercado, lado, casa, snapshot, filtros) em linhas sorteadas do universo, stake flat 1; z = (yield flat real − média) / desvio, p unilateral normal | `monteCarlo.selecaoAleatoria` |
| **Calibração** | Expressão de probabilidade (`validacao.calibracao.prob`; por padrão a do Kelly) avaliada nas apostas decididas (WIN/LOSS) com referência: Brier e log-loss vs a probabilidade justa da referência, skill = 1 − Brier/Brier_ref, 10 faixas do diagrama de confiabilidade e ECE. O engine recusa expressão de unidade `odd` | `calibracao` |

Outras mudanças no engine: `ENGINE_VERSAO = 0.2.0`; o hash do run ignora as opções de validação, exceto o
holdout (que muda o universo); `Universo.temporadasExcluidas`; `EstrategiaCompilada.calibracaoProb`;
`OpcoesRun` ganhou `validacao`, `tentativasPrevias`, `holdout`, `aoProgresso`.

### 1.2 Dados, Worker, API e CLI

- `Sessao.executar(estrategia, { validacao, tentativasPrevias })` e `executarNoServidor(…)` aplicam o holdout pelo manifesto e repassam as opções; progresso ganhou as fases `validando` e `varrendo`.
- `POST /api/laboratorio/run` aceita `validacao` e `tentativasPrevias`; runs salvos guardam `resumo.validacao`.
- `PATCH /api/laboratorio/estrategias/[id]` aceita `holdoutAberto: true` (o selo nunca volta a fechar) — o cliente envia junto a definição com `validacao.holdout = 'aberto'`.
- CLI: `npm run lab:run -- estrategia.json --validacao [--tentativas=N]` imprime o bloco completo; exemplos 03 (varredura + calibração do modelo) e 06 (Kelly, selo aberto) ganharam `validacao`.

### 1.3 UI

- **Passo 6 "Validação avançada"** (`PainelValidacao.tsx`): cartão do selo (selado por padrão em estratégias novas e nos exemplos; "Abrir o selo" só com estratégia salva, com confirmação; depois de aberto não fecha), cortes por temporada/ano, janelas do walk-forward e modo expansivo, varredura por parâmetro (liga/desliga, de/até/passo, contagem de combinações), Monte Carlo (caminhos, % de ruína) e expressão de calibração. "Salvar e carregar" virou o passo 7.
- **Tearsheet**: quatro abas novas — Validação (selo, anteriores × holdout, folds, walk-forward com curva OOS), Monte Carlo (cards, histograma, 12 caminhos, seleção aleatória), Varredura (tentativas, p e t deflacionados, veredito, melhor combinação, PBO, heatmap 2D, tabela ordenada) e Calibração (Brier/skill/log-loss/ECE, diagrama de confiabilidade, tabela por faixa). Antes de rodar, cada aba mostra o botão "Rodar validação avançada" (mesmo run + validação, com barra de progresso). O card p-valor passa a mostrar o deflacionado e as tentativas; aviso amarelo "Tentativas" quando `provavelSelecao`.
- Lista de estratégias salvas mostra o badge "selo aberto". Guia "Como usar": passo 6 no roteiro e 9 termos novos no glossário. Dicas (`DICAS`) para todos os campos novos.

## 2. Testes e medições

- `tests/laboratorio/validacao.test.ts` — **15 testes**: `normalInv`/E[max]; última temporada por competição, contagem de jogos ocultos e filtro de chunks; selado × aberto (soma bate, hash muda só com holdout); folds por temporada/ano; walk-forward sem e com parâmetros (escolha dentro da grade); varredura 4×3 com heatmap e a combinação igual à estratégia reproduzindo o run principal; truncamento em 200 e tentativas prévias; deflação sem varredura = 1 − (1 − p)^(1+prévias); validações de faixa/janelas; Monte Carlo (quantis ordenados, determinismo, % do banco com ruína, caso sem variância); seleção aleatória; calibração (a referência tem skill 0; constante calibra mal; Kelly usa a própria probabilidade; odd é erro). Total do laboratório: **207 testes** (14 arquivos).
- Produção (R2, dataset `20260926-1230`), via CLI:

| Exemplo | Universo | Validação | Tempo |
| --- | --- | --- | --- |
| 03 Dixon-Coles × mercado over 2.5, selado, varredura 9 combos, calibração | 10.331 apostas | holdout ocultou 8.347 jogos; 0/6 folds positivos; WF otimizado OOS −8,1%; PBO 0%; calibração skill −15%, ECE 17,5% (o modelo é pior que o mercado: exatamente o que a aba deve mostrar) | 4,6 s |
| 06 Kelly ¼ lado por expressão, selo aberto | 1.454 apostas | anteriores −5,2% × holdout −0,7% (CLV +8,4%); 3/7 folds; MC P(lucro) 21%, P(ruína 50%) 56%; calibração da probabilidade da Pinnacle: skill 0, ECE 3,8% | 0,1 s |

## 3. Decisões de implementação

- **Holdout opt-in por definição, selado por padrão na UI.** O engine só sela quando `validacao.holdout === 'selado'` (estratégias antigas e a paridade com o backtest atual continuam iguais); estratégias novas, exemplos e o guia partem seladas. Abrir o selo exige estratégia salva e fica gravado (`holdoutAberto`), como pede o plano.
- **Janelas por quantis de datas**, não por tempo corrido: as pausas entre temporadas deixariam janelas vazias.
- **Varredura roda cada combinação uma vez** e reaproveita as apostas para walk-forward e PBO; com staking dependente do banco isso é uma aproximação (o yield é normalizado pelo stake), aceitável para escolher parâmetros.
- **Deflação por Šidák + E[max]** em vez do Deflated Sharpe completo: precisa só de p, t e N, e é conservadora.
- **Seleção aleatória** mantém entradas e universo e sorteia só os jogos: isola a "habilidade de seleção" da regra.

## 4. Pendências

1. Teste manual no navegador: passo 6, botão de validação nas abas, abrir o selo numa estratégia salva (roteiro em §5).
2. Varredura com 3+ parâmetros não tem heatmap (só tabela); varredura com staking Kelly recompila a probabilidade a cada combinação (ok, mas mais lenta).
3. Fase 6 (operação): paper trading, comparação backtest × live, portfólio.

## 5. Roteiro de teste no navegador (passo a passo, sem conhecimento prévio)

Pré-requisitos: estar logado em https://www.bigdatabet.com.br com um usuário que tem o plano do Backtest
(VIP PRO) e a Vercel já ter publicado o commit `49b7987` ou posterior (o rodapé do resultado mostra
"engine 0.2.0").

**Teste A — carregar um exemplo e ver o selo**
1. Menu lateral → "Laboratório" (ícone de frasco, badge "Novo"). Espere o botão verde do topo do formulário mudar de "Preparando…" para "Executar".
2. No canto superior direito, clique em "Como usar". Abre um painel lateral. Clique na aba "Exemplos".
3. No terceiro cartão, "Modelo Dixon-Coles acima do mercado no over 2.5", clique em "Carregar exemplo". O painel fecha e aparece um aviso verde "Exemplo carregado".
4. No formulário à esquerda, clique em "6. Validação avançada" para abrir o passo. Confira: cadeado verde "Última temporada selada"; "Varredura dos parâmetros $p" mostra a linha `$p1` ligada, de 0,02 até 0,1, passo 0,01, e o texto "9 combinações".
   Se o passo 6 estiver mostrando "Defina parâmetros no passo 5…", o exemplo não carregou: repita o passo 3.

**Teste B — executar e rodar a validação**
5. Clique em "Executar" (topo do formulário). Espere o resultado aparecer à direita (cards, gráfico e abas). Na primeira execução do dia a barra "Baixando dados…" pode levar 10 a 40 s.
6. Nas abas abaixo do gráfico, clique em "Validação ●". Deve aparecer o cartão "Última temporada selada. N jogos de M temporadas ficaram de fora deste run" e um botão "Rodar validação avançada".
7. Clique em "Rodar validação avançada". No topo do resultado aparece uma barra fina com "Varrendo parâmetros… 1/9 … 9/9" e depois "Validando…". Leva cerca de 5 a 15 s. Ao terminar, aviso verde "Validação concluída".
8. Ainda na aba Validação, confira: tabela "Cortes por temporada" com uma linha por temporada; bloco "Walk-forward (parâmetros escolhidos no treino)" com quatro cards (Yield fora da amostra, Yield no treino, Eficiência, Janelas) e uma tabela com a coluna "Parâmetros" preenchida (p1=0,0x); abaixo, o gráfico do lucro fora da amostra.

**Teste C — as outras três abas**
9. Aba "Varredura": quatro cards no topo (Tentativas = 9 + as registradas, p-valor deflacionado, t deflacionado, Veredito); depois "Melhor combinação", "PBO" e "Combinações = 9"; por fim uma tabela com 9 linhas ordenadas por yield. Não há mapa de calor porque só existe um parâmetro (aparece com dois).
10. Aba "Monte Carlo": cards "Lucro final (mediana)", "Chance de lucro", "Maior queda típica", "Chance de ruína"; histograma vermelho/verde; gráfico com 12 linhas; bloco "Seleção aleatória nos mesmos jogos" com o valor de z.
11. Aba "Calibração" (o exemplo já traz a expressão `model(DC, FORCAS, l10).p_over(2.5)` no passo 6): cards Brier, Skill, Log-loss, ECE (para este exemplo o skill é negativo e o ECE alto: o modelo é pior que o mercado, e é isso que a aba deve mostrar); gráfico de pontos com a linha diagonal tracejada; tabela por faixa.
12. Volte ao card "p-valor" no topo: a linha pequena passou a mostrar "deflacionado … · N tentativas".

**Teste D — salvar e abrir o selo**
13. Abra "7. Salvar e carregar" e clique em "Salvar estratégia". Dê o nome "Teste selo" e confirme. Aviso "Estratégia salva".
14. Abra "6. Validação avançada". O botão "Abrir o selo" agora está ativo (antes de salvar ele fica cinza). Clique; leia a confirmação do navegador e clique em OK. Aviso "Selo aberto". O cartão fica amarelo: "Última temporada aberta".
15. Clique em "Executar" de novo e depois em "Rodar validação avançada". Na aba Validação aparece a tabela com duas linhas: "Temporadas anteriores" e "Última temporada (holdout)", cada uma com n, yield, lucro, acerto, CLV e p.

**Teste E — o selo fica registrado**
16. Recarregue a página (F5). Abra "7. Salvar e carregar": na lista "Minhas estratégias", a linha "Teste selo" mostra o badge "selo aberto". Clique no nome para carregar.
17. Abra "6. Validação avançada": o cartão está amarelo, "Última temporada aberta", e não existe botão para selar de novo. Esse é o comportamento esperado: o selo só abre uma vez por estratégia.
18. Opcional: apague "Teste selo" pelo ícone de lixeira na lista.

O que reportar se algo falhar: o número do passo, o texto exato de qualquer aviso vermelho, e um print da tela.
