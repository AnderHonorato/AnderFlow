'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ThumbsUp, ThumbsDown, AlertTriangle, ChevronDown, MessageSquare, Eye } from 'lucide-react'

export default function FeedbacksIAPage() {
  const { data: session } = useSession()
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all'|'ai_feedback'|'ai_error'>('all')
  const [expanded, setExpanded] = useState<string|null>(null)

  useEffect(() => {
    fetch('/api/ai/feedback').then(r=>r.json()).then(j=>{setFeedbacks(j.data||[]);setLoading(false)}).catch(()=>setLoading(false))
  }, [])

  const filtered = filter==='all'?feedbacks:feedbacks.filter(f=>f.type===filter)

  const parseContent = (content:string) => {
    const lines = content.split('\n')
    const result: Record<string,string> = {}
    for (const l of lines) {
      if (l.startsWith('Usuario: ')) result.user = l.replace('Usuario: ','')
      else if (l.startsWith('Mensagem IA: ')) result.aiMsg = l.replace('Mensagem IA: ','')
      else if (l.startsWith('Feedback: ')) result.feedback = l.replace('Feedback: ','')
      else if (l.startsWith('Screenshot: ')) result.screenshot = l.replace('Screenshot: ','')
      else if (l.startsWith('Conversa completa: ')) result.conversation = l.replace('Conversa completa: ','')
    }
    return result
  }

  if (loading) return <div className="p-6 space-y-4">{[1,2,3,4].map(i=><Skeleton key={i} className="h-24 rounded-xl"/>)}</div>

  return (
    <div className="p-6 space-y-5 animate-page-enter">
      <div className="flex items-center justify-between">
        <div><h2 className="text-[17px] font-[500] tracking-[-0.015em]">Feedbacks IA</h2><p className="text-[12px] text-[var(--text-3)] mt-1">{feedbacks.length} registros</p></div>
        <div className="flex items-center gap-2">
          {(['all','ai_feedback','ai_error'] as const).map(f=>(
            <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1 rounded-lg text-[11px] font-[500] transition-colors ${filter===f?'bg-[var(--accent)] text-white':'bg-[var(--surface-2)] text-[var(--text-3)] hover:bg-[var(--surface)]'}`}>
              {f==='all'?'Todos':f==='ai_feedback'?'Feedbacks':'Erros'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length===0&&<p className="text-[13px] text-[var(--text-3)] text-center py-12">Nenhum registro</p>}
        {filtered.map(f=>{
          const d = parseContent(f.content||'')
          const isOpen = expanded===f.id
          return (
          <Card key={f.id} className={f.type==='ai_error'?'border-[var(--destructive)]/20':''}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)]">
                  {f.type==='ai_error'?<AlertTriangle className="h-4 w-4 text-[var(--destructive)]"/>:f.rating===5?<ThumbsUp className="h-4 w-4 text-[var(--success)]"/>:<ThumbsDown className="h-4 w-4 text-[var(--warning)]"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-[500]">{f.title}</p>
                    <Badge className="text-[10px]" variant={f.type==='ai_error'?'destructive':f.rating===5?'success':'warning'}>{f.type==='ai_error'?'Erro':f.rating===5?'Positivo':'Negativo'}</Badge>
                    <Badge className="text-[10px]" variant="outline">{f.status}</Badge>
                  </div>

                  {d.aiMsg&&(
                    <div className="mt-2 p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                      <div className="flex items-center gap-1.5 mb-1"><MessageSquare className="h-3 w-3 text-[var(--accent)]"/><span className="text-[10px] font-[500] text-[var(--accent)]">Resposta da IA</span></div>
                      <p className="text-[11px] text-[var(--text-3)] whitespace-pre-wrap line-clamp-3">{d.aiMsg}</p>
                    </div>
                  )}

                  {d.feedback&&(
                    <div className="mt-1.5 p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                      <p className="text-[11px] text-[var(--text-2)]">{d.feedback}</p>
                    </div>
                  )}

                  {d.screenshot==='Sim'&&<Badge className="text-[9px] mt-1" variant="info">Print anexado</Badge>}
                  {d.conversation==='Sim'&&<Badge className="text-[9px] mt-1 ml-1" variant="info">Conversa completa</Badge>}

                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-[var(--text-3)]">{f.user?.name} ({f.user?.email})</span>
                    <span className="text-[10px] text-[var(--text-3)]">{new Date(f.createdAt).toLocaleString('pt-BR')}</span>
                    {d.aiMsg&&(
                      <button onClick={()=>setExpanded(isOpen?null:f.id)} className="flex items-center gap-1 text-[10px] text-[var(--accent)] hover:underline">
                        <Eye className="h-3 w-3"/>{isOpen?'Recolher':'Simular chat'}
                        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen?'rotate-180':''}`}/>
                      </button>
                    )}
                  </div>

                  {isOpen&&d.aiMsg&&(
                    <div className="mt-3 border-t border-[var(--border)] pt-3 space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
                      <p className="text-[10px] font-[500] text-[var(--text-3)] uppercase tracking-wider">Simulacao do chat do cliente</p>
                      <div className="flex justify-end"><div className="rounded-2xl rounded-tr-sm px-3 py-2 bg-[var(--accent-subtle)] border border-[var(--accent)]/20 max-w-[80%]"><p className="text-[11px] text-[var(--text)]">{d.user||'Cliente'}</p></div></div>
                      <div className="flex justify-start"><div className="rounded-2xl rounded-tl-sm px-3 py-2 bg-[var(--surface-2)] border border-[var(--border)] max-w-[80%]"><p className="text-[11px] text-[var(--text-2)] whitespace-pre-wrap">{d.aiMsg}</p></div></div>
                      {d.feedback&&(<div className="flex justify-start"><div className="text-[10px] text-[var(--text-3)] italic px-2">"{d.feedback}"</div></div>)}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )})}
      </div>
    </div>
  )
}
