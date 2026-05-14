'use client'

import { Button } from '@/components/ui/button'
import { RefreshCcw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body className="bg-background text-foreground antialiased">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center space-y-4 max-w-md">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10">
                <span className="text-3xl font-bold text-destructive">!</span>
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">Erro Crítico</h1>
              <p className="text-sm text-muted-foreground">
                A plataforma encontrou um erro crítico. Tente recarregar a página.
              </p>
              {error.digest && (
                <p className="text-xs text-muted-foreground font-mono">
                  ID: {error.digest}
                </p>
              )}
            </div>
            <Button onClick={reset} size="lg">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Recarregar Plataforma
            </Button>
          </div>
        </div>
      </body>
    </html>
  )
}
