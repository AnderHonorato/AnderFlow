import { prisma } from '@/lib/prisma'
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

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <Image className="h-5 w-5 text-purple-500" />
  if (mimeType.startsWith('video/')) return <Film className="h-5 w-5 text-info" />
  if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText className="h-5 w-5 text-warning" />
  if (mimeType.includes('figma') || mimeType.includes('design')) return <File className="h-5 w-5 text-primary" />
  if (mimeType.includes('google-apps')) return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M7.487 1l6.912 12H14.4L7.487 1z" fill="#4285F4"/><path d="M9.6 7.444L2.688 19.296C2.347 19.879 2.8 21 3.467 21h13.845c.67 0 1.12-1.121.78-1.704L11.18 7.444c-.341-.576-1.237-.576-1.58 0z" fill="#34A853"/><path d="M15.467 14.534l-3.467-6 3.467-6c.34-.576 1.237-.576 1.579 0l6.913 12c.34.583-.11 1.304-.78 1.304h-6.933" fill="#FBBC04"/><path d="M21.78 20.779c.34-.583-.11-1.304-.78-1.304H8.533l3.467 6h6.934" fill="#EA4335"/></svg>
  return <File className="h-5 w-5 text-muted-foreground" />
}

function formatSize(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

export default async function FilesPage() {
  const [folders, recentFiles, totalSize] = await Promise.all([
    prisma.fileFolder.findMany({
      include: { _count: { select: { files: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.file.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { project: { select: { name: true } } },
    }),
    prisma.file.aggregate({ _sum: { size: true } }),
  ])

  const usedSize = totalSize._sum.size ?? 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">Arquivos</h1>
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
          <span>{formatSize(usedSize)} usado</span>
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
                      {folder._count.files} arquivos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {folders.length === 0 && (
            <div className="md:col-span-4 p-8 text-center text-sm text-muted-foreground border rounded-lg">
              Nenhuma pasta criada.
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-3">Arquivos Recentes</h3>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-4 p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => { if (file.mimeType?.includes('google-apps') || file.url) { window.open(file.url, '_blank') } }}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    {getFileIcon(file.mimeType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{file.originalName || file.name}</p>
                      {file.mimeType?.includes('google-apps') && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-[500] bg-blue-500/10 text-blue-500 shrink-0">Drive</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {file.project?.name || 'Sem projeto'} &middot; {formatSize(file.size)}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {file.createdAt.toLocaleDateString('pt-BR')}
                  </span>
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
              {recentFiles.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Nenhum arquivo enviado ainda.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
