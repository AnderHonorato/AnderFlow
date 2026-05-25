'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  IconSettings, IconNotification, IconLogout, IconCheck,
  IconProject, IconAnalytics, IconAutomation, IconFile,
} from '@/components/icons'
import { cn } from '@/lib/utils'
import { Send, Download, MessageSquare, Upload, FileJson } from 'lucide-react'
import { TwoFactorSetup } from '@/components/ui/two-factor-setup'

const categories = [
  { id: 'general', label: 'Geral', icon: IconSettings },
  { id: 'notifications', label: 'Notificações', icon: IconNotification },
  { id: 'appearance', label: 'Aparência', icon: IconProject },
  { id: 'security', label: 'Segurança', icon: IconLogout },
  { id: 'modules', label: 'Módulos', icon: IconAutomation },
  { id: 'funcionalidades', label: 'Funcionalidades', icon: IconAutomation },
  { id: 'integrations', label: 'Integrações', icon: IconAutomation, href: '/settings/integrations' },
  { id: 'api-keys', label: 'Chaves de API', icon: IconSettings, href: '/settings/api-keys' },
  { id: 'templates', label: 'Templates', icon: IconFile, href: '/settings/templates' },
  { id: 'message-templates', label: 'Templates de Mensagem', icon: MessageSquare, href: '/settings/message-templates' },
  { id: 'webhooks', label: 'Webhooks', icon: IconAutomation, href: '/settings/webhooks' },
  { id: 'import', label: 'Importação', icon: Upload, href: '/settings/import' },
  { id: 'notion', label: 'Notion', icon: FileJson, href: '/settings/integrations/notion' },
  { id: 'status', label: 'Status', icon: IconAnalytics, href: '/settings/status-page' },
] as const

const modules = [
  { id: 'projects', label: 'Projetos', enabled: true },
  { id: 'crm', label: 'CRM', enabled: true },
  { id: 'chat', label: 'Chat', enabled: true },
  { id: 'financial', label: 'Financeiro', enabled: true },
  { id: 'contracts', label: 'Contratos', enabled: true },
  { id: 'tickets', label: 'Tickets', enabled: true },
  { id: 'analytics', label: 'Analytics', enabled: true },
  { id: 'automations', label: 'Automações', enabled: true },
  { id: 'knowledge', label: 'Conhecimento', enabled: true },
]

const supportItems = [
  { key: 'emailNotifications', label: 'Notificações por email', desc: 'Receber alertas no email' },
  { key: 'pushNotifications', label: 'Notificações push', desc: 'Notificações no navegador' },
  { key: 'soundEnabled', label: 'Som', desc: 'Som ao receber notificação' },
  { key: 'weeklyReport', label: 'Relatório semanal', desc: 'Resumo semanal por email' },
]

type EstadoConfig = {
  moduleToggles: Record<string, boolean>
  notifPrefs: typeof notifPrefsDefault
  orgName: string
  chatIaMensagemAutomatica: boolean
  modoFoco: boolean
}

