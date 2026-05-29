"use client"

import { useState, useRef, useEffect } from 'react'
import {
  Search, Wrench, FlaskConical, RefreshCw, FileText, FileCode,
  GitCommit, Zap, PackageOpen, FileSearch, Play, Undo2,
  Trash2, Paperclip, HelpCircle
} from 'lucide-react'

export interface SlashCommand {
  id: string
  command: string
  label: string
  icon: React.ReactNode
  description: string
  systemPrompt: string
  needsActiveFile: boolean
  needsDiagnostics: boolean
  needsGitDiff: boolean
  expectsArgs: boolean
  argsPlaceholder?: string
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: 'explain', command: '/explain', label: 'Explica código',
    icon: <Search className="w-3.5 h-3.5" />,
    description: 'Explica o código do arquivo ativo ou selecionado',
    systemPrompt: 'Explique este código em detalhes, passo a passo. Inclua: propósito geral, fluxo de execução, padrões usados e possíveis melhorias.',
    needsActiveFile: true, needsDiagnostics: false, needsGitDiff: false, expectsArgs: false
  },
  {
    id: 'fix', command: '/fix', label: 'Corrigir erros',
    icon: <Wrench className="w-3.5 h-3.5" />,
    description: 'Analisa e corrige erros do arquivo ativo',
    systemPrompt: 'Analise o arquivo e corrija TODOS os erros TypeScript, ESLint e problemas lógicos listados. Explique cada correção brevemente.',
    needsActiveFile: true, needsDiagnostics: true, needsGitDiff: false, expectsArgs: false
  },
  {
    id: 'test', command: '/test', label: 'Gerar testes',
    icon: <FlaskConical className="w-3.5 h-3.5" />,
    description: 'Gera arquivo de testes para o arquivo ativo',
    systemPrompt: 'Gere um arquivo de testes Jest/Vitest completo para este código. Cubra casos de sucesso, erro e edge cases. Use boas práticas de teste.',
    needsActiveFile: true, needsDiagnostics: false, needsGitDiff: false, expectsArgs: false
  },
  {
    id: 'refactor', command: '/refactor', label: 'Refatorar',
    icon: <RefreshCw className="w-3.5 h-3.5" />,
    description: 'Refatora seguindo boas práticas',
    systemPrompt: 'Refatore o código seguindo princípios SOLID, clean code e boas práticas de React/TypeScript. Extraia funções pequenas, elimine duplicação e melhore nomes.',
    needsActiveFile: true, needsDiagnostics: false, needsGitDiff: false, expectsArgs: false
  },
  {
    id: 'review', command: '/review', label: 'Code Review',
    icon: <FileText className="w-3.5 h-3.5" />,
    description: 'Code review detalhado com sugestões',
    systemPrompt: 'Faça um code review detalhado: segurança, performance, legibilidade, aderência aos padrões do projeto, erros potenciais. Para cada ponto, indique gravidade (baixa/média/alta) e sugestão de correção.',
    needsActiveFile: true, needsDiagnostics: false, needsGitDiff: false, expectsArgs: false
  },
  {
    id: 'docs', command: '/docs', label: 'Gerar JSDoc',
    icon: <FileCode className="w-3.5 h-3.5" />,
    description: 'Gera JSDoc para todas as funções do arquivo',
    systemPrompt: 'Adicione comentários JSDoc completos para todas as funções, classes, interfaces e tipos exportados neste arquivo. Inclua @param, @returns, @example quando relevante.',
    needsActiveFile: true, needsDiagnostics: false, needsGitDiff: false, expectsArgs: false
  },
  {
    id: 'commit', command: '/commit', label: 'Mensagem de commit',
    icon: <GitCommit className="w-3.5 h-3.5" />,
    description: 'Gera mensagem de commit para as mudanças staged',
    systemPrompt: 'Analise o git diff e gere uma mensagem de commit no formato Conventional Commits (feat:, fix:, refactor:, docs:, etc.). Seja conciso, máximo 72 caracteres no título. Inclua uma descrição detalhada abaixo.',
    needsActiveFile: false, needsDiagnostics: false, needsGitDiff: true, expectsArgs: false
  },
  {
    id: 'optimize', command: '/optimize', label: 'Otimizar performance',
    icon: <Zap className="w-3.5 h-3.5" />,
    description: 'Analisa e sugere otimizações de performance',
    systemPrompt: 'Analise o código em busca de gargalos de performance: renderizações desnecessárias, loops ineficientes, falta de memoização, queries mal otimizadas, bundle size excessivo. Sugira correções específicas.',
    needsActiveFile: true, needsDiagnostics: false, needsGitDiff: false, expectsArgs: false
  },
  {
    id: 'scaffold', command: '/scaffold', label: 'Criar boilerplate',
    icon: <PackageOpen className="w-3.5 h-3.5" />,
    description: 'Cria boilerplate (hook, componente, rota, etc.)',
    systemPrompt: 'Crie o boilerplate solicitado seguindo os padrões do projeto AnderFlow. Use TypeScript, Tailwind, e os hooks/utils já existentes no projeto.',
    needsActiveFile: false, needsDiagnostics: false, needsGitDiff: false, expectsArgs: true,
    argsPlaceholder: 'hook useAuth'
  },
  {
    id: 'search', command: '/search', label: 'Buscar no projeto',
    icon: <FileSearch className="w-3.5 h-3.5" />,
    description: 'Busca texto no projeto usando /files/search',
    systemPrompt: 'Use a ferramenta search_files para encontrar ocorrências no projeto. Resuma os resultados de forma clara.',
    needsActiveFile: false, needsDiagnostics: false, needsGitDiff: false, expectsArgs: true,
    argsPlaceholder: 'useState'
  },
  {
    id: 'run', command: '/run', label: 'Executar comando',
    icon: <Play className="w-3.5 h-3.5" />,
    description: 'Executa comando no terminal do projeto',
    systemPrompt: 'Execute o comando solicitado usando a ferramenta run_command e reporte o resultado.',
    needsActiveFile: false, needsDiagnostics: false, needsGitDiff: false, expectsArgs: true,
    argsPlaceholder: 'npm run typecheck'
  },
  {
    id: 'undo', command: '/undo', label: 'Desfazer checkpoint',
    icon: <Undo2 className="w-3.5 h-3.5" />,
    description: 'Desfaz último checkpoint da IA',
    systemPrompt: 'O usuário quer desfazer a última mudança. Liste os checkpoints disponíveis e pergunte qual restaurar.',
    needsActiveFile: false, needsDiagnostics: false, needsGitDiff: false, expectsArgs: false
  },
  {
    id: 'clear', command: '/clear', label: 'Limpar histórico',
    icon: <Trash2 className="w-3.5 h-3.5" />,
    description: 'Limpa o histórico do chat atual',
    systemPrompt: '',
    needsActiveFile: false, needsDiagnostics: false, needsGitDiff: false, expectsArgs: false
  },
  {
    id: 'context', command: '/context', label: 'Adicionar ao contexto',
    icon: <Paperclip className="w-3.5 h-3.5" />,
    description: 'Adiciona arquivo ao contexto da conversa',
    systemPrompt: '',
    needsActiveFile: false, needsDiagnostics: false, needsGitDiff: false, expectsArgs: true,
    argsPlaceholder: 'src/components/Button.tsx'
  },
  {
    id: 'help', command: '/help', label: 'Ajuda',
    icon: <HelpCircle className="w-3.5 h-3.5" />,
    description: 'Lista todos os comandos disponíveis',
    systemPrompt: 'Liste todos os comandos disponíveis com uma breve descrição de cada um.',
    needsActiveFile: false, needsDiagnostics: false, needsGitDiff: false, expectsArgs: false
  },
]

