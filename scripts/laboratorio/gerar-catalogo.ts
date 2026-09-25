/**
 * Fase 0 — gera os artefatos do catálogo v1:
 *   lib/laboratorio/schema/catalogo.v1.json   (consumido pela UI e pelo builder)
 *   docs/Backtest_Livre_Catalogo_v1.md        (revisão humana)
 *
 * Uso: npx tsx scripts/laboratorio/gerar-catalogo.ts
 */
import { writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { gerarCatalogo, resumoCatalogo, FUNCOES_VIRTUAIS, CATALOGO_VERSAO, type Campo } from '../../lib/laboratorio/schema/catalogo'
import { LIGAS_FPT, resumoLigasFpt } from '../../lib/laboratorio/schema/ligas-fpt'

const raiz = resolve(__dirname, '../..')
const campos = gerarCatalogo()
const resumo = resumoCatalogo()
const resumoLigas = resumoLigasFpt()

const jsonCatalogo = JSON.stringify({ versao: CATALOGO_VERSAO, geradoEm: new Date().toISOString().slice(0, 10), resumo, campos, funcoesVirtuais: FUNCOES_VIRTUAIS }, null, 1)
writeFileSync(resolve(raiz, 'lib/laboratorio/schema/catalogo.v1.json'), jsonCatalogo)

// O builder da feature store vive no repositório irmão bdb_ingest (D2) e consome o mesmo
// catálogo: copiamos o JSON quando o repositório existe ao lado (contrato produtor ↔ consumidor).
const jsonLigas = JSON.stringify({ geradoEm: new Date().toISOString().slice(0, 10), ligas: LIGAS_FPT }, null, 1)
writeFileSync(resolve(raiz, 'lib/laboratorio/schema/ligas-fpt.json'), jsonLigas)
const destinoIngest = resolve(raiz, '../bdb_ingest/src/lib/laboratorio/catalogo.v1.json')
if (existsSync(dirname(destinoIngest))) {
  writeFileSync(destinoIngest, jsonCatalogo)
  writeFileSync(resolve(dirname(destinoIngest), 'ligas-fpt.json'), jsonLigas)
  console.log(`catálogo e ligas FPT copiados para ${dirname(destinoIngest)}`)
}

const pct = (v?: number) => (v == null ? '' : `${Math.round(v * 100)}%`)
const cob = (f: Campo) => (['core', 'fpt', 'fs'] as const).map((s) => (f.cobertura?.[s] != null ? `${s} ${pct(f.cobertura[s])}${f.desde?.[s] ? ` (${f.desde[s]}+)` : ''}` : '')).filter(Boolean).join(' · ')

function tabela(lista: Campo[]): string {
  const linhas = ['| Campo | Tipo | Fontes (precedência) | Cobertura estimada | Descrição |', '| --- | --- | --- | --- | --- |']
  const esc = (s: string) => s.replace(/\|/g, '\\|')
  for (const f of lista) linhas.push(`| \`${f.key}\` | ${f.tipo} | ${f.fontes.join(' → ')} | ${cob(f)} | ${esc(f.label)}${f.descricao ? ` — ${esc(f.descricao)}` : ''} |`)
  return linhas.join('\n')
}

const porBloco = (b: Campo['bloco']) => campos.filter((f) => f.bloco === b)

// Para o bloco de odds e de time, a tabela completa é enorme; mostramos os templates e um exemplo por família.
const oddsBet365Close = porBloco('odds').filter((f) => f.key.startsWith('odds.bet365.close.'))
const oddsPinnacleClose = porBloco('odds').filter((f) => f.key.startsWith('odds.pinnacle.close.'))
const oddsReduzida = porBloco('odds').filter((f) => f.key.startsWith('odds.betano.close.'))
const timeHomeL10 = porBloco('team').filter((f) => f.key.startsWith('home.l10.'))
const timeHomeVenueL10 = porBloco('team').filter((f) => f.key.startsWith('home.venue.l10.')).slice(0, 3)
const timeHomeSemJanela = porBloco('team').filter((f) => /^home\.[a-z0-9_]+$/.test(f.key))

const md = `# Backtest Livre — Catálogo de campos v${CATALOGO_VERSAO} (Fase 0)

> Gerado por \`scripts/laboratorio/gerar-catalogo.ts\` a partir de \`lib/laboratorio/schema/catalogo.ts\`.
> Não editar à mão: ajustar os templates e regenerar. Coberturas são **estimativas** das medições de
> 24/09/2026; a medida por liga×temporada sai de \`bt_coverage\` na Fase 1.

## Resumo

| Bloco | Campos |
| --- | --- |
${Object.entries(resumo.porBloco).map(([b, n]) => `| ${b} | ${n} |`).join('\n')}
| **total** | **${resumo.total}** |

Campos por fonte (um campo pode ter várias): core ${resumo.porFonte.core} · fpt ${resumo.porFonte.fpt} · fs ${resumo.porFonte.fs}.
Funções virtuais (calculadas no engine): ${resumo.funcoesVirtuais}.

Convenção de nomes: \`bloco.qualificadores.medida\`.
- \`odds.<casa>.<open|close>.<mercado>.<seleção>\` — ex.: \`odds.pinnacle.close.1x2.novig_h\`
- \`derived.<casa>.<medida>\` — cruzamentos prontos (movimento, λ de mercado, edge)
- \`<home|away>[.venue].<l5|l10|l20|season>.<estatística>\` — ex.: \`away.venue.l10.xg_against\`
- \`<home|away>.<medida>\` — forma, descanso, tabela, Elo (sem janela)
- \`league.<parâmetro>\` — parâmetros da liga até a data
- \`match.<campo>\` — identificação e resultado (resultado só entra na liquidação)

Tipos (unidades): odd, prob, line, count, rate, pct, goals, xg, days, points, bool, int, id, date, text, ratio, elo.
O validador de fórmulas impede comparar unidades incompatíveis sem conversão (ex.: \`odd > prob\`).

## 1. Bloco \`match\` (${porBloco('match').length})

${tabela(porBloco('match'))}

## 2. Bloco \`odds\` (${porBloco('odds').length})

Casas com largura total: pinnacle, bet365, avg, best. Casas reduzidas (1X2, BTTS, O/U principal, AH principal): betano, betfair, kambi, superbet, 1xbet, estrela_bet, f12, sportingbet, kto, betnacional. Snapshots: open, close (d1/h6/h1 reservados para D3).

### 2.1 bet365 fechamento — largura total (${oddsBet365Close.length})

${tabela(oddsBet365Close)}

### 2.2 pinnacle fechamento (${oddsPinnacleClose.length})

${tabela(oddsPinnacleClose)}

### 2.3 Exemplo de casa reduzida — betano fechamento (${oddsReduzida.length})

${tabela(oddsReduzida)}

As mesmas famílias existem para \`open\` (exceto dc/eh/cs, que só existem no fechamento da FPT) e para as demais casas.

## 3. Bloco \`derived\` (${porBloco('derived').length})

${tabela(porBloco('derived'))}

## 4. Bloco \`team\` (${porBloco('team').length})

${LADOS_DOC()}

### 4.1 Estatísticas por janela — exemplo \`home.l10.*\` (${timeHomeL10.length})

${tabela(timeHomeL10)}

### 4.2 Escopo \`venue\` — exemplo (${timeHomeVenueL10.length} de ${porBloco('team').filter((f) => f.key.includes('.venue.')).length})

${tabela(timeHomeVenueL10)}

### 4.3 Sem janela — \`home.*\` (${timeHomeSemJanela.length})

${tabela(timeHomeSemJanela)}

## 5. Bloco \`league\` (${porBloco('league').length})

${tabela(porBloco('league'))}

## 6. Funções virtuais

| Função | Assinatura | Retorno | Descrição |
| --- | --- | --- | --- |
${FUNCOES_VIRTUAIS.map((f) => `| ${f.nome} | \`${f.assinatura}\` | ${f.retorno} | ${f.descricao} |`).join('\n')}

