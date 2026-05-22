'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { FileText, Download, Upload, Check, PenLine } from 'lucide-react'
import { SignaturePad } from '@/components/ui/signature-pad'

export default function PortalContracts() {
  const { data: session } = useSession()
  const [contracts, setContracts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<any>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [signOpen, setSignOpen] = useState(false)
  const [signContract, setSignContract] = useState<any>(null)
  const [signing, setSigning] = useState(false)

  useEffect(() => {
    if (!session?.user?.id) { setLoading(false); return }
    fetch('/api/contracts')
      .then(r => r.json())
      .then(json => { setContracts(json.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [session?.user?.id])

  const handleUpload = async () => {
    if (!uploadFile || !selectedContract) return
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      const uploadJson = await uploadRes.json()

      if (!uploadRes.ok) {
        toast.error('Erro no upload do arquivo')
        setUploading(false)
        return
      }

      const res = await fetch(`/api/contracts/${selectedContract.id}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedUrl: uploadJson.url, fileName: uploadFile.name }),
      })

      if (res.ok) {
        toast.success('Contrato assinado enviado com sucesso!')
        setUploadOpen(false)
        setUploadFile(null)
        setContracts(prev => prev.map(c => c.id === selectedContract.id ? { ...c, status: 'ACTIVE', signatureUrl: uploadJson.url } : c))
      } else {
        toast.error('Erro ao enviar contrato')
      }
    } catch {
      toast.error('Erro ao fazer upload')
    }
    setUploading(false)
  }

  const handleSignDigitally = async (base64: string) => {
    if (!signContract) return
    setSigning(true)
    try {
      const res = await fetch(`/api/contracts/${signContract.id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature: base64 }),
      })
      if (res.ok) {
        toast.success('Contrato assinado com sucesso!')
        setSignOpen(false)
        setSignContract(null)
        setContracts(prev => prev.map(c => c.id === signContract.id ? { ...c, status: 'SIGNED', signedAt: new Date().toISOString() } : c))
      } else {
        const json = await res.json()
        toast.error(json.error || 'Erro ao assinar contrato')
      }
    } catch {
      toast.error('Erro ao assinar contrato')
    }
    setSigning(false)
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div><Skeleton className="h-7 w-36" /><Skeleton className="h-4 w-56 mt-1.5" /></div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  // API /api/contracts ja filtra por clientId para nao-admins
  const myContracts = contracts

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-[17px] font-[500] tracking-[-0.015em]">Contratos</h2>
        <p className="text-[12px] text-[var(--text-3)] mt-1">Seus contratos e documentos</p>
      </div>

      {myContracts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center space-y-3">
            <FileText className="h-12 w-12 text-[var(--text-3)] mx-auto" />
            <p className="text-[13px] text-[var(--text-3)]">Nenhum contrato disponivel no momento.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {myContracts.map((contract: any) => (
            <Card key={contract.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-[500]">{contract.title}</h3>
                      <Badge status={contract.status}>
                        {contract.status === 'ACTIVE' ? 'Ativo' : contract.status === 'PENDING_SIGNATURE' ? 'Aguardando assinatura' : contract.status === 'SIGNED' ? 'Assinado' : contract.status === 'DRAFT' ? 'Rascunho' : contract.status}
                      </Badge>
                    </div>
                    {contract.value > 0 && (
                      <p className="text-[13px] font-[500] text-[var(--accent)]">R$ {contract.value?.toLocaleString?.('pt-BR') || contract.value}</p>
                    )}
                    <p className="text-[12px] text-[var(--text-3)]">{contract.content?.slice(0, 150)}...</p>
                    {contract.signedAt && (
                      <p className="text-[11px] text-[var(--text-3)]">Assinado em {new Date(contract.signedAt).toLocaleDateString('pt-BR')}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {contract.status !== 'SIGNED' && (
                      <Button
                        size="sm"
                        className="h-8 text-[11px]"
                        onClick={() => {
                          setSignContract(contract)
                          setSignOpen(true)
                        }}
                      >
                        <PenLine className="w-[12px] h-[12px]" /> Assinar
                      </Button>
                    )}
                    {contract.status === 'PENDING_SIGNATURE' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-[11px]"
                          onClick={() => window.print()}
                        >
                          <Download className="w-[12px] h-[12px]" /> Baixar PDF
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 text-[11px]"
                          onClick={() => {
                            setSelectedContract(contract)
                            setUploadOpen(true)
                          }}
                        >
                          <Upload className="w-[12px] h-[12px]" /> Enviar assinado
                        </Button>
                      </>
                    )}
                    {contract.status === 'ACTIVE' && contract.signatureUrl && (
                      <Button variant="outline" size="sm" className="h-8 text-[11px]" asChild>
                        <a href={contract.signatureUrl} target="_blank" rel="noopener">
                          <Check className="w-[12px] h-[12px]" /> Ver assinado
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Contrato Assinado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-[12px] text-[var(--text-2)]">
              Selecione o arquivo PDF do contrato assinado (via Gov.br ou outro meio digital).
            </p>
            <div className="space-y-2">
              <label>Arquivo assinado</label>
              <Input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpload} disabled={!uploadFile || uploading}>
              {uploading ? 'Enviando...' : 'Enviar contrato'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={signOpen} onOpenChange={setSignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assinar Contrato</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {signContract && (
              <p className="text-[13px] font-[500]">{signContract.title}</p>
            )}
            <p className="text-[12px] text-[var(--text-2)]">
              Desenhe sua assinatura no campo abaixo. Ao assinar, voce concorda com os termos do contrato.
            </p>
            <SignaturePad
              onSign={handleSignDigitally}
              onCancel={() => setSignOpen(false)}
            />
            <p className="text-[11px] text-[var(--text-3)]">
              Ao assinar, voce concorda com os termos do contrato
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
