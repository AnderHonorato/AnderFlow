'use client'

import { Component, type ReactNode } from 'react'
import dynamic from 'next/dynamic'

const ReportarErro = dynamic(() => import('@/components/ui/reportar-erro').then(m => ({ default: m.ReportarErro })), { ssr: false })

interface Props {
  children: ReactNode
}

interface Estado {
  temErro: boolean
  erro: Error | null
  infoErro: string
}

export class LimiteErro extends Component<Props, Estado> {
  constructor(props: Props) {
    super(props)
    this.state = { temErro: false, erro: null, infoErro: '' }
  }

  static getDerivedStateFromError(erro: Error): Partial<Estado> {
    return { temErro: true, erro }
  }

  componentDidCatch(_erro: Error, info: { componentStack: string }) {
    this.setState({ infoErro: info.componentStack })
  }

  private recarregar = () => {
    window.location.reload()
  }

  render() {
    if (this.state.temErro) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--destructive-subtle)] flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--destructive)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-[16px] font-[600] text-[var(--text)] mb-1">
            Algo deu errado
          </h2>
          <p className="text-[13px] text-[var(--text-2)] mb-2 max-w-md">
            Ocorreu um erro inesperado ao renderizar esta pagina.
          </p>
          {this.state.erro && (
            <details className="mb-4 text-left max-w-lg">
              <summary className="text-[11px] text-[var(--text-3)] cursor-pointer hover:text-[var(--text-2)]">
                Detalhes tecnicos
              </summary>
              <pre className="mt-2 p-3 rounded-lg bg-[var(--surface-2)] text-[10px] text-[var(--text-3)] overflow-auto max-h-[200px] whitespace-pre-wrap font-mono">
                {this.state.erro.message}
                {'\n\n'}
                {this.state.erro.stack}
                {'\n\n'}
                {this.state.infoErro}
              </pre>
            </details>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={this.recarregar}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-[13px] font-[500] hover:opacity-90 transition-opacity"
            >
              Tentar novamente
            </button>
            <ReportarErro erroPreenchido={this.state.erro?.message} />
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
