'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Brain, ChevronDown, ChevronUp, TrendingUp, AlertTriangle, Sparkles, Lightbulb, ArrowRight } from 'lucide-react'

interface CrmInsight {
  leads_quentes: { nome: string; score: number; probabilidade_conversao: number; acao_recomendada: string }[]
  leads_esfriando: { nome: string; dias_sem_contato: number; acao_recomendada: string }[]
  metricas_pipeline: { valor_total: number; ticket_medio: number; taxa_conversao_estimada: number }
  tempo_medio_estagio: string
  acoes_prioritarias: string[]
  insight_resumo: string
}

export function AIInsightsPanel() {
  const [insights, setInsights] = useState<CrmInsight | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchInsights()
  }, [])

  const fetchInsights = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/crm-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodo: '30d' }),
      })
      if (!res.ok) throw new Error('Erro ao carregar insights')
      const data = await res.json()
      setInsights(data)
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-500" />
            Insights da IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !insights) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-500" />
            Insights da IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {error || 'Clique para gerar insights do CRM com IA'}
          </p>
          <button
            onClick={fetchInsights}
            className="text-xs text-primary mt-2 hover:underline"
          >
            Gerar insights
          </button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-500" />
            Insights da IA
          </CardTitle>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">{insights.insight_resumo}</p>

        {insights.leads_quentes.length > 0 && (
          <div>
            <h4 className="text-xs font-medium flex items-center gap-1.5 mb-1.5">
              <TrendingUp className="h-3 w-3 text-green-500" />
              Leads Quentes
            </h4>
            <div className="space-y-1">
              {insights.leads_quentes.slice(0, 3).map((l, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-muted/50 rounded-md px-2 py-1.5">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium truncate block">{l.nome}</span>
                    <span className="text-muted-foreground">{l.acao_recomendada}</span>
                  </div>
                  <Badge variant="success" className="text-[10px] shrink-0 ml-2">
                    {l.probabilidade_conversao}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {insights.leads_esfriando.length > 0 && (
          <div>
            <h4 className="text-xs font-medium flex items-center gap-1.5 mb-1.5">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              Leads Esfriando
            </h4>
            <div className="space-y-1">
              {insights.leads_esfriando.slice(0, 2).map((l, i) => (
                <div key={i} className="text-xs bg-muted/50 rounded-md px-2 py-1.5">
                  <span className="font-medium">{l.nome}</span>
                  <span className="text-muted-foreground"> — {l.dias_sem_contato}d sem contato</span>
                  <br />
                  <span className="text-muted-foreground">{l.acao_recomendada}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {insights.acoes_prioritarias.length > 0 && (
          <div>
            <h4 className="text-xs font-medium flex items-center gap-1.5 mb-1.5">
              <Lightbulb className="h-3 w-3 text-blue-500" />
              Acoes Prioritarias
            </h4>
            <div className="space-y-1">
              {insights.acoes_prioritarias.slice(0, 3).map((a, i) => (
                <div key={i} className="text-xs flex items-start gap-1.5">
                  <ArrowRight className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                  <span>{a}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {expanded && (
          <div className="pt-2 border-t border-border text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Valor do Pipeline:</span>
              <span className="font-medium">R$ {insights.metricas_pipeline.valor_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0'}</span>
            </div>
            <div className="flex justify-between">
              <span>Ticket Medio:</span>
              <span className="font-medium">R$ {insights.metricas_pipeline.ticket_medio?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0'}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxa de Conversao:</span>
              <span className="font-medium">{insights.metricas_pipeline.taxa_conversao_estimada || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span>Tempo Medio no Estagio:</span>
              <span className="font-medium">{insights.tempo_medio_estagio || 'N/A'}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AIInsightsPanel
