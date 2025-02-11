import { Server as NetServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'
import { Socket } from 'net'
import { 
  ClientToServerEvents, 
  ServerToClientEvents,
  Room,
  User,
  DEFAULT_VOTING_OPTIONS
} from '@/types'

interface SocketData {
  userId: string
  roomId?: string
}

export const config = {
  api: {
    bodyParser: false,
  },
}

interface SocketServer extends NetServer {
  io?: ServerIO<ClientToServerEvents, ServerToClientEvents, {}, SocketData>
}

interface ResponseWithSocket extends NextApiResponse {
  socket: Socket & {
    server: SocketServer
  }
}

const rooms = new Map<string, Room>()

const ioHandler = async (req: NextApiRequest, res: ResponseWithSocket) => {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO server...')
    const httpServer: NetServer = res.socket.server as any
    const io = new ServerIO<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      transports: ['polling', 'websocket'],
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? 'https://poker-planning-next.vercel.app'
          : 'http://localhost:3000',
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['content-type'],
        credentials: true
      },
      // Vercel specific settings
      maxHttpBufferSize: 1e8,
      pingTimeout: 60000,
      pingInterval: 25000,
      connectTimeout: 45000,
      upgradeTimeout: 30000,
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

    res.socket.server.io = io
  }

  // Required for Vercel serverless functions
  if (req.method === 'POST') {
    // Handle Socket.IO HTTP transport
    res.status(200).json({ message: 'Socket server running' })
  } else {
    // Handle WebSocket upgrade
    res.status(200).end()
  }
}

export default ioHandler 