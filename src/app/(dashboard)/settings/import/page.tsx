'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { FileJson, FileSpreadsheet, Upload, Check, AlertTriangle } from 'lucide-react'
import { CsvImportModal } from '@/components/ui/csv-import-modal'

export default function ImportPage() {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)
  const [importFormat, setImportFormat] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [csvOpen, setCsvOpen] = useState(false)

  const handleFileUpload = async (format: string, file: File) => {
    try {
      const text = await file.text()
      let data: any

      if (format === 'trello' || format === 'anderflow') {
        data = JSON.parse(text)
      } else {
        data = text
      }

      setPreviewData({ format, data, fileName: file.name })
      setImportFormat(format)
      setPreviewOpen(true)
    } catch {
      toast.error('Erro ao ler arquivo. Verifique o formato.')
    }
  }

  const handleCsvImport = async (tasks: any[]) => {
    setPreviewData({ format: 'csv_tasks', data: tasks, fileName: 'tasks.csv' })
    setImportFormat('csv_tasks')
    setPreviewOpen(true)
    setCsvOpen(false)
  }

  const executeImport = async () => {
    if (!previewData) return
    setImporting(true)
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: previewData.format, data: previewData.data }),
      })
      const json = await res.json()
      setResult(json.data || json)
      setPreviewOpen(false)
      if (res.ok) {
        toast.success('Importação concluída!')
      }
    } catch {
      toast.error('Erro na importação')
    }
    setImporting(false)
  }

  return (
    <div className="p-6 space-y-6 animate-page-enter">
      <div>
        <h1 className="text-[17px] font-[500] tracking-[-0.015em]">Importação de Dados</h1>
        <p className="text-[12px] text-[var(--text-3)] mt-1">Importe dados de sistemas externos</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="hover:border-[var(--accent)]/30 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-[var(--accent)]" />
              <CardTitle className="text-[14px]">Trello</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-[12px] text-[var(--text-2)]">Export JSON do Trello. Boards viram projetos, lists viram marcos, cards viram tarefas.</p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-2xs">boards → projetos</Badge>
              <Badge variant="secondary" className="text-2xs">lists → marcos</Badge>
              <Badge variant="secondary" className="text-2xs">cards → tarefas</Badge>
            </div>
            <label className="block mt-2">
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload('trello', f); e.target.value = '' }}
              />
              <Button variant="outline" size="sm" className="w-full h-8 text-[12px] gap-1" asChild>
                <span><Upload className="h-3.5 w-3.5" /> Selecionar JSON</span>
              </Button>
            </label>
          </CardContent>
        </Card>

        <Card className="hover:border-[var(--accent)]/30 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-[var(--accent)]" />
              <CardTitle className="text-[14px]">CSV de Clientes</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-[12px] text-[var(--text-2)]">CSV com colunas: nome, email, empresa, telefone (ou name, email, company, phone).</p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-2xs">usuários CLIENT</Badge>
              <Badge variant="secondary" className="text-2xs">.csv / .txt</Badge>
            </div>
            <label className="block mt-2">
              <input
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload('csv_clients', f); e.target.value = '' }}
              />
              <Button variant="outline" size="sm" className="w-full h-8 text-[12px] gap-1" asChild>
                <span><Upload className="h-3.5 w-3.5" /> Selecionar CSV</span>
              </Button>
            </label>
          </CardContent>
        </Card>

        <Card className="hover:border-[var(--accent)]/30 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-[var(--accent)]" />
              <CardTitle className="text-[14px]">Export ANDERFLOW</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-[12px] text-[var(--text-2)]">JSON exportado da própria ferramenta. Restaura projetos, clientes e tarefas.</p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-2xs">formato nativo</Badge>
              <Badge variant="secondary" className="text-2xs">projetos + tarefas</Badge>
            </div>
            <label className="block mt-2">
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload('anderflow', f); e.target.value = '' }}
              />
              <Button variant="outline" size="sm" className="w-full h-8 text-[12px] gap-1" asChild>
                <span><Upload className="h-3.5 w-3.5" /> Selecionar JSON</span>
              </Button>
            </label>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[14px]">Importar Tarefas por CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[12px] text-[var(--text-2)] mb-3">Use o modal de importação CSV para importar tarefas para um projeto existente.</p>
          <Button variant="outline" size="sm" onClick={() => setCsvOpen(true)} className="h-8 text-[12px]">
            Abrir importador CSV
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-[var(--accent)]/30">
          <CardContent className="p-4 space-y-2">
            <h3 className="text-[14px] font-[500]">Resultado da Importação</h3>
            <div className="flex items-center gap-3 text-[12px]">
              <span className="text-[var(--success)]"><Check className="h-3.5 w-3.5 inline mr-1" />{result.created} criados</span>
              <span className="text-[var(--text-3)]">{result.ignored} ignorados</span>
              {result.errors > 0 && <span className="text-[var(--destructive)]"><AlertTriangle className="h-3.5 w-3.5 inline mr-1" />{result.errors} erros</span>}
            </div>
            {result.details?.map((d: string, i: number) => (
              <p key={i} className="text-[11px] text-[var(--text-3)]">{d}</p>
            ))}
          </CardContent>
        </Card>
      )}

      <CsvImportModal open={csvOpen} onClose={() => setCsvOpen(false)} onImport={handleCsvImport} />

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview da Importação</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-[12px] text-[var(--text-2)]">
              Formato: <Badge variant="outline" className="text-2xs">{importFormat}</Badge>
              {' '}Arquivo: <span className="text-[var(--text)]">{previewData?.fileName}</span>
            </p>
            <div className="bg-[var(--surface-2)] rounded-lg p-3 max-h-[300px] overflow-y-auto">
              <pre className="text-[11px] text-[var(--text-3)] whitespace-pre-wrap font-mono">
                {JSON.stringify(
                  importFormat === 'csv_clients' && typeof previewData?.data === 'string'
                    ? previewData.data.split('\n').slice(0, 5).join('\n')
                    : previewData?.data,
                  null, 2
                ).slice(0, 3000)}
              </pre>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Cancelar</Button>
            <Button onClick={executeImport} disabled={importing}>{importing ? 'Importando...' : 'Confirmar Importação'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
