'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { IconCheck, IconEdit, IconSearch, IconFile, IconClose, IconLoader } from '@/components/icons'
import { Sparkles } from 'lucide-react'

export function KnowledgeClient({ projects: initialProjects }: { projects: any[] }) {
  const [projects, setProjects] = useState(initialProjects)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState({ image: '', link: '', summary: '' })
  const [semanticMode, setSemanticMode] = useState(false)
  const [semanticLoading, setSemanticLoading] = useState(false)
  const [semanticResults, setSemanticResults] = useState<any[] | null>(null)

  const startEditing = (project: any) => {
    setEditValues({
      image: project.headerImage || '',
      link: project.completedLink || '',
      summary: project.completedSummary || '',
    })
    setEditingId(project.id)
  }

  const saveChanges = async (projectId: string) => {
    const { summary, link, image } = editValues

    await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completedSummary: summary, completedLink: link, headerImage: image }),
    })

    setProjects(prev => prev.map(pr =>
      pr.id === projectId ? { ...pr, completedSummary: summary, completedLink: link, headerImage: image } : pr
    ))
    setEditingId(null)
    toast.success('Informacoes salvas!')
  }

  const handleSemanticSearch = async () => {
    if (!search.trim()) return
    setSemanticLoading(true)
    setSemanticResults(null)
    try {
      const res = await fetch('/api/knowledge/semantic-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: search }),
      })
      const json = await res.json()
      if (res.ok && json.data) {
        setSemanticResults(json.data)
      } else {
        toast.error(json.error || 'Erro na busca semantica')
      }
    } catch {
      toast.error('Erro ao conectar com IA')
    }
    setSemanticLoading(false)
  }

  const filtered = semanticMode
    ? (semanticResults || [])
    : projects.filter(p =>
        !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.client?.name?.toLowerCase().includes(search.toLowerCase())
      )

  const displayProjects = semanticMode && semanticResults ? semanticResults : filtered

  const yearsSet = new Set<number>()
  displayProjects.forEach((p: any) => {
    const d = p.completedAt || p.updatedAt || p.createdAt
    yearsSet.add(new Date(d).getFullYear())
  })
  const completedYears = Array.from(yearsSet).sort((a, b) => b - a)

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto animate-page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-[500] tracking-[-0.015em]">Meu Conhecimento</h1>
          <p className="text-[12px] text-[var(--text-3)] mt-1">{projects.length} projetos concluidos</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-[var(--text-3)] cursor-pointer select-none">
              Busca semantica
            </label>
            <Switch checked={semanticMode} onCheckedChange={(v: boolean) => { setSemanticMode(v); if (!v) setSemanticResults(null) }} />
          </div>
          <div className="relative w-64">
            <IconSearch className="absolute left-3 top-1/2 w-[14px] h-[14px] -translate-y-1/2 text-[var(--text-3)]" />
            <Input
              placeholder={semanticMode ? 'Descreva o que procura...' : 'Buscar conhecimento...'}
              value={search}
              onChange={e => { setSearch(e.target.value); if (semanticMode) setSemanticResults(null) }}
              onKeyDown={e => { if (e.key === 'Enter' && semanticMode) handleSemanticSearch() }}
              className="pl-9"
            />
          </div>
          {semanticMode && (
            <Button size="sm" onClick={handleSemanticSearch} disabled={semanticLoading || !search.trim()} className="h-8 text-[11px] gap-1">
              {semanticLoading ? (
                <IconLoader className="w-[12px] h-[12px] animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              Buscar
            </Button>
          )}
        </div>
      </div>

      {semanticMode && (
        <p className="text-[11px] text-[var(--accent)] flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> Powered by IA ✨
        </p>
      )}

      {semanticLoading && (
        <Card className="border-[var(--accent)]/20 bg-[var(--accent-subtle)] animate-card-pop">
          <CardContent className="p-8 flex items-center justify-center gap-3">
            <div className="h-5 w-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            <span className="text-[13px] text-[var(--accent)]">Analisando artigos com IA...</span>
          </CardContent>
        </Card>
      )}

      <div>
        {completedYears.map((year) => (
          <div key={year} className="relative pl-10">
            <div className="flex items-center gap-3 mb-4 sticky top-[48px] bg-[var(--bg)] py-2 z-10">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-white text-[13px] font-[500] shrink-0">{year}</div>
              <div className="h-px flex-1 bg-[var(--border)]" />
              <span className="text-[11px] text-[var(--text-3)]">{displayProjects.filter((p: any) => new Date(p.completedAt || p.updatedAt || p.createdAt).getFullYear() === year).length} projetos</span>
            </div>

            {displayProjects.filter((p: any) => new Date(p.completedAt || p.updatedAt || p.createdAt).getFullYear() === year)
              .sort((a: any, b: any) => new Date(b.completedAt || b.updatedAt || b.createdAt).getTime() - new Date(a.completedAt || a.updatedAt || a.createdAt).getTime())
              .map((project: any) => {
                const isEditing = editingId === project.id
                const meta = {
                  summary: project.completedSummary || project.summary || '',
                  link: project.completedLink || '',
                  image: project.headerImage || '',
                  score: (project as any).score,
                }
                const date = new Date(project.completedAt || project.updatedAt || project.createdAt)

                return (
                  <div key={project.id} className="relative pb-6">
                    <Card className="hover:border-[var(--border-2)] transition-colors">
                      <CardContent className="p-4">
                        {meta.image && (
                          <div className="mb-3 -mx-4 -mt-4 rounded-t-xl overflow-hidden h-36 bg-[var(--surface-2)] relative">
                            <Image src={meta.image} alt={project.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-[14px] font-[500]">{project.title || project.name}</h3>
                            {meta.score !== undefined && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-[500] bg-[var(--accent-subtle)] text-[var(--accent)]">
                                {meta.score}% relevante
                              </span>
                            )}
                            <Badge variant="success">Concluido</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-[var(--text-3)] mb-3">
                            <span>{date.toLocaleDateString('pt-BR')}</span>
                            {project.client && <span>Cliente: {project.client.name}</span>}
                          </div>
                          {!isEditing ? (
                            <div className="space-y-2">
                              {meta.summary ? (
                                <p className="text-[12px] text-[var(--text-2)] bg-[var(--surface-2)] rounded-lg p-3 leading-relaxed">{(meta.summary || '').slice(0, 300)}</p>
                              ) : (
                                <p className="text-[12px] text-[var(--text-3)] italic">Sem resumo. Clique em editar para adicionar.</p>
                              )}
                              {meta.link && <a href={meta.link} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-[12px] text-[var(--accent)] hover:opacity-80"><IconFile className="w-[12px] h-[12px]" />{meta.link}</a>}
                               <Button variant="ghost" size="sm" onClick={() => startEditing(project)} className="mt-1">
                                 <IconEdit className="w-[12px] h-[12px]" /> Editar informacoes
                               </Button>
                            </div>
                           ) : (
                             <div className="space-y-3 animate-fade-in">
                               <div>
                                 <label className="text-[11px] text-[var(--text-3)] block mb-1">URL da imagem de capa</label>
                                 <Input placeholder="https://..." value={editValues.image} onChange={e => setEditValues(p => ({ ...p, image: e.target.value }))} />
                               </div>
                               <div>
                                 <label className="text-[11px] text-[var(--text-3)] block mb-1">Link do projeto</label>
                                 <Input placeholder="https://..." value={editValues.link} onChange={e => setEditValues(p => ({ ...p, link: e.target.value }))} />
                               </div>
                               <div>
                                 <label className="text-[11px] text-[var(--text-3)] block mb-1">Resumo do conhecimento</label>
                                 <textarea placeholder="O que voce aprendeu? Quais tecnologias?" value={editValues.summary} onChange={e => setEditValues(p => ({ ...p, summary: e.target.value }))} className="w-full min-h-[80px] rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--accent)] resize-vertical" />
                               </div>
                               <div className="flex gap-2">
                                 <Button size="sm" onClick={() => saveChanges(project.id)}><IconCheck className="w-[12px] h-[12px]" /> Salvar</Button>
                                 <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><IconClose className="w-[12px] h-[12px]" /> Cancelar</Button>
                               </div>
                             </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
          </div>
        ))}
        {displayProjects.length === 0 && (
          <Card><CardContent className="p-12 text-center space-y-3"><p className="text-[var(--text-3)]">{semanticMode ? 'Nenhum resultado encontrado. Tente outra descricao.' : 'Nenhum projeto concluido ainda.'}</p></CardContent></Card>
        )}
      </div>
    </div>
  )
}
