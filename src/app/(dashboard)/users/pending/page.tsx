'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Eye } from 'lucide-react'

export default function PendingUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)

  const loadUsers = () => {
    setLoading(true)
    fetch('/api/users?isAccountActive=false')
      .then(r => r.json())
      .then(json => setUsers((json.data || []).filter((u: any) => !u.isAccountActive)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadUsers() }, [])

  const approve = async (userId: string) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAccountActive: true }),
    })
    if (res.ok) { toast.success('Usuario aprovado'); loadUsers() }
    else toast.error('Erro ao aprovar')
  }

  const reject = async (userId: string) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAccountActive: false, isActive: false }),
    })
    if (res.ok) { toast.success('Usuario rejeitado'); loadUsers() }
    else toast.error('Erro ao rejeitar')
  }

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-64" /></div>

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-medium">Usuarios Pendentes</h1>
        <p className="text-sm text-muted-foreground mt-1">Aprove ou rejeite novos cadastros de clientes</p>
      </div>

      {users.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum usuario pendente de aprovacao.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {users.map(user => (
            <Card key={user.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-10 w-10"><AvatarFallback>{user.name?.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  {user.company && <p className="text-xs text-muted-foreground">{user.company}</p>}
                  <p className="text-2xs text-[var(--text-3)]">Cadastrado em {new Date(user.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon-sm" onClick={() => setSelected(user)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-success" onClick={() => approve(user.id)}>
                    <CheckCircle className="mr-1.5 h-4 w-4" /> Aprovar
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive" onClick={() => reject(user.id)}>
                    <XCircle className="mr-1.5 h-4 w-4" /> Rejeitar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{selected?.name}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">Email</p><p className="text-sm">{selected.email}</p></div>
                <div><p className="text-xs text-muted-foreground">Telefone</p><p className="text-sm">{selected.phone || '-'}</p></div>
                <div><p className="text-xs text-muted-foreground">Empresa</p><p className="text-sm">{selected.company || '-'}</p></div>
                <div><p className="text-xs text-muted-foreground">Cargo</p><p className="text-sm">{selected.position || '-'}</p></div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Data de registro</p>
                <p className="text-sm">{new Date(selected.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
