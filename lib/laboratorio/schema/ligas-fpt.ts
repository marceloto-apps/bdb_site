/**
 * Mapa das competições que existem só na FutPythonTrader (sem `Competition` no núcleo).
 * Fase 0 do Backtest Livre — docs/Backtest_Livre_Plano.md §4.1.1 item 2.
 *
 * Chave = `rawLeague` exato da tabela `fpt_bet365_historical`. As 71 ligas mapeadas em
 * `competition_external_ids` (fonte FPT_BET365) não entram aqui: para elas a feature store usa a
 * `Competition` do núcleo.
 *
 * `incluidaPorPadrao`: entra no universo padrão do laboratório. Feminino, seleções, copas de
 * eliminação e ligas com amostra muito pequena ficam fora por padrão (o usuário pode ligar).
 */

export type TipoLigaFpt = 'LEAGUE' | 'CUP' | 'INTERNATIONAL_CLUBS' | 'NATIONAL_TEAMS'

export interface LigaFpt {
  rawLeague: string
  rawCountry: string
  /** País/região em pt-BR, no mesmo padrão de `Competition.country` */
  pais: string
  /** ISO 3166-1 alpha-2, ou código de região (EU, SA, WW) */
  iso: string
  /** Nível da pirâmide (1 = elite). Copas e torneios internacionais: null */
  nivel: number | null
  tipo: TipoLigaFpt
  feminino: boolean
  /** Nome de exibição em pt-BR */
  nome: string
  incluidaPorPadrao: boolean
  /** Jogos na FPT em 24/09/2026 (referência; não é usado em runtime) */
  jogosRef: number
  observacao?: string
}

const L = (
  rawLeague: string, rawCountry: string, pais: string, iso: string, nivel: number | null,
  tipo: TipoLigaFpt, nome: string, jogosRef: number, extra: Partial<LigaFpt> = {},
): LigaFpt => ({
  rawLeague, rawCountry, pais, iso, nivel, tipo, nome, jogosRef,
  feminino: false,
  incluidaPorPadrao: tipo === 'LEAGUE' && jogosRef >= 300,
  ...extra,
})

