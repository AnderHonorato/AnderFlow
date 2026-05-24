'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Download, Database, AlertTriangle, RefreshCw, HardDrive } from 'lucide-react'

export default function BackupPage() {
  const [backups, setBackups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)

  const loadBackups = () => {
    setLoading(true)
    fetch('/api/backup-logs')
      .then(r => r.json())
      .then(json => setBackups(json.data || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadBackups() }, [])

  const runBackup = async () => {
    setRunning(true)
    try {
      const res = await fetch('/api/cron/backup')
      const json = await res.json()
      if (json.success) {
        toast.success(`Backup gerado: ${json.filename} (${(json.size / 1024).toFixed(1)} KB)`)
        loadBackups()
      } else toast.error(json.error || 'Erro no backup')
    } catch { toast.error('Erro de conexao') }
    setRunning(false)
  }

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-medium">Backup do Banco</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie backups automaticos dos dados</p>
      </div>

      <Card className="border-warning/30">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Configuracao necessaria</p>
            <p className="text-xs text-muted-foreground mt-1">
              Configure <code className="text-xs bg-[var(--surface-2)] px-1 rounded">BACKUP_EMAIL</code> no .env para receber os backups por email via Resend.
              O backup atual exporta os dados em JSON. Para producao, configure pg_dump ou um servico de backup gerenciado.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={runBackup} disabled={running}>
          {running ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
          {running ? 'Gerando backup...' : 'Fazer backup agora'}
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Historico de Backups</CardTitle></CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhum backup registrado ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-2 text-xs text-muted-foreground font-medium">Arquivo</th>
                    <th className="text-left py-2 text-xs text-muted-foreground font-medium">Tamanho</th>
                    <th className="text-left py-2 text-xs text-muted-foreground font-medium">Status</th>
                    <th className="text-left py-2 text-xs text-muted-foreground font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((b: any) => (
                    <tr key={b.id} className="border-b border-[var(--border)]">
                      <td className="py-2 text-xs font-mono">{b.filename?.split('#')[0] || b.filename}</td>
                      <td className="py-2 text-xs">{b.size > 0 ? `${(b.size / 1024).toFixed(1)} KB` : '-'}</td>
                      <td className="py-2">
                        <span className={`text-2xs px-1.5 py-0.5 rounded ${b.status === 'completed' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-2 text-xs">{new Date(b.createdAt).toLocaleString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
