import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

function getSocketUrl(): string {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) return process.env.NEXT_PUBLIC_SOCKET_URL
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  try {
    const url = new URL(base)
    url.port = '3001'
    return url.toString()
  } catch {
    return 'http://localhost:3001'
  }
}

const SOCKET_URL = getSocketUrl()

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    })

    socket.on('connect', () => {
      console.log('[Socket] Conectado')
    })

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Desconectado:', reason)
      if (reason === 'io server disconnect') {
        socket?.connect()
      }
    })

    socket.on('reconnect', (attemptNumber) => {
      console.log(`[Socket] Reconectado apos ${attemptNumber} tentativas`)
    })

    socket.on('reconnect_failed', () => {
      console.error('[Socket] Falha na reconexao apos todas as tentativas')
    })
  }
  return socket
}

export function connectSocket(userId: string) {
  const s = getSocket()
  if (!s.connected) {
    s.auth = { userId }
    s.connect()
  }
  return s
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect()
  }
}

export function onMessage(callback: (message: any) => void) {
  const s = getSocket()
  s.on('message:new', callback)
  return () => {
    s.off('message:new', callback)
  }
}

export function sendMessage(data: { content: string; channelId?: string; projectId?: string; recipientId?: string }) {
  const s = getSocket()
  if (!s.connected) {
    console.warn('[Socket] Nao conectado, mensagem nao enviada')
    return false
  }
  s.emit('message:send', data)
  return true
}

export function onNotification(callback: (notification: any) => void) {
  const s = getSocket()
  s.on('notification:new', callback)
  return () => {
    s.off('notification:new', callback)
  }
}

export function joinRoom(roomId: string) {
  const s = getSocket()
  s.emit('room:join', roomId)
}

export function leaveRoom(roomId: string) {
  const s = getSocket()
  s.emit('room:leave', roomId)
}

export function onTyping(callback: (data: { userId: string; isTyping: boolean }) => void) {
  const s = getSocket()
  s.on('typing', callback)
  return () => {
    s.off('typing', callback)
  }
}

export function emitTyping(roomId: string, isTyping: boolean) {
  const s = getSocket()
  s.emit('typing', { roomId, isTyping })
}
