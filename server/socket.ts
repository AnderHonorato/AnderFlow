import { Server } from 'socket.io'
import { createServer } from 'http'

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

const onlineUsers = new Map<string, string>()

io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId

  if (userId) {
    onlineUsers.set(userId, socket.id)
    io.emit('user:online', { userId, isOnline: true })
  }

  socket.on('room:join', (roomId: string) => {
    socket.join(roomId)
  })

  socket.on('room:leave', (roomId: string) => {
    socket.leave(roomId)
  })

  socket.on('message:send', (data) => {
    const message = {
      ...data,
      senderId: userId,
      createdAt: new Date().toISOString(),
      id: `msg_${Date.now()}`,
    }

    if (data.channelId) {
      io.to(data.channelId).emit('message:new', message)
    } else if (data.recipientId) {
      const recipientSocket = onlineUsers.get(data.recipientId)
      if (recipientSocket) {
        io.to(recipientSocket).emit('message:new', message)
      }
      socket.emit('message:new', message)
    }
  })

  socket.on('typing', (data: { roomId: string; isTyping: boolean }) => {
    socket.to(data.roomId).emit('typing', { userId, isTyping: data.isTyping })
  })

  socket.on('notification:send', (data) => {
    const recipientSocket = onlineUsers.get(data.recipientId)
    if (recipientSocket) {
      io.to(recipientSocket).emit('notification:new', data)
    }
  })

  socket.on('disconnect', () => {
    if (userId) {
      onlineUsers.delete(userId)
      io.emit('user:online', { userId, isOnline: false })
    }
  })
})

const PORT = parseInt(process.env.SOCKET_PORT || '3001')
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`)
})

export { io }
