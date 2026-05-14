'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Bot,
  Send,
  Sparkles,
  FileText,
  Calendar,
  MessageSquare,
  BarChart3,
  Zap,
  Clock,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react'

const aiCapabilities = [
  { title: 'Resumir Projetos', description: 'Gere resumos executivos de projetos', icon: FileText, category: 'Produtividade' },
  { title: 'Gerar Cronograma', description: 'Crie cronogramas baseados no briefing', icon: Calendar, category: 'Planejamento' },
  { title: 'Sugerir Respostas', description: 'Respostas inteligentes para clientes', icon: MessageSquare, category: 'Comunicação' },
  { title: 'Análise de Risco', description: 'Detecte riscos em projetos', icon: AlertTriangle, category: 'Análise' },
  { title: 'Previsão de Atraso', description: 'Preveja possíveis atrasos', icon: Clock, category: 'Previsão' },
  { title: 'Classificar Prioridades', description: 'Organize tarefas por prioridade', icon: Target, category: 'Organização' },
  { title: 'Gerar Propostas', description: 'Crie propostas comerciais', icon: FileText, category: 'Comercial' },
  { title: 'Relatórios Automáticos', description: 'Relatórios semanais e mensais', icon: BarChart3, category: 'Relatórios' },
  { title: 'Detectar Churn', description: 'Identifique clientes insatisfeitos', icon: TrendingUp, category: 'Retenção' },
  { title: 'Automação Inteligente', description: 'Sugira automações para processos', icon: Zap, category: 'Automação' },
]

const aiInsights = [
  { type: 'warning', title: 'Risco de atraso detectado', description: 'O projeto "App de Delivery" tem 73% de chance de atraso na sprint atual.', action: 'Ver detalhes' },
  { type: 'success', title: 'Oportunidade de upsell', description: 'TechStore demonstrou interesse em módulo de analytics. Score: 85%.', action: 'Criar proposta' },
  { type: 'info', title: 'Sugestão de automação', description: 'Detectamos que você envia o mesmo tipo de email 12x por semana. Podemos automatizar.', action: 'Criar automação' },
]

export default function AIPage() {
  const [prompt, setPrompt] = useState('')

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inteligência Artificial</h1>
          <p className="text-sm text-muted-foreground mt-1">
            IA integrada para produtividade e automação
          </p>
        </div>
        <Badge variant="info" className="gap-1">
          <Sparkles className="h-3 w-3" />
          GPT-4 Ativo
        </Badge>
      </div>

      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-medium">Assistente IA</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Pergunte qualquer coisa sobre seus projetos, clientes ou finanças.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <Input
                  placeholder="Ex: Resuma o progresso do projeto E-commerce..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="flex-1"
                />
                <Button disabled={!prompt.trim()}>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-warning" />
          Insights da IA
        </h3>
        <div className="grid gap-3">
          {aiInsights.map((insight, i) => (
            <Card key={i} className="card-hover">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  insight.type === 'warning' ? 'bg-warning/10' :
                  insight.type === 'success' ? 'bg-success/10' : 'bg-info/10'
                }`}>
                  {insight.type === 'warning' && <AlertTriangle className="h-5 w-5 text-warning" />}
                  {insight.type === 'success' && <TrendingUp className="h-5 w-5 text-success" />}
                  {insight.type === 'info' && <Lightbulb className="h-5 w-5 text-info" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                </div>
                <Button variant="outline" size="sm">{insight.action}</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">Capacidades da IA</h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {aiCapabilities.map((cap) => (
            <Card key={cap.title} className="card-hover cursor-pointer">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <cap.icon className="h-[18px] w-[18px] text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{cap.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{cap.description}</p>
                  <Badge variant="secondary" className="text-2xs mt-2">{cap.category}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
