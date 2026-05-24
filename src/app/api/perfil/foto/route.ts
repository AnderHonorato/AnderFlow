import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/autenticacao/config'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { z } from 'zod'

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const TAMANHO_MAXIMO = 5 * 1024 * 1024

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ erro: 'Nao autorizado' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const foto = formData.get('foto') as File | null

    if (!foto) {
      return NextResponse.json({ erro: 'Arquivo obrigatorio' }, { status: 400 })
    }

    if (!TIPOS_PERMITIDOS.includes(foto.type)) {
      return NextResponse.json({ erro: 'Tipo de arquivo nao permitido. Use JPG, PNG, WebP ou GIF.' }, { status: 400 })
    }

    if (foto.size > TAMANHO_MAXIMO) {
      return NextResponse.json({ erro: 'Arquivo muito grande. Maximo 5MB.' }, { status: 400 })
    }

    const bytes = await foto.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const extensao = foto.name.split('.').pop()?.toLowerCase() || 'jpg'
    const nomeArquivo = `perfil-${session.user.id}-${Date.now()}.${extensao}`
    const dirPerfil = path.join(process.cwd(), 'public', 'uploads', 'perfil')

    try {
      await writeFile(path.join(dirPerfil, nomeArquivo), buffer)
    } catch {
      await mkdir(dirPerfil, { recursive: true })
      await writeFile(path.join(dirPerfil, nomeArquivo), buffer)
    }

    const url = `/uploads/perfil/${nomeArquivo}`

    return NextResponse.json({
      url,
      mensagem: 'Foto atualizada com sucesso',
    })
  } catch (erro: any) {
    return NextResponse.json({ erro: erro.message || 'Erro ao processar upload' }, { status: 500 })
  }
}