## 7. Ligas só-FPT (${resumoLigas.ligas})

${resumoLigas.padrao} incluídas por padrão (${resumoLigas.jogosPadrao.toLocaleString('pt-BR')} jogos de ${resumoLigas.jogos.toLocaleString('pt-BR')}); ${resumoLigas.femininas} femininas; por tipo: ${Object.entries(resumoLigas.porTipo).map(([t, n]) => `${t} ${n}`).join(', ')}.

| Chave FPT | Nome | País | Nível | Tipo | Padrão | Jogos | Observação |
| --- | --- | --- | --- | --- | --- | --- | --- |
${LIGAS_FPT.map((l) => `| \`${l.rawLeague}\` | ${l.nome}${l.feminino ? ' (fem.)' : ''} | ${l.pais} | ${l.nivel ?? '—'} | ${l.tipo} | ${l.incluidaPorPadrao ? 'sim' : 'não'} | ${l.jogosRef.toLocaleString('pt-BR')} | ${l.observacao ?? ''} |`).join('\n')}
`

function LADOS_DOC() {
  return `Gerado por lado (home, away) × escopo (all, venue) × janela (l5, l10, l20, season) × ${campos.filter((f) => f.key.startsWith('home.l10.')).length} estatísticas, mais ${timeHomeSemJanela.length} medidas sem janela por lado. Todas calculadas só com jogos anteriores à data (§4.1 do plano). \`venue\` = só jogos em casa para o mandante e só fora para o visitante.`
}

writeFileSync(resolve(raiz, 'docs/Backtest_Livre_Catalogo_v1.md'), md)
console.log(JSON.stringify({ resumo, resumoLigas }, null, 2))
