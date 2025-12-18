'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
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

interface DominoGameMobileProps {
  onGameEnd: (winner: 'player' | 'computer') => void
  onBackToHome: () => void
}

const DominoGameMobile: React.FC<DominoGameMobileProps> = ({ onGameEnd, onBackToHome }) => {
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
  const [playerScore, setPlayerScore] = useState(0)
  const [computerScore, setComputerScore] = useState(0)
  const [viewportSize, setViewportSize] = useState({ width: 800, height: 400 })
  const boardRef = useRef<HTMLDivElement>(null)

  // Calculate board bounds and scale factor for dynamic scaling
  const boardTransform = useMemo(() => {
    if (board.length === 0) {
      return { scale: 1, translateX: 0, translateY: 0 }
    }

    const DOMINO_WIDTH = 80
    const DOMINO_HEIGHT = 160
    const PADDING = 60

    // Calculate bounds of all dominoes
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity

    board.forEach(placed => {
      const isHorizontal = placed.rotation === 90
      const halfWidth = isHorizontal ? DOMINO_HEIGHT / 2 : DOMINO_WIDTH / 2
      const halfHeight = isHorizontal ? DOMINO_WIDTH / 2 : DOMINO_HEIGHT / 2

      minX = Math.min(minX, placed.x - halfWidth)
      maxX = Math.max(maxX, placed.x + halfWidth)
      minY = Math.min(minY, placed.y - halfHeight)
      maxY = Math.max(maxY, placed.y + halfHeight)
    })

    const contentWidth = maxX - minX + PADDING * 2
    const contentHeight = maxY - minY + PADDING * 2
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2

    const scaleX = viewportSize.width / contentWidth
    const scaleY = viewportSize.height / contentHeight
    const scale = Math.min(scaleX, scaleY, 1.0)

    return { scale, centerX, centerY, contentWidth, contentHeight }
  }, [board, viewportSize])

  // Track viewport size
  useEffect(() => {
    const updateViewportSize = () => {
      if (boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect()
        setViewportSize({ width: rect.width, height: rect.height })
      }
    }

    updateViewportSize()
    window.addEventListener('resize', updateViewportSize)
    return () => window.removeEventListener('resize', updateViewportSize)
  }, [])

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

  // Scroll to center board on mount
  useEffect(() => {
    if (boardRef.current && board.length > 0) {
      // No scroll needed - domino at x:600 is visible without scrolling
    }
  }, [board.length])

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

    // Place first domino - will be centered via scroll
    const firstPlaced: PlacedDomino = {
      domino: startDomino,
      x: 848,
      y: 360,
      rotation: startDomino.isDouble ? 0 : 90
    }

    setBoard([firstPlaced])
    setLeftEnd(startDomino.left)
    setRightEnd(startDomino.right)

    // If the starting domino is a double, set it as the first spinner
    if (startDomino.isDouble) {
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
      const spinnerValue = firstSpinner.domino.left
      const matchesSpinner = domino.left === spinnerValue || domino.right === spinnerValue

      if (matchesSpinner) {
        if (!matchesLeft && !matchesRight) {
          return 'spinner'
        }
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

    // Handle spinner placement (up/down)
    if ((side === 'up' || side === 'down') && firstSpinner) {
      const spinnerValue = firstSpinner.domino.left
      if (side === 'up') {
        if (domino.right === spinnerValue) {
          placedDomino.isFlipped = false
        } else {
          placedDomino.isFlipped = true
        }
      } else {
        if (domino.left === spinnerValue) {
          placedDomino.isFlipped = false
        } else {
          placedDomino.isFlipped = true
        }
      }

      setSpinnerSides(new Set([...spinnerSides, side]))

      let x = firstSpinner.x
      let y = firstSpinner.y

      if (side === 'up') {
        y = firstSpinner.y - 165
      } else {
        y = firstSpinner.y + 165
      }

      const newPlaced: PlacedDomino = {
        domino: placedDomino,
        x: x,
        y: y,
        rotation: 0,
        spinnerSide: side
      }

      setBoard([...board, newPlaced])
      return
    }

    // Flip logic - flip so matching end touches the chain
    if (side === 'left') {
      if (domino.right === leftEnd) {
        placedDomino.isFlipped = true  // Flip so right side faces left (touches chain)
        setLeftEnd(domino.left)
      } else if (domino.left === leftEnd) {
        placedDomino.isFlipped = false  // Left side already faces left
        setLeftEnd(domino.right)
      }
    } else {
      if (domino.left === rightEnd) {
        placedDomino.isFlipped = true  // Flip so left side faces right (touches chain)
        setRightEnd(domino.right)
      } else if (domino.right === rightEnd) {
        placedDomino.isFlipped = false  // Right side already faces right
        setRightEnd(domino.left)
      }
    }

    // Calculate position
    let x = 848
    let y = 360

    if (board.length > 0) {
      if (side === 'left') {
        const leftmost = board.reduce((min, p) => p.x < min.x ? p : min)
        y = leftmost.y // Inherit y from reference domino
        if (leftmost.domino.isDouble && !placedDomino.isDouble) {
          x = leftmost.x - 120
        } else if (!leftmost.domino.isDouble && placedDomino.isDouble) {
          x = leftmost.x - 120
        } else if (!leftmost.domino.isDouble && !placedDomino.isDouble) {
          x = leftmost.x - 155
        } else {
          x = leftmost.x - 80
        }
      } else {
        const rightmost = board.reduce((max, p) => p.x > max.x ? p : max)
        y = rightmost.y // Inherit y from reference domino
        if (rightmost.domino.isDouble && !placedDomino.isDouble) {
          x = rightmost.x + 120
        } else if (!rightmost.domino.isDouble && placedDomino.isDouble) {
          x = rightmost.x + 120
        } else if (!rightmost.domino.isDouble && !placedDomino.isDouble) {
          x = rightmost.x + 155
        } else {
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
      setFirstSpinner(newPlaced)
      setSpinnerSides(new Set())
    }

    // Check if this domino is connecting directly to the spinner
    if (firstSpinner) {
      if (Math.abs(x - firstSpinner.x) < 200) {
        if (x < firstSpinner.x && !spinnerSides.has('left')) {
          setSpinnerSides(new Set([...spinnerSides, 'left']))
        } else if (x > firstSpinner.x && !spinnerSides.has('right')) {
          setSpinnerSides(new Set([...spinnerSides, 'right']))
        }
      }
    }
  }

  const handleDominoClick = (domino: Domino) => {
    if (currentPlayer !== 'player') return

    const playable = canPlay(domino)

    const canPlayOnSpinner = firstSpinner &&
      spinnerSides.size >= 2 &&
      spinnerSides.size < 4 &&
      (domino.left === firstSpinner.domino.left || domino.right === firstSpinner.domino.left)

    if (!playable && !canPlayOnSpinner) {
      setMessage("Can't play this domino!")
      return
    }

    if (canPlayOnSpinner || playable === 'spinner') {
      setSelectedDomino(domino)
      setShowSideChoice(true)
      setMessage(`Choose where to play ${domino.left}-${domino.right}`)
      return
    }

    if (playable === 'both') {
      setSelectedDomino(domino)
      setShowSideChoice(true)
      setMessage(`Choose where to play ${domino.left}-${domino.right}`)
      return
    }

    playDomino(domino, playable as 'left' | 'right')

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
    <div className="fixed inset-0" style={{ backgroundColor: '#2a802a' }}>
      {/* Casino felt texture and lighting */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, transparent 60%, rgba(0,0,0,0.2) 100%)'
          }}
        />
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `
              radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0),
              radial-gradient(circle at 3px 3px, rgba(0,0,0,0.1) 1px, transparent 0)
            `,
            backgroundSize: '4px 4px, 6px 6px'
          }}
        />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.05) 50%, transparent 60%),
              linear-gradient(-45deg, transparent 40%, rgba(0,0,0,0.05) 50%, transparent 60%)
            `,
            backgroundSize: '20px 20px, 25px 25px'
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.05) 0%, transparent 40%)'
          }}
        />
      </div>

      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 bg-black/30 backdrop-blur-sm px-4 py-1 z-20" style={{ height: '3rem' }}>
        {currentPlayer === 'computer' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/20">
            <motion.div
              className="h-full bg-yellow-400"
              key={`computer-timer-${currentPlayer}`}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 15, ease: 'linear' }}
            />
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center overflow-hidden" style={{ fontSize: '2.1rem', transform: 'translateY(-2px)' }}>
              <span style={{ transform: 'translateY(1px)' }}>🥷</span>
            </div>
            <div className="text-left">
              <div className="text-sm text-white font-bold">YOU</div>
              <div className="text-white text-lg font-bold -mt-1">{playerScore}</div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-lg text-white font-bold">FIVES to 100</div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm text-white font-bold">CPU</div>
              <div className="text-white text-lg font-bold -mt-1">{computerScore}</div>
            </div>
            <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center overflow-hidden" style={{ fontSize: '2.1rem', transform: 'translateY(-2px)' }}>
              <span style={{ transform: 'translateY(1px)' }}>👨‍⚕️</span>
            </div>
          </div>
        </div>
      </div>

      {/* NINJA BONES Watermark - centered in game area */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
        style={{ paddingTop: '3rem', paddingBottom: '11rem' }}
      >
        <div
          className="text-center"
          style={{
            fontFamily: '"Arial", "Helvetica", sans-serif',
            fontWeight: '600',
            fontSize: '2.2rem',
            color: 'rgba(255, 255, 255, 0.15)',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            lineHeight: '1.1'
          }}
        >
          <div>NINJA</div>
          <div>BONES</div>
        </div>
      </div>

      {/* Game Board */}
      <div className="absolute inset-0" style={{ paddingTop: '3rem', paddingBottom: '11rem' }}>
        <div ref={boardRef} className="w-full h-full relative overflow-hidden flex items-center justify-center">
          {/* Board container - dynamically scaled */}
          <div
            className="relative"
            style={{
              transform: `scale(${boardTransform.scale})`,
              transformOrigin: 'center center',
              transition: 'transform 0.3s ease-out'
            }}
          >
            {/* Inner container for absolute positioning */}
            <div
              className="relative"
              style={{
                width: `${boardTransform.contentWidth || 200}px`,
                height: `${boardTransform.contentHeight || 200}px`,
                left: board.length > 0 ? `${-(boardTransform.centerX || 0) + (boardTransform.contentWidth || 200) / 2}px` : '0px',
                top: board.length > 0 ? `${-(boardTransform.centerY || 0) + (boardTransform.contentHeight || 200) / 2}px` : '0px'
              }}
            >
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

          {/* End values display */}
          {board.length > 0 && (
            <>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-green-500/90 text-black px-3 py-2 rounded-lg font-bold shadow-lg z-20">
                {leftEnd}
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-cyan-500/90 text-black px-3 py-2 rounded-lg font-bold shadow-lg z-20">
                {rightEnd}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Side Choice Modal */}
      {showSideChoice && selectedDomino && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
          <div className="bg-slate-800 p-6 rounded-xl shadow-xl">
            <div className="text-white text-lg mb-4 text-center">Where to play {selectedDomino.left}-{selectedDomino.right}?</div>
            <div className="flex gap-3 flex-wrap justify-center">
              {(selectedDomino.left === leftEnd || selectedDomino.right === leftEnd) && (
                <button
                  onClick={() => handleSideChoice('left')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-bold"
                >
                  LEFT (← {leftEnd})
                </button>
              )}
              {(selectedDomino.left === rightEnd || selectedDomino.right === rightEnd) && (
                <button
                  onClick={() => handleSideChoice('right')}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-bold"
                >
                  RIGHT ({rightEnd} →)
                </button>
              )}
              {firstSpinner && spinnerSides.size >= 2 && !spinnerSides.has('up') &&
                (selectedDomino.left === firstSpinner.domino.left || selectedDomino.right === firstSpinner.domino.left) && (
                <button
                  onClick={() => handleSideChoice('up')}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded font-bold"
                >
                  UP (↑ {firstSpinner.domino.left})
                </button>
              )}
              {firstSpinner && spinnerSides.size >= 2 && !spinnerSides.has('down') &&
                (selectedDomino.left === firstSpinner.domino.left || selectedDomino.right === firstSpinner.domino.left) && (
                <button
                  onClick={() => handleSideChoice('down')}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded font-bold"
                >
                  DOWN (↓ {firstSpinner.domino.left})
                </button>
              )}
              <button
                onClick={() => { setShowSideChoice(false); setSelectedDomino(null); }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Footer with Player Hand */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm px-4 py-2 z-20">
        {currentPlayer === 'player' && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-black/20">
            <motion.div
              className="h-full bg-yellow-400"
              key={`player-timer-${currentPlayer}`}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 15, ease: 'linear' }}
            />
          </div>
        )}

        {/* Status row */}
        <div className="flex items-center justify-between mb-2">
          <button className="text-xl hover:scale-110 transition-transform">😊</button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDraw}
              className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 disabled:opacity-50 text-black font-bold px-4 py-2 rounded transition-colors"
              disabled={boneyard.length === 0 || currentPlayer !== 'player'}
            >
              DRAW ({boneyard.length})
            </button>
            <div className="text-sm text-white font-bold bg-black/30 px-3 py-1 rounded">
              Your tiles: {playerHand.length} | Computer: {computerHand.length}
            </div>
          </div>

          <button className="text-xl hover:scale-110 transition-transform">💬</button>
        </div>

        {/* Player dominoes */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {playerHand.map(domino => {
            const playable = canPlay(domino)
            const canPlayOnSpinner = firstSpinner &&
              spinnerSides.size >= 2 &&
              spinnerSides.size < 4 &&
              (domino.left === firstSpinner.domino.left || domino.right === firstSpinner.domino.left)

            const isPlayable = playable || canPlayOnSpinner

            return (
              <motion.div
                key={domino.id}
                whileHover={isPlayable && currentPlayer === 'player' ? { y: -8, scale: 1.05 } : {}}
                whileTap={isPlayable && currentPlayer === 'player' ? { scale: 0.95 } : {}}
                onClick={() => handleDominoClick(domino)}
                className={`cursor-pointer transition-all ${
                  isPlayable && currentPlayer === 'player'
                    ? ''
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="scale-75">
                  <DominoComponent domino={domino} />
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Top Computer Hand (Hidden) */}
      <div className="absolute top-10 left-0 right-0 flex justify-center gap-1 z-10 px-4">
        {computerHand.map((_, index) => (
          <motion.div
            key={index}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-6 h-12 bg-gradient-to-br from-gray-800 to-gray-700 rounded border border-gray-600 shadow-lg transform -translate-y-4"
            style={{
              clipPath: 'polygon(0 40%, 100% 40%, 100% 100%, 0 100%)'
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default DominoGameMobile
