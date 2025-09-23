'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Domino as DominoType, createDominoSet } from '@/types/domino'
import DominoComponent from './Domino'

interface DominoGameMobileProps {
  onGameEnd: (winner: 'player' | 'computer') => void
  onBackToHome: () => void
}

interface GameState {
  playerHand: DominoType[]
  computerHand: DominoType[]
  boneyard: DominoType[]
  board: DominoType[]
  currentPlayer: 'player' | 'computer'
  gamePhase: 'setup' | 'playing' | 'ended'
  leftEnd: number | null
  rightEnd: number | null
  winner: 'player' | 'computer' | null
  gameMessage: string
  playerScore: number
  computerScore: number
  firstSpinner: { domino: DominoType, horizontalPlayed: boolean, position: { x: number, y: number } } | null
  openEnds: { left: number | null, right: number | null }
}

// GAME LOGIC FUNCTIONS
const validateMove = (domino: DominoType, gameState: GameState): { canPlay: boolean, sides: string[] } => {
  const leftEnd = gameState.openEnds.left
  const rightEnd = gameState.openEnds.right

  const canPlayLeft = leftEnd !== null && (domino.left === leftEnd || domino.right === leftEnd)
  const canPlayRight = rightEnd !== null && (domino.left === rightEnd || domino.right === rightEnd)

  const sides = []
  if (canPlayLeft) sides.push('left')
  if (canPlayRight) sides.push('right')

  return { canPlay: sides.length > 0, sides }
}

const findStartingPlayer = (playerHand: DominoType[], computerHand: DominoType[]): { starter: 'player' | 'computer', startingDomino: DominoType } => {
  // Find highest double
  const allDoubles = [...playerHand, ...computerHand]
    .filter(d => d.isDouble)
    .sort((a, b) => b.left - a.left)

  if (allDoubles.length > 0) {
    const highestDouble = allDoubles[0]
    const starter = playerHand.some(d => d.id === highestDouble.id) ? 'player' : 'computer'
    return { starter, startingDomino: highestDouble }
  }

  // No doubles - find highest pip total
  const playerHighest = playerHand.reduce((max, d) =>
    (d.left + d.right > max.left + max.right ? d : max))
  const computerHighest = computerHand.reduce((max, d) =>
    (d.left + d.right > max.left + max.right ? d : max))

  if (playerHighest.left + playerHighest.right >= computerHighest.left + computerHighest.right) {
    return { starter: 'player', startingDomino: playerHighest }
  } else {
    return { starter: 'computer', startingDomino: computerHighest }
  }
}

// PLACEMENT LOGIC FUNCTIONS
const DOMINO_CONSTANTS = {
  WIDTH: 4.5, // Percentage units (smaller for 75% scale)
  HEIGHT: 8, // Percentage units (smaller for 75% scale)
  SPACING: 0.5 // Gap between dominoes
}

const calculateDominoPlacement = (
  domino: DominoType,
  side: 'left' | 'right' | 'top' | 'bottom',
  board: DominoType[],
  gameState: GameState
): { x: string | number, y: string | number, rotation: number } => {
  // Use the same center as the crosshair guides
  const centerY = 'calc(50% - 4.4rem)'

  if (board.length === 0) {
    // First domino - center position at crosshair intersection
    return {
      x: 50,
      y: centerY,
      rotation: domino.isDouble ? 0 : 90
    }
  }

  // For the first play off the spinner
  if (board.length === 1) {
    const spinner = board[0]
    if (spinner.isDouble && spinner.rotation === 0) {
      // Playing off a vertical double (spinner)
      const xPos = side === 'left'
        ? 50 - (DOMINO_CONSTANTS.WIDTH + DOMINO_CONSTANTS.SPACING)
        : 50 + (DOMINO_CONSTANTS.WIDTH + DOMINO_CONSTANTS.SPACING)

      return {
        x: xPos,
        y: centerY,
        rotation: 90 // Horizontal
      }
    }
  }

  // Find the actual ends of the line for subsequent plays
  let leftmostX = 50
  let rightmostX = 50

  // Find leftmost and rightmost dominoes
  for (const boardDomino of board) {
    const x = typeof boardDomino.x === 'number' ? boardDomino.x : 50
    if (x < leftmostX) {
      leftmostX = x
    }
    if (x > rightmostX) {
      rightmostX = x
    }
  }

  const newX = side === 'left'
    ? leftmostX - (DOMINO_CONSTANTS.WIDTH + DOMINO_CONSTANTS.SPACING)
    : rightmostX + (DOMINO_CONSTANTS.WIDTH + DOMINO_CONSTANTS.SPACING)

  return {
    x: newX,
    y: centerY,
    rotation: 90 // Horizontal
  }
}

