'use client'

import React, { useState, useEffect } from 'react'
import { createDominoSet, Domino as LegacyDomino } from '@/types/domino'
import DominoComponent from './Domino'

// FIXED SIMPLE DOMINO GAME - Consistent coordinate system
// x,y are ALWAYS the CENTER of the domino
// Dominoes MUST touch edge-to-edge with no gaps

interface Domino {
  id: string
  left: number
  right: number
  x: number  // Center X position
  y: number  // Center Y position
  rotation: number  // 0 (horizontal) or 90 (vertical)
  placed: boolean
}

interface OpenEnd {
  value: number  // The pip value that must match
  x: number      // X position of the connection point
  y: number      // Y position of the connection point
  direction: 'left' | 'right'  // Direction to place next domino
}

interface SimpleDominoGameFixedProps {
  onGameEnd: (winner: 'player' | 'computer') => void
  onBackToHome: () => void
}

const DOMINO_WIDTH = 120
const DOMINO_HEIGHT = 60
const BOARD_CENTER_X = 600
const BOARD_CENTER_Y = 300

const SimpleDominoGameFixed: React.FC<SimpleDominoGameFixedProps> = ({ onGameEnd, onBackToHome }) => {
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

    // Place starting domino at center
    startingDomino.x = BOARD_CENTER_X
    startingDomino.y = BOARD_CENTER_Y
    startingDomino.placed = true

    // Set endpoints based on domino orientation
    if (startingDomino.left === startingDomino.right) {
      // Double - place vertically
      startingDomino.rotation = 90
      // Endpoints are at the left and right edges of the vertical domino
      setOpenEnds([
        {
          value: startingDomino.left,
          x: BOARD_CENTER_X - DOMINO_HEIGHT / 2,  // Left edge of vertical domino
          y: BOARD_CENTER_Y,
          direction: 'left'
        },
        {
          value: startingDomino.right,
          x: BOARD_CENTER_X + DOMINO_HEIGHT / 2,  // Right edge of vertical domino
          y: BOARD_CENTER_Y,
          direction: 'right'
        }
      ])
    } else {
      // Regular horizontal domino
      setOpenEnds([
        {
          value: startingDomino.left,
          x: BOARD_CENTER_X - DOMINO_WIDTH / 2,  // Left edge
          y: BOARD_CENTER_Y,
          direction: 'left'
        },
        {
          value: startingDomino.right,
          x: BOARD_CENTER_X + DOMINO_WIDTH / 2,  // Right edge
          y: BOARD_CENTER_Y,
          direction: 'right'
        }
      ])
    }

    setPlacedDominoes([startingDomino])

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
    if (domino.left === end.value) {
      return { canPlay: true, needsFlip: false }
    }
    if (domino.right === end.value) {
      return { canPlay: true, needsFlip: true }
    }
    return { canPlay: false, needsFlip: false }
  }

  const placeDomino = (domino: Domino, end: OpenEnd, needsFlip: boolean) => {
    // Flip if needed
    if (needsFlip) {
      const temp = domino.left
      domino.left = domino.right
      domino.right = temp
    }

    const isDouble = domino.left === domino.right

    // Calculate center position for the new domino
    if (end.direction === 'left') {
      if (isDouble) {
        // Vertical double to the left
        domino.rotation = 90
        domino.x = end.x - DOMINO_HEIGHT / 2  // Center is half width from edge
        domino.y = end.y
      } else {
        // Horizontal domino to the left
        domino.rotation = 0
        domino.x = end.x - DOMINO_WIDTH / 2  // Center is half width from edge
        domino.y = end.y
      }
    } else {
      if (isDouble) {
        // Vertical double to the right
        domino.rotation = 90
        domino.x = end.x + DOMINO_HEIGHT / 2  // Center is half width from edge
        domino.y = end.y
      } else {
        // Horizontal domino to the right
        domino.rotation = 0
        domino.x = end.x + DOMINO_WIDTH / 2  // Center is half width from edge
        domino.y = end.y
      }
    }

    domino.placed = true

    // Update open ends
    const newEnds = openEnds.filter(e => e !== end)

    // Add new endpoint at the far edge of the placed domino
    if (end.direction === 'left') {
      if (isDouble) {
        newEnds.push({
          value: domino.left,
          x: domino.x - DOMINO_HEIGHT / 2,  // Left edge of vertical domino
          y: domino.y,
          direction: 'left'
        })
      } else {
        newEnds.push({
          value: domino.left,
          x: domino.x - DOMINO_WIDTH / 2,  // Left edge of horizontal domino
          y: domino.y,
          direction: 'left'
        })
      }
    } else {
      if (isDouble) {
        newEnds.push({
          value: domino.right,
          x: domino.x + DOMINO_HEIGHT / 2,  // Right edge of vertical domino
          y: domino.y,
          direction: 'right'
        })
      } else {
        newEnds.push({
          value: domino.right,
          x: domino.x + DOMINO_WIDTH / 2,  // Right edge of horizontal domino
          y: domino.y,
          direction: 'right'
        })
      }
    }

    setPlacedDominoes([...placedDominoes, domino])
    setOpenEnds(newEnds)
  }

  const handleDominoClick = (domino: Domino) => {
    if (currentPlayer !== 'player') return

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
    if (placedDominoes.length === 0) return

    if (playerHand.length === 0) {
      setMessage('You won!')
    } else if (computerHand.length === 0) {
      setMessage('Computer won!')
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
        <div className="text-white font-bold">SIMPLE DOMINO GAME (FIXED)</div>
        <div className="text-white">{message}</div>
        <button
          onClick={onBackToHome}
          className="bg-red-500 text-white px-3 py-1 rounded"
        >
          Exit
        </button>
      </div>

      <div className="flex-1 relative overflow-auto">
        <div className="relative" style={{ width: '1200px', height: '600px', margin: '0 auto' }}>
          {/* Placed dominoes - render from CENTER position */}
          {placedDominoes.map(domino => (
            <div
              key={domino.id}
              className="absolute"
              style={{
                left: domino.x - DOMINO_WIDTH / 2,
                top: domino.y - DOMINO_HEIGHT / 2,
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
          ))}

          {/* Debug: Show open ends */}
          {openEnds.map((end, i) => (
            <div
              key={i}
              className="absolute w-4 h-4 bg-red-500 rounded-full"
              style={{
                left: end.x - 8,
                top: end.y - 8
              }}
              title={`Value: ${end.value}, Dir: ${end.direction}`}
            />
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

export default SimpleDominoGameFixed