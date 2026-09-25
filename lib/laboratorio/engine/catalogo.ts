/**
 * Ponte entre o engine e o catálogo do site. É o único ponto do engine que conhece
 * `lib/laboratorio/schema` (puro, sem Prisma) — o Worker pode, em vez disso, receber o JSON do
 * catálogo e montar o `Catalogo` com `catalogoDe()`.
 */
import { gerarCatalogo } from '../schema/catalogo'
import { catalogoDe, type Catalogo } from './estrategia'

let _cache: Catalogo | null = null

export function catalogoPadrao(): Catalogo {
  if (!_cache) _cache = catalogoDe(gerarCatalogo())
  return _cache
}
