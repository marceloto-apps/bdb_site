'use client'
/** Painel lateral "Como usar": passo a passo, glossário, sintaxe das fórmulas e exemplos carregáveis. */
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, Play } from 'lucide-react'
import { EXEMPLOS } from '@/lib/laboratorio/ui/exemplos'
import type { Estrategia } from '@/lib/laboratorio/engine/tipos'
import type { FuncaoUI } from '@/lib/laboratorio/ui/tipos'

const GLOSSARIO: { termo: string; def: string }[] = [
  { termo: 'Universo', def: 'Conjunto de jogos que a estratégia pode considerar: quais ligas, temporadas, datas e fontes. Tudo o que vem depois só olha para esses jogos.' },
  { termo: 'Ligas do BDB', def: 'Ligas acompanhadas diariamente pelo site, com odds da bet365 e da Pinnacle (abertura e fechamento). É a mesma base do Backtest tradicional.' },
  { termo: 'Ligas extras (Football-Data)', def: 'Ligas que só existem na base histórica Football-Data. Mais jogos, porém menos colunas de odds e estatísticas.' },
  { termo: 'Indicador', def: 'Um cálculo com nome, por exemplo edge_h = odd da bet365 × probabilidade justa da Pinnacle − 1. Depois de criado, o nome pode ser usado na regra, na escolha do lado e no stake.' },
  { termo: 'Regra de seleção', def: 'Condição que o jogo precisa cumprir para gerar aposta. Pode ser montada no modo Visual (menus) ou escrita como fórmula.' },
  { termo: 'Aposta (entrada)', def: 'O que é apostado em cada jogo selecionado: mercado, lado, linha, casa e momento da odd. Uma estratégia pode ter mais de uma aposta por jogo.' },
  { termo: 'Abertura e fechamento', def: 'Abertura é a primeira odd publicada pela casa; fechamento é a última antes de a bola rolar. O fechamento da Pinnacle é a melhor estimativa pública da probabilidade real.' },
  { termo: 'Linha principal', def: 'Nos mercados de gols e handicap, a linha em que as duas odds estão mais equilibradas naquele jogo (ex.: 2.5 gols, −0.75 de handicap).' },
  { termo: 'Probabilidade justa (no-vig)', def: 'Probabilidade implícita na odd depois de retirar a margem da casa. Ex.: odds 1,90/1,90 têm 52,6% cada; sem margem, 50% cada.' },
  { termo: 'Edge', def: 'Vantagem estimada: odd apostada × probabilidade justa − 1. Edge de 0,03 quer dizer que a odd paga 3% acima do justo.' },
  { termo: 'EV (valor esperado)', def: 'Lucro médio esperado por unidade apostada, calculado com a probabilidade de referência.' },
  { termo: 'CLV (Closing Line Value)', def: 'Quanto a odd apostada foi melhor que a odd justa do fechamento. CLV positivo de forma consistente é o sinal mais confiável de vantagem real, mesmo antes de o lucro aparecer.' },
  { termo: 'Beat rate', def: 'Percentual de apostas cuja odd superou a odd justa do fechamento.' },
  { termo: 'Referência', def: 'Casa e momento usados como "verdade" para EV e CLV. Padrão: Pinnacle no fechamento. Quando falta, usa a bet365 e a aposta é marcada como "soft".' },
  { termo: 'Yield', def: 'Lucro dividido pelo total apostado. Yield de 5% = 5 unidades de lucro a cada 100 apostadas.' },
  { termo: 'ROI do banco', def: 'Lucro dividido pelo banco inicial. Depende do método de stake; o yield não.' },
  { termo: 'Drawdown (MDD)', def: 'Maior queda do banco desde um pico até o vale seguinte. Mostra o pior momento que a estratégia impôs a quem a seguisse.' },
  { termo: 'p-valor', def: 'Probabilidade de um resultado igual ou melhor acontecer por sorte, sem vantagem real. Abaixo de 0,05 é o critério usual de significância.' },
  { termo: 'Intervalo de confiança (IC95)', def: 'Faixa em que o yield verdadeiro provavelmente está, obtida por bootstrap (reamostragem por dia). Se a faixa inclui zero, o lucro pode ser sorte.' },
  { termo: 'Vazamento de futuro (leakage)', def: 'Quando a regra usa informação que ainda não existia na hora da aposta, por exemplo decidir na abertura com a odd de fechamento. O resultado fica irreal; o Laboratório avisa em vermelho.' },
  { termo: 'Stake flat', def: 'Mesma quantidade de unidades em toda aposta. É o método que isola a qualidade da seleção.' },
  { termo: 'Kelly', def: 'Stake proporcional à vantagem estimada. "Kelly 1/4" usa um quarto do valor cheio para reduzir a variância.' },
  { termo: 'Slippage', def: 'Piora de odd entre ver o preço e conseguir apostar. Usado para deixar a simulação mais conservadora.' },
  { termo: 'Janela (l5, l10, l20, season)', def: 'Quantos jogos anteriores entram na estatística do time: últimos 5, 10, 20 ou toda a temporada até a data.' },
  { termo: 'Escopo (all, venue)', def: 'all = todos os jogos do time; venue = só em casa (para o mandante) ou só fora (para o visitante).' },
  { termo: 'xG', def: 'Gols esperados: qualidade das chances criadas, medida pelas finalizações. Disponível nas ligas principais.' },
  { termo: 'Elo', def: 'Força do time num único número, atualizado jogo a jogo. Diferenças de 100 pontos ≈ 64% de chance para o mais forte em campo neutro.' },
  { termo: 'Holdout selado', def: 'A temporada mais recente de cada liga fica escondida enquanto você ajusta a estratégia. Ao abrir o selo (só para estratégias salvas, e fica registrado), ela vira o teste final.' },
  { termo: 'Walk-forward', def: 'Divide o tempo em janelas; em cada uma, a estratégia (e seus parâmetros, quando há varredura) é definida com os jogos anteriores e avaliada nos seguintes. Só o resultado fora da amostra conta.' },
  { termo: 'WFE (eficiência do walk-forward)', def: 'Yield fora da amostra dividido pelo yield no treino. Perto de 1 é ótimo; abaixo de 0,5 o ajuste não se transfere para o futuro.' },
  { termo: 'Tentativas e deflação', def: 'Cada variação avaliada de uma ideia é uma tentativa. Com muitas tentativas, algum resultado bom aparece por sorte; o p-valor deflacionado corrige isso: 1 − (1 − p)^N.' },
  { termo: 'PBO (probabilidade de overfit)', def: 'Em quantas divisões treino/teste a melhor combinação de parâmetros no treino ficou abaixo da mediana no teste. Acima de 50% é sinal de ajuste excessivo.' },
  { termo: 'Monte Carlo', def: 'Refaz as mesmas apostas milhares de vezes em ordem sorteada, com o stake escolhido, para ver a faixa de lucro final, a maior queda típica e a chance de ruína.' },
  { termo: 'Seleção aleatória', def: 'Mesmas apostas em jogos sorteados do universo. Mede se a regra escolhe jogos melhores que o acaso (z acima de 2 = sim).' },
  { termo: 'Calibração (Brier, ECE)', def: 'Quão bem a probabilidade estimada bate com a frequência observada. Brier menor que o da Pinnacle = prevê melhor que o mercado; ECE abaixo de 3% = bem calibrada.' },
]

