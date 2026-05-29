'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useUIStore } from '@/stores/app-store'
import { IconNotification, IconClose, IconMenu, IconProject } from '@/components/icons'
import { FocusModeButton, isFocusActive } from '@/components/ui/focus-mode'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Users, Eye, BarChart3, TrendingUp, Code2 } from 'lucide-react'

interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  createdAt: string
  metadata?: any
}

interface UsuarioOnline {
  id: string
  name: string
  image?: string
  role: string
  currentPage?: string
  lastSeen?: string
}

interface MetricasPainel {
  onlineAgora: number
  unicosHoje: number
  acessosHoje: number
  totalHistorico: number
  maxSimultaneo: number
}

function ContagemAnimada({ valor, duracao = 600 }: { valor: number; duracao?: number }) {
  const [exibido, setExibido] = useState(0)
  const valorRef = useRef(valor)

  useEffect(() => {
    valorRef.current = valor
    let inicio: number | null = null
    const doInicio = exibido

    const animar = (timestamp: number) => {
      if (!inicio) inicio = timestamp
      const progresso = Math.min((timestamp - inicio) / duracao, 1)
      const facilidade = 1 - Math.pow(1 - progresso, 3)
      setExibido(Math.round(doInicio + (valor - doInicio) * facilidade))
      if (progresso < 1) {
        requestAnimationFrame(animar)
      }
    }
    requestAnimationFrame(animar)
  }, [valor, duracao, exibido])

  return <span>{exibido.toLocaleString('pt-BR')}</span>
}

function MiniProgresso({ valor, maximo, cor }: { valor: number; maximo: number; cor: string }) {
  const pct = maximo > 0 ? Math.min((valor / maximo) * 100, 100) : 0
  return (
    <div className="h-1.5 w-full rounded-full bg-[var(--surface-3)] overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: cor }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  )
}

function MiniCartaoMetrica({
  rotulo,
  valor,
  icone: Icone,
  cor,
}: {
  rotulo: string
  valor: number
  icone: any
  cor: string
}) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
      <div className="flex items-center gap-1.5">
        <Icone className="h-3 w-3" style={{ color: cor }} />
        <span className="text-[10px] text-[var(--text-3)] uppercase font-[500]">{rotulo}</span>
      </div>
      <span className="text-[18px] font-[600] font-numeric text-[var(--text)]">
        <ContagemAnimada valor={valor} />
      </span>
    </div>
  )
}

