'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { IconSearch, IconClose, IconSettings, IconFilter, IconBot, IconPlay, IconPause } from '@/components/icons'
import { cn } from '@/lib/utils'
import { isOwner, canManageRole, getRoleLabel, ALL_PERMISSIONS, ROLES, parsePermissions, getEffectivePermissions } from '@/lib/auth-utils'
import type { Role } from '@/lib/auth-utils'

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case 'OWNER': return 'default' as const
    case 'ADMIN': return 'warning' as const
    case 'MODERATOR': return 'info' as const
    case 'DEVELOPER': return 'secondary' as const
    case 'USER': return 'outline' as const
    case 'GUEST': return 'secondary' as const
    default: return 'outline' as const
  }
}

type Tab = 'users' | 'requests'

interface PermissionRequestItem {
  id: string
  userId: string
  permission: string
  reason: string
  status: string
  isDefinitive: boolean
  createdAt: string
  resolvedAt: string | null
  user: { id: string; name: string; email: string }
}

function getRequestStatusBadge(status: string) {
  switch (status) {
    case 'pending': return <Badge variant="warning">Pendente</Badge>
    case 'approved': return <Badge variant="success">Aprovado</Badge>
    case 'rejected': return <Badge variant="destructive">Recusado</Badge>
    default: return <Badge variant="secondary">{status}</Badge>
  }
}

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
  const [activeTab, setActiveTab] = useState<Tab>('users')

  const [requests, setRequests] = useState<PermissionRequestItem[]>([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [requestStatusFilter, setRequestStatusFilter] = useState('')

  const actorRole = (session?.user as any)?.role as Role | undefined
  const actorIsOwner = isOwner({ role: actorRole })
  const [botToggling, setBotToggling] = useState<string | null>(null)

  const [singleUserPermsOpen, setSingleUserPermsOpen] = useState(false)
  const [singleUserPerms, setSingleUserPerms] = useState<any>(null)
  const [singleUserRole, setSingleUserRole] = useState('')
  const [singleUserExtraPerms, setSingleUserExtraPerms] = useState<Set<string>>(new Set())

  const loadUsers = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (roleFilter) params.set('role', roleFilter)
    if (statusFilter) params.set('status', statusFilter)
    fetch(`/api/users?${params}`)
      .then(r => { if (!r.ok) throw new Error('Erro'); return r.json() })
      .then(json => { setUsers(json.data || []); setTotal(json.total || 0); setLoading(false) })
      .catch(() => { setUsers([]); setTotal(0); setLoading(false) })
  }, [search, roleFilter, statusFilter])

  const loadRequests = useCallback(() => {
    setRequestsLoading(true)
    const params = new URLSearchParams()
    if (requestStatusFilter) params.set('status', requestStatusFilter)
    fetch(`/api/permission-requests?${params}`)
      .then(r => { if (!r.ok) throw new Error('Erro'); return r.json() })
      .then(json => { setRequests(json.data || []); setRequestsLoading(false) })
      .catch(() => { setRequests([]); setRequestsLoading(false) })
  }, [requestStatusFilter])

  useEffect(() => {
    if (session === undefined) return
    if (!actorIsOwner) {
      router.push('/dashboard')
      return
    }
    if (activeTab === 'users') loadUsers()
    if (activeTab === 'requests') loadRequests()
  }, [actorIsOwner, loadRequests, loadUsers, router, session, activeTab])

  useEffect(() => {
    if (activeTab === 'users') loadUsers()
  }, [activeTab, loadUsers, search, roleFilter, statusFilter])

  useEffect(() => {
    if (activeTab === 'requests') loadRequests()
  }, [activeTab, loadRequests, requestStatusFilter])

  const handleRequestAction = async (id: string, status: string, isDefinitive = false) => {
    const res = await fetch('/api/permission-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, isDefinitive }),
    })
    if (res.ok) {
      const label = status === 'approved' ? 'aprovada' : isDefinitive ? 'recusada definitivamente' : 'recusada'
      toast.success(`Solicitação ${label}`)
      loadRequests()
    } else {
      toast.error('Erro ao atualizar solicitação')
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
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
      toast.success(`Permissões atualizadas para ${selectedIds.size} usuário(s)`)
      setPermissionsModal(false)
      setSelectedIds(new Set())
      loadUsers()
    } else {
      toast.error('Erro ao salvar permissões')
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
      toast.success(currentActive ? 'Usuário desativado' : 'Usuário reativado')
      loadUsers()
    } else {
      toast.error('Erro ao alterar status')
    }
  }

  const toggleBot = async (userId: string, currentStatus: string) => {
    setBotToggling(userId)
    const action = currentStatus === 'ACTIVE' ? 'deactivate' : 'activate'
    try {
      const res = await fetch('/api/bots/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      })
      if (res.ok) {
        toast.success(action === 'activate' ? 'Bot ativado' : 'Bot desativado')
        loadUsers()
      } else {
        const json = await res.json()
        toast.error(json.error || 'Erro')
      }
    } catch { toast.error('Erro') }
    setBotToggling(null)
  }

  const changeUserRole = async (userId: string, newRole: string) => {
    const res = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [userId], role: newRole }),
    })
    if (res.ok) {
      toast.success(`Cargo alterado para ${getRoleLabel(newRole)}`)
      loadUsers()
    } else {
      toast.error('Erro ao alterar cargo')
    }
  }

  const openSingleUserPerms = (user: any) => {
    setSingleUserPerms(user)
    setSingleUserRole(user.role)
    const extras = parsePermissions(user.permissions || '[]')
    setSingleUserExtraPerms(new Set(extras))
    setSingleUserPermsOpen(true)
  }

  const saveSingleUserPerms = async () => {
    if (!singleUserPerms) return
    setSaving(true)
    const res = await fetch(`/api/users/${singleUserPerms.id}/permissions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: singleUserRole,
        permissions: [...singleUserExtraPerms],
      }),
    })
    if (res.ok) {
      toast.success('Permissões atualizadas')
      setSingleUserPermsOpen(false)
      loadUsers()
    } else {
      const json = await res.json()
      toast.error(json.error || 'Erro ao salvar')
    }
    setSaving(false)
  }

  if (!actorIsOwner) {
    return (
      <div className="p-6 text-center">
        <p className="text-[13px] text-[var(--text-3)]">Acesso restrito ao proprietário.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5 animate-page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-[500] tracking-[-0.015em]">Usuários</h1>
          <p className="text-[12px] text-[var(--text-3)] mt-1">
            {activeTab === 'users' ? `${total} usuários cadastrados` : `${requests.length} solicitações`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] w-fit">
        <button
          onClick={() => { setActiveTab('users'); setSelectedIds(new Set()) }}
          className={cn(
            'px-4 py-1.5 text-[12px] font-[500] rounded-lg transition-all duration-150',
            activeTab === 'users'
              ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm border border-[var(--border)]'
              : 'text-[var(--text-3)] hover:text-[var(--text-2)]'
          )}
        >
          Usuários
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={cn(
            'px-4 py-1.5 text-[12px] font-[500] rounded-lg transition-all duration-150',
            activeTab === 'requests'
              ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm border border-[var(--border)]'
              : 'text-[var(--text-3)] hover:text-[var(--text-2)]'
          )}
        >
          Solicitações de Permissão
        </button>
      </div>

      {activeTab === 'users' ? (
        <>
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
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="w-auto h-8 px-2 text-[12px] rounded border border-[var(--border)] bg-transparent text-[var(--text)]">
                <option value="">Todas funções</option>
                {ROLES.map(r => (
                  <option key={r.role} value={r.role}>{r.label}</option>
                ))}
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-auto h-8 px-2 text-[12px] rounded border border-[var(--border)] bg-transparent text-[var(--text)]">
                <option value="">Todos status</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="pending_deletion">Exclusão pendente</option>
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
                    <div className="p-12 text-center text-[var(--text-3)] text-[13px]">Nenhum usuário encontrado</div>
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
                          <Badge variant={getRoleBadgeVariant(user.role)}>{getRoleLabel(user.role)}</Badge>
                          {!user.isActive && <Badge variant="destructive">Inativo</Badge>}
                          {user.deleteRequestedAt && <Badge variant="destructive">Exclusão pendente</Badge>}
                          {user.isBot && (
                            <Badge variant={user.botStatus === 'ACTIVE' ? 'success' : 'secondary'} className="gap-1">
                              <IconBot className="w-[10px] h-[10px]" />
                              {user.botStatus === 'ACTIVE' ? 'Ativo' : 'Parado'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--text-3)] mt-0.5">
                          {user.email} {user.company ? `— ${user.company}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[var(--text-3)] shrink-0">
                        <span>{user._count?.projects || 0} projetos</span>
                        <span>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</span>
                        {canManageRole(actorRole, user.role) && (
                          <select
                            value={user.role}
                            onChange={e => changeUserRole(user.id, e.target.value)}
                            className="h-7 px-1.5 text-[11px] rounded border border-[var(--border)] bg-transparent text-[var(--text)] cursor-pointer"
                          >
                            {ROLES.map(r => (
                              <option key={r.role} value={r.role}>{r.label}</option>
                            ))}
                          </select>
                        )}
                        <Button
                          size="sm"
                          variant={user.isActive ? 'ghost' : 'outline'}
                          onClick={() => toggleUserActive(user.id, user.isActive)}
                          className="h-7 text-[11px]"
                        >
                          {user.isActive ? 'Desativar' : 'Reativar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openSingleUserPerms(user)}
                          className="h-7 text-[11px]"
                        >
                          Permissões
                        </Button>
                        {actorIsOwner && user.isBot && (
                          <Button
                            size="sm"
                            variant={user.botStatus === 'ACTIVE' ? 'outline' : 'default'}
                            onClick={() => toggleBot(user.id, user.botStatus || 'IDLE')}
                            disabled={botToggling === user.id}
                            className="h-7 text-[11px] gap-1"
                          >
                            {botToggling === user.id ? (
                              '...'
                            ) : user.botStatus === 'ACTIVE' ? (
                              <><IconPause className="w-[10px] h-[10px]" /> Parar</>
                            ) : (
                              <><IconPlay className="w-[10px] h-[10px]" /> Ativar</>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <select
              value={requestStatusFilter}
              onChange={e => setRequestStatusFilter(e.target.value)}
              className="w-auto h-8 px-2 text-[12px] rounded border border-[var(--border)] bg-transparent text-[var(--text)]"
            >
              <option value="">Todos status</option>
              <option value="pending">Pendente</option>
              <option value="approved">Aprovado</option>
              <option value="rejected">Recusado</option>
            </select>
          </div>

          {requestsLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-[var(--border)]">
                  {requests.length === 0 && (
                    <div className="p-12 text-center text-[var(--text-3)] text-[13px]">Nenhuma solicitação encontrada</div>
                  )}
                  {requests.map(req => (
                    <div key={req.id} className="flex items-center gap-4 p-3 hover:bg-[var(--surface-hover)] transition-colors">
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-[500]">{req.user.name}</p>
                          <span className="text-[11px] text-[var(--text-3)]">{req.user.email}</span>
                        </div>
                        <p className="text-[12px] text-[var(--accent)] font-[500]">
                          {ALL_PERMISSIONS.find(p => p.key === req.permission)?.label || req.permission}
                        </p>
                        <p className="text-[11px] text-[var(--text-3)] line-clamp-2">{req.reason}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[11px] text-[var(--text-3)]">
                          {new Date(req.createdAt).toLocaleDateString('pt-BR')}{' '}
                          {new Date(req.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {getRequestStatusBadge(req.status)}
                        {req.isDefinitive && req.status === 'rejected' && (
                          <Badge variant="destructive">Definitivo</Badge>
                        )}
                        {req.status === 'pending' && actorIsOwner && (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => handleRequestAction(req.id, 'approved')}
                              className="h-7 text-[11px]"
                            >
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRequestAction(req.id, 'rejected')}
                              className="h-7 text-[11px]"
                            >
                              Recusar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRequestAction(req.id, 'rejected', true)}
                              className="h-7 text-[11px] text-[var(--destructive)] hover:bg-[var(--destructive-subtle)]"
                            >
                              Recusar definitivamente
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Dialog open={permissionsModal} onOpenChange={setPermissionsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Permissões</DialogTitle>
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

      <Dialog open={singleUserPermsOpen} onOpenChange={setSingleUserPermsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Permissões — {singleUserPerms?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-[12px] font-[500] text-[var(--text-2)] mb-1.5 block">Função</label>
              <select
                value={singleUserRole}
                onChange={e => {
                  const newRole = e.target.value
                  setSingleUserRole(newRole)
                  const inherited = getEffectivePermissions(newRole as Role, null)
                  setSingleUserExtraPerms(prev => {
                    const next = new Set(prev)
                    for (const p of inherited) next.delete(p)
                    return next
                  })
                }}
                className="w-full h-9 px-3 text-[13px] rounded-lg border border-[var(--border)] bg-transparent text-[var(--text)]"
              >
                {ROLES.map(r => (
                  <option key={r.role} value={r.role}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-[12px] font-[500] text-[var(--text-2)] mb-2">Permissões adicionais</p>
              <div className="space-y-1 max-h-[350px] overflow-y-auto">
                {ALL_PERMISSIONS.map(perm => {
                  const inherited = getEffectivePermissions(singleUserRole as Role, null)
                  const isInherited = inherited.includes(perm.key)
                  const isChecked = isInherited || singleUserExtraPerms.has(perm.key)
                  return (
                    <label
                      key={perm.key}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded-lg transition-colors',
                        isInherited
                          ? 'bg-[var(--surface-2)] cursor-not-allowed opacity-60'
                          : 'cursor-pointer hover:bg-[var(--surface-hover)]',
                        !isInherited && singleUserExtraPerms.has(perm.key) && 'bg-[var(--accent-subtle)]'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isInherited}
                        onChange={() => {
                          if (isInherited) return
                          setSingleUserExtraPerms(prev => {
                            const next = new Set(prev)
                            if (next.has(perm.key)) next.delete(perm.key)
                            else next.add(perm.key)
                            return next
                          })
                        }}
                        className="w-3.5 h-3.5 rounded accent-[var(--accent)]"
                      />
                      <span className="text-[13px] text-[var(--text)]">{perm.label}</span>
                      {isInherited && (
                        <span className="text-2xs text-[var(--text-3)] ml-auto">Herdado</span>
                      )}
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSingleUserPermsOpen(false)}>Cancelar</Button>
            <Button onClick={saveSingleUserPerms} disabled={saving}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
