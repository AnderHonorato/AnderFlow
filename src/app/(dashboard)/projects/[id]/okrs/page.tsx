'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Target, TrendingUp, Trash2 } from 'lucide-react'

export default function ProjectOKRsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [okrs, setOkrs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [objective, setObjective] = useState('')
  const [krs, setKrs] = useState<{ title: string; targetValue: number; unit: string }[]>([{ title: '', targetValue: 100, unit: '%' }])
  const [saving, setSaving] = useState(false)

  const loadOKRs = async () => {
    try {
      const res = await fetch(`/api/okrs?projectId=${id}`)
      const json = await res.json()
      setOkrs(json.data || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { loadOKRs() }, [id])

  const handleCreate = async () => {
    if (!objective.trim() || krs.some(k => !k.title.trim())) {
      toast.error('Preencha o objetivo e todos os KRs')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/okrs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id, objective: objective.trim(), keyResults: krs.filter(k => k.title.trim()) }),
      })
      if (res.ok) {
        toast.success('OKR criado!')
        loadOKRs()
        handleClose()
      } else {
        toast.error('Erro ao criar OKR')
      }
    } catch { toast.error('Erro ao criar OKR') }
    setSaving(false)
  }

  const handleDelete = async (okrId: string) => {
    try {
      await fetch(`/api/okrs?id=${okrId}`, { method: 'DELETE' })
      setOkrs(prev => prev.filter(o => o.id !== okrId))
      toast.success('OKR removido')
    } catch { toast.error('Erro ao remover') }
  }

  const handleUpdateKR = async (krId: string, value: number) => {
    try {
      await fetch('/api/okrs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ krId, currentValue: value }),
      })
      loadOKRs()
      toast.success('Valor atualizado!')
    } catch { toast.error('Erro ao atualizar') }
  }

  const addKrField = () => setKrs(prev => [...prev, { title: '', targetValue: 100, unit: '%' }])

  const handleClose = () => {
    setDialogOpen(false)
    setObjective('')
    setKrs([{ title: '', targetValue: 100, unit: '%' }])
  }

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto animate-page-enter">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/projects/${id}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-[17px] font-[500]">OKRs do Projeto</h1>
            <p className="text-[12px] text-[var(--text-3)] mt-1">Objetivos e resultados-chave</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Novo OKR
        </Button>
      </div>

      {okrs.length === 0 ? (
        <Card><CardContent className="p-8 text-center"><Target className="h-8 w-8 mx-auto mb-3 text-[var(--text-3)]" /><p className="text-sm text-[var(--text-3)]">Nenhum OKR definido para este projeto</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {okrs.map(okr => (
            <Card key={okr.id}>
              <CardHeader className="pb-2 flex flex-row items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-[14px] font-[500] flex items-center gap-2">
                    <Target className="h-4 w-4 text-[var(--accent)]" />
                    {okr.objective}
                  </CardTitle>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(okr.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-[var(--text-3)]" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {okr.keyResults.map((kr: any) => {
                  const pct = kr.targetValue > 0 ? (kr.currentValue / kr.targetValue) * 100 : 0
                  return (
                    <div key={kr.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] font-[500] text-[var(--text)]">{kr.title}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[var(--text-3)]">
                            {kr.currentValue}{kr.unit} / {kr.targetValue}{kr.unit}
                          </span>
                          <Badge variant={pct >= 70 ? 'success' : pct >= 40 ? 'warning' : 'destructive'} className="text-2xs">
                            {Math.round(pct)}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0}
                          max={kr.targetValue}
                          value={kr.currentValue}
                          onChange={e => handleUpdateKR(kr.id, parseFloat(e.target.value))}
                          className="flex-1 h-1 accent-[var(--accent)] cursor-pointer"
                        />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={o => { if (!o) handleClose() }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-[500]">Novo OKR</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--text-2)]">Objetivo</label>
              <Input value={objective} onChange={e => setObjective(e.target.value)} placeholder="Ex: Aumentar satisfação do cliente" className="h-9 text-xs" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-[var(--text-2)]">Resultados-Chave (KRs)</label>
                <Button variant="ghost" size="sm" onClick={addKrField} className="h-6 text-[10px]"><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
              </div>
              {krs.map((kr, i) => (
                <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                  <Input
                    value={kr.title}
                    onChange={e => { const u = [...krs]; u[i].title = e.target.value; setKrs(u) }}
                    placeholder={`KR ${i + 1}: Descreva o resultado`}
                    className="h-8 text-xs flex-1"
                  />
                  <Input
                    type="number"
                    value={kr.targetValue}
                    onChange={e => { const u = [...krs]; u[i].targetValue = parseFloat(e.target.value) || 0; setKrs(u) }}
                    className="h-8 text-xs w-20"
                    placeholder="Meta"
                  />
                  {krs.length > 1 && (
                    <button onClick={() => setKrs(prev => prev.filter((_, idx) => idx !== i))} className="text-[var(--text-3)] hover:text-[var(--destructive)]">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={handleClose}>Cancelar</Button>
            <Button size="sm" onClick={handleCreate} disabled={saving}>{saving ? 'Criando...' : 'Criar OKR'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
