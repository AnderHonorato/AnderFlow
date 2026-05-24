'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, TrendingUp } from 'lucide-react'

export default function ReferralsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics/referrals')
      .then(r => r.json())
      .then(json => { setData(json.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
      </div>
    )
  }

  const { topReferrers, totalReferred } = data || { topReferrers: [], totalReferred: 0 }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto animate-page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-[500] tracking-[-0.015em] flex items-center gap-2">
            <Users className="h-5 w-5" /> Indicacoes
          </h1>
          <p className="text-[12px] text-[var(--text-3)] mt-1">
            {totalReferred} clientes indicados
          </p>
        </div>
        <Badge variant="info" className="text-[11px]">
          <TrendingUp className="h-3 w-3 mr-1" /> {topReferrers.length} indicadores ativos
        </Badge>
      </div>

      {topReferrers.length === 0 ? (
        <Card><CardContent className="p-8 text-center"><p className="text-[var(--text-3)]">Nenhuma indicacao registrada ainda</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {topReferrers.map((ref: any, i: number) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-white text-[13px] font-[600]">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-[14px] font-[500] text-[var(--text)]">{ref.client}</p>
                    <p className="text-[11px] text-[var(--text-3)]">{ref.count} cliente{ref.count > 1 ? 's' : ''} indicado{ref.count > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="space-y-1 ml-11">
                  {ref.referrals.map((r: any) => (
                    <div key={r.id} className="flex items-center gap-2 text-[12px] text-[var(--text-2)] py-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shrink-0" />
                      <span>{r.name}</span>
                      {r.company && <span className="text-[var(--text-3)]">({r.company})</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
