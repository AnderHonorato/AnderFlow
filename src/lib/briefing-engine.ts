// =====================================================
// ANDERFLOW BRIEFING ENGINE — Simulated Intelligence
// =====================================================
// ZERO AI. Purely conditional flows, templates, rules.

export type QuestionType = 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'date' | 'file' | 'url'
export type ServiceCategory = typeof SERVICE_CATEGORIES[number]['id']

export interface BriefingQuestion {
  id: string
  label: string
  type: QuestionType
  required: boolean
  options?: string[]
  placeholder?: string
  helpText?: string
  showIf?: (answers: Record<string, any>) => boolean
}

export interface BriefingStage {
  id: string
  title: string
  description?: string
  autoMessage?: string
  questions: BriefingQuestion[]
}

export interface BriefingTemplate {
  id: string
  name: string
  icon: string
  stages: BriefingStage[]
}

// ── Service Categories ──

export const SERVICE_CATEGORIES = [
  { id: 'GOOGLE_ADS', name: 'Google Ads', icon: '📊', description: 'Campanhas patrocinadas no Google' },
  { id: 'SEO_LOCAL', name: 'SEO Local', icon: '📍', description: 'Posicionamento no Google Maps' },
  { id: 'WEBSITE', name: 'Website', icon: '🌐', description: 'Site institucional ou landing page' },
  { id: 'LANDING_PAGE', name: 'Landing Page', icon: '🚀', description: 'Página de conversão' },
  { id: 'SAAS', name: 'Sistema SaaS', icon: '☁️', description: 'Sistema web completo' },
  { id: 'DASHBOARD', name: 'Dashboard', icon: '📈', description: 'Painel de controle' },
  { id: 'WHATSAPP_AUTOMATION', name: 'Automação WhatsApp', icon: '💬', description: 'Chatbot e fluxos' },
  { id: 'CRM', name: 'CRM', icon: '👥', description: 'Gestão de relacionamento' },
  { id: 'APP_MOBILE', name: 'App Mobile', icon: '📱', description: 'Android e/ou iOS' },
  { id: 'API_INTEGRATION', name: 'API/Integração', icon: '🔌', description: 'Conexão entre sistemas' },
  { id: 'ERP', name: 'ERP', icon: '🏢', description: 'Gestão empresarial' },
  { id: 'CHATBOT', name: 'Chatbot', icon: '🤖', description: 'Atendimento automático' },
  { id: 'BRANDING', name: 'Branding', icon: '🎨', description: 'Identidade visual' },
  { id: 'SOCIAL_MEDIA', name: 'Social Media', icon: '📱', description: 'Gestão de redes sociais' },
  { id: 'TRAFEGO_PAGO', name: 'Tráfego Pago', icon: '💸', description: 'Anúncios em plataformas' },
  { id: 'OTHER', name: 'Outro', icon: '✨', description: 'Outro tipo de serviço' },
] as const

// ── Universal Stage (all projects) ──

const UNIVERSAL_STAGE: BriefingStage = {
  id: 'universal',
  title: 'Informações Básicas',
  description: 'Dados essenciais do projeto',
  autoMessage: 'Ótimo! Vamos começar entendendo melhor seu projeto. Responda as perguntas abaixo e vou guiar você por todo o processo.',
  questions: [
    { id: 'project_name', label: 'Nome do Projeto', type: 'text', required: true, placeholder: 'Ex: E-commerce Premium' },
    { id: 'main_objective', label: 'Objetivo Principal', type: 'textarea', required: true, placeholder: 'Descreva o que você espera alcançar com este projeto' },
    { id: 'description', label: 'Descrição Geral', type: 'textarea', required: false, placeholder: 'Conte mais sobre o contexto do projeto' },
    { id: 'deadline', label: 'Prazo Desejado', type: 'select', required: true, options: ['Urgente (até 15 dias)', 'Curto (15-30 dias)', 'Médio (30-60 dias)', 'Longo (60-90 dias)', 'Flexível'] },
    { id: 'priority', label: 'Prioridade', type: 'select', required: true, options: ['Crítica', 'Alta', 'Média', 'Baixa'] },
    { id: 'budget', label: 'Orçamento Confortável', type: 'select', required: true, options: ['Até R$ 500', 'R$ 500 a R$ 1.000', 'R$ 1.000 a R$ 3.000', 'R$ 3.000 a R$ 5.000', 'R$ 5.000 a R$ 10.000', 'R$ 10.000+', 'A combinar'] },
    { id: 'target_audience', label: 'Público-Alvo', type: 'textarea', required: false, placeholder: 'Quem vai usar o sistema/serviço?' },
    { id: 'competitors', label: 'Concorrentes ou Referências', type: 'textarea', required: false, placeholder: 'Cite concorrentes ou empresas que você considera referência' },
    { id: 'references', label: 'Referências Visuais (links)', type: 'textarea', required: false, placeholder: 'Cole links de sites ou apps que você gosta do visual' },
    { id: 'additional_notes', label: 'Observações Adicionais', type: 'textarea', required: false, placeholder: 'Algo mais que devemos saber?' },
  ],
}

