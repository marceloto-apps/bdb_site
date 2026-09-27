# Backtest Livre — Explorador de vantagens (26/09/2026)

Pedido do usuário (26/09/2026): antes da Fase 6, uma camada "mais lúdica e intuitiva" para achar pequenas
vantagens uma de cada vez e cruzá-las com estatísticas, dentro da página do Laboratório; o modo Estratégia
fica como destino, onde as peças se juntam.

## 1. O que foi construído

A página `/dashboard/laboratorio` ganhou uma alternância no topo: **Explorar** (padrão) e **Estratégia**.

### 1.1 Modo Explorar

| Peça | Arquivo | O que faz |
| --- | --- | --- |
| Engine | `lib/laboratorio/engine/explorar.ts` | `prepararExploracao(opcoes, catalogo)` compila a cesta de apostas e a estatística com o mesmo `prepararEstrategia` (validação, unidades, campos usados). `explorar(prep, dataset)` faz cada aposta em **todos** os jogos do universo com stake 1, liquida, calcula CLV contra a referência e acumula por célula **liga × temporada × aposta × faixa**, mais os totais (`*`) por liga (todas as temporadas) e por tudo (todas as ligas). Cada célula sai com n, lucro, yield, acerto, odd média, CLV (e n com referência) e p-valor (t contra −margem). Faixas: tercis (padrão), quartis ou cortes explícitos, por quantis dos jogos do universo, limites arredondados a 3 casas; estatística booleana vira Não/Sim. Ordem de temporadas por data de início (`ordemTemporada`) |
| Worker / cliente | `worker/sessao.ts` (`Sessao.explorar`), `protocolo.ts` (`t: 'explorar'`), `cliente.ts` (`lab.explorar`) | Carrega só os grupos necessários (mesmo cache dos runs) e devolve o resultado serializado (NaN → null) |
| Cesta e estatísticas | `lib/laboratorio/ui/explorador.ts` | `CESTA`: 11 apostas básicas de fechamento (1X2, over/under 2.5 e linha principal, ambas marcam sim/não, handicap asiático principal) × casas bet365/Pinnacle. `ESTATISTICAS`: 17 estatísticas em linguagem de apostador (odd do mandante, favorito, linha de gols, movimento da odd, forma, diferença de forma, Elo, gols marcados/sofridos, xG, média de gols e % mandante da liga, rodada, fim de semana), mais "Outra" (fórmula livre com autocomplete). `estrategiaDaCelula` converte uma célula em `Estrategia` (universo = liga [+ temporada], entrada = aposta, regra = faixa, stake flat, holdout selado); `limiarSidak`/`pDeflacionado`; `persistencia` |
| Painel esquerdo | `components/laboratorio/PainelExplorar.tsx` (+ `PainelUniverso` reutilizado) | Jogos considerados; cesta por grupo; casas; estatística (select agrupado + descrição) e nº de faixas; mínimo de apostas por célula (padrão 100) |
| Painel direito | `components/laboratorio/Explorador.tsx` | Matriz: linhas = "Todas as ligas" + ligas (ou liga × temporada); colunas = apostas, ou faixas da estatística para a aposta escolhida ("Todas as faixas" + cada faixa). Cor = yield ou CLV; n embaixo; células com n < mínimo apagadas; clique no cabeçalho ordena; ★ = p < limiar de Šidák para o nº de células com amostra; coluna **Persistência** (temporadas com lucro / com amostra, na coluna ordenada). Clique numa célula → barra de detalhe (n, yield, lucro, acerto, odd, CLV, p, p deflacionado) e botão **Levar ao Laboratório**, que monta a estratégia e muda para o modo Estratégia |

### 1.2 Anti-ilusão embutido

