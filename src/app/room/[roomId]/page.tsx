'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSocketStore } from '@/hooks/use-socket-store'
import { PlanningRoom } from '@/components/planning-room'

export default function RoomPage({
  params,
}: {
  params: { roomId: string }
}) {
  const router = useRouter()
  const room = useSocketStore((state) => state.room)
  const currentUser = useSocketStore((state) => state.currentUser)

  // If we're not in a room, redirect to join page with room ID
  useEffect(() => {
    if (!room && !currentUser) {
      router.replace(`/?room=${params.roomId}`)
    }
  }, [room, currentUser, router, params.roomId])

  // If we're not in a room, show loading
  if (!room || !currentUser) {
    return null
  }

  // If we're in a different room, redirect to that room
  if (room.id !== params.roomId) {
    router.replace(`/room/${room.id}`)
    return null
  }

  return <PlanningRoom />
} 