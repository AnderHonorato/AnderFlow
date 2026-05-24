import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser, isAdmin } from '@/lib/auth-utils'

export async function GET(_request: NextRequest) {
  try {
    const user = await getSessionUser(_request)
    if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Acesso negado' }, { status: 401 })

    const referrers = await prisma.user.findMany({
      where: {
        role: 'CLIENT',
        referredBy: { not: null },
      },
      select: {
        id: true,
        name: true,
        referredBy: true,
        company: true,
      },
    })

    const grouped = new Map<string, { name: string; referrals: { id: string; name: string; company: string | null }[] }>()
    const referrerIds = [...new Set(referrers.map(r => r.referredBy!).filter(Boolean))]

    for (const id of referrerIds) {
      const ref = await prisma.user.findUnique({ where: { id }, select: { name: true } })
      if (ref) grouped.set(id, { name: ref.name, referrals: [] })
    }

    for (const r of referrers) {
      if (!r.referredBy) continue
      const group = grouped.get(r.referredBy)
      if (group) {
        group.referrals.push({ id: r.id, name: r.name, company: r.company })
      }
    }

    const topReferrers = Array.from(grouped.entries())
      .map(([id, data]) => ({ clientId: id, client: data.name, count: data.referrals.length, referrals: data.referrals }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return NextResponse.json({ data: { topReferrers, totalReferred: referrers.length } })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
