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
  { id: 'GOOGLE_ADS', name: 'Google Ads', icon: 'google_ads', description: 'Campanhas patrocinadas no Google' },
  { id: 'SEO_LOCAL', name: 'SEO Local', icon: 'seo_local', description: 'Posicionamento no Google Maps' },
  { id: 'WEBSITE', name: 'Website', icon: 'website', description: 'Site institucional ou landing page' },
  { id: 'LANDING_PAGE', name: 'Landing Page', icon: 'landing_page', description: 'Pagina de conversao' },
  { id: 'SAAS', name: 'Sistema SaaS', icon: 'saas', description: 'Sistema web completo' },
  { id: 'DASHBOARD', name: 'Dashboard', icon: 'dashboard', description: 'Painel de controle' },
  { id: 'WHATSAPP_AUTOMATION', name: 'Automacao WhatsApp', icon: 'whatsapp', description: 'Chatbot e fluxos' },
  { id: 'CRM', name: 'CRM', icon: 'crm', description: 'Gestao de relacionamento' },
  { id: 'APP_MOBILE', name: 'App Mobile', icon: 'app_mobile', description: 'Android e/ou iOS' },
  { id: 'API_INTEGRATION', name: 'API/Integracao', icon: 'api', description: 'Conexao entre sistemas' },
  { id: 'ERP', name: 'ERP', icon: 'erp', description: 'Gestao empresarial' },
  { id: 'CHATBOT', name: 'Chatbot', icon: 'chatbot', description: 'Atendimento automatico' },
  { id: 'BRANDING', name: 'Branding', icon: 'branding', description: 'Identidade visual' },
  { id: 'SOCIAL_MEDIA', name: 'Social Media', icon: 'social_media', description: 'Gestao de redes sociais' },
  { id: 'TRAFEGO_PAGO', name: 'Trafego Pago', icon: 'trafego_pago', description: 'Anuncios em plataformas' },
  { id: 'OTHER', name: 'Outro', icon: 'other', description: 'Outro tipo de servico' },
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

// ── SaaS Stage ──

const SAAS_STAGE: BriefingStage = {
  id: 'saas',
  title: 'Especificações SaaS',
  autoMessage: 'Um sistema SaaS! Vamos definir a arquitetura, recursos e modelo de negócio.',
  questions: [
    { id: 'saas_type', label: 'Tipo de SaaS', type: 'select', required: true, options: ['B2B (Empresas)', 'B2C (Consumidores)', 'Marketplace', 'Plataforma interna', 'White-label'] },
    { id: 'users_scale', label: 'Escala de usuários esperada', type: 'select', required: true, options: ['Até 100', '100-1000', '1000-10k', '10k-100k', '100k+'] },
    { id: 'core_features', label: 'Funcionalidades principais', type: 'textarea', required: true, placeholder: 'Liste as funcionalidades essenciais do sistema' },
    { id: 'user_roles', label: 'Tipos de usuários/perfis', type: 'multiselect', required: true, options: ['Admin', 'Gerente', 'Operador', 'Cliente final', 'Visitante', 'API/Integração'] },
    { id: 'monetization', label: 'Modelo de monetização', type: 'select', required: false, options: ['Assinatura mensal', 'Assinatura anual', 'Freemium', 'Pagamento por uso', 'Licença única', 'A definir'] },
    { id: 'integrations_needed', label: 'Integrações externas', type: 'multiselect', required: false, options: ['Pagamento (Stripe/MercadoPago)', 'Email (SendGrid/Resend)', 'SMS/WhatsApp', 'Google/SSO', 'API REST pública', 'Webhooks'] },
    { id: 'compliance', label: 'Requisitos de compliance', type: 'select', required: false, options: ['LGPD', 'PCI-DSS', 'SOC2', 'ISO 27001', 'Nenhum específico'] },
    { id: 'deployment', label: 'Infraestrutura preferida', type: 'select', required: false, options: ['Cloud (AWS/GCP/Azure)', 'VPS', 'On-premise', 'Não sei/Preciso orientação'] },
  ],
}

// ── Dashboard Stage ──

