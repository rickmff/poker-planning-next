import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { parse } from 'url'
import path from 'node:path'
import next from 'next'
import { Server } from 'socket.io'
import { 
  ClientToServerEvents, 
  ServerToClientEvents,
  Room,
  User,
  DEFAULT_VOTING_OPTIONS
} from './src/types/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dev = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev })
const handle = app.getRequestHandler()

interface SocketData {
  userId: string
  roomId?: string
}

const rooms = new Map<string, Room>()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url || '/', true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  const io = new Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(server, {
    path: '/socket.io/',
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? process.env.NEXT_PUBLIC_APP_URL
        : 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['polling', 'websocket'],
    pingTimeout: 20000,
    pingInterval: 10000
  })

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    socket.on('room:join', (roomId: string, userName: string, isSpectator: boolean) => {
      const room = rooms.get(roomId) || {
        id: roomId,
        name: `Room ${roomId}`,
        users: [],
        isVoting: false,
        showVotes: false,
        votingOptions: DEFAULT_VOTING_OPTIONS,
      }

      const user: User = {
        id: socket.id,
        name: userName,
        isHost: room.users.length === 0,
        vote: null,
        isSpectator,
        joinedAt: Date.now(),
      }

      socket.join(roomId)
      socket.data.userId = user.id
      socket.data.roomId = roomId

      room.users.push(user)
      rooms.set(roomId, room)
      io.to(roomId).emit('room:updated', room)
      socket.emit('user:joined', user)
    })

    socket.on('vote:submit', (vote: string) => {
      const { roomId, userId } = socket.data
      if (!roomId || !userId) return

      const room = rooms.get(roomId)
      if (!room) return

      const user = room.users.find(u => u.id === userId)
      if (!user) return

      user.vote = vote
      rooms.set(roomId, room)
      io.to(roomId).emit('room:updated', room)
      socket.to(roomId).emit('vote:submitted', userId, vote)
    })

    socket.on('votes:reveal', () => {
      const { roomId, userId } = socket.data
      if (!roomId || !userId) return

      const room = rooms.get(roomId)
      if (!room) return

      const user = room.users.find(u => u.id === userId)
      if (!user?.isHost) return

      room.showVotes = true
      rooms.set(roomId, room)
      io.to(roomId).emit('room:updated', room)

      const votes = room.users.reduce((acc, user) => {
        if (user.vote) acc[user.id] = user.vote
        return acc
      }, {} as Record<string, string>)

      io.to(roomId).emit('votes:revealed', votes)
    })

    socket.on('voting:start', () => {
      const { roomId, userId } = socket.data
      if (!roomId || !userId) return

      const room = rooms.get(roomId)
      if (!room) return

      const user = room.users.find(u => u.id === userId)
      if (!user?.isHost) return

      room.isVoting = true
      room.showVotes = false
      room.users.forEach(u => u.vote = null)
      
      rooms.set(roomId, room)
      io.to(roomId).emit('room:updated', room)
      io.to(roomId).emit('voting:started')
    })

    socket.on('voting:end', () => {
      const { roomId, userId } = socket.data
      if (!roomId || !userId) return

      const room = rooms.get(roomId)
      if (!room) return

      const user = room.users.find(u => u.id === userId)
      if (!user?.isHost) return

      room.isVoting = false
      rooms.set(roomId, room)
      io.to(roomId).emit('room:updated', room)
      io.to(roomId).emit('voting:ended')
    })

    socket.on('disconnect', () => {
      const { roomId, userId } = socket.data
      if (!roomId || !userId) return

      const room = rooms.get(roomId)
      if (!room) return

      const disconnectedUser = room.users.find(u => u.id === userId)
      const wasHost = disconnectedUser?.isHost

      room.users = room.users.filter(u => u.id !== userId)
      
      if (room.users.length === 0) {
        rooms.delete(roomId)
      } else {
        if (wasHost) {
          const eligibleUsers = room.users.filter(u => !u.isSpectator)
          if (eligibleUsers.length > 0) {
            eligibleUsers[0].isHost = true
            io.to(eligibleUsers[0].id).emit('host:transferred')
          }
        }
        rooms.set(roomId, room)
        io.to(roomId).emit('room:updated', room)
      }

      socket.to(roomId).emit('user:left', userId)
    })
  })

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
  })
}) 