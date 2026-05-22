'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import SignaturePadLib from 'signature_pad'
import { Button } from '@/components/ui/button'

interface SignaturePadProps {
  onSign: (base64: string) => void
  onCancel?: () => void
}

export function SignaturePad({ onSign, onCancel }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const padRef = useRef<SignaturePadLib | null>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * 2
      canvas.height = rect.height * 2
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.scale(2, 2)
    }

    resizeCanvas()

    const pad = new SignaturePadLib(canvas, {
      penColor: '#F0F0EB',
      backgroundColor: 'transparent',
      minWidth: 1.2,
      maxWidth: 2.5,
    })

    pad.addEventListener('beginStroke', () => setIsEmpty(false))
    pad.addEventListener('endStroke', () => setIsEmpty(pad.isEmpty()))

    padRef.current = pad

    const onResize = () => {
      const data = pad.toData()
      resizeCanvas()
      pad.fromData(data)
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleClear = useCallback(() => {
    padRef.current?.clear()
    setIsEmpty(true)
  }, [])

  const handleConfirm = useCallback(() => {
    if (!padRef.current || padRef.current.isEmpty()) return
    const base64 = padRef.current.toDataURL('image/png')
    onSign(base64)
  }, [onSign])

  return (
    <div className="space-y-3">
      <div
        className="rounded-[var(--radius-md)] border overflow-hidden"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
      >
        <canvas
          ref={canvasRef}
          className="touch-none"
          style={{ width: 400, height: 150 }}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleClear} className="h-8 text-[11px]">
          Limpar
        </Button>
        <Button size="sm" onClick={handleConfirm} disabled={isEmpty} className="h-8 text-[11px]">
          Confirmar assinatura
        </Button>
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 text-[11px]">
            Cancelar
          </Button>
        )}
      </div>
    </div>
  )
}
