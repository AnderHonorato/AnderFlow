'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { IconTrash, IconLoader, IconLogout, IconCheck } from '@/components/icons'
import { Camera } from 'lucide-react'
import { ADMIN_BADGES } from '@/lib/admin-badges'
import type { AdminBadgeType } from '@/lib/admin-badges'
import { usePerfilStore } from '@/stores/app-store'

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const { fotoPerfil, setFotoPerfil } = usePerfilStore()
  const [name, setName] = useState(session?.user?.name || '')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteResult, setDeleteResult] = useState<string | null>(null)
  const [adminBadges, setAdminBadges] = useState<{ type: string; unlockedAt: string }[]>([])
  const [fotoUploading, setFotoUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(fotoPerfil)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isAdmin = (session?.user as any)?.role !== 'CLIENT'

  useEffect(() => {
    if (isAdmin) {
      fetch('/api/admin-badges')
        .then(r => r.json())
        .then(json => setAdminBadges(json.data || []))
        .catch(() => {})
    }
  }, [isAdmin])

  useEffect(() => {
    setPreviewUrl(fotoPerfil)
  }, [fotoPerfil])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 5MB.')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem válida.')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string)
    reader.readAsDataURL(file)

    setFotoUploading(true)
    const formData = new FormData()
    formData.append('foto', file)

    try {
      const res = await fetch('/api/perfil/foto', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.erro || 'Erro ao enviar foto')
        setPreviewUrl(fotoPerfil)
        return
      }
      setFotoPerfil(json.url)
      update()
      toast.success('Foto atualizada com sucesso!')
    } catch {
      toast.error('Erro ao enviar foto')
      setPreviewUrl(fotoPerfil)
    } finally {
      setFotoUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoverFoto = async () => {
    setPreviewUrl(null)
    setFotoPerfil(null)
    update()
    toast.success('Foto removida')
  }

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

  const iniciais = (session?.user?.name || 'AD')
    .split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto animate-page-enter">
      <div>
        <h1 className="text-[17px] font-[500] tracking-[-0.015em]">Perfil</h1>
        <p className="text-[12px] text-[var(--text-3)] mt-1">Gerencie suas informações pessoais e de segurança</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Foto de Perfil</CardTitle>
          <CardDescription>Personalize seu avatar exibido no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-[var(--surface-2)] border-2 border-[var(--border)] flex items-center justify-center">
                {previewUrl ? (
                  <Image src={previewUrl} alt={session?.user?.name || 'Perfil'} width={80} height={80} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[20px] font-[600] text-[var(--text-3)]">{iniciais}</span>
                )}
              </div>
              {fotoUploading && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <IconLoader className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={fotoUploading}
                >
                  <Camera className="w-[14px] h-[14px] mr-1.5" />
                  {fotoUploading ? 'Enviando...' : 'Alterar foto'}
                </Button>
                {previewUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoverFoto}
                    className="text-[var(--text-3)] hover:text-[var(--destructive)]"
                  >
                    Remover
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-[var(--text-3)]">
                Formatos aceitos: JPG, PNG, WebP. Tamanho máximo: 5MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
              <p className="text-[12px] text-[var(--text-3)] mt-0.5">{(session?.user as any)?.roleLevel >= 100 ? 'Owner / Criador' : (session?.user as any)?.roleLevel >= 80 ? 'Administrador' : (session?.user as any)?.roleLevel >= 60 ? 'Moderador' : (session?.user as any)?.roleLevel >= 40 ? 'Desenvolvedor' : 'Cliente'}</p>
            </div>
            <Badge variant={(session?.user as any)?.roleLevel >= 80 ? 'warning' : 'info'}>{(session?.user as any)?.role || 'CLIENT'}</Badge>
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Conquistas</CardTitle>
            <CardDescription>Badges de expertise desbloqueados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(ADMIN_BADGES).map(([type, badge]) => {
                const unlocked = adminBadges.find(b => b.type === type)
                return (
                  <Tooltip key={type}>
                    <TooltipTrigger asChild>
                      <div className={`p-3 rounded-lg border text-center transition-all ${
                        unlocked
                          ? 'border-[var(--accent)]/30 bg-[var(--accent-subtle)]'
                          : 'border-[var(--border)] bg-[var(--surface-2)] opacity-50 grayscale'
                      }`}>
                        <div className="text-2xl mb-1">{badge.icon}</div>
                        <p className="text-[11px] font-[500] text-[var(--text)]">{badge.name}</p>
                        {unlocked && (
                          <p className="text-2xs text-[var(--text-3)] mt-0.5">
                            {new Date(unlocked.unlockedAt).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-[11px]">{unlocked ? `Desbloqueado em ${new Date(unlocked.unlockedAt).toLocaleDateString('pt-BR')}` : `Falta: ${badge.condition}`}</p>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
