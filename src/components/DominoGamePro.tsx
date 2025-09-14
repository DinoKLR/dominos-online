'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Domino as DominoType, createDominoSet } from '@/types/domino'
import DominoComponent from './Domino'

interface DominoGameProProps {
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

const DominoGamePro: React.FC<DominoGameProProps> = ({ onGameEnd, onBackToHome }) => {
  const [selectedDomino, setSelectedDomino] = useState<DominoType | null>(null)
  
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
    gameMessage: 'Setting up the dojo...',
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
      gameMessage: starter === 'player' ? 'You started! Computer\'s turn...' : 'Computer started! Your turn!',
      playerScore: 0,
      computerScore: 0,
      spinner: startingDomino.isDouble ? { id: startingDomino.id, value: startingDomino.left, sidesUsed: 0 } : null,
      topEnd: null,
      bottomEnd: null
    })
  }, [])

  // Simple play domino function
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
      newX = (leftmostDomino.x || 50) - 10 // Move 10% to the left
      
      // Update left end value
      if (domino.left === leftEnd) {
        newLeftEnd = domino.right
      } else {
        newLeftEnd = domino.left
      }
    } else {
      // Place to the right of the rightmost domino
      const rightmostDomino = board[board.length - 1]
      newX = (rightmostDomino.x || 50) + 10 // Move 10% to the right
      
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col">
      {/* Professional Header */}
      <header className="bg-black/90 backdrop-blur-sm border-b border-green-500/30 shadow-lg shadow-green-500/20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🥷</div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                NINJA BONES
              </h1>
              <p className="text-xs text-gray-400">Professional Domino Dojo</p>
            </div>
          </div>
          
          {/* Score Display */}
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-xs text-gray-400">YOU</div>
              <div className="text-2xl font-bold text-green-400">{gameState.playerScore}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400">CPU</div>
              <div className="text-2xl font-bold text-cyan-400">{gameState.computerScore}</div>
            </div>
          </div>

          <button
            onClick={onBackToHome}
            className="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-lg text-white text-sm font-medium transition-all"
          >
            Exit Dojo
          </button>
        </div>
      </header>

      {/* Game Area */}
      <div className="flex-1 flex flex-col p-4">
        {/* Computer Hand (Hidden) */}
        <div className="flex justify-center mb-4">
          <div className="flex gap-2">
            {gameState.computerHand.map((_, index) => (
              <motion.div
                key={index}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-12 h-24 bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg border border-gray-600 shadow-lg"
              />
            ))}
          </div>
        </div>

        {/* Main Game Board - Full Screen Table */}
        <div className="flex-1 relative bg-gradient-to-br from-green-950 via-green-900 to-green-950 overflow-hidden">
          {/* Felt texture pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-black/40" />
          </div>
          
          {/* Boxing ring ropes as borders */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 shadow-lg" />
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 shadow-lg" />
          <div className="absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-b from-yellow-600 via-yellow-500 to-yellow-600 shadow-lg" />
          <div className="absolute top-0 bottom-0 right-0 w-2 bg-gradient-to-b from-yellow-600 via-yellow-500 to-yellow-600 shadow-lg" />
          
          {/* Corner posts */}
          <div className="absolute top-0 left-0 w-8 h-8 bg-gradient-to-br from-gray-800 to-gray-600 rounded-br-full shadow-xl" />
          <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-gray-800 to-gray-600 rounded-bl-full shadow-xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 bg-gradient-to-tr from-gray-800 to-gray-600 rounded-tr-full shadow-xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-tl from-gray-800 to-gray-600 rounded-tl-full shadow-xl" />
          
          {/* Game Board Container - Full Area */}
          <div className="relative w-full h-full">
                {/* Dominoes will be placed here with percentage positioning */}
                <AnimatePresence>
                  {gameState.board.map((domino) => (
                    <motion.div
                      key={domino.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute"
                      style={{
                        left: (domino as any).usePercentage ? `${domino.x}%` : `${domino.x}px`,
                        top: (domino as any).usePercentage ? `${domino.y}%` : `${domino.y}px`,
                        transform: `translate(-50%, -50%) rotate(${domino.rotation || 0}deg)`
                      }}
                    >
                      <div className="scale-50 drop-shadow-xl">
                        <DominoComponent domino={domino} />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* End Values Display */}
                {gameState.board.length > 0 && (
                  <>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-green-500/90 text-black px-3 py-2 rounded-lg font-bold shadow-lg">
                      {gameState.leftEnd}
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-cyan-500/90 text-black px-3 py-2 rounded-lg font-bold shadow-lg">
                      {gameState.rightEnd}
                    </div>
                  </>
                )}

            {/* Boneyard Indicator */}
            {gameState.boneyard.length > 0 && (
              <div className="absolute top-4 left-4 bg-black/80 rounded-lg px-3 py-2 border border-green-500/30">
                <div className="text-xs text-gray-400">BONEYARD</div>
                <div className="text-lg font-bold text-green-400">{gameState.boneyard.length}</div>
              </div>
            )}

            {/* Turn Indicator */}
            <div className="absolute top-4 right-4 bg-black/80 rounded-lg px-4 py-2 border border-cyan-500/30">
              <div className="text-sm font-medium text-cyan-400">
                {gameState.currentPlayer === 'player' ? 'YOUR TURN' : 'CPU THINKING...'}
              </div>
            </div>
          </div>
        </div>

        {/* Player Hand */}
        <div className="mt-4">
          <div className="flex justify-center gap-3">
            {gameState.playerHand.map((domino) => (
              <motion.div
                key={domino.id}
                whileHover={{ y: -10 }}
                whileTap={{ scale: 0.95 }}
                className="cursor-pointer"
                onClick={() => handleDominoClick(domino)}
              >
                <div className="scale-75 drop-shadow-xl">
                  <DominoComponent domino={domino} showAnimation={true} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-black/90 border-t border-green-500/30 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-sm text-gray-400">{gameState.gameMessage}</div>
          <div className="text-sm text-green-400 font-medium">
            Round 1 | First to 100
          </div>
        </div>
      </div>
    </div>
  )
}

export default DominoGamePro