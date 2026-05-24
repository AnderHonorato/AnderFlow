import 'server-only'

import { prisma } from '@/lib/banco/conexao'
import {
  HIERARQUIA,
  normalizarCargo,
  type Cargo,
  type Permissao,
  type ResultadoVerificacao,
} from '@/lib/hierarquia'

// ═══════════════════════════════════════════════════════
// HIERARQUIA SERVER — Verificador com banco de dados
// SERVER-ONLY — Nunca importado no frontend
// ═══════════════════════════════════════════════════════

const MAPA_POR_CARGO = new Map<Cargo, typeof HIERARQUIA[number]>()
for (const def of HIERARQUIA) {
  MAPA_POR_CARGO.set(def.cargo, def)
}

// ─── Cache de verificação (5 minutos) ───
interface CacheEntry {
  result: ResultadoVerificacao
  ts: number
}
const cacheVerificacao = new Map<string, CacheEntry>()
const CACHE_TTL = 5 * 60 * 1000

function limparCacheExpirado() {
  const agora = Date.now()
  for (const [key, entry] of cacheVerificacao) {
    if (agora - entry.ts > CACHE_TTL) cacheVerificacao.delete(key)
  }
}
if (typeof setInterval !== 'undefined') {
  setInterval(limparCacheExpirado, 60_000)
}

// ─── Tipos internos ───
interface DadosUsuario {
  id: string
  email: string
  role: string | null
  permissions: string | null
  isActive: boolean
}

// ═══════════════════════════════════════════════════════
// VERIFICADOR CENTRAL (com banco de dados)
// ═══════════════════════════════════════════════════════

async function buscarUsuarioPorId(userId: string): Promise<DadosUsuario | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, permissions: true, isActive: true },
    })
    return user as DadosUsuario | null
  } catch {
    return null
  }
}

function resultadoNegado(erro: string): ResultadoVerificacao {
  return {
    autorizado: false,
    nivel: 0,
    cargo: 'GUEST',
    cargoNormalizado: 'GUEST',
    rotulo: 'Visitante',
    permissoes: [],
    podeGerenciar: [],
    rotas: [],
    erro,
  }
}

/**
 * Verificador principal — rápido, com cache, consulta o banco.
 *
 * @param userId - ID do usuário no banco
 * @param forceDb - Se true, ignora cache e consulta o banco
 */
export async function verificarHierarquia(
  userId: string,
  forceDb = false
): Promise<ResultadoVerificacao> {
  if (!userId) {
    return resultadoNegado('ID de usuário não fornecido.')
  }

  if (!forceDb) {
    const cached = cacheVerificacao.get(userId)
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return cached.result
    }
  }

  const usuario = await buscarUsuarioPorId(userId)

  if (!usuario) {
    const resultado = resultadoNegado('Usuário não encontrado no sistema.')
    cacheVerificacao.set(userId, { result: resultado, ts: Date.now() })
    return resultado
  }

  if (!usuario.isActive) {
    const resultado = resultadoNegado('Conta desativada.')
    cacheVerificacao.set(userId, { result: resultado, ts: Date.now() })
    return resultado
  }

  const cargo = normalizarCargo(usuario.role)
  const definicao = MAPA_POR_CARGO.get(cargo)

  if (!definicao) {
    const resultado = resultadoNegado('Cargo não reconhecido no sistema.')
    cacheVerificacao.set(userId, { result: resultado, ts: Date.now() })
    return resultado
  }

  let permissoesCustomizadas: string[] = []
  try {
    if (usuario.permissions && usuario.permissions !== '[]') {
      permissoesCustomizadas = JSON.parse(usuario.permissions)
    }
  } catch { /* ignora JSON inválido */ }

  const permissoesEfetivas = cargo === 'OWNER'
    ? definicao.permissoesPadrao
    : (permissoesCustomizadas.length > 0 ? permissoesCustomizadas : definicao.permissoesPadrao)

  const resultado: ResultadoVerificacao = {
    autorizado: true,
    nivel: definicao.nivel,
    cargo: usuario.role || 'GUEST',
    cargoNormalizado: cargo,
    rotulo: definicao.rotulo,
    permissoes: permissoesEfetivas,
    podeGerenciar: definicao.podeGerenciarCargos,
    rotas: definicao.rotasPermitidas,
  }

  cacheVerificacao.set(userId, { result: resultado, ts: Date.now() })
  return resultado
}

// ═══════════════════════════════════════════════════════
// FUNÇÕES DE VERIFICAÇÃO RÁPIDA (com DB)
// ═══════════════════════════════════════════════════════

export async function verificarNivelMinimo(userId: string, nivelMinimo: number): Promise<boolean> {
  const r = await verificarHierarquia(userId)
  return r.autorizado && r.nivel >= nivelMinimo
}

export async function verificarPermissao(userId: string, permissao: Permissao): Promise<boolean> {
  const r = await verificarHierarquia(userId)
  if (!r.autorizado || r.nivel >= 100) return r.autorizado && r.nivel >= 100
  return r.permissoes.includes(permissao)
}

export async function verificarGerenciamentoCargo(
  userId: string,
  cargoAlvo: Cargo
): Promise<boolean> {
  const r = await verificarHierarquia(userId)
  if (!r.autorizado) return false
  if (r.nivel >= 100) return true
  return r.podeGerenciar.includes(cargoAlvo)
}

export async function verificarAcessoRota(userId: string, rota: string): Promise<boolean> {
  const r = await verificarHierarquia(userId)
  if (!r.autorizado) return false
  if (r.rotas.includes('*')) return true
  return r.rotas.some(rr => rota === rr || rota.startsWith(rr + '/'))
}

// ═══════════════════════════════════════════════════════
// CACHE
// ═══════════════════════════════════════════════════════

export function invalidarCache(userId: string) {
  cacheVerificacao.delete(userId)
}

export function invalidarCacheCompleto() {
  cacheVerificacao.clear()
}
