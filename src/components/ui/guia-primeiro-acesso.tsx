'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface Passo {
  id: string
  titulo: string
  descricao: string
  icone: string
  destaque?: string
}

const passos: Passo[] = [
  {
    id: 'dashboard',
    titulo: 'Bem-vindo ao AnderFlow',
    descricao: 'Esta e sua central de comando. Aqui voce ve todos os projetos ativos, receita e metricas em tempo real.',
    icone: 'dashboard',
  },
  {
    id: 'sidebar',
    titulo: 'Navegacao lateral',
    descricao: 'Use a barra lateral para acessar Projetos, Clientes, CRM, Financeiro e Analytics.',
    icone: 'sidebar',
  },
  {
    id: 'projetos',
    titulo: 'Gestao de Projetos',
    descricao: 'Crie projetos com briefing detalhado, acompanhe etapas em Kanban e mantenha clientes informados.',
    icone: 'projetos',
  },
  {
    id: 'chat-ia',
    titulo: 'Assistente IA',
    descricao: 'O botao no canto inferior direito abre seu assistente IA. Pergunte qualquer coisa sobre o sistema.',
    icone: 'ia',
  },
  {
    id: 'configuracoes',
    titulo: 'Configure seu espaco',
    descricao: 'Em Configuracoes voce personaliza notificacoes, aparencia, integracoes e muito mais.',
    icone: 'config',
  },
]

const IconeMap: Record<string, string> = {
  dashboard: '\u{1F3E0}',
  sidebar: '\u{1F4CB}',
  projetos: '\u{1F4CA}',
  ia: '\u2728',
  config: '\u2699\uFE0F',
}

export function GuiaPrimeiroAcesso() {
  const { data: session } = useSession()
  const [visivel, setVisivel] = useState(false)
  const [passoAtual, setPassoAtual] = useState(0)
  const [direcao, setDirecao] = useState(1)

  useEffect(() => {
    if (!session?.user?.id) return
    if (localStorage.getItem('anderflow-guia-completo')) return

    const timer = setTimeout(() => setVisivel(true), 1500)
    return () => clearTimeout(timer)
  }, [session?.user?.id])

  const concluir = () => {
    localStorage.setItem('anderflow-guia-completo', new Date().toISOString())
    setVisivel(false)
  }

  const proximo = () => {
    setDirecao(1)
    if (passoAtual < passos.length - 1) {
      setPassoAtual((p) => p + 1)
    } else {
      concluir()
    }
  }

  const pular = () => {
    concluir()
  }

  const progresso = ((passoAtual + 1) / passos.length) * 100

  if (!visivel) return null

  const passo = passos[passoAtual]
  const isUltimo = passoAtual === passos.length - 1

  const variantesSlide = {
    enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 left-6 z-50 w-[320px]"
    >
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.3)] overflow-hidden">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-[500] text-[var(--text-3)]">
              Dica {passoAtual + 1} de {passos.length}
            </span>
            <button
              onClick={pular}
              aria-label="Fechar guia"
              className="flex items-center justify-center h-5 w-5 rounded text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          <Progress value={progresso} className="h-1 mb-4" />

          <AnimatePresence mode="wait" custom={direcao}>
            <motion.div
              key={passo.id}
              custom={direcao}
              variants={variantesSlide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="flex flex-col items-center text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-subtle)] mb-3 text-[28px]">
                {IconeMap[passo.icone] || '\u{1F4A1}'}
              </div>
              <h4 className="text-[14px] font-[600] text-[var(--text)] mb-2">
                {passo.titulo}
              </h4>
              <p className="text-[12px] text-[var(--text-2)] leading-relaxed">
                {passo.descricao}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)] bg-[var(--surface-2)]">
          <Button variant="ghost" size="sm" onClick={pular} className="text-[11px]">
            Pular
          </Button>
          <Button size="sm" onClick={proximo} className="text-[11px] gap-1">
            {isUltimo ? (
              <>Entendido, vamos la! <ArrowRight className="h-3.5 w-3.5" /></>
            ) : (
              <>Proximo <ChevronRight className="h-3.5 w-3.5" /></>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
