const IDE_KEY = process.env.NEXT_PUBLIC_IDE_KEY || 'anderflow-ide-dev-key'

let currentRoot: string | null = null

export function getWorkspaceRoot(): string | null {
  return currentRoot
}

export function setWorkspaceRoot(root: string | null) {
  currentRoot = root
}

export function getIDEHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    'X-IDE-Key': IDE_KEY,
    ...(currentRoot ? { 'X-IDE-Workspace': currentRoot } : {}),
    ...extra,
  }
}
