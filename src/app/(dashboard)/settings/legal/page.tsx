'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Save, FileText } from 'lucide-react'

export default function LegalSettingsPage() {
  const [terms, setTerms] = useState({ content: '', version: '1.0' })
  const [privacy, setPrivacy] = useState({ content: '', version: '1.0' })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms')
  const [consents, setConsents] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/legal?type=terms').then(r => r.json()),
      fetch('/api/legal?type=privacy').then(r => r.json()),
    ]).then(([t, p]) => {
      setTerms({ content: t.data?.content || '', version: t.data?.version || '1.0' })
      setPrivacy({ content: p.data?.content || '', version: p.data?.version || '1.0' })
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (activeTab) {
      fetch(`/api/legal?type=${activeTab}&consents=true`)
        .then(r => r.json())
        .then(json => setConsents(json.consents || []))
        .catch(() => setConsents([]))
    }
  }, [activeTab])

  const save = async (type: string, content: string, version: string) => {
    const res = await fetch('/api/legal', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, content, version }),
    })
    if (res.ok) toast.success('Documento salvo')
    else toast.error('Erro ao salvar')
  }

  const current = activeTab === 'terms' ? terms : privacy
  const setCurrent = activeTab === 'terms'
    ? (v: any) => setTerms(v)
    : (v: any) => setPrivacy(v)

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96" /></div>

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-medium">Documentos Legais</h1>
        <p className="text-sm text-muted-foreground mt-1">Edite os termos de uso e politica de privacidade</p>
      </div>

      <div className="flex gap-2">
        {(['terms', 'privacy'] as const).map(tab => (
          <Button key={tab} variant={activeTab === tab ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab(tab)}>
            <FileText className="mr-2 h-3.5 w-3.5" />
            {tab === 'terms' ? 'Termos de Uso' : 'Politica de Privacidade'}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Editor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Versao</Label>
              <Input
                value={current.version}
                onChange={e => setCurrent({ ...current, version: e.target.value })}
                placeholder="1.0"
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Conteudo (HTML/Markdown)</Label>
              <textarea
                className="w-full h-96 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm p-3 font-mono resize-y"
                value={current.content}
                onChange={e => setCurrent({ ...current, content: e.target.value })}
              />
            </div>
            <Button onClick={() => save(activeTab, current.content, current.version)} className="w-full gap-2">
              <Save className="h-4 w-4" /> Salvar ({activeTab === 'terms' ? 'Termos' : 'Privacidade'})
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Aceites - {activeTab === 'terms' ? 'Termos' : 'Privacidade'} v{current.version}</CardTitle>
          </CardHeader>
          <CardContent>
            {consents.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum usuario aceitou esta versao ainda.</p>
            ) : (
              <div className="divide-y">
                {consents.map((c: any) => (
                  <div key={c.id} className="py-2 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium">{c.userId}</p>
                      <p className="text-2xs text-muted-foreground">{new Date(c.createdAt).toLocaleString('pt-BR')}</p>
                    </div>
                    <span className="text-2xs text-muted-foreground font-mono">{c.ip || '-'}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
