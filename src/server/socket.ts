import { Server } from 'socket.io'
import type { Server as HTTPServer } from 'http'
import type { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  Room,
  User,
} from '@/types'
import { DEFAULT_VOTING_OPTIONS } from '@/types'

interface SocketData {
  userId: string
  roomId?: string
}

export class SocketServer {
  private static io: Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>
  private rooms: Map<string, Room> = new Map()

  constructor(server: HTTPServer) {
    if (!SocketServer.io) {
      SocketServer.io = new Server(server, {
        path: '/socket.io/',
        cors: {
          origin: (origin, callback) => {
            const allowedOrigins = [
              process.env.NEXT_PUBLIC_APP_URL,
              'https://poker-planning-next.vercel.app',
              'http://localhost:3000',
              'http://localhost:3001'
            ].filter(Boolean)

            // In production, allow the actual origin
            if (process.env.NODE_ENV === 'production' && origin) {
              callback(null, origin)
              return
            }

            // In development, check against allowed origins
            if (!origin || allowedOrigins.includes(origin)) {
              callback(null, true)
            } else {
              callback(new Error('Not allowed by CORS'))
            }
          },
          methods: ['GET', 'POST'],
          credentials: true,
          allowedHeaders: ['content-type']
        },
        transports: ['websocket', 'polling'],
        allowEIO3: true
      })
    }
  }

  private getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId)
  }

  private updateRoom(roomId: string, room: Room) {
    this.rooms.set(roomId, room)
    SocketServer.io.to(roomId).emit('room:updated', room)
  }

  private transferHost(room: Room) {
    // Find the next eligible host (non-spectator with longest time in room)
    const eligibleUsers = room.users.filter(u => !u.isSpectator)
    if (eligibleUsers.length > 0) {
      eligibleUsers[0].isHost = true
      // Notify the new host
      SocketServer.io.to(eligibleUsers[0].id).emit('host:transferred')
    }
  }

  public initializeHandlers() {
    const io = SocketServer.io

    io.on('connection', (socket) => {
      console.log('User connected:', socket.id)

      socket.on('room:join', (roomId: string, userName: string, isSpectator: boolean) => {
        const room = this.getRoom(roomId) || {
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
          joinedAt: Date.now(), // Add timestamp for host transfer priority
        }

        socket.join(roomId)
        socket.data.userId = user.id
        socket.data.roomId = roomId

        room.users.push(user)
        this.updateRoom(roomId, room)
        socket.emit('user:joined', user)
      })

      socket.on('vote:submit', (vote: string) => {
        const { roomId, userId } = socket.data
        if (!roomId || !userId) return

        const room = this.getRoom(roomId)
        if (!room) return

        const user = room.users.find(u => u.id === userId)
        if (!user) return

        user.vote = vote
        this.updateRoom(roomId, room)
        socket.to(roomId).emit('vote:submitted', userId, vote)
      })

      socket.on('votes:reveal', () => {
        const { roomId, userId } = socket.data
        if (!roomId || !userId) return

        const room = this.getRoom(roomId)
        if (!room) return

        const user = room.users.find(u => u.id === userId)
        if (!user?.isHost) return

        room.showVotes = true
        this.updateRoom(roomId, room)

        const votes = room.users.reduce((acc, user) => {
          if (user.vote) acc[user.id] = user.vote
          return acc
        }, {} as Record<string, string>)

        io.to(roomId).emit('votes:revealed', votes)
      })

      socket.on('voting:start', () => {
        const { roomId, userId } = socket.data
        if (!roomId || !userId) return

        const room = this.getRoom(roomId)
        if (!room) return

        const user = room.users.find(u => u.id === userId)
        if (!user?.isHost) return

        room.isVoting = true
        room.showVotes = false
        room.users.forEach(u => u.vote = null)
        
        this.updateRoom(roomId, room)
        io.to(roomId).emit('voting:started')
      })

      socket.on('voting:end', () => {
        const { roomId, userId } = socket.data
        if (!roomId || !userId) return

        const room = this.getRoom(roomId)
        if (!room) return

        const user = room.users.find(u => u.id === userId)
        if (!user?.isHost) return

        room.isVoting = false
        this.updateRoom(roomId, room)
        io.to(roomId).emit('voting:ended')
      })

      socket.on('disconnect', () => {
        const { roomId, userId } = socket.data
        if (!roomId || !userId) return

        const room = this.getRoom(roomId)
        if (!room) return

        const disconnectedUser = room.users.find(u => u.id === userId)
        const wasHost = disconnectedUser?.isHost

        room.users = room.users.filter(u => u.id !== userId)
        
        if (room.users.length === 0) {
          this.rooms.delete(roomId)
        } else {
          // If the host left, transfer host role
          if (wasHost) {
            this.transferHost(room)
          }
          this.updateRoom(roomId, room)
        }

        socket.to(roomId).emit('user:left', userId)
      })
    })
  }
}

export default SocketServer 