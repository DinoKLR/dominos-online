'use client'

import React, { useState, useEffect } from 'react'
import HorizontalDomino from './HorizontalDomino'

// BASIC WORKING DOMINO - Just place in a straight line
// No complex logic, just dominoes that connect properly

interface Domino {
  id: string
  left: number
  right: number
  isDouble: boolean
}

interface PlacedDomino {
  domino: Domino
  x: number
  y: number
  flipped: boolean
}

interface BasicDominoProps {
  onGameEnd: (winner: 'player' | 'computer') => void
  onBackToHome: () => void
}

const BasicDomino: React.FC<BasicDominoProps> = ({ onGameEnd, onBackToHome }) => {
  const [board, setBoard] = useState<PlacedDomino[]>([])
  const [leftEnd, setLeftEnd] = useState<number>(0)
  const [rightEnd, setRightEnd] = useState<number>(0)
  const [playerHand, setPlayerHand] = useState<Domino[]>([])
  const [computerHand, setComputerHand] = useState<Domino[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<'player' | 'computer'>('player')
  const [message, setMessage] = useState('Starting game...')

  // Create domino set
  const createDominoes = () => {
    const dominoes: Domino[] = []
    for (let i = 0; i <= 6; i++) {
      for (let j = i; j <= 6; j++) {
        dominoes.push({
          id: `${i}-${j}`,
          left: i,
          right: j,
          isDouble: i === j
        })
      }
    }
    return dominoes
  }

  useEffect(() => {
    startGame()
  }, [])

  const startGame = () => {
    const dominoes = createDominoes()
    const shuffled = [...dominoes].sort(() => Math.random() - 0.5)

    const playerTiles = shuffled.slice(0, 7)
    const computerTiles = shuffled.slice(7, 14)

    // Find highest double to start
    let startDomino: Domino | null = null
    let starter: 'player' | 'computer' = 'player'

    for (let i = 6; i >= 0; i--) {
      const playerDouble = playerTiles.find(d => d.left === i && d.right === i)
      if (playerDouble) {
        startDomino = playerDouble
        starter = 'player'
        break
      }
      const compDouble = computerTiles.find(d => d.left === i && d.right === i)
      if (compDouble) {
        startDomino = compDouble
        starter = 'computer'
        break
      }
    }

    if (!startDomino) {
      // No doubles, highest pip starts
      const getTotal = (d: Domino) => d.left + d.right
      const playerMax = playerTiles.reduce((max, d) => getTotal(d) > getTotal(max) ? d : max)
      const compMax = computerTiles.reduce((max, d) => getTotal(d) > getTotal(max) ? d : max)

      if (getTotal(playerMax) >= getTotal(compMax)) {
        startDomino = playerMax
        starter = 'player'
      } else {
        startDomino = compMax
        starter = 'computer'
      }
    }

    // Place first domino in center
    const firstPlaced: PlacedDomino = {
      domino: startDomino,
      x: 500,
      y: 300,
      flipped: false
    }

    setBoard([firstPlaced])
    setLeftEnd(startDomino.left)
    setRightEnd(startDomino.right)

    // Remove from hand
    if (starter === 'player') {
      setPlayerHand(playerTiles.filter(d => d.id !== startDomino.id))
      setComputerHand(computerTiles)
      setCurrentPlayer('computer')
      setMessage('Computer\'s turn')
    } else {
      setPlayerHand(playerTiles)
      setComputerHand(computerTiles.filter(d => d.id !== startDomino.id))
      setCurrentPlayer('player')
      setMessage('Your turn')
    }
  }

  const canPlay = (domino: Domino): 'left' | 'right' | 'both' | null => {
    const matchesLeft = domino.left === leftEnd || domino.right === leftEnd
    const matchesRight = domino.left === rightEnd || domino.right === rightEnd

    if (matchesLeft && matchesRight) return 'both'
    if (matchesLeft) return 'left'
    if (matchesRight) return 'right'
    return null
  }

  const playDomino = (domino: Domino, side: 'left' | 'right') => {
    const newPlaced: PlacedDomino = {
      domino: domino,
      x: 0,
      y: 300,
      flipped: false
    }

    if (side === 'left') {
      // Place on left side
      const leftmost = board.reduce((min, p) => p.x < min.x ? p : min)
      newPlaced.x = leftmost.x - 118 // Slightly less to ensure touching (accounting for border)

      // Check which pip matches
      if (domino.right === leftEnd) {
        newPlaced.flipped = false
        setLeftEnd(domino.left)
      } else {
        newPlaced.flipped = true
        setLeftEnd(domino.right)
      }
    } else {
      // Place on right side
      const rightmost = board.reduce((max, p) => p.x > max.x ? p : max)
      newPlaced.x = rightmost.x + 118 // Slightly less to ensure touching (accounting for border)

      // Check which pip matches
      if (domino.left === rightEnd) {
        newPlaced.flipped = false
        setRightEnd(domino.right)
      } else {
        newPlaced.flipped = true
        setRightEnd(domino.left)
      }
    }

    setBoard([...board, newPlaced])
  }

  const handleDominoClick = (domino: Domino) => {
    if (currentPlayer !== 'player') return

    const playable = canPlay(domino)
    if (!playable) {
      setMessage('Can\'t play this domino!')
      return
    }

    // If can play both sides, default to right
    const side = playable === 'both' ? 'right' : playable
    playDomino(domino, side as 'left' | 'right')

    setPlayerHand(playerHand.filter(d => d.id !== domino.id))
    setCurrentPlayer('computer')
    setMessage('Computer\'s turn')

    if (playerHand.length === 1) {
      setTimeout(() => {
        setMessage('You won!')
        onGameEnd('player')
      }, 2000)
    }
  }

  // Computer AI
  useEffect(() => {
    if (currentPlayer !== 'computer') return

    const timer = setTimeout(() => {
      for (const domino of computerHand) {
        const playable = canPlay(domino)
        if (playable) {
          const side = playable === 'both' ? 'right' : playable
          playDomino(domino, side as 'left' | 'right')
          setComputerHand(computerHand.filter(d => d.id !== domino.id))
          setCurrentPlayer('player')
          setMessage('Your turn')

          if (computerHand.length === 1) {
            setTimeout(() => {
              setMessage('Computer won!')
              onGameEnd('computer')
            }, 2000)
          }
          return
        }
      }

      // Computer can't play
      setCurrentPlayer('player')
      setMessage('Computer passed - your turn')
    }, 1000)

    return () => clearTimeout(timer)
  }, [currentPlayer, computerHand, leftEnd, rightEnd])

  return (
    <div className="fixed inset-0 bg-green-800 flex flex-col">
      <div className="bg-black/30 p-2 flex justify-between items-center">
        <div className="text-white font-bold">BASIC DOMINO</div>
        <div className="text-white">{message}</div>
        <div className="text-white">Left: {leftEnd} | Right: {rightEnd}</div>
        <button
          onClick={onBackToHome}
          className="bg-red-500 text-white px-3 py-1 rounded"
        >
          Exit
        </button>
      </div>

      {/* Board */}
      <div className="flex-1 relative overflow-auto">
        <div className="relative" style={{ width: '2000px', height: '600px' }}>
          {board.map((placed, i) => {
            const displayDomino = placed.flipped
              ? { ...placed.domino, left: placed.domino.right, right: placed.domino.left }
              : placed.domino

            return (
              <div
                key={i}
                className="absolute"
                style={{
                  left: placed.x - 60, // Center the 120px wide domino
                  top: placed.y - 30   // Center the 60px tall domino
                }}
              >
                <HorizontalDomino
                  left={displayDomino.left}
                  right={displayDomino.right}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Player hand */}
      <div className="bg-black/30 p-4">
        <div className="flex gap-2 justify-center">
          {playerHand.map(domino => (
            <div
              key={domino.id}
              onClick={() => handleDominoClick(domino)}
              className={`transition-all ${
                canPlay(domino) ? 'hover:scale-110' : 'opacity-50'
              }`}
            >
              <HorizontalDomino
                left={domino.left}
                right={domino.right}
                onClick={() => handleDominoClick(domino)}
              />
            </div>
          ))}
        </div>
        <div className="text-center text-white mt-2">
          Your tiles: {playerHand.length} | Computer: {computerHand.length}
        </div>
      </div>
    </div>
  )
}

export default BasicDomino