'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle, XCircle, Shield, FileText, CalendarDays } from 'lucide-react'
import { motion } from 'framer-motion'

export default function VerifyContractPage() {
  const params = useParams()
  const contractId = params.contractId as string
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/contracts/${contractId}/verify`)
      .then(r => r.json())
      .then(json => setResult(json))
      .finally(() => setLoading(false))
  }, [contractId])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-6">
      <Skeleton className="h-64 w-full max-w-md" />
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <Card className="text-center">
          <CardContent className="p-8 space-y-6">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--surface-2)]">
                <Shield className="h-10 w-10 text-[var(--accent)]" />
              </div>
            </div>

            <div>
              <h1 className="text-lg font-semibold">Verificador de Autenticidade</h1>
              <p className="text-sm text-muted-foreground mt-1">ANDERFLOW Sistemas</p>
            </div>

            {result?.valid ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-6 w-6 text-success" />
                  <span className="text-lg font-semibold text-success">Contrato Verificado</span>
                </div>
                <div className="space-y-2 text-left bg-[var(--surface-2)] rounded-lg p-4">
                  {result.projectName && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Projeto: <strong>{result.projectName}</strong></span>
                    </div>
                  )}
                  {result.signerName && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Assinado por: <strong>{result.signerName}</strong></span>
                    </div>
                  )}
                  {result.signedAt && (
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Data: {new Date(result.signedAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                </div>
                <Badge variant="success" className="text-xs px-3 py-1">Documento autentico e integro</Badge>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <XCircle className="h-6 w-6 text-destructive" />
                  <span className="text-lg font-semibold text-destructive">Nao Verificado</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {result?.error || 'Nao foi possivel verificar a autenticidade deste contrato.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
