'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { ExternalLink, Check, Loader2 } from 'lucide-react'

export default function NotionSettingsPage() {
  const [notionToken, setNotionToken] = useState('')
  const [databaseId, setDatabaseId] = useState('')
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)

  const testConnection = async () => {
    if (!notionToken || !databaseId) { toast.error('Preencha token e database ID'); return }
    setTesting(true)
    try {
      const res = await fetch('https://api.notion.com/v1/databases/' + databaseId, {
        headers: { Authorization: 'Bearer ' + notionToken, 'Notion-Version': '2022-06-28' },
      })
      if (res.ok) {
        toast.success('Conexão com Notion OK!')
      } else {
        toast.error(`Erro: ${res.status}`)
      }
    } catch {
      toast.error('Falha ao conectar')
    }
    setTesting(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notion_token: notionToken, notion_database_id: databaseId }),
      })
      if (res.ok) {
        toast.success('Configuração salva!')
      } else {
        toast.error('Erro ao salvar')
      }
    } catch {
      toast.error('Erro ao salvar')
    }
    setSaving(false)
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto animate-page-enter">
      <div>
        <h1 className="text-[17px] font-[500] tracking-[-0.015em]">Integração com Notion</h1>
        <p className="text-[12px] text-[var(--text-3)] mt-1">Exporte documentação de projetos para o Notion</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-[14px]">Configuração</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-[12px] font-[500] text-[var(--text-2)] mb-1.5 block">Notion Integration Token</label>
            <Input value={notionToken} onChange={e => setNotionToken(e.target.value)} type="password" placeholder="secret_..." className="font-mono text-[12px]" />
          </div>
          <div>
            <label className="text-[12px] font-[500] text-[var(--text-2)] mb-1.5 block">Database ID</label>
            <Input value={databaseId} onChange={e => setDatabaseId(e.target.value)} placeholder="ID do banco de dados do Notion" className="font-mono text-[12px]" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={testConnection} disabled={testing} className="h-8 text-[12px]">
              {testing ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
              Testar conexão
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="h-8 text-[12px]">
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-[14px]">Como obter as credenciais</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-[12px] text-[var(--text-2)]">
          <div className="space-y-1">
            <p className="font-[500] text-[var(--text)]">1. Criar integração no Notion</p>
            <p>Acesse{' '}
              <Link href="https://www.notion.so/my-integrations" target="_blank" className="text-[var(--accent)] inline-flex items-center gap-0.5">
                notion.so/my-integrations <ExternalLink className="h-3 w-3" />
              </Link>
              {' '}e clique em "New integration". Copie o token gerado.</p>
          </div>
          <div className="space-y-1">
            <p className="font-[500] text-[var(--text)]">2. Conectar a um banco de dados</p>
            <p>No Notion, abra o banco de dados onde os projetos serão exportados. Clique em "..." e "Add connections", adicione sua integração.</p>
          </div>
          <div className="space-y-1">
            <p className="font-[500] text-[var(--text)]">3. Obter Database ID</p>
            <p>Na URL do banco de dados: notion.so/nomedoespaco/<strong>DATABASE_ID</strong>?v=...</p>
            <p>Copie o ID de 32 caracteres (antes do "?")</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
