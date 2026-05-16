'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  IconSettings, IconProfile, IconNotification, IconLogout, IconCheck,
  IconFinancial, IconProject, IconClient, IconChat, IconCRM,
  IconAnalytics, IconKnowledge, IconAutomation, IconTicket, IconFile,
  IconArrowRight,
} from '@/components/icons'
import { cn } from '@/lib/utils'

const categories = [
  { id: 'general', label: 'Geral', icon: IconSettings },
  { id: 'notifications', label: 'Notificacoes', icon: IconNotification },
  { id: 'appearance', label: 'Aparencia', icon: IconProject },
  { id: 'security', label: 'Seguranca', icon: IconLogout },
  { id: 'modules', label: 'Modulos', icon: IconAutomation },
]

const modules = [
  { id: 'projects', label: 'Projetos', enabled: true },
  { id: 'crm', label: 'CRM', enabled: true },
  { id: 'chat', label: 'Chat', enabled: true },
  { id: 'financial', label: 'Financeiro', enabled: true },
  { id: 'contracts', label: 'Contratos', enabled: true },
  { id: 'tickets', label: 'Tickets', enabled: true },
  { id: 'analytics', label: 'Analytics', enabled: true },
  { id: 'automations', label: 'Automacoes', enabled: true },
  { id: 'knowledge', label: 'Conhecimento', enabled: true },
]

const supportItems = [
  { key: 'emailNotifications', label: 'Notificacoes por email', desc: 'Receber alertas no email' },
  { key: 'pushNotifications', label: 'Notificacoes push', desc: 'Notificacoes no navegador' },
  { key: 'soundEnabled', label: 'Som', desc: 'Som ao receber notificacao' },
  { key: 'weeklyReport', label: 'Relatorio semanal', desc: 'Resumo semanal por email' },
]

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { data: session } = useSession()
  const [activeCategory, setActiveCategory] = useState('appearance')
  const [mounted, setMounted] = useState(false)
  const [moduleToggles, setModuleToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(modules.map(m => [m.id, m.enabled]))
  )
  const [notifPrefs, setNotifPrefs] = useState({
    emailNotifications: true,
    pushNotifications: true,
    soundEnabled: true,
    weeklyReport: true,
  })
  const [orgName, setOrgName] = useState('ANDERFLOW Sistemas')
  const [saved, setSaved] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const saveSettings = () => {
    setSaved(true)
    toast.success('Configuracoes salvas')
    setTimeout(() => setSaved(false), 2000)
  }

  if (!mounted) return null
  const currentTheme = resolvedTheme || theme

  return (
    <div className="p-6 space-y-5 animate-page-enter">
      <div>
        <h1 className="text-[17px] font-[500] tracking-[-0.015em]">Configuracoes</h1>
        <p className="text-[12px] text-[var(--text-3)] mt-1">Gerencie todas as configuracoes da plataforma</p>
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
                    onClick={() => setActiveCategory(cat.id)}
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
                <CardTitle>Aprencia</CardTitle>
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
                <CardTitle>Configuracoes Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label>Nome da Organizacao</label>
                  <Input value={orgName} onChange={e => setOrgName(e.target.value)} />
                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button onClick={saveSettings} size="sm">
                    {saved ? <IconCheck className="w-[14px] h-[14px]" /> : null}
                    {saved ? 'Salvo' : 'Salvar Alteracoes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeCategory === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notificacoes</CardTitle>
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
                      onCheckedChange={(v) => {
                        setNotifPrefs(prev => ({ ...prev, [item.key]: v }))
                        saveSettings()
                      }}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeCategory === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Seguranca</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {[
                  { label: 'Autenticacao 2FA', desc: 'Adicione uma camada extra de seguranca', action: 'Configurar' },
                  { label: 'Sessoes Ativas', desc: 'Gerencie dispositivos conectados', action: 'Ver Sessoes' },
                  { label: 'Alterar Senha', desc: 'Atualize sua senha de acesso', action: 'Alterar' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-[var(--surface-hover)]">
                    <div>
                      <p className="text-[13px] font-[500]">{item.label}</p>
                      <p className="text-[11px] text-[var(--text-3)] mt-0.5">{item.desc}</p>
                    </div>
                    <Button variant="outline" size="sm">{item.action}</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeCategory === 'modules' && (
            <Card>
              <CardHeader>
                <CardTitle>Modulos</CardTitle>
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
                      onCheckedChange={(v) => {
                        setModuleToggles(prev => ({ ...prev, [mod.id]: v }))
                        saveSettings()
                      }}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
