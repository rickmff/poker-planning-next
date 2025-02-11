'use client'

import { User } from '@/types'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface PlayerCardProps {
  user: User
  showVote: boolean
  isVoting: boolean
  className?: string
}

export function PlayerCard({ user, showVote, isVoting, className }: PlayerCardProps) {
  const hasVoted = user.vote !== null

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className="relative flex flex-col items-center">
        {!user.isSpectator && hasVoted && (
          <div className={cn(
            "mb-1 transform transition-transform",
            showVote ? "hover:scale-105" : "hover:rotate-3"
          )}>
            <Card
              value={user.vote}
              revealed={showVote}
              className="w-10 h-14 text-sm"
              disabled
              isCurrentUser={false}
            />
          </div>
        )}
        <div className="relative">
          <div className={cn(
            "w-8 h-8 rounded-full bg-card shadow-md border flex items-center justify-center",
            !user.isSpectator && isVoting && !hasVoted 
              ? 'border-red-500 border-2 animate-pulse' 
              : hasVoted && !showVote 
                ? 'border-primary border-2' 
                : 'border-primary/20 border'
          )}>
            <span className="text-sm font-medium">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          {user.isHost && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center">
              <span className="text-[8px] text-primary-foreground">👑</span>
            </div>
          )}
        </div>
        <div className="text-[10px] font-medium text-center mt-0.5 text-card-foreground/80 bg-background/50 px-1.5 py-px rounded-full shadow-sm backdrop-blur-sm whitespace-nowrap">
          {user.name}
          {!user.isSpectator && isVoting && !hasVoted && (
            <span className="text-red-500 ml-1">(not voted)</span>
          )}
          {!user.isSpectator && hasVoted && !showVote && (
            <span className="text-primary ml-1">(voted)</span>
          )}
        </div>
      </div>
    </div>
  )
} 