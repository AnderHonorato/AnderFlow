import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'Arquivo nao enviado' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')

    try {
      await writeFile(path.join(uploadDir, filename), buffer)
    } catch {
      await mkdir(uploadDir, { recursive: true })
      await writeFile(path.join(uploadDir, filename), buffer)
    }

    return NextResponse.json({
      url: `/uploads/${filename}`,
      name: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
