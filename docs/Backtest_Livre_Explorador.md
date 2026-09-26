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

## 2. Testes e medições

- `tests/laboratorio/explorar.test.ts` — **7 testes**: células por liga × temporada somam o total e batem com um run do Laboratório (n, lucro, yield, acerto, CLV); tercis com contagens iguais e faixas somando "todas"; booleano/quartis/cortes explícitos; filtro de temporada e erros de aposta/fórmula; ordem de temporadas; toda a cesta e todas as estatísticas compilam; célula → estratégia reproduz a célula (mesmo n e lucro), regra da faixa nos três formatos, Šidák, deflação e persistência. Total do laboratório: **214**.
- Produção (R2 `20260926-1640`, universo ligas do BDB + campeonatos = 80 ligas, 122.980 jogos), 12 apostas (6 × 2 casas) cruzadas com a forma do mandante: carga 531 chunks / 37 MB em 25 s no servidor (no navegador fica em cache), **explorar 1,3 s**, 12.998 células, resultado 2,8 MB.
- Leitura de amostra: as melhores células por liga (n ≥ 300) têm yield de 7–12% com p entre 0,006 e 0,17, e CLV negativo em todas: exatamente o tipo de "vantagem" que a deflação e a persistência existem para questionar antes de virar estratégia.

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
