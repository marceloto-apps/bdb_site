import { FileSpreadsheet } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-text-secondary">
          <FileSpreadsheet className="h-4 w-4 text-primary" />
          Ferramentas em Excel para análise esportiva
        </div>

        <h1 className="mx-auto max-w-4xl font-display text-4xl font-extrabold tracking-tight text-text-primary md:text-5xl lg:text-6xl">
          Dados avançados para obter vantagem matemática.{' '}
          <span className="text-primary">Agora na sua mão.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-text-secondary md:text-xl">
          Planilhas com estatísticas profundas por liga — odds, dispersão,
          tendências de lucratividade e variáveis que vão além da tabela de
          classificação.
        </p>
      </div>
    </section>
  )
}
