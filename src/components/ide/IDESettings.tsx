"use client"

import { useState, useEffect, useRef } from 'react'
import { X, Check, Loader2 } from 'lucide-react'

const IDE_SERVER_URL = process.env.NEXT_PUBLIC_IDE_SERVER_URL || 'http://localhost:3002'

export interface IDESettings {
  fontSize: number
  fontFamily: string
  highlightTheme: string
  autoSave: string
  showLineNumbers: boolean
  tabSize: number
  model: string
  temperature: number
  inlineSuggestions: boolean
  language: string
  serverUrl: string
  serverKey: string
}

export const DEFAULTS: IDESettings = {
  fontSize: 13,
  fontFamily: 'JetBrains Mono',
  highlightTheme: 'GitHub Dark',
  autoSave: 'off',
  showLineNumbers: true,
  tabSize: 2,
  model: 'deepseek-v4-flash',
  temperature: 0.3,
  inlineSuggestions: false,
  language: 'Português',
  serverUrl: IDE_SERVER_URL,
  serverKey: ''
}

const MODELS = [
  { id: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
  { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4 (Anthropic)' },
  { id: 'claude-opus-4-7', label: 'Claude Opus 4 (Anthropic)' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4 (Anthropic)' },
  { id: 'gpt-4o', label: 'GPT-4o (OpenAI)' },
  { id: 'gpt-4-turbo', label: 'GPT-4 Turbo (OpenAI)' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Google)' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Google)' },
]

const FONT_FAMILIES = ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'Monaco']
const THEMES = ['GitHub Dark', 'Dracula', 'One Dark', 'Monokai', 'Nord']
const AUTO_SAVES = ['off', '1s', '5s', '30s']
const LANGUAGES = ['Português', 'English']

const STORAGE_KEY = 'anderflow_ide_settings'

export function loadSettings(): IDESettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS }
  } catch { return { ...DEFAULTS } }
}

