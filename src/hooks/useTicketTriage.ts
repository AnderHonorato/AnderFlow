'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSocket } from '@/lib/socket'

export interface TicketTriageInfo {
  ticket_id: string
  prioridade: 'baixa' | 'media' | 'alta' | 'critica'
  categoria: 'tecnico' | 'financeiro' | 'acesso' | 'bug' | 'feature' | 'outros'
  sentimento_cliente: 'satisfeito' | 'neutro' | 'frustrado' | 'furioso'
  urgencia_estimada_horas: number
  resumo_ia: string
  acoes_sugeridas: string[]
  requer_escalacao: boolean
  aiPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  aiCategory: string
  aiSentiment: string
}

export interface TicketLike {
  id: string
  aiPriority?: string | null
  aiCategory?: string | null
  metadata?: string | null
}

const TRIAGE_BADGE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  LOW: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', label: 'Baixa' },
  MEDIUM: { bg: 'bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400', label: 'Media' },
  HIGH: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', label: 'Alta' },
  CRITICAL: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', label: 'Critica' },
}

const SENTIMENT_BADGE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  SATISFEITO: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', label: 'Satisfeito' },
  NEUTRO: { bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', label: 'Neutro' },
  FRUSTRADO: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', label: 'Frustrado' },
  FURIOSO: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', label: 'Furioso' },
}

export function isTicketTriaged(ticket: TicketLike): boolean {
  return !!(ticket.aiPriority && ticket.aiCategory)
}

export function getTriageMetadata(ticket: TicketLike): TicketTriageInfo | null {
  if (!ticket.metadata) return null
  try {
    const parsed = JSON.parse(ticket.metadata)
    return parsed?.ia_triage || null
  } catch {
    return null
  }
}

export function getTriageBadgeColor(priority?: string | null) {
  return TRIAGE_BADGE_COLORS[priority || ''] || TRIAGE_BADGE_COLORS.MEDIUM
}

export function getSentimentBadgeColor(sentiment?: string | null) {
  return SENTIMENT_BADGE_COLORS[sentiment || ''] || SENTIMENT_BADGE_COLORS.NEUTRO
}

export function useTicketTriage(ticket?: TicketLike) {
  const [triageInfo, setTriageInfo] = useState<TicketTriageInfo | null>(null)

  useEffect(() => {
    if (!ticket) return

    const info = getTriageMetadata(ticket)
    if (info) {
      setTriageInfo(info)
    }
  }, [ticket])

  const badgeColor = triageInfo
    ? getTriageBadgeColor(triageInfo.aiPriority)
    : ticket?.aiPriority
      ? getTriageBadgeColor(ticket.aiPriority)
      : null

  const sentimentColor = triageInfo?.aiSentiment
    ? getSentimentBadgeColor(triageInfo.aiSentiment)
    : null

  return {
    isTriaged: isTicketTriaged(ticket || {}),
    triageInfo,
    badgeColor,
    sentimentColor,
  }
}

export function useTicketTriageListener(onTriaged?: (data: TicketTriageInfo) => void) {
  const [latestTriage, setLatestTriage] = useState<TicketTriageInfo | null>(null)
  const [triagedIds, setTriagedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const socket = getSocket()

    const handler = (data: TicketTriageInfo) => {
      setLatestTriage(data)
      setTriagedIds((prev) => new Set([...prev, data.ticket_id]))
      onTriaged?.(data)
    }

    socket.on('ticket:triaged', handler)

    return () => {
      socket.off('ticket:triaged', handler)
    }
  }, [onTriaged])

  const isTriaged = useCallback(
    (ticketId: string) => triagedIds.has(ticketId),
    [triagedIds],
  )

  return {
    latestTriage,
    triagedIds,
    isTriaged,
  }
}
