'use client'

/**
 * @deprecated Use {@link GuiaPrimeiroAcesso} em guia-primeiro-acesso.tsx.
 * Este componente sera removido em versao futura.
 */

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { X, Lightbulb, ChevronRight } from 'lucide-react'

interface Tip {
  title: string
  items: string[]
}

// Central de dicas para cada página
const tips: Record<string, Tip> = {
  '/dashboard': {
    title: 'Painel de Controle',
    items: [
      'Aqui você vê todos os KPIs em tempo real: projetos ativos, receita, clientes.',
      'Os cards no topo mostram métricas principais do seu negócio.',
      'Use o botão "Novo Projeto" para iniciar um briefing.',
      'A barra lateral dá acesso a todos os módulos do sistema.',
    ],
  },
  '/projects': {
    title: 'Gestão de Projetos',
    items: [
      'Visualize projetos em Kanban (arraste entre colunas) ou Lista.',
      'Clique em qualquer card para ver as etapas detalhadas do projeto.',
      'Cada etapa pode ser: em andamento, pausada ou concluída.',
      'Adicione comentários, imagens e defina prazos por etapa.',
      'Use "Novo Projeto" para criar um briefing completo.',
    ],
  },
  '/clients': {
    title: 'Seus Clientes',
    items: [
      'Lista de todos os clientes cadastrados na plataforma.',
      'Clique em um cliente para ver perfil completo: projetos, faturamento, mensagens.',
      'Use "Novo Cliente" para cadastrar via modal rápido.',
      'O health score indica o nível de satisfação do cliente.',
    ],
  },
  '/crm': {
    title: 'CRM - Funil de Vendas',
    items: [
      'Pipeline dividido em estágios: Novo → Contato → Qualificado → Proposta → Negociação → Fechado.',
      'Arraste leads entre colunas para mudar de estágio.',
      'Clique em "Novo Lead" para adicionar um contato comercial.',
      'Cada lead tem score, valor estimado e origem.',
    ],
  },
  '/chat': {
    title: 'Chat com Clientes',
    items: [
      'Conversas organizadas por cliente/projeto.',
      'Selecione um canal à esquerda para ver as mensagens.',
      'Digite e pressione Enter para enviar.',
      'Clique no nome do cliente para ver o perfil completo.',
      'Use os ícones para anexar arquivos ou apagar mensagens.',
    ],
  },
  '/financial': {
    title: 'Controle Financeiro',
    items: [
      'Visualize todas as faturas: pagas, pendentes e vencidas.',
      'Os cards no topo mostram totais de recebido, pendente e vencido.',
      'Use "Nova Fatura" para gerar uma cobrança para o cliente.',
      'Clique em uma fatura para ver detalhes do pagamento.',
    ],
  },
  '/tickets': {
    title: 'Central de Suporte',
    items: [
      'Gerencie tickets de suporte dos seus clientes.',
      'Cada ticket tem prioridade (Baixa a Urgente) e status.',
      'Use "Novo Ticket" para abrir um chamado.',
      'Atribua tickets a você mesmo para organizar o trabalho.',
    ],
  },
  '/knowledge': {
    title: 'Meu Conhecimento',
    items: [
      'Árvore genealógica com todos os seus projetos concluídos.',
      'Organizado por ano, em ordem cronológica.',
      'Clique em "Editar" para adicionar resumo, link e imagem de capa.',
      'Construa seu portfólio de conhecimento ao longo do tempo.',
      'Use a busca para encontrar projetos específicos.',
    ],
  },
  '/analytics': {
    title: 'Analytics',
    items: [
      'Métricas de performance: receita, churn, conversão, SLA.',
      'Gráfico de receita mensal com barras interativas.',
      'Performance por projetos e tempo de entrega.',
      'Exporte relatórios para análise detalhada.',
    ],
  },
  '/automations': {
    title: 'Automações',
    items: [
      'Workflows que disparam automaticamente baseados em eventos.',
      'Cada automação tem: trigger (gatilho) + ações (o que faz).',
      'Exemplos: email de boas-vindas, cobrança automática, follow-up.',
      'Ative/pause automações conforme necessário.',
    ],
  },
  '/ai': {
    title: 'Inteligência Artificial',
    items: [
      'Assistente IA integrado ao sistema.',
      'Faça perguntas sobre projetos, clientes ou finanças.',
      'A IA analisa dados e sugere ações: riscos, oportunidades.',
      'Gere relatórios e resumos automaticamente.',
    ],
  },
  '/settings': {
    title: 'Configurações',
    items: [
      'Ative/desative módulos do sistema (CRM, Chat, IA, etc).',
      'Personalize aparência: tema, cores, logo.',
      'Configure gateways de pagamento e regras financeiras.',
      'Gerencie permissões, segurança e 2FA.',
    ],
  },
  '/portal': {
    title: 'Portal do Cliente',
    items: [
      'Área exclusiva para seus clientes acompanharem projetos.',
      'Veja progresso, prazos e etapas concluídas.',
      'Chat direto com o desenvolvedor.',
      'Financeiro: faturas e status de pagamento.',
      'Use "Solicitar Projeto" para pedir um novo projeto.',
    ],
  },
}

const tipsArray = Object.entries(tips)

export function PageTip() {
  const [visible, setVisible] = useState(false)
  const [currentTip, setCurrentTip] = useState<Tip | null>(null)
  const [step, setStep] = useState(0)

  const path = usePathname()

  useEffect(() => {
    if (!path) return
    const matched = tipsArray
      .filter(([key]) => path === key || path.startsWith(key + '/'))
      .sort((a, b) => b[0].length - a[0].length)

    if (matched.length > 0) {
      const [, tip] = matched[0]
      const stored = localStorage.getItem(`tip_dismissed_${matched[0][0]}`)
      if (!stored) {
        setCurrentTip(tip)
        setTimeout(() => setVisible(true), 600)
      }
    }
  }, [path])

  const dismiss = () => {
    setVisible(false)
    if (currentTip) {
      const pathKey = tipsArray.find(([, t]) => t === currentTip)?.[0] || ''
      localStorage.setItem(`tip_dismissed_${pathKey}`, '1')
    }
  }

  const nextStep = () => {
    if (currentTip && step < currentTip.items.length - 1) {
      setStep(step + 1)
    } else {
      dismiss()
    }
  }

  if (!visible || !currentTip) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm animate-slide-up">
      <div className="bg-[hsl(222,47%,11%)] border border-primary/30 rounded-[14px] p-5 shadow-lg">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
              <Lightbulb className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-white">{currentTip.title}</h3>
          </div>
          <button onClick={dismiss} className="text-[#94A3B8] hover:text-white transition-base">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="bg-[hsl(222,40%,8%)] rounded-[10px] p-3 mb-3">
          <p className="text-sm text-[#EAF2FF] leading-relaxed">{currentTip.items[step]}</p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-[#94A3B8]">{step + 1} de {currentTip.items.length}</span>
          <button onClick={nextStep} className="btn btn-primary btn-sm text-xs">
            {step < currentTip.items.length - 1 ? (
              <>Próximo <ChevronRight className="h-3 w-3 ml-1" /></>
            ) : 'Entendi'}
          </button>
        </div>

        <div className="flex gap-1 mt-3 justify-center">
          {currentTip.items.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all ${i === step ? 'w-4 bg-primary' : 'w-1.5 bg-[hsl(222,25%,14%)]'}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
