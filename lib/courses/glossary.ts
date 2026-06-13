// Dicionário do Mercado Esportivo
// Gerado automaticamente a partir do conteúdo do Claude Artifact

export interface GlossaryTerm {
  name: string;
  full?: string;
  pt: string;
  cat: 'mercado' | 'estatistica' | 'risco' | 'operacao' | 'modelo';
  def: string;
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    "name": "CLV",
    "full": "Closing Line Value",
    "pt": "Valor em relação à linha de fechamento",
    "cat": "mercado",
    "def": "Mede a qualidade de uma aposta comparando a odd que você obteve com a linha de fechamento (odd final antes do jogo começar). <strong>CLV positivo</strong> significa que você apostou numa odd melhor do que o mercado chegou ao fim — o principal indicador de que existe vantagem real no processo, independentemente do resultado do jogo."
  },
  {
    "name": "EV",
    "full": "Expected Value",
    "pt": "Valor esperado",
    "cat": "mercado",
    "def": "Retorno médio esperado por aposta no longo prazo. Fórmula: <strong>EV = (p × odd) − 1</strong>, onde p é a probabilidade estimada. EV positivo (+EV) significa lucro esperado no longo prazo; EV negativo (−EV) significa prejuízo — mesmo que você ganhe apostas individuais."
  },
  {
    "name": "Overround",
    "full": "Overround",
    "pt": "Excesso de probabilidade / margem total",
    "cat": "mercado",
    "def": "A soma das probabilidades implícitas de todos os resultados de um mercado. Num mercado justo somaria <strong>100%</strong>; na prática soma mais — ex: 107%. O excesso acima de 100% é a margem embutida pela casa. Quanto maior o overround, mais cara é a aposta para o jogador."
  },
  {
    "name": "Juice / Vig",
    "full": "Juice / Vigorish",
    "pt": "Margem da casa / comissão embutida",
    "cat": "mercado",
    "def": "A vantagem matemática que a casa constrói nas odds. É a diferença entre a odd justa (sem margem) e a odd oferecida. Ex: odd justa 2.10, odd oferecida 2.00 — o juice é essa diferença. Garante o lucro da casa independentemente do resultado dos jogos."
  },
  {
    "name": "Odd justa",
    "full": "Fair Odd / True Odd",
    "pt": "Odd sem margem da casa",
    "cat": "mercado",
    "def": "A odd que existiria se a casa não tivesse margem — calculada removendo o overround das probabilidades implícitas. Serve de referência para comparar com a odd oferecida e calcular se existe valor (+EV) numa aposta."
  },
  {
    "name": "Probabilidade implícita",
    "full": "Implied Probability",
    "pt": "Probabilidade embutida na odd",
    "cat": "mercado",
    "def": "A probabilidade de um evento expressa pela odd da casa: <strong>prob = 1 ÷ odd</strong>. Uma odd 2.50 implica 40% de probabilidade. Inclui a margem da casa — para obter a probabilidade justa é preciso remover o overround."
  },
  {
    "name": "Linha de abertura",
    "full": "Opening Line",
    "pt": "Odds iniciais do mercado",
    "cat": "mercado",
    "def": "As odds disponibilizadas pela casa no momento em que o mercado abre, normalmente dias antes do jogo. A linha de abertura é <strong>menos eficiente</strong> — contém mais desajustes — e é onde apostadores informados buscam valor. Conforme o volume entra, a linha se ajusta e fica mais precisa."
  },
  {
    "name": "Linha de fechamento",
    "full": "Closing Line",
    "pt": "Odds finais antes do jogo",
    "cat": "mercado",
    "def": "As odds momentos antes do início do jogo, após absorver todo o volume apostado. É considerada a estimativa mais eficiente do mercado sobre a probabilidade real. Serve de <strong>régua para calcular o CLV</strong>: se sua odd de entrada foi melhor que o fechamento, você capturou valor."
  },
  {
    "name": "Steam move",
    "full": "Steam Move",
    "pt": "Movimento brusco de linha por dinheiro informado",
    "cat": "mercado",
    "def": "Queda rápida e expressiva numa odd provocada por um volume alto de apostadores informados (sharps) entrando no mesmo lado ao mesmo tempo. Sinal de que informação relevante chegou ao mercado. Pode ocorrer em múltiplas casas quase simultaneamente."
  },
  {
    "name": "Drift",
    "full": "Drift",
    "pt": "Movimento gradual da linha contra um lado",
    "cat": "mercado",
    "def": "Aumento gradual de uma odd ao longo do tempo, indicando que o dinheiro está fluindo para o lado oposto. Diferente do steam move — o drift é lento e pode refletir dinheiro recreativo ou simplesmente falta de interesse num lado do mercado."
  },
  {
    "name": "RLM",
    "full": "Reverse Line Movement",
    "pt": "Movimento de linha inverso ao volume",
    "cat": "mercado",
    "def": "Quando a linha se move na direção oposta ao volume aparente de apostas. Ex: 70% do dinheiro público aposta na Casa, mas a odd da Casa encurta (sobe a odd do Visitante). Indica que dinheiro informado (sharp) entrou no Visitante e o mercado reagiu a ele, ignorando o volume recreativo."
  },
  {
    "name": "Sharp",
    "full": "Sharp Bettor / Sharp Book",
    "pt": "Apostador ou casa de linha precisa",
    "cat": "mercado",
    "def": "<strong>Sharp bettor</strong>: apostador profissional com vantagem comprovada — casas europeias tendem a limitar sua conta. <strong>Sharp book</strong> (ex: Pinnacle): casa com linha muito afiada, margem baixa e que aceita apostadores vencedores. A linha de fechamento de uma sharp book é a referência de eficiência do mercado."
  },
  {
    "name": "Chasing",
    "full": "Line Chasing / Odds Chasing",
    "pt": "Comparação de odds entre casas para capturar valor",
    "cat": "mercado",
    "def": "Estratégia de comparar as odds de casas europeias com a linha de referência (Pinnacle/sharp) para identificar desajustes. Quando a europeia ainda oferece uma odd que a sharp já corrigiu para baixo, existe potencial de valor. <strong>Não confundir com Martingale</strong> (escalar stake para recuperar perdas)."
  },
  {
    "name": "Sure bet / Arbitragem",
    "full": "Sure Bet / Sports Arbitrage",
    "pt": "Aposta garantida / arbitragem esportiva",
    "cat": "mercado",
    "def": "Apostar em todos os resultados de um evento em casas diferentes aproveitando discrepâncias de odds, garantindo lucro independentemente do desfecho. O overround combinado das casas fica <strong>abaixo de 100%</strong>. Funciona na prática mas casas europeias limitam rapidamente quem faz arbitragem."
  },
  {
    "name": "Dutching",
    "full": "Dutching",
    "pt": "Apostar em múltiplos resultados proporcionalmente",
    "cat": "mercado",
    "def": "Distribuir o stake entre dois ou mais resultados de forma que o retorno seja igual independentemente de qual acertar. Diferente da arbitragem — no dutching não há garantia de lucro, apenas equalização do retorno entre os desfechos escolhidos."
  },
  {
    "name": "Matched betting",
    "full": "Matched Betting",
    "pt": "Aposta casada / aproveitamento de bônus",
    "cat": "mercado",
    "def": "Usar bônus de casas europeias combinando back (a favor) numa casa e lay (contra) na exchange para cobrir o risco e extrair o valor do bônus com risco mínimo. Funciona no curto prazo mas tem vida útil limitada — as casas identificam e encerram as promoções para esse perfil."
  },
  {
    "name": "Line shopping",
    "full": "Line Shopping",
    "pt": "Comparação de odds entre casas",
    "cat": "mercado",
    "def": "Prática de consultar múltiplas casas antes de apostar para encontrar a melhor odd disponível para o mesmo evento. Impacto direto no EV: consistentemente obter 0.05–0.10 a mais na odd pode transformar uma estratégia neutra em lucrativa ao longo do tempo."
  },
  {
    "name": "AH",
    "full": "Asian Handicap",
    "pt": "Handicap asiático",
    "cat": "mercado",
    "def": "Mercado que equaliza as forças das equipes dando vantagem (ou desvantagem) em gols ao time considerado mais fraco. Elimina o empate como possibilidade em handicaps inteiros (ex: -1, +1) ou o divide em parciais (ex: -0.5, -1.5). Muito líquido e com margem baixa nas casas asiáticas — ideal para apostadores avançados."
  },
  {
    "name": "BTTS",
    "full": "Both Teams To Score",
    "pt": "Ambas as equipes marcam",
    "cat": "mercado",
    "def": "Mercado que aposta se as duas equipes vão marcar pelo menos um gol cada no jogo. Independe do resultado ou do número total de gols. Comum em jogos ofensivos — mas com alta variância por depender de dois eventos independentes ocorrerem."
  },
  {
    "name": "O/U",
    "full": "Over / Under",
    "pt": "Acima / abaixo de X gols",
    "cat": "mercado",
    "def": "Mercado que aposta se o total de gols da partida ficará acima (Over) ou abaixo (Under) de um determinado número — tipicamente 2.5. Com λ ≈ 2.7 (média europeia), o O/U 2.5 fica próximo de 50/50, tornando-se o mercado de gols mais negociado e líquido."
  },
  {
    "name": "Outrights",
    "full": "Outright Bets",
    "pt": "Apostas em desfechos de competição inteira",
    "cat": "mercado",
    "def": "Apostas no resultado de uma competição completa, não de um jogo específico. Ex: campeão do torneio, time rebaixado, artilheiro da temporada. Têm horizonte temporal longo, odds geralmente altas e são mais difíceis de precificar com precisão."
  },
  {
    "name": "Regime de mercado",
    "full": "Market Regime",
    "pt": "Condição de comportamento do mercado",
    "cat": "mercado",
    "def": "Estado em que o mercado opera — ex: pré-temporada (odds menos confiáveis, poucos dados), temporada regular, fase de mata-mata, mercados com notícia de lesão. O comportamento do mercado muda em cada regime e o método de leitura deve se adaptar."
  },
  {
    "name": "DNB",
    "full": "Draw No Bet",
    "pt": "Empate sem aposta / equivalente ao AH 0",
    "cat": "mercado",
    "def": "Mercado em que o empate devolve o stake (void). Equivale ao Handicap Asiático 0 — você aposta na vitória de um time e, se empatar, recebe o dinheiro de volta. Elimina o risco do empate sem precisar entrar no mercado 1X2 puro. Odd menor que a vitória simples, mas com proteção embutida."
  },
  {
    "name": "Dupla chance",
    "full": "Double Chance",
    "pt": "Aposta em dois dos três resultados possíveis",
    "cat": "mercado",
    "def": "Mercado que cobre dois desfechos de uma vez: Casa ou Empate (1X), Casa ou Fora (12) e Empate ou Fora (X2). Odds mais baixas que o resultado simples, mas com muito maior probabilidade de acerto. Usado quando há incerteza sobre o favorito mas não se quer apostar num resultado específico."
  },
  {
    "name": "Odd",
    "full": "Odds",
    "pt": "Cotação / preço da aposta",
    "cat": "mercado",
    "def": "O número que representa quanto você recebe por cada unidade apostada caso acerte. Uma odd 2.50 significa: apostou R$ 100, acertou → recebe R$ 250 (lucro de R$ 150). A odd carrega embutida a estimativa de probabilidade da casa — quanto menor a odd, maior a probabilidade atribuída ao evento."
  },
  {
    "name": "Tipos de odds",
    "full": "Odds Formats",
    "pt": "Formatos de representação das cotações",
    "cat": "mercado",
    "def": "<strong>Decimal</strong> (europeu): mais comum no Brasil — odd 2.50 retorna R$ 2.50 por R$ 1 apostado. <strong>Fracionária</strong> (britânica): ex. 3/2 — recebe R$ 3 para cada R$ 2 apostados. <strong>Americana</strong> (moneyline): +150 (azarão, lucra $150 em $100) ou -200 (favorito, precisa apostar $200 para lucrar $100). A conversão entre formatos não muda o valor da aposta."
  },
  {
    "name": "Odd média",
    "full": "Average Odds",
    "pt": "Média das odds apostadas numa amostra",
    "cat": "mercado",
    "def": "A média aritmética das odds de todas as entradas registradas. Define diretamente a variância esperada da estratégia — odds médias mais altas significam mais oscilação e necessidade de amostra maior para validar o edge. Uma estratégia com odd média 1.70 valida o CLV com muito menos apostas do que uma com odd média 3.50."
  },
  {
    "name": "Favorito",
    "full": "Favourite",
    "pt": "Time ou desfecho com maior probabilidade segundo o mercado",
    "cat": "mercado",
    "def": "O desfecho ao qual o mercado atribui maior probabilidade — representado pela odd mais baixa do mercado. Ser favorito não garante vitória: significa apenas que a probabilidade implícita é maior que 50% (em mercados de duas vias) ou a mais alta (em 1X2). Apostadores experientes não apostam \"no favorito\" — apostam em valor."
  },
  {
    "name": "Underdog",
    "full": "Underdog",
    "pt": "Azarão — desfecho com menor probabilidade segundo o mercado",
    "cat": "mercado",
    "def": "O desfecho ao qual o mercado atribui menor probabilidade — representado pela odd mais alta. Underdogs ganham com mais frequência do que o público leigo acredita, mas menos do que apostadores ingênuos apostam. A brecha no underdog existe quando o mercado superestima o favorito — e é aí que mora o valor, não na odd alta per se."
  },
  {
    "name": "Value bet",
    "full": "Value Bet",
    "pt": "Aposta com valor — odd acima da probabilidade real",
    "cat": "mercado",
    "def": "Uma aposta em que a odd oferecida pela casa é maior do que a probabilidade real do evento justificaria. Se você estima 55% de chance e a odd implica 45%, há valor. <strong>Value bet é a tese central de todo apostador profissional</strong> — não se aposta para acertar o resultado, aposta-se quando existe discrepância entre a probabilidade real e a do mercado."
  },
  {
    "name": "Múltipla",
    "full": "Accumulator / Parlay",
    "pt": "Aposta combinada em vários eventos",
    "cat": "mercado",
    "def": "Combinação de duas ou mais apostas num único bilhete — todas precisam acertar para ganhar. As odds se multiplicam, gerando retornos altos com stake pequeno. O problema: a margem da casa também se multiplica a cada perna. Uma múltipla de 5 jogos com margem de 5% por jogo tem overround efetivo de ~28%. Na prática, é matematicamente desvantajosa para o apostador."
  },
  {
    "name": "Green",
    "full": "Green",
    "pt": "Aposta ganha / resultado positivo",
    "cat": "mercado",
    "def": "Termo do mercado para aposta vencedora — o bilhete ficou verde. Usado informalmente para indicar lucro numa entrada específica. <strong>Importante:</strong> green não é sinônimo de boa aposta — você pode ter um green com EV negativo (sorte) e um red com EV positivo (azar). O processo correto mede CLV, não cor do bilhete."
  },
  {
    "name": "Red",
    "full": "Red",
    "pt": "Aposta perdida / resultado negativo",
    "cat": "mercado",
    "def": "Termo do mercado para aposta perdedora — o bilhete ficou vermelho. Assim como o green, o red não define a qualidade da decisão: uma aposta pode ser red por pura variância mesmo com edge positivo real. A confusão entre red e \"aposta errada\" é uma das principais causas de apostadores abandonarem estratégias lucrativas cedo demais."
  },
  {
    "name": "Void",
    "full": "Void Bet",
    "pt": "Aposta devolvida / nula",
    "cat": "mercado",
    "def": "Aposta que é cancelada e o stake devolvido — ocorre quando o evento é cancelado, adiado, ou no caso de mercados DNB quando há empate. Não conta como green nem red. Em estratégias de volume, apostas void distorcem as métricas de ROI se não forem tratadas corretamente no registro."
  },
  {
    "name": "Cash out",
    "full": "Cash Out",
    "pt": "Encerramento antecipado da aposta",
    "cat": "mercado",
    "def": "Funcionalidade oferecida por casas europeias que permite fechar a aposta antes do fim do evento — recebendo um valor parcial. A casa sempre oferece cash out abaixo do valor justo (é uma nova margem embutida). Em geral, é financeiramente desvantajoso usá-lo sistematicamente. Pode fazer sentido em situações específicas de gestão de risco."
  },
  {
    "name": "Hedge",
    "full": "Hedge",
    "pt": "Proteção / cobertura de uma aposta existente",
    "cat": "mercado",
    "def": "Apostar no lado oposto de uma posição já aberta para reduzir o risco ou garantir lucro parcial. Ex: você apostou na vitória de um time antes do jogo; no intervalo com vantagem no placar, você lay na exchange para garantir lucro independente do resultado. Reduz a exposição mas também o retorno esperado."
  },
  {
    "name": "Bad run",
    "full": "Bad Run / Losing Streak",
    "pt": "Sequência de derrotas / período negativo",
    "cat": "mercado",
    "def": "Série de resultados negativos consecutivos. Em qualquer estratégia +EV, bad runs são <strong>matematicamente esperados</strong> e inevitáveis — a questão é a duração e profundidade, não se vão acontecer. O risco real é abandonar uma estratégia válida durante um bad run por variância normal, ou continuar uma estratégia inválida por não ter métricas adequadas."
  },
  {
    "name": "HT / FT",
    "full": "Half Time / Full Time",
    "pt": "Intervalo / Tempo normal",
    "cat": "mercado",
    "def": "<strong>HT</strong> (Half Time): mercados e resultados referentes ao primeiro tempo — odd de resultado ao intervalo, total de gols no 1T, etc. <strong>FT</strong> (Full Time): resultado ou totais ao fim dos 90 minutos. Mercados HT/FT combinam o resultado ao intervalo com o resultado final, gerando odds altas mas com probabilidades muito baixas."
  },
  {
    "name": "Match odds",
    "full": "Match Odds",
    "pt": "Mercado de resultado final (1X2)",
    "cat": "mercado",
    "def": "O mercado principal de uma partida de futebol — apostar no resultado ao fim dos 90 minutos: vitória da casa (1), empate (X) ou vitória do visitante (2). É o mercado mais líquido e com maior volume de apostas. A linha de fechamento do match odds é a referência mais usada para cálculo de CLV."
  },
  {
    "name": "Live betting",
    "full": "Live Betting / In-Play",
    "pt": "Apostas ao vivo / durante o jogo",
    "cat": "mercado",
    "def": "Apostas realizadas enquanto o evento está em andamento, com odds atualizadas em tempo real conforme o jogo evolui. As odds ao vivo se movem rapidamente — o mercado é menos eficiente em situações de incerteza alta (início do jogo, logo após um gol). Exige velocidade de decisão e execução. Fora do foco do curso, que é <strong>pré-live</strong>."
  },
  {
    "name": "Liquidez",
    "full": "Liquidity",
    "pt": "Volume disponível para apostas num mercado",
    "cat": "mercado",
    "def": "A quantidade de dinheiro disponível para ser apostado num mercado em determinado momento. Alta liquidez significa que você consegue colocar stakes grandes sem mover a odd. Baixa liquidez (ligas menores, apostas ao vivo em mercados secundários) significa que uma aposta grande pode mudar o preço — limitando o volume operacional e distorcendo a odd de referência."
  },
  {
    "name": "Gap",
    "full": "Odds Gap",
    "pt": "Diferença de odds entre casas",
    "cat": "mercado",
    "def": "A diferença entre a odd de uma casa e a odd equivalente em outra — especialmente entre casas europeias e a referência sharp. Um gap expressivo indica desajuste: a europeia ainda não corrigiu o preço para onde o mercado eficiente já está. É exatamente nesse gap que o apostador de valor busca entrada."
  },
  {
    "name": "Margem",
    "full": "Margin / Vig",
    "pt": "Percentual de lucro embutido nas odds pela casa",
    "cat": "mercado",
    "def": "O percentual que a casa retém de cada mercado, embutido nas odds. Calculada como: <strong>(overround − 100%) ÷ overround</strong>. Uma casa com overround de 107% tem margem de ~6.5%. Quanto maior a margem, mais caro é apostar — e mais difícil é ter CLV positivo de forma consistente. Casas europeias: 4–12%. Sharps: 2–6%. Exchanges: 2–7% (comissão)."
  },
  {
    "name": "Linhas inteiras",
    "full": "Full Lines / Whole Lines",
    "pt": "Handicaps e totais em números inteiros",
    "cat": "mercado",
    "def": "Handicaps asiáticos ou totais de gols em valores inteiros (AH -1, -2; O/U 2.0, 3.0). Em linhas inteiras existe a possibilidade de <strong>void</strong> — se o resultado for exatamente o handicap, o stake é devolvido. Diferente das linhas de quarto e meio que eliminam o void e dividem o stake em dois resultados."
  },
  {
    "name": "Linhas de quarto",
    "full": "Quarter Lines / Split Lines",
    "pt": "Handicaps asiáticos em quartos de gol (0.25, 0.75...)",
    "cat": "mercado",
    "def": "Handicaps asiáticos em múltiplos de 0.25 — ex: AH -0.75, AH +1.25. O stake é dividido igualmente entre dois handicaps adjacentes (ex: -0.75 = metade em -0.5 e metade em -1.0). Eliminam o void e criam resultados parciais (meio ganho / meio perdido). Típicos das casas asiáticas e usados por apostadores avançados para ajuste fino de posição."
  },
  {
    "name": "Mercado europeu",
    "full": "European Market",
    "pt": "Estilo de apostas das casas europeias tradicionais",
    "cat": "mercado",
    "def": "Mercados em odds decimais com a casa como contraparte, margem embutida nas odds e risco de limitação de conta para apostadores vencedores. Inclui 1X2, Over/Under, BTTS e mercados de escanteios/cartões. Linha menos afiada que o mercado asiático — onde mora a maior parte das brechas para apostadores de valor iniciantes e intermediários."
  },
  {
    "name": "Mercado asiático",
    "full": "Asian Market",
    "pt": "Mercados de handicap e totais com origem no mercado asiático",
    "cat": "mercado",
    "def": "Mercados especializados em Handicap Asiático e Over/Under, com odds próximas de 2.00, margem baixa (1–3%) e limites muito altos. Opera quase exclusivamente em mercados de duas vias — elimina o empate. Preferido por apostadores profissionais pelo volume que comporta sem limitação agressiva de conta."
  },
  {
    "name": "Exchange",
    "full": "Betting Exchange",
    "pt": "Bolsa de apostas — apostadores contra apostadores",
    "cat": "mercado",
    "def": "Plataforma onde apostadores apostam entre si — não contra a casa. A exchange cobra comissão sobre o lucro (2–7%), sem margem embutida nas odds. Permite <strong>back</strong> (a favor) e <strong>lay</strong> (contra). Sem risco de limitação de conta. Os preços são definidos pela oferta e demanda dos próprios usuários. Exemplos: Betfair, Smarkets, Matchbook."
  },
  {
    "name": "Back",
    "full": "Back Bet",
    "pt": "Aposta a favor de um resultado na exchange",
    "cat": "mercado",
    "def": "Na exchange: apostar que um resultado <strong>vai acontecer</strong> — equivale à aposta normal em qualquer casa. Você paga a odd e recebe se acertar. Em exchanges é contraposto ao lay: alguém do lado oposto está aceitando ser a \"casa\" para a sua aposta. Back e lay juntos permitem operar qualquer posição de mercado."
  },
  {
    "name": "Lay",
    "full": "Lay Bet",
    "pt": "Aposta contra um resultado na exchange",
    "cat": "mercado",
    "def": "Na exchange: apostar que um resultado <strong>não vai acontecer</strong> — você assume o papel da casa. Se o resultado que você \"vendeu\" ocorrer, você paga; se não ocorrer, você recebe a stake do oponente. A exposição máxima no lay é: <strong>stake × (odd − 1)</strong>. Permite hedging, trading e estratégias impossíveis em casas tradicionais."
  },
  {
    "name": "Scalping",
    "full": "Scalping",
    "pt": "Trading de pequenas diferenças de odds na exchange",
    "cat": "mercado",
    "def": "Estratégia de trading que busca lucrar com pequenas variações de odds — back numa odd mais alta e lay na mesma seleção quando a odd cai, garantindo lucro independente do resultado. Opera em timeframes muito curtos, especialmente ao vivo. Exige rapidez de execução, plataforma eficiente e mercados líquidos."
  },
  {
    "name": "Tick",
    "full": "Tick",
    "pt": "Menor variação de odd possível no mercado",
    "cat": "mercado",
    "def": "A menor unidade de movimento de uma odd numa exchange. Em Betfair, o tamanho do tick varia por faixa de odds: entre 1.01–2.00 o tick é 0.01; entre 2.00–3.00 é 0.02; entre 3.00–4.00 é 0.05, e assim por diante. Traders de scalping buscam capturar 1–3 ticks de diferença entre back e lay."
  },
  {
    "name": "Trader",
    "full": "Sports Trader",
    "pt": "Apostador que opera posições de mercado como trading",
    "cat": "mercado",
    "def": "Apostador que usa a exchange para abrir e fechar posições antes do fim do evento — buscando lucro na variação de odds, não necessariamente no resultado do jogo. Opera com back e lay, gerenciando exposição como um trader financeiro. Diferente do apostador de valor puro, que entra pré-live e mantém a posição até o fim."
  },
  {
    "name": "Punter",
    "full": "Punter",
    "pt": "Apostador recreativo / público geral",
    "cat": "mercado",
    "def": "Termo britânico para apostador casual ou recreativo — aquele que aposta por entretenimento, sem método sistemático. No contexto de mercado, o punter é o dinheiro \"fácil\" que as casas exploram e que move odds em direções irracionais. Entender o comportamento do punter ajuda a identificar onde o mercado está distorcido por volume emocional."
  },
  {
    "name": "Bookie / Bookmaker",
    "full": "Bookmaker",
    "pt": "Casa de apostas / operadora de mercados",
    "cat": "mercado",
    "def": "A empresa que define as odds, aceita apostas e paga os vencedores. O bookmaker lucra pela margem embutida nas odds — não precisa acertar quem vai vencer, apenas equilibrar os lados ou precificar corretamente. Casas europeias limitam apostadores vencedores; sharps e exchanges não."
  },
  {
    "name": "Banca",
    "full": "Bankroll",
    "pt": "Capital exclusivo destinado às apostas",
    "cat": "mercado",
    "def": "O montante total reservado especificamente para apostas — separado das finanças pessoais. A gestão da banca é a principal diferença entre apostadores profissionais e recreativos. Uma banca bem dimensionada suporta os drawdowns esperados da estratégia sem risco de ruína. Nunca deve incluir dinheiro necessário para despesas pessoais."
  },
  {
    "name": "Stake level",
    "full": "Stake Level / Unit Size",
    "pt": "Tamanho de unidade de aposta relativo à banca",
    "cat": "mercado",
    "def": "O percentual da banca apostado por entrada, expresso em unidades. Ex: 1 unidade = 1% da banca. Permite comparar resultados entre apostadores com bancas diferentes — \"5 unidades de lucro\" é comparável independente do valor absoluto. Facilita o registro, a análise de performance e a replicação de estratégias."
  },
  {
    "name": "Winrate",
    "full": "Win Rate",
    "pt": "Taxa de acerto — percentual de apostas vencedoras",
    "cat": "mercado",
    "def": "Percentual de apostas que resultaram em green. Sozinho, o winrate não diz nada sobre a lucratividade — uma estratégia com 40% de acerto pode ser muito mais lucrativa do que uma com 65%, dependendo das odds médias. O que importa é o winrate em relação ao breakeven: o acerto mínimo para não perder dinheiro nas odds que você aposta."
  },
  {
    "name": "Breakeven",
    "full": "Break Even",
    "pt": "Ponto de equilíbrio — acerto mínimo para não perder",
    "cat": "mercado",
    "def": "O winrate mínimo necessário para uma estratégia não perder dinheiro dado um conjunto de odds. Fórmula: <strong>breakeven = 1 ÷ odd média</strong>. Na odd 2.00: breakeven é 50%. Na odd 1.70: 58.8%. Saber seu breakeven é o primeiro passo para avaliar se o seu acerto histórico já representa edge real ou apenas está cobrindo a margem da casa."
  },
  {
    "name": "BTL",
    "full": "Beat The Line",
    "pt": "Bater a linha — obter odd melhor que o fechamento",
    "cat": "mercado",
    "def": "Expressão que indica que o apostador conseguiu uma odd melhor do que a linha de fechamento do mercado. BTL positivo é sinônimo de CLV positivo — você entrou antes que o mercado corrigisse o preço. É o objetivo central de quem aposta pré-live com método: não acertar o resultado, mas bater a linha consistentemente."
  },
  {
    "name": "Rollover",
    "full": "Rollover",
    "pt": "Requisito de volume para liberar bônus",
    "cat": "mercado",
    "def": "Condição imposta pelas casas para liberação de bônus — o apostador deve apostar um múltiplo do valor do bônus (ex: 5x, 10x) antes de poder sacar. Um rollover de 5x num bônus de R$ 100 exige R$ 500 em apostas. Com margem de 5% por mercado, o custo esperado é ~R$ 25 — potencialmente maior que o próprio bônus."
  },
  {
    "name": "Rating",
    "full": "Rating / Power Rating",
    "pt": "Pontuação de força relativa de uma equipe",
    "cat": "mercado",
    "def": "Métrica numérica que quantifica a força de uma equipe em relação às demais. Pode ser calculado por sistemas Elo, regressão, Massey ou modelos próprios. Serve como input para modelos preditivos — a diferença de rating entre dois times gera uma estimativa de probabilidade de cada desfecho. Quanto mais preciso o rating, melhor o modelo de precificação."
  },
  {
    "name": "Tips / Tipster",
    "full": "Tips / Tipster",
    "pt": "Dicas de apostas / fornecedor de palpites",
    "cat": "mercado",
    "def": "<strong>Tips</strong>: palpites ou recomendações de apostas divulgados publicamente. <strong>Tipster</strong>: quem fornece os tips. O mercado de tipsters é majoritariamente opaco — poucos apresentam track record auditável com CLV verificável. Seguir tips sem entender o método é terceirizar uma decisão financeira para alguém cujo edge você não pode validar."
  },
  {
    "name": "Bot",
    "full": "Betting Bot",
    "pt": "Robô automatizado de apostas",
    "cat": "mercado",
    "def": "Software que executa apostas automaticamente, conectado via API às casas ou exchanges. Permite velocidade de execução impossível para humanos, especialmente em steam moves e scalping. Exige programação, acesso a feeds de odds em tempo real e gestão de risco automatizada. Altamente regulamentado ou bloqueado por casas europeias."
  },
  {
    "name": "API",
    "full": "Application Programming Interface",
    "pt": "Interface de programação para acesso a dados e sistemas",
    "cat": "mercado",
    "def": "Protocolo que permite que um software acesse dados ou funcionalidades de outro sistema. Em apostas: APIs de odds providers fornecem linhas em tempo real; APIs de exchanges (ex: Betfair API) permitem automatizar execução. Fundamental para quem usa Python ou bots — sem API, a coleta de dados é manual e inviável em escala."
  },
  {
    "name": "Feed de odds",
    "full": "Odds Feed / Data Feed",
    "pt": "Fornecimento contínuo de odds em tempo real",
    "cat": "mercado",
    "def": "Serviço que entrega odds de múltiplas casas em tempo real via API. Usado para monitorar movimentos de linha, detectar steam moves, calcular CLV e alimentar bots. Exemplos de providers: Betfair SP, Pinnacle API, OddsPortal, BetBurger. Essencial para operação profissional em volume."
  },
  {
    "name": "Proteção de aposta",
    "full": "Bet Protection / Hedge",
    "pt": "Reduzir exposição a risco numa aposta existente",
    "cat": "mercado",
    "def": "Ação de apostar no lado oposto de uma posição aberta para reduzir o risco, garantir lucro parcial ou limitar o prejuízo. Pode ser feita antes do jogo (pré-live) ou durante (ao vivo). Reduz a exposição mas também o retorno esperado — o custo da proteção é o valor esperado que você abre mão."
  },
  {
    "name": "Arbitragem",
    "full": "Arbitrage / Sure Bet",
    "pt": "Lucro garantido explorando diferença de odds entre casas",
    "cat": "mercado",
    "def": "Apostar em todos os resultados possíveis de um evento em casas diferentes, quando as odds combinadas resultam em overround abaixo de 100% — garantindo lucro independente do desfecho. A margem é pequena (0.5–3%) e exige velocidade (odds mudam rapidamente). Casas europeias identificam e limitam arbitragistas com facilidade."
  },
  {
    "name": "Modelo preditivo",
    "full": "Predictive Model",
    "pt": "Sistema matemático que estima probabilidades de resultados",
    "cat": "mercado",
    "def": "Qualquer sistema baseado em dados que gera estimativas de probabilidade para os desfechos de um jogo. Pode ser estatístico (Poisson, regressão) ou de machine learning (XGBoost, redes neurais). O valor do modelo está em <strong>estimar p melhor que o mercado</strong> em situações específicas — não em acertar todos os jogos."
  },
  {
    "name": "Backtest",
    "full": "Backtesting",
    "pt": "Validação de uma estratégia em dados históricos",
    "cat": "mercado",
    "def": "Simulação de uma estratégia ou modelo em dados passados para avaliar performance histórica. Um backtest sério inclui: dados out-of-sample, custos reais (margem, slippage), e validação temporal (walk-forward). Um backtest mal construído — com look-ahead bias ou data snooping — produz resultados inflados que não se replicam ao vivo."
  },
  {
    "name": "Under / Over",
    "full": "Under / Over",
    "pt": "Abaixo / acima de um total de gols",
    "cat": "mercado",
    "def": "<strong>Over X.5</strong>: aposta que o total de gols ficará acima de X. <strong>Under X.5</strong>: abaixo de X. O mercado mais comum é O/U 2.5 — com λ ≈ 2.7 nas grandes ligas, fica próximo de 50/50. Outros totais comuns: 1.5, 3.5 e 4.5. Mercado de duas vias sem empate possível (com linhas .5) — logo não há void."
  },
  {
    "name": "P-value",
    "full": "P-value (Probability Value)",
    "pt": "Valor de probabilidade / nível de significância",
    "cat": "estatistica",
    "def": "Probabilidade de observar um resultado tão extremo quanto o obtido, assumindo que a hipótese nula é verdadeira. <strong>Não é a probabilidade de você estar certo</strong>. Um p-value < 0.05 indica que o resultado seria improvável por acaso puro — mas não prova causalidade nem garante que o edge é real fora da amostra."
  },
  {
    "name": "IC",
    "full": "Intervalo de Confiança",
    "pt": "Faixa de incerteza em torno de uma estimativa",
    "cat": "estatistica",
    "def": "Faixa dentro da qual o valor real de um parâmetro (ex: ROI, CLV médio) deve se encontrar com determinada probabilidade. Um IC de 95% significa que, se repetíssemos o experimento muitas vezes, 95% dos intervalos calculados conteriam o valor real. Essencial para saber se o edge de uma estratégia é conclusivo ou ainda incerto."
  },
  {
    "name": "TCL",
    "full": "Teorema Central do Limite",
    "pt": "Convergência de médias para a distribuição normal",
    "cat": "estatistica",
    "def": "Com amostras grandes o suficiente, a média de qualquer distribuição tende a uma distribuição normal — independente da distribuição original. Explica por que <strong>variância de curto prazo não representa o edge real</strong>: poucos jogos não são suficientes para a média convergir ao valor esperado."
  },
  {
    "name": "Monte Carlo",
    "full": "Monte Carlo Simulation",
    "pt": "Simulação por amostragem aleatória repetida",
    "cat": "estatistica",
    "def": "Técnica que simula milhares ou milhões de cenários aleatórios para estimar a distribuição de um resultado. Em apostas: simular a evolução da banca sob diferentes estratégias, visualizar a distribuição de ROI possível e estimar o risco de ruína — em vez de depender de um único número médio."
  },
  {
    "name": "Z-score",
    "full": "Z-score / Standard Score",
    "pt": "Escore padronizado — distância da média em desvios-padrão",
    "cat": "estatistica",
    "def": "<strong>z = (x − μ) ÷ σ</strong>. Transforma qualquer valor em unidades de desvio-padrão, permitindo comparar variáveis de escalas diferentes. Em apostas: z-scores altos em variáveis de desempenho (gols, xG) indicam partidas atípicas — útil para filtrar outliers antes de modelar."
  },
  {
    "name": "Outlier",
    "full": "Outlier",
    "pt": "Valor discrepante / ponto fora da curva",
    "cat": "estatistica",
    "def": "Observação que se afasta muito das demais — geralmente além de 2–3 desvios-padrão da média. Em futebol: um 7×1, ou um jogo com 0 chutes no gol, pode distorcer médias e modelos. Decisão crítica: remover, limitar (winsorizar) ou manter — depende se é dado real ou erro de coleta."
  },
  {
    "name": "Correlação",
    "full": "Correlation",
    "pt": "Medida de relação linear entre duas variáveis",
    "cat": "estatistica",
    "def": "Varia de −1 (relação inversa perfeita) a +1 (relação direta perfeita), passando por 0 (sem relação linear). <strong>Correlação não implica causalidade.</strong> Em modelos preditivos: features altamente correlacionadas entre si (multicolinearidade) prejudicam a interpretação. Em apostas: apostas correlacionadas no mesmo evento não diversificam o risco."
  },
  {
    "name": "Variância",
    "full": "Variance",
    "pt": "Medida de dispersão dos dados em torno da média",
    "cat": "estatistica",
    "def": "Média dos quadrados dos desvios em relação à média. Em apostas: a variância de uma estratégia determina o quanto os resultados oscilam — odds mais altas têm maior variância, exigem mais apostas para o resultado convergir ao EV esperado e expõem a banca a drawdowns maiores."
  },
  {
    "name": "Desvio-padrão",
    "full": "Standard Deviation",
    "pt": "Raiz quadrada da variância — dispersão em unidade original",
    "cat": "estatistica",
    "def": "Medida de dispersão na mesma unidade dos dados. Em apostas: indica a volatilidade esperada dos resultados. Uma estratégia com ROI médio de 5% e desvio-padrão de 50% terá resultados muito diferentes de uma com desvio de 15% — ambas com o mesmo EV, mas riscos muito diferentes."
  },
  {
    "name": "Brier Score",
    "full": "Brier Score",
    "pt": "Pontuação de calibração de probabilidades",
    "cat": "estatistica",
    "def": "Métrica que avalia a qualidade de previsões probabilísticas: <strong>BS = (p − resultado)²</strong>, onde resultado é 1 (acertou) ou 0 (errou). Quanto menor o Brier Score, mais calibrado o modelo. Complementa o ROI porque avalia a qualidade das probabilidades — não apenas se acertou ou não."
  },
  {
    "name": "Log loss",
    "full": "Log Loss / Cross-Entropy Loss",
    "pt": "Perda logarítmica — penaliza confiança errada",
    "cat": "estatistica",
    "def": "Métrica de avaliação que penaliza fortemente previsões muito confiantes que erram. Diferente do Brier Score, o log loss pune mais severamente quando o modelo atribui alta probabilidade ao resultado errado. Usada para avaliar calibração de modelos de classificação."
  },
  {
    "name": "Normalização",
    "full": "Normalization / Min-Max Scaling",
    "pt": "Reescala de variável para um intervalo fixo",
    "cat": "estatistica",
    "def": "Transforma os valores de uma variável para uma escala fixe (ex: 0–1 ou 0–100%) sem alterar a distribuição relativa. <strong>(x − min) ÷ (max − min)</strong>. Essencial antes de comparar variáveis de escalas diferentes em modelos de ML ou ao remover o overround de um mercado (normalizar as probabilidades implícitas para somarem 100%)."
  },
  {
    "name": "Kelly",
    "full": "Kelly Criterion",
    "pt": "Critério de Kelly — tamanho ótimo de stake",
    "cat": "risco",
    "def": "Fórmula que determina o percentual ideal da banca a apostar para maximizar o crescimento no longo prazo: <strong>f = (p × odd − 1) ÷ (odd − 1)</strong>. O Kelly cheio assume que sua estimativa de p é perfeita — o que nunca é verdade. Na prática, usa-se <strong>Kelly fracionário</strong> (1/4 ou 1/2 do Kelly) para reduzir a volatilidade."
  },
  {
    "name": "Kelly fracionário",
    "full": "Fractional Kelly",
    "pt": "Kelly reduzido para controle de risco",
    "cat": "risco",
    "def": "Aplicar apenas uma fração do Kelly cheio (ex: 1/4, 1/2) para reduzir a volatilidade e o risco de ruína, reconhecendo que a estimativa de probabilidade nunca é perfeita. É a prática padrão de apostadores profissionais — o Kelly cheio expõe a banca a oscilações extremas mesmo com edge positivo."
  },
  {
    "name": "Drawdown",
    "full": "Drawdown",
    "pt": "Queda máxima da banca a partir de um pico",
    "cat": "risco",
    "def": "Redução percentual da banca do seu pico mais alto até o vale mais baixo subsequente. Uma estratégia +EV pode ter drawdowns expressivos por pura variância — é <strong>matematicamente esperado</strong>, não necessariamente sinal de problema. O drawdown máximo tolerável deve ser definido antes de operar."
  },
  {
    "name": "Risco de ruína",
    "full": "Risk of Ruin",
    "pt": "Probabilidade de perder toda a banca",
    "cat": "risco",
    "def": "Probabilidade de a banca chegar a zero (ou abaixo de um mínimo operacional) antes de o edge se realizar. Depende do EV, da variância, do tamanho do stake e da banca inicial. Pode ser estimado via simulação de Monte Carlo. Stakes muito altos em relação à banca elevam o risco de ruína mesmo com EV positivo."
  },
  {
    "name": "ROI",
    "full": "Return on Investment",
    "pt": "Retorno sobre o investimento",
    "cat": "risco",
    "def": "Lucro líquido dividido pelo total apostado, expresso em percentual. Em apostas esportivas, um ROI sustentado de 3–8% ao longo de grandes amostras já é considerado excelente. <strong>ROI de curto prazo é ruidoso</strong> — pode ser positivo por sorte e negativo por azar. O CLV é um indicador mais precoce e confiável de edge."
  },
  {
    "name": "Yield",
    "full": "Yield",
    "pt": "Retorno por aposta (sinônimo de ROI em apostas)",
    "cat": "risco",
    "def": "Equivalente ao ROI no contexto de apostas esportivas — lucro dividido pelo volume apostado. Alguns autores distinguem ROI (sobre banca inicial) e yield (sobre volume apostado), mas na prática os termos são usados como sinônimos. O yield de longo prazo é o indicador financeiro central de qualquer estratégia."
  },
  {
    "name": "Sharpe ratio",
    "full": "Sharpe Ratio",
    "pt": "Retorno ajustado pelo risco",
    "cat": "risco",
    "def": "Medida de retorno por unidade de risco: <strong>(retorno médio − taxa livre de risco) ÷ desvio-padrão dos retornos</strong>. Em apostas: compara estratégias de mesmo ROI mas volatilidade diferente. Uma estratégia com Sharpe alto entrega retorno consistente com baixa oscilação — preferível à de Sharpe baixo mesmo com ROI semelhante."
  },
  {
    "name": "Martingale",
    "full": "Martingale System",
    "pt": "Sistema de duplicação de stake após derrota",
    "cat": "risco",
    "def": "Estratégia de dobrar o stake após cada perda para \"recuperar\" o prejuízo na próxima aposta. <strong>Matematicamente fadada à ruína</strong> — uma sequência longa de derrotas (estatisticamente garantida no longo prazo) esgota qualquer banca. Não confundir com chasing (comparação de odds)."
  },
  {
    "name": "Paper bet / Aposta no papel",
    "full": "Paper Betting",
    "pt": "Registro simulado de apostas sem dinheiro real",
    "cat": "operacao",
    "def": "Registrar apostas como se fossem reais (jogo, odd, raciocínio, stake simulado) sem colocar dinheiro. Permite medir CLV, calibrar o processo e verificar se existe vantagem real antes de arriscar capital. <strong>Etapa obrigatória</strong> para quem está começando ou testando uma nova estratégia."
  },
  {
    "name": "Stake",
    "full": "Stake",
    "pt": "Valor apostado em cada entrada",
    "cat": "operacao",
    "def": "O montante apostado numa única entrada. Expresso em unidades (% da banca) ou em reais. Um stake bem dimensionado protege a banca da variância de curto prazo e permite que o edge se realize ao longo do tempo. Nunca deve ser ajustado para cima para \"recuperar\" perdas anteriores."
  },
  {
    "name": "Edge",
    "full": "Betting Edge",
    "pt": "Vantagem real sobre o mercado",
    "cat": "operacao",
    "def": "A vantagem estatística de uma estratégia sobre o mercado — expressa como EV positivo ou CLV positivo consistente. Ter edge não significa ganhar toda aposta: significa que, repetida muitas vezes, a estratégia produz lucro positivo. Identificar, medir e proteger o edge é o trabalho central do apostador profissional."
  },
  {
    "name": "Backtest",
    "full": "Backtesting",
    "pt": "Teste de uma estratégia em dados históricos",
    "cat": "operacao",
    "def": "Simulação de uma estratégia ou modelo em dados do passado para avaliar seu desempenho histórico. Um backtest bem feito usa dados out-of-sample, inclui custos reais (margem, limites) e aplica validação temporal (walk-forward). Um backtest mal feito — com look-ahead bias ou data snooping — é pior do que não testar: cria falsa confiança."
  },
  {
    "name": "Feature engineering",
    "full": "Feature Engineering",
    "pt": "Criação de variáveis preditoras",
    "cat": "operacao",
    "def": "Processo de criar, transformar e selecionar as variáveis (features) que serão usadas como input em modelos preditivos. Ex: forma recente (últimos 5 jogos), saldo de xG dos últimos 3 jogos em casa, dias de descanso. A qualidade das features determina o teto de desempenho de qualquer modelo — mais do que o algoritmo em si."
  },
  {
    "name": "P&L",
    "full": "Profit & Loss",
    "pt": "Resultado financeiro — lucro e prejuízo",
    "cat": "operacao",
    "def": "Resumo do resultado financeiro líquido de uma estratégia num período: total apostado, retorno bruto, custo de margem e lucro/prejuízo final. O P&L de curto prazo é ruidoso demais para avaliar se uma estratégia tem edge real — por isso o CLV precede o P&L como métrica de qualidade de processo."
  },
  {
    "name": "Overfitting",
    "full": "Overfitting",
    "pt": "Sobreajuste — modelo ou estratégia que memoriza o passado",
    "cat": "operacao",
    "def": "Quando um modelo ou estratégia se ajusta tão bem aos dados históricos que perde capacidade de funcionar em dados novos. É o principal motivo pelo qual backtests perfeitos quebram ao vivo. Aparece quando há muitas variáveis ajustadas para poucos dados, ou quando o período de teste foi usado para calibrar o próprio modelo."
  },
  {
    "name": "Slippage",
    "full": "Slippage",
    "pt": "Diferença entre odd esperada e odd obtida",
    "cat": "operacao",
    "def": "Quando a odd muda entre o momento em que você decide apostar e o momento em que a aposta é confirmada. Comum em mercados de alta liquidez com movimento rápido. Em backtests, ignorar slippage infla artificialmente o desempenho — na prática, parte do edge pode ser consumida por ele."
  }
];
