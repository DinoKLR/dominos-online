'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  spinner: { id: string, value: number, sidesUsed: number } | null
  topEnd: number | null
  bottomEnd: number | null
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
    spinner: null,
    topEnd: null,
    bottomEnd: null
  })

  // Initialize game
  useEffect(() => {
    const dominoes = createDominoSet()
    const shuffled = [...dominoes].sort(() => Math.random() - 0.5)
    
    const playerHand = shuffled.slice(0, 7)
    const computerHand = shuffled.slice(7, 14)
    const boneyard = shuffled.slice(14)
    
    // Find highest double to start
    const allDoubles = [...playerHand, ...computerHand].filter(d => d.isDouble).sort((a, b) => b.left - a.left)
    
    let starter: 'player' | 'computer'
    let startingDomino: DominoType
    
    if (allDoubles.length === 0) {
      const playerHighest = playerHand.reduce((max, d) => (d.left + d.right > max.left + max.right ? d : max))
      const computerHighest = computerHand.reduce((max, d) => (d.left + d.right > max.left + max.right ? d : max))
      
      if (playerHighest.left + playerHighest.right >= computerHighest.left + computerHighest.right) {
        startingDomino = playerHighest
        starter = 'player'
      } else {
        startingDomino = computerHighest
        starter = 'computer'
      }
    } else {
      startingDomino = allDoubles[0]
      starter = playerHand.some(d => d.id === startingDomino.id) ? 'player' : 'computer'
    }

    const newPlayerHand = starter === 'player' ? playerHand.filter(d => d.id !== startingDomino.id) : playerHand
    const newComputerHand = starter === 'computer' ? computerHand.filter(d => d.id !== startingDomino.id) : computerHand
    
    setGameState({
      playerHand: newPlayerHand,
      computerHand: newComputerHand,
      boneyard,
      board: [{
        ...startingDomino,
        x: 50,
        y: 50,
        rotation: 0,  // Vertical for spinner
        usePercentage: true
      }],
      currentPlayer: starter === 'player' ? 'computer' : 'player',
      gamePhase: 'playing',
      leftEnd: startingDomino.left,
      rightEnd: startingDomino.right,
      winner: null,
      gameMessage: '',
      playerScore: 0,
      computerScore: 0,
      spinner: startingDomino.isDouble ? { id: startingDomino.id, value: startingDomino.left, sidesUsed: 0 } : null,
      topEnd: null,
      bottomEnd: null
    })
  }, [])

  // Simple play domino function (will be replaced with clean logic later)
  const playDomino = (domino: DominoType) => {
    if (gameState.currentPlayer !== 'player') return
    
    const { leftEnd, rightEnd, board } = gameState
    
    // Check if domino can be played
    const canPlayLeft = domino.left === leftEnd || domino.right === leftEnd
    const canPlayRight = domino.left === rightEnd || domino.right === rightEnd
    
    if (!canPlayLeft && !canPlayRight) {
      console.log('Cannot play this domino')
      return
    }
    
    // Determine which side to play on
    let side = canPlayLeft ? 'left' : 'right'
    let newLeftEnd = leftEnd
    let newRightEnd = rightEnd
    
    // Calculate position for new domino
    let newX: number
    let newY: number = 50 // Keep at same vertical level
    let rotation = 90 // Horizontal
    
    if (board.length === 0) {
      newX = 50
      newY = 50
    } else if (side === 'left') {
      // Place to the left of the leftmost domino
      const leftmostDomino = board[0]
      newX = (leftmostDomino.x || 50) - 6.8 // Move left with proper spacing
      
      // Update left end value
      if (domino.left === leftEnd) {
        newLeftEnd = domino.right
      } else {
        newLeftEnd = domino.left
      }
    } else {
      // Place to the right of the rightmost domino
      const rightmostDomino = board[board.length - 1]
      newX = (rightmostDomino.x || 50) + 6.8 // Move right with proper spacing
      
      // Update right end value
      if (domino.right === rightEnd) {
        newRightEnd = domino.left
      } else {
        newRightEnd = domino.right
      }
    }
    
    // Update game state
    const newBoard = side === 'left' 
      ? [{ ...domino, x: newX, y: newY, rotation, usePercentage: true }, ...board]
      : [...board, { ...domino, x: newX, y: newY, rotation, usePercentage: true }]
    
    const newPlayerHand = gameState.playerHand.filter(d => d.id !== domino.id)
    
    setGameState({
      ...gameState,
      board: newBoard,
      playerHand: newPlayerHand,
      leftEnd: newLeftEnd,
      rightEnd: newRightEnd,
      currentPlayer: 'computer',
      gameMessage: 'Computer is thinking...'
    })
  }

  const handleDominoClick = (domino: DominoType) => {
    if (gameState.currentPlayer === 'player') {
      playDomino(domino)
    }
  }

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
        <div className="flex items-center justify-between">
          {/* Left - Player Info */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center overflow-hidden" style={{ fontSize: '2.1rem', transform: 'translateY(-2px)' }}>
              <span style={{ transform: 'translateY(1px)' }}>🥷</span>
            </div>
            <div className="text-left">
              <div className="text-sm text-white font-bold">YOU</div>
              <div className="text-green-400 text-lg font-bold -mt-1">{gameState.playerScore}</div>
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
              <div className="text-cyan-400 text-lg font-bold -mt-1">{gameState.computerScore}</div>
            </div>
            <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center overflow-hidden" style={{ fontSize: '2.1rem', transform: 'translateY(-2px)' }}>
              <span style={{ transform: 'translateY(1px)' }}>👨‍⚕️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Game Board - Full Screen Responsive */}
      <div className="absolute inset-0" style={{ paddingTop: '2.875rem', paddingBottom: '5rem' }}>
        <div className="w-full h-full relative overflow-hidden">
          {/* NINJA BONES Watermark - Centered on the table */}
          <div
            className="absolute z-0 pointer-events-none"
            style={{
              left: '50%',
              top: 'calc(50% - 0.5rem)',
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
          <AnimatePresence>
            {gameState.board.map((domino) => (
              <motion.div
                key={domino.id}
                initial={{ scale: 0, rotate: 0 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 0 }}
                className="absolute z-10"
                style={{
                  left: (domino as any).usePercentage ? `${domino.x}%` : `${domino.x}px`,
                  top: (domino as any).usePercentage ? `${domino.y}%` : `${domino.y}px`,
                  transform: `translate(-50%, -50%)`
                }}
              >
                <div 
                  className="scale-100"
                  style={{ transform: `rotate(${domino.rotation || 0}deg)` }}
                >
                  <DominoComponent domino={domino} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

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
        {/* Top row - Emojis and counts above dominoes */}
        <div className="flex items-center justify-between mb-0.5">
          {/* Left - Emoji Button */}
          <button className="text-xl hover:scale-110 transition-transform">
            😊
          </button>

          {/* Center - Board and Boneyard counts */}
          <div className="text-sm text-white font-bold">
            Board {gameState.board.length} | Boneyard {gameState.boneyard.length}
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
              <DominoComponent domino={domino} showAnimation={true} />
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