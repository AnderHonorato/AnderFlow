// ============================================
// AI USAGE MONITOR — Rastreia uso e custos da DeepSeek API
// ============================================

import { prisma } from '@/lib/prisma'
import type { UsageStats } from '@/lib/deepseek-types'
import { estimateCost, estimateCacheSavings } from '@/lib/deepseek'

export interface AiUsageData {
  model: string
  feature: 'chat' | 'analyze' | 'triage' | 'automation' | 'report' | 'contract' | 'proposal' | 'sentiment' | 'translate' | 'improve' | 'review' | 'other'
  inputTokens: number
  outputTokens: number
  cacheHitTokens: number
  cacheMissTokens: number
  durationMs: number
  userId?: string
  success: boolean
  errorMessage?: string
}

let warnedPrismaMissing = false

export async function trackAiUsage(data: AiUsageData): Promise<void> {
  try {
    const inputTokens = data.inputTokens || 0
    const outputTokens = data.outputTokens || 0
    const totalTokens = inputTokens + outputTokens

    const costUsd = calculateCost({
      prompt_tokens: inputTokens,
      completion_tokens: outputTokens,
      total_tokens: totalTokens,
      prompt_cache_hit_tokens: data.cacheHitTokens,
      prompt_cache_miss_tokens: data.cacheMissTokens,
    }, data.model)

    await (prisma as any).aiUsage.create({
      data: {
        model: data.model,
        feature: data.feature,
        inputTokens,
        outputTokens,
        cacheHitTokens: data.cacheHitTokens || 0,
        cacheMissTokens: data.cacheMissTokens || 0,
        costUsd,
        durationMs: data.durationMs,
        userId: data.userId || null,
        success: data.success,
        errorMessage: data.errorMessage || null,
      },
    })
  } catch {
    if (!warnedPrismaMissing) {
      console.log('[AI Monitor] AiUsage model not found in Prisma schema. Run: npx prisma generate')
      warnedPrismaMissing = true
    }
  }
}

export async function trackAiUsageFromResponse(
  model: string,
  feature: AiUsageData['feature'],
  usage: UsageStats | undefined,
  durationMs: number,
  userId?: string,
): Promise<void> {
  if (!usage) return
  await trackAiUsage({
    model,
    feature,
    inputTokens: usage.prompt_tokens || 0,
    outputTokens: usage.completion_tokens || 0,
    cacheHitTokens: usage.prompt_cache_hit_tokens || 0,
    cacheMissTokens: usage.prompt_cache_miss_tokens || 0,
    durationMs,
    userId,
    success: true,
  })
}

function calculateCost(usage: UsageStats, model?: string): number {
  const isPro = model?.includes('pro') || model?.includes('v4-pro')
  const pricing = isPro
    ? { input: 0.435, output: 0.87, cacheHit: 0.003625 }
    : { input: 0.14, output: 0.28, cacheHit: 0.0028 }

  const cacheHit = usage.prompt_cache_hit_tokens || 0
  const cacheMiss = (usage.prompt_tokens || 0) - cacheHit
  const output = usage.completion_tokens || 0

  const inputCost = (cacheHit * pricing.cacheHit + cacheMiss * pricing.input) / 1_000_000
  const outputCost = (output * pricing.output) / 1_000_000

  return Math.round((inputCost + outputCost) * 10000) / 10000
}

export async function getAiUsageStats(periodDays: number = 30): Promise<{
  totalCost: number
  totalTokens: number
  cacheHitTokens: number
  totalRequests: number
  byFeature: Record<string, { count: number; cost: number; tokens: number }>
}> {
  try {
    const since = new Date()
    since.setDate(since.getDate() - periodDays)

    const logs = await (prisma as any).aiUsage.findMany({
      where: { timestamp: { gte: since } },
    })

    const byFeature: Record<string, { count: number; cost: number; tokens: number }> = {}
    let totalCost = 0
    let totalTokens = 0
    let cacheHitTokens = 0
    let totalRequests = logs.length

    for (const log of logs) {
      totalCost += log.costUsd || 0
      totalTokens += (log.inputTokens || 0) + (log.outputTokens || 0)
      cacheHitTokens += log.cacheHitTokens || 0

      const feature = log.feature || 'other'
      if (!byFeature[feature]) {
        byFeature[feature] = { count: 0, cost: 0, tokens: 0 }
      }
      byFeature[feature].count++
      byFeature[feature].cost += log.costUsd || 0
      byFeature[feature].tokens += (log.inputTokens || 0) + (log.outputTokens || 0)
    }

    return { totalCost, totalTokens, cacheHitTokens, totalRequests, byFeature }
  } catch {
    return { totalCost: 0, totalTokens: 0, cacheHitTokens: 0, totalRequests: 0, byFeature: {} }
  }
}

export { estimateCost, estimateCacheSavings }