const notifPrefsDefault = {
  emailNotifications: true,
  pushNotifications: true,
  soundEnabled: true,
  weeklyReport: true,
}

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [activeCategory, setActiveCategory] = useState('appearance')
  const [mounted, setMounted] = useState(false)
  const [moduleToggles, setModuleToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(modules.map(m => [m.id, m.enabled]))
  )
  const [notifPrefs, setNotifPrefs] = useState(notifPrefsDefault)
  const [orgName, setOrgName] = useState('ANDERFLOW Sistemas')
  const [chatIaMensagemAutomatica, setChatIaMensagemAutomatica] = useState(true)
  const [modoFoco, setModoFoco] = useState(false)
  const [, setConfigCarregadas] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [exportEntities, setExportEntities] = useState<string[]>([
    'clients', 'projects', 'tasks', 'tickets', 'invoices', 'contracts',
  ])
  const [exporting, setExporting] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    fetch('/api/configuracoes')
      .then(r => r.json())
      .then(json => {
        if (json.data) {
          const d = json.data
          setNotifPrefs({
            emailNotifications: d.emailNotifications ?? true,
            pushNotifications: d.pushNotifications ?? true,
            soundEnabled: d.soundEnabled ?? true,
            weeklyReport: d.weeklyReport ?? true,
          })
          const prefs = (d.preferences || {}) as Record<string, any>
          if (prefs.moduleToggles && typeof prefs.moduleToggles === 'object') {
            const toggles: Record<string, boolean> = {}
            for (const mod of modules) {
              toggles[mod.id] = prefs.moduleToggles[mod.id] ?? mod.enabled
            }
            setModuleToggles(toggles)
          }
          if (typeof prefs.orgName === 'string') setOrgName(prefs.orgName)
          if (typeof prefs.chatIaMensagemAutomatica === 'boolean') setChatIaMensagemAutomatica(prefs.chatIaMensagemAutomatica)
          if (typeof prefs.modoFoco === 'boolean') setModoFoco(prefs.modoFoco)
        }
        setConfigCarregadas(true)
      })
      .catch(() => setConfigCarregadas(true))
  }, [mounted])

  const salvarNoBanco = useCallback(async (estado: EstadoConfig) => {
    setSaving(true)
    try {
      const res = await fetch('/api/configuracoes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notifPrefs: estado.notifPrefs,
          preferences: {
            moduleToggles: estado.moduleToggles,
            orgName: estado.orgName,
            chatIaMensagemAutomatica: estado.chatIaMensagemAutomatica,
            modoFoco: estado.modoFoco,
          },
        }),
      })
      if (res.ok) {
        setSaved(true)
        toast.success('Configurações salvas')
        setTimeout(() => setSaved(false), 2000)
      } else {
        const json = await res.json().catch(() => ({}))
        toast.error(json.error || 'Erro ao salvar configurações')
      }
    } catch {
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }, [])

  const saveSettings = () => {
    salvarNoBanco({ moduleToggles, notifPrefs, orgName, chatIaMensagemAutomatica, modoFoco })
  }

  const toggleModule = (modId: string, valor: boolean) => {
    const novosToggles = { ...moduleToggles, [modId]: valor }
    setModuleToggles(novosToggles)
    salvarNoBanco({ moduleToggles: novosToggles, notifPrefs, orgName, chatIaMensagemAutomatica, modoFoco })
  }

  const toggleNotif = (chave: string, valor: boolean) => {
    const novosPrefs = { ...notifPrefs, [chave]: valor }
    setNotifPrefs(novosPrefs)
    salvarNoBanco({ moduleToggles, notifPrefs: novosPrefs, orgName, chatIaMensagemAutomatica, modoFoco })
  }

  const toggleFuncionalidade = (chave: string, valor: boolean) => {
    let novoChatIa = chatIaMensagemAutomatica
    let novoModoFoco = modoFoco
    let novosNotifPrefs = notifPrefs

    if (chave === 'chatIaMensagemAutomatica') {
      novoChatIa = valor
      setChatIaMensagemAutomatica(valor)
    } else if (chave === 'modoFoco') {
      novoModoFoco = valor
      setModoFoco(valor)
    } else if (chave === 'notificacoesSom') {
      novosNotifPrefs = { ...notifPrefs, soundEnabled: valor }
      setNotifPrefs(novosNotifPrefs)
    }

    salvarNoBanco({
      moduleToggles,
      notifPrefs: novosNotifPrefs,
      orgName,
      chatIaMensagemAutomatica: novoChatIa,
      modoFoco: novoModoFoco,
    })
  }

  const toggleExportEntity = (entity: string) => {
    setExportEntities(prev =>
      prev.includes(entity) ? prev.filter(e => e !== entity) : [...prev, entity]
    )
  }

  const handleExport = () => {
    if (exportEntities.length === 0) {
      toast.error('Selecione pelo menos uma entidade')
      return
    }
    setExporting(true)
    window.open(`/api/export?entities=${exportEntities.join(',')}`, '_blank')
    toast.success('Download iniciado!')
    setTimeout(() => setExporting(false), 2000)
  }

  if (!mounted) return null
  const currentTheme = resolvedTheme || theme

  return (
    <div className="p-6 space-y-5 animate-page-enter">
      <div>
        <h1 className="text-[17px] font-[500] tracking-[-0.015em]">Configurações</h1>
        <p className="text-[12px] text-[var(--text-3)] mt-1">Gerencie todas as configurações da plataforma</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr] items-start">
        <Card>
          <CardContent className="p-1.5">
            <nav className="space-y-0.5">
              {categories.map((cat) => {
                const Icon = cat.icon
                const active = activeCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      if ('href' in cat && cat.href) {
                        router.push(cat.href)
                      } else {
                        setActiveCategory(cat.id)
                      }
                    }}
                    className={cn(
                      'w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-all duration-150 text-left',
                      active
                        ? 'text-[var(--accent)] bg-[var(--accent-subtle)]'
                        : 'text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
                    )}
                  >
                    <Icon className="w-[14px] h-[14px] shrink-0" />
                    <span>{cat.label}</span>
                  </button>
                )
              })}
            </nav>
          </CardContent>
        </Card>

        <div className="space-y-5">
          {activeCategory === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle>Aparência</CardTitle>
                <CardDescription>Personalize o visual da plataforma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <label className="text-[11px] font-[500] text-[var(--text-3)] uppercase">Tema</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'light', label: 'Claro', bg: '#f5f7fa' },
                      { key: 'dark', label: 'Escuro', bg: '#0A0A0F' },
                      { key: 'system', label: 'Sistema', bg: 'linear-gradient(90deg, #f5f7fa 50%, #0A0A0F 50%)' },
                    ].map((opt) => {
                      const isActive = currentTheme === opt.key
                      return (
                        <button
                          key={opt.key}
                          onClick={() => setTheme(opt.key)}
                          className={cn(
                            'p-4 rounded-xl border text-center transition-all duration-150',
                            isActive
                              ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
                              : 'border-[var(--border)] hover:border-[var(--border-2)]'
                          )}
                        >
                          <div
                            className="h-10 w-full rounded-lg mb-2 border border-[var(--border)]"
                            style={{ background: opt.bg }}
                          />
                          <span className={cn(
                            'text-[12px] font-[500]',
                            isActive ? 'text-[var(--accent)]' : 'text-[var(--text-2)]'
                          )}>
                            {opt.label}
                          </span>
                          {isActive && <IconCheck className="w-[14px] h-[14px] mx-auto mt-1 text-[var(--accent)]" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeCategory === 'general' && (
            <Card>
              <CardHeader>
                <CardTitle>Configurações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label>Nome da Organização</label>
                  <Input value={orgName} onChange={e => setOrgName(e.target.value)} />
                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button onClick={saveSettings} size="sm" disabled={saving}>
                    {saving ? <span className="w-[14px] h-[14px] border-2 border-current border-t-transparent rounded-full animate-spin" /> : saved ? <IconCheck className="w-[14px] h-[14px]" /> : null}
                    {saving ? 'Salvando...' : saved ? 'Salvo' : 'Salvar Alterações'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeCategory === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notificações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {supportItems.map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-[var(--surface-hover)]">
                    <div>
                      <p className="text-[13px] font-[500]">{item.label}</p>
                      <p className="text-[11px] text-[var(--text-3)] mt-0.5">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notifPrefs[item.key as keyof typeof notifPrefs]}
                      onCheckedChange={(v) => toggleNotif(item.key, v)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeCategory === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Segurança</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <TwoFactorSetup />
                <div className="border-t border-[var(--border)] pt-3" />
                {[
                  { label: 'Sessões Ativas', desc: 'Gerencie dispositivos conectados', action: 'Ver Sessões', href: '/settings/sessions' },
                  { label: 'Alterar Senha', desc: 'Atualize sua senha de acesso', action: 'Alterar' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-[var(--surface-hover)]">
                    <div>
                      <p className="text-[13px] font-[500]">{item.label}</p>
                      <p className="text-[11px] text-[var(--text-3)] mt-0.5">{item.desc}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { if ('href' in item && item.href) router.push(item.href) }}>{item.action}</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeCategory === 'modules' && (
            <Card>
              <CardHeader>
                <CardTitle>Módulos</CardTitle>
                <CardDescription>Ative ou desative funcionalidades da plataforma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {modules.map((mod) => (
                  <div key={mod.id} className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-[var(--surface-hover)]">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-[500]">{mod.label}</p>
                        <Badge variant={moduleToggles[mod.id] ? 'success' : 'secondary'}>
                          {moduleToggles[mod.id] ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                    <Switch
                      checked={moduleToggles[mod.id]}
                      onCheckedChange={(v) => toggleModule(mod.id, v)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeCategory === 'funcionalidades' && (
            <Card>
              <CardHeader>
                <CardTitle>Funcionalidades</CardTitle>
                <CardDescription>Configure funcionalidades da plataforma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {[
                  { key: 'chatIaMensagemAutomatica', label: 'Mensagem automática da IA', desc: 'Saudação automática do chat flutuante ao abrir' },
                  { key: 'modoFoco', label: 'Modo Foco', desc: 'Silenciar notificações por período determinado' },
                  { key: 'notificacoesSom', label: 'Som das notificações', desc: 'Reproduzir som ao receber notificações' },
                ].map((item) => {
                  const ativo =
                    item.key === 'chatIaMensagemAutomatica' ? chatIaMensagemAutomatica
                    : item.key === 'modoFoco' ? modoFoco
                    : notifPrefs.soundEnabled
                  return (
                    <div key={item.key} className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-[var(--surface-hover)]">
                      <div>
                        <p className="text-[13px] font-[500]">{item.label}</p>
                        <p className="text-[11px] text-[var(--text-3)] mt-0.5">{item.desc}</p>
                      </div>
                      <Switch
                        checked={ativo}
                        onCheckedChange={(v) => toggleFuncionalidade(item.key, v)}
                      />
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {process.env.NODE_ENV === 'development' && (
            <Card className="border-[var(--warning)]/30">
              <CardHeader>
                <CardTitle>Dev Tools</CardTitle>
                <CardDescription>Ferramentas de desenvolvimento e teste</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-[500]">Relatório Mensal</p>
                    <p className="text-[11px] text-[var(--text-3)]">Simula o envio do relatório mensal do cron</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const res = await fetch('/api/cron/monthly-report', {
                        headers: { Authorization: 'Bearer dev-secret' },
                      })
                      const json = await res.json()
                      if (json.sent !== undefined) {
                        toast.success(`Relatório enviado para ${json.sent} clientes`)
                      } else {
                        toast.error(json.error || 'Erro ao enviar')
                      }
                    }}
                  >
                    <Send className="h-3.5 w-3.5" /> Simular envio
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-4 w-4" /> Exportar Dados
              </CardTitle>
              <CardDescription>Exporte os dados da plataforma em arquivo ZIP</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'clients', label: 'Clientes' },
                  { id: 'projects', label: 'Projetos' },
                  { id: 'tasks', label: 'Tarefas' },
                  { id: 'tickets', label: 'Tickets' },
                  { id: 'invoices', label: 'Faturas' },
                  { id: 'contracts', label: 'Contratos' },
                ].map((entity) => (
                  <label
                    key={entity.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-xs ${
                      exportEntities.includes(entity.id)
                        ? 'border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--text)]'
                        : 'border-[var(--border)] text-[var(--text-3)] hover:border-[var(--text-3)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={exportEntities.includes(entity.id)}
                      onChange={() => toggleExportEntity(entity.id)}
                      className="sr-only"
                    />
                    {entity.label}
                  </label>
                ))}
              </div>
              <div className="flex justify-end">
                <Button size="sm" onClick={handleExport} disabled={exporting || exportEntities.length === 0}>
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  {exporting ? 'Exportando...' : `Exportar selecionados (${exportEntities.length})`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
