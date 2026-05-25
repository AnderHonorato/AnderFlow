'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ThumbsUp, ThumbsDown, AlertTriangle, ChevronDown, MessageSquare, Eye, Activity, ChevronRight } from 'lucide-react'

export default function FeedbacksIAPage() {
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all'|'ai_feedback'|'ai_error'|'bot'>('all')
  const [expanded, setExpanded] = useState<string|null>(null)
  const [uiFeedbacks, setUiFeedbacks] = useState<any[]>([])
  const [, setUiLoading] = useState(false)
  const [botReports, setBotReports] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/ai/feedback').then(r=>r.json()).then(j=>{setFeedbacks(j.data||[]);setLoading(false)}).catch(()=>setLoading(false))
    fetch('/api/bots/activity').then(r=>r.json()).then(j=>setBotReports(j.data||[])).catch(()=>{})
    fetch('/api/ui-feedback').then(r=>r.json()).then(j=>{setUiFeedbacks(j.data?.pages||[]);setUiLoading(false)}).catch(()=>setUiLoading(false))
    const iv = setInterval(() => {
      fetch('/api/bots/activity').then(r=>r.json()).then(j=>setBotReports(j.data||[])).catch(()=>{})
    }, 15000)
    return () => clearInterval(iv)
  }, [])

  const filtered = filter==='all'?feedbacks:filter==='bot'?[]:feedbacks.filter(f=>f.type===filter)

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
          {(['all','ai_feedback','ai_error','bot'] as const).map(f=>(
            <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1 rounded-lg text-[11px] font-[500] transition-colors ${filter===f?'bg-[var(--accent)] text-white':'bg-[var(--surface-2)] text-[var(--text-3)] hover:bg-[var(--surface)]'}`}>
              {f==='all'?'Todos':f==='ai_feedback'?'Feedbacks':f==='ai_error'?'Erros':'Bots'}
            </button>
          ))}
        </div>
      </div>

      {(filter==='all'||filter==='bot')&&botReports.length>0&&(
        <Card className="border-[var(--accent)]/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-[var(--accent)]"/>
              <h3 className="text-[13px] font-[500] text-[var(--text)]">Atividade dos Bots ({botReports.length})</h3>
            </div>
            <div className="space-y-2">
              {botReports.filter(b=>b.recentActions?.length>0).map(b=>(
                <div key={b.botId} className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${b.status==='ACTIVE'?'bg-[var(--success)] animate-pulse':'bg-[var(--text-3)]'}`}/>
                    <span className="text-[12px] font-[500] text-[var(--text)]">{b.botName}</span>
                    <Badge variant="outline" className="text-[9px]">{b.role}</Badge>
                    {b.lastActionAt&&<span className="text-[10px] text-[var(--text-3)] ml-auto">{new Date(b.lastActionAt).toLocaleTimeString('pt-BR')}</span>}
                  </div>
                  <div className="mt-2 space-y-1">
                    {b.recentActions?.slice(0,5).map((a:any,i:number)=>(
                      <div key={i} className="flex items-start gap-2 text-[11px]">
                        <ChevronRight className="h-3 w-3 text-[var(--text-3)] mt-0.5 shrink-0"/>
                        <div className="min-w-0">
                          <span className="text-[var(--text-2)]">{a.action}</span>
                          {a.result&&<span className="text-[var(--text-3)] ml-1.5">→ {a.result}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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

      {uiFeedbacks.length > 0 && (
        <div className="mt-8">
          <h2 className="text-[14px] font-[500] mb-3">Feedback de UI (Páginas)</h2>
          <div className="space-y-2">
            {uiFeedbacks.map((f: any, i: number) => (
              <Card key={i}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-[500]">{f.page}</p>
                    <p className="text-[11px] text-[var(--text-3)]">{f.total} votos &middot; {f.positivePercent}% positivo</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-[var(--success-subtle)] text-[var(--success)]">
                      <ThumbsUp className="h-3 w-3" /> {f.positive}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-[var(--destructive-subtle)] text-[var(--destructive)]">
                      <ThumbsDown className="h-3 w-3" /> {f.negative}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
