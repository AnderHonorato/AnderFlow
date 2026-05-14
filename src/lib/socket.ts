import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') + ':3001' || 'http://localhost:3001'

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket'],
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
  s.emit('message:send', data)
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
