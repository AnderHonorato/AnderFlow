'use client'

import { useState, useRef, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { Upload, FileText, AlertCircle, X } from 'lucide-react'
import Papa from 'papaparse'

interface CsvImportModalProps {
  open: boolean
  onClose: () => void
  onImport: (tasks: { title: string; description?: string; deadline?: string }[]) => Promise<void>
}

export function CsvImportModal({ open, onClose, onImport }: CsvImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [columns, setColumns] = useState<string[]>([])
  const [preview, setPreview] = useState<string[][]>([])
  const [titleCol, setTitleCol] = useState('')
  const [descCol, setDescCol] = useState('')
  const [deadlineCol, setDeadlineCol] = useState('')
  const [importing, setImporting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const parseFile = useCallback((f: File) => {
    if (!f.name.endsWith('.csv') && !f.name.endsWith('.txt')) {
      toast.error('Apenas arquivos .csv ou .txt são aceitos')
      return
    }
    setFile(f)

    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const cols = results.meta.fields || []
        setColumns(cols)
        const rows = results.data.slice(0, 5).map((row: any) => cols.map(c => row[c] || ''))
        setPreview(rows)

        const titleGuess = cols.find(c => /titulo|title|nome|name|tarefa|task/i.test(c))
        const descGuess = cols.find(c => /descri|description|desc/i.test(c))
        const deadlineGuess = cols.find(c => /prazo|deadline|data|date|vencimento|due/i.test(c))

        if (titleGuess) setTitleCol(titleGuess)
        if (descGuess) setDescCol(descGuess)
        if (deadlineGuess) setDeadlineCol(deadlineGuess)
      },
      error: () => toast.error('Erro ao ler o arquivo CSV'),
    })
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) parseFile(f)
  }, [parseFile])

  const handleImport = async () => {
    if (!titleCol || !file) {
      toast.error('Selecione ao menos a coluna de título')
      return
    }

    setImporting(true)
    try {
      const tasks: { title: string; description?: string; deadline?: string }[] = []

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        step: (row: any) => {
          const data = row.data
          if (data[titleCol]) {
            tasks.push({
              title: data[titleCol].trim(),
              description: descCol && data[descCol] ? data[descCol].trim() : undefined,
              deadline: deadlineCol && data[deadlineCol] ? data[deadlineCol].trim() : undefined,
            })
          }
        },
        complete: async () => {
          await onImport(tasks)
          onClose()
        },
        error: () => toast.error('Erro ao processar o arquivo'),
      })
    } catch {
      toast.error('Erro ao importar tarefas')
    }
    setImporting(false)
  }

  const reset = () => {
    setFile(null)
    setColumns([])
    setPreview([])
    setTitleCol('')
    setDescCol('')
    setDeadlineCol('')
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-[500]">Importar tarefas via CSV</DialogTitle>
        </DialogHeader>

        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                : 'border-[var(--border)] hover:border-[var(--text-3)]'
            }`}
          >
            <Upload className="h-8 w-8 mx-auto mb-3 text-[var(--text-3)]" />
            <p className="text-sm font-medium text-[var(--text-2)]">
              Arraste um arquivo CSV ou clique para selecionar
            </p>
            <p className="text-xs text-[var(--text-3)] mt-1">Formatos aceitos: .csv, .txt</p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) parseFile(f)
              }}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
              <FileText className="h-4 w-4 text-[var(--text-3)] shrink-0" />
              <span className="text-sm flex-1 truncate">{file.name}</span>
              <Button variant="ghost" size="icon-sm" onClick={reset}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {preview.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[var(--text-3)] mb-2 uppercase tracking-wider">
                  Preview ({preview.length} de 5 linhas)
                </p>
                <ScrollArea className="max-h-[200px] border border-[var(--border)] rounded-lg">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[var(--surface)]">
                        {columns.map((col) => (
                          <th key={col} className="text-left p-2 font-medium text-[var(--text-2)]">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-t border-[var(--border)]">
                          {row.map((cell, j) => (
                            <td key={j} className="p-2 text-[var(--text-3)] max-w-[200px] truncate">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-xs font-medium text-[var(--text-3)] uppercase tracking-wider">Mapear colunas</p>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-2)]">
                    Título <span className="text-[var(--destructive)]">*</span>
                  </label>
                  <select
                    value={titleCol}
                    onChange={(e) => setTitleCol(e.target.value)}
                    className="w-full h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="">Selecionar...</option>
                    {columns.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-2)]">Descrição</label>
                  <select
                    value={descCol}
                    onChange={(e) => setDescCol(e.target.value)}
                    className="w-full h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="">Não importar</option>
                    {columns.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-2)]">Prazo</label>
                  <select
                    value={deadlineCol}
                    onChange={(e) => setDeadlineCol(e.target.value)}
                    className="w-full h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="">Não importar</option>
                    {columns.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancelar
          </Button>
          {file && (
            <Button size="sm" onClick={handleImport} disabled={!titleCol || importing} className="gap-1.5">
              {importing ? 'Importando...' : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  Importar tarefas
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
