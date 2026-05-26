# ============================================
# CLAUDE CODE + DEEPSEEK INTEGRATION GUIDE
# Use DeepSeek V4 como backend do Claude Code
# ============================================

# PASSO 1: Instalar Claude Code
# npm install -g @anthropic-ai/claude-code

# PASSO 2: Adicione ao seu .bashrc, .zshrc ou perfil do PowerShell ($PROFILE):
#
# PowerShell ($PROFILE):
# $env:ANTHROPIC_BASE_URL = "https://api.deepseek.com/anthropic"
# $env:ANTHROPIC_AUTH_TOKEN = "sk-sua-chave-deepseek-aqui"
# $env:API_TIMEOUT_MS = "600000"
# $env:ANTHROPIC_MODEL = "deepseek-v4-flash"
# $env:ANTHROPIC_SMALL_FAST_MODEL = "deepseek-v4-flash"
# $env:CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = "1"
#
# Bash/Zsh:
# export ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic
# export ANTHROPIC_AUTH_TOKEN=sk-sua-chave-deepseek-aqui
# export API_TIMEOUT_MS=600000
# export ANTHROPIC_MODEL=deepseek-v4-flash
# export ANTHROPIC_SMALL_FAST_MODEL=deepseek-v4-flash
# export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1

# PASSO 3: Execute no diretorio do projeto
# cd C:\Projetos\Andamento\andero-clientes-sitemaster
# claude

# RESULTADO: Agente de codigo completo usando DeepSeek V4 Flash como backend
# Custo muito menor que usar Claude diretamente (preco DeepSeek vs Anthropic)

# NOTAS:
# - Campos ignorados: anthropic-beta, anthropic-version, cache_control, mcp_servers, metadata
# - Nao suportados: imagem, documento, search_result, server_tool_use
# - Modelos disponiveis: deepseek-v4-flash, deepseek-v4-pro, deepseek-chat, deepseek-reasoner
