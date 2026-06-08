// Limite mensal de pontos GANHOS por plano (não afeta resgates).
export const LIMITE_MENSAL_POR_PLANO: Record<string, number> = {
  FREE: 300,
  VIP_BASICO: 1000,
  VIP_PRO: 2500,
};

// Faixas de status calculadas sobre GANHOS dos últimos 12 meses.
export const FAIXAS_STATUS = [
  { nome: "Bronze",   min: 0 },
  { nome: "Prata",    min: 500 },
  { nome: "Ouro",     min: 2000 },
  { nome: "Diamante", min: 5000 },
] as const;

export const MESES_EXPIRACAO = 12;
export const HORIZONTE_EXPIRACAO_DIAS = 60; // Janela exibida no dashboard