// ── Service-Specific Stages ──

const WEBSITE_STAGE: BriefingStage = {
  id: 'website',
  title: 'Detalhes do Website',
  autoMessage: 'Certo! Um website profissional. Vamos definir os detalhes técnicos e visuais para criar algo realmente impactante.',
  questions: [
    { id: 'website_pages', label: 'Quantas páginas deseja?', type: 'select', required: true, options: ['1 (Landing Page)', 'Até 5', '5 a 10', '10 a 20', '20+'] },
    { id: 'has_domain', label: 'Possui domínio?', type: 'select', required: true, options: ['Sim', 'Não', 'Preciso de ajuda'] },
    { id: 'has_hosting', label: 'Possui hospedagem?', type: 'select', required: true, options: ['Sim', 'Não', 'Preciso de ajuda'] },
    { id: 'needs_admin', label: 'Deseja painel administrativo?', type: 'select', required: false, options: ['Sim', 'Não'] },
    { id: 'needs_blog', label: 'Deseja blog integrado?', type: 'select', required: false, options: ['Sim', 'Não'] },
    { id: 'needs_login', label: 'Deseja área de login?', type: 'select', required: false, options: ['Sim', 'Não'] },
    { id: 'visual_style', label: 'Estilo Visual', type: 'select', required: false, options: ['Moderno/Minimalista', 'Corporativo', 'Criativo/Colorido', 'Dark Mode', 'Elegante/Premium'] },
    { id: 'colors', label: 'Cores desejadas ou paleta', type: 'text', required: false, placeholder: 'Ex: azul escuro com branco, ou envie depois' },
    { id: 'integrations', label: 'Integrações necessárias', type: 'multiselect', required: false, options: ['WhatsApp', 'Instagram', 'Pagamento Online', 'Email Marketing', 'Google Analytics', 'CRM', 'API Externa'] },
    { id: 'needs_contact_form', label: 'Deseja formulário de contato?', type: 'select', required: false, options: ['Sim', 'Não'] },
    { id: 'needs_seo', label: 'Deseja otimização SEO?', type: 'select', required: false, options: ['Sim', 'Não', 'Não sei o que é'] },
    { id: 'multilang', label: 'Precisa de multi-idioma?', type: 'select', required: false, options: ['Sim', 'Não'] },
  ],
}

const GOOGLE_ADS_STAGE: BriefingStage = {
  id: 'google_ads',
  title: 'Estratégia de Anúncios',
  autoMessage: 'Perfeito! Agora precisamos entender melhor sua região e objetivo principal para montar uma estratégia mais eficiente.',
  questions: [
    { id: 'target_region', label: 'Região desejada para os anúncios', type: 'text', required: true, placeholder: 'Ex: São Paulo - SP, Zona Sul' },
    { id: 'priority_neighborhoods', label: 'Bairros ou áreas prioritárias', type: 'textarea', required: false },
    { id: 'main_competitors_ads', label: 'Concorrentes fortes na região', type: 'textarea', required: false },
    { id: 'ad_budget_monthly', label: 'Orçamento mensal para anúncios', type: 'select', required: true, options: ['Até R$ 300', 'R$ 300-500', 'R$ 500-1000', 'R$ 1000-3000', 'R$ 3000+'] },
    { id: 'campaign_objective', label: 'Objetivo principal da campanha', type: 'multiselect', required: true, options: ['Mais mensagens WhatsApp', 'Mais ligações', 'Visitas ao site', 'Visitas à loja', 'Mais visibilidade', 'Agendamentos'] },
    { id: 'prefer_contact', label: 'Prefere contatos via WhatsApp ou ligações?', type: 'select', required: false, options: ['WhatsApp', 'Ligações', 'Ambos'] },
    { id: 'has_google_ads', label: 'Já possui conta no Google Ads?', type: 'select', required: false, options: ['Sim', 'Não'] },
    { id: 'has_google_profile', label: 'Já possui Perfil da Empresa no Google?', type: 'select', required: true, options: ['Sim', 'Não', 'Não sei'] },
    { id: 'advertised_before', label: 'Já anunciou no Google antes?', type: 'select', required: false, options: ['Sim', 'Não'] },
    { id: 'current_difficulties', label: 'Quais dificuldades enfrenta atualmente?', type: 'textarea', required: false },
    { id: 'needs_remarketing', label: 'Deseja remarketing?', type: 'select', required: false, options: ['Sim', 'Não', 'Não sei o que é'] },
  ],
}

