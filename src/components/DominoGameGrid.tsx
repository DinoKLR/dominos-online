'use client'

import React, { useState, useEffect } from 'react'
import { Domino as DominoType, createDominoSet } from '@/types/domino'
import DominoComponent from './Domino'

// Complete predetermined grid layout - every position is pre-defined
// Each domino fills exactly one grid cell (horizontal takes 2x1, vertical takes 1x2)
const GRID_COLS = 20
const GRID_ROWS = 15
const CENTER_ROW = 7
const CENTER_COL = 10

// Generate all grid positions
const generateGridPositions = () => {
  const positions: { [key: string]: { row: number, col: number, orientation: 'horizontal' | 'vertical' } } = {}

  // Center position (spinner/first domino)
  positions.CENTER = { row: CENTER_ROW, col: CENTER_COL, orientation: 'vertical' }

  // Horizontal positions (left and right from center)
  const horizontalLeft: any[] = []
  const horizontalRight: any[] = []

  // Left side positions (going left from center)
  for (let i = 1; i <= 9; i++) {
    horizontalLeft.push({ row: CENTER_ROW, col: CENTER_COL - i, orientation: 'horizontal' as const })
  }

  // Right side positions (going right from center)
  for (let i = 1; i <= 9; i++) {
    horizontalRight.push({ row: CENTER_ROW, col: CENTER_COL + i, orientation: 'horizontal' as const })
  }

  positions.HORIZONTAL_LEFT = horizontalLeft
  positions.HORIZONTAL_RIGHT = horizontalRight

  // Vertical positions (top and bottom from center)
  const verticalTop: any[] = []
  const verticalBottom: any[] = []

  // Top positions (going up from center)
  for (let i = 1; i <= 6; i++) {
    verticalTop.push({ row: CENTER_ROW - i, col: CENTER_COL, orientation: 'vertical' as const })
  }

  // Bottom positions (going down from center)
  for (let i = 1; i <= 6; i++) {
    verticalBottom.push({ row: CENTER_ROW + i, col: CENTER_COL, orientation: 'vertical' as const })
  }

  positions.VERTICAL_TOP = verticalTop
  positions.VERTICAL_BOTTOM = verticalBottom

  return positions
}

const GRID_POSITIONS = generateGridPositions()

interface GridPosition {
  row: number
  col: number
  orientation: 'horizontal' | 'vertical'
  domino?: DominoType
}

interface GameState {
  playerHand: DominoType[]
  computerHand: DominoType[]
  boneyard: DominoType[]
  grid: Map<string, GridPosition>
  currentPlayer: 'player' | 'computer'
  leftEnd: number | null
  rightEnd: number | null
  topEnd: number | null
  bottomEnd: number | null
  leftIndex: number  // Track position in HORIZONTAL_LEFT array
  rightIndex: number // Track position in HORIZONTAL_RIGHT array
  topIndex: number   // Track position in VERTICAL_TOP array
  bottomIndex: number // Track position in VERTICAL_BOTTOM array
  spinnerPlayed: boolean
  gameMessage: string
}

interface DominoGameGridProps {
  onGameEnd: (winner: 'player' | 'computer') => void
  onBackToHome: () => void
}