export const LIGAS_FPT: LigaFpt[] = [
  // ── Argentina ──
  L('ARGENTINA 3', 'ARGENTINA', 'Argentina', 'AR', 3, 'LEAGUE', 'Primera B Metropolitana / Federal A', 3149, { observacao: 'A FPT junta as duas terceiras divisões numa chave só' }),
  L('ARGENTINA CUP', 'ARGENTINA', 'Argentina', 'AR', null, 'CUP', 'Copa Argentina', 203),
  // ── Austrália ──
  L('AUSTRALIA 1', 'AUSTRALIA', 'Austrália', 'AU', 1, 'LEAGUE', 'A-League', 995),
  L('AUSTRALIA 2', 'AUSTRALIA', 'Austrália', 'AU', 2, 'LEAGUE', 'NPL / Australia Cup (fase final)', 55, { incluidaPorPadrao: false, observacao: 'Amostra mínima' }),
  // ── Bolívia ──
  L('BOLIVIA CUP', 'BOLIVIA', 'Bolívia', 'BO', null, 'CUP', 'Copa Bolívia', 236),
  // ── Bósnia ──
  L('BOSNIA 1', 'BOSNIA-AND-HERZEGOVINA', 'Bósnia e Herzegovina', 'BA', 1, 'LEAGUE', 'Premijer Liga', 1007),
  L('BOSNIA 2', 'BOSNIA-AND-HERZEGOVINA', 'Bósnia e Herzegovina', 'BA', 2, 'LEAGUE', 'Prva Liga FBiH / RS', 1152, { incluidaPorPadrao: false, observacao: 'Sem estatísticas; odds 1X2 em 53%' }),
  // ── Brasil ──
  L('BRAZIL 3', 'BRAZIL', 'Brasil', 'BR', 3, 'LEAGUE', 'Brasileirão Série C', 1268),
  L('BRAZIL 4', 'BRAZIL', 'Brasil', 'BR', 4, 'LEAGUE', 'Brasileirão Série D', 3168),
  L('BRAZIL CUP', 'BRAZIL', 'Brasil', 'BR', null, 'CUP', 'Copa do Brasil', 760),
  L('WOM BRAZIL 1', 'BRAZIL', 'Brasil', 'BR', 1, 'LEAGUE', 'Brasileirão Feminino A1', 833, { feminino: true, incluidaPorPadrao: false }),
  // ── Bulgária ──
  L('BULGARIA 2', 'BULGARIA', 'Bulgária', 'BG', 2, 'LEAGUE', 'Vtora Liga', 1703),
  // ── Chile ──
  L('CHILE 2', 'CHILE', 'Chile', 'CL', 2, 'LEAGUE', 'Primera B', 1467),
  L('CHILE CUP', 'CHILE', 'Chile', 'CL', null, 'CUP', 'Copa Chile', 585),
  // ── China ──
  L('CHINA 2', 'CHINA', 'China', 'CN', 2, 'LEAGUE', 'China League One', 1519),
  // ── Colômbia ──
  L('COLOMBIA 2', 'COLOMBIA', 'Colômbia', 'CO', 2, 'LEAGUE', 'Primera B', 1703),
  L('COLOMBIA CUP', 'COLOMBIA', 'Colômbia', 'CO', null, 'CUP', 'Copa Colombia', 86),
  // ── Croácia ──
  L('CROATIA 2', 'CROATIA', 'Croácia', 'HR', 2, 'LEAGUE', 'Prva NL', 1078),
  // ── Chipre ──
  L('CYPRUS 2', 'CYPRUS', 'Chipre', 'CY', 2, 'LEAGUE', 'Segunda Divisão', 1164, { incluidaPorPadrao: false, observacao: 'Sem estatísticas; odds 1X2 em 73%' }),
  // ── República Tcheca ──
  L('CZECH 2', 'CZECH-REPUBLIC', 'República Tcheca', 'CZ', 2, 'LEAGUE', 'FNL', 1264),
  // ── Dinamarca ──
  L('DENMARK 2', 'DENMARK', 'Dinamarca', 'DK', 2, 'LEAGUE', '1. Division', 1008),
  // ── Equador ──
  L('ECUADOR 2', 'ECUADOR', 'Equador', 'EC', 2, 'LEAGUE', 'Serie B', 1067),
  L('ECUADOR CUP', 'ECUADOR', 'Equador', 'EC', null, 'CUP', 'Copa Ecuador', 182),
  // ── Egito ──
  L('EGYPT 2', 'EGYPT', 'Egito', 'EG', 2, 'LEAGUE', 'Segunda Divisão', 1029, { incluidaPorPadrao: false, observacao: 'Sem estatísticas' }),
  // ── Inglaterra ──
  L('ENGLAND 5', 'ENGLAND', 'Inglaterra', 'GB-ENG', 5, 'LEAGUE', 'National League', 2835),
  L('ENGLAND CUP', 'ENGLAND', 'Inglaterra', 'GB-ENG', null, 'CUP', 'FA Cup / EFL Cup / EFL Trophy', 2982, { observacao: 'A FPT junta as copas inglesas numa chave só; odds 1X2 em 66%' }),
  L('WOM ENGLAND 1', 'ENGLAND', 'Inglaterra', 'GB-ENG', 1, 'LEAGUE', "Women's Super League", 675, { feminino: true, incluidaPorPadrao: false }),
  // ── Estônia ──
  L('ESTONIA 1', 'ESTONIA', 'Estônia', 'EE', 1, 'LEAGUE', 'Meistriliiga', 1026),
  L('ESTONIA 2', 'ESTONIA', 'Estônia', 'EE', 2, 'LEAGUE', 'Esiliiga', 1023, { incluidaPorPadrao: false, observacao: 'Estatísticas em 13%' }),
  // ── Europa (clubes e seleções) ──
  L('EUROPA CHAMPIONS LEAGUE', 'EUROPE', 'Europa', 'EU', null, 'INTERNATIONAL_CLUBS', 'UEFA Champions League', 1289, { incluidaPorPadrao: true }),
  L('EUROPA LEAGUE', 'EUROPE', 'Europa', 'EU', null, 'INTERNATIONAL_CLUBS', 'UEFA Europa League', 1147, { incluidaPorPadrao: true }),
  L('EUROPA CONFERENCE LEAGUE', 'EUROPE', 'Europa', 'EU', null, 'INTERNATIONAL_CLUBS', 'UEFA Conference League', 1908, { incluidaPorPadrao: true }),
  L('WORLD EUROCUP', 'EUROPE', 'Europa', 'EU', null, 'NATIONAL_TEAMS', 'Eurocopa (e eliminatórias)', 2017, { observacao: 'Inclui 1998–2020 com odds parciais' }),
  L('WORLD UEFA NATIONS LEAGUE', 'EUROPE', 'Europa', 'EU', null, 'NATIONAL_TEAMS', 'UEFA Nations League', 656),
  // ── França ──
  L('FRANCE 3', 'FRANCE', 'França', 'FR', 3, 'LEAGUE', 'National', 1517),
  L('FRANCE 4', 'FRANCE', 'França', 'FR', 4, 'LEAGUE', 'National 2', 3522, { incluidaPorPadrao: false, observacao: 'Sem estatísticas; odds 1X2 em 68%' }),
  L('FRANCE CUP', 'FRANCE', 'França', 'FR', null, 'CUP', 'Coupe de France', 989),
  L('WOM FRANCE 1', 'FRANCE', 'França', 'FR', 1, 'LEAGUE', 'Première Ligue', 682, { feminino: true, incluidaPorPadrao: false }),
  // ── Alemanha ──
  L('GERMANY CUP', 'GERMANY', 'Alemanha', 'DE', null, 'CUP', 'DFB-Pokal', 347),
  L('WOM GERMANY 1', 'GERMANY', 'Alemanha', 'DE', 1, 'LEAGUE', 'Frauen-Bundesliga', 738, { feminino: true, incluidaPorPadrao: false }),
  // ── Grécia ──
  L('GREECE 2', 'GREECE', 'Grécia', 'GR', 2, 'LEAGUE', 'Super League 2', 1872, { observacao: 'Estatísticas em 11%' }),
  // ── Islândia ──
  L('ICELAND 1', 'ICELAND', 'Islândia', 'IS', 1, 'LEAGUE', 'Besta deild', 918),
  L('ICELAND 2', 'ICELAND', 'Islândia', 'IS', 2, 'LEAGUE', '1. deild', 811),
  // ── Israel ──
  L('ISRAEL 2', 'ISRAEL', 'Israel', 'IL', 2, 'LEAGUE', 'Liga Leumit', 1532, { observacao: 'Estatísticas em 5%' }),
  // ── Itália ──
  L('ITALY 3', 'ITALY', 'Itália', 'IT', 3, 'LEAGUE', 'Serie C', 5805),
  L('ITALY 4', 'ITALY', 'Itália', 'IT', 4, 'LEAGUE', 'Serie D', 15055, { incluidaPorPadrao: false, observacao: 'Sem estatísticas; odds 1X2 em 68%; maior liga da FPT' }),
  L('ITALY CUP', 'ITALY', 'Itália', 'IT', null, 'CUP', 'Coppa Italia', 253),
  L('WOM ITALY 1', 'ITALY', 'Itália', 'IT', 1, 'LEAGUE', 'Serie A Femminile', 658, { feminino: true, incluidaPorPadrao: false }),
  // ── Japão ──
  L('JAPAN 3', 'JAPAN', 'Japão', 'JP', 3, 'LEAGUE', 'J3 League', 1728),
  // ── México ──
  L('MEXICO 2', 'MEXICO', 'México', 'MX', 2, 'LEAGUE', 'Liga de Expansión MX', 1445),
  // ── Holanda ──
  L('NETHERLANDS CUP', 'NETHERLANDS', 'Holanda', 'NL', null, 'CUP', 'KNVB Beker', 533),
  // ── Irlanda do Norte ──
  L('NORTHERN IRELAND 1', 'NORTHERN-IRELAND', 'Irlanda do Norte', 'GB-NIR', 1, 'LEAGUE', 'NIFL Premiership', 1205),
  L('NORTHERN IRELAND 2', 'NORTHERN-IRELAND', 'Irlanda do Norte', 'GB-NIR', 2, 'LEAGUE', 'NIFL Championship', 1204, { incluidaPorPadrao: false, observacao: 'Sem estatísticas' }),
  // ── Paraguai ──
  L('PARAGUAY 2', 'PARAGUAY', 'Paraguai', 'PY', 2, 'LEAGUE', 'División Intermedia', 1458),
  L('PARAGUAY CUP', 'PARAGUAY', 'Paraguai', 'PY', null, 'CUP', 'Copa Paraguay', 32),
  // ── Peru ──
  L('PERU 2', 'PERU', 'Peru', 'PE', 2, 'LEAGUE', 'Liga 2', 1007),
  // ── Polônia ──
  L('POLAND 2', 'POLAND', 'Polônia', 'PL', 2, 'LEAGUE', 'I liga', 1616),
  // ── Portugal ──
  L('PORTUGAL 3', 'PORTUGAL', 'Portugal', 'PT', 3, 'LEAGUE', 'Liga 3', 1612),
  L('PORTUGAL CUP', 'PORTUGAL', 'Portugal', 'PT', null, 'CUP', 'Taça de Portugal', 951),
  // ── Romênia ──
  L('ROMANIA 2', 'ROMANIA', 'Romênia', 'RO', 2, 'LEAGUE', 'Liga II', 1475),
  // ── Arábia Saudita ──
  L('SAUDI ARABIA 2', 'SAUDI-ARABIA', 'Arábia Saudita', 'SA', 2, 'LEAGUE', 'Yelo League', 1655),
  // ── Escócia ──
  L('SCOTLAND 3', 'SCOTLAND', 'Escócia', 'GB-SCT', 3, 'LEAGUE', 'League One', 964, { observacao: 'Sem estatísticas' }),
  L('SCOTLAND 4', 'SCOTLAND', 'Escócia', 'GB-SCT', 4, 'LEAGUE', 'League Two', 955, { observacao: 'Sem estatísticas' }),
  L('SCOTLAND CUP', 'SCOTLAND', 'Escócia', 'GB-SCT', null, 'CUP', 'Scottish Cup / League Cup', 1085),
  // ── Sérvia ──
  L('SERBIA 2', 'SERBIA', 'Sérvia', 'RS', 2, 'LEAGUE', 'Prva Liga', 1556),
  // ── Eslováquia ──
  L('SLOVAKIA 2', 'SLOVAKIA', 'Eslováquia', 'SK', 2, 'LEAGUE', '2. Liga', 1208),
  // ── Eslovênia ──
  L('SLOVENIA 2', 'SLOVENIA', 'Eslovênia', 'SI', 2, 'LEAGUE', '2. SNL', 1248, { observacao: 'Estatísticas em 3%' }),
  // ── África do Sul ──
  L('SOUTH AFRICA 2', 'SOUTH-AFRICA', 'África do Sul', 'ZA', 2, 'LEAGUE', 'Motsepe Foundation Championship', 1240, { incluidaPorPadrao: false, observacao: 'Sem estatísticas; odds 1X2 em 73%' }),
  // ── América do Sul (clubes e seleções) ──
  L('COPA LIBERTADORES', 'SOUTH-AMERICA', 'América do Sul', 'SA-CONMEBOL', null, 'INTERNATIONAL_CLUBS', 'Copa Libertadores', 925, { incluidaPorPadrao: true }),
  L('COPA SUDAMERICANA', 'SOUTH-AMERICA', 'América do Sul', 'SA-CONMEBOL', null, 'INTERNATIONAL_CLUBS', 'Copa Sul-Americana', 937, { incluidaPorPadrao: true }),
  L('WORLD AMERICA CUP', 'SOUTH-AMERICA', 'América do Sul', 'SA-CONMEBOL', null, 'NATIONAL_TEAMS', 'Copa América', 230),
  // ── Espanha ──
  L('SPAIN 3', 'SPAIN', 'Espanha', 'ES', 3, 'LEAGUE', 'Primera Federación', 3800),
  L('SPAIN 4', 'SPAIN', 'Espanha', 'ES', 4, 'LEAGUE', 'Segunda Federación', 7740, { incluidaPorPadrao: false, observacao: 'Sem estatísticas' }),
  L('SPAIN CUP', 'SPAIN', 'Espanha', 'ES', null, 'CUP', 'Copa del Rey', 642),
  L('SPAIN Primera Rfef Group 1', 'SPAIN', 'Espanha', 'ES', 3, 'LEAGUE', 'Primera Federación — Grupo 1 (2026/27)', 30, { incluidaPorPadrao: false, observacao: 'Chave nova da FPT em 2026/27; unificar com SPAIN 3 na Fase 1b' }),
  L('SPAIN Primera Rfef Group 2', 'SPAIN', 'Espanha', 'ES', 3, 'LEAGUE', 'Primera Federación — Grupo 2 (2026/27)', 30, { incluidaPorPadrao: false, observacao: 'Chave nova da FPT em 2026/27; unificar com SPAIN 3 na Fase 1b' }),
  L('WOM SPAIN 1', 'SPAIN', 'Espanha', 'ES', 1, 'LEAGUE', 'Liga F', 1224, { feminino: true, incluidaPorPadrao: false }),
  // ── Turquia ──
  L('TURKEY CUP', 'TURKEY', 'Turquia', 'TR', null, 'CUP', 'Türkiye Kupası', 811),
  // ── Ucrânia ──
  L('UKRAINE 2', 'UKRAINE', 'Ucrânia', 'UA', 2, 'LEAGUE', 'Persha Liga', 1121, { incluidaPorPadrao: false, observacao: 'Sem estatísticas' }),
  // ── Uruguai ──
  L('URUGUAY 2', 'URUGUAY', 'Uruguai', 'UY', 2, 'LEAGUE', 'Segunda División', 1176),
  // ── EUA ──
  L('WOM USA 1', 'USA', 'Estados Unidos', 'US', 1, 'LEAGUE', 'NWSL', 969, { feminino: true, incluidaPorPadrao: false }),
  // ── Venezuela ──
  L('VENEZUELA 1', 'VENEZUELA', 'Venezuela', 'VE', 1, 'LEAGUE', 'Liga FUTVE', 1456),
  L('VENEZUELA 2', 'VENEZUELA', 'Venezuela', 'VE', 2, 'LEAGUE', 'Segunda División', 1303, { incluidaPorPadrao: false, observacao: 'Sem estatísticas; odds 1X2 em 68%' }),
  // ── País de Gales ──
  L('WALES 1', 'WALES', 'País de Gales', 'GB-WLS', 1, 'LEAGUE', 'Cymru Premier', 1047),
  L('WALES CUP', 'WALES', 'País de Gales', 'GB-WLS', null, 'CUP', 'Welsh Cup', 722, { incluidaPorPadrao: false, observacao: 'Odds 1X2 em 51%' }),
  // ── Mundo (seleções) ──
  L('WORLD WORLD CUP', 'WORLD', 'Mundo', 'WW', null, 'NATIONAL_TEAMS', 'Copa do Mundo e eliminatórias', 6287, { observacao: 'A FPT junta Copa e eliminatórias; o núcleo tem só a Copa 2026 (Competition "Copa do Mundo 2026")' }),
]

/** Índice por rawLeague (chave exata da FPT). */
export const LIGAS_FPT_POR_CHAVE: ReadonlyMap<string, LigaFpt> = new Map(LIGAS_FPT.map((l) => [l.rawLeague, l]))

export function resumoLigasFpt() {
  const porTipo: Record<string, number> = {}
  let jogos = 0
  let jogosPadrao = 0
  for (const l of LIGAS_FPT) {
    porTipo[l.tipo] = (porTipo[l.tipo] ?? 0) + 1
    jogos += l.jogosRef
    if (l.incluidaPorPadrao) jogosPadrao += l.jogosRef
  }
  return { ligas: LIGAS_FPT.length, porTipo, jogos, jogosPadrao, femininas: LIGAS_FPT.filter((l) => l.feminino).length, padrao: LIGAS_FPT.filter((l) => l.incluidaPorPadrao).length }
}
