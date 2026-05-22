let baileys: any = undefined
let qrcode: any = undefined
let whatAi: any = undefined

async function getBaileys() {
  if (baileys) return baileys
  baileys = await import('@whiskeysockets/baileys')
  return baileys
}

async function getQRCode() {
  if (qrcode) return qrcode
  qrcode = await import('qrcode')
  return qrcode
}

async function getWhatsAppAI() {
  if (whatAi) return whatAi
  whatAi = await import('@/lib/whatsapp-ai')
  return whatAi
}

interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected'
  qr: string | undefined
  pairingCode: string | undefined
  method: 'qr' | 'code' | undefined
  phone: string | undefined
  error: string | undefined
  aiMode: boolean
  connectedPhone: string | undefined
}

const state: ConnectionState = {
  status: 'disconnected', qr: undefined, pairingCode: undefined, method: undefined,
  phone: undefined, error: undefined, aiMode: false, connectedPhone: undefined,
}

let sock: any = undefined

const chatHistory = new Map<string, { role: string; content: string }[]>()
const MAX_CHAT_HISTORY = 20

export function getChatHistory(): { phone: string; lastMessage: string }[] {
  const result: { phone: string; lastMessage: string }[] = []
  for (const [phone, msgs] of chatHistory) {
    const last = msgs[msgs.length - 1]
    result.push({ phone, lastMessage: last?.content?.slice(0, 60) || '' })
  }
  return result.reverse()
}

export function toggleAIMode(): boolean {
  state.aiMode = !state.aiMode
  return state.aiMode
}

export function getConnectionState(): ConnectionState {
  return { ...state }
}

async function handleIncomingMessage(msg: any) {
  if (!msg?.messages?.length) return
  const message = msg.messages[0]
  if (!message?.message || message.key?.fromMe) return

  const text = message.message.conversation || message.message.extendedTextMessage?.text || ''
  if (!text.trim()) return

  const remoteJid = message.key.remoteJid
  const phone = remoteJid?.split('@')[0] || ''

  if (!chatHistory.has(phone)) chatHistory.set(phone, [])
  const history = chatHistory.get(phone)!
  history.push({ role: 'user', content: text })
  if (history.length > MAX_CHAT_HISTORY) history.shift()

  if (state.aiMode) {
    try {
      const { chatWithAI, extractCommands, cleanReplyForWhatsApp } = await getWhatsAppAI()
      const aiMessages = history.slice(-10)
      const reply = await chatWithAI(aiMessages)
      const cleanReply = cleanReplyForWhatsApp(reply)

      if (cleanReply && sock) {
        await sock.sendMessage(remoteJid, { text: cleanReply })
        history.push({ role: 'assistant', content: cleanReply })
      }

      const commands = extractCommands(reply)
      if (commands.createUser) {
        await createUserFromAI(commands.createUser, phone)
        if (sock) sock.sendMessage(remoteJid, { text: `Pré-cadastro criado! Use o email ${commands.createUser.email} para acessar o portal. Um código de verificação será enviado ao tentar entrar.` })
      }
      if (commands.createProject) {
        await createProjectFromAI(commands.createProject)
        if (sock) sock.sendMessage(remoteJid, { text: `Projeto "${commands.createProject.name}" registrado! O admin avaliará e enviará a proposta.` })
      }
    } catch {}
  }
}

async function createUserFromAI(data: { name: string; email: string; company?: string; age?: string; address?: string }, phone: string) {
  try {
    const { prisma } = await import('@/lib/prisma')
    const bcrypt = await import('bcryptjs')
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) return
    const tempPassword = Math.random().toString(36).slice(-10)
    const hashed = await bcrypt.hash(tempPassword, 12)
    await prisma.user.create({
      data: { name: data.name, email: data.email, password: hashed, company: data.company || '', phone, role: 'CLIENT', isActive: true },
    })
  } catch {}
}

async function createProjectFromAI(data: { name: string; description: string; email: string }) {
  try {
    const { prisma } = await import('@/lib/prisma')
    const client = await prisma.user.findUnique({ where: { email: data.email } })
    if (!client) return
    const slug = data.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now()
    await prisma.project.create({
      data: { name: data.name, slug, description: data.description, type: 'CUSTOM', clientId: client.id, status: 'PENDING', priority: 'MEDIUM', tags: JSON.stringify(['whatsapp']) },
    })
  } catch {}
}

