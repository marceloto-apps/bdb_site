import { Crown, ExternalLink, TrendingUp, BarChart3, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// Dados estáticos das ligas VIP
const LIGAS_VIP = [
  { pais: 'Inglaterra', bandeira: '🏴', ligas: ['Premier League', 'Championship', 'League 1', 'League 2'] },
  { pais: 'Itália', bandeira: '🇮🇹', ligas: ['Série A', 'Série B'] },
  { pais: 'Espanha', bandeira: '🇪🇸', ligas: ['La Liga', 'Segunda División'] },
  { pais: 'França', bandeira: '🇫🇷', ligas: ['Ligue 1', 'Ligue 2'] },
  { pais: 'Alemanha', bandeira: '🇩🇪', ligas: ['Bundesliga', 'Bundesliga 2'] },
  { pais: 'Holanda', bandeira: '🇳🇱', ligas: ['Eredivisie'] },
  { pais: 'Escócia', bandeira: '🏴', ligas: ['Premier', 'Championship'] },
  { pais: 'Portugal', bandeira: '🇵🇹', ligas: ['Primeira Liga'] },
  { pais: 'Turquia', bandeira: '🇹🇷', ligas: ['Superliga'] },
  { pais: 'Bélgica', bandeira: '🇧🇪', ligas: ['Pro League'] },
  { pais: 'Noruega', bandeira: '🇳🇴', ligas: ['Eliteserien'] },
  { pais: 'Dinamarca', bandeira: '🇩🇰', ligas: ['Superliga'] },
  { pais: 'Romênia', bandeira: '🇷🇴', ligas: ['Superliga'] },
  { pais: 'Áustria', bandeira: '🇦🇹', ligas: ['Bundesliga'] },
  { pais: 'Polônia', bandeira: '🇵🇱', ligas: ['Ekstraklasa'] },
  { pais: 'Suíça', bandeira: '🇨🇭', ligas: ['Super League'] },
  { pais: 'Brasil', bandeira: '🇧🇷', ligas: ['Série A'] },
  { pais: 'EUA', bandeira: '🇺🇸', ligas: ['MLS'] },
]

// Conta total de ligas
const TOTAL_LIGAS = LIGAS_VIP.reduce((acc, p) => acc + p.ligas.length, 0)

const LINK_CHECKOUT = 'https://hub.la/g/QjzvY65eA2zEHmrpcXct'

export function VipPackSection() {
  return (
    <section className="border-t border-border bg-background py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        {/* Cabeçalho */}
        <div className="mb-12 text-center">
          <Badge className="mb-4 gap-1 border-data-yellow/40 bg-data-yellow/10 text-data-yellow hover:bg-data-yellow/10">
            <Crown className="h-3.5 w-3.5" />
            Pacote Completo
          </Badge>
          <h2 className="font-display text-3xl font-bold text-text-primary md:text-4xl">
            {TOTAL_LIGAS} ligas. Uma vantagem que poucos têm.
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-text-secondary">
            Enquanto a maioria aposta olhando tabela de classificação, você vai
            operar com as mesmas variáveis estatísticas que alimentam modelos
            profissionais — em{' '}
            <strong className="text-text-primary">{TOTAL_LIGAS} ligas</strong>{' '}
            do futebol mundial.
          </p>
        </div>

        {/* Proposta de valor — 3 cards */}
        <div className="mb-12 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: BarChart3,
              titulo: 'Análise que o mercado não entrega',
              texto:
                'Odds, dispersão, médias ponderadas e tendências de lucratividade. Dados que vão muito além do que qualquer site de estatísticas oferece de graça.',
            },
            {
              icon: TrendingUp,
              titulo: 'Identifique valor antes do mercado',
              texto:
                'Compare o comportamento real dos times com as odds oferecidas. Quando os números divergem do mercado, ali mora a oportunidade.',
            },
            {
              icon: Zap,
              titulo: 'Atualização automática por temporada',
              texto:
                'A partir da 6ª rodada, as planilhas recebem os códigos de atualização automática. Você opera com dados frescos sem esforço manual.',
            },
          ].map((card) => (
            <div
              key={card.titulo}
              className="rounded-xl border border-border bg-surface p-6"
            >
              <card.icon className="mb-3 h-8 w-8 text-data-yellow" />
              <h3 className="mb-2 font-display text-lg font-bold text-text-primary">
                {card.titulo}
              </h3>
              <p className="text-sm leading-relaxed text-text-secondary">
                {card.texto}
              </p>
            </div>
          ))}
        </div>

        {/* Grid de ligas */}
        <div className="mb-12 overflow-hidden rounded-xl border border-border bg-surface">
          <div className="border-b border-border px-6 py-4">
            <h3 className="font-display text-lg font-bold text-text-primary">
              Ligas incluídas no pacote
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
            {LIGAS_VIP.map((pais) => (
              <div
                key={pais.pais}
                className="flex items-start gap-3 bg-surface px-5 py-4"
              >
                <span className="mt-0.5 text-2xl leading-none">
                  {pais.bandeira}
                </span>
                <div>
                  <span className="text-sm font-semibold text-text-primary">
                    {pais.pais}
                  </span>
                  <p className="text-sm text-text-muted">
                    {pais.ligas.join(' · ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA de compra */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="rounded-xl border border-data-yellow/20 bg-data-yellow/5 p-8">
            <Crown className="mx-auto mb-4 h-10 w-10 text-data-yellow" />
            <h3 className="font-display text-2xl font-bold text-text-primary">
              Pare de competir no escuro contra as casas
            </h3>
            <p className="mx-auto mt-3 max-w-lg text-text-secondary">
              As casas de apostas operam com algoritmos, modelos e bilhões de
              dados históricos. Com o pacote completo de planilhas, você
              finalmente tem acesso ao mesmo nível de profundidade estatística —
              em {TOTAL_LIGAS} ligas.
            </p>

            <a
              href={LINK_CHECKOUT}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block"
            >
              <Button
                size="lg"
                className="gap-2 bg-data-yellow text-black hover:bg-data-yellow/90"
              >
                Quero o pacote completo
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>

            <p className="mt-4 text-xs text-text-muted">
              Pagamento seguro via Hubla. Acesso imediato após confirmação.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
