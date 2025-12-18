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
  const [upEnd, setUpEnd] = useState<number | null>(null)  // Track the UP chain end
  const [downEnd, setDownEnd] = useState<number | null>(null)  // Track the DOWN chain end
  const [playerScore, setPlayerScore] = useState(0)
  const [computerScore, setComputerScore] = useState(0)
  const [viewportSize, setViewportSize] = useState({ width: 800, height: 400 })
  const boardRef = useRef<HTMLDivElement>(null)

  // Calculate board bounds and scale factor
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
      // Account for rotation - doubles are vertical (80w x 160h), non-doubles are horizontal (160w x 80h)
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

    // Calculate scale to fit viewport (with padding)
    const scaleX = viewportSize.width / contentWidth
    const scaleY = viewportSize.height / contentHeight
    const scale = Math.min(scaleX, scaleY, 1.0) // Never scale up, only down

    return {
      scale,
      centerX,
      centerY,
      contentWidth,
      contentHeight
    }
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

  // Calculate and award score - called directly after a play with new values
  const awardScore = (
    scorer: 'player' | 'computer',
    newBoard: PlacedDomino[],
    newLeftEnd: number,
    newRightEnd: number,
    newUpEnd: number | null,
    newDownEnd: number | null,
    newSpinnerSides: Set<string>,
    spinner: PlacedDomino | null
  ) => {
    // Calculate sum of all open ends
    let sum = 0

    // Find leftmost and rightmost dominoes to check if they're doubles
    const leftmostDomino = newBoard.reduce((min, p) =>
      (p.spinnerSide === 'left' || p.spinnerSide === undefined) && p.x < min.x ? p : min,
      newBoard[0]
    )
    const rightmostDomino = newBoard.reduce((max, p) =>
      (p.spinnerSide === 'right' || p.spinnerSide === undefined) && p.x > max.x ? p : max,
      newBoard[0]
    )

    // Left end - doubles count twice
    if (leftmostDomino.domino.isDouble) {
      sum += newLeftEnd * 2
    } else {
      sum += newLeftEnd
    }

    // Right end - doubles count twice
    if (rightmostDomino.domino.isDouble) {
      sum += newRightEnd * 2
    } else {
      sum += newRightEnd
    }

    // UP chain end
    if (newUpEnd !== null) {
      const upDominoes = newBoard.filter(p => p.spinnerSide === 'up')
      if (upDominoes.length > 0) {
        const topmostDomino = upDominoes.reduce((min, p) => p.y < min.y ? p : min)
        if (topmostDomino.domino.isDouble) {
          sum += newUpEnd * 2
        } else {
          sum += newUpEnd
        }
      }
    }

    // DOWN chain end
    if (newDownEnd !== null) {
      const downDominoes = newBoard.filter(p => p.spinnerSide === 'down')
      if (downDominoes.length > 0) {
        const bottommostDomino = downDominoes.reduce((max, p) => p.y > max.y ? p : max)
        if (bottommostDomino.domino.isDouble) {
          sum += newDownEnd * 2
        } else {
          sum += newDownEnd
        }
      }
    }

    // Score if divisible by 5 and greater than 0
    if (sum > 0 && sum % 5 === 0) {
      if (scorer === 'player') {
        setPlayerScore(prev => prev + sum)
        setMessage(`Your turn +${sum} points!`)
      } else {
        setComputerScore(prev => prev + sum)
      }
      return sum
    }
    return 0
  }

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


  const canPlay = (domino: Domino): 'left' | 'right' | 'both' | 'up' | 'down' | 'spinner' | null => {
    const matchesLeft = domino.left === leftEnd || domino.right === leftEnd
    const matchesRight = domino.left === rightEnd || domino.right === rightEnd

    // Check if we can play on UP or DOWN chains (if they exist)
    const matchesUp = upEnd !== null && (domino.left === upEnd || domino.right === upEnd)
    const matchesDown = downEnd !== null && (domino.left === downEnd || domino.right === downEnd)

    // Check if we can play on the spinner (first double) - only if UP/DOWN not yet started
    if (firstSpinner && spinnerSides.size >= 2) {
      const spinnerValue = firstSpinner.domino.left
      const matchesSpinner = domino.left === spinnerValue || domino.right === spinnerValue

      // Can play UP if not already occupied
      if (!spinnerSides.has('up') && matchesSpinner) {
        return 'spinner'
      }
      // Can play DOWN if not already occupied
      if (!spinnerSides.has('down') && matchesSpinner) {
        return 'spinner'
      }
    }

    // Check UP/DOWN chain continuation
    if (matchesUp) return 'up'
    if (matchesDown) return 'down'

    if (matchesLeft && matchesRight) return 'both'
    if (matchesLeft) return 'left'
    if (matchesRight) return 'right'
    return null
  }

  const playDomino = (domino: Domino, side: 'left' | 'right' | 'up' | 'down', scorer: 'player' | 'computer') => {
    let placedDomino = { ...domino }

    // Handle spinner placement (up/down) - first domino off spinner
    if ((side === 'up' || side === 'down') && firstSpinner && !spinnerSides.has(side)) {
      const spinnerValue = firstSpinner.domino.left
      let newEnd: number

      if (side === 'up') {
        if (domino.right === spinnerValue) {
          placedDomino.isFlipped = false
          newEnd = domino.left  // Top of domino becomes the new UP end
        } else {
          placedDomino.isFlipped = true
          newEnd = domino.right  // After flip, right becomes top
        }
      } else {
        if (domino.left === spinnerValue) {
          placedDomino.isFlipped = false
          newEnd = domino.right  // Bottom of domino becomes the new DOWN end
        } else {
          placedDomino.isFlipped = true
          newEnd = domino.left  // After flip, left becomes bottom
        }
      }

      const newSpinnerSides = new Set([...spinnerSides, side])

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

      const newBoard = [...board, newPlaced]
      const newUpEnd = side === 'up' ? newEnd : upEnd
      const newDownEnd = side === 'down' ? newEnd : downEnd

      // Award score with new values
      awardScore(scorer, newBoard, leftEnd, rightEnd, newUpEnd, newDownEnd, newSpinnerSides, firstSpinner)

      // Update state
      if (side === 'up') {
        setUpEnd(newEnd)
      } else {
        setDownEnd(newEnd)
      }
      setSpinnerSides(newSpinnerSides)
      setBoard(newBoard)
      return
    }

    // Handle UP chain continuation
    if (side === 'up' && upEnd !== null) {
      let newEnd: number
      if (domino.right === upEnd) {
        placedDomino.isFlipped = false
        newEnd = domino.left
      } else {
        placedDomino.isFlipped = true
        newEnd = domino.right
      }

      // Find the topmost domino in the UP chain
      const upDominoes = board.filter(p => p.spinnerSide === 'up')
      const topmost = upDominoes.length > 0
        ? upDominoes.reduce((min, p) => p.y < min.y ? p : min)
        : firstSpinner!

      const newPlaced: PlacedDomino = {
        domino: placedDomino,
        x: topmost.x,
        y: topmost.y - 165,
        rotation: 0,
        spinnerSide: 'up'
      }

      const newBoard = [...board, newPlaced]

      // Award score with new values
      awardScore(scorer, newBoard, leftEnd, rightEnd, newEnd, downEnd, spinnerSides, firstSpinner)

      // Update state
      setUpEnd(newEnd)
      setBoard(newBoard)
      return
    }

    // Handle DOWN chain continuation
    if (side === 'down' && downEnd !== null) {
      let newEnd: number
      if (domino.left === downEnd) {
        placedDomino.isFlipped = false
        newEnd = domino.right
      } else {
        placedDomino.isFlipped = true
        newEnd = domino.left
      }

      // Find the bottommost domino in the DOWN chain
      const downDominoes = board.filter(p => p.spinnerSide === 'down')
      const bottommost = downDominoes.length > 0
        ? downDominoes.reduce((max, p) => p.y > max.y ? p : max)
        : firstSpinner!

      const newPlaced: PlacedDomino = {
        domino: placedDomino,
        x: bottommost.x,
        y: bottommost.y + 165,
        rotation: 0,
        spinnerSide: 'down'
      }

      const newBoard = [...board, newPlaced]

      // Award score with new values
      awardScore(scorer, newBoard, leftEnd, rightEnd, upEnd, newEnd, spinnerSides, firstSpinner)

      // Update state
      setDownEnd(newEnd)
      setBoard(newBoard)
      return
    }

    // Flip logic - flip so matching end touches the chain
    let newLeftEnd = leftEnd
    let newRightEnd = rightEnd

    if (side === 'left') {
      if (domino.right === leftEnd) {
        placedDomino.isFlipped = true  // Flip so right side faces left (touches chain)
        newLeftEnd = domino.left
      } else if (domino.left === leftEnd) {
        placedDomino.isFlipped = false  // Left side already faces left
        newLeftEnd = domino.right
      }
    } else {
      if (domino.left === rightEnd) {
        placedDomino.isFlipped = true  // Flip so left side faces right (touches chain)
        newRightEnd = domino.right
      } else if (domino.right === rightEnd) {
        placedDomino.isFlipped = false  // Right side already faces right
        newRightEnd = domino.left
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
          x = leftmost.x - 120  // Double(80w) to non-double(160w)
        } else if (!leftmost.domino.isDouble && placedDomino.isDouble) {
          x = leftmost.x - 120  // Non-double to double
        } else if (!leftmost.domino.isDouble && !placedDomino.isDouble) {
          x = leftmost.x - 155  // Non-double(160w) to non-double
        } else {
          x = leftmost.x - 80   // Double to double
        }
      } else {
        const rightmost = board.reduce((max, p) => p.x > max.x ? p : max)
        y = rightmost.y // Inherit y from reference domino
        if (rightmost.domino.isDouble && !placedDomino.isDouble) {
          x = rightmost.x + 120  // Double to non-double
        } else if (!rightmost.domino.isDouble && placedDomino.isDouble) {
          x = rightmost.x + 120  // Non-double to double
        } else if (!rightmost.domino.isDouble && !placedDomino.isDouble) {
          x = rightmost.x + 155  // Non-double to non-double
        } else {
          x = rightmost.x + 80   // Double to double
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

    const newBoard = [...board, newPlaced]

    // Determine new spinner and spinnerSides
    let newSpinner = firstSpinner
    let newSpinnerSides = spinnerSides

    // Track the first double as the spinner
    if (!firstSpinner && placedDomino.isDouble) {
      newSpinner = newPlaced
      newSpinnerSides = new Set()
    }

    // Check if this domino is connecting directly to the spinner
    if (firstSpinner) {
      if (Math.abs(x - firstSpinner.x) < 200) {
        if (x < firstSpinner.x && !spinnerSides.has('left')) {
          newSpinnerSides = new Set([...spinnerSides, 'left'])
        } else if (x > firstSpinner.x && !spinnerSides.has('right')) {
          newSpinnerSides = new Set([...spinnerSides, 'right'])
        }
      }
    }

    // Award score with new values
    awardScore(scorer, newBoard, newLeftEnd, newRightEnd, upEnd, downEnd, newSpinnerSides, newSpinner)

    // Update state
    if (side === 'left') {
      setLeftEnd(newLeftEnd)
    } else {
      setRightEnd(newRightEnd)
    }
    setBoard(newBoard)
    if (newSpinner !== firstSpinner) {
      setFirstSpinner(newSpinner)
    }
    if (newSpinnerSides !== spinnerSides) {
      setSpinnerSides(newSpinnerSides)
    }
  }

  const handleDominoClick = (domino: Domino) => {
    if (currentPlayer !== 'player') return

    const playable = canPlay(domino)

    if (!playable) {
      setMessage("Can't play this domino!")
      return
    }

    // Check if there are multiple play options
    const matchesLeft = domino.left === leftEnd || domino.right === leftEnd
    const matchesRight = domino.left === rightEnd || domino.right === rightEnd
    const matchesUp = upEnd !== null && (domino.left === upEnd || domino.right === upEnd)
    const matchesDown = downEnd !== null && (domino.left === downEnd || domino.right === downEnd)
    const matchesSpinner = firstSpinner &&
      (domino.left === firstSpinner.domino.left || domino.right === firstSpinner.domino.left) &&
      spinnerSides.size >= 2 && spinnerSides.size < 4

    const options = [
      matchesLeft && 'left',
      matchesRight && 'right',
      matchesUp && 'up',
      matchesDown && 'down',
      matchesSpinner && !spinnerSides.has('up') && 'spinner_up',
      matchesSpinner && !spinnerSides.has('down') && 'spinner_down'
    ].filter(Boolean)

    // If multiple options, show choice dialog
    if (options.length > 1 || playable === 'spinner' || playable === 'both') {
      setSelectedDomino(domino)
      setShowSideChoice(true)
      setMessage(`Choose where to play ${domino.left}-${domino.right}`)
      return
    }

    // Single option - play directly
    playDomino(domino, playable as 'left' | 'right' | 'up' | 'down', 'player')

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

    playDomino(selectedDomino, side, 'player')
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

    // Keep drawing until we get a playable tile or boneyard is empty
    let newHand = [...playerHand]
    let newBoneyard = [...boneyard]
    let lastDrawn: Domino | null = null
    let drawCount = 0

    while (newBoneyard.length > 0) {
      const drawn = newBoneyard[0]
      newHand = [...newHand, drawn]
      newBoneyard = newBoneyard.slice(1)
      lastDrawn = drawn
      drawCount++

      // Check if drawn tile can be played (using current ends)
      const matchesAny =
        drawn.left === leftEnd || drawn.right === leftEnd ||
        drawn.left === rightEnd || drawn.right === rightEnd ||
        (upEnd !== null && (drawn.left === upEnd || drawn.right === upEnd)) ||
        (downEnd !== null && (drawn.left === downEnd || drawn.right === downEnd)) ||
        (firstSpinner && spinnerSides.size >= 2 && spinnerSides.size < 4 &&
          (drawn.left === firstSpinner.domino.left || drawn.right === firstSpinner.domino.left))

      if (matchesAny) {
        setPlayerHand(newHand)
        setBoneyard(newBoneyard)
        setMessage(`Drew ${drawCount} tile${drawCount > 1 ? 's' : ''}. ${drawn.left}-${drawn.right} can be played!`)
        return
      }
    }

    // Drew all tiles, none playable
    setPlayerHand(newHand)
    setBoneyard(newBoneyard)
    if (lastDrawn) {
      setMessage(`Drew ${drawCount} tile${drawCount > 1 ? 's' : ''}, none playable. Computer's turn`)
    } else {
      setMessage('Boneyard empty. Computer\'s turn')
    }
    setCurrentPlayer('computer')
  }

  // Computer AI
  useEffect(() => {
    if (currentPlayer !== 'computer') return

    const timer = setTimeout(() => {
      // Try to play a domino
      for (const domino of computerHand) {
        const playable = canPlay(domino)
        if (playable) {
          // Handle spinner specially - choose up if available, else down
          let side: 'left' | 'right' | 'up' | 'down'
          if (playable === 'spinner') {
            side = !spinnerSides.has('up') ? 'up' : 'down'
          } else if (playable === 'both') {
            side = 'right'
          } else {
            side = playable
          }

          playDomino(domino, side, 'computer')
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

      // Can't play, keep drawing until we can
      let newHand = [...computerHand]
      let newBoneyard = [...boneyard]
      let drawCount = 0

      while (newBoneyard.length > 0) {
        const drawn = newBoneyard[0]
        newHand = [...newHand, drawn]
        newBoneyard = newBoneyard.slice(1)
        drawCount++

        // Check if drawn tile can be played
        const matchesAny =
          drawn.left === leftEnd || drawn.right === leftEnd ||
          drawn.left === rightEnd || drawn.right === rightEnd ||
          (upEnd !== null && (drawn.left === upEnd || drawn.right === upEnd)) ||
          (downEnd !== null && (drawn.left === downEnd || drawn.right === downEnd)) ||
          (firstSpinner && spinnerSides.size >= 2 && spinnerSides.size < 4 &&
            (drawn.left === firstSpinner.domino.left || drawn.right === firstSpinner.domino.left))

        if (matchesAny) {
          // Determine which side to play
          let side: 'left' | 'right' | 'up' | 'down' = 'right'
          if (drawn.left === leftEnd || drawn.right === leftEnd) side = 'left'
          else if (drawn.left === rightEnd || drawn.right === rightEnd) side = 'right'
          else if (upEnd !== null && (drawn.left === upEnd || drawn.right === upEnd)) side = 'up'
          else if (downEnd !== null && (drawn.left === downEnd || drawn.right === downEnd)) side = 'down'
          else if (firstSpinner && !spinnerSides.has('up')) side = 'up'
          else if (firstSpinner && !spinnerSides.has('down')) side = 'down'

          setComputerHand(newHand.filter(d => d.id !== drawn.id))
          setBoneyard(newBoneyard)
          playDomino(drawn, side, 'computer')
          setMessage(`Computer drew ${drawCount} tile${drawCount > 1 ? 's' : ''} and played`)

          if (newHand.length === 1) {
            setMessage('Computer won!')
            setTimeout(() => onGameEnd('computer'), 1500)
            return
          }

          setCurrentPlayer('player')
          setMessage('Your turn')
          return
        }
      }

      // Drew all tiles, none playable
      setComputerHand(newHand)
      setBoneyard(newBoneyard)
      if (drawCount > 0) {
        setMessage(`Computer drew ${drawCount} tile${drawCount > 1 ? 's' : ''}, passes`)
      } else {
        setMessage('Computer passes - no valid moves')
      }

      setCurrentPlayer('player')
      setMessage('Your turn')
    }, 1500)

    return () => clearTimeout(timer)
  }, [currentPlayer, computerHand, leftEnd, rightEnd, upEnd, downEnd, boneyard, firstSpinner, spinnerSides])

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
              {/* UP chain continuation */}
              {upEnd !== null && (selectedDomino.left === upEnd || selectedDomino.right === upEnd) && (
                <button
                  onClick={() => handleSideChoice('up')}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded font-bold"
                >
                  UP (↑ {upEnd})
                </button>
              )}
              {/* DOWN chain continuation */}
              {downEnd !== null && (selectedDomino.left === downEnd || selectedDomino.right === downEnd) && (
                <button
                  onClick={() => handleSideChoice('down')}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded font-bold"
                >
                  DOWN (↓ {downEnd})
                </button>
              )}
              {/* First play on spinner UP */}
              {firstSpinner && spinnerSides.size >= 2 && !spinnerSides.has('up') && upEnd === null &&
                (selectedDomino.left === firstSpinner.domino.left || selectedDomino.right === firstSpinner.domino.left) && (
                <button
                  onClick={() => handleSideChoice('up')}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded font-bold"
                >
                  UP (↑ {firstSpinner.domino.left})
                </button>
              )}
              {/* First play on spinner DOWN */}
              {firstSpinner && spinnerSides.size >= 2 && !spinnerSides.has('down') && downEnd === null &&
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
