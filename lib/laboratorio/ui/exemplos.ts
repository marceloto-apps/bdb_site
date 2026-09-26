/**
 * Estratégias de exemplo carregáveis pela UI (guia "Como usar"). Espelham `scripts/laboratorio/exemplos/*.json`
 * com um texto explicando o que cada uma testa e o que observar no resultado.
 */
import type { Estrategia } from '../engine/tipos'

export interface Exemplo { id: string; titulo: string; oQueTesta: string; observar: string; estrategia: Estrategia }

const UNIVERSO_PADRAO = { fontes: ['core'] as ('core' | 'fpt')[], tipos: ['LEAGUE'] as ('LEAGUE' | 'CUP' | 'INTERNATIONAL_CLUBS')[] }
const FLAT = { metodo: 'flat' as const, unidade: 1 }

export const EXEMPLOS: Exemplo[] = [
  {
    id: 'edge-fechamento',
    titulo: 'Mandante com edge de 2% contra a Pinnacle e em boa forma',
    oQueTesta: 'Se a bet365 paga mais do que a probabilidade justa da Pinnacle sugere (edge), apostar no mandante quando ele soma pelo menos 1,5 ponto por jogo nos últimos 5.',
    observar: 'CLV no-vig positivo e beat rate acima de 50% mostram que a estratégia realmente pega odds melhores que o fechamento.',
    estrategia: {
      versao: 1, nome: 'Edge bet365 × Pinnacle no mandante', universo: UNIVERSO_PADRAO,
      indicadores: [{ nome: 'edge_h', expressao: { formula: 'odds.bet365.close.1x2.h * odds.pinnacle.close.1x2.novig_h - 1' } }],
      regra: { formula: 'edge_h > 0.02 and home.l5.pts_pg >= 1.5' },
      entradas: [{ id: 'e1', mercado: '1x2', selecao: 'home', preco: { casa: 'bet365', snapshot: 'close' } }],
      staking: FLAT, bancoInicial: 100, bootstrap: 1000, seed: 42,
    },
  },
  {
    id: 'linha-encurtou',
    titulo: 'Linha do mandante encurtou 7% ou mais na Pinnacle',
    oQueTesta: 'Seguir o dinheiro: quando a odd do mandante cai de abertura para fechamento (ex.: 2,00 → 1,85) e o time vem em forma.',
    observar: 'Como aposta no próprio fechamento da Pinnacle, o CLV será cerca de zero. O que importa aqui é o yield real e o p-valor.',
    estrategia: {
      versao: 1, nome: 'Linha encurtou ≥ 7% e mandante em forma', universo: UNIVERSO_PADRAO,
      regra: { formula: 'odds.pinnacle.close.1x2.h / odds.pinnacle.open.1x2.h < 0.93 and home.l5.pts_pg >= 1.8' },
      entradas: [{ id: 'e1', mercado: '1x2', selecao: 'home', preco: { casa: 'pinnacle', snapshot: 'close' } }],
      staking: FLAT, bancoInicial: 100, bootstrap: 1000, seed: 42,
    },
  },
  {
    id: 'modelo-over',
    titulo: 'Modelo Dixon-Coles acima do mercado no over 2.5',
    oQueTesta: 'Um modelo de gols (forças ataque/defesa dos últimos 10 jogos) que dá ao over 2.5 uma probabilidade pelo menos 5 pontos acima da probabilidade justa da bet365.',
    observar: 'O limiar está no parâmetro $p1 (passo 5). Mude para 0,03 ou 0,08 e compare os runs na aba Comparar.',
    estrategia: {
      versao: 1, nome: 'Dixon-Coles × mercado no over 2.5', universo: UNIVERSO_PADRAO, parametros: { p1: 0.05 },
      regra: { formula: 'model(DC, FORCAS, l10).p_over(2.5) - odds.bet365.close.ou.novig_over_main > $p1 and odds.bet365.close.ou.main_line == 2.5' },
      entradas: [{ id: 'e1', mercado: 'ou', selecao: 'over', linha: 2.5, preco: { casa: 'bet365', snapshot: 'close' } }],
      staking: FLAT, bancoInicial: 100, bootstrap: 1000, seed: 42,
    },
  },
  {
    id: 'favorito-gols',
    titulo: 'Favorito forte em jogo de muitos gols: over na linha principal',
    oQueTesta: 'Só com as linhas do mercado: handicap asiático de −0,75 ou mais para o mandante e linha de gols de 3,0 ou mais. Aposta no over da linha principal.',
    observar: 'Exemplo de regra que cabe no modo Visual (duas comparações com E). Veja a aba Segmentos por faixa de odd.',
    estrategia: {
      versao: 1, nome: 'Favorito forte + jogo de gols: over', universo: UNIVERSO_PADRAO,
      regra: { formula: 'odds.pinnacle.close.ah.main_line <= -0.75 and odds.pinnacle.close.ou.main_line >= 3.0' },
      entradas: [{ id: 'e1', mercado: 'ou', selecao: 'over', linha: 'main', preco: { casa: 'pinnacle', snapshot: 'close' } }],
      staking: FLAT, bancoInicial: 100, bootstrap: 1000, seed: 42,
    },
  },
  {
    id: 'xg-over-barato',
    titulo: 'xG combinado alto e over 2.5 barato',
    oQueTesta: 'Média entre o xG criado pelo mandante em casa e o xG cedido pelo visitante fora (últimos 10) acima de 1,7, com o over 2.5 da bet365 pagando mais que 1,82.',
    observar: 'Usa a função implied(odd) = 1/odd. Jogos sem xG (ligas menores) ficam de fora automaticamente; confira a cobertura no aviso amarelo.',
    estrategia: {
      versao: 1, nome: 'xG alto e over 2.5 barato', universo: UNIVERSO_PADRAO,
      regra: { formula: '(home.venue.l10.xg_for + away.venue.l10.xg_against) / 2 > 1.7 and implied(odds.bet365.close.ou.over_2_5) < 0.55' },
      entradas: [{ id: 'e1', mercado: 'ou', selecao: 'over', linha: 2.5, preco: { casa: 'bet365', snapshot: 'close' } }],
      staking: FLAT, bancoInicial: 100, bootstrap: 1000, seed: 42,
    },
  },
  {
    id: 'kelly-lado',
    titulo: 'Lado com maior edge, stake por Kelly 1/4',
    oQueTesta: 'Calcula o edge do mandante e do visitante, exige que o melhor passe de 2% e deixa a fórmula escolher o lado. O stake segue Kelly fracionário com a probabilidade justa da Pinnacle.',
    observar: 'Exemplo de seleção por expressão e de stake variável. Compare o ROI do banco com o yield flat na aba Risco.',
    estrategia: {
      versao: 1, nome: 'Melhor lado contra a Pinnacle, Kelly 1/4', universo: UNIVERSO_PADRAO,
      indicadores: [
        { nome: 'edge_h', expressao: { formula: 'odds.bet365.close.1x2.h * odds.pinnacle.close.1x2.novig_h - 1' } },
        { nome: 'edge_a', expressao: { formula: 'odds.bet365.close.1x2.a * odds.pinnacle.close.1x2.novig_a - 1' } },
        { nome: 'melhor', expressao: { formula: 'max(edge_h, edge_a)' } },
      ],
      regra: { formula: 'melhor > 0.02' },
      entradas: [{ id: 'e1', mercado: '1x2', selecao: { formula: 'if(edge_h >= edge_a, home, away)' }, preco: { casa: 'bet365', snapshot: 'close' } }],
      staking: { metodo: 'kelly', fracao: 0.25, cap: 0.05, prob: { formula: 'if(edge_h >= edge_a, odds.pinnacle.close.1x2.novig_h, odds.pinnacle.close.1x2.novig_a)' } },
      bancoInicial: 1000, bootstrap: 1000, seed: 42,
    },
  },
]