export function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  const { setMobileMenuOpen } = useUIStore()
  const [unreadItems, setUnreadItems] = useState<NotificationItem[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [carouselIdx, setCarouselIdx] = useState(0)
  const [activeProject, setActiveProject] = useState<any>(null)
  const [badgeKey, setBadgeKey] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const metricasRef = useRef<HTMLDivElement>(null)
  const prevIdsRef = useRef<Set<string>>(new Set())
  const prevCountRef = useRef(0)
  const [seenIds, setSeenIds] = useState<Set<string>>(() => {
    try {
      const stored = sessionStorage.getItem('anderflow_seen_notifications')
      return new Set(stored ? JSON.parse(stored) : [])
    } catch { return new Set() }
  })

  const [metricas, setMetricas] = useState<MetricasPainel>({
    onlineAgora: 0,
    unicosHoje: 0,
    acessosHoje: 0,
    totalHistorico: 0,
    maxSimultaneo: 0,
  })
  const [usuariosOnline, setUsuariosOnline] = useState<UsuarioOnline[]>([])
  const [rotacaoIdx, setRotacaoIdx] = useState(0)
  const [entradaRecente, setEntradaRecente] = useState<string | null>(null)
  const [painelAberto, setPainelAberto] = useState(false)
  const onlineAnteriorRef = useRef(0)
  const entradaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const roleLevel = (session?.user as any)?.roleLevel || 0
  const isClient = roleLevel < 40
  const isModOrAbove = roleLevel >= 60

  useEffect(() => {
    if (isClient) {
      fetch('/api/projects?status=IN_PROGRESS')
        .then(r => r.json())
        .then(json => {
          const first = (json.data || [])[0]
          if (first) setActiveProject(first)
        })
        .catch(() => {})
    }
  }, [isClient])

  useEffect(() => {
    if (!isModOrAbove) return
    const buscarMetricas = () => {
      fetch('/api/analytics/online')
        .then(r => r.json())
        .then(d => {
          const novoOnline = d.onlineNow || 0
          if (novoOnline > onlineAnteriorRef.current && onlineAnteriorRef.current > 0) {
            if (entradaTimerRef.current) clearTimeout(entradaTimerRef.current)
            setEntradaRecente('Membro acabou de entrar')
            entradaTimerRef.current = setTimeout(() => setEntradaRecente(null), 4000)
          }
          onlineAnteriorRef.current = novoOnline
          setMetricas({
            onlineAgora: novoOnline,
            unicosHoje: d.totalVisitsToday || 0,
            acessosHoje: d.totalVisitsHour || 0,
            totalHistorico: d.totalHistorico || 0,
            maxSimultaneo: d.maxSimultaneous || novoOnline,
          })
        })
        .catch(() => {})
    }
    const buscarUsuarios = () => {
      fetch('/api/analytics/online-users')
        .then(r => r.json())
        .then(d => setUsuariosOnline((d.data || []).filter((u: UsuarioOnline) => u.role === 'CLIENT')))
        .catch(() => {})
    }
    buscarMetricas()
    buscarUsuarios()
    const interval = setInterval(buscarMetricas, 30000)
    const intervalUsuarios = setInterval(buscarUsuarios, 30000)
    return () => { clearInterval(interval); clearInterval(intervalUsuarios) }
  }, [isModOrAbove])

  useEffect(() => {
    if (entradaRecente) return
    if (!isModOrAbove) return
    const timer = setInterval(() => {
      setRotacaoIdx(prev => (prev + 1) % 4)
    }, 5000)
    return () => clearInterval(timer)
  }, [entradaRecente, isModOrAbove])

  useEffect(() => {
    const fechar = (e: MouseEvent) => {
      if (metricasRef.current && !metricasRef.current.contains(e.target as Node)) {
        setPainelAberto(false)
      }
    }
    if (painelAberto) document.addEventListener('click', fechar)
    return () => document.removeEventListener('click', fechar)
  }, [painelAberto])

  const rotativos = [
    `${metricas.onlineAgora} online agora`,
    `${metricas.unicosHoje} unicos hoje`,
    `${metricas.acessosHoje} acessos hoje`,
    `${metricas.totalHistorico} desde o inicio`,
  ]

  const pctOnline = metricas.totalHistorico > 0
    ? Math.round((metricas.onlineAgora / metricas.totalHistorico) * 100)
    : 0

  const iniciais = (nome: string) =>
    nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  useEffect(() => {
    const fetchNotifications = () => {
      if (!session?.user?.id) return
      fetch('/api/notifications?unread=true')
        .then(r => r.json())
        .then(json => {
          const items: any[] = json.data || []
          const parsed: NotificationItem[] = items.map((n: any) => {
            let meta: any = null
            try { if (n.metadata) meta = typeof n.metadata === 'string' ? JSON.parse(n.metadata) : n.metadata } catch {}
            return { id: n.id, title: n.title, message: n.message, type: n.type, createdAt: n.createdAt, metadata: meta }
          })

          const currentIds = new Set(parsed.map(p => p.id))
          const prevCount = prevIdsRef.current.size

          if (prevCount > 0) {
            const newItems = parsed.filter(p => !prevIdsRef.current.has(p.id))
            if (!isFocusActive()) {
              newItems.forEach(item => {
                toast.info(item.title, { description: item.message.slice(0, 80) })
              })
            }
          }

          prevIdsRef.current = currentIds

          if (parsed.length !== unreadItems.length) {
            setCarouselIdx(0)
          }
          if (parsed.length !== prevCountRef.current) {
            setBadgeKey(k => k + 1)
            prevCountRef.current = parsed.length
          }
          setUnreadItems(parsed)

          const newIds = items.map(n => n.id)
          const nextIds = new Set(seenIds)
          let changed = false
          newIds.forEach((id: string) => { if (!nextIds.has(id)) { nextIds.add(id); changed = true } })
          if (changed) {
            setSeenIds(nextIds)
            try { sessionStorage.setItem('anderflow_seen_notifications', JSON.stringify(Array.from(nextIds))) } catch {}
          }
        })
        .catch(() => {})
    }
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 10000)
    return () => clearInterval(interval)
  }, [session?.user?.id, seenIds, unreadItems.length])

  useEffect(() => {
    if (unreadItems.length === 0) return
    const timer = setInterval(() => {
      setCarouselIdx(prev => (prev + 1) % unreadItems.length)
    }, 60000)
    return () => clearInterval(timer)
  }, [unreadItems.length])

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [dropdownOpen])

  const dismissOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setUnreadItems(prev => prev.filter(n => n.id !== id))
    fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    }).catch(() => {})
  }

  const getNotifLink = (n: NotificationItem) => {
    if (n.metadata?.projectId) return `/projects/${n.metadata.projectId}`
    if (n.type === 'MESSAGE') return '/clients'
    if (n.type === 'CONTRACT') return '/contracts'
    return '/notifications'
  }

  const currentNotification = unreadItems[carouselIdx] || null

  return (
    <header
      className="sticky top-0 z-30 h-[48px] flex items-center justify-between px-3 lg:px-4 shrink-0"
      style={{
        background: 'rgba(10,10,15,0.5)',
        backdropFilter: 'blur(16px) saturate(200%)',
        WebkitBackdropFilter: 'blur(16px) saturate(200%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden flex items-center justify-center h-7 w-7 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-2)] hover:text-[var(--text)] transition-colors"
          aria-label="Abrir menu"
        >
          <IconMenu className="w-[16px] h-[16px]" />
        </button>

        {isClient && activeProject && (
          <div
            className="hidden md:flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer animate-fade-in"
            onClick={() => router.push(`/projects/${activeProject.id}`)}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-[var(--accent-subtle)] shrink-0">
                <IconProject className="w-3 h-3 text-[var(--accent)]" />
              </div>
              <span className="text-[12px] text-[var(--text)] truncate font-[500]">
                {activeProject.name}
              </span>
            </div>
            <span className="text-[12px] text-[var(--accent)] font-[500] shrink-0">
              {activeProject.progress || 0}%
            </span>
            <div className="h-1.5 w-20 rounded-full bg-[var(--surface-3)] overflow-hidden shrink-0 relative">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all duration-700"
                style={{ width: `${activeProject.progress || 0}%` }}
              />
              <div
                className="absolute inset-0 w-full h-full opacity-30"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                  animation: 'shimmer 2s ease-in-out infinite',
                  transform: 'translateX(-100%)',
                }}
              />
            </div>
            <span className="flex items-center gap-1 text-[10px] text-[var(--success)] shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] animate-pulse" />
              Em andamento
            </span>
          </div>
        )}

        {!isClient && currentNotification && (
          <div className="hidden md:flex items-center gap-2 min-w-0 flex-1 animate-fade-in"
            onClick={() => router.push(getNotifLink(currentNotification))}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shrink-0" />
            <span className="text-[12px] text-[var(--text-2)] truncate cursor-pointer hover:text-[var(--text)]">
              {currentNotification.title}
            </span>
            <span className="text-[11px] text-[var(--text-3)] truncate hidden lg:inline">
              — {currentNotification.message}
            </span>
            <span className="text-[10px] text-[var(--text-3)] shrink-0">
              {carouselIdx + 1}/{unreadItems.length}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0" ref={dropdownRef}>
        <div className="relative" ref={metricasRef}>
          {isModOrAbove && (
            <button
              onClick={(e) => { e.stopPropagation(); setPainelAberto(!painelAberto) }}
              className={cn(
                'hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition-all duration-200 mr-1',
                entradaRecente
                  ? 'text-[var(--success)] bg-[var(--success-subtle)]/50'
                  : 'text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--surface-hover)]'
              )}
            >
              {entradaRecente ? (
                <>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--success)]" />
                  </span>
                  {entradaRecente}
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
                  {rotativos[rotacaoIdx]}
                </>
              )}
            </button>
          )}

          <AnimatePresence>
            {painelAberto && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-2 w-[340px] bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-[var(--accent)]" />
                    <span className="text-[13px] font-[500] text-[var(--text)]">Metricas em tempo real</span>
                  </div>
                  <button
                    onClick={() => setPainelAberto(false)}
                    className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
                    aria-label="Fechar painel"
                  >
                    <IconClose className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="px-4 py-3 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--success)]" />
                        </span>
                        <span className="text-[13px] font-[500] text-[var(--text)]">
                          <ContagemAnimada valor={metricas.onlineAgora} /> online agora
                        </span>
                      </div>
                      <span className="text-[12px] font-numeric text-[var(--text-2)]">
                        {pctOnline}% ativos
                      </span>
                    </div>
                    <MiniProgresso valor={metricas.onlineAgora} maximo={metricas.totalHistorico} cor="var(--success)" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <MiniCartaoMetrica rotulo="Online agora" valor={metricas.onlineAgora} icone={Activity} cor="var(--success)" />
                    <MiniCartaoMetrica rotulo="Unicos hoje" valor={metricas.unicosHoje} icone={Users} cor="#3b82f6" />
                    <MiniCartaoMetrica rotulo="Acessos hoje" valor={metricas.acessosHoje} icone={Eye} cor="var(--accent)" />
                    <MiniCartaoMetrica rotulo="Total historico" valor={metricas.totalHistorico} icone={TrendingUp} cor="var(--text-3)" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3 w-3 text-[var(--text-3)]" />
                      <span className="text-[10px] text-[var(--text-3)] uppercase font-[500]">
                        Usuarios online ({usuariosOnline.length})
                      </span>
                    </div>

                    {usuariosOnline.length === 0 ? (
                      <p className="text-[11px] text-[var(--text-3)] text-center py-2">
                        Nenhum cliente online no momento
                      </p>
                    ) : (
                      <div className="space-y-1 max-h-[160px] overflow-y-auto scrollbar-thin">
                        {usuariosOnline.map((u, i) => (
                          <motion.div
                            key={u.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
                          >
                            <div className="relative">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="text-[10px] bg-[var(--surface-3)]">
                                  {iniciais(u.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[var(--success)] border-2 border-[var(--surface)]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] text-[var(--text)] truncate">{u.name}</p>
                              {u.currentPage && (
                                <p className="text-[10px] text-[var(--text-3)] truncate">{u.currentPage}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {[...Array(3)].map((_, i) => (
                                <motion.span
                                  key={i}
                                  className="h-1 w-1 rounded-full bg-[var(--success)]"
                                  animate={{ opacity: [0.3, 1, 0.3] }}
                                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                                />
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-[var(--border)]">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-[var(--text-3)]">Pico simultaneo</span>
                        <span className="text-[12px] font-[600] font-numeric text-[var(--accent)]">
                          <ContagemAnimada valor={metricas.maxSimultaneo} />
                        </span>
                      </div>
                    </div>
                    <Link
                      href="/analytics"
                      className="text-[11px] text-[var(--accent)] hover:underline"
                      onClick={() => setPainelAberto(false)}
                    >
                      Ver analytics
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => router.push('/ide')}
          className="flex items-center justify-center h-7 w-9 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-2)] hover:text-[var(--text)] transition-colors"
          title="Abrir IDE"
        >
          <Code2 className="w-[16px] h-[16px]" />
        </button>

        <FocusModeButton />

        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="relative flex items-center justify-center h-7 w-9 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-2)] hover:text-[var(--text)] transition-colors"
        >
          <IconNotification className="w-[16px] h-[16px]" />
          {unreadItems.length > 0 && (
            <span
              key={badgeKey}
              className="badge-pulse absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 font-numeric"
            >
              {unreadItems.length > 99 ? '99+' : unreadItems.length}
            </span>
          )}
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-[380px] max-w-[calc(100vw-16px)] bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in"
            style={{ position: 'fixed', top: '48px', right: '1rem' }}
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)]">
              <span className="text-[13px] font-[500] text-[var(--text)]">Notificacoes</span>
              <Link
                href="/notifications"
                onClick={() => setDropdownOpen(false)}
                className="text-[12px] text-[var(--accent)] hover:opacity-80 transition-opacity"
              >
                Ver todas
              </Link>
            </div>
            <div className="max-h-[350px] overflow-y-auto">
              {unreadItems.length === 0 && (
                <p className="p-6 text-center text-[12px] text-[var(--text-3)]">
                  Nenhuma notificacao nova
                </p>
              )}
              {unreadItems.slice(0, 10).map(n => (
                <div
                  key={n.id}
                  onClick={() => {
                    setDropdownOpen(false)
                    router.push(getNotifLink(n))
                  }}
                  className="flex items-start gap-3 px-4 py-2.5 hover:bg-[var(--surface-hover)] cursor-pointer transition-colors group"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-[500] text-[var(--text)] truncate">{n.title}</p>
                    <p className="text-[11px] text-[var(--text-3)] mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                  <button
                    onClick={(e) => dismissOne(n.id, e)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 flex items-center justify-center h-5 w-5 rounded text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-all"
                    aria-label="Dispensar notificacao"
                  >
                    <IconClose className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
