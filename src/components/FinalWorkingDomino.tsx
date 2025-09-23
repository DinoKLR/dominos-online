'use client'

import React, { useState, useEffect } from 'react'
import DominoComponent from './Domino'

// FINAL WORKING VERSION - Simple and correct

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
  rotation: number // 0 = vertical (for doubles), 90 = horizontal (for regular)
}

interface FinalWorkingDominoProps {
  onGameEnd: (winner: 'player' | 'computer') => void
  onBackToHome: () => void
}

const FinalWorkingDomino: React.FC<FinalWorkingDominoProps> = ({ onGameEnd, onBackToHome }) => {
  const [board, setBoard] = useState<PlacedDomino[]>([])
  const [leftEnd, setLeftEnd] = useState<number>(0)
  const [rightEnd, setRightEnd] = useState<number>(0)
  const [playerHand, setPlayerHand] = useState<Domino[]>([])
  const [computerHand, setComputerHand] = useState<Domino[]>([])
  const [boneyard, setBoneyard] = useState<Domino[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<'player' | 'computer'>('player')
  const [message, setMessage] = useState('Starting game...')

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
    const boneyardTiles = shuffled.slice(14)

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
    // Doubles stay vertical (0 rotation), regular dominoes go horizontal (90 rotation)
    const firstPlaced: PlacedDomino = {
      domino: startDomino,
      x: 600,
      y: 300,
      rotation: startDomino.isDouble ? 0 : 90
    }

    setBoard([firstPlaced])
    setLeftEnd(startDomino.left)
    setRightEnd(startDomino.right)

    if (starter === 'player') {
      setPlayerHand(playerTiles.filter(d => d.id !== startDomino.id))
      setComputerHand(computerTiles)
      setBoneyard(boneyardTiles)
      setCurrentPlayer('computer')
      setMessage('Computer\'s turn')
    } else {
      setPlayerHand(playerTiles)
      setComputerHand(computerTiles.filter(d => d.id !== startDomino.id))
      setBoneyard(boneyardTiles)
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
    // Create a copy of the domino to place
    let placedDomino = { ...domino }

    // Figure out which end matches and orient the domino correctly
    if (side === 'left') {
      // We're placing on the left side, need to match leftEnd
      if (domino.right === leftEnd) {
        // Right side matches, keep as is - right side will be on the right when horizontal
        // No flip needed
      } else if (domino.left === leftEnd) {
        // Left side matches, need to flip so left becomes right
        placedDomino = { ...domino, left: domino.right, right: domino.left }
      }
      // Update the left end to the other side of the domino
      setLeftEnd(placedDomino.left)
    } else {
      // We're placing on the right side, need to match rightEnd
      if (domino.left === rightEnd) {
        // Left side matches, keep as is - left side will be on the left when horizontal
        // No flip needed
      } else if (domino.right === rightEnd) {
        // Right side matches, need to flip so right becomes left
        placedDomino = { ...domino, left: domino.right, right: domino.left }
      }
      // Update the right end to the other side of the domino
      setRightEnd(placedDomino.right)
    }

    // Calculate position
    let x = 0
    let y = 300

    if (side === 'left') {
      const leftmost = board.reduce((min, p) => p.x < min.x ? p : min)
      // Space based on what we're connecting to
      if (leftmost.rotation === 0) {
        // Connecting to a vertical double - use 85px
        x = leftmost.x - 85
      } else {
        // Connecting to a horizontal domino - use 160px
        x = leftmost.x - 160
      }
    } else {
      const rightmost = board.reduce((max, p) => p.x > max.x ? p : max)
      // Space based on what we're connecting to
      if (rightmost.rotation === 0) {
        // Connecting to a vertical double - use 85px
        x = rightmost.x + 85
      } else {
        // Connecting to a horizontal domino - use 160px
        x = rightmost.x + 160
      }
    }

    const newPlaced: PlacedDomino = {
      domino: placedDomino,
      x: x,
      y: y,
      rotation: placedDomino.isDouble ? 0 : 90 // Doubles vertical, others horizontal
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

  const handleDraw = () => {
    if (currentPlayer !== 'player' || boneyard.length === 0) return

    // Check if player can play any domino
    const canPlayAny = playerHand.some(d => canPlay(d) !== null)
    if (canPlayAny) {
      setMessage('You can still play a domino!')
      return
    }

    // Draw from boneyard
    const drawn = boneyard[0]
    setPlayerHand([...playerHand, drawn])
    setBoneyard(boneyard.slice(1))
    setMessage(`Drew ${drawn.id}. ${boneyard.length - 1} left in boneyard`)
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

      // Computer can't play, try to draw
      if (boneyard.length > 0) {
        const drawn = boneyard[0]
        setComputerHand([...computerHand, drawn])
        setBoneyard(boneyard.slice(1))
        setMessage('Computer drew a domino')
        // Try to play the drawn domino
        const playable = canPlay(drawn)
        if (playable) {
          const side = playable === 'both' ? 'right' : playable
          playDomino(drawn, side as 'left' | 'right')
          setComputerHand(computerHand) // Already removed by adding then playing
          setMessage('Computer played the drawn domino')
        }
      }

      setCurrentPlayer('player')
      setMessage('Your turn')
    }, 1000)

    return () => clearTimeout(timer)
  }, [currentPlayer, computerHand, leftEnd, rightEnd, boneyard])

  return (
    <div className="fixed inset-0 bg-green-800 flex flex-col">
      <div className="bg-black/30 p-2 flex justify-between items-center">
        <div className="text-white font-bold">FINAL WORKING</div>
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
          {board.map((placed, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: placed.x,
                top: placed.y,
                transform: `translate(-50%, -50%) rotate(${placed.rotation}deg)`,
                transformOrigin: 'center'
              }}
            >
              <DominoComponent domino={placed.domino} />
            </div>
          ))}
        </div>
      </div>

      {/* Player hand */}
      <div className="bg-black/30 p-4">
        <div className="flex gap-2 justify-center items-center">
          <button
            onClick={handleDraw}
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded font-bold mr-4"
            disabled={boneyard.length === 0}
          >
            DRAW ({boneyard.length})
          </button>
          {playerHand.map(domino => (
            <div
              key={domino.id}
              onClick={() => handleDominoClick(domino)}
              className={`cursor-pointer transition-all ${
                canPlay(domino) ? 'hover:scale-110' : 'opacity-50'
              }`}
            >
              <DominoComponent domino={domino} />
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

export default FinalWorkingDomino