const DASHBOARD_STAGE: BriefingStage = {
  id: 'dashboard',
  title: 'Especificações do Dashboard',
  autoMessage: 'Um dashboard personalizado! Vamos mapear as métricas e fontes de dados que você precisa visualizar.',
  questions: [
    { id: 'dashboard_purpose', label: 'Objetivo do dashboard', type: 'select', required: true, options: ['Vendas/Receita', 'Marketing/Métricas', 'Operacional/Logística', 'Financeiro', 'RH/People Analytics', 'Multi-área'] },
    { id: 'data_sources', label: 'Fontes de dados', type: 'multiselect', required: true, options: ['Banco SQL', 'API externa', 'Google Sheets', 'CSV/Excel', 'Google Analytics', 'Meta Ads', 'CRM existente', 'ERP existente'] },
    { id: 'update_frequency', label: 'Frequência de atualização', type: 'select', required: true, options: ['Tempo real', 'A cada 5 min', 'A cada 1 hora', 'Diária', 'Semanal'] },
    { id: 'key_metrics', label: 'Métricas principais (KPIs)', type: 'textarea', required: true, placeholder: 'Ex: Receita mensal, CAC, LTV, Churn rate, etc.' },
    { id: 'visualizations', label: 'Tipos de visualização', type: 'multiselect', required: false, options: ['Gráfico de linha', 'Gráfico de barra', 'Pizza/Donut', 'Tabela dinâmica', 'Mapa de calor', 'Funil', 'Cartão/KPI', 'Série temporal'] },
    { id: 'users_dashboard', label: 'Quantos usuários acessarão?', type: 'select', required: false, options: ['1-5', '5-20', '20-100', '100+'] },
    { id: 'export_needs', label: 'Precisa exportar relatórios?', type: 'select', required: false, options: ['Sim (PDF)', 'Sim (Excel)', 'Sim (ambos)', 'Não'] },
    { id: 'alerts', label: 'Precisa de alertas/notificações?', type: 'select', required: false, options: ['Sim, por email', 'Sim, no dashboard', 'Sim, WhatsApp', 'Não'] },
  ],
}

// ── ERP Stage ──

const ERP_STAGE: BriefingStage = {
  id: 'erp',
  title: 'Módulos do ERP',
  autoMessage: 'Um ERP completo! Vamos mapear os módulos e processos que precisam ser integrados.',
  questions: [
    { id: 'erp_modules', label: 'Módulos necessários', type: 'multiselect', required: true, options: ['Financeiro', 'Estoque', 'Vendas/Pedidos', 'Compras', 'Fiscal/NF-e', 'RH/Folha', 'CRM', 'Produção', 'Logística', 'Projetos'] },
    { id: 'company_size', label: 'Porte da empresa', type: 'select', required: true, options: ['Micro (1-10 func.)', 'Pequena (10-50)', 'Média (50-250)', 'Grande (250+)'] },
    { id: 'current_system', label: 'Sistema atual (se houver)', type: 'text', required: false, placeholder: 'Nome do ERP/sistema atual' },
    { id: 'migration_needed', label: 'Precisa migrar dados?', type: 'select', required: true, options: ['Sim, migração completa', 'Sim, parcial', 'Não, começar do zero'] },
    { id: 'branches', label: 'Possui filiais/unidades?', type: 'select', required: false, options: ['1 unidade', '2-5', '5-10', '10+'] },
    { id: 'fiscal_requirements', label: 'Requisitos fiscais', type: 'multiselect', required: false, options: ['NF-e', 'NFC-e', 'CT-e', 'SPED Fiscal', 'SPED Contribuições', 'eSocial', 'Não sei'] },
    { id: 'user_count_erp', label: 'Quantos usuários simultâneos?', type: 'select', required: false, options: ['1-5', '5-20', '20-50', '50+'] },
  ],
}

// ── Branding Stage ──

const BRANDING_STAGE: BriefingStage = {
  id: 'branding',
  title: 'Identidade Visual',
  autoMessage: 'Branding é a alma da empresa! Vamos criar uma identidade que comunique exatamente o que você representa.',
  questions: [
    { id: 'branding_scope', label: 'O que precisa?', type: 'multiselect', required: true, options: ['Logotipo', 'Paleta de cores', 'Tipografia', 'Manual de marca', 'Papelaria (cartão, envelope)', 'Apresentação institucional', 'Redesign completo'] },
    { id: 'brand_personality', label: 'Personalidade da marca', type: 'select', required: true, options: ['Moderna/Inovadora', 'Tradicional/Confiança', 'Jovem/Descolada', 'Premium/Luxo', 'Divertida/Criativa', 'Minimalista/Elegante'] },
    { id: 'brand_values', label: 'Valores da empresa (3 palavras)', type: 'text', required: false, placeholder: 'Ex: Inovação, Confiança, Agilidade' },
    { id: 'target_perception', label: 'Como quer ser percebido?', type: 'textarea', required: false, placeholder: 'Ex: Empresa sólida e confiável que entrega resultados rapidamente' },
    { id: 'existing_brand', label: 'Já possui marca atual?', type: 'select', required: false, options: ['Sim, quero modernizar', 'Sim, quero manter elementos', 'Não, do zero'] },
    { id: 'competitor_brands', label: 'Marcas que admira (referência)', type: 'textarea', required: false, placeholder: 'Cole links ou nomes de marcas que você gosta' },
    { id: 'applications', label: 'Onde a marca será usada?', type: 'multiselect', required: false, options: ['Site', 'Redes sociais', 'Uniforme', 'Fachada', 'Veículos', 'Embalagens', 'App', 'Material impresso'] },
  ],
}

