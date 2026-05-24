import { ImageResponse } from 'next/og'
import { prisma } from '@/lib/prisma'

export const runtime = 'edge'

export const size = { width: 1200, height: 630 }

export const contentType = 'image/png'

export default async function OGImage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { client: { select: { name: true } } },
  })

  const projectName = project?.name || 'Projeto'
  const clientName = project?.client?.name || 'Cliente'
  const progress = project?.progress || 0

  return new ImageResponse(
    (
      <div
        style={{
          background: '#0A0A0F',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: 60,
          justifyContent: 'space-between',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div style={{ color: '#E8622A', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>
          ANDERFLOW
        </div>
        <div>
          <div style={{ color: '#F0F0EB', fontSize: 48, fontWeight: 700, letterSpacing: '-0.02em' }}>
            {projectName}
          </div>
          <div style={{ color: '#A8A8A2', fontSize: 24, marginTop: 12 }}>
            Cliente: {clientName}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#E8622A', height: 8, width: progress * 8, borderRadius: 4 }} />
          <span style={{ color: '#A8A8A2', fontSize: 20 }}>{progress}% concluído</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
