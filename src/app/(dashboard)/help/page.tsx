import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  BookOpen,
  Play,
  MessageSquare,
  FileText,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Lightbulb,
} from 'lucide-react'

const categories = [
  { title: 'Primeiros Passos', description: 'Configure sua conta e comece a usar', icon: Lightbulb, articles: 8 },
  { title: 'Projetos', description: 'Como criar e gerenciar projetos', icon: FileText, articles: 12 },
  { title: 'Financeiro', description: 'Faturas, pagamentos e cobranças', icon: FileText, articles: 6 },
  { title: 'Comunicação', description: 'Chat, mensagens e notificações', icon: MessageSquare, articles: 5 },
  { title: 'Automações', description: 'Workflows e automações', icon: FileText, articles: 9 },
  { title: 'Integrações', description: 'APIs, webhooks e apps', icon: ExternalLink, articles: 7 },
]

const popularArticles = [
  { title: 'Como criar meu primeiro projeto', views: 1240, category: 'Primeiros Passos' },
  { title: 'Configurando pagamentos online', views: 890, category: 'Financeiro' },
  { title: 'Entendendo o pipeline do CRM', views: 756, category: 'CRM' },
  { title: 'Criando automações de email', views: 623, category: 'Automações' },
  { title: 'Integrando WhatsApp ao chat', views: 534, category: 'Integrações' },
]

const faqs = [
  { question: 'Como adicionar membros à equipe?', answer: 'Vá em Configurações > Equipe > Convidar Membro. Insira o email e defina a permissão.' },
  { question: 'Como configurar pagamentos via PIX?', answer: 'Em Configurações > Financeiro > Gateways, ative o PIX e configure sua chave.' },
  { question: 'Posso personalizar o portal do cliente?', answer: 'Sim! Em Configurações > Aparência você pode alterar cores, logo e layout.' },
  { question: 'Como funciona a IA integrada?', answer: 'A IA analisa seus projetos e oferece insights, gera cronogramas e sugere automações.' },
]

export default function HelpPage() {
  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">Central de Ajuda</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Encontre respostas, tutoriais e documentação para usar a plataforma
        </p>
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar artigos, tutoriais..."
            className="pl-10 h-12 text-base"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <Card key={cat.title} className="card-hover cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <cat.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{cat.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">{cat.articles} artigos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium">Artigos Populares</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {popularArticles.map((article) => (
                <div key={article.title} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                  <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm">{article.title}</p>
                    <p className="text-xs text-muted-foreground">{article.category}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium">Perguntas Frequentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.question} className="space-y-1">
                  <p className="text-sm font-medium">{faq.question}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="text-center">
        <CardContent className="p-8">
          <HelpCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-base font-medium">Não encontrou o que precisa?</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Nossa equipe está pronta para ajudar
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <Button variant="outline">
              <MessageSquare className="mr-2 h-4 w-4" />
              Chat ao vivo
            </Button>
            <Button>
              Abrir Ticket
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
