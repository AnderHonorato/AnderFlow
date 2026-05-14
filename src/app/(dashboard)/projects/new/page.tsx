'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Loader2, Paperclip, Upload } from 'lucide-react'

const projectTypes = [
  'IA', 'Automação', 'Chatbot', 'SaaS', 'CRM', 'Dashboard', 'ERP',
  'Website', 'Landing Page', 'App Mobile', 'Integração API',
  'WhatsApp Automation', 'URA Inteligente', 'Sistema Interno', 'Sistema Personalizado',
]

const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']

export default function NewProjectPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    objective: '',
    targetAudience: '',
    references: '',
    links: '',
    desiredFeatures: '',
    budget: '',
    deadline: '',
    priority: 'MEDIUM',
    notes: '',
  })

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          type: form.category.toUpperCase().replace(/\s+/g, '_'),
          clientId: 'cm1_example',
          budget: form.budget ? parseFloat(form.budget) : null,
          deadline: form.deadline || null,
          priority: form.priority,
          briefing: {
            objective: form.objective,
            targetAudience: form.targetAudience,
            references: form.references,
            links: form.links,
            desiredFeatures: form.desiredFeatures,
            notes: form.notes,
          },
          tags: [form.category],
        }),
      })

      if (res.ok) {
        router.push('/projects')
        router.refresh()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Novo Projeto</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Preencha o briefing para iniciar um novo projeto
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações Básicas</CardTitle>
            <CardDescription>Dados essenciais do projeto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome do Projeto *</label>
                <Input
                  placeholder="Ex: E-commerce Premium"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoria</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                >
                  <option value="">Selecionar categoria...</option>
                  {projectTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Input
                placeholder="Descreva o projeto resumidamente..."
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Orçamento (R$)</label>
                <Input
                  type="number"
                  placeholder="45000"
                  value={form.budget}
                  onChange={(e) => handleChange('budget', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Prazo</label>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => handleChange('deadline', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Prioridade</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                >
                  {priorities.map((p) => (
                    <option key={p} value={p}>
                      {p === 'LOW' ? 'Baixa' : p === 'MEDIUM' ? 'Média' : p === 'HIGH' ? 'Alta' : p === 'URGENT' ? 'Urgente' : 'Crítica'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalhes do Briefing</CardTitle>
            <CardDescription>Informações detalhadas para planejamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Objetivo</label>
              <Input
                placeholder="Qual o objetivo principal do projeto?"
                value={form.objective}
                onChange={(e) => handleChange('objective', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Público-alvo</label>
              <Input
                placeholder="Quem vai usar o sistema?"
                value={form.targetAudience}
                onChange={(e) => handleChange('targetAudience', e.target.value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Referências</label>
                <Input
                  placeholder="Sites/apps de referência"
                  value={form.references}
                  onChange={(e) => handleChange('references', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Links</label>
                <Input
                  placeholder="Links relevantes"
                  value={form.links}
                  onChange={(e) => handleChange('links', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Funcionalidades Desejadas</label>
              <Input
                placeholder="Liste as principais funcionalidades..."
                value={form.desiredFeatures}
                onChange={(e) => handleChange('desiredFeatures', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Observações</label>
              <Input
                placeholder="Observações adicionais..."
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="p-6 flex items-center justify-center gap-3">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Arraste anexos aqui ou</span>
            <Button variant="outline" size="sm" type="button">
              <Upload className="mr-2 h-3.5 w-3.5" />
              Selecionar Arquivos
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading || !form.name}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Projeto
          </Button>
        </div>
      </form>
    </div>
  )
}
