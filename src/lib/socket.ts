import { io, Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@/types'

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null

const getSocketUrl = () => {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL
  }
  
  // In production, use the Vercel URL
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  }
  
  // Fallback to localhost for development
  return 'http://localhost:3000'
}

export const initSocket = () => {
  if (!socket) {
    socket = io(getSocketUrl(), {
      reconnectionDelayMax: 10000,
      autoConnect: true,
      withCredentials: true, // Important for CORS
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