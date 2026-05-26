'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ArrowRight, ArrowUp, MessageCircle, Sparkles, Phone, Mail, Instagram, UserRoundPlus, LogIn, Bot } from 'lucide-react'
import MotorEspacial from '@/components/landing/motor-espacial'
import PainelAuth from '@/components/landing/auth-unificado'

const AIFab = dynamic(() => import('@/components/ui/ai-fab').then(m => ({ default: m.AIFab })), { ssr: false, loading: () => null })

/* ─── Wavy Divider SVG ─── */

function WaveDivider({ inverted = false }: { inverted?: boolean }) {
  return (
    <div className={`landing-wave${inverted ? ' landing-wave-inverted' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 1440 180" preserveAspectRatio="none">
        <path fill="rgba(255,255,255,0.04)">
          <animate attributeName="d" dur="18s" repeatCount="indefinite" values="M0,60 C120,35 240,90 360,55 C480,20 600,80 720,50 C840,20 960,75 1080,48 C1200,21 1320,72 1440,55 L1440,145 C1350,115 1230,65 1110,100 C990,135 870,75 750,120 C630,165 510,85 390,130 C270,175 150,95 30,130 C0,148 0,148 0,148 Z;M0,70 C120,95 240,35 360,65 C480,90 600,38 720,58 C840,78 960,35 1080,55 C1200,75 1320,40 1440,50 L1440,138 C1350,105 1230,60 1110,95 C990,130 870,70 750,115 C630,160 510,80 390,125 C270,170 150,90 30,125 C0,142 0,142 0,142 Z;M0,52 C120,28 240,85 360,48 C480,18 600,75 720,55 C840,32 960,70 1080,42 C1200,18 1320,68 1440,60 L1440,150 C1350,120 1230,68 1110,105 C990,140 870,78 750,122 C630,168 510,88 390,132 C270,178 150,98 30,132 C0,150 0,150 0,150 Z;M0,60 C120,35 240,90 360,55 C480,20 600,80 720,50 C840,20 960,75 1080,48 C1200,21 1320,72 1440,55 L1440,145 C1350,115 1230,65 1110,100 C990,135 870,75 750,120 C630,165 510,85 390,130 C270,175 150,95 30,130 C0,148 0,148 0,148 Z" />
        </path>
        <path fill="rgba(255,255,255,0.02)">
          <animate attributeName="d" dur="24s" repeatCount="indefinite" values="M0,65 C130,40 250,85 370,52 C490,22 610,78 730,55 C850,32 970,74 1090,52 C1210,30 1330,72 1440,58 L1440,135 C1340,105 1220,62 1100,95 C980,128 860,68 740,112 C620,156 500,80 380,122 C260,164 140,88 20,122 C0,140 0,140 0,140 Z;M0,55 C130,80 250,32 370,60 C490,85 610,38 730,55 C850,72 970,35 1090,55 C1210,75 1330,40 1440,48 L1440,142 C1340,112 1220,66 1100,98 C980,130 860,72 740,115 C620,158 500,82 380,118 C260,154 140,84 20,118 C0,136 0,136 0,136 Z;M0,72 C130,35 250,90 370,48 C490,15 610,82 730,58 C850,35 970,76 1090,48 C1210,24 1330,68 1440,62 L1440,128 C1340,98 1220,58 1100,90 C980,122 860,62 740,106 C620,150 500,76 380,116 C260,156 140,82 20,116 C0,132 0,132 0,132 Z;M0,65 C130,40 250,85 370,52 C490,22 610,78 730,55 C850,32 970,74 1090,52 C1210,30 1330,72 1440,58 L1440,135 C1340,105 1220,62 1100,95 C980,128 860,68 740,112 C620,156 500,80 380,122 C260,164 140,88 20,122 C0,140 0,140 0,140 Z" />
        </path>
      </svg>
    </div>
  )
}

/* ─── SVG Icon Components ─── */

function IconChart() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 48 48" fill="none">
      <rect x="6" y="28" width="8" height="14" rx="2" fill="currentColor" opacity="0.6" />
      <rect x="18" y="16" width="8" height="26" rx="2" fill="currentColor" opacity="0.8" />
      <rect x="30" y="22" width="8" height="20" rx="2" fill="currentColor" opacity="0.5" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 48 48" fill="none">
      <circle cx="16" cy="14" r="7" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <circle cx="32" cy="14" r="5" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <path d="M4 40c0-6 5-10 12-10s12 4 12 10" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M22 40c0-5 4-8 10-8s10 3 10 8" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function IconShield() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 48 48" fill="none">
      <path d="M24 4L6 12v12c0 12 8 18 18 22 10-4 18-10 18-22V12L24 4z" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <path d="M16 24l5 5 11-11" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconPerson() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="16" r="10" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <path d="M8 42c0-8 7-14 16-14s16 6 16 14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function IconGrid() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 48 48" fill="none">
      <rect x="8" y="4" width="32" height="40" rx="3" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <rect x="14" y="10" width="8" height="8" rx="1" fill="currentColor" opacity="0.5" />
      <rect x="26" y="10" width="8" height="8" rx="1" fill="currentColor" opacity="0.5" />
      <rect x="14" y="22" width="8" height="8" rx="1" fill="currentColor" opacity="0.5" />
      <rect x="26" y="22" width="8" height="8" rx="1" fill="currentColor" opacity="0.5" />
      <rect x="18" y="34" width="12" height="4" rx="1" fill="currentColor" opacity="0.3" />
    </svg>
  )
}

function IconDevices() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 48 48" fill="none">
      <rect x="4" y="6" width="28" height="34" rx="4" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <rect x="9" y="12" width="18" height="18" rx="1" fill="currentColor" opacity="0.3" />
      <rect x="36" y="14" width="8" height="20" rx="3" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <path d="M40 40h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/* ─── Main Landing Component ─── */

type ModoAuth = 'login' | 'register'

export default function LandingClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  // ── Estados ──
  const [scrollY, setScrollY] = useState(0)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<ModoAuth>('login')
  const [modoObservar, setModoObservar] = useState(false)
  const acionarFabRef = useRef(false)

  // ── Scroll ──
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const opacidadeHeader = Math.max(0, 1 - scrollY / 180)
  const barraLateralVisivel = scrollY > 150

  const acionarMetris = () => { acionarFabRef.current = true }

  useEffect(() => {
    if (!acionarFabRef.current) return
    const tentarClicar = () => {
      const btn = document.querySelector('[title="Assistente IA"]') as HTMLButtonElement | null
      if (btn) { btn.click(); acionarFabRef.current = false; return true }
      return false
    }
    if (tentarClicar()) return
    const t = setInterval(() => { if (tentarClicar()) clearInterval(t) }, 300)
    const timeout = setTimeout(() => { clearInterval(t); acionarFabRef.current = false }, 5000)
    return () => { clearInterval(t); clearTimeout(timeout) }
  }, [acionarFabRef.current])

  // ── Intersection Observer ──
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // ── URL mode ──
  useEffect(() => {
    const mode = searchParams.get('mode')
    if (mode === 'login' || mode === 'register') {
      setAuthMode(mode)
      setAuthOpen(true)
    }
  }, [searchParams])

  // ── Session redirect ──
  useEffect(() => {
    if (session && !authOpen) router.replace('/dashboard')
  }, [session, router, authOpen])

  // ── Body overflow ──
  useEffect(() => {
    document.body.style.overflow = authOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [authOpen])

  // ── Handlers ──
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
  const openAuth = (mode: ModoAuth) => { setAuthMode(mode); setAuthOpen(true) }
  const closeAuth = () => setAuthOpen(false)
  const switchAuthMode = (mode: ModoAuth) => setAuthMode(mode)

  return (
    <div className="relative min-h-screen overflow-x-hidden landing-bg">
      {/* Fundo Cosmico */}
      <MotorEspacial modoObservar={modoObservar} />

      {/* ─── HEADER GLASS ─── */}
      <header
        className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
        style={{
          opacity: opacidadeHeader,
          pointerEvents: opacidadeHeader < 0.05 ? 'none' : 'auto',
          height: '56px',
          background: 'rgba(10, 10, 15, 0.5)',
          backdropFilter: 'blur(18px) saturate(160%)',
          WebkitBackdropFilter: 'blur(18px) saturate(160%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 2px 32px rgba(0,0,0,0.35)',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.012) 50%, transparent 100%)',
          }}
        />
        <div className="relative h-full max-w-screen-xl mx-auto px-6 flex items-center justify-between">
          <a className="landing-logo" href="/">ANDERFLOW</a>
          <div className="landing-header-actions">
            <a href="https://wa.me/5577999512937" target="_blank" rel="noopener noreferrer" className="landing-btn-ghost">
              <MessageCircle className="h-4 w-4" /> Contato
            </a>
            <button
              onClick={() => openAuth('login')}
              className="landing-btn-ghost"
            >
              <Sparkles className="h-4 w-4" /> Pre-cadastro
            </button>
            <button className="landing-btn-ghost" onClick={() => openAuth('login')}>Fazer login</button>
            <button className="landing-btn-primary" onClick={() => openAuth('register')}>
              Criar conta <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── BARRA LATERAL DIREITA (aparece ao scrollar) ─── */}
      <div
        className="fixed right-3 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-2 transition-all duration-500"
        style={{
          opacity: barraLateralVisivel && !modoObservar ? 1 : 0,
          transform: `translateY(-50%) translateX(${barraLateralVisivel && !modoObservar ? 0 : 28}px)`,
          pointerEvents: barraLateralVisivel && !modoObservar ? 'auto' : 'none',
        }}
      >
        <div
          className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-2xl"
          style={{
            background: 'rgba(14, 14, 20, 0.78)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {/* Login */}
          <button
            onClick={() => openAuth('login')}
            className="flex items-center justify-center w-9 h-9 rounded-lg transition-all hover:scale-110"
            title="Fazer login"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <LogIn className="w-4 h-4" style={{ color: '#A8A8A2' }} />
          </button>

          {/* Criar conta */}
          <button
            onClick={() => openAuth('register')}
            className="flex items-center justify-center w-9 h-9 rounded-lg transition-all hover:scale-110"
            title="Criar conta"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <UserRoundPlus className="w-4 h-4" style={{ color: '#A8A8A2' }} />
          </button>

          {/* Pre-cadastro */}
          <button
            onClick={() => openAuth('login')}
            className="flex items-center justify-center w-9 h-9 rounded-lg transition-all hover:scale-110"
            title="Pre-cadastro WhatsApp"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <Sparkles className="w-4 h-4" style={{ color: '#A8A8A2' }} />
          </button>

          <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.08)' }} />

          {/* IA Metrys */}
          <button
            onClick={acionarMetris}
            className="flex items-center justify-center w-9 h-9 rounded-lg transition-all hover:scale-110"
            title="Falar com a Metrys"
            style={{ background: 'rgba(232,98,42,0.1)', border: '1px solid rgba(232,98,42,0.25)' }}
          >
            <Bot className="w-4 h-4" style={{ color: '#E8622A' }} />
          </button>

          <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.08)' }} />

          {/* Voltar ao topo */}
          <button
            onClick={scrollToTop}
            className="flex items-center justify-center w-9 h-9 rounded-lg transition-all hover:scale-110"
            title="Voltar ao topo"
            style={{ background: 'rgba(232, 98, 42, 0.12)', border: '1px solid rgba(232, 98, 42, 0.25)' }}
          >
            <ArrowUp className="w-4 h-4" style={{ color: '#E8622A' }} />
          </button>
        </div>
      </div>

      {/* ─── BOTAO OBSERVAR (canto inferior esquerdo) ─── */}
      <button
        onClick={() => setModoObservar(v => !v)}
        className="fixed left-4 bottom-6 z-40 flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-[500] transition-all duration-300"
        style={{
          background: modoObservar ? 'rgba(232, 98, 42, 0.15)' : 'rgba(14, 14, 20, 0.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: modoObservar ? '1px solid rgba(232, 98, 42, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
          color: modoObservar ? '#E8622A' : '#A8A8A2',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}
        title={modoObservar ? 'Sair do modo Observar' : 'Modo Observar — ver apenas o cosmos'}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="3" fill={modoObservar ? '#E8622A' : '#A8A8A2'}/>
          <ellipse cx="7" cy="7" rx="6" ry="2" stroke={modoObservar ? '#E8622A' : '#A8A8A2'} strokeWidth="0.8" fill="none" opacity="0.6"/>
          <circle cx="7" cy="7" r="1.5" fill={modoObservar ? '#E8622A' : '#5C5C58'}/>
        </svg>
        {modoObservar ? 'Sair' : 'Observar'}
      </button>

      {/* ─── LANDING CONTENT (oculto no modo Observar) ─── */}
      <div
        className="transition-opacity duration-500"
        style={{ opacity: modoObservar ? 0 : 1, pointerEvents: modoObservar ? 'none' : 'auto' }}
      >
        {/* ─── HERO ─── */}
        <section className="landing-hero">
          <h1 className="landing-hero-title">Organize sua empresa<br />com inteligencia</h1>
          <p className="landing-hero-subtitle">
            Gerencie <strong>projetos, clientes, contratos e financas</strong> em um so lugar.
            Chega de planilhas e prazos perdidos.
          </p>
          <div className="landing-hero-actions">
            <button className="landing-btn-cta" onClick={() => openAuth('register')}>
              Experimente gratis <ArrowRight className="h-5 w-5" />
            </button>
            <button className="landing-btn-secondary" onClick={() => openAuth('login')}>Ja tenho conta</button>
          </div>
          <div className="landing-scroll-indicator">
            <span className="landing-scroll-label">Desca para conhecer</span>
            <div className="landing-scroll-mouse"><div className="landing-scroll-dot" /></div>
          </div>
        </section>

        <WaveDivider />

        {/* ─── FEATURES ─── */}
        <section className="landing-section">
          <div className="landing-section-header reveal">
            <h2 className="landing-section-title">Tudo que sua empresa precisa</h2>
            <p className="landing-section-subtitle">Painel intuitivo que qualquer pessoa usa sem treinamento.</p>
          </div>
          <div className="landing-grid-3">
            {[
              { icon: <IconChart />, title: 'Painel intuitivo', desc: 'Visualize projetos, prazos e pendencias em uma tela. Arraste e acompanhe em tempo real.' },
              { icon: <IconPerson />, title: 'Portal do cliente', desc: 'Cada cliente acessa seu portal para aprovar etapas, assinar e acompanhar entregas.' },
              { icon: <IconGrid />, title: 'Financeiro simples', desc: 'Faturas, pagamentos e fluxo de caixa em um painel. Saiba o que esta pendente.' },
              { icon: <IconUsers />, title: 'Automatizacoes', desc: 'Notifique clientes, envie lembretes e atualize status com regras inteligentes.' },
              { icon: <IconShield />, title: 'Seguranca de dados', desc: 'Permissoes por usuario, autenticacao em 2 etapas, criptografia e LGPD.' },
              { icon: <IconDevices />, title: 'Acesse de qualquer lugar', desc: 'Computador, tablet ou celular. O layout se adapta onde voce estiver.' },
            ].map((f, i) => (
              <div key={i} className="landing-card reveal-scale" style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="landing-card-icon">{f.icon}</div>
                <h3 className="landing-card-title">{f.title}</h3>
                <p className="landing-card-text">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <WaveDivider inverted />

        {/* ─── FOR WHO ─── */}
        <section className="landing-section">
          <div className="landing-section-header reveal">
            <h2 className="landing-section-title">Feito para pessoas reais</h2>
            <p className="landing-section-subtitle">Seja voce um profissional autonomo, uma agencia, ou uma startup — o ANDERFLOW se adapta. Comece simples, escale quando precisar.</p>
          </div>
          <div className="landing-grid-3">
            {[
              { icon: <IconGrid />, title: 'Agencias e Estudios', desc: 'Gerencie dezenas de clientes simultaneamente. Portal individual, aprovacoes online e visao completa de cada projeto em tempo real.' },
              { icon: <IconPerson />, title: 'Profissionais Autonomos', desc: 'Organize jobs, envie propostas profissionais e receba pagamentos online. Sistema que passa credibilidade.' },
              { icon: <IconUsers />, title: 'Equipes & Startups', desc: 'Colabore em tempo real, atribua tarefas e centralize a comunicacao. Substitua WhatsApp e planilhas por um fluxo que funciona.' },
            ].map((f, i) => (
              <div key={i} className="landing-card-center reveal-scale" style={{ transitionDelay: `${i * 120}ms` }}>
                <div className="landing-card-icon-lg">{f.icon}</div>
                <h3 className="landing-card-title">{f.title}</h3>
                <p className="landing-card-text">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── TOOLS ─── */}
        <section className="landing-section">
          <div className="landing-section-header reveal">
            <h2 className="landing-section-title">Ferramentas que fazem a diferenca</h2>
            <p className="landing-section-subtitle">Cada funcionalidade foi pensada para resolver um problema real do dia a dia.</p>
          </div>
          <div className="landing-tools-list">
            {[
              { icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>, title: 'Kanban de projetos', desc: 'Crie projetos, divida em fases e mova cards entre colunas. Cliente aprova cada etapa pelo portal.' },
              { icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>, title: 'CRM integrado', desc: 'Historico completo do cliente: projetos, contratos, faturas e mensagens — tudo vinculado automaticamente.' },
              { icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>, title: 'Chat por projeto', desc: 'Converse com clientes e equipe dentro da plataforma. Cada conversa vinculada ao projeto certo.' },
              { icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>, title: 'Tickets de suporte', desc: 'Clientes abrem chamados pelo portal. Voce classifica, responde e resolve com historico completo.' },
              { icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" /></svg>, title: 'Base de Conhecimento', desc: 'Artigos e tutoriais para clientes encontrarem respostas sem precisar abrir chamado.' },
              { icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>, title: 'Relatorios inteligentes', desc: 'Projetos entregues, satisfacao de clientes, faturamento e produtividade da equipe.' },
              { icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>, title: 'Pagina de Status', desc: 'Clientes acompanham disponibilidade do sistema, manutencoes e historico de incidentes.' },
            ].map((item, i) => (
              <div key={i} className="landing-tool-item reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="landing-tool-icon">{item.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 className="landing-tool-title">{item.title}</h3>
                  <p className="landing-tool-text">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="landing-cta">
          <div className="landing-cta-inner reveal-scale">
            <h2 className="landing-cta-title">Sua empresa organizada comeca hoje</h2>
            <p className="landing-cta-subtitle">Crie sua conta gratuita em 30 segundos. Sem cartao de credito, sem instalacao, sem burocracia.</p>
            <div style={{ marginTop: '2rem' }}>
              <button className="landing-btn-cta" onClick={() => openAuth('register')}>
                Comecar agora <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="landing-footer">
          <div className="landing-footer-inner">
            <div className="landing-footer-grid">
              <div>
                <h3 className="landing-footer-brand">ANDERFLOW</h3>
                <p className="landing-footer-desc">Fluxo inteligente para empresas modernas.</p>
              </div>
              <div>
                <h4 className="landing-footer-heading">Links</h4>
                <div className="landing-footer-links">
                  <a className="landing-footer-link" href="/termos">Termos de Uso</a>
                  <a className="landing-footer-link" href="/termos">Privacidade</a>
                  <button className="landing-footer-link" onClick={() => openAuth('login')}>Login</button>
                  <button className="landing-footer-link" onClick={() => openAuth('register')}>Criar Conta</button>
                </div>
              </div>
              <div>
                <h4 className="landing-footer-heading">Contato</h4>
                <a href="https://wa.me/5577999512937" target="_blank" rel="noopener noreferrer" className="landing-footer-contact">
                  <div className="landing-footer-contact-icon" style={{ background: '#25D36615', color: '#25D366' }}><Phone className="h-5 w-5" /></div>
                  <div><span className="landing-footer-contact-label">WhatsApp</span><span className="landing-footer-contact-value">(77) 9 9951-2937</span></div>
                </a>
                <a href="mailto:contato@anderflow.com" target="_blank" rel="noopener noreferrer" className="landing-footer-contact">
                  <div className="landing-footer-contact-icon" style={{ background: '#E8622A15', color: '#E8622A' }}><Mail className="h-5 w-5" /></div>
                  <div><span className="landing-footer-contact-label">Email</span><span className="landing-footer-contact-value">contato@anderflow.com</span></div>
                </a>
                <a href="https://instagram.com/honorato_ann" target="_blank" rel="noopener noreferrer" className="landing-footer-contact">
                  <div className="landing-footer-contact-icon" style={{ background: '#E1306C15', color: '#E1306C' }}><Instagram className="h-5 w-5" /></div>
                  <div><span className="landing-footer-contact-label">Instagram</span><span className="landing-footer-contact-value">@honorato_ann</span></div>
                </a>
              </div>
            </div>
            <div className="landing-footer-bottom">
              <p>&copy; 2026 ANDERFLOW Sistemas — Todos os direitos reservados.</p>
              <p>Desenvolvido por <span className="landing-footer-credit">Anderson Honorato</span></p>
            </div>
          </div>
        </footer>
      </div>

      {/* ─── AUTH GLASS CARD ─── */}
      <PainelAuth
        aberto={authOpen}
        modo={authMode}
        aoFechar={closeAuth}
        aoMudarModo={switchAuthMode}
      />

      {/* ─── IA Metrys (AIFab real) ─── */}
      <AIFab />
      <style jsx global>{`
        .landing-bg div:has(> [title="Assistente IA"]) {
          bottom: 1.5rem !important;
        }
      `}</style>
    </div>
  )
}