function setupSocketListeners(saveCreds: any, reconnect: () => void) {
  if (!sock) return

  sock.ev.on('connection.update', async (update: any) => {
    const { connection, qr, lastDisconnect } = update
    const { DisconnectReason } = await getBaileys()

    if (qr) {
      const QRCode = await getQRCode()
      state.qr = await QRCode.toDataURL(qr)
    }

    if (connection === 'open') {
      state.status = 'connected'
      state.qr = undefined
      state.pairingCode = undefined
      state.error = undefined
      if (sock?.user?.id) state.connectedPhone = sock.user.id.split(':')[0]
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
      state.status = 'disconnected'
      sock = undefined
      state.connectedPhone = undefined
      if (shouldReconnect) setTimeout(reconnect, 3000)
    }
  })

  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('messages.upsert', handleIncomingMessage)
}

export async function connectWithQR(): Promise<{ success: boolean; error?: string }> {
  if (state.status === 'connected') return { success: true }
  if (state.status === 'connecting') return { success: false, error: 'Conexão já em andamento' }

  state.status = 'connecting'; state.method = 'qr'
  state.qr = undefined; state.pairingCode = undefined; state.error = undefined

  try {
    const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = await getBaileys()
    const fs = await import('fs/promises')
    const path = await import('path')
    const authDir = path.join(process.cwd(), '.baileys_auth')
    try { await fs.mkdir(authDir, { recursive: true }) } catch {}
    const { state: authState, saveCreds } = await useMultiFileAuthState(authDir)
    const { version } = await fetchLatestBaileysVersion()

    sock = makeWASocket({ version, auth: authState, printQRInTerminal: false })
    setupSocketListeners(saveCreds, () => connectWithQR())
    return { success: true }
  } catch (error: any) {
    state.status = 'disconnected'
    state.error = error?.message || 'Erro ao conectar'
    return { success: false, error: state.error }
  }
}

export async function connectWithCode(phoneNumber: string): Promise<{ success: boolean; error?: string; code?: string }> {
  if (state.status === 'connected') return { success: true }
  if (state.status === 'connecting') return { success: false, error: 'Conexão já em andamento' }

  state.status = 'connecting'; state.method = 'code'; state.phone = phoneNumber
  state.qr = undefined; state.pairingCode = undefined; state.error = undefined

  try {
    const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = await getBaileys()
    const fs = await import('fs/promises')
    const path = await import('path')
    const authDir = path.join(process.cwd(), '.baileys_auth')
    try { await fs.mkdir(authDir, { recursive: true }) } catch {}
    const { state: authState, saveCreds } = await useMultiFileAuthState(authDir)
    const { version } = await fetchLatestBaileysVersion()

    sock = makeWASocket({ version, auth: authState, printQRInTerminal: false })
    setupSocketListeners(saveCreds, () => connectWithCode(phoneNumber))

    const code = await sock.requestPairingCode(phoneNumber)
    state.pairingCode = code
    return { success: true, code }
  } catch (error: any) {
    state.status = 'disconnected'
    state.error = error?.message || 'Erro ao conectar'
    return { success: false, error: state.error }
  }
}

export async function disconnectWhatsApp(): Promise<boolean> {
  try {
    if (sock) { await sock.logout(); sock = undefined }
    const fs = await import('fs/promises')
    const path = await import('path')
    const authDir = path.join(process.cwd(), '.baileys_auth')
    try { await fs.rm(authDir, { recursive: true, force: true }) } catch {}
    state.status = 'disconnected'; state.qr = undefined; state.pairingCode = undefined
    state.method = undefined; state.phone = undefined; state.error = undefined
    state.aiMode = false; state.connectedPhone = undefined
    return true
  } catch { return false }
}

export async function sendWhatsAppMessage(phone: string, message: string): Promise<{ sent: boolean; error?: string }> {
  if (!sock || state.status !== 'connected') return { sent: false, error: 'WhatsApp não conectado' }
  try {
    const number = phone.replace(/\D/g, '')
    await sock.sendMessage(`${number}@s.whatsapp.net`, { text: message })
    return { sent: true }
  } catch (error: any) {
    return { sent: false, error: error?.message || 'Erro ao enviar' }
  }
}

export async function tryRestoreSession(): Promise<void> {
  if (state.status === 'connected' || state.status === 'connecting') return
  try {
    const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = await getBaileys()
    const fs = await import('fs/promises')
    const path = await import('path')
    const authDir = path.join(process.cwd(), '.baileys_auth')
    try { await fs.access(authDir) } catch { return }
    const credsPath = path.join(authDir, 'creds.json')
    try { await fs.access(credsPath) } catch { return }

    state.status = 'connecting'; state.method = 'qr'
    state.qr = undefined; state.pairingCode = undefined; state.error = undefined

    const { state: authState, saveCreds } = await useMultiFileAuthState(authDir)
    const { version } = await fetchLatestBaileysVersion()
    sock = makeWASocket({ version, auth: authState, printQRInTerminal: false })
    setupSocketListeners(saveCreds, () => tryRestoreSession())
  } catch { state.status = 'disconnected' }
}
