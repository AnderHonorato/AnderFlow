import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 })
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [
      totalConversations,
      totalMessages,
      conversationsByType,
      feedbacks,
      dailyUsage,
    ] = await Promise.all([
      prisma.aiConversation.count(),
      prisma.aiMessage.count(),
      prisma.aiConversation.groupBy({
        by: ['title'],
        _count: true,
      }),
      prisma.feedback.findMany({
        where: {
          type: { in: ['ai_feedback', 'ai_error'] },
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { rating: true },
      }),
      prisma.aiMessage.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true, content: true },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    const totalFeedback = feedbacks.length
    const positiveFeedback = feedbacks.filter(f => f.rating >= 4).length
    const satisfactionRate = totalFeedback > 0 ? Math.round((positiveFeedback / totalFeedback) * 100) : 0

    const avgMessagesPerConversation = totalConversations > 0
      ? Math.round((totalMessages / totalConversations) * 10) / 10
      : 0

    // Daily usage aggregation
    const dailyMap = new Map<string, number>()
    for (const msg of dailyUsage) {
      const day = new Date(msg.createdAt).toISOString().split('T')[0]
      dailyMap.set(day, (dailyMap.get(day) || 0) + 1)
    }

    const dailyUsageData = Array.from(dailyMap.entries()).map(([day, count]) => ({ day, count }))

    // Type distribution
    const typeDist: Record<string, number> = {}
    for (const conv of conversationsByType) {
      const key = conv.title || 'Outros'
      typeDist[key] = (typeDist[key] || 0) + conv._count
    }

    // Top prompt keywords
    const keywords = new Map<string, number>()
    for (const msg of dailyUsage) {
      const words = msg.content.toLowerCase().split(/\s+/)
      for (const word of words) {
        if (word.length > 3 && !['sobre', 'para', 'com', 'como', 'uma', 'que', 'dos'].includes(word)) {
          keywords.set(word, (keywords.get(word) || 0) + 1)
        }
      }
    }

    const topKeywords = Array.from(keywords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }))

    // Cost estimate (DeepSeek ~$0.000001 per token, rough estimate)
    const estimatedTokens = dailyUsage.reduce((sum, msg) => sum + msg.content.length / 4, 0)
    const estimatedCost = estimatedTokens * 0.000001

    return NextResponse.json({
      data: {
        totalConversations,
        avgMessagesPerConversation,
        typeDistribution: Object.entries(typeDist).map(([name, count]) => ({ name, count })),
        satisfactionRate,
        totalFeedback,
        positiveFeedback,
        dailyUsage: dailyUsageData,
        topKeywords,
        estimatedCost: Math.round(estimatedCost * 10000) / 10000,
      },
    })
  } catch (error) {
    console.error('[ai-analytics] Error:', error)
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
  }
}
