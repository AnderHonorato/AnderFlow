'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Calendar, Link2, CheckCircle2, Save, Edit3, X, Search } from 'lucide-react'

export function KnowledgeClient({ projects: initialProjects }: { projects: any[] }) {
  const [projects] = useState(initialProjects)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const saveChanges = async (projectId: string) => {
    const summary = (document.getElementById(`summary-${projectId}`) as HTMLTextAreaElement)?.value
    const link = (document.getElementById(`link-${projectId}`) as HTMLInputElement)?.value
    const image = (document.getElementById(`image-${projectId}`) as HTMLInputElement)?.value

    await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completedSummary: summary, completedLink: link, headerImage: image }),
    })

    const p = projects.find(pr => pr.id === projectId)
    if (p) { p.completedSummary = summary; p.completedLink = link; p.headerImage = image }
    setEditingId(null)
    toast.success('Informações salvas!')
  }

  const filtered = projects.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.client?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const yearsSet = new Set<number>()
  filtered.forEach(p => {
    const d = p.completedAt || p.updatedAt || p.createdAt
    yearsSet.add(new Date(d).getFullYear())
  })
  const completedYears = Array.from(yearsSet).sort((a, b) => b - a)

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">Meu Conhecimento</h1>
          <p className="text-sm text-muted-foreground mt-1">{projects.length} projetos concluídos</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar conhecimento..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="relative">
        {completedYears.map((year, yi) => (
          <div key={year} className="relative pl-10">
            {yi !== completedYears.length - 1 && <div className="absolute left-[23px] top-14 bottom-0 w-0.5 bg-[hsl(222,25%,18%)]" />}
            <div className="flex items-center gap-3 mb-6 sticky top-16 bg-[var(--bg)] py-2 z-10">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white text-sm font-bold shrink-0">{year}</div>
              <div className="h-0.5 flex-1 bg-[hsl(222,25%,14%)]" />
              <span className="text-xs text-muted-foreground">{filtered.filter(p => new Date(p.completedAt || p.updatedAt || p.createdAt).getFullYear() === year).length} projetos</span>
            </div>

            {filtered.filter(p => new Date(p.completedAt || p.updatedAt || p.createdAt).getFullYear() === year)
              .sort((a, b) => new Date(b.completedAt || b.updatedAt || b.createdAt).getTime() - new Date(a.completedAt || a.updatedAt || a.createdAt).getTime())
              .map((project, pi, arr) => {
                const isEditing = editingId === project.id
                const meta = { summary: project.completedSummary || '', link: project.completedLink || '', image: project.headerImage || '' }
                const date = new Date(project.completedAt || project.updatedAt || project.createdAt)

                return (
                  <div key={project.id} className="relative pb-8">
                    <div className="absolute left-[-2px] top-5 w-2.5 h-2.5 rounded-full bg-success border-2 border-[var(--border)]" />
                    <div className="absolute left-3 top-[22px] w-7 h-0.5 bg-[hsl(222,25%,18%)]" />
                    {pi !== arr.length - 1 && <div className="absolute left-[23px] top-10 bottom-0 w-0.5 bg-[hsl(222,25%,14%)]" />}

                    <Card className="ml-0 card-hover">
                      <CardContent className="p-5">
                        {meta.image && (
                          <div className="mb-4 -mx-5 -mt-5 rounded-t-[14px] overflow-hidden h-40 bg-[hsl(222,40%,8%)]">
                            <img src={meta.image} alt={project.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold">{project.name}</h3>
                              <Badge variant="success" className="text-2xs">Concluído</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{date.toLocaleDateString('pt-BR')}</span>
                              {project.client && <span>Cliente: {project.client.name}</span>}
                            </div>
                            {!isEditing ? (
                              <>
                                {meta.summary && <p className="text-sm text-muted-foreground mb-3 bg-[hsl(222,40%,6%)] rounded-[10px] p-3 leading-relaxed">{meta.summary}</p>}
                                {!meta.summary && <p className="text-sm text-muted-foreground mb-3 italic">Sem resumo. Clique em editar para adicionar.</p>}
                                {meta.link && <a href={meta.link} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><Link2 className="h-3 w-3" />{meta.link}</a>}
                                <button onClick={() => setEditingId(project.id)} className="btn btn-ghost btn-sm mt-2 text-xs"><Edit3 className="h-3 w-3 mr-1" />Editar informações</button>
                              </>
                            ) : (
                              <div className="space-y-3 animate-fade-in">
                                <div>
                                  <label className="text-xs text-muted-foreground block mb-1">URL da imagem de capa</label>
                                  <Input id={`image-${project.id}`} placeholder="https://..." defaultValue={meta.image} className="h-8 text-xs" />
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground block mb-1">Link do projeto</label>
                                  <Input id={`link-${project.id}`} placeholder="https://..." defaultValue={meta.link} className="h-8 text-xs" />
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground block mb-1">Resumo do conhecimento</label>
                                  <textarea id={`summary-${project.id}`} placeholder="O que você aprendeu? Quais tecnologias?" defaultValue={meta.summary} className="input h-24 resize-none py-2" style={{ minHeight: '80px' }} />
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => saveChanges(project.id)} className="btn btn-primary btn-sm text-xs"><Save className="h-3 w-3 mr-1" />Salvar</button>
                                  <button onClick={() => setEditingId(null)} className="btn btn-ghost btn-sm text-xs"><X className="h-3 w-3 mr-1" />Cancelar</button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
          </div>
        ))}
        {filtered.length === 0 && (
          <Card><CardContent className="p-12 text-center space-y-3"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto"><CheckCircle2 className="h-8 w-8 text-muted-foreground" /></div><p className="text-muted-foreground">Nenhum projeto concluído ainda.</p></CardContent></Card>
        )}
      </div>
    </div>
  )
}
