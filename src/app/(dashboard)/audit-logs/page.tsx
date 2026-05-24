'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search, Filter, User, FolderKanban, CreditCard,
  Shield, Key, Settings, Clock,
} from 'lucide-react'

function getTypeIcon(entity: string) {
  switch (entity) {
    case 'auth': return <Shield className="h-4 w-4 text-[var(--info)]" />
    case 'Project': return <FolderKanban className="h-4 w-4 text-[var(--accent)]" />
    case 'Invoice': return <CreditCard className="h-4 w-4 text-[var(--success)]" />
    case 'Ticket': return <Settings className="h-4 w-4 text-[var(--warning)]" />
    case 'File': return <FolderKanban className="h-4 w-4 text-[var(--text-3)]" />
    case 'Settings': return <Settings className="h-4 w-4 text-purple-500" />
    case 'Contract': return <FileText className="h-4 w-4 text-[var(--info)]" />
    case 'User': return <User className="h-4 w-4 text-[var(--accent)]" />
    default: return <Clock className="h-4 w-4 text-[var(--text-3)]" />
  }
}

import { FileText } from 'lucide-react'

const entityOptions = ['', 'Project', 'Invoice', 'Contract', 'Ticket', 'User', 'File', 'Settings', 'auth']

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)

  const loadLogs = async (p = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(p))
      params.set('limit', '50')
      if (entityFilter) params.set('entity', entityFilter)

      const res = await fetch(`/api/audit?${params}`)
      const json = await res.json()
      setLogs(json.data || [])
      setPagination(json.pagination)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { loadLogs(page) }, [page, entityFilter])

  const filtered = logs.filter(log => {
    if (!search) return true
    const s = search.toLowerCase()
    return (log.entity?.toLowerCase().includes(s) ||
            log.action?.toLowerCase().includes(s) ||
            log.description?.toLowerCase().includes(s) ||
            log.userName?.toLowerCase().includes(s))
  })

  return (
    <div className="p-6 space-y-5 animate-page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-[500]">Logs de Auditoria</h1>
          <p className="text-[12px] text-[var(--text-3)] mt-1">
            Registro completo de todas as atividades da plataforma
            {pagination && <span className="ml-1">({pagination.total} registros)</span>}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-3)]" />
          <Input placeholder="Buscar logs..." className="pl-9 h-8 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select
          value={entityFilter}
          onChange={e => { setEntityFilter(e.target.value); setPage(1) }}
          className="h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
        >
          <option value="">Todas entidades</option>
          {entityOptions.filter(Boolean).map(e => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {filtered.map((log) => (
                <div key={log.id} className="flex items-center gap-4 p-4 hover:bg-[var(--surface)] transition-colors">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--surface-2)]">
                    {getTypeIcon(log.entity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-[500] text-[var(--text)]">
                        {log.userName || log.userId || 'Sistema'}
                      </span>
                      <Badge variant="secondary" className="text-2xs">{log.action}</Badge>
                      <span className="text-[11px] text-[var(--text-3)]">{log.entity}</span>
                      {log.entityId && <span className="text-[10px] text-[var(--text-3)] font-mono">{log.entityId.slice(0, 8)}</span>}
                    </div>
                    <p className="text-[11px] text-[var(--text-3)] mt-0.5 truncate">
                      {log.description || log.details || '-'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-[var(--text-3)]">
                      {new Date(log.createdAt).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="p-8 text-center text-[13px] text-[var(--text-3)]">
                  Nenhum log de auditoria encontrado.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="h-7 text-[11px]"
          >
            Anterior
          </Button>
          <span className="text-[12px] text-[var(--text-3)]">
            {page} de {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.pages}
            onClick={() => setPage(p => p + 1)}
            className="h-7 text-[11px]"
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  )
}
