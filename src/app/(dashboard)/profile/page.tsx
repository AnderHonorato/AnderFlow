'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { IconTrash, IconLoader, IconLogout, IconCheck } from '@/components/icons'

export default function ProfilePage() {
  const { data: session } = useSession()
  const [name, setName] = useState(session?.user?.name || '')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteResult, setDeleteResult] = useState<string | null>(null)

  const handleDelete = async () => {
    if (deleteConfirm !== 'confirmo') {
      toast.error('Digite "confirmo" para prosseguir')
      return
    }
    setDeleteLoading(true)
    const res = await fetch('/api/account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request_delete', confirmation: deleteConfirm }),
    })
    const json = await res.json()
    if (res.ok) {
      setDeleteResult(json.message)
    } else {
      toast.error(json.error || 'Erro ao solicitar exclusão')
    }
    setDeleteLoading(false)
  }

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto animate-page-enter">
      <div>
        <h1 className="text-[17px] font-[500] tracking-[-0.015em]">Perfil</h1>
        <p className="text-[12px] text-[var(--text-3)] mt-1">Gerencie suas informações pessoais e de segurança</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>Atualize seus dados de perfil</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label>Nome</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label>Email</label>
              <Input value={session?.user?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <label>Empresa</label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label>Telefone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <Separator />
          <div className="flex justify-end">
            <Button><IconCheck className="w-[14px] h-[14px]" /> Salvar Alterações</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Segurança</CardTitle>
          <CardDescription>Configurações de autenticação e acesso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-[13px] font-[500]">Alterar Senha</p>
              <p className="text-[12px] text-[var(--text-3)] mt-0.5">Atualize sua senha de acesso</p>
            </div>
            <Button variant="outline" size="sm">Alterar</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-[13px] font-[500]">Função</p>
              <p className="text-[12px] text-[var(--text-3)] mt-0.5">{session?.user?.role === 'ADMIN' ? 'Administrador' : 'Cliente'}</p>
            </div>
            <Badge variant={session?.user?.role === 'ADMIN' ? 'warning' : 'info'}>{session?.user?.role}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[var(--destructive-subtle)]">
        <CardHeader>
          <CardTitle className="text-[var(--destructive)]">Excluir Conta</CardTitle>
          <CardDescription>A exclusão é programada para 7 dias e pode ser revertida por um administrador</CardDescription>
        </CardHeader>
        <CardContent>
          {deleteResult ? (
            <div className="p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
              <p className="text-[13px] text-[var(--text)]">{deleteResult}</p>
            </div>
          ) : (
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <IconTrash className="w-[14px] h-[14px]" /> Solicitar exclusão da conta
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir Conta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-[13px] text-[var(--text-2)]">
              Sua conta será desativada imediatamente e excluída permanentemente em 7 dias.
              Um administrador pode reverter essa ação até lá. Esta ação não pode ser desfeita por você.
            </p>
            <div className="space-y-2">
              <label>Digite "confirmo" para prosseguir</label>
              <Input
                placeholder="confirmo"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteOpen(false); setDeleteConfirm('') }}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading || deleteConfirm !== 'confirmo'}>
              {deleteLoading && <IconLoader className="w-[14px] h-[14px] animate-spin" />}
              Confirmar exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
