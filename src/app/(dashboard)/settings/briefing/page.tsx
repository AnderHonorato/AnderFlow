'use client'

import { useState, useEffect } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

interface Field {
  id: string
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'date'
  label: string
  placeholder: string
  required: boolean
  options?: string[]
}

function SortableField({ field, onUpdate, onRemove }: {
  field: Field
  onUpdate: (id: string, data: Partial<Field>) => void
  onRemove: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-50 z-50' : ''}>
      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <button type="button" {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
              <GripVertical className="h-4 w-4 text-[var(--text-muted)]" />
            </button>
            <Input
              value={field.label}
              onChange={e => onUpdate(field.id, { label: e.target.value })}
              placeholder="Nome do campo"
              className="h-7 text-xs flex-1"
            />
            <select
              value={field.type}
              onChange={e => onUpdate(field.id, { type: e.target.value as Field['type'] })}
              className="h-7 rounded-md bg-[var(--input-bg)] px-2 text-xs text-[var(--text)] focus:outline-none focus:ring-1.5 focus:ring-[var(--primary)]"
            >
              <option value="text">Texto</option>
              <option value="textarea">Área de texto</option>
              <option value="select">Seleção</option>
              <option value="checkbox">Checkbox</option>
              <option value="date">Data</option>
            </select>
            <Button variant="ghost" size="icon-sm" onClick={() => onRemove(field.id)}>
              <Trash2 className="h-3.5 w-3.5 text-[var(--text-muted)] hover:text-[var(--destructive)]" />
            </Button>
          </div>
          <Input
            value={field.placeholder}
            onChange={e => onUpdate(field.id, { placeholder: e.target.value })}
            placeholder="Placeholder"
            className="h-7 text-xs"
          />
          <div className="flex items-center gap-2">
            <Switch
              checked={field.required}
              onCheckedChange={checked => onUpdate(field.id, { required: checked })}
            />
            <span className="text-xs text-[var(--text-secondary)]">Obrigatório</span>
          </div>
          {field.type === 'select' && (
            <Input
              value={(field.options || []).join(', ')}
              onChange={e => onUpdate(field.id, { options: e.target.value.split(',').map(o => o.trim()).filter(Boolean) })}
              placeholder="Opções (separadas por vírgula)"
              className="h-7 text-xs"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function BriefingAdminPage() {
  const [fields, setFields] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  useEffect(() => {
    fetch('/api/briefing-schema')
      .then(r => r.json())
      .then(json => setFields(json.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setFields(items => {
        const oldIdx = items.findIndex(f => f.id === active.id)
        const newIdx = items.findIndex(f => f.id === over.id)
        return arrayMove(items, oldIdx, newIdx)
      })
    }
  }

  const addField = () => {
    setFields(prev => [...prev, {
      id: Date.now().toString(),
      type: 'text',
      label: 'Novo campo',
      placeholder: '',
      required: false,
    }])
  }

  const updateField = (id: string, data: Partial<Field>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...data } : f))
  }

  const removeField = (id: string) => {
    setFields(prev => prev.filter(f => f.id !== id))
  }

  const saveFields = async () => {
    const res = await fetch('/api/briefing-schema', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    })
    if (res.ok) {
      toast.success('Schema salvo com sucesso!')
    } else {
      toast.error('Erro ao salvar schema')
    }
  }

  return (
    <div className="p-4 space-y-5 max-w-4xl mx-auto">
      <Link href="/settings" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
        <ArrowLeft className="h-4 w-4" /> Voltar para configurações
      </Link>

      <div>
        <h1 className="text-lg font-medium text-[var(--text)]">Editor de Briefing</h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Crie e edite os campos do briefing. Arraste para reordenar.</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-[var(--text-muted)]">Carregando...</div>
      ) : (
        <>
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
            <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {fields.map(field => (
                  <SortableField key={field.id} field={field} onUpdate={updateField} onRemove={removeField} />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <Button variant="outline" onClick={addField} className="w-full h-8 text-xs">
            <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar campo
          </Button>

          <div className="flex justify-end">
            <Button onClick={saveFields} className="h-8 text-xs">
              Salvar
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
