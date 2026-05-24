export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { verificarHierarquia } from '@/lib/hierarquia-server'
import { cargoParaNivel } from '@/lib/hierarquia'

/**
 * GET /api/auth/permissao
 * Retorna a verificação de hierarquia para o usuário autenticado.
 * Nunca expõe a estrutura completa — apenas dados mínimos.
 *
 * Query params:
 *   - userId (opcional): ID do usuário a verificar (requer permissão OWNER)
 *   - nivel (opcional): Verifica se o usuário tem nível mínimo
 *   - permissao (opcional): Verifica permissão específica
 *   - rota (opcional): Verifica acesso a uma rota
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token?.id) {
      return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
    }

    const url = new URL(request.url)
    const targetUserId = url.searchParams.get('userId') || (token.id as string)
    const nivelMinimo = url.searchParams.get('nivel')
    const permissao = url.searchParams.get('permissao')
    const rota = url.searchParams.get('rota')

    // Apenas OWNER pode verificar outros usuários via API
    if (targetUserId !== token.id) {
      const ownLevel = cargoParaNivel(token.role as string)
      if (ownLevel < 100) {
        return NextResponse.json({ erro: 'Sem permissão para consultar outro usuário.' }, { status: 403 })
      }
    }

    const resultado = await verificarHierarquia(targetUserId)

    if (!resultado.autorizado) {
      return NextResponse.json({
        autorizado: false,
        nivel: 0,
        cargo: 'GUEST',
        rotulo: 'Visitante',
        erro: resultado.erro || 'Usuário não autorizado.',
      }, { status: 403 })
    }

    const response: any = {
      autorizado: resultado.autorizado,
      nivel: resultado.nivel,
      cargo: resultado.cargoNormalizado,
      rotulo: resultado.rotulo,
    }

    if (nivelMinimo) {
      response.nivelSuficiente = resultado.nivel >= parseInt(nivelMinimo)
    }

    if (permissao) {
      response.temPermissao = resultado.nivel >= 100 || resultado.permissoes.includes(permissao)
    }

    if (rota) {
      response.temAcessoRota = resultado.rotas.includes('*') ||
        resultado.rotas.some(r => rota === r || rota.startsWith(r + '/'))
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json({ erro: 'Erro ao verificar permissões.' }, { status: 500 })
  }
}
