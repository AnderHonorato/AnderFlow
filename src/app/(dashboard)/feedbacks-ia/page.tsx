'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ThumbsUp, ThumbsDown, AlertTriangle, ChevronDown, MessageSquare, Eye, Activity, ChevronRight, ExternalLink, X, Loader2, CheckCircle2, XCircle, Clock, Cpu, Coins, Terminal } from 'lucide-react'
import Link from 'next/link'

type ModalType = 'action' | 'prompt' | 'error' | null

export default function FeedbacksIAPage() {
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all'|'ai_feedback'|'ai_error'|'bot'>('all')
  const [expanded, setExpanded] = useState<string|null>(null)
  const [uiFeedbacks, setUiFeedbacks] = useState<any[]>([])
  const [, setUiLoading] = useState(false)
  const [botReports, setBotReports] = useState<any[]>([])

  // Modal state
  const [modal, setModal] = useState<{ type: ModalType; actionId: string | null; botName?: string }>({ type: null, actionId: null })
  const [modalData, setModalData] = useState<any>(null)
  const [modalLoading, setModalLoading] = useState(false)

  useEffect(() => {
    fetch('/api/ai/feedback').then(r=>r.json()).then(j=>{setFeedbacks(j.data||[]);setLoading(false)}).catch(()=>setLoading(false))
    fetch('/api/bots/activity').then(r=>r.json()).then(j=>setBotReports(j.data||[])).catch(()=>{})
    fetch('/api/ui-feedback').then(r=>r.json()).then(j=>{setUiFeedbacks(j.data?.pages||[]);setUiLoading(false)}).catch(()=>setUiLoading(false))
    const iv = setInterval(() => {
      fetch('/api/bots/activity').then(r=>r.json()).then(j=>setBotReports(j.data||[])).catch(()=>{})
    }, 15000)
    return () => clearInterval(iv)
  }, [])

  const openModal = async (type: ModalType, actionId: string | null, botName?: string) => {
    setModal({ type, actionId, botName })
    if (!actionId) { setModalData(null); return }
    setModalLoading(true)
    try {
      const res = await fetch(`/api/bots/actions/${actionId}`)
      const json = await res.json()
      setModalData(json.data || null)
    } catch {
      setModalData(null)
    } finally {
      setModalLoading(false)
    }
  }

  const closeModal = () => {
    setModal({ type: null, actionId: null })
    setModalData(null)
  }

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

  const statusBadge = (s: string) => {
    switch (s) {
      case 'pending': return <Badge className="text-[9px] gap-1" variant="secondary"><Clock className="h-[9px] w-[9px]" /> Aguardando</Badge>
      case 'running': return <Badge className="text-[9px] gap-1" variant="info"><Loader2 className="h-[9px] w-[9px] animate-spin" /> Executando</Badge>
      case 'success': return <Badge className="text-[9px] gap-1" variant="success"><CheckCircle2 className="h-[9px] w-[9px]" /> Sucesso</Badge>
      case 'error': return <Badge className="text-[9px] gap-1" variant="destructive"><XCircle className="h-[9px] w-[9px]" /> Erro</Badge>
      default: return <Badge className="text-[9px]" variant="secondary">{s}</Badge>
    }
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
            <p className="text-[11px] text-[var(--text-3)] mb-3">
              Para ativar e desativar os bots, acesse{' '}
              <Link href="/settings" className="text-[var(--accent)] hover:underline inline-flex items-center gap-0.5">
                Configurações → Bots IA <ExternalLink className="h-[10px] w-[10px]" />
              </Link>
            </p>
            <div className="space-y-3">
              {botReports.map(b=>{
                const actions = b.recentActions || []
                return (
                <div key={b.botId} className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${b.status==='ACTIVE'?'bg-[var(--success)] animate-pulse':'bg-[var(--text-3)]'}`}/>
                    <span className="text-[12px] font-[500] text-[var(--text)]">{b.botName}</span>
                    <Badge variant="outline" className="text-[9px]">{b.role}</Badge>
                    {b.lastActionAt&&<span className="text-[10px] text-[var(--text-3)] ml-auto">{new Date(b.lastActionAt).toLocaleTimeString('pt-BR')}</span>}
                  </div>

                  {actions.length === 0 ? (
                    <p className="text-[11px] text-[var(--text-3)] italic">Nenhuma ação registrada ainda.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {actions.slice(0, 5).map((a: any, i: number) => (
                        <div key={a.id || i} className={`p-2 rounded-md border ${a.status === 'error' ? 'border-[var(--destructive)]/20 bg-[var(--destructive-subtle)]' : a.status === 'pending' || a.status === 'running' ? 'border-[var(--warning)]/20 bg-[var(--warning-subtle)]' : a.status === 'success' ? 'border-[var(--success)]/20 bg-[var(--success-subtle)]' : 'border-[var(--border)] bg-[var(--surface)]'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            {a.status ? statusBadge(a.status) : <ChevronRight className="h-3 w-3 text-[var(--text-3)] shrink-0" />}
                            <span className="text-[11px] text-[var(--text-2)] truncate flex-1">{a.action}</span>
                          </div>

                          {a.result && !a.error && (
                            <p className="text-[10px] text-[var(--text-3)] ml-5 truncate">→ {a.result}</p>
                          )}
                          {a.error && (
                            <p className="text-[10px] text-[var(--destructive)] ml-5 truncate">→ {a.error}</p>
                          )}

                          {/* Botões de ação */}
                          <div className="flex items-center gap-1.5 mt-1.5 ml-5">
                            {a.id ? (
                              <>
                                {!a.status || a.status === 'pending' || a.status === 'running' ? (
                                  <span className="text-[10px] text-[var(--text-3)] italic flex items-center gap-1">
                                    <Loader2 className="h-[9px] w-[9px] animate-spin" />
                                    Aguardando finalização...
                                  </span>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openModal('action', a.id, b.botName)}
                                    className="h-6 text-[10px] gap-1 px-2 hover:bg-[var(--surface-hover)]"
                                  >
                                    <Eye className="h-[9px] w-[9px]" /> Visualizar ação
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openModal('prompt', a.id, b.botName)}
                                  className="h-6 text-[10px] gap-1 px-2 hover:bg-[var(--surface-hover)]"
                                >
                                  <Cpu className="h-[9px] w-[9px]" /> Prompt & Pensamento
                                </Button>
                                {a.status === 'error' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openModal('error', a.id, b.botName)}
                                    className="h-6 text-[10px] gap-1 px-2 text-[var(--destructive)] hover:bg-[var(--destructive-subtle)]"
                                  >
                                    <Terminal className="h-[9px] w-[9px]" /> Logs de erro
                                  </Button>
                                )}
                              </>
                            ) : (
                              a.status ? (
                                <span className="text-[10px] text-[var(--text-3)] italic ml-1">
                                  {a.status === 'pending' ? 'Aguardando finalização...' : a.status === 'running' ? 'Executando...' : ''}
                                </span>
                              ) : null
                            )}
                            {a.tokensUsed && (
                              <span className="text-[9px] text-[var(--text-3)] ml-auto flex items-center gap-0.5">
                                <Coins className="h-[9px] w-[9px]" /> {a.tokensUsed} tokens
                                {a.costEstimate ? ` (~$${a.costEstimate})` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )})}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========== MODAL FLUTUANTE ========== */}
      {modal.type && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={closeModal}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative z-10 w-[90vw] max-w-[700px] max-h-[80vh] bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] shrink-0">
              <div className="flex items-center gap-2">
                {modal.type === 'action' && <Eye className="h-4 w-4 text-[var(--accent)]" />}
                {modal.type === 'prompt' && <Cpu className="h-4 w-4 text-[var(--accent)]" />}
                {modal.type === 'error' && <Terminal className="h-4 w-4 text-[var(--destructive)]" />}
                <h3 className="text-[13px] font-[500]">
                  {modal.type === 'action' && 'Detalhes da Ação'}
                  {modal.type === 'prompt' && 'Prompt, Pensamento & Execução'}
                  {modal.type === 'error' && 'Logs de Erro do Processo'}
                </h3>
                {modal.botName && <Badge variant="outline" className="text-[9px]">{modal.botName}</Badge>}
              </div>
              <button onClick={closeModal} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-[var(--surface-hover)] transition-colors">
                <X className="h-4 w-4 text-[var(--text-3)]" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {modalLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-[var(--text-3)]" />
                </div>
              ) : !modalData ? (
                <p className="text-[12px] text-[var(--text-3)] text-center py-12">Dados não disponíveis para esta ação.</p>
              ) : (
                <>
                  {/* MODAL: Detalhes da Ação */}
                  {modal.type === 'action' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <InfoBox label="Status" value={modalData.status}>
                          {modalData.status === 'success'
                            ? <Badge variant="success" className="text-[9px]"><CheckCircle2 className="h-[9px] w-[9px]" /> Sucesso</Badge>
                            : modalData.status === 'error'
                            ? <Badge variant="destructive" className="text-[9px]"><XCircle className="h-[9px] w-[9px]" /> Erro</Badge>
                            : <Badge variant="secondary" className="text-[9px]">{modalData.status}</Badge>
                          }
                        </InfoBox>
                        <InfoBox label="Bot" value={modalData.botName} />
                        <InfoBox label="Endpoint" value={`${modalData.method} ${modalData.endpoint}`} />
                        <InfoBox label="Data/Hora" value={modalData.createdAt ? new Date(modalData.createdAt).toLocaleString('pt-BR') : 'N/A'} />
                      </div>

                      <InfoBox label="Ação" value={modalData.action} />

                      {modalData.tokensUsed && (
                        <InfoBox label="Consumo da API">
                          <div className="flex items-center gap-4 text-[11px] text-[var(--text-2)]">
                            <span className="flex items-center gap-1"><Coins className="h-[11px] w-[11px] text-[var(--accent)]" /> {modalData.tokensUsed} tokens</span>
                            {modalData.costEstimate != null && <span>Custo estimado: ~${modalData.costEstimate}</span>}
                          </div>
                        </InfoBox>
                      )}

                      {modalData.result && (
                        <CodeBlock label="Resultado" content={modalData.result} variant="success" />
                      )}

                      {modalData.error && (
                        <CodeBlock label="Erro" content={modalData.error} variant="error" />
                      )}

                      {modalData.requestBody && (
                        <CodeBlock label="Corpo da Requisição" content={JSON.stringify(modalData.requestBody, null, 2)} />
                      )}
                    </>
                  )}

                  {/* MODAL: Prompt & Pensamento */}
                  {modal.type === 'prompt' && (
                    <>
                      <div className="flex items-center gap-2 text-[11px] text-[var(--text-3)] mb-1">
                        <span>Tokens: {modalData.tokensUsed || 'N/A'}</span>
                        {modalData.costEstimate != null && <span>• Custo: ~${modalData.costEstimate}</span>}
                        <span>• Status: {modalData.status}</span>
                      </div>

                      {modalData.prompt && (
                        <CodeBlock label="📤 Prompt Enviado para IA" content={modalData.prompt} maxHeight="300px" />
                      )}

                      {modalData.aiResponse && (
                        <CodeBlock label="🤖 Resposta / Pensamento da IA" content={modalData.aiResponse} maxHeight="300px" />
                      )}

                      {modalData.action && (
                        <InfoBox label="Ação Decidida" value={modalData.action} />
                      )}

                      {modalData.result && (
                        <CodeBlock label="📥 Resultado da Execução" content={modalData.result} variant="success" />
                      )}

                      {modalData.error && (
                        <CodeBlock label="Erro na Execução" content={modalData.error} variant="error" />
                      )}
                    </>
                  )}

                  {/* MODAL: Logs de Erro */}
                  {modal.type === 'error' && (
                    <>
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-[var(--destructive)]" />
                        <span className="text-[13px] font-[500] text-[var(--destructive)]">Falha na Execução</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <InfoBox label="Bot" value={modalData.botName} />
                        <InfoBox label="Role" value={modalData.botRole} />
                        <InfoBox label="Endpoint" value={`${modalData.method} ${modalData.endpoint}`} />
                        <InfoBox label="Data" value={modalData.createdAt ? new Date(modalData.createdAt).toLocaleString('pt-BR') : 'N/A'} />
                      </div>

                      <InfoBox label="Ação Tentada" value={modalData.action} />

                      {modalData.error && (
                        <CodeBlock
                          label="Motivo do Erro"
                          content={modalData.error}
                          variant="error"
                          maxHeight="250px"
                        />
                      )}

                      {modalData.requestBody && (
                        <CodeBlock
                          label="Corpo da Requisição (para debug)"
                          content={JSON.stringify(modalData.requestBody, null, 2)}
                          maxHeight="150px"
                        />
                      )}

                      {modalData.prompt && (
                        <details className="text-[11px]">
                          <summary className="cursor-pointer text-[var(--accent)] hover:underline">Ver prompt enviado</summary>
                          <CodeBlock label="Prompt" content={modalData.prompt} maxHeight="200px" />
                        </details>
                      )}

                      <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[11px] text-[var(--text-3)]">
                        <p className="font-[500] text-[var(--text-2)] mb-1">Possíveis causas:</p>
                        <ul className="list-disc pl-4 space-y-0.5">
                          <li>Endpoint pode não existir ou estar incorreto</li>
                          <li>Falta de autenticação (token/API key não configurada)</li>
                          <li>Timeout na requisição (mais de 30 segundos)</li>
                          <li>Erro de validação no servidor</li>
                          <li>Banco de dados indisponível ou conflito de dados</li>
                        </ul>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
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

// ========== HELPER COMPONENTS ==========

function InfoBox({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
      <p className="text-[10px] font-[500] text-[var(--text-3)] uppercase mb-1">{label}</p>
      {children || <p className="text-[12px] text-[var(--text)]">{value || 'N/A'}</p>}
    </div>
  )
}

function CodeBlock({ label, content, variant, maxHeight }: { label: string; content: string; variant?: 'success' | 'error'; maxHeight?: string }) {
  const borderColor = variant === 'error' ? 'border-[var(--destructive)]/20' : variant === 'success' ? 'border-[var(--success)]/20' : 'border-[var(--border)]'
  const bgColor = variant === 'error' ? 'bg-[var(--destructive-subtle)]' : variant === 'success' ? 'bg-[var(--success-subtle)]' : 'bg-[var(--surface-2)]'
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-[500] text-[var(--text-3)] uppercase">{label}</p>
      <div className={`p-3 rounded-lg border ${borderColor} ${bgColor}`} style={{ maxHeight: maxHeight || '200px', overflowY: 'auto' }}>
        <pre className="text-[10px] text-[var(--text-2)] whitespace-pre-wrap break-all font-mono leading-relaxed">{content}</pre>
      </div>
    </div>
  )
}
