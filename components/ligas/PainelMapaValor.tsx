'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Map, CheckCircle, XCircle } from 'lucide-react'

interface MapaValorFaixa {
  faixa: { label: string; min: number; max: number }
  totalApostas: number
  acertos: number
  roi: number
  lucroPerda: number
}

interface PainelMapaValorProps {
  mapaValor: {
    casa: MapaValorFaixa[]
    empate: MapaValorFaixa[]
    visitante: MapaValorFaixa[]
  }
}

export function PainelMapaValor({ mapaValor }: PainelMapaValorProps) {
  
  const renderTabela = (dados: MapaValorFaixa[]) => {
    let totalApostasGeral = 0
    let totalAcertosGeral = 0
    let totalLucroGeral = 0

    dados.forEach(d => {
      totalApostasGeral += d.totalApostas
      totalAcertosGeral += d.acertos
      totalLucroGeral += d.lucroPerda
    })

    const roiGeral = totalApostasGeral > 0 ? (totalLucroGeral / totalApostasGeral) * 100 : 0

    return (
      <div className="border rounded-md overflow-hidden overflow-x-auto">
        <Table className="min-w-[500px]">
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[120px]">Faixa</TableHead>
              <TableHead className="text-right">Apostas</TableHead>
              <TableHead className="text-right">Acertos</TableHead>
              <TableHead className="text-right w-[120px]">ROI%</TableHead>
              <TableHead className="text-right">Lucro/Perda</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dados.map((d) => {
              const semApostas = d.totalApostas === 0
              const roiPositivo = d.roi > 0
              const roiNegativo = d.roi < 0

              return (
                <TableRow key={d.faixa.label} className={semApostas ? 'opacity-50' : ''}>
                  <TableCell className="font-medium font-mono text-xs">{d.faixa.label}</TableCell>
                  <TableCell className="text-right font-mono">{semApostas ? '—' : d.totalApostas}</TableCell>
                  <TableCell className="text-right font-mono">{semApostas ? '—' : d.acertos}</TableCell>
                  <TableCell className="text-right font-mono">
                    {semApostas ? (
                      '—'
                    ) : (
                      <div className={`flex items-center justify-end gap-1.5 ${roiPositivo ? 'text-green-500 font-bold' : roiNegativo ? 'text-red-500 font-bold' : ''}`}>
                        {d.roi > 0 ? '+' : ''}{d.roi.toFixed(1)}%
                        {roiPositivo && <CheckCircle className="w-3.5 h-3.5" />}
                        {roiNegativo && <XCircle className="w-3.5 h-3.5" />}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {semApostas ? (
                      '—'
                    ) : (
                      <span className={d.lucroPerda > 0 ? 'text-green-500' : d.lucroPerda < 0 ? 'text-red-500' : ''}>
                        {d.lucroPerda > 0 ? '+' : ''}{d.lucroPerda.toFixed(1)}u
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
          {totalApostasGeral > 0 && (
            <tfoot className="bg-muted/30 font-bold border-t-2 border-border">
              <TableRow>
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-right font-mono">{totalApostasGeral}</TableCell>
                <TableCell className="text-right font-mono">{totalAcertosGeral}</TableCell>
                <TableCell className="text-right font-mono">
                  <span className={roiGeral > 0 ? 'text-green-500' : roiGeral < 0 ? 'text-red-500' : ''}>
                    {roiGeral > 0 ? '+' : ''}{roiGeral.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono">
                  <span className={totalLucroGeral > 0 ? 'text-green-500' : totalLucroGeral < 0 ? 'text-red-500' : ''}>
                    {totalLucroGeral > 0 ? '+' : ''}{totalLucroGeral.toFixed(1)}u
                  </span>
                </TableCell>
              </TableRow>
            </tfoot>
          )}
        </Table>
      </div>
    )
  }

  return (
    <Card className="flex flex-col h-full bg-card shadow-sm">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Map className="w-5 h-5 text-primary" />
          Mapa de Valor — ROI por Faixa
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 md:p-6">
        <Tabs defaultValue="casa" className="w-full">
          <TabsList className="w-full sm:w-auto grid grid-cols-3 mb-6">
            <TabsTrigger value="casa">Casa</TabsTrigger>
            <TabsTrigger value="empate">Empate</TabsTrigger>
            <TabsTrigger value="visitante">Visitante</TabsTrigger>
          </TabsList>
          <TabsContent value="casa" className="mt-0 outline-none">
            {renderTabela(mapaValor.casa)}
          </TabsContent>
          <TabsContent value="empate" className="mt-0 outline-none">
            {renderTabela(mapaValor.empate)}
          </TabsContent>
          <TabsContent value="visitante" className="mt-0 outline-none">
            {renderTabela(mapaValor.visitante)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
