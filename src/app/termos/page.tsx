'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'

interface SectionDef { id: string; num: string; label: string; cat: string }

const allSections: SectionDef[] = [
  { id: 'aceitacao', num: '1', label: 'Aceitacao dos Termos', cat: 'geral' },
  { id: 'partes', num: '2', label: 'Partes Envolvidas', cat: 'geral' },
  { id: 'alteracoes', num: '3', label: 'Alteracoes nos Termos', cat: 'geral' },
  { id: 'escopo', num: '4', label: 'Escopo dos Servicos', cat: 'servicos' },
  { id: 'etapas', num: '5', label: 'Etapas do Projeto', cat: 'servicos' },
  { id: 'revisoes', num: '6', label: 'Revisoes e Alteracoes', cat: 'servicos' },
  { id: 'prazos', num: '7', label: 'Prazos e Atrasos', cat: 'servicos' },
  { id: 'comunicacao', num: '8', label: 'Comunicacao Oficial', cat: 'servicos' },
  { id: 'politica-pg', num: '9', label: 'Politica de Pagamentos', cat: 'pagamentos' },
  { id: 'modelos', num: '10', label: 'Modelos de Cobranca', cat: 'pagamentos' },
  { id: 'parcelas', num: '11', label: 'Estrutura de Parcelas', cat: 'pagamentos' },
  { id: 'meios-pg', num: '12', label: 'Meios de Pagamento', cat: 'pagamentos' },
  { id: 'atraso', num: '13', label: 'Atrasos e Inadimplencia', cat: 'pagamentos' },
  { id: 'reembolso', num: '14', label: 'Politica de Reembolso', cat: 'pagamentos' },
  { id: 'titularidade', num: '15', label: 'Titularidade dos Direitos', cat: 'propriedade' },
  { id: 'cessao', num: '16', label: 'Cessao de Direitos', cat: 'propriedade' },
  { id: 'portfolio', num: '17', label: 'Portfolio e Divulgacao', cat: 'propriedade' },
  { id: 'terceiros', num: '18', label: 'Conteudo de Terceiros', cat: 'propriedade' },
  { id: 'lgpd', num: '19', label: 'Conformidade LGPD', cat: 'privacidade' },
  { id: 'dados', num: '20', label: 'Dados Coletados', cat: 'privacidade' },
  { id: 'compartilhamento', num: '21', label: 'Compartilhamento', cat: 'privacidade' },
  { id: 'direitos', num: '22', label: 'Direitos do Titular', cat: 'privacidade' },
  { id: 'retencao', num: '23', label: 'Retencao de Dados', cat: 'privacidade' },
  { id: 'cookies', num: '24', label: 'Cookies', cat: 'privacidade' },
  { id: 'periodo', num: '25', label: 'Periodo de Garantia', cat: 'garantia' },
  { id: 'cobertura', num: '26', label: 'O que a Garantia Cobre', cat: 'garantia' },
  { id: 'exclusoes', num: '27', label: 'Exclusoes da Garantia', cat: 'garantia' },
  { id: 'sla', num: '28', label: 'SLA de Atendimento', cat: 'garantia' },
  { id: 'pos-garantia', num: '29', label: 'Suporte Pos-Garantia', cat: 'garantia' },
  { id: 'resp-dev', num: '30', label: 'Responsabilidades do Desenvolvedor', cat: 'responsabilidades' },
  { id: 'resp-cliente', num: '31', label: 'Responsabilidades do Cliente', cat: 'responsabilidades' },
  { id: 'limitacoes', num: '32', label: 'Limitacoes de Responsabilidade', cat: 'responsabilidades' },
  { id: 'forca-maior', num: '33', label: 'Caso Fortuito e Forca Maior', cat: 'responsabilidades' },
  { id: 'res-cliente', num: '34', label: 'Rescisao pelo Cliente', cat: 'rescisao' },
  { id: 'res-dev', num: '35', label: 'Rescisao pelo Desenvolvedor', cat: 'rescisao' },
  { id: 'efeitos', num: '36', label: 'Efeitos da Rescisao', cat: 'rescisao' },
  { id: 'sobrevivencia', num: '37', label: 'Sobrevivencia de Clausulas', cat: 'rescisao' },
  { id: 'disputas', num: '38', label: 'Resolucao de Disputas', cat: 'rescisao' },
]

