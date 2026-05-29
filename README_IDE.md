# Como usar o AnderFlow IDE

## Iniciando

```bash
npm run dev:full   # Inicia Next.js (3000) + IDE Server (3002)
```

Ou em terminais separados:

```bash
npm run dev          # Terminal 1: Next.js na porta 3000
npm run ide-server   # Terminal 2: IDE Server na porta 3002
```

## Acessando

Abra `/dashboard/ai` → clique no botao **"Abrir IDE"** (canto superior direito).

Ou acesse `/ide` diretamente.

## Atalhos principais

| Atalho | Acao |
|---|---|
| `Ctrl+P` | Paleta de comandos (buscar arquivos, comandos) |
| `Ctrl+S` | Salvar arquivo |
| `Ctrl+Shift+S` | Salvar todos |
| `Ctrl+\`` | Toggle Terminal |
| `Ctrl+Shift+X` | Toggle Chat IA |
| `Ctrl+,` | Abrir Configuracoes |
| `Ctrl+Shift+K` | Git: Commit |
| `Ctrl+Enter` | Enviar mensagem no chat |
| `↑/↓` | Navegar historico de comandos no terminal |
| `Tab` | Autocomplete no terminal / Indenta no editor |
| `Esc` | Fechar paleta / Cancelar edicao |

### Comandos na paleta (`Ctrl+P`)

Use prefixos para buscas especificas:

| Prefixo | Busca |
|---|---|
| (vazio) | Arquivos do projeto |
| `>` | Comandos disponiveis |
| `@` | Simbolos do arquivo ativo |
| `#` | Sessoes salvas |

## Slash Commands

No chat, inicie a mensagem com `/` para abrir o menu de comandos:

| Comando | Descricao |
|---|---|
| `/explain` | Explica o codigo do arquivo ativo |
| `/fix` | Analisa e corrige erros TypeScript/ESLint |
| `/test` | Gera testes para o arquivo ativo |
| `/refactor` | Refatora seguindo boas praticas |
| `/review` | Code review detalhado |
| `/docs` | Gera JSDoc para funcoes |
| `/commit` | Gera mensagem de commit |
| `/optimize` | Sugestoes de performance |
| `/scaffold` | Cria boilerplate (hook, componente, etc.) |
| `/search` | Busca texto no projeto |
| `/run` | Executa comando no terminal |
| `/undo` | Desfaz ultimo checkpoint |
| `/clear` | Limpa historico do chat |
| `/context` | Adiciona arquivo ao contexto |
| `/help` | Lista todos os comandos |

## Modos da IA

| Modo | Icone | Descricao |
|---|---|---|
| Normal | 💬 | Conversa livre |
| Programador | 👨‍💻 | Cria/edita arquivos, executa comandos |
| Agente | 🤖 | Tarefas autonomas multi-etapas com plano |
| Explicar | 🔍 | Explica codigo selecionado |
| Revisar | 📝 | Code review |
| Testes | 🧪 | Gera testes unitarios |

## Estrutura do IDE

```
┌─ Status Bar (modo, git, tokens, servidor) ──────────┐
│ ┌─ Explorer ─┐ ┌─ Editor ────────────┐ ┌─ Chat ───┐ │
│ │ src/        │ │ Tab1 Tab2 Tab3      │ │ Header    │ │
│ │  components │ │ ─────────────────── │ │ Messages  │ │
│ │  hooks      │ │ 1 │ import React... │ │           │ │
│ │  ...        │ │ 2 │                 │ │ Input     │ │
│ │             │ │ 3 │                 │ │           │ │
│ └─────────────┘ └────────────────────┘ └───────────┘ │
│ ┌─ Terminal (Terminal / Problems / Output / Git) ──┐ │
│ └───────────────────────────────────────────────────┘ │
│ ┌─ Bottom Bar (git, erros, UTF-8, Ln 1 Col 1) ─────┐ │
└───────────────────────────────────────────────────────┘
```

## Troubleshooting

### IDE Server offline

```bash
# Verifique se o servidor esta rodando
curl http://localhost:3002/health

# Inicie manualmente
npm run ide-server
```

### Permissao negada (401)

Verifique `FS_SECRET_KEY` no `.env` e `NEXT_PUBLIC_FS_KEY` (devem ser identicas).

### Chave de API nao configurada

Configure `DEEPSEEK_API_KEY` ou `ANTHROPIC_API_KEY` no `.env`.

### Arquivos nao aparecem no Explorer

Clique no icone de refresh (🔄) no header do Explorer para recarregar a arvore.

### Erro 404 ao acessar /ide

Certifique-se de que o Next.js esta rodando (`npm run dev`) e que a rota `/ide` existe em `src/app/ide/`.
