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
  fonteExtra: 'Ligas que só existem na base histórica Football-Data (FPT). Aumentam a amostra, mas têm menos colunas de odds e estatísticas.',
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
} as const
