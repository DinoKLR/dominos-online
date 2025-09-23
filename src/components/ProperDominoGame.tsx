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
  isFirstSpinner?: boolean
  spinnerSide?: 'left' | 'right' | 'up' | 'down'
}

interface ProperDominoGameProps {
  onGameEnd: (winner: 'player' | 'computer') => void
  onBackToHome: () => void
}

const ProperDominoGame: React.FC<ProperDominoGameProps> = ({ onGameEnd, onBackToHome }) => {
  const [board, setBoard] = useState<PlacedDomino[]>([])
  const [leftEnd, setLeftEnd] = useState<number>(0)
  const [rightEnd, setRightEnd] = useState<number>(0)
  const [playerHand, setPlayerHand] = useState<Domino[]>([])
  const [computerHand, setComputerHand] = useState<Domino[]>([])
  const [boneyard, setBoneyard] = useState<Domino[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<'player' | 'computer'>('player')
  const [message, setMessage] = useState('Starting game...')
  const [selectedDomino, setSelectedDomino] = useState<Domino | null>(null)
  const [showSideChoice, setShowSideChoice] = useState(false)
  const [firstSpinner, setFirstSpinner] = useState<PlacedDomino | null>(null)
  const [spinnerSides, setSpinnerSides] = useState<Set<string>>(new Set())

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
      const playerDouble = playerTiles.find(d => d.isDouble && d.left === i)
      if (playerDouble) {
        startDomino = playerDouble
        starter = 'player'
        break
      }
      const compDouble = computerTiles.find(d => d.isDouble && d.left === i)
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

    // If the starting domino is a double, set it as the first spinner
    if (startDomino.isDouble) {
      console.log('Starting domino is first spinner:', startDomino)
      setFirstSpinner(firstPlaced)
      setSpinnerSides(new Set())
    }

    if (starter === 'player') {
      setPlayerHand(playerTiles.filter(d => d.id !== startDomino.id))
      setComputerHand(computerTiles)
    } else {
      setPlayerHand(playerTiles)
      setComputerHand(computerTiles.filter(d => d.id !== startDomino.id))
    }

    setBoneyard(boneyardTiles)
    setCurrentPlayer(starter === 'player' ? 'computer' : 'player')
    setMessage(starter === 'player' ? "Computer's turn" : 'Your turn')
  }

  const canPlay = (domino: Domino): 'left' | 'right' | 'both' | 'spinner' | null => {
    const matchesLeft = domino.left === leftEnd || domino.right === leftEnd
    const matchesRight = domino.left === rightEnd || domino.right === rightEnd

    // Check if we can play on the spinner (first double)
    if (firstSpinner && spinnerSides.size >= 2 && spinnerSides.size < 4) {
      const spinnerValue = firstSpinner.domino.left // doubles have same value on both sides
      const matchesSpinner = domino.left === spinnerValue || domino.right === spinnerValue

      if (matchesSpinner) {
        // If it ONLY matches spinner, not the ends
        if (!matchesLeft && !matchesRight) {
          return 'spinner'
        }
        // If it matches both spinner and an end
        if (matchesLeft || matchesRight) {
          return 'spinner'
        }
      }
    }

    if (matchesLeft && matchesRight) return 'both'
    if (matchesLeft) return 'left'
    if (matchesRight) return 'right'
    return null
  }

  const playDomino = (domino: Domino, side: 'left' | 'right' | 'up' | 'down') => {
    let placedDomino = { ...domino }

    // Debug logging
    console.log(`Playing ${domino.left}-${domino.right} on ${side} side`)
    console.log(`Current ends: Left=${leftEnd}, Right=${rightEnd}`)

    // Handle spinner placement (up/down)
    if ((side === 'up' || side === 'down') && firstSpinner) {
      const spinnerValue = firstSpinner.domino.left
      // Orient domino correctly for vertical placement
      // For UP: matching value should be at bottom (right in domino terms)
      // For DOWN: matching value should be at top (left in domino terms)
      if (side === 'up') {
        // Playing above - need matching value at bottom
        if (domino.right === spinnerValue) {
          placedDomino.isFlipped = false // Right is already at bottom
        } else {
          placedDomino.isFlipped = true // Flip to put left at bottom
        }
      } else {
        // Playing below - need matching value at top
        if (domino.left === spinnerValue) {
          placedDomino.isFlipped = false // Left is already at top
        } else {
          placedDomino.isFlipped = true // Flip to put right at top
        }
      }

      // Track which side of spinner was played
      setSpinnerSides(new Set([...spinnerSides, side]))

      // Calculate position with better spacing
      let x = firstSpinner.x
      let y = firstSpinner.y

      if (side === 'up') {
        y = firstSpinner.y - 165 // Even more space above
      } else {
        y = firstSpinner.y + 165 // Even more space below
      }

      const newPlaced: PlacedDomino = {
        domino: placedDomino,
        x: x,
        y: y,
        rotation: 0, // Vertical orientation for up/down
        spinnerSide: side
      }

      setBoard([...board, newPlaced])
      return
    }

    // Original left/right logic
    if (side === 'left') {
      // Placing on left - the RIGHT end of new domino should match leftEnd
      if (domino.right === leftEnd) {
        // Right matches - FLIP IT (opposite of what I had)
        placedDomino.isFlipped = true
        setLeftEnd(domino.left)
        console.log(`LEFT PLACEMENT FLIPPED: ${domino.left}-${domino.right} right(${domino.right}) matches leftEnd(${leftEnd})`)
      } else if (domino.left === leftEnd) {
        // Left matches - DON'T FLIP (opposite of what I had)
        placedDomino.isFlipped = false
        setLeftEnd(domino.right)
        console.log(`LEFT PLACEMENT: ${domino.left}-${domino.right} left(${domino.left}) matches leftEnd(${leftEnd})`)
      }
    } else {
      // Placing on right - the LEFT end of new domino should match rightEnd
      if (domino.left === rightEnd) {
        // Left matches - FLIP IT (opposite of what I had)
        placedDomino.isFlipped = true
        setRightEnd(domino.right)
        console.log(`RIGHT PLACEMENT FLIPPED: ${domino.left}-${domino.right} left(${domino.left}) matches rightEnd(${rightEnd})`)
      } else if (domino.right === rightEnd) {
        // Right matches - DON'T FLIP (opposite of what I had)
        placedDomino.isFlipped = false
        setRightEnd(domino.left)
        console.log(`RIGHT PLACEMENT: ${domino.left}-${domino.right} right(${domino.right}) matches rightEnd(${rightEnd})`)
      }
    }

    // Calculate position - MUCH tighter, almost overlapping
    let x = 600
    let y = 300

    if (board.length > 0) {
      if (side === 'left') {
        const leftmost = board.reduce((min, p) => p.x < min.x ? p : min)
        // Super tight - negative spacing for slight overlap
        if (leftmost.domino.isDouble && !placedDomino.isDouble) {
          // Double to regular: 40 + 80 = 120
          x = leftmost.x - 120
        } else if (!leftmost.domino.isDouble && placedDomino.isDouble) {
          // Regular to double: 80 + 40 = 120
          x = leftmost.x - 120
        } else if (!leftmost.domino.isDouble && !placedDomino.isDouble) {
          // Regular to regular: 80 + 80 = 160
          x = leftmost.x - 155  // Slight overlap
        } else {
          // Double to double: 40 + 40 = 80
          x = leftmost.x - 80
        }
      } else {
        const rightmost = board.reduce((max, p) => p.x > max.x ? p : max)
        // Super tight - negative spacing for slight overlap
        if (rightmost.domino.isDouble && !placedDomino.isDouble) {
          // Double to regular: 40 + 80 = 120
          x = rightmost.x + 120
        } else if (!rightmost.domino.isDouble && placedDomino.isDouble) {
          // Regular to double: 80 + 40 = 120
          x = rightmost.x + 120
        } else if (!rightmost.domino.isDouble && !placedDomino.isDouble) {
          // Regular to regular: 80 + 80 = 160
          x = rightmost.x + 155  // Slight overlap
        } else {
          // Double to double: 40 + 40 = 80
          x = rightmost.x + 80
        }
      }
    }

    const newPlaced: PlacedDomino = {
      domino: placedDomino,
      x: x,
      y: y,
      rotation: placedDomino.isDouble ? 0 : 90,
      spinnerSide: side as 'left' | 'right'
    }

    setBoard([...board, newPlaced])

    // Track the first double as the spinner
    if (!firstSpinner && placedDomino.isDouble) {
      console.log('Setting first spinner:', placedDomino)
      setFirstSpinner(newPlaced)
      // Start with empty sides - will track as dominoes connect to it
      setSpinnerSides(new Set())
    }

    // Check if this domino is connecting directly to the spinner
    if (firstSpinner) {
      // Check if we're placing next to the spinner
      const isNextToSpinner = board.some(p =>
        p === firstSpinner &&
        (placedDomino.left === firstSpinner.domino.left ||
         placedDomino.right === firstSpinner.domino.left)
      )

      if (isNextToSpinner || Math.abs(x - firstSpinner.x) < 200) {
        // This domino is adjacent to spinner
        if (x < firstSpinner.x && !spinnerSides.has('left')) {
          console.log('Domino placed left of spinner')
          setSpinnerSides(new Set([...spinnerSides, 'left']))
        } else if (x > firstSpinner.x && !spinnerSides.has('right')) {
          console.log('Domino placed right of spinner')
          setSpinnerSides(new Set([...spinnerSides, 'right']))
        }
      }
    }
  }

  const handleDominoClick = (domino: Domino) => {
    if (currentPlayer !== 'player') return

    const playable = canPlay(domino)

    // Also check spinner separately
    const canPlayOnSpinner = firstSpinner &&
      spinnerSides.size >= 2 &&
      spinnerSides.size < 4 &&
      (domino.left === firstSpinner.domino.left || domino.right === firstSpinner.domino.left)

    // Debug logging
    if (firstSpinner) {
      console.log('Spinner check:', {
        domino: `${domino.left}-${domino.right}`,
        spinnerValue: firstSpinner.domino.left,
        spinnerSides: Array.from(spinnerSides),
        canPlayOnSpinner
      })
    }

    if (!playable && !canPlayOnSpinner) {
      setMessage("Can't play this domino!")
      return
    }

    // If can play on spinner (up/down available)
    if (canPlayOnSpinner || playable === 'spinner') {
      setSelectedDomino(domino)
      setShowSideChoice(true)
      setMessage(`Choose where to play ${domino.left}-${domino.right}`)
      return
    }

    // If can play on both regular sides
    if (playable === 'both') {
      setSelectedDomino(domino)
      setShowSideChoice(true)
      setMessage(`Choose where to play ${domino.left}-${domino.right}`)
      return
    }

    const side = playable === 'both' ? 'right' : playable
    playDomino(domino, side as 'left' | 'right')

    setPlayerHand(playerHand.filter(d => d.id !== domino.id))

    if (playerHand.length === 1) {
      setMessage('You won!')
      setTimeout(() => onGameEnd('player'), 1500)
      return
    }

    setCurrentPlayer('computer')
    setMessage("Computer's turn")
  }

  const handleSideChoice = (side: 'left' | 'right' | 'up' | 'down') => {
    if (!selectedDomino) return

    playDomino(selectedDomino, side)
    setPlayerHand(playerHand.filter(d => d.id !== selectedDomino.id))

    setSelectedDomino(null)
    setShowSideChoice(false)

    if (playerHand.length === 1) {
      setMessage('You won!')
      setTimeout(() => onGameEnd('player'), 1500)
      return
    }

    setCurrentPlayer('computer')
    setMessage("Computer's turn")
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

        if (canPlay(drawn)) {
          const side = canPlay(drawn) === 'both' ? 'right' : canPlay(drawn)
          playDomino(drawn, side as 'left' | 'right')
          setComputerHand(computerHand)
          setMessage('Computer drew and played')
        } else {
          setMessage('Computer drew a tile')
        }
      } else {
        setMessage('Computer passes - no valid moves')
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
        <div className="font-bold text-xl">PROPER DOMINO GAME</div>
        <div className="flex gap-4 items-center">
          <div className="bg-black/30 px-3 py-1 rounded">
            Left End: <span className="font-bold text-yellow-400">{leftEnd}</span>
          </div>
          <div className="text-lg font-semibold">{message}</div>
          <div className="bg-black/30 px-3 py-1 rounded">
            Right End: <span className="font-bold text-yellow-400">{rightEnd}</span>
          </div>
        </div>
        <button
          onClick={onBackToHome}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition-colors"
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
        <div className="flex items-center justify-center gap-4 mb-3">
          <button
            onClick={handleDraw}
            className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 disabled:opacity-50 text-black font-bold px-6 py-3 rounded transition-colors"
            disabled={boneyard.length === 0 || currentPlayer !== 'player'}
          >
            DRAW ({boneyard.length})
          </button>

          {/* Side choice buttons when needed */}
          {showSideChoice && selectedDomino && (
            <div className="flex gap-2 flex-wrap">
              {/* Show left/right if they're valid plays */}
              {(selectedDomino.left === leftEnd || selectedDomino.right === leftEnd) && (
                <button
                  onClick={() => handleSideChoice('left')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-bold"
                >
                  Play LEFT (← {leftEnd})
                </button>
              )}
              {(selectedDomino.left === rightEnd || selectedDomino.right === rightEnd) && (
                <button
                  onClick={() => handleSideChoice('right')}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-bold"
                >
                  Play RIGHT ({rightEnd} →)
                </button>
              )}
              {/* Show spinner options if available */}
              {firstSpinner && spinnerSides.size >= 2 && !spinnerSides.has('up') && (
                selectedDomino.left === firstSpinner.domino.left ||
                selectedDomino.right === firstSpinner.domino.left
              ) && (
                <button
                  onClick={() => handleSideChoice('up')}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded font-bold"
                >
                  Play UP (↑ {firstSpinner.domino.left})
                </button>
              )}
              {firstSpinner && spinnerSides.size >= 2 && !spinnerSides.has('down') && (
                selectedDomino.left === firstSpinner.domino.left ||
                selectedDomino.right === firstSpinner.domino.left
              ) && (
                <button
                  onClick={() => handleSideChoice('down')}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded font-bold"
                >
                  Play DOWN (↓ {firstSpinner.domino.left})
                </button>
              )}
            </div>
          )}

          <div className="text-white font-semibold bg-black/30 px-4 py-2 rounded">
            Your tiles: {playerHand.length} | Computer: {computerHand.length}
          </div>
        </div>

        {/* Player Hand */}
        <div className="flex justify-center gap-2 flex-wrap">
          {playerHand.map(domino => {
            const playable = canPlay(domino)
            const canPlayOnSpinner = firstSpinner &&
              spinnerSides.size >= 2 &&
              spinnerSides.size < 4 &&
              (domino.left === firstSpinner.domino.left || domino.right === firstSpinner.domino.left)

            const isPlayable = playable || canPlayOnSpinner

            return (
              <div
                key={domino.id}
                onClick={() => handleDominoClick(domino)}
                className={`cursor-pointer transition-all ${
                  isPlayable && currentPlayer === 'player'
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

export default ProperDominoGame