'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  BOARD_ROWS,
  BOARD_COLS,
  CELL_SIZE_PX,
  CENTER_ROW,
  CENTER_COL,
  DEFAULT_RULES,
  type GameState,
  type Tile,
  type Chain,
  type Endpoint,
  type BoardCell,
  type ValidationResult,
  type GridPosition,
  type Direction,
  getTileOccupiedCells,
  getOppositeDirection,
  getDirectionOffset,
  isAdjacent,
  getPipsForDirection
} from '@/types/gridDomino'
import { createDominoSet, Domino as LegacyDomino } from '@/types/domino'
import DominoComponent from './Domino'

interface DominoGameGrid2Props {
  onGameEnd: (winner: 'player' | 'computer') => void
  onBackToHome: () => void
}

const DominoGameGrid2: React.FC<DominoGameGrid2Props> = ({ onGameEnd, onBackToHome }) => {
  const boardRef = useRef<HTMLDivElement>(null)
  const [showDebug, setShowDebug] = useState(true)

  // Initialize game state
  const [gameState, setGameState] = useState<GameState>(() => {
    // Create empty board matrix
    const boardMatrix: BoardCell[][] = Array(BOARD_ROWS).fill(null).map(() =>
      Array(BOARD_COLS).fill(null).map(() => ({ tileId: null, half: 0 }))
    )

    const occupied: (BoardCell | null)[][] = Array(BOARD_ROWS).fill(null).map(() =>
      Array(BOARD_COLS).fill(null)
    )

    return {
      boardRows: BOARD_ROWS,
      boardCols: BOARD_COLS,
      cellSizePx: CELL_SIZE_PX,
      boardMatrix,
      occupied,
      tiles: new Map(),
      chains: new Map(),
      legalEndpoints: [],
      dragging: null,
      currentPlayer: 'player',
      rules: DEFAULT_RULES
    }
  })

  const [playerHand, setPlayerHand] = useState<Tile[]>([])
  const [computerHand, setComputerHand] = useState<Tile[]>([])
  const [boneyard, setBoneyard] = useState<Tile[]>([])
  const [gameMessage, setGameMessage] = useState('Starting game...')

  // Initialize game on mount
  useEffect(() => {
    initializeGame()
  }, [])

  // Computer AI
  useEffect(() => {
    if (gameState.currentPlayer !== 'computer') return

    const timer = setTimeout(() => {
      // Try to play a tile
      for (const tile of computerHand) {
        for (const endpoint of gameState.legalEndpoints) {
          const orientations: Array<'H' | 'V'> = ['H', 'V']

          for (const orientation of orientations) {
            tile.orientation = orientation

            let position: GridPosition

            if (orientation === 'H') {
              if (endpoint.facing === 'E') {
                position = { row: endpoint.row, col: endpoint.col + 1 }
              } else if (endpoint.facing === 'W') {
                position = { row: endpoint.row, col: endpoint.col - 2 }
              } else {
                continue
              }
            } else {
              if (endpoint.facing === 'S') {
                position = { row: endpoint.row + 1, col: endpoint.col }
              } else if (endpoint.facing === 'N') {
                position = { row: endpoint.row - 2, col: endpoint.col }
              } else {
                continue
              }
            }

            // Try both pip orientations
            const originalLeft = tile.leftPips
            const originalRight = tile.rightPips

            // Try normal
            const result1 = validateTilePlacement(tile, position, orientation)
            if (result1.isValid && result1.matchedEndpoint) {
              placeTile(tile, position, result1.matchedEndpoint)
              setComputerHand(prev => prev.filter(t => t.id !== tile.id))
              setGameState(prev => ({ ...prev, currentPlayer: 'player' }))
              setGameMessage(`Computer played ${tile.id}`)
              return
            }

            // Try flipped
            tile.leftPips = originalRight
            tile.rightPips = originalLeft
            const result2 = validateTilePlacement(tile, position, orientation)
            if (result2.isValid && result2.matchedEndpoint) {
              placeTile(tile, position, result2.matchedEndpoint)
              setComputerHand(prev => prev.filter(t => t.id !== tile.id))
              setGameState(prev => ({ ...prev, currentPlayer: 'player' }))
              setGameMessage(`Computer played ${tile.id}`)
              return
            }

            // Restore
            tile.leftPips = originalLeft
            tile.rightPips = originalRight
          }
        }
      }

      // No valid moves - pass
      setGameState(prev => ({ ...prev, currentPlayer: 'player' }))
      setGameMessage('Computer passes - your turn!')
    }, 1000)

    return () => clearTimeout(timer)
  }, [gameState.currentPlayer, computerHand, gameState.legalEndpoints])

  const initializeGame = () => {
    // Create domino set and convert to new Tile format
    const legacyDominoes = createDominoSet()
    const tiles: Tile[] = legacyDominoes.map(d => ({
      id: d.id,
      leftPips: d.left,
      rightPips: d.right,
      orientation: 'H' as const,
      position: null,
      rotation: 0,
      placed: false,
      isDouble: d.isDouble
    }))

    // Shuffle and deal
    const shuffled = [...tiles].sort(() => Math.random() - 0.5)
    const playerTiles = shuffled.slice(0, 7)
    const computerTiles = shuffled.slice(7, 14)
    const boneyardTiles = shuffled.slice(14)

    setPlayerHand(playerTiles)
    setComputerHand(computerTiles)
    setBoneyard(boneyardTiles)

    // Find who starts (highest double)
    const findStarter = () => {
      for (let value = 6; value >= 0; value--) {
        const playerDouble = playerTiles.find(t => t.isDouble && t.leftPips === value)
        if (playerDouble) return { starter: 'player', tile: playerDouble }

        const computerDouble = computerTiles.find(t => t.isDouble && t.leftPips === value)
        if (computerDouble) return { starter: 'computer', tile: computerDouble }
      }

      // No doubles - highest pip count
      const getHighest = (tiles: Tile[]) =>
        tiles.reduce((max, t) =>
          (t.leftPips + t.rightPips > max.leftPips + max.rightPips) ? t : max
        )

      const playerHighest = getHighest(playerTiles)
      const computerHighest = getHighest(computerTiles)

      if (playerHighest.leftPips + playerHighest.rightPips >=
          computerHighest.leftPips + computerHighest.rightPips) {
        return { starter: 'player', tile: playerHighest }
      }
      return { starter: 'computer', tile: computerHighest }
    }

    const { starter, tile } = findStarter()

    // Place starting tile in center
    placeTileAtCenter(tile, starter)

    setGameMessage(`${starter === 'player' ? 'You' : 'Computer'} started with ${tile.id}`)
  }

  const placeTileAtCenter = (tile: Tile, player: 'player' | 'computer') => {
    // Place tile at center of board
    tile.position = { row: CENTER_ROW, col: CENTER_COL }
    tile.placed = true
    tile.orientation = tile.isDouble ? 'V' : 'H'

    // Update board matrix
    const newState = { ...gameState }
    const cells = getTileOccupiedCells(tile)
    if (cells) {
      const [cell1, cell2] = cells
      newState.boardMatrix[cell1.row][cell1.col] = { tileId: tile.id, half: 0 }
      newState.boardMatrix[cell2.row][cell2.col] = { tileId: tile.id, half: 1 }
      newState.occupied[cell1.row][cell1.col] = { tileId: tile.id, half: 0 }
      newState.occupied[cell2.row][cell2.col] = { tileId: tile.id, half: 1 }
    }

    // Create initial chain with correct endpoint positions
    const endpoints: Endpoint[] = []

    if (!tile.isDouble || gameState.rules.doubleOpenStyle === 'cross') {
      if (tile.orientation === 'H') {
        // Horizontal tile occupies (row, col) and (row, col+1)
        // Left endpoint is just before the tile
        endpoints.push({
          row: CENTER_ROW,
          col: CENTER_COL - 1,
          facing: 'W',
          requiredPips: tile.leftPips,
          chainId: 'chain-1'
        })
        // Right endpoint is just after the tile
        endpoints.push({
          row: CENTER_ROW,
          col: CENTER_COL + 2,
          facing: 'E',
          requiredPips: tile.rightPips,
          chainId: 'chain-1'
        })
      } else {
        // Vertical tile occupies (row, col) and (row+1, col)
        // Top endpoint is just above the tile
        endpoints.push({
          row: CENTER_ROW - 1,
          col: CENTER_COL,
          facing: 'N',
          requiredPips: tile.leftPips,
          chainId: 'chain-1'
        })
        // Bottom endpoint is just below the tile
        endpoints.push({
          row: CENTER_ROW + 2,
          col: CENTER_COL,
          facing: 'S',
          requiredPips: tile.rightPips,
          chainId: 'chain-1'
        })
      }
    }

    const chain: Chain = {
      id: 'chain-1',
      segments: [{
        tileId: tile.id,
        placedAt: tile.position,
        orientation: tile.orientation,
        connectingSide: 'left'
      }],
      endpoints: endpoints as [Endpoint, Endpoint] | [Endpoint] | [],
      isClosed: tile.isDouble && gameState.rules.doubleOpenStyle === 'cap'
    }

    // Handle double as cross (creates 4 endpoints)
    if (tile.isDouble && gameState.rules.doubleOpenStyle === 'cross') {
      chain.endpoints = [
        { row: CENTER_ROW - 1, col: CENTER_COL, facing: 'N', requiredPips: tile.leftPips, chainId: 'chain-1' },
        { row: CENTER_ROW + 2, col: CENTER_COL, facing: 'S', requiredPips: tile.leftPips, chainId: 'chain-1' },
        { row: CENTER_ROW, col: CENTER_COL - 1, facing: 'W', requiredPips: tile.leftPips, chainId: 'chain-1' },
        { row: CENTER_ROW, col: CENTER_COL + 1, facing: 'E', requiredPips: tile.leftPips, chainId: 'chain-1' }
      ] as [Endpoint, Endpoint]
    }

    newState.chains.set('chain-1', chain)
    newState.tiles.set(tile.id, tile)
    newState.legalEndpoints = [...chain.endpoints]
    newState.currentPlayer = player === 'player' ? 'computer' : 'player'

    setGameState(newState)

    // Remove from hand
    if (player === 'player') {
      setPlayerHand(prev => prev.filter(t => t.id !== tile.id))
    } else {
      setComputerHand(prev => prev.filter(t => t.id !== tile.id))
    }
  }

  const validateTilePlacement = (
    tile: Tile,
    position: GridPosition,
    orientation: 'H' | 'V'
  ): ValidationResult => {
    // Set temporary position for validation
    const tempTile = { ...tile, position, orientation }
    const cells = getTileOccupiedCells(tempTile)

    if (!cells) return { isValid: false, reason: 'Invalid position' }

    const [cell1, cell2] = cells

    // 1. Check bounds
    if (cell1.row < 0 || cell1.row >= BOARD_ROWS ||
        cell1.col < 0 || cell1.col >= BOARD_COLS ||
        cell2.row < 0 || cell2.row >= BOARD_ROWS ||
        cell2.col < 0 || cell2.col >= BOARD_COLS) {
      return { isValid: false, reason: 'Out of bounds' }
    }

    // 2. Check occupancy
    if (gameState.occupied[cell1.row][cell1.col] ||
        gameState.occupied[cell2.row][cell2.col]) {
      return { isValid: false, reason: 'Space occupied' }
    }

    // 3. Find matching endpoint
    let matchedEndpoint: Endpoint | null = null
    let touchingCell: GridPosition | null = null

    for (const endpoint of gameState.legalEndpoints) {
      // Check if either cell is adjacent to endpoint
      if (isAdjacent(cell1, endpoint)) {
        matchedEndpoint = endpoint
        touchingCell = cell1
        break
      }
      if (isAdjacent(cell2, endpoint)) {
        matchedEndpoint = endpoint
        touchingCell = cell2
        break
      }
    }

    if (!matchedEndpoint) {
      return { isValid: false, reason: 'Must connect to open end' }
    }

    // 4. Check pip match
    const touchingHalf = touchingCell === cell1 ? 0 : 1
    const touchingPips = touchingHalf === 0 ? tile.leftPips : tile.rightPips

    if (touchingPips !== matchedEndpoint.requiredPips) {
      return {
        isValid: false,
        reason: `Pip mismatch: ${touchingPips} ≠ ${matchedEndpoint.requiredPips}`
      }
    }

    // 5. Check orientation matches endpoint facing
    const offset = getDirectionOffset(matchedEndpoint.facing)
    const expectedPos = {
      row: matchedEndpoint.row + offset.row,
      col: matchedEndpoint.col + offset.col
    }

    if (touchingCell.row !== expectedPos.row || touchingCell.col !== expectedPos.col) {
      return { isValid: false, reason: 'Wrong orientation for endpoint' }
    }

    return { isValid: true, matchedEndpoint }
  }

  const placeTile = (tile: Tile, position: GridPosition, endpoint: Endpoint) => {
    const newState = { ...gameState }

    // Update tile
    tile.position = position
    tile.placed = true

    // Update board matrix
    const cells = getTileOccupiedCells(tile)
    if (!cells) return

    const [cell1, cell2] = cells
    newState.boardMatrix[cell1.row][cell1.col] = { tileId: tile.id, half: 0 }
    newState.boardMatrix[cell2.row][cell2.col] = { tileId: tile.id, half: 1 }
    newState.occupied[cell1.row][cell1.col] = { tileId: tile.id, half: 0 }
    newState.occupied[cell2.row][cell2.col] = { tileId: tile.id, half: 1 }

    // Update chain
    const chain = newState.chains.get(endpoint.chainId)
    if (chain) {
      // Add segment
      chain.segments.push({
        tileId: tile.id,
        placedAt: position,
        orientation: tile.orientation,
        connectingSide: endpoint.facing === 'N' || endpoint.facing === 'W' ? 'left' : 'right'
      })

      // Remove the matched endpoint
      const endpointIndex = chain.endpoints.findIndex(ep =>
        ep.row === endpoint.row && ep.col === endpoint.col
      )
      if (endpointIndex !== -1) {
        chain.endpoints.splice(endpointIndex, 1)
      }

      // Add new endpoint at the far end of the placed tile
      // The new endpoint should be just outside the far end of the tile
      let newEndpoint: Endpoint

      if (tile.orientation === 'H') {
        // Horizontal tile occupies (row, col) and (row, col+1)
        if (endpoint.facing === 'E') {
          // We connected to the left side, so new endpoint is on right
          newEndpoint = {
            row: position.row,
            col: position.col + 2,
            facing: 'E',
            requiredPips: tile.rightPips,
            chainId: endpoint.chainId
          }
        } else {
          // We connected to the right side, so new endpoint is on left
          newEndpoint = {
            row: position.row,
            col: position.col - 1,
            facing: 'W',
            requiredPips: tile.leftPips,
            chainId: endpoint.chainId
          }
        }
      } else {
        // Vertical tile occupies (row, col) and (row+1, col)
        if (endpoint.facing === 'S') {
          // We connected to the top, so new endpoint is on bottom
          newEndpoint = {
            row: position.row + 2,
            col: position.col,
            facing: 'S',
            requiredPips: tile.rightPips,
            chainId: endpoint.chainId
          }
        } else {
          // We connected to the bottom, so new endpoint is on top
          newEndpoint = {
            row: position.row - 1,
            col: position.col,
            facing: 'N',
            requiredPips: tile.leftPips,
            chainId: endpoint.chainId
          }
        }
      }

      chain.endpoints.push(newEndpoint as Endpoint)

      // Update legal endpoints cache
      newState.legalEndpoints = Array.from(newState.chains.values())
        .flatMap(c => c.endpoints)
    }

    newState.tiles.set(tile.id, tile)
    setGameState(newState)
  }

  const handleTileClick = (tile: Tile) => {
    if (gameState.currentPlayer !== 'player' || tile.placed) return

    // Try to find valid placement
    for (const endpoint of gameState.legalEndpoints) {
      const offset = getDirectionOffset(endpoint.facing)

      // Try both orientations
      const orientations: Array<'H' | 'V'> = ['H', 'V']

      for (const orientation of orientations) {
        tile.orientation = orientation

        // Calculate position based on endpoint and orientation
        let position: GridPosition

        if (orientation === 'H') {
          // For horizontal tiles (occupies 2 horizontal cells)
          if (endpoint.facing === 'E') {
            // Endpoint is facing east, new tile goes to the right
            position = { row: endpoint.row, col: endpoint.col + 1 }
          } else if (endpoint.facing === 'W') {
            // Endpoint is facing west, new tile goes to the left
            // Since tile occupies 2 cells, position is 2 cells left
            position = { row: endpoint.row, col: endpoint.col - 2 }
          } else {
            continue // Skip N/S facing for horizontal tiles
          }
        } else {
          // For vertical tiles (occupies 2 vertical cells)
          if (endpoint.facing === 'S') {
            // Endpoint is facing south, new tile goes below
            position = { row: endpoint.row + 1, col: endpoint.col }
          } else if (endpoint.facing === 'N') {
            // Endpoint is facing north, new tile goes above
            // Since tile occupies 2 cells, position is 2 cells up
            position = { row: endpoint.row - 2, col: endpoint.col }
          } else {
            continue // Skip E/W facing for vertical tiles
          }
        }

        // Try both pip orientations (normal and flipped)
        const originalLeft = tile.leftPips
        const originalRight = tile.rightPips

        // Try normal orientation
        const result1 = validateTilePlacement(tile, position, orientation)
        if (result1.isValid && result1.matchedEndpoint) {
          placeTile(tile, position, result1.matchedEndpoint)
          setPlayerHand(prev => prev.filter(t => t.id !== tile.id))
          setGameState(prev => ({ ...prev, currentPlayer: 'computer' }))
          setGameMessage(`You played ${tile.id}`)
          return
        }

        // Try flipped
        tile.leftPips = originalRight
        tile.rightPips = originalLeft
        const result2 = validateTilePlacement(tile, position, orientation)
        if (result2.isValid && result2.matchedEndpoint) {
          placeTile(tile, position, result2.matchedEndpoint)
          setPlayerHand(prev => prev.filter(t => t.id !== tile.id))
          setGameState(prev => ({ ...prev, currentPlayer: 'computer' }))
          setGameMessage(`You played ${tile.id}`)
          return
        }

        // Restore original pips
        tile.leftPips = originalLeft
        tile.rightPips = originalRight
      }
    }

    setGameMessage('Cannot play this tile!')
  }

  // Render the board grid
  const renderBoard = () => {
    const cells = []

    // Render grid cells
    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        const isCenter = row === CENTER_ROW && col === CENTER_COL
        cells.push(
          <div
            key={`cell-${row}-${col}`}
            className={`absolute border ${showDebug ? 'border-green-900/30' : 'border-transparent'}`}
            style={{
              left: col * CELL_SIZE_PX,
              top: row * CELL_SIZE_PX,
              width: CELL_SIZE_PX,
              height: CELL_SIZE_PX,
              backgroundColor: isCenter && showDebug ? 'rgba(255,255,0,0.1)' : undefined
            }}
          >
            {showDebug && (
              <div className="text-[8px] text-green-600/50">
                {row},{col}
              </div>
            )}
          </div>
        )
      }
    }

    // Render placed tiles
    gameState.tiles.forEach(tile => {
      if (tile.placed && tile.position) {
        const isHorizontal = tile.orientation === 'H'
        const left = tile.position.col * CELL_SIZE_PX
        const top = tile.position.row * CELL_SIZE_PX
        const width = isHorizontal ? CELL_SIZE_PX * 2 : CELL_SIZE_PX
        const height = isHorizontal ? CELL_SIZE_PX : CELL_SIZE_PX * 2

        cells.push(
          <div
            key={`tile-${tile.id}`}
            className="absolute flex items-center justify-center"
            style={{
              left,
              top,
              width,
              height,
              zIndex: 10
            }}
          >
            <div
              style={{
                transform: `${isHorizontal ? 'rotate(90deg)' : ''} scale(0.25)`
              }}
            >
              <DominoComponent
                domino={{
                  id: tile.id,
                  left: tile.leftPips,
                  right: tile.rightPips,
                  isDouble: tile.isDouble
                } as LegacyDomino}
              />
            </div>
          </div>
        )
      }
    })

    // Render endpoints in debug mode
    if (showDebug) {
      gameState.legalEndpoints.forEach((endpoint, i) => {
        const arrowChar = {
          'N': '↑',
          'S': '↓',
          'E': '→',
          'W': '←'
        }[endpoint.facing]

        cells.push(
          <div
            key={`endpoint-${i}`}
            className="absolute flex items-center justify-center bg-red-500/30 text-white text-xs font-bold"
            style={{
              left: endpoint.col * CELL_SIZE_PX,
              top: endpoint.row * CELL_SIZE_PX,
              width: CELL_SIZE_PX,
              height: CELL_SIZE_PX,
              zIndex: 20
            }}
          >
            <div>
              {arrowChar}
              <br />
              {endpoint.requiredPips}
            </div>
          </div>
        )
      })
    }

    return cells
  }

  return (
    <div className="fixed inset-0 bg-green-800 flex flex-col">
      {/* Header */}
      <div className="bg-black/30 p-2 flex justify-between items-center">
        <div className="text-white font-bold">DOMINO GRID v2</div>
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

      {/* Game Board */}
      <div className="flex-1 overflow-auto p-4">
        <div
          ref={boardRef}
          className="relative mx-auto"
          style={{
            width: BOARD_COLS * CELL_SIZE_PX,
            height: BOARD_ROWS * CELL_SIZE_PX,
            backgroundColor: 'rgba(0,0,0,0.1)'
          }}
        >
          {renderBoard()}
        </div>
      </div>

      {/* Player Hand */}
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
                    isDouble: tile.isDouble
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

export default DominoGameGrid2