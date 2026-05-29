'use client'

import { useState, useEffect } from 'react'
import { Brain, ChevronDown, ChevronUp, TrendingUp, AlertTriangle, RefreshCw, Star, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeadQuente {
  nome: string
  score: number
  probabilidade_conversao: number
  acao_recomendada: string
}

interface LeadEsfriando {
  nome: string
  dias_sem_contato: number
  acao_recomendada: string
}

interface MetricasPipeline {
  valor_total: number
  ticket_medio: number
  taxa_conversao_estimada: number
}

interface CRMInsight {
  leads_quentes: LeadQuente[]
  leads_esfriando: LeadEsfriando[]
  metricas_pipeline: MetricasPipeline
  tempo_medio_estagio: string
  acoes_prioritarias: string[]
  insight_resumo: string
  reasoning?: string
}

export function AIInsightsPanel() {
  const [insight, setInsight] = useState<CRMInsight | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)
  const [showReasoning, setShowReasoning] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchInsights = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/crm-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodo: '30d' }),
      })
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      const data = await res.json()
      setInsight(data)
      setLastUpdated(new Date())
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInsights()

    const interval = setInterval(fetchInsights, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
            <Brain className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-medium">Insights da IA</h3>
            <p className="text-[11px] text-muted-foreground">
              {loading
                ? 'Analisando dados do CRM...'
                : lastUpdated
                  ? `Atualizado ${lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                  : 'Clique para carregar'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading && <RefreshCw className="h-3.5 w-3.5 text-muted-foreground animate-spin" />}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4">
          {loading && !insight && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Gerando insights com IA...
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
              <button onClick={fetchInsights} className="ml-auto text-xs underline">
                Tentar novamente
              </button>
            </div>
          )}

          {insight && (
            <>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {insight.insight_resumo}
              </p>

              {insight.leads_quentes?.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400 mb-2">
                    <Star className="h-3 w-3" />
                    Leads Quentes
                  </h4>
                  <div className="space-y-2">
                    {insight.leads_quentes.slice(0, 3).map((lead, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between gap-3 rounded-lg bg-green-500/5 border border-green-500/10 px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{lead.nome}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {lead.acao_recomendada}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Zap className="h-3 w-3 text-green-500" />
                          <span className="text-[11px] font-semibold text-green-600">
                            {lead.score}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {insight.leads_esfriando?.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-medium text-orange-600 dark:text-orange-400 mb-2">
                    <AlertTriangle className="h-3 w-3" />
                    Leads Esfriando
                  </h4>
                  <div className="space-y-2">
                    {insight.leads_esfriando.slice(0, 3).map((lead, i) => (
                      <div
                        key={i}
                        className="rounded-lg bg-orange-500/5 border border-orange-500/10 px-3 py-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium">{lead.nome}</p>
                          <span className="text-[10px] text-orange-600 font-medium">
                            {lead.dias_sem_contato}d sem contato
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {lead.acao_recomendada}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {insight.acoes_prioritarias?.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-1.5 text-xs font-medium mb-2">
                    <TrendingUp className="h-3 w-3" />
                    Acoes Prioritarias
                  </h4>
                  <ul className="space-y-1">
                    {insight.acoes_prioritarias.slice(0, 5).map((acao, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-muted-foreground/40 mt-0.5">•</span>
                        {acao}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {insight.reasoning && (
                <div>
                  <button
                    onClick={() => setShowReasoning(!showReasoning)}
                    className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Brain className="h-3 w-3" />
                    Ver raciocinio da IA
                    {showReasoning ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                  {showReasoning && (
                    <p className="mt-1.5 text-[10px] text-muted-foreground/70 leading-relaxed whitespace-pre-wrap border-l-2 border-muted-foreground/15 pl-2">
                      {insight.reasoning}
                    </p>
                  )}
                </div>
              )}

              {insight.metricas_pipeline && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-muted/30 px-3 py-2 text-center">
                    <p className="text-[10px] text-muted-foreground">Pipeline</p>
                    <p className="text-xs font-semibold">
                      R$ {insight.metricas_pipeline.valor_total?.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/30 px-3 py-2 text-center">
                    <p className="text-[10px] text-muted-foreground">Ticket Medio</p>
                    <p className="text-xs font-semibold">
                      R$ {insight.metricas_pipeline.ticket_medio?.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/30 px-3 py-2 text-center">
                    <p className="text-[10px] text-muted-foreground">Conversao</p>
                    <p className="text-xs font-semibold">
                      {insight.metricas_pipeline.taxa_conversao_estimada}%
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