- Todas as células dizem n; abaixo do mínimo ficam apagadas.
- O cabeçalho mostra quantas células têm amostra e qual p-valor uma célula precisa ter para valer a 5% depois de descontar todas as outras (Šidák: `1 − 0,95^(1/N)`); só essas recebem ★. O detalhe mostra o p deflacionado.
- Persistência entre temporadas ao lado da coluna ordenada.
- "Levar ao Laboratório" já nasce com a última temporada selada.

### 1.3 Seleção e instrução da exploração (27/09/2026)

Pedido: marcar campeonatos, mercado, cruzamento e faixas na matriz, salvar num texto copiável e levar esse texto à
Estratégia como instrução.

- **Marcar**: na barra de detalhe de uma célula, "Marcar" guarda a célula na seleção (a célula ganha um contorno
  âmbar). Vale para qualquer célula: liga × aposta, liga × faixa, liga × temporada e a linha "Todas as ligas".
- **Painel "Seleção"** (abaixo da matriz): lista as marcações, "Copiar instrução", "Ver texto", "Levar seleção ao
  Laboratório" e "Limpar". A seleção zera quando uma nova exploração roda.
- **Instrução** (`InstrucaoExploracao` em `engine/tipos.ts`, validada por `instrucaoExploracaoSchema`): texto com um
  cabeçalho legível (linhas `#`: dados, apostas, estatística, uma linha por marcação com n e yield) seguido do JSON
  (apostas usadas, cruzamento, faixas, universo da exploração e as células). `lerInstrucao` aceita o texto completo ou
  só o JSON.
- **Na Estratégia**, o passo "Da exploração" (`PainelExploracao.tsx`) mostra a instrução anexada (resumo + copiar +
  remover) e tem um campo para colar outra: "Aplicar" monta universo, regra e apostas (`estrategiaDaInstrucao`); "Só
  anexar" guarda a instrução sem mexer na estratégia. A instrução é persistida no JSON da estratégia (`exploracao`) e
  **não entra no hash do run**.
- `estrategiaDaInstrucao`: universo = ligas marcadas (ou todas, se "Todas as ligas" foi marcada); temporada só quando
  todas as marcações são da mesma; apostas = as usadas nas marcações (uma entrada por aposta); regra = faixas marcadas.
  Quando as faixas diferem entre ligas, a regra fica por liga: `(match.competition == "id" and (faixa…)) or (…)`; liga
  marcada em "todas as faixas" entra sem restrição.
- Nome da liga na matriz e nos nomes gerados passa a trazer o país: "Superliga (Dinamarca)" × "Superliga (Sérvia)".
- Validador de fórmulas (`engine/ast.ts`): campos de unidade `id` (competição, times) passam a poder ser comparados com
  texto em `==`/`!=` (`match.competition == "…"`); o compilador já os tratava como texto. Testes: `instrucao.test.ts` (7).

## 2. Testes e medições

- `tests/laboratorio/explorar.test.ts` — **7 testes**: células por liga × temporada somam o total e batem com um run do Laboratório (n, lucro, yield, acerto, CLV); tercis com contagens iguais e faixas somando "todas"; booleano/quartis/cortes explícitos; filtro de temporada e erros de aposta/fórmula; ordem de temporadas; toda a cesta e todas as estatísticas compilam; célula → estratégia reproduz a célula (mesmo n e lucro), regra da faixa nos três formatos, Šidák, deflação e persistência. Total do laboratório: **214**.
- Produção (R2 `20260926-1640`, universo ligas do BDB + campeonatos = 80 ligas, 122.980 jogos), 12 apostas (6 × 2 casas) cruzadas com a forma do mandante: carga 531 chunks / 37 MB em 25 s no servidor (no navegador fica em cache), **explorar 1,3 s**, 12.998 células, resultado 2,8 MB.
- Leitura de amostra: as melhores células por liga (n ≥ 300) têm yield de 7–12% com p entre 0,006 e 0,17, e CLV negativo em todas: exatamente o tipo de "vantagem" que a deflação e a persistência existem para questionar antes de virar estratégia.

