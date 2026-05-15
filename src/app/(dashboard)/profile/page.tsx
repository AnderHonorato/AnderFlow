'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Camera, Save, Shield, Key, Smartphone } from 'lucide-react'

export default function ProfilePage() {
  const [name, setName] = useState('Anderson')
  const [email, setEmail] = useState('admin@andero.com.br')
  const [company, setCompany] = useState('ANDERFLOW Sistemas')
  const [phone, setPhone] = useState('(11) 99999-0000')
  const [bio, setBio] = useState('Fundador e desenvolvedor full-stack.')

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-lg font-medium">Perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie suas informações pessoais e de segurança
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Foto de Perfil</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-xl">AD</AvatarFallback>
            </Avatar>
            <button className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <div>
            <p className="text-sm font-medium">Foto do perfil</p>
            <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG até 2MB</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações Pessoais</CardTitle>
          <CardDescription>Atualize seus dados de perfil</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Empresa</label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Bio</label>
            <Input value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <Separator />
          <div className="flex justify-end">
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Salvar Alterações
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Segurança</CardTitle>
          <CardDescription>Configurações de autenticação e acesso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <Key className="h-[18px] w-[18px] text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Alterar Senha</p>
                <p className="text-xs text-muted-foreground">Atualize sua senha de acesso</p>
              </div>
            </div>
            <Button variant="outline" size="sm">Alterar</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <Shield className="h-[18px] w-[18px] text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Autenticação 2FA</p>
                <p className="text-xs text-muted-foreground">Adicione uma camada extra de segurança</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-2xs">Desativado</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <Smartphone className="h-[18px] w-[18px] text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Sessões Ativas</p>
                <p className="text-xs text-muted-foreground">Windows - São Paulo, SP &middot; Ativo agora</p>
              </div>
            </div>
            <Button variant="outline" size="sm">Gerenciar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
