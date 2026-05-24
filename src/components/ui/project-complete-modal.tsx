'use client'

import { useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface ProjectCompleteModalProps {
  open: boolean
  projectName?: string
  projectId?: string
  onClose: () => void
}

export function ProjectCompleteModal({ open, projectName, projectId, onClose }: ProjectCompleteModalProps) {
  const router = useRouter()

  useEffect(() => {
    if (open) {
      import('canvas-confetti').then((confetti) => {
        confetti.default({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#E8622A', '#F0F0EB', '#3D9A6E', '#3A7AC4'],
        })
      }).catch(() => {})
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-[420px] text-center animate-scale-in">
        <div className="flex flex-col items-center gap-5 py-4">
          <span className="text-6xl animate-bounce">🎉</span>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[var(--text)]">
              Projeto Entregue!
            </h2>
            <p className="text-sm text-[var(--text-3)]">
              {projectName ? (
                <>
                  O projeto{' '}
                  <span className="text-[var(--accent)] font-medium">{projectName}</span>{' '}
                  foi concluído com sucesso.
                </>
              ) : (
                'Mais um projeto concluído com sucesso.'
              )}
            </p>
            <p className="text-xs text-[var(--text-3)] mt-2">
              🚀 Cada entrega é um passo a mais na sua jornada de transformação digital!
            </p>
          </div>
          <div className="flex gap-3 w-full">
            {projectId && (
              <Button
                variant="outline"
                className="flex-1 h-9 text-xs"
                onClick={() => { router.push(`/portal/feedback/${projectId}`); onClose() }}
              >
                Avaliar projeto
              </Button>
            )}
            <Button
              className={`${projectId ? 'flex-1' : 'w-full'} h-9 text-xs`}
              onClick={() => { router.push('/portal/projects'); onClose() }}
            >
              Ver todos meus projetos
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
