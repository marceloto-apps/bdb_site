/** Continente por país (pt-BR/en), mesma tabela do backtest atual, para o seletor de ligas. */
export const CONTINENTES = ['Europa', 'América do Sul', 'América do Norte', 'Ásia & Oceania', 'África', 'Internacional / Outros'] as const
export type Continente = (typeof CONTINENTES)[number]

const SUL = ['brasil', 'brazil', 'argentina', 'uruguay', 'uruguai', 'colombia', 'colômbia', 'paraguay', 'paraguai', 'ecuador', 'equador', 'bolivia', 'bolívia', 'chile', 'peru', 'venezuela']
const NORTE = ['usa', 'eua', 'estados unidos', 'canada', 'canadá', 'mexico', 'méxico', 'costa rica', 'honduras']
const EUROPA = ['italy', 'italia', 'itália', 'england', 'inglaterra', 'germany', 'alemanha', 'netherlands', 'holanda', 'países baixos', 'portugal', 'belgium', 'bélgica', 'spain', 'espanha', 'denmark', 'dinamarca', 'poland', 'polônia', 'serbia', 'sérvia', 'bulgaria', 'bulgária', 'norway', 'noruega', 'sweden', 'suécia', 'finland', 'finlândia', 'ireland', 'irlanda', 'france', 'frança', 'greece', 'grécia', 'turkey', 'turquia', 'scotland', 'escócia', 'austria', 'áustria', 'switzerland', 'suíça', 'ukraine', 'ucrânia', 'croatia', 'croácia', 'czech republic', 'república tcheca', 'tchéquia', 'romania', 'romênia', 'hungary', 'hungria', 'russia', 'rússia', 'wales', 'país de gales', 'northern ireland', 'irlanda do norte', 'slovakia', 'eslováquia', 'slovenia', 'eslovênia', 'iceland', 'islândia', 'cyprus', 'chipre', 'israel', 'belarus', 'bielorrússia', 'georgia', 'geórgia', 'azerbaijan', 'azerbaijão', 'kazakhstan', 'cazaquistão', 'lithuania', 'lituânia', 'latvia', 'letônia', 'estonia', 'estônia', 'luxembourg', 'luxemburgo', 'malta', 'albania', 'albânia', 'bosnia', 'bósnia', 'montenegro', 'north macedonia', 'macedônia do norte', 'moldova', 'moldávia', 'armenia', 'armênia', 'faroe islands', 'ilhas faroé', 'andorra', 'gibraltar', 'kosovo']
const ASIA = ['japan', 'japão', 'south korea', 'coreia do sul', 'china', 'australia', 'austrália', 'saudi arabia', 'arábia saudita', 'qatar', 'catar', 'uae', 'emirados árabes unidos', 'iran', 'irã', 'india', 'índia', 'indonesia', 'indonésia', 'thailand', 'tailândia', 'vietnam', 'vietnã', 'malaysia', 'malásia', 'uzbekistan', 'uzbequistão', 'new zealand', 'nova zelândia', 'hong kong', 'singapore', 'singapura']
const AFRICA = ['egypt', 'egito', 'morocco', 'marrocos', 'algeria', 'argélia', 'tunisia', 'tunísia', 'south africa', 'áfrica do sul', 'nigeria', 'nigéria', 'ghana', 'gana', 'senegal', 'cameroon', 'camarões', 'ivory coast', 'costa do marfim', 'kenya', 'quênia']

export function continenteDe(pais: string | null | undefined, slug?: string | null): Continente {
  const c = (pais ?? '').toLowerCase().trim()
  const s = (slug ?? '').toLowerCase()
  if (SUL.includes(c) || s.includes('brasileirao') || s.includes('uruguay')) return 'América do Sul'
  if (NORTE.includes(c) || s.includes('mls') || s.includes('usl') || s.includes('canadian')) return 'América do Norte'
  if (EUROPA.includes(c) || s.includes('bundesliga') || s.includes('laliga') || s.includes('eredivisie') || s.includes('championship')) return 'Europa'
  if (ASIA.includes(c) || s.includes('j1') || s.includes('j2') || s.includes('k-league') || s.includes('cfa-super')) return 'Ásia & Oceania'
  if (AFRICA.includes(c)) return 'África'
  return 'Internacional / Outros'
}
