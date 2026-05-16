'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { IconSearch, IconCheck, IconClose, IconSettings, IconFilter, IconChevronDown } from '@/components/icons'
import { cn } from '@/lib/utils'

const ALL_PERMISSIONS = [
  { key: 'manage_users', label: 'Gerenciar Usuarios' },
  { key: 'manage_projects', label: 'Gerenciar Projetos' },
  { key: 'manage_clients', label: 'Gerenciar Clientes' },
  { key: 'manage_financial', label: 'Financeiro' },
  { key: 'manage_contracts', label: 'Contratos' },
  { key: 'manage_crm', label: 'CRM' },
  { key: 'manage_chat', label: 'Chat/Mensagens' },
  { key: 'manage_analytics', label: 'Analytics' },
  { key: 'manage_automations', label: 'Automacoes' },
  { key: 'manage_tickets', label: 'Tickets' },
  { key: 'manage_knowledge', label: 'Conhecimento' },
  { key: 'manage_settings', label: 'Configuracoes' },
  { key: 'create_projects', label: 'Criar Projetos' },
  { key: 'view_financial', label: 'Ver Financeiro' },
  { key: 'sign_contracts', label: 'Assinar Contratos' },
]

export default function UsersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [permissionsModal, setPermissionsModal] = useState(false)
  const [permissionsForm, setPermissionsForm] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (session === undefined) return
    if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
    loadUsers()
  }, [session, search, roleFilter, statusFilter])

  const loadUsers = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (roleFilter) params.set('role', roleFilter)
    if (statusFilter) params.set('status', statusFilter)
    fetch(`/api/users?${params}`)
      .then(r => { if (!r.ok) throw new Error('Erro'); return r.json() })
      .then(json => { setUsers(json.data || []); setTotal(json.total || 0); setLoading(false) })
      .catch(() => { setUsers([]); setTotal(0); setLoading(false) })
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(users.map(u => u.id)))
    }
  }

  const openPermissions = () => {
    if (selectedIds.size === 0) return
    const firstUser = users.find(u => selectedIds.has(u.id))
    setPermissionsForm(new Set(firstUser?.permissions || []))
    setPermissionsModal(true)
  }

  const togglePermission = (key: string) => {
    setPermissionsForm(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const savePermissions = async () => {
    setSaving(true)
    const res = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids: Array.from(selectedIds),
        permissions: Array.from(permissionsForm),
      }),
    })
    if (res.ok) {
      toast.success(`Permissoes atualizadas para ${selectedIds.size} usuario(s)`)
      setPermissionsModal(false)
      setSelectedIds(new Set())
      loadUsers()
    } else {
      toast.error('Erro ao salvar permissoes')
    }
    setSaving(false)
  }

  const toggleUserActive = async (userId: string, currentActive: boolean) => {
    const res = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [userId], isActive: !currentActive }),
    })
    if (res.ok) {
      toast.success(currentActive ? 'Usuario desativado' : 'Usuario reativado')
      loadUsers()
    } else {
      toast.error('Erro ao alterar status')
    }
  }

  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="p-6 text-center">
        <p className="text-[13px] text-[var(--text-3)]">Acesso restrito a administradores.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5 animate-page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-[500] tracking-[-0.015em]">Usuarios</h1>
          <p className="text-[12px] text-[var(--text-3)] mt-1">{total} usuarios cadastrados</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <IconSearch className="absolute left-3 top-1/2 w-[14px] h-[14px] -translate-y-1/2 text-[var(--text-3)]" />
          <Input placeholder="Buscar por nome, email ou empresa..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => setShowFilters(!showFilters)} className={cn(showFilters && 'bg-[var(--surface-hover)]')}>
          <IconFilter className="w-[14px] h-[14px]" />
        </Button>
      </div>

      {showFilters && (
        <div className="flex items-center gap-2 animate-fade-in">
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="w-auto h-8 px-2 text-[12px]">
            <option value="">Todas funcoes</option>
            <option value="ADMIN">Admin</option>
            <option value="CLIENT">Cliente</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-auto h-8 px-2 text-[12px]">
            <option value="">Todos status</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
            <option value="pending_deletion">Exclusao pendente</option>
          </select>
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] animate-fade-in">
          <span className="text-[12px] text-[var(--text-2)]">{selectedIds.size} selecionado(s)</span>
          <Button size="sm" variant="default" onClick={openPermissions} className="h-7 text-[11px]">
            <IconSettings className="w-[12px] h-[12px]" /> Configurar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="h-7 text-[11px]">
            <IconClose className="w-[12px] h-[12px]" /> Limpar
          </Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-[var(--border)]">
              {users.length === 0 && (
                <div className="p-12 text-center text-[var(--text-3)] text-[13px]">Nenhum usuario encontrado</div>
              )}
              {users.map(user => (
                <div key={user.id} className={cn(
                  'flex items-center gap-3 p-3 hover:bg-[var(--surface-hover)] transition-colors',
                  selectedIds.has(user.id) && 'bg-[var(--accent-subtle)]'
                )}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(user.id)}
                    onChange={() => toggleSelect(user.id)}
                    className="w-3.5 h-3.5 rounded accent-[var(--accent)]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-[500] truncate">{user.name}</p>
                      <Badge variant={user.role === 'ADMIN' ? 'warning' : 'info'}>{user.role}</Badge>
                      {!user.isActive && <Badge variant="destructive">Inativo</Badge>}
                      {user.deleteRequestedAt && <Badge variant="destructive">Exclusao pendente</Badge>}
                    </div>
                    <p className="text-[11px] text-[var(--text-3)] mt-0.5">
                      {user.email} {user.company ? `— ${user.company}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[var(--text-3)] shrink-0">
                    <span>{user._count?.projects || 0} projetos</span>
                    <span>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</span>
                    <Button
                      size="sm"
                      variant={user.isActive ? 'ghost' : 'outline'}
                      onClick={() => toggleUserActive(user.id, user.isActive)}
                      className="h-7 text-[11px]"
                    >
                      {user.isActive ? 'Desativar' : 'Reativar'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={permissionsModal} onOpenChange={setPermissionsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Permissoes</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 max-h-[400px] overflow-y-auto py-2">
            {ALL_PERMISSIONS.map(perm => (
              <label key={perm.key} className={cn(
                'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-[var(--surface-hover)]',
                permissionsForm.has(perm.key) && 'bg-[var(--accent-subtle)]'
              )}>
                <input
                  type="checkbox"
                  checked={permissionsForm.has(perm.key)}
                  onChange={() => togglePermission(perm.key)}
                  className="w-3.5 h-3.5 rounded accent-[var(--accent)]"
                />
                <span className="text-[13px] text-[var(--text)]">{perm.label}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermissionsModal(false)}>Cancelar</Button>
            <Button onClick={savePermissions} disabled={saving}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
