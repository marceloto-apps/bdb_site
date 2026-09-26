/**
 * Rótulos em português e dicas (tooltips) da UI do Laboratório. Centraliza a nomenclatura para que os
 * nomes técnicos do engine (`home`, `ou`, `leakage`, `core`…) apareçam ao usuário como texto claro.
 */
import type { Mercado } from '../engine/tipos'

/** Seleções (lado da aposta) — inclui as da dupla chance nos dois formatos usados pelo engine. */
export const ROTULO_SELECAO: Record<string, string> = {
  home: 'Mandante', draw: 'Empate', away: 'Visitante', over: 'Over (mais)', under: 'Under (menos)', yes: 'Sim', no: 'Não',
  dc_1x: 'Mandante ou empate (1X)', dc_x2: 'Empate ou visitante (X2)', dc_12: 'Mandante ou visitante (12)',
  '1x': 'Mandante ou empate (1X)', x2: 'Empate ou visitante (X2)', '12': 'Mandante ou visitante (12)',
  other: 'Outro placar',
}
export const rotuloSelecao = (s: string): string => ROTULO_SELECAO[s] ?? (/^\d_\d$/.test(s) ? s.replace('_', '×') : s)

export const ROTULO_MERCADO: Record<Mercado, string> = {
  '1x2': 'Resultado final (1X2)', btts: 'Ambas marcam', ou: 'Total de gols (Over/Under)', ah: 'Handicap asiático', corners: 'Escanteios (Over/Under)',
  ht_1x2: '1º tempo — resultado (1X2)', ht_ou: '1º tempo — total de gols', ht_ah: '1º tempo — handicap asiático', dc: 'Dupla chance', eh: 'Handicap europeu', cs: 'Placar exato',
}
export const rotuloMercado = (m: string): string => ROTULO_MERCADO[m as Mercado] ?? m

export const ROTULO_CASA: Record<string, string> = { bet365: 'bet365', pinnacle: 'Pinnacle' }
export const ROTULO_SNAPSHOT: Record<string, string> = { open: 'abertura', close: 'fechamento' }

/** Blocos do catálogo de dados. */
export const ROTULO_BLOCO: Record<string, string> = {
  match: 'Partida (data, rodada, placar)', odds: 'Odds (bet365 e Pinnacle)', derived: 'Movimento do mercado', team: 'Estatísticas dos times', league: 'Médias da liga',
}

/** Tipos de aviso do run. */
export const ROTULO_AVISO: Record<string, string> = {
  leakage: 'Vazamento de futuro', amostra: 'Amostra pequena', referencia: 'Referência', cobertura: 'Cobertura', universo: 'Universo', staking: 'Stake', formula: 'Fórmula',
}

export const ROTULO_RESULTADO: Record<string, string> = { WIN: 'Ganhou', HALF_WIN: 'Meio ganho', REFUND: 'Devolvida', HALF_LOSS: 'Meia perda', LOSS: 'Perdeu', VOID: 'Anulada' }

/** Unidades dos campos/indicadores (badge). */
export const ROTULO_TIPO: Record<string, string> = {
  odd: 'odd', prob: 'probabilidade', line: 'linha', count: 'contagem', rate: 'taxa', pct: '%', goals: 'gols', xg: 'xG', days: 'dias', points: 'pontos',
  bool: 'sim/não', int: 'inteiro', id: 'identificador', date: 'data', text: 'texto', ratio: 'razão', elo: 'Elo',
}
export const rotuloTipo = (t: string): string => ROTULO_TIPO[t] ?? t

