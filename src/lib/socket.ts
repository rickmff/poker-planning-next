import { io, Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@/types'

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null

const getSocketUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

export const initSocket = () => {
  if (!socket) {
    const url = getSocketUrl()
    console.log('Connecting to socket server at:', url)
    
    socket = io(url, {
      path: '/socket.io/',
      transports: ['polling', 'websocket'],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      autoConnect: true,
      withCredentials: true,
      timeout: 20000,
    })

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message)
      if (socket) {
        socket.connect()
      }
    })

    socket.on('connect', () => {
      console.log('Socket connected successfully')
    })

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      if (reason === 'io server disconnect' || reason === 'transport close') {
        socket?.connect()
      }
    })
  }
  return socket
}

export const getSocket = () => {
  if (!socket) {
    return initSocket()
  }
  return socket
} 