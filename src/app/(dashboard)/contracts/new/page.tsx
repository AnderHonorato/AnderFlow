'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  ArrowLeft, Download, Loader2, Bot, PenLine,
} from 'lucide-react'

export default function ContractNewPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState('')
  const [contractContent, setContractContent] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(json => {
        setProjects((json.data || []).filter((p: any) => p.proposalValue && p.status !== 'DRAFT'))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const generateContract = async () => {
    if (!selectedProject) { toast.error('Selecione um projeto'); return }
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/generate-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProject }),
      })
      const json = await res.json()
      if (json.contractContent) {
        setContractContent(json.contractContent)
        const proj = projects.find(p => p.id === selectedProject)
        setTitle(`Contrato - ${proj?.name || 'Projeto'}`)
        toast.success('Contrato gerado com IA')
      } else {
        toast.error(json.error || 'Erro ao gerar')
      }
    } catch { toast.error('Erro de conexao') }
    setGenerating(false)
  }

  const saveContract = async () => {
    if (!contractContent || !selectedProject) return
    setSaving(true)
    try {
      const proj = projects.find(p => p.id === selectedProject)
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || `Contrato - ${proj?.name}`,
          content: contractContent,
          clientId: proj?.clientId,
          projectId: selectedProject,
          status: 'DRAFT',
        }),
      })
      if (res.ok) {
        toast.success('Contrato salvo')
        router.push('/contracts')
      } else toast.error('Erro ao salvar')
    } catch { toast.error('Erro de conexao') }
    setSaving(false)
  }

  const sendForSigning = async () => {
    if (!contractContent || !selectedProject) return
    setSaving(true)
    try {
      const proj = projects.find(p => p.id === selectedProject)
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || `Contrato - ${proj?.name}`,
          content: contractContent,
          clientId: proj?.clientId,
          projectId: selectedProject,
          status: 'SENT',
        }),
      })
      if (res.ok) { toast.success('Contrato enviado para assinatura'); router.push('/contracts') }
      else toast.error('Erro ao enviar')
    } catch { toast.error('Erro de conexao') }
    setSaving(false)
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-[var(--text-3)] hover:text-[var(--text)] mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar
          </button>
          <h1 className="text-lg font-medium">Novo Contrato com IA</h1>
          <p className="text-sm text-muted-foreground mt-1">Gere contratos automaticamente com base nos dados do projeto</p>
        </div>
      </div>

      {loading ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">Carregando projetos...</CardContent></Card>
      ) : projects.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">
          Nenhum projeto com proposta aprovada disponivel.
          <Button variant="link" size="sm" onClick={() => router.push('/projects')}>Ver projetos</Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Selecione o projeto</Label>
                <select
                  value={selectedProject}
                  onChange={e => setSelectedProject(e.target.value)}
                  className="w-full h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm px-3"
                >
                  <option value="">Selecionar projeto...</option>
                  {projects.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — R$ {((p.proposalValue || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} — {p.client?.name || 'Cliente'}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                onClick={generateContract}
                disabled={!selectedProject || generating}
                className="w-full gap-2"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                {generating ? 'Gerando contrato...' : 'Gerar com IA'}
              </Button>
            </CardContent>
          </Card>

          {contractContent && (
            <>
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Titulo do contrato</Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Contrato de Prestacao de Servicos" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <PenLine className="h-3.5 w-3.5 text-[var(--text-3)]" />
                      <Label className="text-xs">Conteudo do contrato (edite se necessario)</Label>
                    </div>
                    <textarea
                      value={contractContent}
                      onChange={e => setContractContent(e.target.value)}
                      className="w-full h-[400px] rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm p-4 font-mono resize-y"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium mb-3">Preview</h3>
                  <div className="prose prose-sm max-w-none max-h-[300px] overflow-y-auto rounded-lg border border-[var(--border)] p-6 bg-[var(--bg)] text-[var(--text)]">
                    {contractContent.split('\n').map((line, i) => (
                      <p key={i} className={line.match(/^#/) ? 'text-lg font-bold' : line.match(/^CLÁUSULA|^Cláusula/) ? 'text-base font-semibold mt-4' : 'text-sm mb-1'}>
                        {line || '\u00A0'}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button onClick={saveContract} disabled={saving} variant="outline" className="flex-1 gap-2">
                  <Download className="h-4 w-4" />
                  Salvar contrato
                </Button>
                <Button onClick={sendForSigning} disabled={saving} className="flex-1 gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Enviar para assinatura
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
