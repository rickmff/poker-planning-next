'use client'

import { JoinRoomForm } from '@/components/join-room-form'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col items-center gap-8 pt-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
              Planning Poker
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Join a room to start planning with your team. Create estimates together in real-time.
            </p>
          </div>
          <JoinRoomForm />
        </div>
      </div>
    </main>
  )
}
