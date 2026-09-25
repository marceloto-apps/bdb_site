/** Parse + resolução + validação de uma fórmula de indicador isolada (sem outros indicadores). */
import { catalogoPadrao } from '../engine/catalogo'
import { ErroExpressao, resolver, validar, type No } from '../engine/ast'
import { parseExpressao } from '../engine/parser'

export function compilarIndicador(formula: string): { ast: No; tipo: string } | { erros: string[] } {
  const cat = catalogoPadrao()
  try {
    const ast = resolver(parseExpressao(formula), { ehCampo: cat.ehCampo, indicadores: new Set() })
    const v = validar(ast, { tipoCampo: cat.tipoCampo, tipoIndicador: () => undefined })
    if (!v.ok) return { erros: v.erros }
    return { ast, tipo: v.tipo }
  } catch (e) {
    if (e instanceof ErroExpressao) return { erros: [e.message] }
    throw e
  }
}