interface SlashCommandMenuProps {
  isOpen: boolean
  query: string
  onSelect: (command: SlashCommand) => void
  onClose: () => void
  selectedIdx: number
}

export function SlashCommandMenu({ isOpen, query, onSelect, onClose, selectedIdx }: SlashCommandMenuProps) {
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = query
    ? SLASH_COMMANDS.filter(c =>
        c.command.includes(query.toLowerCase()) ||
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.description.toLowerCase().includes(query.toLowerCase())
      )
    : SLASH_COMMANDS

  useEffect(() => {
    if (listRef.current) {
      const el = listRef.current.children[selectedIdx] as HTMLElement
      if (el) el.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIdx])

  if (!isOpen) return null

  return (
    <div className="absolute bottom-[calc(100%+4px)] left-0 right-0 bg-[#1c2128] border border-[#30363d] rounded-lg shadow-xl z-50 overflow-hidden">
      <div className="text-[10px] text-[#8b949e] px-3 py-1.5 uppercase tracking-wider border-b border-[#21262d]">
        Comandos
      </div>
      <div ref={listRef} className="max-h-[180px] overflow-y-auto scrollbar-thin">
        {filtered.map((cmd, idx) => (
          <button
            key={cmd.id}
            onClick={() => onSelect(cmd)}
            className={`flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors ${
              idx === selectedIdx ? 'bg-[#1f6feb]/20 text-[#e6edf3]' : 'text-[#e6edf3] hover:bg-[#21262d]'
            }`}
          >
            <span className="text-[#58a6ff] shrink-0">{cmd.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] text-[#e6edf3]">{cmd.command}</p>
              <p className="text-[10px] text-[#8b949e] truncate">{cmd.description}</p>
            </div>
            {cmd.expectsArgs && (
              <span className="text-[9px] text-[#484f58] bg-[#21262d] px-1.5 py-0.5 rounded shrink-0">+args</span>
            )}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-[11px] text-[#484f58] py-4">Nenhum comando encontrado</p>
        )}
      </div>
    </div>
  )
}
