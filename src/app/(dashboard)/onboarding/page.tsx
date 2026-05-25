'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  Rocket, CheckCircle2, Settings, Users, FolderKanban, CreditCard,
  MessageSquare, SkipForward, Sparkles, Loader2,
} from 'lucide-react'

const TOTAL_STEPS = 6

const STEP_LABELS = ['Perfil', 'Cliente', 'Projeto', 'Integrações', 'Equipe', 'Concluído']

export default function OnboardingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [completed, setCompleted] = useState<number[]>([])

  const [profileForm, setProfileForm] = useState({ name: '', company: '', brandColor: '#E8622A' })
  const [clientForm, setClientForm] = useState({ name: '', email: '', company: '' })
  const [projectForm, setProjectForm] = useState({ name: '', description: '' })
  const [inviteEmail, setInviteEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [createdClientId, setCreatedClientId] = useState<string | null>(null)
  const [summary, setSummary] = useState<{ clients: number; projects: number }>({ clients: 0, projects: 0 })

  useEffect(() => {
    const saved = localStorage.getItem('onboarding_wizard')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.step !== undefined) setStep(data.step)
        if (data.completed) setCompleted(data.completed)
      } catch {}
    }
    if (session?.user?.name) setProfileForm(prev => ({ ...prev, name: session.user?.name || '' }))
  }, [session])

  const saveProgress = (nextStep: number, newCompleted?: number[]) => {
    setStep(nextStep)
    const comp = newCompleted || (nextStep > 0 && !completed.includes(step) ? [...completed, step] : completed)
    if (newCompleted || nextStep !== step) setCompleted(comp)
    localStorage.setItem('onboarding_wizard', JSON.stringify({ step: nextStep, completed: comp }))
  }

  const handleProfileSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/account', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: profileForm.name, company: profileForm.company }) })
      saveProgress(step + 1)
    } catch { toast.error('Erro ao salvar') }
    setSaving(false)
  }

  const handleCreateClient = async () => {
    if (!clientForm.name || !clientForm.email) { toast.error('Nome e email obrigatórios'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(clientForm) })
      if (res.ok) {
        const json = await res.json()
        setCreatedClientId(json.data?.id)
        toast.success('Cliente criado')
        saveProgress(step + 1)
        setSummary(prev => ({ ...prev, clients: prev.clients + 1 }))
      } else toast.error('Erro ao criar cliente')
    } catch { toast.error('Erro') }
    setSaving(false)
  }

  const handleCreateProject = async () => {
    if (!projectForm.name) { toast.error('Nome do projeto obrigatório'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...projectForm, clientId: createdClientId || undefined, type: 'CUSTOM' }) })
      if (res.ok) { toast.success('Projeto criado'); saveProgress(step + 1); setSummary(prev => ({ ...prev, projects: prev.projects + 1 })) }
      else toast.error('Erro ao criar projeto')
    } catch { toast.error('Erro') }
    setSaving(false)
  }

  const progress = ((completed.length + (step > 0 ? 1 : 0)) / TOTAL_STEPS) * 100

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-page-enter">
      <div className="text-center">
        <h1 className="text-lg font-medium">Configurar Plataforma</h1>
        <p className="text-sm text-muted-foreground mt-1">Complete os passos para ativar sua conta</p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Passo {step + 1} de {TOTAL_STEPS}</span>
          <span>{STEP_LABELS[step]}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-1">
          {STEP_LABELS.map((label, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                completed.includes(i) ? 'bg-[var(--success)] text-white' :
                i === step ? 'bg-[var(--accent)] text-white' :
                'bg-[var(--surface-2)] text-[var(--text-3)]'
              }`}>
                {completed.includes(i) ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
              </div>
              <span className="text-[9px] hidden sm:block text-[var(--text-3)]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <Card className="min-h-[300px]">
        <CardContent className="p-6">

          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-medium flex items-center gap-2"><Settings className="h-5 w-5 text-[var(--accent)]" /> Perfil</h3>
              <Input placeholder="Seu nome" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} />
              <Input placeholder="Nome da empresa" value={profileForm.company} onChange={e => setProfileForm({ ...profileForm, company: e.target.value })} />
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Cor da marca:</span>
                <input type="color" value={profileForm.brandColor} onChange={e => setProfileForm({ ...profileForm, brandColor: e.target.value })} className="w-10 h-8 rounded cursor-pointer" />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleProfileSave} disabled={saving || !profileForm.name} className="flex-1">{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar e Continuar</Button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-base font-medium flex items-center gap-2"><Users className="h-5 w-5 text-[var(--info)]" /> Criar Primeiro Cliente</h3>
              <Input placeholder="Nome do cliente *" value={clientForm.name} onChange={e => setClientForm({ ...clientForm, name: e.target.value })} />
              <Input placeholder="Email *" type="email" value={clientForm.email} onChange={e => setClientForm({ ...clientForm, email: e.target.value })} />
              <Input placeholder="Empresa" value={clientForm.company} onChange={e => setClientForm({ ...clientForm, company: e.target.value })} />
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" onClick={() => saveProgress(step + 1)}><SkipForward className="mr-1 h-4 w-4" /> Pular</Button>
                <Button onClick={handleCreateClient} disabled={saving} className="flex-1">{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar Cliente</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-base font-medium flex items-center gap-2"><FolderKanban className="h-5 w-5 text-[var(--warning)]" /> Criar Primeiro Projeto</h3>
              <Input placeholder="Nome do projeto *" value={projectForm.name} onChange={e => setProjectForm({ ...projectForm, name: e.target.value })} />
              <Input placeholder="Descrição" value={projectForm.description} onChange={e => setProjectForm({ ...projectForm, description: e.target.value })} />
              {createdClientId && <p className="text-xs text-[var(--success)]">Cliente criado com sucesso ✓</p>}
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" onClick={() => saveProgress(step + 1)}><SkipForward className="mr-1 h-4 w-4" /> Pular</Button>
                <Button onClick={handleCreateProject} disabled={saving} className="flex-1">{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar Projeto</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-base font-medium flex items-center gap-2"><CreditCard className="h-5 w-5 text-[var(--success)]" /> Integrações</h3>
              <p className="text-sm text-muted-foreground">Configure integrações para potencializar sua plataforma.</p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-between" asChild><a href="/settings/integrations"><span>Stripe (Pagamentos)</span><Badge variant="secondary" className="text-2xs">Opcional</Badge></a></Button>
                <Button variant="outline" className="w-full justify-between" asChild><a href="/settings/integrations"><span>WhatsApp Evolution API</span><Badge variant="secondary" className="text-2xs">Opcional</Badge></a></Button>
                <Button variant="outline" className="w-full justify-between" asChild><a href="/settings/integrations"><span>DeepSeek (IA)</span><Badge variant="secondary" className="text-2xs">Configurado</Badge></a></Button>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" onClick={() => saveProgress(step + 1)}><SkipForward className="mr-1 h-4 w-4" /> Pular</Button>
                <Button onClick={() => saveProgress(step + 1)} className="flex-1">Continuar</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-base font-medium flex items-center gap-2"><MessageSquare className="h-5 w-5 text-[var(--info)]" /> Convidar Equipe</h3>
              <p className="text-sm text-muted-foreground">Convide membros da equipe para colaborar na plataforma.</p>
              <div className="flex gap-2">
                <Input placeholder="Email do membro" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                <Button size="sm" disabled={!inviteEmail} onClick={() => { toast.success('Convite enviado!'); setInviteEmail('') }}>Convidar</Button>
              </div>
              <Button variant="outline" className="w-full" asChild><a href="/users">Gerenciar equipe completa</a></Button>
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" onClick={() => saveProgress(step + 1)}><SkipForward className="mr-1 h-4 w-4" /> Pular</Button>
                <Button onClick={() => saveProgress(step + 1)} className="flex-1">Continuar</Button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 text-center">
              <Sparkles className="h-12 w-12 text-[var(--accent)] mx-auto" />
              <h3 className="text-xl font-bold">Tudo pronto! 🎉</h3>
              <p className="text-sm text-muted-foreground">Sua plataforma está configurada. Veja o resumo:</p>
              <div className="grid grid-cols-2 gap-3">
                <Card><CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-[var(--accent)]">{summary.clients || 1}</p>
                  <p className="text-xs text-muted-foreground">Cliente{summary.clients !== 1 ? 's' : ''}</p>
                </CardContent></Card>
                <Card><CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-[var(--accent)]">{summary.projects || 1}</p>
                  <p className="text-xs text-muted-foreground">Projeto{summary.projects !== 1 ? 's' : ''}</p>
                </CardContent></Card>
              </div>
              <div className="flex gap-2 pt-4">
                <Button className="flex-1" onClick={() => router.push('/dashboard')}><Rocket className="mr-2 h-4 w-4" /> Ir para Dashboard</Button>
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {step < TOTAL_STEPS - 1 && (
        <p className="text-xs text-muted-foreground text-center">
          Você pode pular qualquer etapa e configurá-la depois em Configurações.
        </p>
      )}
    </div>
  )
}
