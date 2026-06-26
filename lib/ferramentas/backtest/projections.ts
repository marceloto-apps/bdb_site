// lib/ferramentas/backtest/projections.ts

import { matrizPlacaresPoisson, calcularMercados } from "@/lib/analytics/poisson";
import { matrizPlacaresZIP } from "@/lib/analytics/zero-inflated";
import { matrizPlacaresNB } from "@/lib/analytics/negative-binomial";
import { matrizPlacaresDixonColes } from "@/lib/analytics/dixon-coles";

export type ProjectionsModel = "POISSON" | "ZIP" | "NB" | "DIXON_COLES";
export type ProjectionsLambdaMethod = "MEDIA_SIMPLES" | "FORCAS_RELATIVAS" | "XG";

export interface ProjectionTeamStats {
  avgGoalsScored: number;
  avgGoalsConceded: number;
  xg?: number | null;
}

export interface ProjectionLeagueParams {
  muH: number;
  muA: number;
  varH: number;
  varA: number;
  piH: number;
  piA: number;
  rho: number;
  muH_xg?: number | null; // Média xG mandante na liga
  muA_xg?: number | null; // Média xG visitante na liga
}

export interface ProjectionParams {
  model: ProjectionsModel;
  lambdaMethod: ProjectionsLambdaMethod;
  homeStats: ProjectionTeamStats;
  awayStats: ProjectionTeamStats;
  leagueParams: ProjectionLeagueParams;
}

export interface ProjectionResults {
  lambdaH: number;
  lambdaA: number;
  probHome: number;
  probDraw: number;
  probAway: number;
  probOver25: number;
  probUnder25: number;
  probBtts: number;
}

/**
 * Normaliza uma matriz de probabilidades garantindo que a soma dos elementos seja exatamente 1.0.
 */
export function normalizarMatriz(matriz: number[][]): number[][] {
  let soma = 0;
  const maxH = matriz.length;
  for (let h = 0; h < maxH; h++) {
    const maxA = matriz[h].length;
    for (let a = 0; a < maxA; a++) {
      soma += matriz[h][a];
    }
  }

  if (soma > 0 && Math.abs(soma - 1.0) > 1e-6) {
    for (let h = 0; h < maxH; h++) {
      const maxA = matriz[h].length;
      for (let a = 0; a < maxA; a++) {
        matriz[h][a] /= soma;
      }
    }
  }
  return matriz;
}

/**
 * Gera a matriz 11x11 de placares projetados e os lambdas calculados.
 */
export function gerarMatrizProjecao(params: ProjectionParams): { matriz: number[][]; lambdaH: number; lambdaA: number } {
  const { model, lambdaMethod, homeStats, awayStats, leagueParams } = params;

  // 1. Calcular Lambdas (λ_H, λ_A)
  let lambdaH = 0;
  let lambdaA = 0;

  if (lambdaMethod === "MEDIA_SIMPLES") {
    lambdaH = (homeStats.avgGoalsScored + awayStats.avgGoalsConceded) / 2;
    lambdaA = (awayStats.avgGoalsScored + homeStats.avgGoalsConceded) / 2;
  } else if (lambdaMethod === "FORCAS_RELATIVAS") {
    const fcAtCHome = homeStats.avgGoalsScored / (leagueParams.muH || 1.0);
    const fcDfVAway = awayStats.avgGoalsConceded / (leagueParams.muH || 1.0);
    const fcAtVAway = awayStats.avgGoalsScored / (leagueParams.muA || 1.0);
    const fcDfCHome = homeStats.avgGoalsConceded / (leagueParams.muA || 1.0);

    lambdaH = fcAtCHome * fcDfVAway * leagueParams.muH;
    lambdaA = fcAtVAway * fcDfCHome * leagueParams.muA;
  } else if (lambdaMethod === "XG") {
    const muH_xg = leagueParams.muH_xg || 1.0;
    const muA_xg = leagueParams.muA_xg || 1.0;

    const xgScoredHome = homeStats.xg ?? homeStats.avgGoalsScored;
    const xgConcededAway = awayStats.xg ?? awayStats.avgGoalsConceded;
    const xgScoredAway = awayStats.xg ?? awayStats.avgGoalsScored;
    const xgConcededHome = homeStats.xg ?? homeStats.avgGoalsConceded;

    const fcAtCHome = xgScoredHome / muH_xg;
    const fcDfVAway = xgConcededAway / muH_xg;
    const fcAtVAway = xgScoredAway / muA_xg;
    const fcDfCHome = xgConcededHome / muA_xg;

    lambdaH = fcAtCHome * fcDfVAway * muH_xg;
    lambdaA = fcAtVAway * fcDfCHome * muA_xg;
  }

  // Clampar lambdas para evitar infinitos ou valores zerados indevidos
  lambdaH = Math.max(0.01, Math.min(lambdaH, 10.0));
  lambdaA = Math.max(0.01, Math.min(lambdaA, 10.0));

  // 2. Gerar Matriz de Distribuição
  let matriz: number[][];

  switch (model) {
    case "POISSON":
      matriz = matrizPlacaresPoisson(lambdaH, lambdaA);
      break;

    case "ZIP":
      matriz = matrizPlacaresZIP(lambdaH, lambdaA, leagueParams.piH, leagueParams.piA);
      break;

    case "NB":
      const resNB = matrizPlacaresNB(lambdaH, lambdaA, leagueParams.varH, leagueParams.varA);
      matriz = resNB.matriz;
      break;

    case "DIXON_COLES":
      const resDC = matrizPlacaresDixonColes(lambdaH, lambdaA, leagueParams.rho);
      matriz = resDC.matriz;
      break;

    default:
      throw new Error(`Modelo não suportado: ${model}`);
  }

  // Normalizar a matriz para mitigar resíduos de cauda
  matriz = normalizarMatriz(matriz);

  return { matriz, lambdaH, lambdaA };
}

/**
 * Calcula as projeções matemáticas e lambdas pré-jogo usando o modelo e método solicitados.
 */
export function calcularProjecaoJogo(params: ProjectionParams): ProjectionResults {
  const { matriz, lambdaH, lambdaA } = gerarMatrizProjecao(params);

  // 3. Calcular Mercados Derivados
  const mercados = calcularMercados(matriz);

  return {
    lambdaH: Number(lambdaH.toFixed(4)),
    lambdaA: Number(lambdaA.toFixed(4)),
    probHome: Number(mercados.casa.toFixed(4)),
    probDraw: Number(mercados.empate.toFixed(4)),
    probAway: Number(mercados.visit.toFixed(4)),
    probOver25: Number(mercados.over25.toFixed(4)),
    probUnder25: Number((1.0 - mercados.over25).toFixed(4)),
    probBtts: Number(mercados.btts.toFixed(4)),
  };
}

