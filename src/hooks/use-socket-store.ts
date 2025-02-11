import { create } from 'zustand'
import { Room, User } from '@/types'
import { initSocket } from '@/lib/socket'
import { toast } from 'sonner'

interface SocketStore {
  room: Room | null
  currentUser: User | null
  isConnected: boolean
  isLoading: boolean
  error: string | null
  joinRoom: (roomId: string, userName: string, isSpectator: boolean) => void
  leaveRoom: () => void
  submitVote: (vote: string) => void
  revealVotes: () => void
  startVoting: () => void
  endVoting: () => void
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  room: null,
  currentUser: null,
  isConnected: false,
  isLoading: false,
  error: null,

  joinRoom: (roomId: string, userName: string, isSpectator: boolean) => {
    const socket = initSocket()
    set({ isLoading: true, error: null })

    socket.emit('room:join', roomId, userName, isSpectator)

    socket.on('user:joined', (user: User) => {
      set({ currentUser: user, isLoading: false })
    })

    socket.on('room:updated', (room: Room) => {
      set({ room })
    })

    socket.on('host:transferred', () => {
      set((state) => ({
        currentUser: state.currentUser ? { ...state.currentUser, isHost: true } : null,
        room: state.room ? {
          ...state.room,
          users: state.room.users.map(user => ({
            ...user,
            isHost: user.id === state.currentUser?.id
          }))
        } : null
      }))
      
      toast.success('You are now the host of this room!', {
        description: 'You can now control the voting session.'
      })
    })

    socket.on('error', (message: string) => {
      set({ error: message, isLoading: false })
    })

    socket.on('connect', () => {
      set({ isConnected: true })
    })

    socket.on('disconnect', () => {
      set({ isConnected: false })
    })
  },

  leaveRoom: () => {
    const socket = initSocket()
    const { room, currentUser } = get()
    
    if (room) {
      // If the leaving user is the host, let the server know
      if (currentUser?.isHost) {
        socket.emit('host:leave', room.id)
      }
      socket.emit('room:leave', room.id)
      set({ room: null, currentUser: null })
    }
  },

  submitVote: (vote: string) => {
    const socket = initSocket()
    socket.emit('vote:submit', vote)
  },

  revealVotes: () => {
    const socket = initSocket()
    socket.emit('votes:reveal')
  },

  startVoting: () => {
    const socket = initSocket()
    socket.emit('voting:start')
  },

  endVoting: () => {
    const socket = initSocket()
    socket.emit('voting:end')
  },
})) 