'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Domino as DominoType, createDominoSet } from '@/types/domino'
import DominoComponent from './Domino'

interface DominoGameProps {
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

const DominoGame: React.FC<DominoGameProps> = ({ onGameEnd, onBackToHome }) => {
  const boardRef = useRef<HTMLDivElement>(null)
  
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
    computerScore: 0,
    spinner: null,
    topEnd: null,
    bottomEnd: null
  })

  const [selectedDomino, setSelectedDomino] = useState<DominoType | null>(null)
  const [showSideSelector, setShowSideSelector] = useState(false)

  // Calculate score - points when ends add up to multiples of 5
  const calculateScore = (leftEnd: number, rightEnd: number, spinner?: { value: number, sidesUsed: number } | null): number => {
    let total = leftEnd + rightEnd
    
    // If spinner exists and ONLY one side is used, count the spinner's open side
    // Once both sides are played, spinner doesn't count anymore
    if (spinner && spinner.sidesUsed === 1) {
      total += spinner.value
    }
    // If both sides of spinner are played, just count the regular ends
    
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
      board: [{ ...startingDomino, x: 370, y: 135, rotation: 0 }], // Starting domino is vertical - center of board
      currentPlayer: starter === 'player' ? 'computer' : 'player',
      gamePhase: 'playing',
      leftEnd: startingDomino.left,
      rightEnd: startingDomino.right,
      winner: null,
      gameMessage: starter === 'player' ? 'You started! Computer\'s turn...' : 'Computer started! Your turn, ninja!',
      playerScore: 0,
      computerScore: 0,
      spinner: startingDomino.isDouble ? { id: startingDomino.id, value: startingDomino.left, sidesUsed: 0 } : null,
      topEnd: null,
      bottomEnd: null
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
    const { computerHand, boneyard } = gameState
    
    // Find playable dominoes using the updated canPlayDomino function
    const playableDominoes = computerHand.filter(domino => canPlayDomino(domino) !== null)

    if (playableDominoes.length === 0) {
      // Computer must draw from boneyard until finding playable or empty
      if (boneyard.length > 0) {
        let newBoneyard = [...boneyard]
        let newComputerHand = [...computerHand]
        let drawnCount = 0
        let foundPlayable: DominoType | null = null
        
        // Keep drawing until we find a playable domino or boneyard is empty
        while (newBoneyard.length > 0 && !foundPlayable) {
          const drawnDomino = newBoneyard[0]
          newBoneyard = newBoneyard.slice(1)
          newComputerHand = [...newComputerHand, drawnDomino]
          drawnCount++
          
          // Check if drawn domino is playable using updated logic
          if (canPlayDomino(drawnDomino) !== null) {
            foundPlayable = drawnDomino
          }
        }
        
        if (foundPlayable) {
          // Play the found domino
          setGameState(prev => ({
            ...prev,
            computerHand: newComputerHand,
            boneyard: newBoneyard,
            gameMessage: `Computer drew ${drawnCount} domino(s) and found one to play!`
          }))
          setTimeout(() => playDomino(foundPlayable, 'computer'), 500)
        } else {
          // No playable domino found, pass turn
          setGameState(prev => ({
            ...prev,
            computerHand: newComputerHand,
            boneyard: newBoneyard,
            currentPlayer: 'player',
            gameMessage: `Computer drew ${drawnCount} domino(s) but can't play! Your turn, ninja!`
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

  const canPlayDomino = (domino: DominoType): 'left' | 'right' | 'top' | 'bottom' | null => {
    const { leftEnd, rightEnd, spinner, topEnd, bottomEnd } = gameState
    
    // Check left and right ends first
    if (domino.left === leftEnd || domino.right === leftEnd) return 'left'
    if (domino.left === rightEnd || domino.right === rightEnd) return 'right'
    
    // Check 4-way spinner play if spinner exists and both sides are used
    if (spinner && spinner.sidesUsed === 2) {
      if (topEnd === null && (domino.left === spinner.value || domino.right === spinner.value)) return 'top'
      if (bottomEnd === null && (domino.left === spinner.value || domino.right === spinner.value)) return 'bottom'
      if (topEnd !== null && (domino.left === topEnd || domino.right === topEnd)) return 'top'
      if (bottomEnd !== null && (domino.left === bottomEnd || domino.right === bottomEnd)) return 'bottom'
    }
    
    return null
  }

  const playDomino = (domino: DominoType, player: 'player' | 'computer', side?: 'left' | 'right' | 'top' | 'bottom') => {
    const { leftEnd, rightEnd, topEnd, bottomEnd, board, spinner } = gameState
    
    if (!side) {
      // Auto-detect which side to play on
      if (domino.left === leftEnd || domino.right === leftEnd) side = 'left'
      else if (domino.left === rightEnd || domino.right === rightEnd) side = 'right'
      else if (spinner && spinner.sidesUsed === 2) {
        if (topEnd === null && (domino.left === spinner.value || domino.right === spinner.value)) side = 'top'
        else if (bottomEnd === null && (domino.left === spinner.value || domino.right === spinner.value)) side = 'bottom'
        else if (topEnd !== null && (domino.left === topEnd || domino.right === topEnd)) side = 'top'
        else if (bottomEnd !== null && (domino.left === bottomEnd || domino.right === bottomEnd)) side = 'bottom'
      }
      if (!side) return
    }

    let newLeftEnd = leftEnd
    let newRightEnd = rightEnd
    let newTopEnd = topEnd
    let newBottomEnd = bottomEnd
    let flippedDomino = { ...domino }

    if (side === 'left') {
      if (domino.left === leftEnd) {
        // Left end matches, domino goes as-is, new left end is the right side
        newLeftEnd = domino.right
      } else if (domino.right === leftEnd) {
        // Right end matches, flip domino so right end connects to left end
        newLeftEnd = domino.left  
        flippedDomino = { ...domino, left: domino.right, right: domino.left, isFlipped: true }
      }
    } else if (side === 'right') {
      if (domino.right === rightEnd) {
        // Right end matches, domino goes as-is, new right end is the left side
        newRightEnd = domino.left
      } else if (domino.left === rightEnd) {
        // Left end matches, flip domino so left end connects to right end
        newRightEnd = domino.right
        flippedDomino = { ...domino, left: domino.right, right: domino.left, isFlipped: true }
      }
    } else if (side === 'top') {
      // Playing on top of spinner
      if (topEnd === null) {
        // First play on top - connecting to spinner
        if (domino.left === spinner!.value) {
          newTopEnd = domino.right
        } else if (domino.right === spinner!.value) {
          newTopEnd = domino.left
          flippedDomino = { ...domino, left: domino.right, right: domino.left, isFlipped: true }
        }
      } else {
        // Continue on top branch
        if (domino.left === topEnd) {
          newTopEnd = domino.right
        } else if (domino.right === topEnd) {
          newTopEnd = domino.left
          flippedDomino = { ...domino, left: domino.right, right: domino.left, isFlipped: true }
        }
      }
    } else if (side === 'bottom') {
      // Playing on bottom of spinner
      if (bottomEnd === null) {
        // First play on bottom - connecting to spinner
        if (domino.left === spinner!.value) {
          newBottomEnd = domino.right
        } else if (domino.right === spinner!.value) {
          newBottomEnd = domino.left
          flippedDomino = { ...domino, left: domino.right, right: domino.left, isFlipped: true }
        }
      } else {
        // Continue on bottom branch
        if (domino.left === bottomEnd) {
          newBottomEnd = domino.right
        } else if (domino.right === bottomEnd) {
          newBottomEnd = domino.left
          flippedDomino = { ...domino, left: domino.right, right: domino.left, isFlipped: true }
        }
      }
    }

    // Position the new domino with proper spacing
    // Domino dimensions: 80px width x 160px height at scale-35 = 28px x 56px
    const dominoWidth = 28  // 80px * 0.35
    const dominoHeight = 56 // 160px * 0.35 
    const spacing = dominoWidth + 2 // Small gap between dominoes to prevent overlap
    const boardCenterX = 370
    const boardCenterY = 135
    
    let newX: number  
    let newY: number = boardCenterY // Will be set based on placement logic
    let rotation = 90 // Default horizontal
    
    // Double dominoes should always be vertical (except spinner)
    if (flippedDomino.isDouble && board.length > 1) {
      rotation = 0 // Vertical for doubles
    }
    
    let newBoard: DominoType[]
    
    // Handle first domino placement (should never happen since first domino is placed in startGame)
    if (board.length === 0) {
      newX = boardCenterX
      newY = boardCenterY
      rotation = 0 // Vertical for spinner
      newBoard = [{ ...flippedDomino, x: newX, y: newY, rotation }]
    } else if (side === 'top') {
      // Find spinner (first domino) and position domino above it
      const spinnerDomino = board[0]
      newX = spinnerDomino.x!
      newY = spinnerDomino.y! - (dominoHeight - 2) // Position above spinner with slight overlap
      rotation = 0 // Vertical for top/bottom plays
      newBoard = [...board, { ...flippedDomino, x: newX, y: newY, rotation }]
    } else if (side === 'bottom') {
      // Find spinner (first domino) and position domino below it  
      const spinnerDomino = board[0]
      newX = spinnerDomino.x!
      newY = spinnerDomino.y! + (dominoHeight - 2) // Position below spinner with slight overlap
      rotation = 0 // Vertical for top/bottom plays
      newBoard = [...board, { ...flippedDomino, x: newX, y: newY, rotation }]
    } else {
      // Original left/right logic
      // Check if we need to turn upward/downward based on position
      // Count dominoes on each side to decide when to turn
      const dominoesOnLeft = board.filter(d => d.x! < boardCenterX).length
      const dominoesOnRight = board.filter(d => d.x! >= boardCenterX).length
      
      if (side === 'left') {
        // Turn upward after 5 dominoes on the left
        if (dominoesOnLeft >= 5) {
          newX = board[0].x!
          newY = board[0].y! - (dominoHeight - 2) // Position above for vertical
          rotation = 0 // Vertical
        } else {
          newX = board[0].x! - spacing
          newY = board[0].y! // Same Y level as spinner
        }
        newBoard = [{ ...flippedDomino, x: newX, y: newY, rotation }, ...board]
      } else {
        // Turn downward after 5 dominoes on the right
        if (dominoesOnRight >= 4) {
          newX = board[board.length - 1].x!
          newY = board[board.length - 1].y! + (dominoHeight - 2) // Position below for vertical
          rotation = 0 // Vertical
        } else {
          newX = board[board.length - 1].x! + spacing
          newY = board[board.length - 1].y! // Same Y level as last domino
        }
        newBoard = [...board, { ...flippedDomino, x: newX, y: newY, rotation }]
      }
    }

    const newPlayerHand = player === 'player' 
      ? gameState.playerHand.filter(d => d.id !== domino.id)
      : gameState.playerHand
    const newComputerHand = player === 'computer'
      ? gameState.computerHand.filter(d => d.id !== domino.id)
      : gameState.computerHand

    // Update spinner tracking if we just played off the spinner
    let updatedSpinner = gameState.spinner
    if (updatedSpinner && updatedSpinner.sidesUsed < 2) {
      if (board.length === 1) {
        // First play off the spinner (going to one side)
        updatedSpinner = { ...updatedSpinner, sidesUsed: 1 }
      } else if (board.length === 2) {
        // Second play off the spinner (going to the other side)
        // This happens when we have spinner + 1 domino, and we're adding the second
        updatedSpinner = { ...updatedSpinner, sidesUsed: 2 }
      }
    }
    
    // Calculate score from the new ends (including spinner if applicable)
    const score = calculateScore(newLeftEnd ?? 0, newRightEnd ?? 0, updatedSpinner)
    
    // Debug logging
    console.log('Score calculation:', {
      leftEnd: newLeftEnd,
      rightEnd: newRightEnd,
      spinner: updatedSpinner,
      calculatedScore: score,
      player
    })
    
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
      topEnd: newTopEnd,
      bottomEnd: newBottomEnd,
      winner,
      gameMessage,
      playerScore: newPlayerScore,
      computerScore: newComputerScore,
      spinner: updatedSpinner
    }))

    if (winner) {
      setTimeout(() => onGameEnd(winner), 2000)
    }

    setSelectedDomino(null)
  }

  const handlePlayerDomino = (domino: DominoType) => {
    if (gameState.currentPlayer !== 'player' || gameState.gamePhase !== 'playing') return

    // If board only has one domino (the spinner), always play to the left
    if (gameState.board.length === 1) {
      playDomino(domino, 'player', 'left')
      return
    }

    // Check all possible play positions
    const canPlayLeft = (domino.left === gameState.leftEnd || domino.right === gameState.leftEnd)
    const canPlayRight = (domino.left === gameState.rightEnd || domino.right === gameState.rightEnd)
    
    // Check 4-way spinner plays
    const { spinner, topEnd, bottomEnd } = gameState
    const canPlayTop = spinner && spinner.sidesUsed === 2 && 
      ((topEnd === null && (domino.left === spinner.value || domino.right === spinner.value)) ||
       (topEnd !== null && (domino.left === topEnd || domino.right === topEnd)))
    const canPlayBottom = spinner && spinner.sidesUsed === 2 && 
      ((bottomEnd === null && (domino.left === spinner.value || domino.right === spinner.value)) ||
       (bottomEnd !== null && (domino.left === bottomEnd || domino.right === bottomEnd)))
    
    const possibleMoves = [
      canPlayLeft && 'left',
      canPlayRight && 'right',
      canPlayTop && 'top',
      canPlayBottom && 'bottom'
    ].filter(Boolean)
    
    if (possibleMoves.length > 1) {
      // Show side selector for multiple options
      setSelectedDomino(domino)
      setShowSideSelector(true)
    } else if (canPlayLeft) {
      playDomino(domino, 'player', 'left')
    } else if (canPlayRight) {
      playDomino(domino, 'player', 'right')
    } else if (canPlayTop) {
      playDomino(domino, 'player', 'top')
    } else if (canPlayBottom) {
      playDomino(domino, 'player', 'bottom')
    }
  }
  
  const handleSideSelection = (side: 'left' | 'right' | 'top' | 'bottom') => {
    if (selectedDomino) {
      playDomino(selectedDomino, 'player', side)
      setSelectedDomino(null)
      setShowSideSelector(false)
    }
  }

  const drawFromBoneyard = () => {
    if (gameState.currentPlayer !== 'player' || gameState.boneyard.length === 0) return
    
    let newBoneyard = [...gameState.boneyard]
    let newPlayerHand = [...gameState.playerHand]
    let drawnDominoes = 0
    let foundPlayable = false
    let lastDrawn: DominoType | null = null
    
    // Keep drawing until we find a playable domino or boneyard is empty
    while (newBoneyard.length > 0 && !foundPlayable) {
      const drawnDomino = newBoneyard[0]
      newBoneyard = newBoneyard.slice(1)
      newPlayerHand = [...newPlayerHand, drawnDomino]
      drawnDominoes++
      lastDrawn = drawnDomino
      
      // Check if this domino is playable
      const tempState = { ...gameState, playerHand: [drawnDomino] }
      const playable = drawnDomino.left === gameState.leftEnd || drawnDomino.right === gameState.leftEnd ||
                       drawnDomino.left === gameState.rightEnd || drawnDomino.right === gameState.rightEnd
      
      if (playable) {
        foundPlayable = true
      }
    }
    
    const message = foundPlayable 
      ? `Drew ${drawnDominoes} domino(s) - found one you can play!`
      : newBoneyard.length === 0 
        ? `Drew ${drawnDominoes} domino(s) - boneyard empty, no playable dominoes. Pass turn.`
        : 'Drew a domino'
    
    setGameState(prev => ({
      ...prev,
      playerHand: newPlayerHand,
      boneyard: newBoneyard,
      gameMessage: message,
      currentPlayer: foundPlayable || newBoneyard.length > 0 ? 'player' : 'computer'
    }))
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex flex-col relative overflow-hidden">
      {/* Header Bar with Back Button and Scores */}
      <div className="flex justify-between items-center p-2 bg-slate-800/50">
        <button
          onClick={onBackToHome}
          className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white px-3 py-1 rounded text-sm font-bold transition-all"
        >
          ← Back
        </button>
        
        <div className="flex gap-4 text-xs">
          <div className="bg-cyan-500/20 border border-cyan-400/50 rounded px-2 py-1">
            <span className="text-cyan-400 font-bold">CPU: {gameState.computerScore}</span>
          </div>
          <div className="bg-green-500/20 border border-green-400/50 rounded px-2 py-1">
            <span className="text-green-400 font-bold">You: {gameState.playerScore}</span>
          </div>
        </div>
      </div>

      {/* Computer Hand - Ultra Compact */}
      <div className="text-center py-0.5">
        <div className="flex justify-center space-x-0">
          {gameState.computerHand.map((_, index) => (
            <div key={index} className="scale-25" style={{ marginLeft: index > 0 ? '-8px' : '0' }}>
              <DominoComponent 
                domino={{ id: `back-${index}`, left: 0, right: 0, isDouble: false }} 
                faceDown={true}
              />
            </div>
          ))}
        </div>
        <div className="text-xs text-cyan-400 font-semibold">CPU ({gameState.computerHand.length})</div>
      </div>

      {/* Game Status Message */}
      <div className="text-center py-1">
        <div className="bg-gradient-to-r from-green-500/20 to-cyan-500/20 border border-green-400/30 rounded px-3 py-1 inline-block">
          <p className="text-green-400 font-semibold text-xs">{gameState.gameMessage}</p>
        </div>
      </div>

      {/* Main Game Board - Big Focus Area */}
      <div className="flex-1 flex items-center justify-center px-1 py-2">
        {/* Game Board - BIG MAIN AREA */}
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-800 to-black border-4 border-green-400/50 rounded-xl p-4 overflow-hidden relative">
          {/* Boneyard - Overlay when needed */}
          {gameState.currentPlayer === 'player' && gameState.boneyard.length > 0 && 
           !gameState.playerHand.some(d => canPlayDomino(d)) && (
            <div className="absolute top-4 left-4 z-10 flex flex-col items-center">
              <div className="text-yellow-400 text-xs font-bold mb-1">Draw</div>
              <div className="text-yellow-300 text-xs mb-1">({gameState.boneyard.length})</div>
              <div className="scale-20 mb-1">
                <DominoComponent 
                  domino={{ id: `boneyard-top`, left: 0, right: 0, isDouble: false }} 
                  faceDown={true}
                />
              </div>
              <button
                onClick={drawFromBoneyard}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black px-2 py-1 rounded text-xs font-bold transition-all"
              >
                Draw
              </button>
            </div>
          )}
            <div ref={boardRef} className="relative" style={{ width: '800px', height: '400px' }}>
              {/* Temporary center marker */}
              <div className="absolute" style={{ 
                left: '50%', 
                top: '50%', 
                width: '10px', 
                height: '10px', 
                backgroundColor: 'red', 
                transform: 'translate(-50%, -50%)',
                zIndex: 1000,
                borderRadius: '50%'
              }}></div>
              <div className="absolute" style={{ 
                left: '0', 
                top: '50%', 
                width: '100%', 
                height: '1px', 
                backgroundColor: 'red', 
                opacity: 0.3,
                zIndex: 999
              }}></div>
              <div className="absolute" style={{ 
                left: '50%', 
                top: '0', 
                width: '1px', 
                height: '100%', 
                backgroundColor: 'red', 
                opacity: 0.3,
                zIndex: 999
              }}></div>
              <AnimatePresence>
                {gameState.board.map((domino, index) => (
                  <motion.div
                    key={domino.id}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute"
                    style={{ 
                      left: `${domino.x || (100 + index * 30)}px`,
                      top: `${domino.y || 100}px`,
                      transform: 'translate(-50%, -50%)' // Center the domino on its coordinates
                    }}
                  >
                    <div 
                      className="scale-35"
                      style={{ 
                        transform: `rotate(${domino.rotation || 0}deg)`,
                        transformOrigin: 'center'
                      }}
                    >
                      <DominoComponent domino={domino} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* End indicators */}
              {gameState.board.length > 0 && (
                <>
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-green-500 text-black px-2 py-1 rounded font-bold text-sm">
                    {gameState.leftEnd}
                  </div>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-cyan-500 text-black px-2 py-1 rounded font-bold text-sm">
                    {gameState.rightEnd}
                  </div>
                </>
              )}
            </div>
        </div>
      </div>

      {/* Player Hand - Ultra Compact */}
      <div className="text-center py-1 bg-slate-800/30">
        <div className="text-xs text-green-400 font-semibold mb-0.5">Your Hand ({gameState.playerHand.length})</div>
        <div className="flex justify-center space-x-0 flex-wrap px-1">
          {gameState.playerHand.map((domino, index) => {
            const playable = canPlayDomino(domino) !== null
            return (
              <motion.div
                key={domino.id}
                className={`scale-35 cursor-pointer ${playable ? 'hover:scale-40' : 'opacity-50'}`}
                style={{ marginLeft: index > 0 ? '-3px' : '0' }}
                whileHover={playable ? { y: -3 } : {}}
                onClick={() => playable && handlePlayerDomino(domino)}
              >
                <DominoComponent 
                  domino={domino} 
                  className={playable ? 'border border-green-400/50 shadow-sm shadow-green-400/25' : ''}
                />
              </motion.div>
            )
          })}
        </div>
      </div>
      
      {/* Side Selector Modal */}
      {showSideSelector && selectedDomino && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-4 border-green-400 rounded-xl p-6">
            <h3 className="text-green-400 font-bold text-lg mb-4">Choose where to play this domino:</h3>
            <div className="flex gap-4 mb-4 justify-center">
              <DominoComponent domino={selectedDomino} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* Left button */}
              {(selectedDomino.left === gameState.leftEnd || selectedDomino.right === gameState.leftEnd) && (
                <button
                  onClick={() => handleSideSelection('left')}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-black px-4 py-2 rounded-lg font-bold transition-all text-sm"
                >
                  LEFT ({gameState.leftEnd})
                </button>
              )}
              
              {/* Right button */}
              {(selectedDomino.left === gameState.rightEnd || selectedDomino.right === gameState.rightEnd) && (
                <button
                  onClick={() => handleSideSelection('right')}
                  className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-black px-4 py-2 rounded-lg font-bold transition-all text-sm"
                >
                  RIGHT ({gameState.rightEnd})
                </button>
              )}
              
              {/* Top button - when 4-way spinner is available */}
              {gameState.spinner && gameState.spinner.sidesUsed === 2 && 
               ((gameState.topEnd === null && (selectedDomino.left === gameState.spinner.value || selectedDomino.right === gameState.spinner.value)) ||
                (gameState.topEnd !== null && (selectedDomino.left === gameState.topEnd || selectedDomino.right === gameState.topEnd))) && (
                <button
                  onClick={() => handleSideSelection('top')}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-black px-4 py-2 rounded-lg font-bold transition-all text-sm"
                >
                  TOP ({gameState.topEnd || gameState.spinner.value})
                </button>
              )}
              
              {/* Bottom button - when 4-way spinner is available */}
              {gameState.spinner && gameState.spinner.sidesUsed === 2 && 
               ((gameState.bottomEnd === null && (selectedDomino.left === gameState.spinner.value || selectedDomino.right === gameState.spinner.value)) ||
                (gameState.bottomEnd !== null && (selectedDomino.left === gameState.bottomEnd || selectedDomino.right === gameState.bottomEnd))) && (
                <button
                  onClick={() => handleSideSelection('bottom')}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-black px-4 py-2 rounded-lg font-bold transition-all text-sm"
                >
                  BOTTOM ({gameState.bottomEnd || gameState.spinner.value})
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DominoGame