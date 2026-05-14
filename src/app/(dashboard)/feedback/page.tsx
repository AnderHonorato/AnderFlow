'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Lightbulb,
  ThumbsUp,
  TrendingUp,
  Clock,
  Plus,
  MessageSquare,
} from 'lucide-react'

const suggestions = [
  {
    id: '1', title: 'Integração com Google Calendar', description: 'Sincronizar prazos e eventos com o Google Calendar automaticamente.',
    votes: 34, status: 'planned', category: 'Integrações', author: 'Carlos S.',
  },
  {
    id: '2', title: 'Modo escuro automático por horário', description: 'Alternar tema claro/escuro automaticamente baseado no horário do dia.',
    votes: 28, status: 'completed', category: 'UX/UI', author: 'Ana O.',
  },
  {
    id: '3', title: 'Exportar relatórios em Excel', description: 'Permitir exportação de relatórios financeiros em formato .xlsx além do PDF.',
    votes: 22, status: 'in_progress', category: 'Financeiro', author: 'Roberto S.',
  },
  {
    id: '4', title: 'API para terceiros', description: 'Disponibilizar API pública para integrações de terceiros.',
    votes: 18, status: 'under_review', category: 'Integrações', author: 'Juliana C.',
  },
  {
    id: '5', title: 'Tema customizável por cliente', description: 'Permitir que cada cliente tenha cores personalizadas no portal.',
    votes: 15, status: 'planned', category: 'White Label', author: 'Fernando A.',
  },
]

function getStatusBadge(status: string) {
  switch (status) {
    case 'completed': return <Badge variant="success" className="text-2xs">Concluído</Badge>
    case 'in_progress': return <Badge variant="info" className="text-2xs">Em Desenvolvimento</Badge>
    case 'planned': return <Badge variant="warning" className="text-2xs">Planejado</Badge>
    case 'under_review': return <Badge variant="secondary" className="text-2xs">Em Análise</Badge>
    default: return null
  }
}

export default function FeedbackPage() {
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Feedback & Roadmap</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sugira funcionalidades e acompanhe o desenvolvimento
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Sugestão
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input
                placeholder="Resuma sua ideia..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                placeholder="Descreva como funcionaria..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button size="sm">Enviar Sugestão</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <Card key={suggestion.id} className="card-hover">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium">{suggestion.title}</h3>
                    {getStatusBadge(suggestion.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{suggestion.description}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{suggestion.category}</span>
                    <span>&middot; por {suggestion.author}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="flex items-center gap-1 shrink-0">
                  <ThumbsUp className="h-3.5 w-3.5" />
                  <span>{suggestion.votes}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