const DominoGameGrid: React.FC<DominoGameGridProps> = ({ onGameEnd, onBackToHome }) => {
  const [gameState, setGameState] = useState<GameState>({
    playerHand: [],
    computerHand: [],
    boneyard: [],
    grid: new Map(),
    currentPlayer: 'player',
    leftEnd: null,
    rightEnd: null,
    topEnd: null,
    bottomEnd: null,
    leftIndex: 0,  // Start from first position left of center
    rightIndex: 0, // Start from first position right of center
    topIndex: 0,   // Start from position closest to center going up
    bottomIndex: 0, // Start from position closest to center going down
    spinnerPlayed: false,
    gameMessage: 'Starting game...'
  })

  // Initialize game
  useEffect(() => {
    const dominoes = createDominoSet()
    const shuffled = [...dominoes].sort(() => Math.random() - 0.5)

    const playerHand = shuffled.slice(0, 7)
    const computerHand = shuffled.slice(7, 14)
    const boneyard = shuffled.slice(14)

    // Find who has the highest double to start
    const findStarter = () => {
      for (let value = 6; value >= 0; value--) {
        const double = `${value}-${value}`
        const playerHasIt = playerHand.find(d => d.id === double)
        if (playerHasIt) {
          return { starter: 'player' as const, domino: playerHasIt }
        }
        const computerHasIt = computerHand.find(d => d.id === double)
        if (computerHasIt) {
          return { starter: 'computer' as const, domino: computerHasIt }
        }
      }
      // No doubles - highest pip count starts
      const getHighest = (hand: DominoType[]) =>
        hand.reduce((max, d) =>
          (d.left + d.right > max.left + max.right) ? d : max
        )
      const playerHighest = getHighest(playerHand)
      const computerHighest = getHighest(computerHand)

      if (playerHighest.left + playerHighest.right >= computerHighest.left + computerHighest.right) {
        return { starter: 'player' as const, domino: playerHighest }
      }
      return { starter: 'computer' as const, domino: computerHighest }
    }

    const { starter, domino } = findStarter()

    // Place starting domino in center
    const newGrid = new Map<string, GridPosition>()
    const centerKey = `${GRID_POSITIONS.CENTER.row}-${GRID_POSITIONS.CENTER.col}`
    newGrid.set(centerKey, {
      ...GRID_POSITIONS.CENTER,
      domino: domino
    })

    // Remove starting domino from hand
    const newPlayerHand = starter === 'player'
      ? playerHand.filter(d => d.id !== domino.id)
      : playerHand
    const newComputerHand = starter === 'computer'
      ? computerHand.filter(d => d.id !== domino.id)
      : computerHand

    setGameState({
      playerHand: newPlayerHand,
      computerHand: newComputerHand,
      boneyard,
      grid: newGrid,
      currentPlayer: starter === 'player' ? 'computer' : 'player',
      leftEnd: domino.left,
      rightEnd: domino.right,
      topEnd: domino.isDouble ? domino.left : null,
      bottomEnd: domino.isDouble ? domino.right : null,
      leftIndex: 0,
      rightIndex: 0,
      topIndex: 0,
      bottomIndex: 0,
      spinnerPlayed: domino.isDouble,
      gameMessage: `${starter === 'player' ? 'You' : 'Computer'} started with ${domino.id}`
    })
  }, [])

  // Check if a domino can be played
  const canPlayDomino = (domino: DominoType): { canPlay: boolean, positions: string[] } => {
    const positions: string[] = []

    // Check left end
    if (gameState.leftEnd !== null && gameState.leftIndex < GRID_POSITIONS.HORIZONTAL_LEFT.length) {
      if (domino.left === gameState.leftEnd || domino.right === gameState.leftEnd) {
        positions.push('left')
      }
    }

    // Check right end
    if (gameState.rightEnd !== null && gameState.rightIndex < GRID_POSITIONS.HORIZONTAL_RIGHT.length) {
      if (domino.left === gameState.rightEnd || domino.right === gameState.rightEnd) {
        positions.push('right')
      }
    }

    // Check top/bottom if spinner has been played
    if (gameState.spinnerPlayed) {
      if (gameState.topEnd !== null && gameState.topIndex < GRID_POSITIONS.VERTICAL_TOP.length) {
        if (domino.left === gameState.topEnd || domino.right === gameState.topEnd) {
          positions.push('top')
        }
      }
      if (gameState.bottomEnd !== null && gameState.bottomIndex < GRID_POSITIONS.VERTICAL_BOTTOM.length) {
        if (domino.left === gameState.bottomEnd || domino.right === gameState.bottomEnd) {
          positions.push('bottom')
        }
      }
    }

    return { canPlay: positions.length > 0, positions }
  }

  // Play a domino at a specific position
  const playDomino = (domino: DominoType, position: 'left' | 'right' | 'top' | 'bottom') => {
    const newGrid = new Map(gameState.grid)
    let gridPos: GridPosition | null = null
    let newLeftEnd = gameState.leftEnd
    let newRightEnd = gameState.rightEnd
    let newTopEnd = gameState.topEnd
    let newBottomEnd = gameState.bottomEnd
    let newLeftIndex = gameState.leftIndex
    let newRightIndex = gameState.rightIndex
    let newTopIndex = gameState.topIndex
    let newBottomIndex = gameState.bottomIndex

    // Create a copy of the domino with proper orientation
    let orientedDomino = { ...domino }

    // Determine which end of the domino connects and set the new open end
    const getNewEnd = (currentEnd: number | null, domino: DominoType) => {
      if (domino.left === currentEnd) return domino.right
      if (domino.right === currentEnd) return domino.left
      return null
    }

    // Check if domino needs to be flipped for proper orientation
    const needsFlip = (currentEnd: number | null, domino: DominoType, position: 'left' | 'right' | 'top' | 'bottom') => {
      if (position === 'left' || position === 'top') {
        // For left/top positions, we want the matching end on the right/bottom
        return domino.right !== currentEnd
      } else {
        // For right/bottom positions, we want the matching end on the left/top
        return domino.left !== currentEnd
      }
    }

    switch (position) {
      case 'left':
        if (newLeftIndex < GRID_POSITIONS.HORIZONTAL_LEFT.length) {
          if (needsFlip(gameState.leftEnd, domino, 'left')) {
            orientedDomino = { ...domino, left: domino.right, right: domino.left, isFlipped: true }
          }
          gridPos = { ...GRID_POSITIONS.HORIZONTAL_LEFT[newLeftIndex], domino: orientedDomino }
          newLeftEnd = getNewEnd(gameState.leftEnd, orientedDomino)
          newLeftIndex++
        }
        break
      case 'right':
        if (newRightIndex < GRID_POSITIONS.HORIZONTAL_RIGHT.length) {
          if (needsFlip(gameState.rightEnd, domino, 'right')) {
            orientedDomino = { ...domino, left: domino.right, right: domino.left, isFlipped: true }
          }
          gridPos = { ...GRID_POSITIONS.HORIZONTAL_RIGHT[newRightIndex], domino: orientedDomino }
          newRightEnd = getNewEnd(gameState.rightEnd, orientedDomino)
          newRightIndex++
        }
        break
      case 'top':
        if (newTopIndex < GRID_POSITIONS.VERTICAL_TOP.length) {
          if (needsFlip(gameState.topEnd, domino, 'top')) {
            orientedDomino = { ...domino, left: domino.right, right: domino.left, isFlipped: true }
          }
          gridPos = { ...GRID_POSITIONS.VERTICAL_TOP[newTopIndex], domino: orientedDomino }
          newTopEnd = getNewEnd(gameState.topEnd, orientedDomino)
          newTopIndex++
        }
        break
      case 'bottom':
        if (newBottomIndex < GRID_POSITIONS.VERTICAL_BOTTOM.length) {
          if (needsFlip(gameState.bottomEnd, domino, 'bottom')) {
            orientedDomino = { ...domino, left: domino.right, right: domino.left, isFlipped: true }
          }
          gridPos = { ...GRID_POSITIONS.VERTICAL_BOTTOM[newBottomIndex], domino: orientedDomino }
          newBottomEnd = getNewEnd(gameState.bottomEnd, orientedDomino)
          newBottomIndex++
        }
        break
    }

    if (gridPos) {
      const key = `${gridPos.row}-${gridPos.col}`
      newGrid.set(key, gridPos)

      // Remove domino from current player's hand
      const newPlayerHand = gameState.currentPlayer === 'player'
        ? gameState.playerHand.filter(d => d.id !== domino.id)
        : gameState.playerHand
      const newComputerHand = gameState.currentPlayer === 'computer'
        ? gameState.computerHand.filter(d => d.id !== domino.id)
        : gameState.computerHand

      setGameState({
        ...gameState,
        grid: newGrid,
        playerHand: newPlayerHand,
        computerHand: newComputerHand,
        currentPlayer: gameState.currentPlayer === 'player' ? 'computer' : 'player',
        leftEnd: newLeftEnd,
        rightEnd: newRightEnd,
        topEnd: newTopEnd,
        bottomEnd: newBottomEnd,
        leftIndex: newLeftIndex,
        rightIndex: newRightIndex,
        topIndex: newTopIndex,
        bottomIndex: newBottomIndex,
        gameMessage: `${gameState.currentPlayer === 'player' ? 'You' : 'Computer'} played ${domino.id}`
      })
    }
  }

  // Handle player clicking a domino
  const handleDominoClick = (domino: DominoType) => {
    if (gameState.currentPlayer !== 'player') return

    const { canPlay, positions } = canPlayDomino(domino)
    if (canPlay && positions.length > 0) {
      // For now, auto-select first available position
      // Later we can add UI to let player choose
      playDomino(domino, positions[0] as any)
    } else {
      setGameState({
        ...gameState,
        gameMessage: 'Cannot play this domino!'
      })
    }
  }

  // Draw from boneyard
  const drawFromBoneyard = () => {
    if (gameState.currentPlayer !== 'player') return
    if (gameState.boneyard.length === 0) {
      setGameState({
        ...gameState,
        gameMessage: 'Boneyard is empty!'
      })
      return
    }

    // Check if player has any playable dominoes
    const hasPlayableDomino = gameState.playerHand.some(d => canPlayDomino(d).canPlay)
    if (hasPlayableDomino) {
      setGameState({
        ...gameState,
        gameMessage: 'You have playable dominoes!'
      })
      return
    }

    // Draw a domino
    const drawnDomino = gameState.boneyard[0]
    const newBoneyard = gameState.boneyard.slice(1)
    const newPlayerHand = [...gameState.playerHand, drawnDomino]

    setGameState({
      ...gameState,
      playerHand: newPlayerHand,
      boneyard: newBoneyard,
      gameMessage: `Drew ${drawnDomino.id} from boneyard`
    })
  }

  // Computer AI
  useEffect(() => {
    if (gameState.currentPlayer === 'computer') {
      const timer = setTimeout(() => {
        // Find first playable domino
        for (const domino of gameState.computerHand) {
          const { canPlay, positions } = canPlayDomino(domino)
          if (canPlay && positions.length > 0) {
            playDomino(domino, positions[0] as any)
            return
          }
        }

        // No playable dominoes - try to draw from boneyard
        if (gameState.boneyard.length > 0) {
          const drawnDomino = gameState.boneyard[0]
          const newBoneyard = gameState.boneyard.slice(1)
          const newComputerHand = [...gameState.computerHand, drawnDomino]

          // Check if drawn domino can be played
          const { canPlay, positions } = canPlayDomino(drawnDomino)
          if (canPlay && positions.length > 0) {
            setGameState({
              ...gameState,
              computerHand: newComputerHand,
              boneyard: newBoneyard,
              gameMessage: `Computer drew and played ${drawnDomino.id}`
            })
            // Play the domino after a short delay
            setTimeout(() => {
              playDomino(drawnDomino, positions[0] as any)
            }, 500)
          } else {
            setGameState({
              ...gameState,
              computerHand: newComputerHand,
              boneyard: newBoneyard,
              currentPlayer: 'player',
              gameMessage: 'Computer drew from boneyard - your turn!'
            })
          }
        } else {
          // Boneyard empty, pass turn
          setGameState({
            ...gameState,
            currentPlayer: 'player',
            gameMessage: 'Computer passes - your turn!'
          })
        }
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [gameState.currentPlayer])

  return (
    <div className="fixed inset-0 bg-green-800 flex flex-col">
      {/* Header */}
      <div className="bg-black/30 p-2 flex justify-between items-center">
        <div className="text-white font-bold">DOMINO GRID</div>
        <div className="text-white">{gameState.gameMessage}</div>
        <button
          onClick={onBackToHome}
          className="bg-red-500 text-white px-3 py-1 rounded"
        >
          Exit
        </button>
      </div>

      {/* Game Grid - Mobile First */}
      <div className="flex-1 overflow-auto p-4">
        <div className="relative" style={{ width: `${GRID_COLS * 40}px`, height: `${GRID_ROWS * 40}px`, margin: '0 auto' }}>
          {/* Render grid cells for debugging */}
          <div className="absolute inset-0">
            {Array.from({ length: GRID_ROWS }, (_, row) => (
              Array.from({ length: GRID_COLS }, (_, col) => (
                <div
                  key={`cell-${row}-${col}`}
                  className="absolute border border-green-900/20"
                  style={{
                    left: `${col * 40}px`,
                    top: `${row * 40}px`,
                    width: '40px',
                    height: '40px'
                  }}
                />
              ))
            )).flat()}
          </div>

          {/* Render dominoes at their grid positions */}
          {Array.from(gameState.grid.entries()).map(([key, position]) => {
            const cellSize = 40 // Each grid cell is 40x40 pixels

            // Calculate actual pixel position and size based on orientation
            const isHorizontal = position.orientation === 'horizontal'
            const left = isHorizontal ? (position.col - 0.5) * cellSize : position.col * cellSize
            const top = isHorizontal ? position.row * cellSize : (position.row - 0.5) * cellSize
            const width = isHorizontal ? cellSize * 2 : cellSize
            const height = isHorizontal ? cellSize : cellSize * 2

            return (
              <div
                key={key}
                className="absolute flex items-center justify-center"
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${width}px`,
                  height: `${height}px`,
                  zIndex: 10
                }}
              >
                <div className={`
                  ${isHorizontal ? 'rotate-90' : ''}
                `} style={{ transform: isHorizontal ? 'rotate(90deg) scale(0.3)' : 'scale(0.3)' }}>
                  <DominoComponent domino={position.domino!} />
                </div>
              </div>
            )
          })}

          {/* Center marker */}
          <div
            className="absolute bg-yellow-500/30 pointer-events-none"
            style={{
              left: `${CENTER_COL * 40}px`,
              top: `${(CENTER_ROW - 0.5) * 40}px`,
              width: '40px',
              height: '80px'
            }}
          />
        </div>
      </div>

      {/* Player Hand - Mobile Optimized */}
      <div className="bg-black/30 p-2">
        <div className="flex gap-2 overflow-x-auto justify-center">
          {gameState.playerHand.map(domino => {
            const { canPlay } = canPlayDomino(domino)
            return (
              <div
                key={domino.id}
                onClick={() => handleDominoClick(domino)}
                className={`
                  cursor-pointer transition-transform
                  ${canPlay ? 'hover:scale-110' : 'opacity-50'}
                  ${gameState.currentPlayer === 'player' ? '' : 'pointer-events-none'}
                `}
              >
                <div className="scale-75">
                  <DominoComponent domino={domino} />
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex justify-center items-center gap-4 mt-2">
          <div className="text-white">
            Your dominoes ({gameState.playerHand.length})
          </div>
          <button
            onClick={drawFromBoneyard}
            disabled={gameState.currentPlayer !== 'player' || gameState.boneyard.length === 0}
            className={`
              px-4 py-2 rounded font-bold
              ${gameState.currentPlayer === 'player' && gameState.boneyard.length > 0
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-500 text-gray-300 cursor-not-allowed'}
            `}
          >
            Draw ({gameState.boneyard.length})
          </button>
        </div>
      </div>
    </div>
  )
}

export default DominoGameGrid