const DominoGameMobile: React.FC<DominoGameMobileProps> = ({ onGameEnd, onBackToHome }) => {
  const [gameState, setGameState] = useState<GameState>({
    playerHand: [],
    computerHand: [],
    boneyard: [],
    board: [],
    currentPlayer: 'player',
    gamePhase: 'setup',
    leftEnd: null,
    rightEnd: null,
    winner: null,
    gameMessage: 'Starting game with centered dominoes...',
    playerScore: 0,
    computerScore: 0,
    firstSpinner: null,
    openEnds: { left: null, right: null }
  })

  // Initialize game with clean logic
  useEffect(() => {
    const dominoes = createDominoSet()
    const shuffled = [...dominoes].sort(() => Math.random() - 0.5)

    const playerHand = shuffled.slice(0, 7)
    const computerHand = shuffled.slice(7, 14)
    const boneyard = shuffled.slice(14)

    // Use clean starting logic
    const { starter, startingDomino } = findStartingPlayer(playerHand, computerHand)

    const newPlayerHand = starter === 'player'
      ? playerHand.filter(d => d.id !== startingDomino.id)
      : playerHand
    const newComputerHand = starter === 'computer'
      ? computerHand.filter(d => d.id !== startingDomino.id)
      : computerHand

    setGameState({
      playerHand: newPlayerHand,
      computerHand: newComputerHand,
      boneyard,
      board: [{
        ...startingDomino,
        x: 50,
        y: 50,
        rotation: startingDomino.isDouble ? 0 : 90
      }],
      currentPlayer: starter === 'player' ? 'computer' : 'player',
      gamePhase: 'playing',
      leftEnd: null,
      rightEnd: null,
      winner: null,
      gameMessage: `${starter === 'player' ? 'You' : 'Computer'} start with ${startingDomino.id}`,
      playerScore: 0,
      computerScore: 0,
      firstSpinner: startingDomino.isDouble ? {
        domino: startingDomino,
        horizontalPlayed: false,
        position: { x: 50, y: 50 }
      } : null,
      openEnds: {
        left: startingDomino.left,
        right: startingDomino.right
      }
    })
  }, [])

  // Draw from boneyard function
  const drawFromBoneyard = (player: 'player' | 'computer') => {
    if (gameState.boneyard.length === 0) {
      // No more tiles to draw - pass turn
      setGameState({
        ...gameState,
        currentPlayer: player === 'player' ? 'computer' : 'player',
        gameMessage: `${player === 'player' ? 'You' : 'Computer'} cannot play and boneyard is empty. Turn passed.`
      })
      return
    }

    // Draw one tile from boneyard
    const drawnTile = gameState.boneyard[0]
    const newBoneyard = gameState.boneyard.slice(1)

    if (player === 'player') {
      setGameState({
        ...gameState,
        playerHand: [...gameState.playerHand, drawnTile],
        boneyard: newBoneyard,
        gameMessage: `Drew ${drawnTile.id} from boneyard`
      })
    } else {
      setGameState({
        ...gameState,
        computerHand: [...gameState.computerHand, drawnTile],
        boneyard: newBoneyard,
        gameMessage: 'Computer drew from boneyard'
      })
    }
  }

  // Check if player can play any domino
  const canPlayerPlay = () => {
    return gameState.playerHand.some(domino => {
      const moveValidation = validateMove(domino, gameState)
      return moveValidation.canPlay
    })
  }

  // Clean domino play function
  const playDomino = (domino: DominoType) => {
    if (gameState.currentPlayer !== 'player') return

    // Validate move using clean logic
    const moveValidation = validateMove(domino, gameState)

    if (!moveValidation.canPlay) {
      setGameState({
        ...gameState,
        gameMessage: `Cannot play this domino!`
      })
      return
    }

    // Choose side (prefer left if both available)
    const side = moveValidation.sides.includes('left') ? 'left' : 'right'

    // Calculate placement using clean logic
    const placement = calculateDominoPlacement(domino, side as any, gameState.board, gameState)

    // Create positioned domino
    const positionedDomino = {
      ...domino,
      x: placement.x,
      y: placement.y,
      rotation: placement.rotation,
      usePercentage: true
    } as DominoType & { x: string | number; y: string | number; rotation: number; usePercentage: boolean }

    // Update board - just append, don't reorder
    const newBoard = [...gameState.board, positionedDomino]

    // Determine which end of the domino matches and update open ends
    const newOpenEnds = { ...gameState.openEnds }
    let needsFlip = false

    if (side === 'left') {
      // Check which end of the domino matches the left open end
      if (domino.right === gameState.openEnds.left) {
        newOpenEnds.left = domino.left
        needsFlip = false // Right end touches left side, so domino is oriented correctly
      } else {
        newOpenEnds.left = domino.right
        needsFlip = true // Left end touches left side, so domino needs to be flipped
      }
    } else {
      // Check which end of the domino matches the right open end
      if (domino.left === gameState.openEnds.right) {
        newOpenEnds.right = domino.right
        needsFlip = false // Left end touches right side, so domino is oriented correctly
      } else {
        newOpenEnds.right = domino.left
        needsFlip = true // Right end touches right side, so domino needs to be flipped
      }
    }

    // Apply flip if needed
    if (needsFlip) {
      positionedDomino.isFlipped = true
    }

    // Update game state
    setGameState({
      ...gameState,
      board: newBoard,
      playerHand: gameState.playerHand.filter(d => d.id !== domino.id),
      openEnds: newOpenEnds,
      leftEnd: newOpenEnds.left,
      rightEnd: newOpenEnds.right,
      currentPlayer: 'computer',
      gameMessage: 'Computer is thinking...'
    })
  }

  const handleDominoClick = (domino: DominoType) => {
    if (gameState.currentPlayer === 'player') {
      playDomino(domino)
    }
  }

  // Computer AI logic
  useEffect(() => {
    if (gameState.currentPlayer === 'computer' && gameState.gamePhase === 'playing') {
      const timer = setTimeout(() => {
        const { computerHand, openEnds } = gameState

        // Find first playable domino
        const playableDomino = computerHand.find(domino => {
          const moveValidation = validateMove(domino, gameState)
          return moveValidation.canPlay
        })

        if (!playableDomino) {
          // Computer cannot play - draw from boneyard
          if (gameState.boneyard.length > 0) {
            drawFromBoneyard('computer')
            return
          } else {
            // No boneyard left - pass turn
            setGameState({
              ...gameState,
              currentPlayer: 'player',
              gameMessage: 'Computer passed! Your turn!'
            })
            return
          }
        }

        // Computer plays the domino
        const moveValidation = validateMove(playableDomino, gameState)
        const side = moveValidation.sides.includes('left') ? 'left' : 'right'

        // Calculate placement
        const placement = calculateDominoPlacement(playableDomino, side as any, gameState.board, gameState)

        const positionedDomino = {
          ...playableDomino,
          x: placement.x,
          y: placement.y,
          rotation: placement.rotation,
          usePercentage: true
        } as DominoType & { x: string | number; y: string | number; rotation: number; usePercentage: boolean }

        // Update board - just append, don't reorder
        const newBoard = [...gameState.board, positionedDomino]

        // Determine which end of the domino matches and update open ends
        const newOpenEnds = { ...gameState.openEnds }
        let needsFlip = false

        if (side === 'left') {
          // Check which end of the domino matches the left open end
          if (playableDomino.right === gameState.openEnds.left) {
            newOpenEnds.left = playableDomino.left
            needsFlip = false
          } else {
            newOpenEnds.left = playableDomino.right
            needsFlip = true
          }
        } else {
          // Check which end of the domino matches the right open end
          if (playableDomino.left === gameState.openEnds.right) {
            newOpenEnds.right = playableDomino.right
            needsFlip = false
          } else {
            newOpenEnds.right = playableDomino.left
            needsFlip = true
          }
        }

        // Apply flip if needed
        if (needsFlip) {
          positionedDomino.isFlipped = true
        }

        setGameState({
          ...gameState,
          board: newBoard,
          computerHand: computerHand.filter(d => d.id !== playableDomino.id),
          openEnds: newOpenEnds,
          leftEnd: newOpenEnds.left,
          rightEnd: newOpenEnds.right,
          currentPlayer: 'player',
          gameMessage: 'Your turn!'
        })
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [gameState])

  return (
    <div className="fixed inset-0" style={{ backgroundColor: '#2a802a' }}>
      {/* Casino felt texture and lighting */}
      <div className="absolute inset-0">
        {/* Subtle casino table lighting - brighter center, darker edges */}
        <div 
          className="absolute inset-0" 
          style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, transparent 60%, rgba(0,0,0,0.2) 100%)'
          }}
        />
        
        {/* Felt fabric texture - very subtle grain pattern */}
        <div 
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `
              radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0),
              radial-gradient(circle at 3px 3px, rgba(0,0,0,0.1) 1px, transparent 0)
            `,
            backgroundSize: '4px 4px, 6px 6px'
          }}
        />
        
        {/* Soft fabric depth variations */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.05) 50%, transparent 60%),
              linear-gradient(-45deg, transparent 40%, rgba(0,0,0,0.05) 50%, transparent 60%)
            `,
            backgroundSize: '20px 20px, 25px 25px'
          }}
        />
        
        {/* Center table lighting effect */}
        <div 
          className="absolute inset-0" 
          style={{
            background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.05) 0%, transparent 40%)'
          }}
        />
      </div>

      {/* Top Header - Compact */}
      <div className="absolute top-0 left-0 right-0 bg-black/30 backdrop-blur-sm px-4 py-1 z-20" style={{ height: '3rem' }}>
        {/* Timer bar - Top (Computer's turn) */}
        {gameState.currentPlayer === 'computer' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/20">
            <motion.div
              className="h-full bg-yellow-400"
              key={`computer-timer-${gameState.currentPlayer}`}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 15, ease: 'linear' }}
            />
          </div>
        )}
        <div className="flex items-center justify-between">
          {/* Left - Player Info */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center overflow-hidden" style={{ fontSize: '2.1rem', transform: 'translateY(-2px)' }}>
              <span style={{ transform: 'translateY(1px)' }}>🥷</span>
            </div>
            <div className="text-left">
              <div className="text-sm text-white font-bold">YOU</div>
              <div className="text-white text-lg font-bold -mt-1">{gameState.playerScore}</div>
            </div>
          </div>

          {/* Center - Game Title */}
          <div className="text-center">
            <div className="text-lg text-white font-bold">FIVES to 100</div>
          </div>

          {/* Right - Computer Info */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm text-white font-bold">CPU</div>
              <div className="text-white text-lg font-bold -mt-1">{gameState.computerScore}</div>
            </div>
            <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center overflow-hidden" style={{ fontSize: '2.1rem', transform: 'translateY(-2px)' }}>
              <span style={{ transform: 'translateY(1px)' }}>👨‍⚕️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Game Board - Full Screen Responsive */}
      <div className="absolute inset-0" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
        <div className="w-full h-full relative overflow-hidden">
          {/* Temporary Center Guidelines - For playable area only */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none opacity-70"></div>
          <div className="absolute left-0 right-0 h-0.5 bg-red-500 z-30 pointer-events-none opacity-70" style={{ top: 'calc(50% - 4.4rem)' }}></div>

          {/* NINJA BONES Watermark - Centered on the table */}
          <div
            className="absolute z-0 pointer-events-none"
            style={{
              left: '50%',
              top: 'calc(50% - 4.4rem)',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div
              className="text-center"
              style={{
                fontFamily: '"Arial", "Helvetica", sans-serif',
                fontWeight: '600',
                fontSize: '2.2rem',
                color: 'rgba(255, 255, 255, 0.15)',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                lineHeight: '1.1'
              }}
            >
              <div>NINJA</div>
              <div>BONES</div>
            </div>
          </div>

          {/* Board dominoes */}
          {gameState.board.map((domino, index) => {
              const xPos = domino.x !== undefined ? domino.x : 50
              const yPos = domino.y !== undefined ? domino.y : 'calc(50% - 4.4rem)'

              // Direct style object to ensure it's applied
              const positionStyle = {
                position: 'absolute' as const,
                left: `${xPos}%`,
                top: typeof yPos === 'string' ? yPos : `${yPos}%`,
                zIndex: 10
              }

              return (
                <div
                  key={domino.id}
                  style={positionStyle}
                >
                  <div
                    style={{ transform: `translate(-50%, -50%) scale(0.5) rotate(${domino.rotation || 0}deg)` }}
                  >
                    <DominoComponent domino={domino} />
                  </div>
                </div>
              )
            })}

          {/* End values display */}
          {gameState.board.length > 0 && (
            <>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-green-500/90 text-black px-3 py-2 rounded-lg font-bold shadow-lg z-20">
                {gameState.leftEnd}
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-cyan-500/90 text-black px-3 py-2 rounded-lg font-bold shadow-lg z-20">
                {gameState.rightEnd}
              </div>
            </>
          )}

        </div>
      </div>

      {/* Bottom Footer with Player Hand */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm px-4 py-0.5 z-20">
        {/* Timer bar - Bottom (Player's turn) */}
        {gameState.currentPlayer === 'player' && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-black/20">
            <motion.div
              className="h-full bg-yellow-400"
              key={`player-timer-${gameState.currentPlayer}`}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 15, ease: 'linear' }}
            />
          </div>
        )}
        {/* Top row - Emojis and counts above dominoes */}
        <div className="flex items-center justify-between mb-0.5">
          {/* Left - Emoji Button */}
          <button className="text-xl hover:scale-110 transition-transform">
            😊
          </button>

          {/* Center - Board and Boneyard counts + Draw button */}
          <div className="flex items-center gap-3">
            <div className="text-sm text-white font-bold">
              Board {gameState.board.length} | Boneyard {gameState.boneyard.length}
            </div>
            {gameState.currentPlayer === 'player' && gameState.playerHand.length > 0 && !canPlayerPlay() && gameState.boneyard.length > 0 && (
              <button
                onClick={() => drawFromBoneyard('player')}
                className="bg-yellow-500 hover:bg-yellow-400 text-black px-3 py-1 rounded font-bold text-sm transition-colors"
              >
                DRAW
              </button>
            )}
          </div>

          {/* Right - Chat Button */}
          <button className="text-xl hover:scale-110 transition-transform">
            💬
          </button>
        </div>

        {/* Player dominoes */}
        <div className="flex items-center justify-center gap-2">
          {gameState.playerHand.map((domino) => (
            <motion.div
              key={domino.id}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              className="cursor-pointer"
              onClick={() => handleDominoClick(domino)}
            >
              <div className="scale-75">
                <DominoComponent domino={domino} showAnimation={true} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Top Computer Hand (Hidden) */}
      <div className="absolute top-10 left-0 right-0 flex justify-center gap-1 z-10 px-4">
        {gameState.computerHand.map((_, index) => (
          <motion.div
            key={index}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-6 h-12 bg-gradient-to-br from-gray-800 to-gray-700 rounded border border-gray-600 shadow-lg transform -translate-y-4"
            style={{
              clipPath: 'polygon(0 40%, 100% 40%, 100% 100%, 0 100%)'
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default DominoGameMobile