// Briefing questions template auto-generated when project is approved
export const BRIEFING_SECTIONS = [
  {
    title: 'Dados da Empresa',
    questions: [
      { key: 'companyName', label: 'Nome da Empresa', type: 'text', required: true },
      { key: 'contactName', label: 'Nome do Responsável', type: 'text', required: true },
      { key: 'whatsapp', label: 'WhatsApp', type: 'text', required: true },
      { key: 'phone', label: 'Telefone', type: 'text', required: false },
      { key: 'instagram', label: 'Instagram', type: 'text', required: false },
      { key: 'website', label: 'Site', type: 'text', required: false },
      { key: 'cityState', label: 'Cidade / Estado', type: 'text', required: true },
      { key: 'existenceTime', label: 'Há quanto tempo a empresa existe?', type: 'text', required: false },
      { key: 'businessHours', label: 'Horário de atendimento', type: 'text', required: false },
      { key: 'differential', label: 'Qual o diferencial da empresa?', type: 'textarea', required: false },
    ],
  },
  {
    title: 'Objetivos',
    questions: [
      { key: 'objectives', label: 'Quais objetivos deseja alcançar?', type: 'checkbox', options: [
        'Mais mensagens no WhatsApp', 'Mais ligações', 'Mais clientes',
        'Mais visibilidade', 'Aparecer acima dos concorrentes', 'Fortalecer marca',
        'Aumentar vendas', 'Melhorar reputação',
      ], required: true },
      { key: 'mainObjective', label: 'Explique melhor seu principal objetivo', type: 'textarea', required: false },
      { key: 'priority', label: 'Qual o nível de prioridade?', type: 'select', options: ['Urgente', 'Moderado', 'Sem pressa'], required: false },
      { key: 'startDate', label: 'Quando deseja começar?', type: 'select', options: ['Imediatamente', 'Ainda este mês', 'Nos próximos meses', 'Ainda estou analisando'], required: false },
    ],
  },
  {
    title: 'Situação Atual',
    questions: [
      { key: 'hadAds', label: 'Já fez anúncios antes?', type: 'select', options: ['Sim', 'Não'], required: false },
      { key: 'hadAgency', label: 'Já contratou agência ou gestor anteriormente?', type: 'select', options: ['Sim', 'Não'], required: false },
      { key: 'whatFailed', label: 'O que não funcionou anteriormente?', type: 'textarea', required: false },
      { key: 'monthlyContacts', label: 'Quantos contatos ou mensagens recebe atualmente por mês?', type: 'text', required: false },
      { key: 'conversionRate', label: 'Quantos desses contatos viram clientes?', type: 'text', required: false },
      { key: 'difficulties', label: 'Quais dificuldades enfrenta atualmente?', type: 'checkbox', options: [
        'Poucas mensagens', 'Baixa visibilidade', 'Concorrência forte', 'Poucas avaliações',
        'Anúncios sem resultado', 'Poucos clientes', 'Falta de estratégia',
      ], required: false },
    ],
  },
  {
    title: 'Público-Alvo',
    questions: [
      { key: 'targetAudience', label: 'Quem é o público principal da empresa?', type: 'textarea', required: false },
      { key: 'targetRegions', label: 'Quais bairros, cidades ou regiões deseja atingir?', type: 'textarea', required: false },
      { key: 'priorityRegion', label: 'Existe alguma região prioritária?', type: 'text', required: false },
      { key: 'competitors', label: 'Quais concorrentes considera mais fortes?', type: 'textarea', required: false },
      { key: 'referenceCompany', label: 'Existe alguma empresa que considera referência?', type: 'textarea', required: false },
    ],
  },
  {
    title: 'Serviços Desejados',
    questions: [
      { key: 'services', label: 'Quais serviços deseja contratar?', type: 'checkbox', options: [
        'Google Perfil da Empresa', 'Google Ads', 'SEO Local', 'Google Maps',
        'Landing Page', 'Website', 'Automação WhatsApp', 'CRM', 'Dashboard',
        'Consultoria', 'Gestão Mensal', 'Estratégia Local', 'Análise de Concorrência',
      ], required: true },
    ],
  },
  {
    title: 'Visual e Identidade',
    questions: [
      { key: 'hasVisualIdentity', label: 'Possui identidade visual profissional?', type: 'select', options: ['Sim', 'Não'], required: false },
      { key: 'hasProfessionalPhotos', label: 'Possui fotos profissionais da empresa?', type: 'select', options: ['Sim', 'Não'], required: false },
      { key: 'wantsVisualImprovement', label: 'Deseja melhorar aparência e organização do perfil?', type: 'select', options: ['Sim', 'Não'], required: false },
    ],
  },
  {
    title: 'Investimento',
    questions: [
      { key: 'budget', label: 'Qual orçamento confortável hoje?', type: 'select', options: [
        'Até R$ 300', 'R$ 300 a R$ 500', 'R$ 500 a R$ 1.000', 'R$ 1.000 a R$ 3.000', 'R$ 3.000+',
      ], required: false },
      { key: 'paymentPreference', label: 'Como prefere investir?', type: 'select', options: [
        'Pagamento único', 'Mensal', 'Trimestral', 'Semestral', 'Anual', 'Parcelado',
      ], required: false },
      { key: 'monthlyFollowup', label: 'Tem interesse em acompanhamento mensal?', type: 'select', options: ['Sim', 'Não', 'Talvez'], required: false },
      { key: 'adBudget', label: 'Quanto pretende investir mensalmente em anúncios?', type: 'text', required: false },
    ],
  },
  {
    title: 'Contato e Processo',
    questions: [
      { key: 'contactPreference', label: 'Qual melhor forma de contato?', type: 'select', options: ['WhatsApp', 'Ligação', 'Email'], required: false },
      { key: 'bestContactTime', label: 'Melhor horário para contato', type: 'text', required: false },
      { key: 'currentProcess', label: 'Como funciona o atendimento hoje?', type: 'textarea', required: false },
      { key: 'hasWhatsappBusiness', label: 'Utiliza WhatsApp Business?', type: 'select', options: ['Sim', 'Não'], required: false },
    ],
  },
  {
    title: 'Informações Finais',
    questions: [
      { key: 'whatMakesItWorth', label: 'O que faria esse projeto valer a pena para você?', type: 'textarea', required: false },
      { key: 'additionalNotes', label: 'Observações adicionais', type: 'textarea', required: false },
      { key: 'howFoundUs', label: 'Como conheceu nosso serviço?', type: 'text', required: false },
    ],
  },
]
