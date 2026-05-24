'use client'
import { useEffect, useState } from 'react'
import { ActivityHeatmap } from '@/components/ui/activity-heatmap'
import { Skeleton } from '@/components/ui/skeleton'

export function ActivityHeatmapWrapper() {
  const [data, setData] = useState<{ activity: Record<string, number>; max: number } | null>(null)
  useEffect(() => {
    fetch('/api/analytics/activity')
      .then(r => r.json())
      .then(json => setData({ activity: json.activity || {}, max: json.max || 0 }))
      .catch(() => setData({ activity: {}, max: 0 }))
  }, [])
  if (!data) return <Skeleton className="h-40" />
  return <ActivityHeatmap data={data.activity} max={data.max} />
}
