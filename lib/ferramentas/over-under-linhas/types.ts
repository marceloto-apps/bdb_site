/** Input da linha âncora */
export interface AncoraInput {
  line: number     // 1.5 a 5.5
  under: number    // odd Under
  over: number     // odd Over
}

/** Linha projetada na tabela */
export interface LinhaProjetada {
  label: string        // "Gols 2.50"
  line: number
  under: string        // odd formatada
  over: string         // odd formatada
  probUnder: string    // percentual formatado
  probOver: string     // percentual formatado
  juice: string        // percentual formatado
  isAnchor: boolean
}

/** Estatísticas extraídas da âncora */
export interface ProjecaoStats {
  juice: number
  lambda: number
}