const SEO_LOCAL_STAGE: BriefingStage = {
  id: 'seo_local',
  title: 'SEO e Google Maps',
  autoMessage: 'Excelente escolha! O SEO Local é fundamental para atrair clientes próximos. Vamos mapear sua região e otimizar sua presença.',
  questions: [
    { id: 'business_address', label: 'Endereço completo da empresa', type: 'text', required: true },
    { id: 'service_radius', label: 'Raio de atendimento (km)', type: 'select', required: false, options: ['5 km', '10 km', '20 km', '50 km', 'Toda a cidade', 'Região metropolitana'] },
    { id: 'google_profile_link', label: 'Link do Perfil Google Maps (se tiver)', type: 'url', required: false },
    { id: 'reviews_situation', label: 'Situação atual das avaliações', type: 'select', required: false, options: ['Boas (4+ estrelas)', 'Médias (3-4)', 'Ruins (<3)', 'Poucas avaliações', 'Não tenho perfil ainda'] },
    { id: 'seo_keywords', label: 'Palavras-chave importantes', type: 'textarea', required: false, placeholder: 'Ex: dentista zona sul, restaurante italiano SP' },
    { id: 'main_competitors_local', label: 'Concorrentes que aparecem no Google Maps', type: 'textarea', required: false },
  ],
}

const AUTOMATION_STAGE: BriefingStage = {
  id: 'automation',
  title: 'Detalhes da Automação',
  autoMessage: 'Automação é o futuro! Vamos entender qual processo você quer otimizar para criar o fluxo perfeito.',
  questions: [
    { id: 'process_to_automate', label: 'Qual processo deseja automatizar?', type: 'textarea', required: true, placeholder: 'Descreva o passo a passo atual' },
    { id: 'has_whatsapp_business', label: 'Utiliza WhatsApp Business?', type: 'select', required: false, options: ['Sim', 'Não', 'Quero implementar'] },
    { id: 'has_crm_current', label: 'Já utiliza algum CRM?', type: 'select', required: false, options: ['Sim', 'Não'] },
    { id: 'integration_needs', label: 'Integrações necessárias', type: 'multiselect', required: false, options: ['WhatsApp API', 'Instagram', 'Facebook', 'Email', 'Pagamento', 'Google Sheets', 'Calendário'] },
    { id: 'needs_chatbot_auto', label: 'Deseja chatbot?', type: 'select', required: false, options: ['Sim', 'Não', 'Talvez'] },
    { id: 'current_flow', label: 'Descreva o fluxo atual do processo', type: 'textarea', required: false },
    { id: 'monthly_volume', label: 'Quantidade mensal de atendimentos', type: 'select', required: true, options: ['Até 50', '50-200', '200-500', '500-1000', '1000+'] },
    { id: 'team_size', label: 'Quantas pessoas na equipe envolvida?', type: 'text', required: false },
  ],
}

const APP_MOBILE_STAGE: BriefingStage = {
  id: 'app_mobile',
  title: 'Especificações do App',
  autoMessage: 'Um app mobile! Vamos definir as plataformas e funcionalidades essenciais.',
  questions: [
    { id: 'platform', label: 'Plataforma(s)', type: 'multiselect', required: true, options: ['Android', 'iOS', 'Ambos'] },
    { id: 'social_login', label: 'Deseja login social?', type: 'select', required: false, options: ['Sim (Google/Apple)', 'Sim (Google/Facebook)', 'Não, só email/senha'] },
    { id: 'push_notifications', label: 'Notificações push?', type: 'select', required: false, options: ['Sim', 'Não'] },
    { id: 'needs_payments', label: 'Pagamentos no app?', type: 'select', required: false, options: ['Sim', 'Não'] },
    { id: 'offline_mode', label: 'Precisa funcionar offline?', type: 'select', required: false, options: ['Sim', 'Não', 'Parcialmente'] },
    { id: 'needs_admin_panel', label: 'Painel administrativo web?', type: 'select', required: true, options: ['Sim', 'Não'] },
    { id: 'file_upload', label: 'Upload de arquivos/imagens?', type: 'select', required: false, options: ['Sim', 'Não'] },
  ],
}

// ── Default fallback stage for other categories ──

const DEFAULT_SPECIFIC_STAGE: BriefingStage = {
  id: 'default_specific',
  title: 'Detalhes Específicos',
  autoMessage: 'Entendi! Agora me conte mais detalhes sobre o que você precisa.',
  questions: [
    { id: 'specific_needs', label: 'Descreva detalhadamente o que você precisa', type: 'textarea', required: true },
    { id: 'technical_requirements', label: 'Requisitos técnicos (se souber)', type: 'textarea', required: false },
    { id: 'similar_projects', label: 'Projetos similares que você conhece', type: 'textarea', required: false },
  ],
}

