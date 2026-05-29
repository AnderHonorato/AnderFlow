export interface Tab {
  id: string
  path: string
  name: string
  language: string
  content: string
  isDirty: boolean
  isActive: boolean
}

export interface FileContent {
  path: string
  content: string
  language: string
  lines: number
}

export interface GitStats {
  branch: string
  ahead: number
  behind: number
  modified: string[]
  staged: string[]
  untracked: string[]
}

export interface Diagnostic {
  file: string
  line: number
  col: number
  message: string
  severity: 'error' | 'warning'
  code: string
}

export type AIMode = 'normal' | 'programmer' | 'agent' | 'explain' | 'review' | 'test'
