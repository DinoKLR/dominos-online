'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createDominoSet, Domino as LegacyDomino } from '@/types/domino'
import DominoComponent from './Domino'

// Simple grid-based domino game following the specification
// Each domino occupies exactly 2 grid cells

const BOARD_ROWS = 30
const BOARD_COLS = 40
const CELL_SIZE = 35
const CENTER_ROW = Math.floor(BOARD_ROWS / 2)
const CENTER_COL = Math.floor(BOARD_COLS / 2)

interface GridCell {
  tileId: string | null
  half: 0 | 1 // which half of the domino
}

interface Tile {
  id: string
  leftPips: number
  rightPips: number
  row: number
  col: number
  orientation: 'H' | 'V' // Horizontal or Vertical
  placed: boolean
}

interface Endpoint {
  row: number
  col: number
  requiredPips: number
  direction: 'left' | 'right' | 'up' | 'down'
}

interface DominoGameGrid3Props {
  onGameEnd: (winner: 'player' | 'computer') => void
  onBackToHome: () => void
}

const DominoGameGrid3: React.FC<DominoGameGrid3Props> = ({ onGameEnd, onBackToHome }) => {
  const [board, setBoard] = useState<GridCell[][]>(() =>
    Array(BOARD_ROWS).fill(null).map(() =>
      Array(BOARD_COLS).fill(null).map(() => ({ tileId: null, half: 0 }))
    )
  )

  const [tiles, setTiles] = useState<Map<string, Tile>>(new Map())
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [playerHand, setPlayerHand] = useState<Tile[]>([])
  const [computerHand, setComputerHand] = useState<Tile[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<'player' | 'computer'>('player')
  const [gameMessage, setGameMessage] = useState('Starting game...')
  const [showDebug, setShowDebug] = useState(true)

  // Initialize game
  useEffect(() => {
    startNewGame()
  }, [])

  const startNewGame = () => {
    // Create dominoes
    const dominoes = createDominoSet()
    const shuffled = [...dominoes].sort(() => Math.random() - 0.5)

    // Convert to tiles
    const playerTiles: Tile[] = shuffled.slice(0, 7).map(d => ({
      id: d.id,
      leftPips: d.left,
      rightPips: d.right,
      row: -1,
      col: -1,
      orientation: 'H',
      placed: false
    }))

    const computerTiles: Tile[] = shuffled.slice(7, 14).map(d => ({
      id: d.id,
      leftPips: d.left,
      rightPips: d.right,
      row: -1,
      col: -1,
      orientation: 'H',
      placed: false
    }))

    // Find starter (highest double)
    let startingTile: Tile | null = null
    let starter: 'player' | 'computer' = 'player'

    for (let pip = 6; pip >= 0; pip--) {
      const playerDouble = playerTiles.find(t => t.leftPips === pip && t.rightPips === pip)
      if (playerDouble) {
        startingTile = playerDouble
        starter = 'player'
        break
      }

      const computerDouble = computerTiles.find(t => t.leftPips === pip && t.rightPips === pip)
      if (computerDouble) {
        startingTile = computerDouble
        starter = 'computer'
        break
      }
    }

    // If no doubles, use highest pip count
    if (!startingTile) {
      const getHighest = (tiles: Tile[]) =>
        tiles.reduce((max, t) =>
          (t.leftPips + t.rightPips > max.leftPips + max.rightPips) ? t : max
        )

      const playerHighest = getHighest(playerTiles)
      const computerHighest = getHighest(computerTiles)

      if (playerHighest.leftPips + playerHighest.rightPips >= computerHighest.leftPips + computerHighest.rightPips) {
        startingTile = playerHighest
        starter = 'player'
      } else {
        startingTile = computerHighest
        starter = 'computer'
      }
    }

    // Place starting tile - doubles are vertical, others horizontal
    startingTile.orientation = (startingTile.leftPips === startingTile.rightPips) ? 'V' : 'H'
    startingTile.placed = true

    // Update board
    const newBoard = Array(BOARD_ROWS).fill(null).map(() =>
      Array(BOARD_COLS).fill(null).map(() => ({ tileId: null, half: 0 }))
    )

    const initialEndpoints: Endpoint[] = []

    if (startingTile.orientation === 'V') {
      // Vertical double - position it so its center aligns with where horizontal tiles would be
      startingTile.row = CENTER_ROW - 1  // Start one row up so it straddles the center line
      startingTile.col = CENTER_COL

      newBoard[startingTile.row][startingTile.col] = { tileId: startingTile.id, half: 0 }
      newBoard[startingTile.row + 1][startingTile.col] = { tileId: startingTile.id, half: 1 }

      // Create endpoints for vertical double - tiles connect horizontally on both sides
      // Double occupies CENTER_COL, so endpoints are adjacent
      initialEndpoints.push(
        {
          row: CENTER_ROW,
          col: CENTER_COL - 1,  // Left of the double
          requiredPips: startingTile.leftPips,  // For double, both values are same
          direction: 'left'
        },
        {
          row: CENTER_ROW,
          col: CENTER_COL + 1,  // Right of the double
          requiredPips: startingTile.leftPips,  // For double, both values are same
          direction: 'right'
        }
      )
      console.log('Created endpoints for double:', startingTile.leftPips, initialEndpoints)
    } else {
      // Horizontal tile
      startingTile.row = CENTER_ROW
      startingTile.col = CENTER_COL

      newBoard[startingTile.row][startingTile.col] = { tileId: startingTile.id, half: 0 }
      newBoard[startingTile.row][startingTile.col + 1] = { tileId: startingTile.id, half: 1 }

      // Create endpoints at the exact edges of the horizontal tile
      initialEndpoints.push(
        {
          row: CENTER_ROW,
          col: CENTER_COL,  // Left edge of tile
          requiredPips: startingTile.leftPips,
          direction: 'left'
        },
        {
          row: CENTER_ROW,
          col: CENTER_COL + 1,  // Right edge of tile (since it occupies 2 cells)
          requiredPips: startingTile.rightPips,
          direction: 'right'
        }
      )
    }

    // Update tiles map
    const tilesMap = new Map<string, Tile>()
    tilesMap.set(startingTile.id, startingTile)

    // Remove from hand
    if (starter === 'player') {
      setPlayerHand(playerTiles.filter(t => t.id !== startingTile.id))
      setComputerHand(computerTiles)
      setCurrentPlayer('computer')
    } else {
      setPlayerHand(playerTiles)
      setComputerHand(computerTiles.filter(t => t.id !== startingTile.id))
      setCurrentPlayer('player')
    }

    setBoard(newBoard)
    setTiles(tilesMap)
    setEndpoints(initialEndpoints)
    setGameMessage(`${starter === 'player' ? 'You' : 'Computer'} started with ${startingTile.id}`)
  }

  const canPlaceTile = (tile: Tile, endpoint: Endpoint): { valid: boolean, orientation: 'H' | 'V', row: number, col: number, connectingPip: 'left' | 'right' } | null => {
    // Check if tile can connect to this endpoint
    const canConnect = tile.leftPips === endpoint.requiredPips || tile.rightPips === endpoint.requiredPips
    if (!canConnect) return null

    let row: number, col: number, orientation: 'H' | 'V'
    let connectingPip: 'left' | 'right'

    if (endpoint.direction === 'left') {
      // Place horizontally to the left - tile extends left from endpoint
      orientation = 'H'
      row = endpoint.row
      col = endpoint.col - 1  // Tile ends at endpoint, starts 2 cells left
      connectingPip = tile.rightPips === endpoint.requiredPips ? 'right' : 'left'
    } else if (endpoint.direction === 'right') {
      // Place horizontally to the right - tile starts at endpoint
      orientation = 'H'
      row = endpoint.row
      col = endpoint.col  // Tile starts at endpoint, extends 2 cells right
      connectingPip = tile.leftPips === endpoint.requiredPips ? 'left' : 'right'
    } else if (endpoint.direction === 'up') {
      // Place vertically above
      orientation = 'V'
      row = endpoint.row - 1
      col = endpoint.col
      connectingPip = tile.rightPips === endpoint.requiredPips ? 'right' : 'left'
    } else {
      // Place vertically below
      orientation = 'V'
      row = endpoint.row
      col = endpoint.col
      connectingPip = tile.leftPips === endpoint.requiredPips ? 'left' : 'right'
    }

    // Check bounds
    if (orientation === 'H') {
      if (col < 0 || col + 1 >= BOARD_COLS || row < 0 || row >= BOARD_ROWS) return null
      // Check occupancy
      if (board[row][col].tileId || board[row][col + 1].tileId) return null
    } else {
      if (col < 0 || col >= BOARD_COLS || row < 0 || row + 1 >= BOARD_ROWS) return null
      // Check occupancy
      if (board[row][col].tileId || board[row + 1][col].tileId) return null
    }

    return { valid: true, orientation, row, col, connectingPip }
  }

  const placeTile = (tile: Tile, endpoint: Endpoint, placement: { orientation: 'H' | 'V', row: number, col: number, connectingPip: 'left' | 'right' }) => {
    const newBoard = [...board]
    const newTiles = new Map(tiles)
    const newEndpoints = endpoints.filter(e => e !== endpoint)

    // If we need to flip the tile to match
    if (placement.connectingPip === 'left' && tile.leftPips !== endpoint.requiredPips) {
      // Flip the tile
      const temp = tile.leftPips
      tile.leftPips = tile.rightPips
      tile.rightPips = temp
    } else if (placement.connectingPip === 'right' && tile.rightPips !== endpoint.requiredPips) {
      // Flip the tile
      const temp = tile.leftPips
      tile.leftPips = tile.rightPips
      tile.rightPips = temp
    }

    // Update tile position
    tile.row = placement.row
    tile.col = placement.col
    tile.orientation = placement.orientation
    tile.placed = true

    // Update board
    if (placement.orientation === 'H') {
      newBoard[placement.row][placement.col] = { tileId: tile.id, half: 0 }
      newBoard[placement.row][placement.col + 1] = { tileId: tile.id, half: 1 }

      // Add new endpoint at the exact edge where next tile would connect
      if (endpoint.direction === 'left') {
        // We placed to the left, new endpoint is at the left edge of placed tile
        newEndpoints.push({
          row: placement.row,
          col: placement.col,  // Left edge of the tile we placed
          requiredPips: tile.leftPips,
          direction: 'left'
        })
      } else if (endpoint.direction === 'right') {
        // We placed to the right, new endpoint is at the right edge of placed tile
        newEndpoints.push({
          row: placement.row,
          col: placement.col + 1,  // Right edge of the tile we placed (col + 1 since tile occupies 2 cells)
          requiredPips: tile.rightPips,
          direction: 'right'
        })
      }
    } else {
      // Vertical
      newBoard[placement.row][placement.col] = { tileId: tile.id, half: 0 }
      newBoard[placement.row + 1][placement.col] = { tileId: tile.id, half: 1 }

      // Add new endpoint
      if (endpoint.direction === 'up') {
        // We placed above, add endpoint further up
        newEndpoints.push({
          row: placement.row - 1,
          col: placement.col,
          requiredPips: tile.leftPips,
          direction: 'up'
        })
      } else if (endpoint.direction === 'down') {
        // We placed below, add endpoint further down
        newEndpoints.push({
          row: placement.row + 2,
          col: placement.col,
          requiredPips: tile.rightPips,
          direction: 'down'
        })
      }
    }

    newTiles.set(tile.id, tile)

    setBoard(newBoard)
    setTiles(newTiles)
    setEndpoints(newEndpoints)
  }

  const handleTileClick = (tile: Tile) => {
    if (currentPlayer !== 'player' || tile.placed) return

    console.log('Trying to play tile:', tile.id, 'with pips:', tile.leftPips, tile.rightPips)
    console.log('Current endpoints:', endpoints)

    // Try to place at any valid endpoint
    for (const endpoint of endpoints) {
      const placement = canPlaceTile(tile, endpoint)
      console.log('Checking endpoint:', endpoint, 'placement:', placement)
      if (placement && placement.valid) {
        placeTile(tile, endpoint, placement)
        setPlayerHand(prev => prev.filter(t => t.id !== tile.id))
        setCurrentPlayer('computer')
        setGameMessage(`You played ${tile.id}`)
        return
      }
    }

    setGameMessage('Cannot play this tile!')
  }

  // Computer AI
  useEffect(() => {
    if (currentPlayer !== 'computer') return

    const timer = setTimeout(() => {
      for (const tile of computerHand) {
        for (const endpoint of endpoints) {
          const placement = canPlaceTile(tile, endpoint)
          if (placement && placement.valid) {
            placeTile(tile, endpoint, placement)
            setComputerHand(prev => prev.filter(t => t.id !== tile.id))
            setCurrentPlayer('player')
            setGameMessage(`Computer played ${tile.id}`)
            return
          }
        }
      }

      // No valid moves
      setCurrentPlayer('player')
      setGameMessage('Computer passes - your turn!')
    }, 1000)

    return () => clearTimeout(timer)
  }, [currentPlayer, computerHand, endpoints])

  return (
    <div className="fixed inset-0 bg-green-800 flex flex-col">
      <div className="bg-black/30 p-2 flex justify-between items-center">
        <div className="text-white font-bold">DOMINO GRID v3</div>
        <div className="text-white">{gameMessage}</div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
          >
            Debug: {showDebug ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={onBackToHome}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            Exit
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div
          className="relative mx-auto"
          style={{
            width: BOARD_COLS * CELL_SIZE,
            height: BOARD_ROWS * CELL_SIZE,
            backgroundColor: 'rgba(0,0,0,0.1)'
          }}
        >
          {/* Grid cells */}
          {showDebug && Array.from({ length: BOARD_ROWS }, (_, row) =>
            Array.from({ length: BOARD_COLS }, (_, col) => (
              <div
                key={`cell-${row}-${col}`}
                className="absolute border border-green-900/20"
                style={{
                  left: col * CELL_SIZE,
                  top: row * CELL_SIZE,
                  width: CELL_SIZE,
                  height: CELL_SIZE
                }}
              >
                <div className="text-[6px] text-green-600/30">
                  {row},{col}
                </div>
              </div>
            ))
          )}

          {/* Placed tiles */}
          {Array.from(tiles.values()).filter(t => t.placed).map(tile => (
            <div
              key={tile.id}
              className="absolute flex items-center justify-center"
              style={{
                left: tile.col * CELL_SIZE,
                top: tile.row * CELL_SIZE,
                width: tile.orientation === 'H' ? CELL_SIZE * 2 : CELL_SIZE,
                height: tile.orientation === 'V' ? CELL_SIZE * 2 : CELL_SIZE,
                zIndex: 10
              }}
            >
              <div style={{
                transform: `${tile.orientation === 'H' ? 'rotate(90deg)' : ''} scale(0.3)`
              }}>
                <DominoComponent
                  domino={{
                    id: tile.id,
                    left: tile.leftPips,
                    right: tile.rightPips,
                    isDouble: tile.leftPips === tile.rightPips
                  } as LegacyDomino}
                />
              </div>
            </div>
          ))}

          {/* Endpoints */}
          {showDebug && endpoints.map((endpoint, i) => (
            <div
              key={`endpoint-${i}`}
              className="absolute bg-red-500/50 text-white text-xs font-bold flex items-center justify-center"
              style={{
                left: endpoint.col * CELL_SIZE,
                top: endpoint.row * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
                zIndex: 20
              }}
            >
              <div className="text-[10px]">
                {endpoint.requiredPips}
                <br />
                {endpoint.direction === 'left' && '←'}
                {endpoint.direction === 'right' && '→'}
                {endpoint.direction === 'up' && '↑'}
                {endpoint.direction === 'down' && '↓'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-black/30 p-2">
        <div className="flex gap-2 overflow-x-auto justify-center">
          {playerHand.map(tile => (
            <div
              key={tile.id}
              onClick={() => handleTileClick(tile)}
              className="cursor-pointer hover:scale-110 transition-transform"
            >
              <div className="scale-50">
                <DominoComponent
                  domino={{
                    id: tile.id,
                    left: tile.leftPips,
                    right: tile.rightPips,
                    isDouble: tile.leftPips === tile.rightPips
                  } as LegacyDomino}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="text-center text-white mt-2">
          Your dominoes ({playerHand.length})
        </div>
      </div>
    </div>
  )
}

export default DominoGameGrid3