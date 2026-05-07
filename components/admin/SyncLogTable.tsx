'use client'

import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, RefreshCw, FileText } from 'lucide-react'

interface SyncLogTableProps {
  logs: Array<any>
}

export function SyncLogTable({ logs }: SyncLogTableProps) {
  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-md bg-muted/10 border-dashed">
        <FileText className="w-8 h-8 text-muted-foreground opacity-50 mb-2" />
        <p className="text-sm text-muted-foreground">Nenhuma sincronização realizada recentemente.</p>
      </div>
    )
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Resultado</TableHead>
            <TableHead className="text-right">Duração</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const date = new Date(log.createdAt).toLocaleString()
            
            let statusBadge
            if (log.status === 'RUNNING') {
              statusBadge = (
                <Badge variant="outline" className="text-blue-500 border-blue-500/50 bg-blue-500/10">
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Em andamento
                </Badge>
              )
            } else if (log.status === 'COMPLETED') {
              statusBadge = (
                <Badge variant="outline" className="text-green-500 border-green-500/50 bg-green-500/10">
                  <CheckCircle className="w-3 h-3 mr-1" /> Concluído
                </Badge>
              )
            } else {
              statusBadge = (
                <Badge variant="outline" className="text-red-500 border-red-500/50 bg-red-500/10">
                  <XCircle className="w-3 h-3 mr-1" /> Falhou
                </Badge>
              )
            }

            let resultText = '—'
            if (log.result) {
              if (log.type === 'PARTIDAS') {
                resultText = `${log.result.total} proc. · ${log.result.created} novos · ${log.result.updated} atualizados`
              } else if (log.type === 'ODDS') {
                resultText = `${log.result.withOdds} c/ odds · ${log.result.created} reg. criados · reqs: ${log.result.requestsUsed}`
              }
            }

            return (
              <TableRow key={log.id}>
                <TableCell className="text-sm whitespace-nowrap">{date}</TableCell>
                <TableCell className="font-medium text-xs">{log.type}</TableCell>
                <TableCell>{statusBadge}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                  {resultText}
                  {log.error && <span className="text-red-500 block truncate" title={log.error}>{log.error}</span>}
                </TableCell>
                <TableCell className="text-right text-xs font-mono">
                  {log.duration ? `${(log.duration / 1000).toFixed(1)}s` : '—'}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
