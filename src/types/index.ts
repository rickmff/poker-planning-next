export interface User {
  id: string
  name: string
  isHost: boolean
  vote: string | null
  isSpectator: boolean
  joinedAt: number
}

export interface Room {
  id: string
  name: string
  users: User[]
  isVoting: boolean
  showVotes: boolean
  votingOptions: string[]
}

export interface ServerToClientEvents {
  'room:updated': (room: Room) => void
  'user:joined': (user: User) => void
  'user:left': (userId: string) => void
  'vote:submitted': (userId: string, vote: string) => void
  'votes:revealed': (votes: Record<string, string>) => void
  'voting:started': () => void
  'voting:ended': () => void
  'host:transferred': () => void
  'error': (message: string) => void
}

export interface ClientToServerEvents {
  'room:join': (roomId: string, userName: string, isSpectator: boolean) => void
  'room:leave': (roomId: string) => void
  'vote:submit': (vote: string) => void
  'votes:reveal': () => void
  'voting:start': () => void
  'voting:end': () => void
  'host:leave': (roomId: string) => void
}

export const DEFAULT_VOTING_OPTIONS = ['1', '2', '3', '5', '8', '13', '21', '?'] 