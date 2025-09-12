'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Domino as DominoType, createDominoSet } from '@/types/domino'
import DominoComponent from './Domino'

interface DominoGameProps {
  onGameEnd: (winner: 'player' | 'computer') => void
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
}

const DominoGame: React.FC<DominoGameProps> = ({ onGameEnd }) => {
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
    gameMessage: 'Setting up ninja battle...',
    playerScore: 0,
    computerScore: 0
  })

  const [selectedDomino, setSelectedDomino] = useState<string | null>(null)

  // Calculate score - points when ends add up to multiples of 5
  const calculateScore = (leftEnd: number, rightEnd: number): number => {
    const total = leftEnd + rightEnd
    return total % 5 === 0 ? total : 0
  }

  // Initialize game
  useEffect(() => {
    const dominoes = createDominoSet()
    const shuffled = [...dominoes].sort(() => Math.random() - 0.5)
    
    const playerHand = shuffled.slice(0, 7)
    const computerHand = shuffled.slice(7, 14)
    const boneyard = shuffled.slice(14)
    
    // Find highest double to start - must be a double, starting with 6-6
    const allDoubles = [...playerHand, ...computerHand].filter(d => d.isDouble).sort((a, b) => b.left - a.left)
    
    let starter: 'player' | 'computer'
    let startingDomino: DominoType
    
    if (allDoubles.length === 0) {
      // No doubles anywhere - this shouldn't happen in a standard set, but fallback to highest
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
      // Use the highest double (6-6, then 5-5, etc.)
      startingDomino = allDoubles[0]
      starter = playerHand.some(d => d.id === startingDomino.id) ? 'player' : 'computer'
    }

    const newPlayerHand = starter === 'player' ? playerHand.filter(d => d.id !== startingDomino.id) : playerHand
    const newComputerHand = starter === 'computer' ? computerHand.filter(d => d.id !== startingDomino.id) : computerHand
    
    setGameState({
      playerHand: newPlayerHand,
      computerHand: newComputerHand,
      boneyard,
      board: [{ ...startingDomino, x: 400, y: 200, rotation: 0 }], // Starting domino is vertical
      currentPlayer: starter === 'player' ? 'computer' : 'player',
      gamePhase: 'playing',
      leftEnd: startingDomino.left,
      rightEnd: startingDomino.right,
      winner: null,
      gameMessage: starter === 'player' ? 'You started! Computer\'s turn...' : 'Computer started! Your turn, ninja!',
      playerScore: 0,
      computerScore: 0
    })
  }, [])

  // Computer AI move
  useEffect(() => {
    if (gameState.currentPlayer === 'computer' && gameState.gamePhase === 'playing') {
      const timer = setTimeout(() => {
        makeComputerMove()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [gameState.currentPlayer, gameState.gamePhase])

  const makeComputerMove = () => {
    const { computerHand, leftEnd, rightEnd, boneyard } = gameState
    
    // Find playable dominoes
    const playableDominoes = computerHand.filter(domino => 
      domino.left === leftEnd || domino.right === leftEnd ||
      domino.left === rightEnd || domino.right === rightEnd
    )

    if (playableDominoes.length === 0) {
      // Computer must draw from boneyard
      if (boneyard.length > 0) {
        const drawnDomino = boneyard[0]
        const newBoneyard = boneyard.slice(1)
        const newComputerHand = [...computerHand, drawnDomino]
        
        // Check if drawn domino is playable
        const canPlay = drawnDomino.left === leftEnd || drawnDomino.right === leftEnd ||
                       drawnDomino.left === rightEnd || drawnDomino.right === rightEnd
        
        if (canPlay) {
          // Play the drawn domino immediately
          setGameState(prev => ({
            ...prev,
            computerHand: newComputerHand,
            boneyard: newBoneyard,
            gameMessage: 'Computer drew and played!'
          }))
          setTimeout(() => playDomino(drawnDomino, 'computer'), 500)
        } else {
          // Add to hand and pass turn
          setGameState(prev => ({
            ...prev,
            computerHand: newComputerHand,
            boneyard: newBoneyard,
            currentPlayer: 'player',
            gameMessage: 'Computer drew but can\'t play! Your turn, ninja!'
          }))
        }
      } else {
        // No boneyard left, computer is blocked
        setGameState(prev => ({
          ...prev,
          currentPlayer: 'player',
          gameMessage: 'Computer is blocked! Your turn, ninja!'
        }))
      }
      return
    }

    // Simple AI: play the domino with the highest total
    const bestDomino = playableDominoes.reduce((best, current) => 
      (current.left + current.right > best.left + best.right) ? current : best
    )

    playDomino(bestDomino, 'computer')
  }

  const canPlayDomino = (domino: DominoType): 'left' | 'right' | null => {
    const { leftEnd, rightEnd } = gameState
    
    if (domino.left === leftEnd || domino.right === leftEnd) return 'left'
    if (domino.left === rightEnd || domino.right === rightEnd) return 'right'
    return null
  }

  const playDomino = (domino: DominoType, player: 'player' | 'computer', side?: 'left' | 'right') => {
    const { leftEnd, rightEnd, board } = gameState
    
    if (!side) {
      if (domino.left === leftEnd || domino.right === leftEnd) side = 'left'
      else if (domino.left === rightEnd || domino.right === rightEnd) side = 'right'
      else return
    }

    let newLeftEnd = leftEnd
    let newRightEnd = rightEnd
    let flippedDomino = { ...domino }

    if (side === 'left') {
      if (domino.right === leftEnd) {
        newLeftEnd = domino.left
      } else if (domino.left === leftEnd) {
        newLeftEnd = domino.right
        flippedDomino = { ...domino, left: domino.right, right: domino.left, isFlipped: true }
      }
    } else {
      if (domino.left === rightEnd) {
        newRightEnd = domino.right
      } else if (domino.right === rightEnd) {
        newRightEnd = domino.left
        flippedDomino = { ...domino, left: domino.right, right: domino.left, isFlipped: true }
      }
    }

    // Position the new domino - connecting dominoes are horizontal
    const spacing = 80
    const newX = side === 'left' ? board[0].x! - spacing : board[board.length - 1].x! + spacing
    const rotation = 90 // Connecting dominoes are horizontal (90 degrees)
    
    const newBoard = side === 'left' 
      ? [{ ...flippedDomino, x: newX, y: 200, rotation }, ...board]
      : [...board, { ...flippedDomino, x: newX, y: 200, rotation }]

    const newPlayerHand = player === 'player' 
      ? gameState.playerHand.filter(d => d.id !== domino.id)
      : gameState.playerHand
    const newComputerHand = player === 'computer'
      ? gameState.computerHand.filter(d => d.id !== domino.id)
      : gameState.computerHand

    // Calculate score from the new ends
    const score = calculateScore(newLeftEnd, newRightEnd)
    const newPlayerScore = gameState.playerScore + (player === 'player' ? score : 0)
    const newComputerScore = gameState.computerScore + (player === 'computer' ? score : 0)

    // Check for win
    let winner: 'player' | 'computer' | null = null
    let gameMessage = ''
    let gamePhase: 'playing' | 'ended' = 'playing'

    if (newPlayerHand.length === 0) {
      winner = 'player'
      gameMessage = '🥷 VICTORY! You dominated the dojo!'
      gamePhase = 'ended'
    } else if (newComputerHand.length === 0) {
      winner = 'computer'
      gameMessage = '💻 Computer wins! Practice your ninja skills!'
      gamePhase = 'ended'
    } else {
      const scoreText = score > 0 ? ` +${score} points!` : ''
      gameMessage = player === 'player' 
        ? `Computer's turn...${scoreText}` 
        : `Your turn! Play on ${newLeftEnd} or ${newRightEnd}${scoreText}`
    }

    setGameState(prev => ({
      ...prev,
      playerHand: newPlayerHand,
      computerHand: newComputerHand,
      board: newBoard,
      currentPlayer: player === 'player' ? 'computer' : 'player',
      gamePhase,
      leftEnd: newLeftEnd,
      rightEnd: newRightEnd,
      winner,
      gameMessage,
      playerScore: newPlayerScore,
      computerScore: newComputerScore
    }))

    if (winner) {
      setTimeout(() => onGameEnd(winner), 2000)
    }

    setSelectedDomino(null)
  }

  const handlePlayerDomino = (domino: DominoType) => {
    if (gameState.currentPlayer !== 'player' || gameState.gamePhase !== 'playing') return

    const playableSide = canPlayDomino(domino)
    if (playableSide) {
      playDomino(domino, 'player', playableSide)
    }
  }

  const drawFromBoneyard = () => {
    if (gameState.currentPlayer !== 'player' || gameState.boneyard.length === 0) return
    
    const drawnDomino = gameState.boneyard[0]
    const newBoneyard = gameState.boneyard.slice(1)
    const newPlayerHand = [...gameState.playerHand, drawnDomino]
    
    // Check if drawn domino is playable
    const playableSide = canPlayDomino(drawnDomino)
    
    setGameState(prev => ({
      ...prev,
      playerHand: newPlayerHand,
      boneyard: newBoneyard,
      gameMessage: playableSide ? 'You drew a playable domino! Click it to play.' : 'You drew but can\'t play. Turn continues...'
    }))
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-2 flex flex-col justify-center">
      {/* Computer Hand - Top */}
      <div className="text-center mb-1">
        <div className="flex justify-center items-center gap-4 mb-1">
          <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/50 rounded px-3 py-1">
            <div className="text-cyan-400 font-bold text-sm">Computer: {gameState.computerScore}</div>
          </div>
          <h3 className="text-lg font-bold text-cyan-400">Computer Hand ({gameState.computerHand.length})</h3>
        </div>
        <div className="flex justify-center space-x-1">
          {gameState.computerHand.map((_, index) => (
            <div key={index} className="scale-50">
              <DominoComponent 
                domino={{ id: `back-${index}`, left: 0, right: 0, isDouble: false }} 
                faceDown={true}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Game Status */}
      <div className="text-center mb-1">
        <div className="bg-gradient-to-r from-green-500/20 to-cyan-500/20 border border-green-400/30 rounded px-4 py-1 inline-block">
          <p className="text-green-400 font-semibold text-sm">{gameState.gameMessage}</p>
        </div>
      </div>

      {/* Game Area - Compact */}
      <div className="flex justify-center gap-4 mb-1">
        {/* Boneyard - Left Side */}
        <div className="w-24">
          <div className="bg-gradient-to-br from-slate-800 to-black border-2 border-yellow-400/50 rounded p-2">
            <h3 className="text-xs font-bold text-yellow-400 mb-1 text-center">Boneyard</h3>
            <div className="text-center text-yellow-300 text-xs mb-1">({gameState.boneyard.length})</div>
            <div className="flex flex-col space-y-1">
              {gameState.boneyard.slice(0, 2).map((_, index) => (
                <div 
                  key={index} 
                  className="scale-30 cursor-pointer hover:scale-40 transition-transform mx-auto"
                  onClick={drawFromBoneyard}
                >
                  <DominoComponent 
                    domino={{ id: `boneyard-${index}`, left: 0, right: 0, isDouble: false }} 
                    faceDown={true}
                  />
                </div>
              ))}
              {gameState.boneyard.length > 2 && (
                <div className="text-yellow-400 text-xs text-center font-bold">+{gameState.boneyard.length - 2}</div>
              )}
            </div>
            {gameState.currentPlayer === 'player' && gameState.boneyard.length > 0 && (
              <button
                onClick={drawFromBoneyard}
                className="mt-1 w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black px-1 py-1 rounded text-xs font-bold transition-all"
              >
                🎯 Draw
              </button>
            )}
          </div>
        </div>

        {/* Game Board - Smaller */}
        <div className="relative bg-gradient-to-br from-slate-800 to-black border-4 border-green-400/50 rounded-xl p-4 w-[600px] h-[200px] overflow-x-auto">
          <div className="flex items-center justify-center space-x-1 h-full">
            <AnimatePresence>
              {gameState.board.map((domino) => (
                <motion.div
                  key={domino.id}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative"
                  style={{ 
                    transform: `rotate(${domino.rotation || 0}deg)`,
                    transformOrigin: 'center'
                  }}
                >
                  <DominoComponent 
                    domino={domino} 
                    className="scale-75"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {/* End indicators */}
          {gameState.board.length > 0 && (
            <>
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-green-500 text-black px-1 py-1 rounded font-bold text-xs">
                {gameState.leftEnd}
              </div>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-cyan-500 text-black px-1 py-1 rounded font-bold text-xs">
                {gameState.rightEnd}
              </div>
            </>
          )}
        </div>

        {/* Your Score - Right Side */}
        <div className="w-24 flex items-start">
          <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-400/50 rounded p-2">
            <div className="text-green-400 font-bold text-sm text-center">Your Score</div>
            <div className="text-green-400 font-bold text-xl text-center">{gameState.playerScore}</div>
          </div>
        </div>
      </div>

      {/* Player Hand - Bottom */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-green-400 mb-1">Your Hand ({gameState.playerHand.length})</h3>
        <div className="flex justify-center space-x-1 flex-wrap">
          {gameState.playerHand.map((domino) => {
            const playable = canPlayDomino(domino) !== null
            return (
              <motion.div
                key={domino.id}
                className={`scale-60 cursor-pointer ${playable ? 'hover:scale-75' : 'opacity-50'}`}
                whileHover={playable ? { y: -10 } : {}}
                onClick={() => playable && handlePlayerDomino(domino)}
              >
                <DominoComponent 
                  domino={domino} 
                  className={playable ? 'border-2 border-green-400/50' : ''}
                />
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default DominoGame