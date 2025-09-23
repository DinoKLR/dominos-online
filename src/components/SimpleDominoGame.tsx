'use client'

import React, { useState, useEffect } from 'react'
import { createDominoSet, Domino as LegacyDomino } from '@/types/domino'
import DominoComponent from './Domino'

// SIMPLE DOMINO GAME - Just make it work!
// No complex grids, just track positions and connections

interface Domino {
  id: string
  left: number
  right: number
  x: number  // Actual pixel position
  y: number  // Actual pixel position
  rotation: number  // 0 or 90 degrees
  placed: boolean
}

interface OpenEnd {
  value: number
  x: number
  y: number
  direction: 'left' | 'right' | 'up' | 'down'
}

interface SimpleDominoGameProps {
  onGameEnd: (winner: 'player' | 'computer') => void
  onBackToHome: () => void
}

const DOMINO_WIDTH = 120
const DOMINO_HEIGHT = 60
const BOARD_CENTER_X = 600
const BOARD_CENTER_Y = 300

const SimpleDominoGame: React.FC<SimpleDominoGameProps> = ({ onGameEnd, onBackToHome }) => {
  const [placedDominoes, setPlacedDominoes] = useState<Domino[]>([])
  const [openEnds, setOpenEnds] = useState<OpenEnd[]>([])
  const [playerHand, setPlayerHand] = useState<Domino[]>([])
  const [computerHand, setComputerHand] = useState<Domino[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<'player' | 'computer'>('player')
  const [message, setMessage] = useState('Starting game...')

  useEffect(() => {
    startGame()
  }, [])

  const startGame = () => {
    const dominoes = createDominoSet()
    const shuffled = [...dominoes].sort(() => Math.random() - 0.5)

    // Convert to our domino format
    const allDominoes: Domino[] = shuffled.map(d => ({
      id: d.id,
      left: d.left,
      right: d.right,
      x: 0,
      y: 0,
      rotation: 0,
      placed: false
    }))

    const playerTiles = allDominoes.slice(0, 7)
    const computerTiles = allDominoes.slice(7, 14)

    // Find who has highest double
    let startingDomino: Domino | null = null
    let starter: 'player' | 'computer' = 'player'

    for (let pip = 6; pip >= 0; pip--) {
      const playerDouble = playerTiles.find(d => d.left === pip && d.right === pip)
      if (playerDouble) {
        startingDomino = playerDouble
        starter = 'player'
        break
      }
      const computerDouble = computerTiles.find(d => d.left === pip && d.right === pip)
      if (computerDouble) {
        startingDomino = computerDouble
        starter = 'computer'
        break
      }
    }

    // If no doubles, highest pip count starts
    if (!startingDomino) {
      const getHighest = (tiles: Domino[]) =>
        tiles.reduce((max, d) =>
          (d.left + d.right > max.left + max.right) ? d : max
        )
      const playerHighest = getHighest(playerTiles)
      const computerHighest = getHighest(computerTiles)

      if (playerHighest.left + playerHighest.right >= computerHighest.left + computerHighest.right) {
        startingDomino = playerHighest
        starter = 'player'
      } else {
        startingDomino = computerHighest
        starter = 'computer'
      }
    }

    // Place starting domino in center
    startingDomino.x = BOARD_CENTER_X
    startingDomino.y = BOARD_CENTER_Y
    startingDomino.placed = true

    // Doubles are vertical (rotated 90 degrees)
    if (startingDomino.left === startingDomino.right) {
      startingDomino.rotation = 90

      // For vertical doubles, open ends are at the edges of the domino
      // When rotated 90°, the domino is DOMINO_HEIGHT wide
      setOpenEnds([
        {
          value: startingDomino.left,
          x: BOARD_CENTER_X - DOMINO_HEIGHT / 2,
          y: BOARD_CENTER_Y,
          direction: 'left'
        },
        {
          value: startingDomino.right,
          x: BOARD_CENTER_X + DOMINO_HEIGHT / 2,
          y: BOARD_CENTER_Y,
          direction: 'right'
        }
      ])
    } else {
      // Regular horizontal domino - endpoints at the edges
      setOpenEnds([
        {
          value: startingDomino.left,
          x: BOARD_CENTER_X - DOMINO_WIDTH / 2,
          y: BOARD_CENTER_Y,
          direction: 'left'
        },
        {
          value: startingDomino.right,
          x: BOARD_CENTER_X + DOMINO_WIDTH / 2,
          y: BOARD_CENTER_Y,
          direction: 'right'
        }
      ])
    }

    setPlacedDominoes([startingDomino])

    // Remove from hand
    if (starter === 'player') {
      setPlayerHand(playerTiles.filter(d => d.id !== startingDomino.id))
      setComputerHand(computerTiles)
      setCurrentPlayer('computer')
    } else {
      setPlayerHand(playerTiles)
      setComputerHand(computerTiles.filter(d => d.id !== startingDomino.id))
      setCurrentPlayer('player')
    }

    setMessage(`${starter === 'player' ? 'You' : 'Computer'} started with ${startingDomino.id}`)
  }

  const canPlayDomino = (domino: Domino, end: OpenEnd): { canPlay: boolean, needsFlip: boolean } => {
    // Check if either side of the domino matches the open end
    if (domino.left === end.value) {
      return { canPlay: true, needsFlip: false }
    }
    if (domino.right === end.value) {
      return { canPlay: true, needsFlip: true }
    }
    return { canPlay: false, needsFlip: false }
  }

  const placeDomino = (domino: Domino, end: OpenEnd, needsFlip: boolean) => {
    // Flip domino if needed so matching pip is on the correct side
    if (needsFlip) {
      const temp = domino.left
      domino.left = domino.right
      domino.right = temp
    }

    // Check if this is a double
    const isDouble = domino.left === domino.right

    // Position domino to connect directly at the endpoint
    if (end.direction === 'left') {
      if (isDouble) {
        // Double placed vertically to the left
        domino.x = end.x - DOMINO_HEIGHT / 2
        domino.y = end.y
        domino.rotation = 90
      } else {
        // Regular horizontal domino to the left
        domino.x = end.x - DOMINO_WIDTH
        domino.y = end.y
        domino.rotation = 0
      }
    } else if (end.direction === 'right') {
      if (isDouble) {
        // Double placed vertically to the right
        domino.x = end.x + DOMINO_HEIGHT / 2
        domino.y = end.y
        domino.rotation = 90
      } else {
        // Regular horizontal domino to the right
        domino.x = end.x + DOMINO_WIDTH
        domino.y = end.y
        domino.rotation = 0
      }
    }

    domino.placed = true

    // Update open ends
    const newEnds = openEnds.filter(e => e !== end)

    // Add new open end from the placed domino
    if (end.direction === 'left') {
      if (isDouble) {
        // Double's new endpoint is at its left edge
        newEnds.push({
          value: domino.left,
          x: end.x - DOMINO_HEIGHT,
          y: end.y,
          direction: 'left'
        })
      } else {
        // Regular domino's new endpoint is at its left edge
        newEnds.push({
          value: domino.left,
          x: end.x - DOMINO_WIDTH,
          y: end.y,
          direction: 'left'
        })
      }
    } else if (end.direction === 'right') {
      if (isDouble) {
        // Double's new endpoint is at its right edge
        newEnds.push({
          value: domino.right,
          x: end.x + DOMINO_HEIGHT,
          y: end.y,
          direction: 'right'
        })
      } else {
        // Regular domino's new endpoint is at its right edge
        newEnds.push({
          value: domino.right,
          x: end.x + DOMINO_WIDTH,
          y: end.y,
          direction: 'right'
        })
      }
    }

    setPlacedDominoes([...placedDominoes, domino])
    setOpenEnds(newEnds)
  }

  const handleDominoClick = (domino: Domino) => {
    if (currentPlayer !== 'player') return

    // Try to play at any open end
    for (const end of openEnds) {
      const { canPlay, needsFlip } = canPlayDomino(domino, end)
      if (canPlay) {
        placeDomino(domino, end, needsFlip)
        setPlayerHand(playerHand.filter(d => d.id !== domino.id))
        setCurrentPlayer('computer')
        setMessage(`You played ${domino.id}`)
        return
      }
    }

    setMessage('Cannot play this domino!')
  }

  const handlePass = () => {
    if (currentPlayer !== 'player') return

    // Check if player actually can't play anything
    let canPlayAny = false
    for (const domino of playerHand) {
      for (const end of openEnds) {
        const { canPlay } = canPlayDomino(domino, end)
        if (canPlay) {
          canPlayAny = true
          break
        }
      }
      if (canPlayAny) break
    }

    if (canPlayAny) {
      setMessage('You can still play a domino!')
    } else {
      setCurrentPlayer('computer')
      setMessage('You passed - computer\'s turn')
    }
  }

  // Check for winner
  useEffect(() => {
    // Don't check for winner until game has started (board has dominoes)
    if (placedDominoes.length === 0) return

    if (playerHand.length === 0) {
      setMessage('You won!')
      // Don't auto-end, let player see the win
    } else if (computerHand.length === 0) {
      setMessage('Computer won!')
      // Don't auto-end, let player see the win
    }
  }, [playerHand.length, computerHand.length, placedDominoes.length])

  // Computer AI
  useEffect(() => {
    if (currentPlayer !== 'computer' || playerHand.length === 0 || computerHand.length === 0) return

    const timer = setTimeout(() => {
      for (const domino of computerHand) {
        for (const end of openEnds) {
          const { canPlay, needsFlip } = canPlayDomino(domino, end)
          if (canPlay) {
            placeDomino(domino, end, needsFlip)
            setComputerHand(computerHand.filter(d => d.id !== domino.id))
            setCurrentPlayer('player')
            setMessage(`Computer played ${domino.id}`)
            return
          }
        }
      }

      setCurrentPlayer('player')
      setMessage('Computer passes - your turn!')
    }, 1000)

    return () => clearTimeout(timer)
  }, [currentPlayer, computerHand, openEnds, playerHand.length])

  return (
    <div className="fixed inset-0 bg-green-800 flex flex-col">
      <div className="bg-black/30 p-2 flex justify-between items-center">
        <div className="text-white font-bold">SIMPLE DOMINO GAME</div>
        <div className="text-white">{message}</div>
        <button
          onClick={onBackToHome}
          className="bg-red-500 text-white px-3 py-1 rounded"
        >
          Exit
        </button>
      </div>

      <div className="flex-1 relative overflow-auto">
        {/* Board */}
        <div className="relative" style={{ width: '1200px', height: '600px', margin: '0 auto' }}>
          {/* Placed dominoes */}
          {placedDominoes.map(domino => {
            // Adjust position based on rotation
            const displayX = domino.rotation === 90
              ? domino.x - DOMINO_HEIGHT / 2
              : domino.x - DOMINO_WIDTH / 2
            const displayY = domino.rotation === 90
              ? domino.y - DOMINO_WIDTH / 2
              : domino.y - DOMINO_HEIGHT / 2

            return (
              <div
                key={domino.id}
                className="absolute"
                style={{
                  left: displayX,
                  top: displayY,
                  transform: `rotate(${domino.rotation}deg)`,
                  transformOrigin: 'center'
                }}
              >
                <DominoComponent
                  domino={{
                    id: domino.id,
                    left: domino.left,
                    right: domino.right,
                    isDouble: domino.left === domino.right
                  } as LegacyDomino}
                />
              </div>
            )
          })}

          {/* Open ends indicators */}
          {openEnds.map((end, i) => (
            <div
              key={i}
              className="absolute w-8 h-8 bg-red-500/50 rounded-full flex items-center justify-center text-white font-bold"
              style={{
                left: end.x - 16,
                top: end.y - 16
              }}
            >
              {end.value}
            </div>
          ))}
        </div>
      </div>

      {/* Player hand */}
      <div className="bg-black/30 p-4">
        <div className="flex gap-2 justify-center items-center">
          <button
            onClick={handlePass}
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded font-bold mr-4"
          >
            PASS
          </button>
          {playerHand.map(domino => (
            <div
              key={domino.id}
              onClick={() => handleDominoClick(domino)}
              className="cursor-pointer hover:scale-110 transition-transform"
            >
              <DominoComponent
                domino={{
                  id: domino.id,
                  left: domino.left,
                  right: domino.right,
                  isDouble: domino.left === domino.right
                } as LegacyDomino}
              />
            </div>
          ))}
        </div>
        <div className="text-center text-white mt-2">
          Your dominoes ({playerHand.length}) | Computer has {computerHand.length}
        </div>
      </div>
    </div>
  )
}

export default SimpleDominoGame