export function saveSettings(settings: IDESettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

interface IDESettingsProps {
  onClose: () => void
}

const SHORTCUTS = [
  ['Ctrl+P', 'Abrir Command Palette'],
  ['Ctrl+Shift+P', 'Command Palette (comandos)'],
  ['Ctrl+S', 'Salvar arquivo ativo'],
  ['Ctrl+Shift+S', 'Salvar todos os arquivos'],
  ['Ctrl+W', 'Fechar aba ativa'],
  ['Ctrl+Tab', 'Próxima aba'],
  ['Ctrl+Shift+Tab', 'Aba anterior'],
  ['Ctrl+`', 'Toggle Terminal'],
  ['Ctrl+B', 'Toggle File Explorer'],
  ['Ctrl+Shift+X', 'Toggle Chat IA'],
  ['Ctrl+,', 'Abrir Configurações'],
  ['Ctrl+L', 'Nova conversa no chat'],
  ['Ctrl+Z', 'Desfazer (checkpoint)'],
  ['Ctrl+Shift+G', 'Focar aba GIT'],
  ['Ctrl+Shift+M', 'Focar aba PROBLEMAS'],
  ['F2', 'Renomear arquivo'],
  ['Esc', 'Fechar menus'],
]

export function IDESettings({ onClose }: IDESettingsProps) {
  const [settings, setSettings] = useState<IDESettings>(loadSettings)
  const [tab, setTab] = useState<'editor' | 'ia' | 'server' | 'shortcuts'>('editor')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'ok' | 'error' | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  useEffect(() => {
    document.documentElement.style.setProperty('--ide-font-size', `${settings.fontSize}px`)
    document.documentElement.style.setProperty('--ide-font-family', settings.fontFamily)
  }, [settings.fontSize, settings.fontFamily])

  const update = (key: keyof IDESettings, value: string | number | boolean) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value }
      saveSettings(next)
      return next
    })
  }

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const url = settings.serverUrl || IDE_SERVER_URL
      const res = await fetch(`${url}/health`, {
        headers: { 'X-IDE-Key': settings.serverKey || 'anderflow-ide-dev-key' },
        signal: AbortSignal.timeout(5000)
      })
      setTestResult(res.ok ? 'ok' : 'error')
    } catch {
      setTestResult('error')
    }
    setTesting(false)
  }

  return (
    <div className="fixed inset-0 z-[250]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        ref={modalRef}
        className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[650px] max-w-[95vw] bg-[#1c2128] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden flex"
        style={{ height: '440px' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-[140px] shrink-0 border-r border-[#21262d] py-2">
          {(['editor', 'ia', 'server', 'shortcuts'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`w-full px-3 py-1.5 text-left text-[12px] transition-colors ${
                tab === t ? 'bg-[#1f6feb]/20 text-[#58a6ff] border-l-2 border-[#1f6feb]' : 'text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3]'
              }`}
            >
              {t === 'editor' ? 'Editor' : t === 'ia' ? 'IA' : t === 'server' ? 'Servidor' : 'Atalhos'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[13px] font-medium text-[#e6edf3]">
              {tab === 'editor' ? 'Editor' : tab === 'ia' ? 'Inteligência Artificial' : tab === 'server' ? 'Servidor IDE' : 'Atalhos de Teclado'}
            </span>
            <button onClick={onClose} className="text-[#8b949e] hover:text-[#e6edf3]"><X className="w-4 h-4" /></button>
          </div>

          {tab === 'editor' && (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-[#8b949e]">Tamanho da fonte: {settings.fontSize}px</label>
                <input type="range" min={12} max={18} value={settings.fontSize}
                  onChange={e => update('fontSize', parseInt(e.target.value))}
                  className="w-full mt-1 accent-[#1f6feb]" />
              </div>
              <div>
                <label className="text-[11px] text-[#8b949e]">Família da fonte</label>
                <select value={settings.fontFamily} onChange={e => update('fontFamily', e.target.value)}
                  className="w-full mt-1 bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-[12px] text-[#e6edf3] outline-none">
                  {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-[#8b949e]">Tema de highlight</label>
                <select value={settings.highlightTheme} onChange={e => update('highlightTheme', e.target.value)}
                  className="w-full mt-1 bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-[12px] text-[#e6edf3] outline-none">
                  {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-[#8b949e]">Auto-save</label>
                <select value={settings.autoSave} onChange={e => update('autoSave', e.target.value)}
                  className="w-full mt-1 bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-[12px] text-[#e6edf3] outline-none">
                  {AUTO_SAVES.map(a => <option key={a} value={a}>{a === 'off' ? 'Desligado' : a}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#e6edf3]">Mostrar números de linha</span>
                <button onClick={() => update('showLineNumbers', !settings.showLineNumbers)}
                  className={`w-9 h-5 rounded-full transition-colors ${settings.showLineNumbers ? 'bg-[#1f6feb]' : 'bg-[#30363d]'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${settings.showLineNumbers ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                </button>
              </div>
              <div>
                <label className="text-[11px] text-[#8b949e]">Tab =</label>
                <div className="flex gap-2 mt-1">
                  {[2, 4].map(n => (
                    <button key={n} onClick={() => update('tabSize', n)}
                      className={`px-2 py-0.5 rounded text-[11px] ${settings.tabSize === n ? 'bg-[#1f6feb] text-white' : 'bg-[#21262d] text-[#8b949e]'}`}>
                      {n} espaços
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'ia' && (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-[#8b949e]">Modelo padrão</label>
                <select value={settings.model} onChange={e => update('model', e.target.value)}
                  className="w-full mt-1 bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-[12px] text-[#e6edf3] outline-none">
                  {MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-[#8b949e]">Temperatura: {settings.temperature.toFixed(1)}</label>
                <input type="range" min={0} max={1} step={0.1} value={settings.temperature}
                  onChange={e => update('temperature', parseFloat(e.target.value))}
                  className="w-full mt-1 accent-[#1f6feb]" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#e6edf3]">Sugestões inline</span>
                <button onClick={() => update('inlineSuggestions', !settings.inlineSuggestions)}
                  className={`w-9 h-5 rounded-full transition-colors ${settings.inlineSuggestions ? 'bg-[#1f6feb]' : 'bg-[#30363d]'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${settings.inlineSuggestions ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                </button>
              </div>
              <div>
                <label className="text-[11px] text-[#8b949e]">Idioma de resposta</label>
                <select value={settings.language} onChange={e => update('language', e.target.value)}
                  className="w-full mt-1 bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-[12px] text-[#e6edf3] outline-none">
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
          )}

          {tab === 'server' && (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-[#8b949e]">URL do IDE server</label>
                <input value={settings.serverUrl} onChange={e => update('serverUrl', e.target.value)}
                  className="w-full mt-1 bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-[12px] text-[#e6edf3] outline-none" />
              </div>
              <div>
                <label className="text-[11px] text-[#8b949e]">Chave de acesso</label>
                <input type="password" value={settings.serverKey} onChange={e => update('serverKey', e.target.value)}
                  className="w-full mt-1 bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-[12px] text-[#e6edf3] outline-none" />
              </div>
              <button onClick={testConnection} disabled={testing}
                className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#21262d] text-[12px] text-[#e6edf3] hover:bg-[#30363d] disabled:opacity-50">
                {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Testar Conexão
              </button>
              {testResult === 'ok' && <p className="text-[11px] text-green-400 flex items-center gap-1"><Check className="w-3 h-3" /> Conectado com sucesso</p>}
              {testResult === 'error' && <p className="text-[11px] text-red-400">Falha na conexão — verifique se o servidor está rodando</p>}
            </div>
          )}

          {tab === 'shortcuts' && (
            <div className="space-y-0.5">
              {SHORTCUTS.map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between py-1 text-[11px]">
                  <span className="text-[#e6edf3]">{desc}</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] text-[10px] border border-[#30363d]">{key}</kbd>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
