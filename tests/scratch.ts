import { matrizPlacaresPoisson, calcularMercados } from '../lib/analytics/poisson'

console.log('Resultados para 1.57 e 1.05:')
const m1 = matrizPlacaresPoisson(1.57, 1.05)
console.log('0x0:', m1[0][0])
console.log('1x1:', m1[1][1])
console.log('2x1:', m1[2][1])
console.log('1x0:', m1[1][0])
console.log('2x0:', m1[2][0])
console.log('Mercados:', calcularMercados(m1))

console.log('\nResultados para 2.04414 e 0.5376:')
const m2 = matrizPlacaresPoisson(2.04414, 0.5376)
console.log('0x0:', m2[0][0])
console.log('1x1:', m2[1][1])
console.log('2x1:', m2[2][1])
console.log('1x0:', m2[1][0])
console.log('2x0:', m2[2][0])
console.log('Mercados:', calcularMercados(m2))