const CAMPOS_EXEMPLO: { chave: string; leia: string }[] = [
  { chave: 'odds.bet365.close.1x2.h', leia: 'odd da bet365, no fechamento, mercado 1X2, mandante' },
  { chave: 'odds.pinnacle.open.ou.main_line', leia: 'linha principal de gols da Pinnacle na abertura' },
  { chave: 'odds.pinnacle.close.1x2.novig_h', leia: 'probabilidade justa do mandante pela Pinnacle no fechamento' },
  { chave: 'home.l5.pts_pg', leia: 'pontos por jogo do mandante nos últimos 5 (todos os jogos)' },
  { chave: 'away.venue.l10.xg_against', leia: 'xG cedido pelo visitante nos últimos 10 jogos fora de casa' },
  { chave: 'derived.pinnacle.move_1x2_h', leia: 'variação da odd do mandante na Pinnacle (fechamento ÷ abertura − 1)' },
  { chave: 'league.avg_goals', leia: 'média de gols por jogo da liga na temporada até a data' },
  { chave: 'match.round', leia: 'rodada do jogo' },
]

export function GuiaLaboratorio({ funcoes, onCarregarExemplo }: { funcoes: FuncaoUI[]; onCarregarExemplo: (e: Estrategia) => void }) {
  const [aberto, setAberto] = useState(false)
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setAberto(true)}><BookOpen className="w-4 h-4 mr-2" />Como usar</Button>
      <Sheet open={aberto} onOpenChange={setAberto}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Como usar o Laboratório</SheetTitle>
            <SheetDescription>Monte a estratégia em 6 passos e leia o resultado com CLV, drawdown e significância.</SheetDescription>
          </SheetHeader>
          <Tabs defaultValue="passos" className="mt-4">
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="passos">Passo a passo</TabsTrigger><TabsTrigger value="glossario">Glossário</TabsTrigger><TabsTrigger value="formulas">Fórmulas</TabsTrigger><TabsTrigger value="exemplos">Exemplos</TabsTrigger>
            </TabsList>

            <TabsContent value="passos" className="space-y-3 text-sm">
              <ol className="list-decimal pl-5 space-y-2">
                <li><b>Universo.</b> Escolha as ligas e temporadas. Para começar, deixe “Ligas padrão” com as Ligas do BDB e só campeonatos: é a base mais completa e a mesma do Backtest tradicional.</li>
                <li><b>Indicadores.</b> Opcional. Crie cálculos com nome para reutilizar (ex.: <span className="font-mono">edge_h</span>). O catálogo lista todos os dados disponíveis por jogo; clique num item para copiar o nome técnico.</li>
                <li><b>Regra de seleção.</b> Diga quais jogos entram. No modo Visual você combina condições com menus; no modo Fórmula você escreve o texto. Os dois geram a mesma coisa.</li>
                <li><b>Apostas.</b> O que apostar em cada jogo selecionado: mercado, lado, linha, casa e se a odd é a de abertura ou fechamento. Quase sempre uma aposta basta.</li>
                <li><b>Stake e banco.</b> Comece com stake flat de 1 unidade: ele mede a qualidade da seleção sem o efeito do dimensionamento. Kelly e % do banco vêm depois.</li>
                <li><b>Validação avançada.</b> Deixe a última temporada selada enquanto ajusta. Defina faixas para os parâmetros $p se quiser varrer. Depois de executar, use “Rodar validação avançada” nas abas Validação, Monte Carlo, Varredura e Calibração.</li>
                <li><b>Executar e ler.</b> Olhe nesta ordem: aviso vermelho (vazamento de futuro invalida tudo), número de apostas (menos de 300 é pouco), CLV e beat rate (vantagem real), yield e p-valor deflacionado (resultado), walk-forward fora da amostra (estabilidade), drawdown e Monte Carlo (risco). Só então abra o selo.</li>
              </ol>
              <p className="text-muted-foreground">Salvar a estratégia (passo 6) guarda a definição; salvar o run guarda o resultado e conta uma tentativa, para você saber quantas variações já testou na mesma ideia.</p>
            </TabsContent>

            <TabsContent value="glossario">
              <dl className="text-sm space-y-2">
                {GLOSSARIO.map((g) => <div key={g.termo}><dt className="font-semibold">{g.termo}</dt><dd className="text-muted-foreground">{g.def}</dd></div>)}
              </dl>
            </TabsContent>

            <TabsContent value="formulas" className="space-y-4 text-sm">
              <div>
                <p className="font-semibold mb-1">Como ler o nome de um dado</p>
                <p className="text-muted-foreground">O nome técnico é lido da esquerda para a direita, separado por pontos: <span className="font-mono">grupo.casa.momento.mercado.lado</span> nas odds, e <span className="font-mono">lado.escopo.janela.estatística</span> nos times.</p>
                <ul className="mt-2 space-y-1">
                  {CAMPOS_EXEMPLO.map((c) => <li key={c.chave}><span className="font-mono text-primary">{c.chave}</span><br /><span className="text-muted-foreground">{c.leia}</span></li>)}
                </ul>
              </div>
              <div>
                <p className="font-semibold mb-1">Operadores</p>
                <p className="text-muted-foreground">Comparação: <span className="font-mono">&gt; &gt;= &lt; &lt;= == !=</span>. Combinação: <span className="font-mono">and</span> (e), <span className="font-mono">or</span> (ou), <span className="font-mono">not</span> (não). Contas: <span className="font-mono">+ − × ÷</span> com parênteses. Lados: <span className="font-mono">home draw away over under yes no</span>.</p>
                <pre className="mt-2 bg-muted rounded-md p-2 text-xs font-mono whitespace-pre-wrap">{'edge_h > 0.03 and home.l5.pts_pg >= 1.8\nnot (derived.pinnacle.fav_side == home)\n(home.l10.gf + away.l10.ga) / 2 > 1.6'}</pre>
              </div>
              <div>
                <p className="font-semibold mb-1">Dado ausente</p>
                <p className="text-muted-foreground">Se um jogo não tem o dado (ex.: sem xG), a comparação é “desconhecida” e o jogo não entra. Use <span className="font-mono">ifnull(x, y)</span> para dar um valor padrão.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Parâmetros</p>
                <p className="text-muted-foreground">Escreva <span className="font-mono">$p1</span> na fórmula e defina <span className="font-mono">p1=0.05</span> no passo 5. Assim você varia o limiar sem reescrever a regra.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Modelos de gols</p>
                <p className="text-muted-foreground"><span className="font-mono">model(MODELO, ENTRADA, janela)</span> monta uma matriz de placares e devolve probabilidades. MODELO: <span className="font-mono">POISSON</span>, <span className="font-mono">DC</span> (Dixon-Coles), <span className="font-mono">ZIP</span>, <span className="font-mono">NB</span>. ENTRADA: <span className="font-mono">MEDIA</span> (gols médios), <span className="font-mono">FORCAS</span> (ataque × defesa), <span className="font-mono">XG</span>, <span className="font-mono">MERCADO</span> (implícito nas odds). Saídas: <span className="font-mono">.p_h .p_d .p_a .p_btts .p_over(2.5) .p_under(2.5) .lambda_h .lambda_a</span>.</p>
                <pre className="mt-2 bg-muted rounded-md p-2 text-xs font-mono whitespace-pre-wrap">{'model(DC, FORCAS, l10).p_over(2.5) - odds.bet365.close.ou.novig_over_main > 0.05'}</pre>
              </div>
              <div>
                <p className="font-semibold mb-1">Funções ({funcoes.length})</p>
                <ul className="space-y-0.5 text-xs">
                  {funcoes.map((f) => <li key={f.nome}><span className="font-mono text-primary">{f.assinatura}</span> <span className="text-muted-foreground">— {f.descricao}</span></li>)}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="exemplos" className="space-y-3">
              <p className="text-xs text-muted-foreground">Carregar um exemplo substitui a estratégia atual no formulário (não apaga nada salvo).</p>
              {EXEMPLOS.map((ex) => (
                <div key={ex.id} className="border border-border rounded-md p-3 space-y-1 text-sm">
                  <p className="font-semibold">{ex.titulo}</p>
                  <p className="text-muted-foreground">{ex.oQueTesta}</p>
                  <p className="text-xs"><b>O que observar:</b> {ex.observar}</p>
                  <p className="font-mono text-xs text-primary break-all">{ex.estrategia.regra?.formula}</p>
                  <Button size="sm" variant="secondary" onClick={() => { onCarregarExemplo(ex.estrategia); setAberto(false) }}><Play className="w-3 h-3 mr-1" />Carregar exemplo</Button>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </>
  )
}
