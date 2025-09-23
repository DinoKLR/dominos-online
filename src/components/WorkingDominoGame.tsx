'use client'

import React, { useState, useEffect } from 'react'
import DominoComponent from './Domino'

// WORKING DOMINO GAME - Uses the good-looking original dominoes
// Places them horizontally with NO GAPS

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
  rotation: number // 0 for horizontal, 90 for vertical (doubles)
  flipped: boolean
}

interface WorkingDominoGameProps {
  onGameEnd: (winner: 'player' | 'computer') => void
  onBackToHome: () => void
}

const WorkingDominoGame: React.FC<WorkingDominoGameProps> = ({ onGameEnd, onBackToHome }) => {
  const [board, setBoard] = useState<PlacedDomino[]>([])
  const [leftEnd, setLeftEnd] = useState<number>(0)
  const [rightEnd, setRightEnd] = useState<number>(0)
  const [playerHand, setPlayerHand] = useState<Domino[]>([])
  const [computerHand, setComputerHand] = useState<Domino[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<'player' | 'computer'>('player')
  const [message, setMessage] = useState('Starting game...')
  const [boneyard, setBoneyard] = useState<Domino[]>([])

  // Domino dimensions when horizontal
  const DOMINO_WIDTH = 80  // Original domino is 80px wide
  const DOMINO_HEIGHT = 160 // Original domino is 160px tall

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
    const firstPlaced: PlacedDomino = {
      domino: startDomino,
      x: 600,
      y: 300,
      rotation: startDomino.isDouble ? 0 : 90, // Doubles stay vertical, others rotate to horizontal
      flipped: false
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
    const newPlaced: PlacedDomino = {
      domino: domino,
      x: 0,
      y: 300,
      rotation: domino.isDouble ? 0 : 90, // Doubles vertical, others horizontal
      flipped: false
    }

    if (side === 'left') {
      const leftmost = board.reduce((min, p) => p.x < min.x ? p : min)
      // If leftmost is vertical (double), it's 80px wide, add 5px gap to prevent overlap
      // If horizontal (regular), it's 160px wide when rotated
      const offset = leftmost.rotation === 0 ? 85 : 160
      newPlaced.x = leftmost.x - offset

      // When rotated 90 degrees clockwise:
      // Original TOP (left pip) becomes RIGHT side
      // Original BOTTOM (right pip) becomes LEFT side
      // So to match leftEnd, we need the matching pip on the RIGHT of horizontal domino
      if (domino.right === leftEnd) {
        // domino.right matches leftEnd, when rotated it's on LEFT, so flip it
        newPlaced.flipped = true
        setLeftEnd(domino.left)
      } else if (domino.left === leftEnd) {
        // domino.left matches leftEnd, when rotated it's on RIGHT, perfect
        newPlaced.flipped = false
        setLeftEnd(domino.right)
      }
    } else {
      const rightmost = board.reduce((max, p) => p.x > max.x ? p : max)
      // If rightmost is vertical (double), it's 80px wide, add 5px gap to prevent overlap
      // If horizontal (regular), it's 160px wide when rotated
      const offset = rightmost.rotation === 0 ? 85 : 160
      newPlaced.x = rightmost.x + offset

      // When rotated 90 degrees clockwise:
      // Original TOP (left pip) becomes RIGHT side
      // Original BOTTOM (right pip) becomes LEFT side
      // So to match rightEnd, we need the matching pip on the LEFT of horizontal domino
      if (domino.left === rightEnd) {
        // domino.left matches rightEnd, when rotated it's on RIGHT, so flip it
        newPlaced.flipped = true
        setRightEnd(domino.right)
      } else if (domino.right === rightEnd) {
        // domino.right matches rightEnd, when rotated it's on LEFT, perfect
        newPlaced.flipped = false
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

      setCurrentPlayer('player')
      setMessage('Computer passed - your turn')
    }, 1000)

    return () => clearTimeout(timer)
  }, [currentPlayer, computerHand, leftEnd, rightEnd])

  return (
    <div className="fixed inset-0 bg-green-800 flex flex-col">
      <div className="bg-black/30 p-2 flex justify-between items-center">
        <div className="text-white font-bold">WORKING DOMINO</div>
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
            // When flipped, swap the pips
            const displayDomino = placed.flipped
              ? { ...placed.domino, left: placed.domino.right, right: placed.domino.left, isFlipped: true }
              : { ...placed.domino, isFlipped: false }

            return (
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
                <DominoComponent domino={displayDomino} />
              </div>
            )
          })}
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

export default WorkingDominoGame