// ── Social Media Stage ──

const SOCIAL_MEDIA_STAGE: BriefingStage = {
  id: 'social_media',
  title: 'Estratégia de Redes Sociais',
  autoMessage: 'Redes sociais bem geridas transformam seguidores em clientes! Vamos definir a estratégia ideal.',
  questions: [
    { id: 'platforms_social', label: 'Plataformas desejadas', type: 'multiselect', required: true, options: ['Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'YouTube', 'Twitter/X', 'Pinterest', 'Todas'] },
    { id: 'content_type', label: 'Tipo de conteúdo', type: 'multiselect', required: true, options: ['Fotos profissionais', 'Vídeos/Reels', 'Stories diários', 'Carrosséis informativos', 'Textos/Artigos', 'Transmissões ao vivo'] },
    { id: 'posting_frequency', label: 'Frequência de postagem', type: 'select', required: true, options: ['1x por dia', '3-4x por semana', '1-2x por semana', 'Apenas stories', 'A definir'] },
    { id: 'social_goals', label: 'Objetivos principais', type: 'multiselect', required: true, options: ['Aumentar seguidores', 'Gerar leads/vendas', 'Fortalecer marca', 'Engajamento', 'Tráfego para site', 'Autoridade no nicho'] },
    { id: 'has_content', label: 'Já produz conteúdo?', type: 'select', required: false, options: ['Sim, tenho fotos/vídeos', 'Sim, mas precisa melhorar', 'Não, preciso de tudo'] },
    { id: 'tone_voice', label: 'Tom de voz desejado', type: 'select', required: false, options: ['Profissional', 'Amigável/Próximo', 'Inspirador', 'Técnico/Especialista', 'Descontraído'] },
    { id: 'budget_ads_social', label: 'Orçamento para impulsionamento', type: 'select', required: false, options: ['Orgânico (sem anúncios)', 'Até R$ 300/mês', 'R$ 300-1000/mês', 'R$ 1000-3000/mês', 'R$ 3000+/mês'] },
  ],
}

// ── CRM Stage ──

const CRM_STAGE: BriefingStage = {
  id: 'crm',
  title: 'Configuração do CRM',
  autoMessage: 'Um CRM eficiente transforma seu relacionamento com clientes! Vamos mapear seu funil e necessidades.',
  questions: [
    { id: 'crm_purpose', label: 'Objetivo principal do CRM', type: 'select', required: true, options: ['Gestão de leads/vendas', 'Pós-venda/suporte', 'Relacionamento/fidelização', 'Automação de marketing', 'Integrado (tudo)'] },
    { id: 'pipeline_stages', label: 'Etapas do funil de vendas', type: 'textarea', required: true, placeholder: 'Descreva as etapas: Ex: Lead → Contato → Proposta → Negociação → Fechado' },
    { id: 'team_size_crm', label: 'Tamanho da equipe de vendas', type: 'select', required: false, options: ['1-3', '3-10', '10-25', '25+'] },
    { id: 'current_crm_tool', label: 'Usa algum CRM atualmente?', type: 'select', required: false, options: ['Sim (migrar dados)', 'Sim (substituir)', 'Não, primeiro CRM'] },
    { id: 'automation_needs', label: 'Automações desejadas', type: 'multiselect', required: false, options: ['Email automático', 'Lembretes de follow-up', 'Atribuição de leads', 'Sequências de email', 'Relatórios automáticos', 'Integração WhatsApp'] },
    { id: 'integrations_crm', label: 'Integrações necessárias', type: 'multiselect', required: false, options: ['WhatsApp', 'Email', 'Calendário', 'ERP', 'Site/Landing Page', 'API de pagamento'] },
  ],
}

// ── API Integration Stage ──

const API_INTEGRATION_STAGE: BriefingStage = {
  id: 'api_integration',
  title: 'Especificações da Integração',
  autoMessage: 'Integrar sistemas é essencial para automação! Vamos mapear os sistemas e o fluxo de dados.',
  questions: [
    { id: 'systems_connect', label: 'Sistemas a conectar', type: 'textarea', required: true, placeholder: 'Ex: ERP Totvs ↔ Shopify, ou CRM ↔ WhatsApp API' },
    { id: 'integration_direction', label: 'Direção da integração', type: 'select', required: true, options: ['Unidirecional (A → B)', 'Bidirecional (A ↔ B)', 'Múltiplos sistemas'] },
    { id: 'data_volume', label: 'Volume de dados', type: 'select', required: false, options: ['Baixo (<1000/dia)', 'Médio (1k-10k/dia)', 'Alto (10k-100k/dia)', 'Muito alto (100k+/dia)'] },
    { id: 'sync_frequency', label: 'Frequência de sincronização', type: 'select', required: true, options: ['Tempo real', 'A cada 5 minutos', 'A cada 1 hora', 'Diária', 'Sob demanda'] },
    { id: 'auth_method', label: 'Método de autenticação', type: 'select', required: false, options: ['API Key', 'OAuth 2.0', 'JWT', 'Basic Auth', 'Não sei/ definido pelo sistema'] },
    { id: 'fallback_needed', label: 'Precisa de fallback/retry?', type: 'select', required: false, options: ['Sim, crítico (precisa garantir)', 'Sim, com notificação de falha', 'Não'] },
    { id: 'has_api_docs', label: 'Os sistemas possuem documentação de API?', type: 'select', required: false, options: ['Sim, todos', 'Apenas alguns', 'Não sei', 'Não, precisa pesquisar'] },
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
    case 'SAAS':
      specificStage = SAAS_STAGE
      break
    case 'DASHBOARD':
      specificStage = DASHBOARD_STAGE
      break
    case 'ERP':
      specificStage = ERP_STAGE
      break
    case 'BRANDING':
      specificStage = BRANDING_STAGE
      break
    case 'SOCIAL_MEDIA':
      specificStage = SOCIAL_MEDIA_STAGE
      break
    case 'CRM':
      specificStage = CRM_STAGE
      break
    case 'API_INTEGRATION':
      specificStage = API_INTEGRATION_STAGE
      break
    default:
      specificStage = DEFAULT_SPECIFIC_STAGE
  }

  return {
    id: categoryId,
    name,
    icon: cat?.icon || 'other',
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

  if (categoryId === 'SAAS') {
    const saasType = answers.saas_type
    if (saasType) parts.push(`Tipo: ${saasType}`)
    const users = answers.users_scale
    if (users) parts.push(`Escala: ${users} usuários`)
  }

  if (categoryId === 'ERP') {
    const modules = answers.erp_modules
    if (modules) {
      const mods = Array.isArray(modules) ? modules.join(', ') : modules
      parts.push(`Módulos: ${mods}`)
    }
  }

  if (categoryId === 'BRANDING') {
    const scope = answers.branding_scope
    if (scope) {
      const items = Array.isArray(scope) ? scope.join(', ') : scope
      parts.push(`Escopo: ${items}`)
    }
  }

  if (categoryId === 'DASHBOARD') {
    const purpose = answers.dashboard_purpose
    if (purpose) parts.push(`Foco: ${purpose}`)
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
    saas: 'Um SaaS escalável! Vamos definir a arquitetura e funcionalidades que vão fazer seu produto decolar.',
    dashboard: 'Um dashboard poderoso transforma dados em decisões! Vamos mapear cada métrica importante.',
    erp: 'Um ERP bem estruturado integra todos os processos! Vamos definir os módulos essenciais.',
    branding: 'Sua marca é seu ativo mais valioso! Vamos criar uma identidade que comunique sua essência.',
    social_media: 'Redes sociais são vitrine 24h! Vamos criar uma estratégia que engaja e converte.',
    crm: 'Um CRM inteligente organiza seu relacionamento! Vamos mapear seu funil de ponta a ponta.',
    api_integration: 'Integrações bem feitas eliminam trabalho manual! Vamos conectar seus sistemas com eficiência.',
  }

  const firstAnswer = answers.project_name || answers.main_objective
  const name = typeof firstAnswer === 'string' ? firstAnswer.split(' ')[0] : ''

  const base = messages[stageId] || 'Vamos entender melhor os detalhes do seu projeto.'
  return name ? `${base.replace('Vamos', `Olá${name ? ' ' + name : ''}, vamos`)}` : base
}