const catLabels: Record<string, string> = {
  geral: 'Visao Geral',
  servicos: 'Servicos',
  pagamentos: 'Pagamentos',
  propriedade: 'Propriedade Intelectual',
  privacidade: 'Privacidade & LGPD',
  garantia: 'Garantia',
  responsabilidades: 'Responsabilidades',
  rescisao: 'Rescisao',
}

function CatIcon({ cat }: { cat: string }) {
  const p: React.SVGProps<SVGSVGElement> = { width: 12, height: 12, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (cat) {
    case 'geral':       return <svg {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
    case 'servicos':     return <svg {...p}><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
    case 'pagamentos':   return <svg {...p}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
    case 'propriedade': return <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M14.83 14.83a4 4 0 110-5.66"/></svg>
    case 'privacidade':  return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    case 'garantia':     return <svg {...p}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
    case 'responsabilidades': return <svg {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    case 'rescisao':     return <svg {...p}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
    default: return null
  }
}

export default function TermosPage() {
  const [search, setSearch] = useState('')
  const [activeSection, setActiveSection] = useState('')
  const [showFloating, setShowFloating] = useState(false)
  const [showBackTop, setShowBackTop] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const filteredSections = search
    ? allSections.filter(s => s.label.toLowerCase().includes(search.toLowerCase()) || catLabels[s.cat]?.toLowerCase().includes(search.toLowerCase()))
    : allSections

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      setShowBackTop(scrollY > 500)
      setShowFloating(scrollY > 200)

      // Highlight active section in sidebar
      const reversed = [...allSections].reverse()
      for (const s of reversed) {
        const el = document.getElementById(s.id)
        if (el && el.getBoundingClientRect().top <= 150) {
          setActiveSection(s.id)
          break
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-[var(--bg)]/90 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-[13px] font-[500] text-[var(--text-2)] hover:text-[var(--text)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Voltar
          </Link>
          <div className="flex items-center gap-2 flex-1 mx-8 max-w-md">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-3)] shrink-0"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <Input
              placeholder="Buscar nos termos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 text-[12px] border-0 bg-transparent focus-visible:ring-0"
            />
          </div>
          <div className="flex items-center gap-3 text-[10px] text-[var(--text-3)]">
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]"/>LGPD</span>
            <span>v1.0</span>
          </div>
        </div>
      </div>

      {/* Layout: sidebar + content */}
      <div className="max-w-7xl mx-auto flex">
        {/* Left sidebar - sticky */}
        <aside ref={sidebarRef} className="hidden lg:block w-[240px] shrink-0 border-r border-[var(--border)] sticky top-[56px] h-[calc(100vh-56px)] overflow-y-auto">
          <div className="p-4">
            {Object.entries(catLabels).map(([cat, label]) => (
              <div key={cat} className="mb-3">
                <p className="text-[9px] font-[600] text-[var(--text-3)] uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <CatIcon cat={cat} />
                  {label}
                </p>
                <div className="space-y-0.5">
                  {allSections.filter(s => s.cat === cat).map(s => (
                    <button
                      key={s.id}
                      onClick={() => scrollTo(s.id)}
                      className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded text-[11px] transition-colors ${
                        activeSection === s.id
                          ? 'bg-[var(--accent-subtle)] text-[var(--accent)] font-[500]'
                          : 'text-[var(--text-2)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'
                      }`}
                    >
                      <span className="text-[var(--text-3)] text-[9px] font-[600] w-4">{s.num}</span>
                      <span className="truncate">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 px-4 py-8">
          <div className="mb-8">
            <p className="text-[10px] font-[600] text-[var(--accent)] uppercase tracking-widest mb-2">termos legais</p>
            <h1 className="text-[32px] font-[700] tracking-[-0.03em] text-[var(--text)] mb-3">Termos e <span className="text-[var(--accent)]">Condicoes</span> de Uso</h1>
            <p className="text-[13px] text-[var(--text-2)] max-w-lg leading-relaxed">Este documento rege a relacao entre o desenvolvedor e os clientes que solicitam servicos de desenvolvimento de software e aplicacoes web.</p>
          </div>

          {filteredSections.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[var(--text-3)]">Nenhuma secao encontrada para "{search}"</p>
              <button onClick={() => setSearch('')} className="text-[var(--accent)] text-[12px] mt-2 underline">Limpar busca</button>
            </div>
          )}

          <Section id="aceitacao" num="1" title="Aceitacao dos Termos">
            <p>Ao preencher o briefing de solicitacao de projeto, realizar qualquer pagamento ou assinar o contrato de prestacao de servicos, o contratante confirma que leu e aceita integralmente estes Termos e Condicoes.</p>
            <p>Estes termos se aplicam a todas as interacoes, projetos, comunicacoes e relacoes comerciais estabelecidas com este desenvolvedor, independentemente do canal utilizado.</p>
            <Callout type="info">Nenhum trabalho sera iniciado sem a confirmacao formal da proposta e o pagamento da entrada acordada em contrato.</Callout>
          </Section>

          <Section id="partes" num="2" title="Partes Envolvidas">
            <table className="w-full text-[12px]">
              <thead><tr className="text-left text-[var(--text-3)] text-[10px] uppercase tracking-wider"><th className="p-2 border-b border-[var(--border)]">Parte</th><th className="p-2 border-b border-[var(--border)]">Descricao</th></tr></thead>
              <tbody>
                <tr><td className="p-2 border-b border-[var(--border)] font-[500] text-[var(--text)]">Desenvolvedor / Prestador</td><td className="p-2 border-b border-[var(--border)] text-[var(--text-2)]">Profissional autonomo responsavel pela execucao dos servicos de desenvolvimento.</td></tr>
                <tr><td className="p-2 border-b border-[var(--border)] font-[500] text-[var(--text)]">Contratante / Cliente</td><td className="p-2 border-b border-[var(--border)] text-[var(--text-2)]">Pessoa fisica ou juridica que solicita e remunera os servicos.</td></tr>
                <tr><td className="p-2 font-[500] text-[var(--text)]">Plataforma</td><td className="p-2 text-[var(--text-2)]">Sistema online de gestao de projetos utilizado para comunicacao e acompanhamento.</td></tr>
              </tbody>
            </table>
          </Section>

          <Section id="alteracoes" num="3" title="Alteracoes nestes Termos">
            <p>O desenvolvedor reserva-se o direito de atualizar estes Termos a qualquer momento. Alteracoes significativas serao comunicadas com <strong className="text-[var(--text)]">15 dias de antecedencia</strong> via e-mail cadastrado. O uso continuado dos servicos apos esse prazo implica na aceitacao dos novos termos.</p>
          </Section>

          <Section id="escopo" num="4" title="Escopo dos Servicos">
            <p>Os servicos prestados sao exclusivamente os descritos no briefing aprovado e no contrato assinado. Funcionalidades nao documentadas antes do inicio do projeto sao consideradas fora do escopo.</p>
            <SubTitle>Servicos disponiveis</SubTitle>
            <List items={['Desenvolvimento Web: Criacao de sites, landing pages, portfolios e paginas institucionais.', 'Sistemas Web: Plataformas com autenticacao, dashboards, paineis administrativos e CRUDs.', 'APIs e Integracoes: APIs REST, integracoes com servicos terceiros.', 'E-commerce: Lojas virtuais com carrinho, checkout e gestao de produtos.', 'Design UI/UX: Prototipagem, design de interfaces e identidade visual digital.', 'Manutencao: Correcoes, atualizacoes e melhorias em sistemas existentes.']} />
            <Callout type="warning">Qualquer funcionalidade adicionada apos a aprovacao do escopo sera cobrada separadamente como aditivo contratual.</Callout>
          </Section>

          <Section id="etapas" num="5" title="Etapas do Projeto">
            <table className="w-full text-[12px]">
              <thead><tr className="text-left text-[var(--text-3)] text-[10px] uppercase tracking-wider"><th className="p-2 border-b border-[var(--border)]">Etapa</th><th className="p-2 border-b border-[var(--border)]">Responsavel</th></tr></thead>
              <tbody>
                {['Briefing (Cliente)', 'Proposta & Contrato (Desenvolvedor)', 'Planejamento (Desenvolvedor)', 'Design UI/UX (Desenvolvedor)', 'Aprovacao do Design (Cliente)', 'Desenvolvimento (Desenvolvedor)', 'Testes Internos (Desenvolvedor)', 'Homologacao (Cliente)', 'Deploy (Desenvolvedor)', 'Entrega (Ambos)', 'Garantia (Ambos)'].map((e, i) => {
                  const [name, resp] = e.split(' (')
                  return <tr key={i}><td className="p-2 border-b border-[var(--border)] font-[500] text-[var(--text)]">{name}</td><td className="p-2 border-b border-[var(--border)] text-[var(--text-2)]">{resp?.replace(')', '')}</td></tr>
                })}
              </tbody>
            </table>
          </Section>

          <Section id="revisoes" num="6" title="Revisoes e Alteracoes">
            <p>O numero de rodadas de revisao e definido no contrato. Rodadas extras sao cobradas separadamente.</p>
            <List items={['Alteracao de cor, tipografia ou layout nao especificado no briefing original.', 'Mudanca no fluxo de navegacao apos aprovacao do prototipo.', 'Adicao ou remocao de elementos visuais significativos apos aprovacao do design.']} />
          </Section>

          <Section id="prazos" num="7" title="Prazos e Atrasos">
            <List items={['Atraso do cliente: Feedback fora do prazo prorroga o projeto pelo mesmo periodo.', 'Alteracao de escopo: Qualquer adicao ao projeto pode impactar o prazo.', 'Dependencias externas: Atraso de servicos terceiros fora do controle do desenvolvedor.']} />
            <Callout type="info">O cliente tem ate <code className="text-[var(--accent)] bg-[var(--accent-subtle)] px-1.5 py-0.5 rounded text-[11px]">5 dias uteis</code> para responder qualquer aprovacao.</Callout>
          </Section>

          <Section id="comunicacao" num="8" title="Comunicacao Oficial">
            <table className="w-full text-[12px]">
              <thead><tr className="text-left text-[var(--text-3)] text-[10px] uppercase tracking-wider"><th className="p-2 border-b border-[var(--border)]">Canal</th><th className="p-2 border-b border-[var(--border)]">Validade</th></tr></thead>
              <tbody>
                <tr><td className="p-2 border-b border-[var(--border)] font-[500] text-[var(--text)]">Plataforma de Gestao</td><td className="p-2 border-b border-[var(--border)] text-[var(--success)]">Contratual</td></tr>
                <tr><td className="p-2 border-b border-[var(--border)] font-[500] text-[var(--text)]">E-mail</td><td className="p-2 border-b border-[var(--border)] text-[var(--success)]">Contratual</td></tr>
                <tr><td className="p-2 border-b border-[var(--border)] font-[500] text-[var(--text)]">WhatsApp</td><td className="p-2 border-b border-[var(--border)] text-[var(--warning)]">Referencia apenas</td></tr>
                <tr><td className="p-2 font-[500] text-[var(--text)]">Redes Sociais / DM</td><td className="p-2 text-[var(--text-3)]">Sem validade</td></tr>
              </tbody>
            </table>
          </Section>

          <Section id="politica-pg" num="9" title="Politica de Pagamentos">
            <Callout type="danger">A entrada (primeira parcela) e condicao obrigatoria para inicio. Sem confirmacao de pagamento, nenhuma atividade e executada.</Callout>
          </Section>

          <Section id="modelos" num="10" title="Modelos de Cobranca">
            <table className="w-full text-[12px]">
              <thead><tr className="text-left text-[var(--text-3)] text-[10px] uppercase tracking-wider"><th className="p-2 border-b border-[var(--border)]">Modalidade</th><th className="p-2 border-b border-[var(--border)]">Descricao</th></tr></thead>
              <tbody>
                <tr><td className="p-2 border-b border-[var(--border)] font-[500] text-[var(--text)]">Projeto Fechado</td><td className="p-2 border-b border-[var(--border)] text-[var(--text-2)]">Valor total por escopo. Parcelas vinculadas a marcos.</td></tr>
                <tr><td className="p-2 border-b border-[var(--border)] font-[500] text-[var(--text)]">Por Hora</td><td className="p-2 border-b border-[var(--border)] text-[var(--text-2)]">Cobranca por hora trabalhada. Horas reportadas semanalmente.</td></tr>
                <tr><td className="p-2 font-[500] text-[var(--text)]">Mensal (Retainer)</td><td className="p-2 text-[var(--text-2)]">Valor mensal fixo para horas ou funcionalidades continuas.</td></tr>
              </tbody>
            </table>
          </Section>

          <Section id="parcelas" num="11" title="Estrutura de Parcelas">
            <table className="w-full text-[12px]">
              <thead><tr className="text-left text-[var(--text-3)] text-[10px] uppercase tracking-wider"><th className="p-2 border-b border-[var(--border)]">Marco</th><th className="p-2 border-b border-[var(--border)]">% do Valor</th></tr></thead>
              <tbody>
                <tr><td className="p-2 border-b border-[var(--border)] font-[500] text-[var(--text)]">1 - Entrada (assinatura)</td><td className="p-2 border-b border-[var(--border)] text-[var(--text-2)]">40-50%</td></tr>
                <tr><td className="p-2 border-b border-[var(--border)] font-[500] text-[var(--text)]">2 - Aprovacao do Design</td><td className="p-2 border-b border-[var(--border)] text-[var(--text-2)]">25-30%</td></tr>
                <tr><td className="p-2 font-[500] text-[var(--text)]">3 - Entrega Final</td><td className="p-2 text-[var(--text-2)]">20-35%</td></tr>
              </tbody>
            </table>
          </Section>

          <Section id="meios-pg" num="12" title="Meios de Pagamento">
            <List items={['PIX — chave definida no contrato', 'Transferencia bancaria (TED/DOC)', 'Boleto bancario (compensacao em ate 3 dias uteis)', 'Cartao de credito via link de pagamento']} />
          </Section>

          <Section id="atraso" num="13" title="Atrasos e Inadimplencia">
            <p>Em caso de atraso, aplicam-se juros de mora de <strong className="text-[var(--text)]">1% ao mes</strong> e multa de <strong className="text-[var(--text)]">2%</strong>. Apos 15 dias, o desenvolvedor pode suspender os trabalhos.</p>
          </Section>

          <Section id="reembolso" num="14" title="Politica de Reembolso">
            <table className="w-full text-[12px]">
              <thead><tr className="text-left text-[var(--text-3)] text-[10px] uppercase tracking-wider"><th className="p-2 border-b border-[var(--border)]">Momento do Cancelamento</th><th className="p-2 border-b border-[var(--border)]">Politica</th></tr></thead>
              <tbody>
                <tr><td className="p-2 border-b border-[var(--border)] font-[500] text-[var(--text)]">Antes do inicio</td><td className="p-2 border-b border-[var(--border)] text-[var(--text-2)]">Entrada nao reembolsavel.</td></tr>
                <tr><td className="p-2 border-b border-[var(--border)] font-[500] text-[var(--text)]">Durante Design/Dev</td><td className="p-2 border-b border-[var(--border)] text-[var(--text-2)]">Valor proporcional ao trabalho executado.</td></tr>
                <tr><td className="p-2 font-[500] text-[var(--text)]">Apos Entrega</td><td className="p-2 text-[var(--text-2)]">Nenhum reembolso. Projeto encerrado.</td></tr>
              </tbody>
            </table>
          </Section>

          <Section id="titularidade" num="15" title="Titularidade dos Direitos">
            <Callout type="danger">Antes da quitacao integral: Todo o codigo-fonte, designs e prototipos permanecem propriedade exclusiva do desenvolvedor.</Callout>
            <Callout type="success">Apos quitacao integral: Direitos patrimoniais de uso cedidos ao cliente de forma nao exclusiva, perpetua e para territorio nacional.</Callout>
          </Section>

          <Section id="cessao" num="16" title="Cessao de Direitos">
            <SubTitle>Cedido ao cliente</SubTitle>
            <List items={['Direito de usar, executar e operar o software entregue.', 'Direito de modificar o codigo-fonte para uso proprio.', 'Direito de usar os layouts e designs produzidos.']} />
          </Section>

          <Section id="portfolio" num="17" title="Portfolio e Divulgacao">
            <p>O desenvolvedor reserva-se o direito de mencionar e exibir o projeto em seu portfolio. O cliente pode solicitar restricao por escrito antes da assinatura.</p>
          </Section>

          <Section id="terceiros" num="18" title="Conteudo de Terceiros">
            <p>O cliente declara que todos os conteudos fornecidos sao de sua propriedade ou que possui autorizacao legal, isentando o desenvolvedor de responsabilidade por violacao de direitos autorais.</p>
          </Section>

          <Section id="lgpd" num="19" title="Conformidade com a LGPD">
            <p>Este desenvolvedor cumpre as disposicoes da <strong className="text-[var(--text)]">Lei Geral de Protecao de Dados (Lei 13.709/2018 — LGPD)</strong>.</p>
            <blockquote className="border-l-2 border-[var(--accent)] pl-4 py-2 my-3 text-[11px] text-[var(--text-3)] italic bg-[var(--surface-2)] rounded-r-lg">
              Art. 6 da LGPD — As atividades de tratamento de dados pessoais deverao observar a boa-fe e os principios de: finalidade, adequacao, necessidade, livre acesso, qualidade dos dados, transparencia, seguranca, prevencao, nao discriminacao, responsabilizacao e prestacao de contas.
            </blockquote>
          </Section>

          <Section id="dados" num="20" title="Dados Coletados e Finalidade">
            <table className="w-full text-[12px]">
              <thead><tr className="text-left text-[var(--text-3)] text-[10px] uppercase tracking-wider"><th className="p-2 border-b border-[var(--border)]">Dado</th><th className="p-2 border-b border-[var(--border)]">Finalidade</th><th className="p-2 border-b border-[var(--border)]">Base Legal</th></tr></thead>
              <tbody>
                {[['Nome e CPF/CNPJ', 'Identificacao e emissao de contrato', 'Execucao de contrato'],['E-mail e telefone', 'Comunicacao e notificacoes', 'Execucao de contrato'],['Endereco', 'Dados contratuais e fiscais', 'Obrigacao legal'],['Dados bancarios', 'Processamento de pagamentos', 'Execucao de contrato'],['Dados do negocio', 'Execucao do projeto e briefing', 'Legitimo interesse'],['Logs de acesso', 'Seguranca e rastreabilidade', 'Legitimo interesse']].map(([d, f, b], i) => (
                  <tr key={i}><td className="p-2 border-b border-[var(--border)] font-[500] text-[var(--text)]">{d}</td><td className="p-2 border-b border-[var(--border)] text-[var(--text-2)]">{f}</td><td className="p-2 border-b border-[var(--border)] text-[var(--text-3)]">{b}</td></tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section id="compartilhamento" num="21" title="Compartilhamento de Dados">
            <p>Os dados dos clientes <strong className="text-[var(--text)]">nunca sao vendidos</strong>. Compartilhamento apenas com processadores de pagamento, ferramentas de gestao e por obrigacao legal.</p>
            <Callout type="success">Nenhum dado pessoal de clientes e compartilhado com terceiros para fins publicitarios ou de marketing.</Callout>
          </Section>

          <Section id="direitos" num="22" title="Direitos do Titular de Dados">
            <List items={['Acesso: Solicitar confirmacao e acesso aos dados tratados.', 'Correcao: Solicitar a correcao de dados incompletos ou inexatos.', 'Exclusao: Solicitar a anonimizacao ou exclusao de dados desnecessarios.', 'Portabilidade: Solicitar a portabilidade dos dados a outro fornecedor.', 'Revogacao: Revogar o consentimento a qualquer momento.']} />
            <p>Para exercer seus direitos, envie e-mail com assunto <code className="text-[var(--accent)] bg-[var(--accent-subtle)] px-1.5 py-0.5 rounded text-[11px]">LGPD - [Seu Nome]</code>. Prazo: 15 dias uteis.</p>
          </Section>

          <Section id="retencao" num="23" title="Retencao e Eliminacao de Dados">
            <table className="w-full text-[12px]">
              <thead><tr className="text-left text-[var(--text-3)] text-[10px] uppercase tracking-wider"><th className="p-2 border-b border-[var(--border)]">Tipo</th><th className="p-2 border-b border-[var(--border)]">Prazo</th></tr></thead>
              <tbody>
                <tr><td className="p-2 border-b border-[var(--border)] font-[500] text-[var(--text)]">Dados contratuais</td><td className="p-2 border-b border-[var(--border)] text-[var(--text-2)]">5 anos</td></tr>
                <tr><td className="p-2 border-b border-[var(--border)] font-[500] text-[var(--text)]">Dados de comunicacao</td><td className="p-2 border-b border-[var(--border)] text-[var(--text-2)]">2 anos</td></tr>
                <tr><td className="p-2 font-[500] text-[var(--text)]">Dados de pagamento</td><td className="p-2 text-[var(--text-2)]">5 anos</td></tr>
              </tbody>
            </table>
          </Section>

          <Section id="cookies" num="24" title="Cookies e Rastreamento">
            <p>A plataforma utiliza apenas cookies estritamente necessarios (sessao, autenticacao e seguranca). Nao sao utilizados cookies de rastreamento publicitario.</p>
          </Section>

          <Section id="periodo" num="25" title="Periodo de Garantia">
            <p>Apos a entrega formal, o projeto entra em periodo de garantia padrao de <strong className="text-[var(--text)]">30 dias corridos</strong>.</p>
          </Section>

          <Section id="cobertura" num="26" title="O que a Garantia Cobre">
            <List items={['Bugs e erros decorrentes do codigo desenvolvido.', 'Comportamentos divergentes do especificado no briefing.', 'Erros de layout em navegadores acordados.', 'Falhas em integracoes implementadas conforme especificacao.']} />
          </Section>

          <Section id="exclusoes" num="27" title="Exclusoes da Garantia">
            <List items={['Novas funcionalidades nao previstas no escopo.', 'Erros causados por alteracoes do cliente ou terceiros no codigo.', 'Indisponibilidade de servicos de terceiros (hospedagem, APIs).', 'Problemas por conteudo inserido pelo cliente.']} cross />
          </Section>

          <Section id="sla" num="28" title="Tempo de Resposta (SLA)">
            <table className="w-full text-[12px]">
              <thead><tr className="text-left text-[var(--text-3)] text-[10px] uppercase tracking-wider"><th className="p-2 border-b border-[var(--border)]">Severidade</th><th className="p-2 border-b border-[var(--border)]">Resposta</th><th className="p-2 border-b border-[var(--border)]">Resolucao</th></tr></thead>
              <tbody>
                <tr><td className="p-2 border-b border-[var(--border)]"><span className="h-2 w-2 rounded-full bg-[var(--destructive)] inline-block mr-1.5"/>Critico</td><td className="p-2 border-b border-[var(--border)] text-[var(--text-2)]">ate 4h uteis</td><td className="p-2 border-b border-[var(--border)] text-[var(--text-2)]">ate 24h uteis</td></tr>
                <tr><td className="p-2 border-b border-[var(--border)]"><span className="h-2 w-2 rounded-full bg-[var(--warning)] inline-block mr-1.5"/>Alto</td><td className="p-2 border-b border-[var(--border)] text-[var(--text-2)]">ate 8h uteis</td><td className="p-2 border-b border-[var(--border)] text-[var(--text-2)]">ate 3 dias uteis</td></tr>
                <tr><td className="p-2"><span className="h-2 w-2 rounded-full bg-[var(--success)] inline-block mr-1.5"/>Medio</td><td className="p-2 text-[var(--text-2)]">ate 24h uteis</td><td className="p-2 text-[var(--text-2)]">ate 5 dias uteis</td></tr>
              </tbody>
            </table>
          </Section>

          <Section id="pos-garantia" num="29" title="Suporte Pos-Garantia">
            <p>Apos o vencimento da garantia, qualquer suporte ou manutencao sera cobrado conforme a tabela de horas vigente.</p>
          </Section>

          <Section id="resp-dev" num="30" title="Responsabilidades do Desenvolvedor">
            <List items={['Executar os servicos com qualidade tecnica e profissionalismo.', 'Comunicar proativamente qualquer impedimento.', 'Manter sigilo sobre informacoes confidenciais.', 'Realizar testes internos antes de qualquer entrega.']} />
          </Section>

          <Section id="resp-cliente" num="31" title="Responsabilidades do Cliente">
            <List items={['Realizar pagamentos nos prazos acordados.', 'Fornecer materiais e acessos necessarios.', 'Responder aprovacoes em ate 5 dias uteis.', 'Realizar testes de homologacao antes do deploy.']} />
          </Section>

          <Section id="limitacoes" num="32" title="Limitacoes de Responsabilidade">
            <List items={['Resultados comerciais ou financeiros do software entregue.', 'Perda de dados por falha na infraestrutura do cliente.', 'Indisponibilidade de servicos de terceiros.', 'Ataques ciberneticos a infraestrutura nao gerenciada.']} cross />
            <Callout type="danger">Em qualquer hipotese, a responsabilidade total do desenvolvedor fica limitada ao valor efetivamente pago pelo cliente neste contrato.</Callout>
          </Section>

          <Section id="forca-maior" num="33" title="Caso Fortuito e Forca Maior">
            <p>Nenhuma das partes sera responsabilizada por atrasos decorrentes de eventos fora de seu controle (desastres naturais, pandemias, acoes governamentais). Comunicacao em ate 48 horas.</p>
          </Section>

          <Section id="res-cliente" num="34" title="Rescisao pelo Cliente">
            <p>O cliente pode rescindir com <strong className="text-[var(--text)]">5 dias uteis de antecedencia</strong>. A entrada nao e reembolsavel.</p>
          </Section>

          <Section id="res-dev" num="35" title="Rescisao pelo Desenvolvedor">
            <p>Rescisao por justa causa em casos de: inadimplencia (15+ dias), comportamento abusivo, solicitacoes ilegais ou informacoes falsas.</p>
          </Section>

          <Section id="efeitos" num="36" title="Efeitos da Rescisao">
            <List items={['Suspensao imediata dos trabalhos.', 'Apuracao dos valores devidos por etapas concluidas.', 'Entrega dos materiais apos quitacao integral.', 'Obrigacoes de confidencialidade permanecem por 2 anos.']} />
          </Section>

          <Section id="sobrevivencia" num="37" title="Sobrevivencia de Clausulas">
            <p>Permanecem em vigor apos rescisao: confidencialidade (2 anos), propriedade intelectual, limitacao de responsabilidade e foro de eleicao.</p>
          </Section>

          <Section id="disputas" num="38" title="Resolucao de Disputas">
            <p>Sequencia: 1) Negociacao direta (15 dias); 2) Mediacao extrajudicial; 3) Via judicial no foro da comarca do domicilio do desenvolvedor.</p>
          </Section>

          <footer className="border-t border-[var(--border)] mt-12 pt-6 flex items-center justify-between text-[10px] text-[var(--text-3)] flex-wrap gap-2">
            <span>2026 AnderFlow · Todos os direitos reservados</span>
            <span>Codigo Civil (Lei 10.406/2002) · LGPD (Lei 13.709/2018)</span>
            <span>Versao 1.0</span>
          </footer>
        </main>
      </div>

      {/* Floating back-to-top + category nav */}
      <div className={`fixed right-6 bottom-6 z-50 flex flex-col gap-2 transition-all duration-300 ${showFloating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        {showFloating && (
          <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2 shadow-lg max-w-[160px]">
            <p className="text-[9px] font-[600] text-[var(--text-3)] uppercase tracking-wider mb-1.5 px-1">Navegar</p>
            {Object.entries(catLabels).map(([cat, label]) => {
              const firstSection = allSections.find(s => s.cat === cat)
              return firstSection ? (
                <button
                  key={cat}
                  onClick={() => scrollTo(firstSection.id)}
                  className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-[10px] text-[var(--text-2)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-colors text-left"
                >
                  <CatIcon cat={cat} />
                  <span className="truncate">{label}</span>
                </button>
              ) : null
            })}
          </div>
        )}
        {showBackTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--accent)] text-white shadow-lg hover:bg-[var(--accent-hover)] transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 15l-6-6-6 6"/></svg>
          </button>
        )}
      </div>
    </div>
  )
}

function Section({ id, num, title, children }: { id: string; num: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-8 scroll-mt-28">
      <div className="flex items-start gap-3 mb-3 pb-2 border-b border-[var(--border)]">
        <span className="text-[11px] font-[600] text-[var(--accent)] opacity-70 pt-0.5 min-w-[20px]">{num}</span>
        <h2 className="text-[16px] font-[600] tracking-[-0.02em] text-[var(--text)]">{title}</h2>
      </div>
      <div className="space-y-2 text-[13px] text-[var(--text-2)] leading-relaxed">{children}</div>
    </section>
  )
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[13px] font-[600] text-[var(--text)] mt-4 mb-2 flex items-center gap-2 before:content-[''] before:w-[3px] before:h-[14px] before:bg-[var(--accent)] before:rounded-sm">{children}</h3>
}

function Callout({ type, children }: { type: 'info' | 'warning' | 'danger' | 'success'; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    info: 'border-[var(--info)] bg-[var(--info-subtle)] text-[var(--info)]',
    warning: 'border-[var(--warning)] bg-[var(--warning-subtle)] text-[var(--warning)]',
    danger: 'border-[var(--destructive)] bg-[var(--destructive-subtle)] text-[var(--destructive)]',
    success: 'border-[var(--success)] bg-[var(--success-subtle)] text-[var(--success)]',
  }
  return <div className={`border-l-[3px] p-3 rounded-r-lg text-[12px] ${colors[type]}`}>{children}</div>
}

function List({ items, cross }: { items: string[]; cross?: boolean }) {
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2.5 text-[12px] text-[var(--text-2)] bg-[var(--surface-2)] rounded-lg p-2.5 border border-[var(--border)]">
          <span className={`shrink-0 mt-0.5 text-[10px] font-[600] ${cross ? 'text-[var(--destructive)]' : 'text-[var(--accent)]'}`}>
            {cross ? 'X' : '→'}
          </span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  )
}
