export interface Domino {
  id: string
  left: number
  right: number
  isDouble: boolean
  x?: number
  y?: number
  rotation?: number
  isFlipped?: boolean
  usePercentage?: boolean
}

export interface Player {
  id: string
  name: string
  dominoes: Domino[]
  isWashing: boolean
  isCurrentTurn: boolean
}

export interface GameState {
  players: Player[]
  board: Domino[]
  currentPlayer: string
  gamePhase: 'lobby' | 'washing' | 'picking' | 'playing' | 'finished'
  washingPlayer?: string
  pickingPlayer?: string
}

export const createDominoSet = (): Domino[] => {
  const dominoes: Domino[] = []
  
  for (let left = 0; left <= 6; left++) {
    for (let right = left; right <= 6; right++) {
      dominoes.push({
        id: `${left}-${right}`,
        left,
        right,
        isDouble: left === right,
      })
    }
  }
  
  return dominoes
}