// ── Template Map ──

export function getTemplateForCategory(categoryId: string): BriefingTemplate {
  const cat = SERVICE_CATEGORIES.find(c => c.id === categoryId)
  const name = cat?.name || 'Projeto'

  let specificStage: BriefingStage

  switch (categoryId) {
    case 'WEBSITE':
    case 'LANDING_PAGE':
      specificStage = WEBSITE_STAGE
      break
    case 'GOOGLE_ADS':
    case 'TRAFEGO_PAGO':
      specificStage = GOOGLE_ADS_STAGE
      break
    case 'SEO_LOCAL':
      specificStage = SEO_LOCAL_STAGE
      break
    case 'WHATSAPP_AUTOMATION':
    case 'CHATBOT':
      specificStage = AUTOMATION_STAGE
      break
    case 'APP_MOBILE':
      specificStage = APP_MOBILE_STAGE
      break
    default:
      specificStage = DEFAULT_SPECIFIC_STAGE
  }

  return {
    id: categoryId,
    name,
    icon: cat?.icon || '✨',
    stages: [UNIVERSAL_STAGE, specificStage],
  }
}

// ── Auto-summary generator ──

export function generateSummary(categoryId: string, answers: Record<string, any>): string {
  const cat = SERVICE_CATEGORIES.find(c => c.id === categoryId)
  const catName = cat?.name || 'projeto'

  const parts: string[] = []

  const objective = answers.main_objective
  if (objective) parts.push(`Cliente deseja: ${objective.slice(0, 120)}`)

  const budget = answers.budget
  if (budget) parts.push(`Orçamento: ${budget}`)

  const deadline = answers.deadline
  if (deadline) parts.push(`Prazo: ${deadline}`)

  if (categoryId === 'GOOGLE_ADS' || categoryId === 'SEO_LOCAL') {
    const region = answers.target_region
    if (region) parts.push(`Foco na região: ${region}`)
    const adBudget = answers.ad_budget_monthly
    if (adBudget) parts.push(`Investimento mensal em anúncios: ${adBudget}`)
  }

  if (categoryId === 'WEBSITE' || categoryId === 'LANDING_PAGE') {
    const pages = answers.website_pages
    if (pages) parts.push(`Estrutura: ${pages}`)
    const style = answers.visual_style
    if (style) parts.push(`Estilo visual: ${style}`)
  }

  if (categoryId === 'WHATSAPP_AUTOMATION' || categoryId === 'CHATBOT') {
    const volume = answers.monthly_volume
    if (volume) parts.push(`Volume mensal: ${volume} atendimentos`)
  }

  if (categoryId === 'APP_MOBILE') {
    const platform = answers.platform
    if (platform) {
      const platforms = Array.isArray(platform) ? platform.join(' e ') : platform
      parts.push(`Plataformas: ${platforms}`)
    }
  }

  parts.push(`Categoria: ${catName}`)

  return parts.join('. ') + '.'
}

// ── Auto-messages between stages ──

export function getAutoMessage(stageId: string, answers: Record<string, any>): string | null {
  if (stageId === 'universal') return null

  const messages: Record<string, string> = {
    website: 'Ótimo! Um website profissional. Vamos definir os detalhes técnicos e visuais para criar algo realmente impactante.',
    landing_page: 'Uma landing page de alta conversão! Vamos aos detalhes para maximizar seus resultados.',
    google_ads: 'Perfeito! Agora precisamos entender melhor sua região e objetivo principal para montar uma estratégia mais eficiente.',
    seo_local: 'Excelente escolha! O SEO Local é fundamental para atrair clientes próximos. Vamos mapear sua região.',
    automation: 'Automação é o futuro! Vamos entender qual processo você quer otimizar para criar o fluxo perfeito.',
    chatbot: 'Um chatbot inteligente! Vamos definir o fluxo de conversa ideal para seus clientes.',
    app_mobile: 'Um app mobile! Vamos definir as plataformas e funcionalidades essenciais para o sucesso.',
    trafego_pago: 'Tráfego pago bem direcionado traz resultados rápidos. Vamos configurar a segmentação ideal.',
  }

  const firstAnswer = answers.project_name || answers.main_objective
  const name = typeof firstAnswer === 'string' ? firstAnswer.split(' ')[0] : ''

  const base = messages[stageId] || 'Vamos entender melhor os detalhes do seu projeto.'
  return name ? `${base.replace('Vamos', `Olá${name ? ' ' + name : ''}, vamos`)}` : base
}
