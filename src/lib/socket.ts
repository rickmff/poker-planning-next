import { io, Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@/types'

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null

const getSocketUrl = () => {
  // In production, use the Vercel URL
  if (typeof window !== 'undefined') {
    // Use the current window location in production
    if (window.location.hostname !== 'localhost') {
      return `${window.location.protocol}//${window.location.host}`
    }
  }
  
  // Use environment variable if set
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL
  }
  
  // Fallback to localhost for development
  return 'http://localhost:3000'
}

export const initSocket = () => {
  if (!socket) {
    const url = getSocketUrl()
    console.log('Connecting to socket server at:', url)
    
    socket = io(url, {
      reconnectionDelayMax: 10000,
      autoConnect: true,
      withCredentials: true,
      path: '/socket.io/',
    })

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message)
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