'use client'

import React, { useState, useEffect } from 'react'
import DominoComponent from './Domino'

interface Domino {
  id: string
  left: number
  right: number
  isDouble: boolean
  isFlipped?: boolean
}

interface PlacedDomino {
  domino: Domino
  x: number
  y: number
  rotation: number
}

interface CleanDominoGameProps {
  onGameEnd: (winner: 'player' | 'computer') => void
  onBackToHome: () => void
}

const CleanDominoGame: React.FC<CleanDominoGameProps> = ({ onGameEnd, onBackToHome }) => {
  const [board, setBoard] = useState<PlacedDomino[]>([])
  const [leftEnd, setLeftEnd] = useState<number>(0)
  const [rightEnd, setRightEnd] = useState<number>(0)
  const [playerHand, setPlayerHand] = useState<Domino[]>([])
  const [computerHand, setComputerHand] = useState<Domino[]>([])
  const [boneyard, setBoneyard] = useState<Domino[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<'player' | 'computer'>('player')
  const [message, setMessage] = useState('Starting game...')

  // Constants for domino dimensions and spacing
  const DOMINO_WIDTH = 80
  const DOMINO_HEIGHT = 160
  const GAP = 5 // Small gap between dominoes

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
      startDomino = playerTiles[0]
      starter = 'player'
    }

    // Place first domino in center
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
    } else {
      setPlayerHand(playerTiles)
      setComputerHand(computerTiles.filter(d => d.id !== startDomino.id))
    }

    setBoneyard(boneyardTiles)
    setCurrentPlayer(starter === 'player' ? 'computer' : 'player')
    setMessage(starter === 'player' ? 'Computer\'s turn' : 'Your turn')
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
    // Determine which end of the new domino connects and which becomes the new open end
    let placedDomino = { ...domino }
    let needsFlip = false

    if (side === 'left') {
      // Placing on the left - need to match leftEnd
      if (domino.right === leftEnd) {
        // Right matches - domino stays as is, left becomes new end
        needsFlip = false
        setLeftEnd(domino.left)
      } else if (domino.left === leftEnd) {
        // Left matches - flip the domino so right connects
        needsFlip = true
        setLeftEnd(domino.right)
      }
    } else {
      // Placing on the right - need to match rightEnd
      if (domino.left === rightEnd) {
        // Left matches - domino stays as is, right becomes new end
        needsFlip = false
        setRightEnd(domino.right)
      } else if (domino.right === rightEnd) {
        // Right matches - flip the domino so left connects
        needsFlip = true
        setRightEnd(domino.left)
      }
    }

    // Calculate position based on last domino on that side
    let x = 0
    let y = 300

    if (board.length === 0) {
      x = 600
    } else if (side === 'left') {
      const leftmost = board.reduce((min, p) => p.x < min.x ? p : min)
      // Calculate spacing based on both dominoes' orientations
      const prevIsDouble = leftmost.domino.isDouble
      const currIsDouble = domino.isDouble

      let spacing = GAP
      if (!prevIsDouble) spacing += DOMINO_HEIGHT / 2  // Half width of horizontal domino
      if (!currIsDouble) spacing += DOMINO_HEIGHT / 2  // Half width of new horizontal domino
      if (prevIsDouble) spacing += DOMINO_WIDTH / 2   // Half width of vertical double
      if (currIsDouble) spacing += DOMINO_WIDTH / 2   // Half width of new vertical double

      x = leftmost.x - spacing
    } else {
      const rightmost = board.reduce((max, p) => p.x > max.x ? p : max)
      // Calculate spacing based on both dominoes' orientations
      const prevIsDouble = rightmost.domino.isDouble
      const currIsDouble = domino.isDouble

      let spacing = GAP
      if (!prevIsDouble) spacing += DOMINO_HEIGHT / 2  // Half width of horizontal domino
      if (!currIsDouble) spacing += DOMINO_HEIGHT / 2  // Half width of new horizontal domino
      if (prevIsDouble) spacing += DOMINO_WIDTH / 2   // Half width of vertical double
      if (currIsDouble) spacing += DOMINO_WIDTH / 2   // Half width of new vertical double

      x = rightmost.x + spacing
    }

    // Add flip info to the placed domino
    placedDomino.isFlipped = needsFlip

    const newPlaced: PlacedDomino = {
      domino: placedDomino,
      x: x,
      y: y,
      rotation: domino.isDouble ? 0 : 90
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

    // If can play on both sides, prefer right for simplicity
    const side = playable === 'both' ? 'right' : playable
    playDomino(domino, side as 'left' | 'right')

    setPlayerHand(playerHand.filter(d => d.id !== domino.id))

    if (playerHand.length === 1) {
      setMessage('You won!')
      setTimeout(() => onGameEnd('player'), 1500)
      return
    }

    setCurrentPlayer('computer')
    setMessage('Computer\'s turn')
  }

  const handleDraw = () => {
    if (currentPlayer !== 'player' || boneyard.length === 0) return

    const canPlayAny = playerHand.some(d => canPlay(d) !== null)
    if (canPlayAny) {
      setMessage('You can still play a domino!')
      return
    }

    const drawn = boneyard[0]
    setPlayerHand([...playerHand, drawn])
    setBoneyard(boneyard.slice(1))

    // Check if drawn domino can be played
    if (canPlay(drawn)) {
      setMessage(`Drew ${drawn.left}-${drawn.right}. You can play it!`)
    } else {
      setMessage(`Drew ${drawn.left}-${drawn.right}. Computer's turn`)
      setCurrentPlayer('computer')
    }
  }

  // Computer AI
  useEffect(() => {
    if (currentPlayer !== 'computer') return

    const timer = setTimeout(() => {
      // Try to play a domino
      for (const domino of computerHand) {
        const playable = canPlay(domino)
        if (playable) {
          const side = playable === 'both' ? 'right' : playable
          playDomino(domino, side as 'left' | 'right')
          setComputerHand(computerHand.filter(d => d.id !== domino.id))

          if (computerHand.length === 1) {
            setMessage('Computer won!')
            setTimeout(() => onGameEnd('computer'), 1500)
            return
          }

          setCurrentPlayer('player')
          setMessage('Your turn')
          return
        }
      }

      // Can't play, try to draw
      if (boneyard.length > 0) {
        const drawn = boneyard[0]
        const newHand = [...computerHand, drawn]
        setComputerHand(newHand)
        setBoneyard(boneyard.slice(1))

        // Check if drawn can be played
        if (canPlay(drawn)) {
          const side = canPlay(drawn) === 'both' ? 'right' : canPlay(drawn)
          playDomino(drawn, side as 'left' | 'right')
          setComputerHand(computerHand) // Don't add since we played it
          setMessage('Computer drew and played')
        } else {
          setMessage('Computer drew a tile')
        }
      }

      setCurrentPlayer('player')
      setMessage('Your turn')
    }, 1500)

    return () => clearTimeout(timer)
  }, [currentPlayer, computerHand, leftEnd, rightEnd, boneyard])

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-green-800 to-green-900 flex flex-col">
      {/* Header */}
      <div className="bg-black/40 p-3 flex justify-between items-center text-white">
        <div className="font-bold text-xl">CLEAN DOMINO GAME</div>
        <div className="flex gap-4 items-center">
          <div>Left: {leftEnd} | Right: {rightEnd}</div>
          <div className="font-semibold">{message}</div>
        </div>
        <button
          onClick={onBackToHome}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
        >
          Exit
        </button>
      </div>

      {/* Game Board */}
      <div className="flex-1 overflow-auto">
        <div className="relative min-w-full min-h-full">
          <div style={{ width: '2000px', height: '600px', position: 'relative' }}>
            {board.map((placed, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `${placed.x}px`,
                  top: `${placed.y}px`,
                  transform: `translate(-50%, -50%) rotate(${placed.rotation}deg)`
                }}
              >
                <DominoComponent domino={placed.domino} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Player Controls */}
      <div className="bg-black/40 p-4">
        <div className="flex items-center justify-center gap-3 mb-3">
          <button
            onClick={handleDraw}
            className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 disabled:opacity-50 text-black font-bold px-6 py-3 rounded"
            disabled={boneyard.length === 0 || currentPlayer !== 'player'}
          >
            DRAW ({boneyard.length})
          </button>

          <div className="text-white font-semibold">
            Your tiles: {playerHand.length} | Computer: {computerHand.length}
          </div>
        </div>

        {/* Player Hand */}
        <div className="flex justify-center gap-2 flex-wrap">
          {playerHand.map(domino => {
            const playable = canPlay(domino)
            return (
              <div
                key={domino.id}
                onClick={() => handleDominoClick(domino)}
                className={`cursor-pointer transition-transform ${
                  playable && currentPlayer === 'player'
                    ? 'hover:scale-110 hover:-translate-y-2'
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <DominoComponent domino={domino} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default CleanDominoGame