'use client'

import { Component, ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'

interface Props { children: ReactNode; fallback?: ReactNode; name?: string }
interface State { hasError: boolean; error?: Error }

export class SafeSection extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error(`[SafeSection${this.props.name ? `:${this.props.name}` : ''}]`, error)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex flex-col items-center justify-center p-6 rounded-[14px] border border-destructive/20 bg-destructive/5 text-center space-y-2 animate-fade-in">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
            <RefreshCw className="h-5 w-5 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground">Não conseguimos carregar esta seção</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="btn btn-ghost btn-sm text-xs"
          >
            Tentar novamente
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
