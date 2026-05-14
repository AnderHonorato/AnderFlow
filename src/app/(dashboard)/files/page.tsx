'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Search,
  Filter,
  Upload,
  FolderOpen,
  File,
  Image,
  FileText,
  Film,
  MoreHorizontal,
  Download,
  Eye,
  Grid,
  List,
  HardDrive,
} from 'lucide-react'

const folders = [
  { id: '1', name: 'E-commerce Premium', files: 24, size: '156 MB', updated: '2h atrás' },
  { id: '2', name: 'App de Delivery', files: 18, size: '89 MB', updated: '5h atrás' },
  { id: '3', name: 'CRM Personalizado', files: 12, size: '45 MB', updated: '1d atrás' },
  { id: '4', name: 'Contratos', files: 8, size: '12 MB', updated: '2d atrás' },
]

const recentFiles = [
  { id: '1', name: 'mockup-checkout-v3.fig', type: 'design', size: '24.5 MB', uploaded: '30min atrás', project: 'E-commerce Premium' },
  { id: '2', name: 'briefing-final.pdf', type: 'document', size: '2.1 MB', uploaded: '2h atrás', project: 'App de Delivery' },
  { id: '3', name: 'logo-redesign.png', type: 'image', size: '4.8 MB', uploaded: '4h atrás', project: 'Landing Page' },
  { id: '4', name: 'demo-video.mp4', type: 'video', size: '128 MB', uploaded: '1d atrás', project: 'CRM Personalizado' },
  { id: '5', name: 'contrato-techstore.pdf', type: 'document', size: '1.2 MB', uploaded: '2d atrás', project: 'E-commerce Premium' },
  { id: '6', name: 'wireframes-mobile.fig', type: 'design', size: '18.3 MB', uploaded: '3d atrás', project: 'App de Delivery' },
]

function getFileIcon(type: string) {
  switch (type) {
    case 'image': return <Image className="h-5 w-5 text-purple-500" />
    case 'video': return <Film className="h-5 w-5 text-info" />
    case 'document': return <FileText className="h-5 w-5 text-warning" />
    case 'design': return <File className="h-5 w-5 text-primary" />
    default: return <File className="h-5 w-5 text-muted-foreground" />
  }
}

export default function FilesPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Arquivos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestão de arquivos e documentos
          </p>
        </div>
        <Button size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Upload
        </Button>
      </div>

      <Card className="border-dashed">
        <CardContent className="p-8 flex flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">Arraste arquivos aqui ou clique para enviar</p>
          <p className="text-xs text-muted-foreground mt-1">PDF, imagens, vídeos, documentos até 100MB</p>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar arquivos..." className="pl-9" />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Filtros
        </Button>
        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <HardDrive className="h-3.5 w-3.5" />
          <span>2.4 GB / 10 GB usado</span>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">Pastas</h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {folders.map((folder) => (
            <Card key={folder.id} className="card-hover cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FolderOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{folder.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {folder.files} arquivos &middot; {folder.size}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">Arquivos Recentes</h3>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-4 p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{file.project} &middot; {file.size}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{file.uploaded}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon-sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
