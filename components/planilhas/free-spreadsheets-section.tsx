'use client'

import { Spreadsheet } from '@prisma/client'

import {
  Download,
  Settings,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface FreeSpreadsheetsProps {
  planilhas: Spreadsheet[]
}

export function FreeSpreadsheetsSection({ planilhas }: FreeSpreadsheetsProps) {
  if (planilhas.length === 0) return null

  const planilha = planilhas[0] // Brasileirão (única free por enquanto)

  return (
    <section className="border-t border-border py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        {/* Cabeçalho da seção */}
        <div className="mb-12 text-center">
          <Badge
            variant="outline"
            className="mb-4 border-primary/40 text-primary"
          >
            Download gratuito
          </Badge>
          <h2 className="font-display text-3xl font-bold text-text-primary md:text-4xl">
            Comece agora com a planilha do Brasileirão
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-text-secondary">
            Análise completa da Série A com as mesmas variáveis estatísticas
            usadas nas planilhas profissionais. Sem custo, sem pegadinha.
          </p>
        </div>

        {/* Card principal */}
        <div className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-border bg-surface">
          {/* Header do card */}
          <div className="flex items-center justify-between border-b border-border px-6 py-5 md:px-8">
            <div className="flex items-center gap-4">
              {/* Bandeira do Brasil */}
              <span className="text-4xl">🇧🇷</span>
              <div>
                <h3 className="font-display text-xl font-bold text-text-primary">
                  {planilha.name}
                </h3>
                <p className="text-sm text-text-muted">
                  {planilha.league} · {planilha.fileName}
                  {planilha.fileSize && ` · ${planilha.fileSize}`}
                </p>
              </div>
            </div>
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
              Grátis
            </Badge>
          </div>

          {/* Corpo do card */}
          <div className="px-6 py-6 md:px-8">
            {/* Descrição */}
            <p className="mb-6 text-text-secondary">{planilha.description}</p>

            {/* O que você encontra */}
            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              {[
                { icon: '📊', text: 'Análise de odds por mercado' },
                { icon: '📉', text: 'Medidas de dispersão por time' },
                { icon: '🔄', text: 'Comparação com o comportamento do mercado' },
                { icon: '📈', text: 'Tendências de lucratividade' },
                { icon: '🧠', text: 'Variáveis estatísticas avançadas' },
                { icon: '⚡', text: 'Atualização automática via macros' },
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-3 rounded-lg border border-border/50 bg-background px-4 py-3"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm text-text-secondary">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Instruções de primeiro acesso */}
            <Accordion type="single" collapsible className="mb-6">
              <AccordionItem value="instrucoes" className="border-border">
                <AccordionTrigger className="text-sm font-semibold text-text-primary hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    Instruções de primeiro acesso
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {/* Passo a passo */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-text-primary">
                        Configuração inicial
                      </h4>
                      <ol className="space-y-2 text-sm text-text-secondary">
                        <li className="flex items-start gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            1
                          </span>
                          <span>
                            Baixe o arquivo clicando no botão abaixo e salve no
                            seu computador
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            2
                          </span>
                          <span>
                            <strong>Feche o arquivo</strong> após o download
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            3
                          </span>
                          <span>
                            Reabra o arquivo{' '}
                            <strong>
                              diretamente da pasta onde foi salvo
                            </strong>{' '}
                            (não abra pelo navegador)
                          </span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            4
                          </span>
                          <span>
                            Vá até a aba <strong>&quot;Inicial&quot;</strong> da planilha
                            e siga o passo a passo para{' '}
                            <strong>habilitar as macros</strong>
                          </span>
                        </li>
                      </ol>

                      <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-4 py-3">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                        <span className="text-sm text-primary">
                          Pronto! A planilha estará funcionando corretamente.
                        </span>
                      </div>
                    </div>

                    {/* Avisos */}
                    <div className="space-y-2 rounded-lg border border-data-yellow/20 bg-data-yellow/5 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-data-yellow" />
                        <span className="text-sm font-semibold text-data-yellow">
                          Observações importantes
                        </span>
                      </div>
                      <ul className="space-y-1 text-sm text-text-secondary">
                        <li>
                          • As macros funcionam apenas no{' '}
                          <strong>Excel 2016 ou superior</strong>
                        </li>
                        <li>
                          • As planilhas são atualizadas a cada nova temporada a
                          partir da <strong>6ª rodada</strong>, quando os códigos
                          de atualização automática são inseridos
                        </li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Botão de download */}
            <a
              href={planilha.fileUrl}
              download={planilha.fileName}
              className="block"
            >
              <Button
                size="lg"
                className="w-full gap-2 bg-primary text-black hover:bg-primary-dark"
              >
                <Download className="h-5 w-5" />
                Baixar Planilha Brasileirão 2026
                {planilha.fileSize && (
                  <span className="text-black/60">({planilha.fileSize})</span>
                )}
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