## 2.1 Corte temporal (27/09/2026, D14 do plano)

Explorar e Estratégia só usam temporadas a partir de **2022** (anuais) e **22/23** (europeias). A regra vive em
`lib/laboratorio/engine/temporadas.ts` (`ANO_MINIMO_TEMPORADA = 2022`, `temporadaPermitida`, `ordemTemporada`) e é
aplicada em três pontos com a mesma função: `filtroDoUniverso` (os chunks antigos nem são baixados, no Worker, no
servidor e na CLI), `resumoManifest` (a lista de temporadas e a contagem de jogos por liga na UI já vêm cortadas) e
`aplicarUniverso` (máscara do engine; estratégia salva que pede "2021" recebe o aviso "Temporadas anteriores a 2022 e
22/23 não estão disponíveis… ignoradas"). Medido no manifesto `20260927-1230`: 250.638 → 200.913 linhas; os rótulos
2000–2021 e 18/19–21/22 (49,7 mil jogos, a maioria 2021 e 21/22) saem; nenhuma competição fica sem temporada. Testes em
`tests/laboratorio/temporadas.test.ts` (7). A feature store no `bdb_ingest` não muda: 2021 e 21/22 continuam construídos
para alimentar as janelas móveis dos primeiros jogos de 2022.

## 2.2 "Failed to fetch" no Explorar (27/09/2026)

Causa: o buscador do Worker pedia a URL assinada **chunk a chunk** (só agrupava o que caía no mesmo tick, isto é, os
6 downloads paralelos), então um Explorar com 80 ligas fazia 500+ chamadas a `GET /api/laboratorio/dataset` (cada uma
com sessão e consulta ao banco) e qualquer falha de rede subia crua como `Failed to fetch`. Correção em
`worker/sessao.ts` (`buscadorAssinado`) e `data/dataset.ts`:

- `carregarDataset` calcula todas as chaves da carga e chama `buscar.preparar(chaves)` antes do primeiro download; a
  `Sessao` só repassa o que não está na memória. O buscador assina tudo em **lotes de 500 via `POST /api/laboratorio/dataset`**
  (rota nova, até 1.000 chaves; o GET continua, até 400) — 3 chamadas em vez de 500+. Se o servidor não aceitar POST
  (deploy antigo), cai para GET em lotes de 100. URLs assinadas ficam em cache até 1 min antes de expirar.
- Falhas sem resposta HTTP (`TypeError`) e 5xx/429 são repetidas 3 vezes com espera (0,4 s, 0,8 s), tanto no pedido de
  URLs quanto no download do R2.
- Mensagens: "Falha de rede ao pedir URLs assinadas (…)", "Sessão expirada ou sem acesso ao Laboratório (HTTP 401/403)",
  e a de CORS só depois das tentativas.
- Testes: +4 em `fase3.test.ts` (lotes POST, fallback GET, retentativa e mensagens).

## 2.3 Fontes: o BDB é principal, a FPT complementa (27/09/2026)

Medido no dataset `20260927-1230`, por liga × temporada (linhas do BDB / linhas só-FPT): a feature store já constrói o
complemento **por rodada**: linhas só-FPT existem apenas onde o BDB não tem o jogo (22/23 em todas as ligas do BDB;
Eredivisie também 23/24; Egito 24/25 pela metade; 1–2 jogos avulsos aqui e ali). Nas ligas só-FPT, todas as temporadas
vêm da FPT. A Pinnacle só existe no BDB e, em várias ligas (Áustria, Egito, Ucrânia, Série B italiana), só a partir de
26/27; a Rússia não tem bet365 nenhuma. O problema era a UI: "Ligas extras" desligada por padrão no Explorar e na
Estratégia apagava essas temporadas (por isso "Premier League · 2 temporadas").

Mudanças:

- **Padrão = complemento ligado** (`fontes` ausente) no Explorar, na estratégia inicial e nos 6 exemplos. A chave foi
  renomeada para "Complemento FutPythonTrader (temporadas e ligas que o BDB não tem · só bet365)"; "Ligas do BDB" é a
  fonte principal.
- **Complemento condicionado à bet365** (`engine/universo.ts`: `casasDasEntradas`, `ehComplemento`, `universoEfetivo`):
  em modo complemento, se nenhuma aposta usa a bet365 (Explorar só com Pinnacle, ou estratégia só Pinnacle), as linhas
  só-FPT saem do universo com o aviso "Complemento FutPythonTrader ignorado…". `fontes: ['fpt']` explícito não muda.
  `run.ts` e `explorar.ts` passam as casas das entradas; o Explorar agora devolve `avisos` e mostra na faixa do topo.
- **Chunks**: `filtroDoUniverso(u, manifest, casas)` aplica o mesmo universo efetivo e nem baixa competições só-FPT
  quando a fonte FPT não entra (Sessao, servidor e CLI passam as casas).

## 3. Pendências

1. Teste no navegador (roteiro em §4).
2. Estatísticas: a lista é um ponto de partida; o usuário disse que trará dados/ideias. Acrescentar é só editar `ESTATISTICAS` (rótulo, grupo, fórmula, descrição) — o teste garante que compilam.
3. Diagnóstico por liga (alinhamento xG × gols, taxa de empates, Brier da Pinnacle…) como terceira aba do Explorar, quando a lista de métricas for definida.
4. Salvar explorações / comparar versões do dataset (só se fizer falta).

## 4. Roteiro de teste no navegador

1. Abra o Laboratório. A página abre no modo **Explorar** (botão verde "Explorar" no topo do formulário; à direita, o texto "Escolha as apostas à esquerda e clique em Explorar").
2. Deixe "1. Jogos considerados" como está (Ligas padrão, ligas do BDB, campeonatos). Em "2. Apostas e estatística" já vêm marcados Mandante, Empate, Visitante, Over 2.5, Under 2.5 e Ambas marcam, casa bet365. Clique em **Explorar**. Primeira vez: "Baixando dados…" por até 40 s; depois fica em cache.
3. Aparece a matriz: primeira linha "Todas as ligas" em negrito; uma linha por liga; colunas = as 6 apostas; cada célula com o yield colorido e o n embaixo. Células cinza-claro têm menos de 100 apostas. No topo, "N células com amostra" e o texto "★ = significativo mesmo descontando…". Clique no cabeçalho "Empate · bet365": a matriz reordena por essa coluna e a coluna Persistência passa a se referir a ela.
4. Troque "por liga" por "por liga e temporada" (canto superior direito da matriz): as linhas viram liga · temporada. Volte para "por liga". Troque "cor = yield" por "cor = CLV" e repare que quase tudo fica vermelho: apostar cego perde a margem.
5. Em "2. Apostas e estatística", escolha "Forma do mandante (pontos por jogo, últimos 5)" e clique em Explorar de novo. Agora as colunas são "Todas as faixas", Baixo, Médio, Alto, para a aposta escolhida no seletor que apareceu no canto direito (troque para "Visitante · bet365" e veja o efeito da forma do mandante no visitante).
6. Clique numa célula qualquer com número em negrito. Abre a barra de detalhe embaixo da matriz com n, yield, CLV, p e p deflacionado. Clique em **Levar ao Laboratório**: a página muda para o modo Estratégia, com a liga em "1. Jogos considerados", a aposta em "4. Apostas", a regra da faixa em "3. Regra" (ex.: `home.l5.pts_pg >= 1.6`) e o selo fechado em "6. Validação avançada". Clique em Executar para confirmar que o número de apostas bate com o n da célula (menos os jogos da última temporada, que o selo esconde).
7. Volte para "Explorar" pelo botão do topo: a matriz continua lá.
