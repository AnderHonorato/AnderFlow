'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw } from 'lucide-react'

interface ComponentStatus {
  name: string
  status: 'operational' | 'degraded' | 'outage'
  latencyMs?: number
}

export default function StatusPage() {
  const [components, setComponents] = useState<ComponentStatus[]>([])
  const [lastChecked, setLastChecked] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStatus = () => {
    setLoading(true)
    fetch('/api/system-status')
      .then(r => r.json())
      .then(json => { setComponents(json.data?.components || []); setLastChecked(json.data?.lastChecked); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 60000)
    return () => clearInterval(interval)
  }, [])

  const allOp = components.every(c => c.status === 'operational')
  const hasOutage = components.some(c => c.status === 'outage')

  if (loading && !components.length) return (
    <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
      <div className="text-center"><Skeleton className="h-8 w-48 mx-auto mb-4" /><Skeleton className="h-64 w-[400px]" /></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F5F5F0] py-16 px-6">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-[#1A1A14] mb-1">ANDERFLOW</h1>
          <p className="text-sm text-[#8A8A84]">Status do Sistema</p>
        </div>

        <div className={`text-center mb-8 p-4 rounded-xl ${allOp ? 'bg-[#e8f5e9]' : hasOutage ? 'bg-[#fce4e4]' : 'bg-[#fff8e1]'}`}>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${allOp ? 'bg-[#e8f5e9] text-[#2e7d32]' : hasOutage ? 'bg-[#fce4e4] text-[#c62828]' : 'bg-[#fff8e1] text-[#e65100]'}`}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: allOp ? '#2e7d32' : hasOutage ? '#c62828' : '#e65100' }} />
            {allOp ? 'Todos os sistemas operacionais' : hasOutage ? 'Alguns sistemas indisponíveis' : 'Desempenho degradado'}
          </div>
        </div>

        <Card className="bg-white border-[#E8E8E3]">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-[#8A8A84] uppercase tracking-wider">Componentes</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y divide-[#F0F0EB]">
              {components.map(c => (
                <div key={c.name} className="flex items-center justify-between py-3">
                  <span className="text-sm text-[#1A1A14]">{c.name}</span>
                  <div className="flex items-center gap-2">
                    {c.latencyMs != null && <span className="text-xs text-[#8A8A84]">{c.latencyMs}ms</span>}
                    <span className="h-2 w-2 rounded-full" style={{ background: c.status === 'operational' ? '#3D9A6E' : c.status === 'degraded' ? '#C4852A' : '#C44A3A' }} />
                    <span className="text-xs font-medium" style={{ color: c.status === 'operational' ? '#3D9A6E' : c.status === 'degraded' ? '#C4852A' : '#C44A3A' }}>
                      {c.status === 'operational' ? 'Operacional' : c.status === 'degraded' ? 'Degradado' : 'Indisponível'}
                    </span>
                  </div>
                </div>
              ))}
              {components.length === 0 && <p className="py-4 text-sm text-[#8A8A84] text-center">Nenhum componente</p>}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center space-y-3">
          <Button variant="outline" size="sm" onClick={fetchStatus} className="text-xs"><RefreshCw className="mr-2 h-3 w-3" />Atualizar</Button>
          {lastChecked && <p className="text-xs text-[#8A8A84]">Atualizado em {new Date(lastChecked).toLocaleString('pt-BR')}</p>}
        </div>
      </div>
    </div>
  )
}
