'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSocketStore } from '@/hooks/use-socket-store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

export function JoinRoomForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roomIdFromUrl = searchParams.get('room')

  const [name, setName] = useState('')
  const [roomId, setRoomId] = useState(roomIdFromUrl || '')
  const [isSpectator, setIsSpectator] = useState(false)
  const joinRoom = useSocketStore((state) => state.joinRoom)
  const isLoading = useSocketStore((state) => state.isLoading)
  const room = useSocketStore((state) => state.room)

  // Update room ID when URL changes
  useEffect(() => {
    if (roomIdFromUrl) {
      setRoomId(roomIdFromUrl)
    }
  }, [roomIdFromUrl])

  // Redirect to room page when joined
  useEffect(() => {
    if (room) {
      router.replace(`/room/${room.id}`)
    }
  }, [room, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !roomId.trim()) {
      toast.error('Please fill in all fields')
      return
    }
    
    await joinRoom(roomId.trim(), name.trim(), isSpectator)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card rounded-lg border shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomId">Room ID</Label>
              <Input
                id="roomId"
                placeholder="Enter room ID or create new"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="h-12"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label htmlFor="spectator">Join as Spectator</Label>
              <div className="text-sm text-muted-foreground">
                Observe without voting
              </div>
            </div>
            <Switch
              id="spectator"
              checked={isSpectator}
              onCheckedChange={setIsSpectator}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-lg"
            disabled={isLoading}
          >
            {isLoading ? 'Joining...' : 'Join Room'}
          </Button>
        </form>
      </div>

      {/* Preview Cards */}
      <div className="mt-12 flex justify-center gap-4">
        {['3', '5', '8'].map((value) => (
          <Card
            key={value}
            value={value}
            revealed={true}
            className="w-16 h-24 -rotate-12 transform hover:rotate-0 transition-transform"
          />
        ))}
      </div>
    </div>
  )
} 