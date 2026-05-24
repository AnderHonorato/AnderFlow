export interface IconCategory {
  id: string
  label: string
  description: string
  keywords: string[]
  prefix: string
  size: number // default icon size
}

export const CATEGORIES: IconCategory[] = [
  { id: 'status', label: 'Status/Indicadores', description: 'Indicadores de estado: ok, erro, aviso, info, loading', keywords: ['status', 'indicador', 'estado', 'resultado'], prefix: 'status', size: 18 },
  { id: 'actions', label: 'Acoes/Botoes', description: 'Acoes: editar, buscar, enviar, baixar, salvar, filtrar', keywords: ['acao', 'botao', 'interacao', 'clique'], prefix: 'action', size: 18 },
  { id: 'arrows', label: 'Setas/Navegacao', description: 'Setas direcionais, navegacao, ciclo, expandir', keywords: ['seta', 'navegacao', 'direcao', 'voltar', 'avancar'], prefix: 'arrow', size: 18 },
  { id: 'documents', label: 'Documentos/Arquivos', description: 'Documentos, arquivos, pastas, tipos de arquivo', keywords: ['documento', 'arquivo', 'pasta', 'pdf', 'csv'], prefix: 'doc', size: 18 },
  { id: 'communication', label: 'Comunicacao', description: 'Chat, email, telefone, mensagens, notificacoes', keywords: ['comunicacao', 'mensagem', 'chat', 'email', 'telefone'], prefix: 'comm', size: 18 },
  { id: 'users', label: 'Usuarios/Pessoas', description: 'Usuario, perfil, equipe, contato, cliente', keywords: ['usuario', 'pessoa', 'perfil', 'equipe', 'cliente'], prefix: 'user', size: 18 },
  { id: 'finance', label: 'Financeiro/Pagamentos', description: 'Dinheiro, cartao, carteira, fatura, cobranca', keywords: ['financeiro', 'pagamento', 'dinheiro', 'cobranca', 'fatura'], prefix: 'fin', size: 18 },
  { id: 'time', label: 'Tempo/Calendario', description: 'Calendario, relogio, timer, prazo, cronograma', keywords: ['tempo', 'calendario', 'prazo', 'cronograma', 'horario'], prefix: 'time', size: 18 },
  { id: 'security', label: 'Seguranca', description: 'Cadeado, escudo, chave, autenticacao, permissao', keywords: ['seguranca', 'cadeado', 'protecao', 'autenticacao'], prefix: 'sec', size: 18 },
  { id: 'analytics', label: 'Analytics/Graficos', description: 'Graficos, metricas, dashboard, relatorios, dados', keywords: ['analytics', 'grafico', 'metrica', 'relatorio', 'dado'], prefix: 'ana', size: 18 },
  { id: 'dev', label: 'Desenvolvimento/Codigo', description: 'Codigo, terminal, git, banco de dados, deploy', keywords: ['codigo', 'dev', 'programacao', 'git', 'banco'], prefix: 'dev', size: 18 },
  { id: 'business', label: 'Negocios/CRM', description: 'Projeto, briefcase, proposta, contrato, lead, funil', keywords: ['negocio', 'crm', 'projeto', 'proposta', 'lead'], prefix: 'biz', size: 22 },
  { id: 'devices', label: 'Dispositivos', description: 'Computador, celular, tablet, servidor, monitor', keywords: ['dispositivo', 'computador', 'celular', 'servidor'], prefix: 'device', size: 18 },
  { id: 'nature', label: 'Natureza/Clima', description: 'Sol, lua, nuvem, chuva, estrela, folha', keywords: ['natureza', 'clima', 'tempo', 'ceu', 'planta'], prefix: 'nat', size: 18 },
  { id: 'food', label: 'Alimentacao', description: 'Comida, bebida, cafe, restaurante', keywords: ['comida', 'alimentacao', 'restaurante', 'cafe'], prefix: 'food', size: 18 },
  { id: 'transport', label: 'Transporte/Logistica', description: 'Carro, caminhao, aviao, navio, entrega', keywords: ['transporte', 'logistica', 'entrega', 'veiculo'], prefix: 'trans', size: 18 },
  { id: 'health', label: 'Saude/Medico', description: 'Hospital, medico, coracao, remedio', keywords: ['saude', 'medico', 'hospital', 'bem-estar'], prefix: 'med', size: 18 },
  { id: 'education', label: 'Educacao', description: 'Livro, escola, graduacao, certificado, aprendizado', keywords: ['educacao', 'livro', 'aprendizado', 'escola'], prefix: 'edu', size: 18 },
  { id: 'media', label: 'Midia/Entretenimento', description: 'Video, musica, imagem, camera, microfone', keywords: ['midia', 'video', 'musica', 'camera', 'imagem'], prefix: 'media', size: 18 },
  { id: 'emoji', label: 'Emojis/Sentimentos', description: 'Felicidade, tristeza, amor, surpresa, ideia', keywords: ['emoji', 'sentimento', 'emocao', 'reacao'], prefix: 'emoji', size: 22 },
  { id: 'animated', label: 'Figurinhas Animadas', description: 'Figurinhas com animacao CSS/SVG', keywords: ['animado', 'figurinha', 'gif', 'movimento'], prefix: 'fig', size: 28 },
  { id: 'badges', label: 'Badges/Etiquetas', description: 'Etiquetas pequenas: novo, pro, beta, vip, hot', keywords: ['badge', 'etiqueta', 'selo', 'tag', 'rotulo'], prefix: 'mini', size: 16 },
  { id: 'illustrations', label: 'Ilustracoes Grandes', description: 'Ilustracoes maiores para destaque visual', keywords: ['ilustracao', 'grande', 'destaque', 'hero'], prefix: 'illu', size: 48 },
  { id: 'flow', label: 'Fluxo AnderFlow', description: 'Icones das 12 etapas do fluxo AnderFlow', keywords: ['anderflow', 'fluxo', 'etapa', 'projeto'], prefix: 'flow', size: 22 },
  { id: 'ornaments', label: 'Ornamentos/Divisores', description: 'Decoracoes, divisores, molduras, linhas', keywords: ['ornamento', 'divisor', 'decoracao', 'linha'], prefix: 'deco', size: 22 },
]

export function getCategoryByPrefix(prefix: string): IconCategory | undefined {
  return CATEGORIES.find(c => c.prefix === prefix)
}

export function searchIcons(keyword: string): IconCategory[] {
  const kw = keyword.toLowerCase()
  return CATEGORIES.filter(c =>
    c.label.toLowerCase().includes(kw) ||
    c.keywords.some(k => k.includes(kw)) ||
    c.id.includes(kw)
  )
}