/** Dicas (tooltips) por campo da UI. Texto curto, em linguagem de apostador. */
export const DICAS = {
  // 1. Universo
  fonteBdb: 'Ligas que o BDB acompanha diariamente, com odds da bet365 e da Pinnacle. É a mesma base do Backtest tradicional e a mais completa.',
  fonteExtra: 'Ligas que só existem na base histórica FutPythonTrader (FPT). Aumentam a amostra, mas têm menos colunas de odds e estatísticas.',
  tipoLiga: 'Campeonatos por pontos corridos (Brasileirão, Premier League…).',
  tipoCopa: 'Mata-mata e torneios internacionais de clubes (Copa do Brasil, Libertadores…).',
  temporadas: 'Deixe vazio para usar todas. "24/25" é uma temporada europeia; "2025" é anual, como o Brasileirão.',
  rodadasIniciais: 'Ignora as primeiras N rodadas de cada temporada, quando as estatísticas de forma ainda têm poucos jogos.',
  cobertura: 'O jogo só entra no universo se tiver o dado marcado. Use para não misturar jogos com e sem a odd que a estratégia precisa.',
  // 2. Indicadores
  indicadores: 'Um indicador é um cálculo com nome (ex.: edge_h). Depois de criado, você usa o nome na regra, na seleção da aposta ou no stake.',
  catalogo: 'Todos os dados disponíveis por jogo. Clique para copiar o nome técnico e cole na fórmula.',
  // 3. Regra
  regra: 'Condição que o jogo precisa cumprir para gerar aposta. Vazia = todos os jogos do universo.',
  modoVisual: 'Monte a regra com menus, sem digitar fórmula.',
  modoFormula: 'Escreva a regra como texto. Necessário para funções (model, implied…) e parênteses.',
  // 4. Apostas
  aposta: 'Cada bloco é uma aposta feita em todo jogo que passar pela regra. A maioria das estratégias usa uma só; use mais para apostar em dois mercados no mesmo jogo.',
  idAposta: 'Nome curto da aposta; aparece na tabela de resultados e no CSV.',
  selecao: 'Lado da aposta. "Expressão" deixa a fórmula escolher o lado jogo a jogo (ex.: quem tiver maior edge).',
  linha: 'Principal = a linha com odds mais equilibradas na casa escolhida naquele jogo. Fixa = sempre a mesma (ex.: 2.5).',
  precoDecisao: 'Odd que a estratégia "vê" na hora de apostar. Abertura = primeira odd publicada; fechamento = última antes do jogo.',
  liquidacao: 'Odd usada para pagar a aposta. Normalmente é a mesma da decisão; mude só para simular cenários (ex.: decidir na abertura e liquidar no fechamento).',
  oddMinMax: 'Só aposta se a odd estiver nesta faixa.',
  slippage: 'Desconto na odd para simular piora de preço entre ver e apostar. 2 = odd 2,00 vira 1,96.',
  stakeMult: 'Multiplica o stake desta aposta em relação ao método definido no passo 5.',
  condicaoExtra: 'Condição adicional só para esta aposta, além da regra geral.',
  // 5. Stake
  flat: 'Sempre a mesma quantidade de unidades por aposta.',
  pctBanco: 'Percentual do banco atual em cada aposta; o stake cresce e encolhe com o banco.',
  kelly: 'Stake proporcional à vantagem estimada. Precisa de uma probabilidade (expressão) e usa uma fração do Kelly cheio para reduzir a variância.',
  toWin: 'Ajusta o stake para que toda aposta vencedora dê o mesmo lucro.',
  banco: 'Banco inicial em unidades. Necessário para % do banco e Kelly.',
  exposicao: 'Soma máxima de stakes em aberto num mesmo dia. Vazio = sem limite.',
  stopDrawdown: 'Para de apostar quando a queda desde o pico do banco atinge este percentual.',
  referencia: 'Odd de fechamento usada como "verdade" para calcular EV e CLV. Pinnacle é o padrão do mercado; quando falta, usa a bet365 (contado como "soft").',
  bootstrap: 'Quantas reamostras (por dia) usar para o intervalo de confiança. Mais = mais preciso e mais lento.',
  semente: 'Número que fixa o sorteio do bootstrap para o resultado ser reproduzível.',
  parametros: 'Valores que a fórmula lê como $nome (ex.: $p1). Úteis para variar um limiar sem reescrever a regra.',
  // Tearsheet
  yield: 'Lucro dividido pelo total apostado.',
  roiBanco: 'Lucro dividido pelo banco inicial. "Flat" é o yield que teria com stake fixo de 1 unidade.',
  hitRate: 'Percentual de apostas ganhas. Break-even é o acerto necessário para empatar com a odd média.',
  mdd: 'Maior queda desde um pico do banco, em unidades e em %, com quantas apostas durou e quantas levou para recuperar.',
  clv: 'Closing Line Value: quanto a odd apostada foi melhor que a odd justa do fechamento. Positivo e consistente é o melhor sinal de que a estratégia tem vantagem real.',
  yieldEsperado: 'Yield que a estratégia deveria ter se as odds de fechamento fossem a probabilidade verdadeira. Compare com o yield real.',
  pValor: 'Chance de um yield igual ou maior surgir por sorte se a estratégia não tivesse vantagem. Abaixo de 0,05 é o critério usual.',
  ic95: 'Faixa em que o yield "verdadeiro" provavelmente está, com 95% de confiança, por bootstrap. "n mín." é quantas apostas seriam necessárias para o resultado ser significativo.',
  sharpe: 'Sharpe: retorno por unidade de risco. Profit factor (PF): total ganho dividido pelo total perdido; acima de 1 é lucro.',
  beatRate: 'Percentual de apostas em que a odd apostada foi maior que a odd justa do fechamento.',
  // 6. Validação
  holdout: 'A temporada mais recente de cada liga fica escondida enquanto você ajusta a regra. Quando abrir o selo, ela vira o teste final: um resultado que você não pôde "ajustar".',
  folds: 'Divide as apostas por temporada ou por ano e mostra se o lucro se repete em cada corte ou veio de um período só.',
  walkForward: 'Divide o tempo em janelas iguais (por quantidade de jogos). Em cada uma, a estratégia é avaliada só nos jogos seguintes ao "treino". Com varredura, os parâmetros são escolhidos no treino e testados depois.',
  wfe: 'Walk-Forward Efficiency: yield fora da amostra dividido pelo yield no treino. Perto de 1 é ótimo; abaixo de 0,5 indica que o ajuste não se transfere.',
  varredura: 'Testa várias combinações dos parâmetros $p de uma vez e mostra o mapa de yield e número de apostas. Cada combinação conta como uma tentativa.',
  tentativas: 'Quantas variações da estratégia já foram avaliadas (registradas ao salvar resultados + as desta varredura). Quanto mais tentativas, mais fácil achar um resultado bom por sorte.',
  deflacao: 'p-valor corrigido pelo número de tentativas: 1 − (1 − p)^N. Se o original passa de 5% e o deflacionado não, o resultado provavelmente é fruto de seleção.',
  pbo: 'Probabilidade de overfit: em quantas divisões treino/teste a melhor combinação no treino ficou abaixo da mediana no teste. Acima de 50% é sinal de ajuste excessivo.',
  monteCarlo: 'Refaz as apostas do run milhares de vezes em ordem sorteada, com o mesmo stake, para ver a faixa de lucro e de queda que a mesma estratégia poderia ter produzido.',
  ruina: 'Queda desde o pico do banco, em %, que você considera insuportável. A chance de ruína é a fração de caminhos que chega lá.',
  selecaoAleatoria: 'Mesmas apostas (mercado, lado, casa), mas em jogos sorteados do universo. Se a regra não escolher jogos melhores que o acaso, o yield real fica dentro dessa distribuição.',
  calibracao: 'Compara a probabilidade que a estratégia estima com o que aconteceu e com a probabilidade justa da Pinnacle. Só faz sentido quando a regra ou o Kelly usam uma probabilidade.',
  brier: 'Erro quadrático médio da probabilidade (0 = perfeito). Menor que o da referência = prevê melhor que o mercado.',
  // Explorar
  cesta: 'Cada aposta marcada é feita em TODOS os jogos do universo, com 1 unidade. Não há regra: a ideia é ver em quais ligas e situações a aposta cega já paga (ou perde pouco).',
  cruzamento: 'Divide os jogos em faixas de uma estatística (ex.: forma do mandante baixa, média, alta) e mostra o resultado de cada aposta em cada faixa. É a forma mais simples de ver se a estatística "explica" alguma vantagem.',
  nMin: 'Células com menos apostas que isso ficam apagadas: resultados com poucas apostas são quase sempre sorte.',
  celulas: 'Quantas células (liga × aposta × faixa) têm amostra suficiente. Quanto mais células você olha, mais fácil achar uma boa por acaso; por isso o p-valor de cada célula é deflacionado por esse número.',
  persistencia: 'Em quantas temporadas (com amostra) a aposta deu lucro naquela liga. 3 de 3 vale muito mais que 1 de 3.',
  ece: 'Expected Calibration Error: diferença média entre a probabilidade prevista e a frequência observada, por faixa. Abaixo de 3% é bem calibrada.',
} as const
