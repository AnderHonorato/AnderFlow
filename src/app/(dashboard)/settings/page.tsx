'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Settings,
  User,
  Bell,
  Shield,
  CreditCard,
  Palette,
  Globe,
  Zap,
  Database,
  Users,
  Key,
  Smartphone,
  Mail,
  MessageSquare,
  ToggleLeft,
  ChevronRight,
} from 'lucide-react'

const settingsCategories = [
  { id: 'general', label: 'Geral', icon: Settings, description: 'Configurações gerais da plataforma' },
  { id: 'profile', label: 'Perfil', icon: User, description: 'Dados pessoais e avatar' },
  { id: 'team', label: 'Equipe', icon: Users, description: 'Membros e permissões' },
  { id: 'notifications', label: 'Notificações', icon: Bell, description: 'Alertas e preferências' },
  { id: 'security', label: 'Segurança', icon: Shield, description: '2FA, sessões e privacidade' },
  { id: 'billing', label: 'Faturamento', icon: CreditCard, description: 'Planos, gateways e cobranças' },
  { id: 'appearance', label: 'Aparência', icon: Palette, description: 'Tema, cores e branding' },
  { id: 'integrations', label: 'Integrações', icon: Zap, description: 'APIs, webhooks e apps' },
  { id: 'modules', label: 'Módulos', icon: ToggleLeft, description: 'Ativar/desativar funcionalidades' },
  { id: 'api', label: 'API', icon: Key, description: 'Chaves e documentação' },
]

const modules = [
  { name: 'Projetos', enabled: true, description: 'Gestão de projetos com Kanban, Timeline e Sprints' },
  { name: 'CRM', enabled: true, description: 'Pipeline de vendas e gestão de leads' },
  { name: 'Chat', enabled: true, description: 'Comunicação em tempo real' },
  { name: 'Financeiro', enabled: true, description: 'Faturas, pagamentos e controle financeiro' },
  { name: 'Contratos', enabled: true, description: 'Contratos digitais e assinatura' },
  { name: 'Tickets', enabled: true, description: 'Central de suporte e atendimento' },
  { name: 'IA', enabled: true, description: 'Inteligência artificial e automações' },
  { name: 'Automações', enabled: true, description: 'Workflows e automações de tarefas' },
  { name: 'Analytics', enabled: true, description: 'Métricas e relatórios' },
  { name: 'WhatsApp', enabled: false, description: 'Integração com WhatsApp Business' },
  { name: 'Chamadas', enabled: false, description: 'Video calls e compartilhamento de tela' },
  { name: 'White Label', enabled: false, description: 'Personalização completa da marca' },
  { name: 'App Mobile', enabled: false, description: 'Aplicativo mobile para clientes' },
  { name: 'Onboarding', enabled: true, description: 'Tour guiado e checklist inicial' },
]

export default function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState('modules')

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie todas as configurações da plataforma
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <nav className="space-y-1">
          {settingsCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors text-left ${
                activeCategory === cat.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <cat.icon className="h-4 w-4 shrink-0" />
              <span>{cat.label}</span>
            </button>
          ))}
        </nav>

        <div className="space-y-6">
          {activeCategory === 'modules' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Módulos</CardTitle>
                  <CardDescription>
                    Ative ou desative funcionalidades da plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {modules.map((module) => (
                      <div key={module.name} className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted/50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{module.name}</p>
                            {module.enabled ? (
                              <Badge variant="success" className="text-2xs">Ativo</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-2xs">Inativo</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{module.description}</p>
                        </div>
                        <button
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            module.enabled ? 'bg-primary' : 'bg-muted'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                            module.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeCategory === 'general' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configurações Gerais</CardTitle>
                <CardDescription>Informações básicas da organização</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome da Organização</label>
                    <Input defaultValue="ANDERFLOW Sistemas" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Domínio</label>
                    <Input defaultValue="andero.com.br" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input defaultValue="contato@andero.com.br" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Telefone</label>
                    <Input defaultValue="(11) 99999-0000" />
                  </div>
                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button>Salvar Alterações</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeCategory === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Aparência</CardTitle>
                <CardDescription>Personalize o visual da plataforma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium">Tema</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['light', 'dark', 'system'].map((theme) => (
                      <button
                        key={theme}
                        className={`p-4 rounded-lg border text-center transition-all ${
                          theme === 'system' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                        }`}
                      >
                        <div className={`h-8 w-full rounded mb-2 ${
                          theme === 'light' ? 'bg-white border' :
                          theme === 'dark' ? 'bg-zinc-900' :
                          'bg-gradient-to-r from-white to-zinc-900'
                        }`} />
                        <span className="text-xs font-medium capitalize">{theme === 'system' ? 'Sistema' : theme === 'light' ? 'Claro' : 'Escuro'}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium">Cor Primária</label>
                  <div className="flex gap-2">
                    {['#0066FF', '#7C3AED', '#059669', '#DC2626', '#EA580C', '#0891B2'].map((color) => (
                      <button
                        key={color}
                        className={`h-8 w-8 rounded-full border-2 ${color === '#0066FF' ? 'border-foreground scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeCategory === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Segurança</CardTitle>
                <CardDescription>Proteção da conta e acessos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">Autenticação 2FA</p>
                    <p className="text-xs text-muted-foreground">Adicione uma camada extra de segurança</p>
                  </div>
                  <Button variant="outline" size="sm">Configurar</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">Sessões Ativas</p>
                    <p className="text-xs text-muted-foreground">Gerencie dispositivos conectados</p>
                  </div>
                  <Button variant="outline" size="sm">Ver Sessões</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">Logs de Auditoria</p>
                    <p className="text-xs text-muted-foreground">Histórico de atividades da conta</p>
                  </div>
                  <Button variant="outline" size="sm">Ver Logs</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">LGPD / Privacidade</p>
                    <p className="text-xs text-muted-foreground">Configurações de proteção de dados</p>
                  </div>
                  <Button variant="outline" size="sm">Configurar</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
