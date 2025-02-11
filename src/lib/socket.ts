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
      path: '/api/socket',
      addTrailingSlash: false,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      transports: ['polling', 'websocket'] as const,
      autoConnect: true,
      withCredentials: true,
      timeout: 60000,
      forceNew: true,
    })

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message)
      // Only fallback to polling if websocket fails
      if (err.message.includes('websocket') && socket?.io?.opts) {
        console.log('Falling back to polling transport')
        const currentSocket = socket
        currentSocket.disconnect()
        socket = io(url, {
          ...currentSocket.io.opts,
          transports: ['polling'] as const,
          forceNew: true,
        })
      }
    })

    socket.on('connect', () => {
      console.log('Socket connected successfully')
    })

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      // Automatically try to reconnect on connection loss
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