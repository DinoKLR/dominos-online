// Grid-based Domino System Types
// Following DOMINO_GRID_SPEC.md

export type Orientation = 'H' | 'V' // Horizontal or Vertical
export type Direction = 'N' | 'E' | 'S' | 'W' // North, East, South, West
export type Rotation = 0 | 90 | 180 | 270

export interface GridPosition {
  row: number
  col: number
}

export interface Tile {
  id: string
  leftPips: number
  rightPips: number
  orientation: Orientation
  position: GridPosition | null // null if not placed
  rotation: Rotation
  placed: boolean
  isDouble: boolean
}

export interface BoardCell {
  tileId: string | null
  half: 0 | 1 // 0 = first half (left/top), 1 = second half (right/bottom)
}

export interface Endpoint {
  row: number
  col: number
  facing: Direction // direction outward from existing chain
  requiredPips: number // pips that must match on the attaching tile side
  chainId: string
  blocked?: boolean // true if too close to edge
}

export interface Segment {
  tileId: string
  placedAt: GridPosition
  orientation: Orientation
  connectingSide: 'left' | 'right' | 'top' | 'bottom'
}

export interface Chain {
  id: string
  segments: Segment[]
  endpoints: [Endpoint, Endpoint] | [Endpoint] | [] // can have 0-2 endpoints
  isClosed: boolean
}

export interface DragPreview {
  tileId: string | null
  position: GridPosition
  orientation: Orientation
  rotation: Rotation
  isLegal: boolean
  illegalReason?: string
}

export interface Rules {
  matchBothHalvesToEndpoint: boolean // standard: only touching half needs to match
  allowSideAdjacency: boolean // prevents parallel "brushing"
  doubleOpenStyle: 'cap' | 'cross' // how doubles work
  multiChain: boolean // support multiple trains
}

export interface GameState {
  boardRows: number
  boardCols: number
  cellSizePx: number
  boardMatrix: BoardCell[][] // [row][col]
  occupied: (BoardCell | null)[][] // mirror of boardMatrix for O(1) lookup
  tiles: Map<string, Tile>
  chains: Map<string, Chain>
  legalEndpoints: Endpoint[] // cache from chains
  dragging: DragPreview | null
  currentPlayer: string
  rules: Rules
}

// Helper type for validation results
export interface ValidationResult {
  isValid: boolean
  reason?: string
  matchedEndpoint?: Endpoint
}

// Constants
export const BOARD_ROWS = 40
export const BOARD_COLS = 60
export const CELL_SIZE_PX = 30
export const CENTER_ROW = Math.floor(BOARD_ROWS / 2)
export const CENTER_COL = Math.floor(BOARD_COLS / 2)

// Default rules
export const DEFAULT_RULES: Rules = {
  matchBothHalvesToEndpoint: false,
  allowSideAdjacency: false,
  doubleOpenStyle: 'cross',
  multiChain: false
}

// Utility functions for grid calculations
export function getTileOccupiedCells(tile: Tile): [GridPosition, GridPosition] | null {
  if (!tile.position) return null

  const { row, col } = tile.position

  if (tile.orientation === 'H') {
    // Horizontal: left half at (row, col), right half at (row, col+1)
    return [
      { row, col },
      { row, col: col + 1 }
    ]
  } else {
    // Vertical: top half at (row, col), bottom half at (row+1, col)
    return [
      { row, col },
      { row: row + 1, col }
    ]
  }
}

export function getOppositeDirection(dir: Direction): Direction {
  switch (dir) {
    case 'N': return 'S'
    case 'S': return 'N'
    case 'E': return 'W'
    case 'W': return 'E'
  }
}

export function getDirectionOffset(dir: Direction): GridPosition {
  switch (dir) {
    case 'N': return { row: -1, col: 0 }
    case 'S': return { row: 1, col: 0 }
    case 'E': return { row: 0, col: 1 }
    case 'W': return { row: 0, col: -1 }
  }
}

export function isAdjacent(pos1: GridPosition, pos2: GridPosition): boolean {
  const rowDiff = Math.abs(pos1.row - pos2.row)
  const colDiff = Math.abs(pos1.col - pos2.col)
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)
}

export function getPipsForDirection(tile: Tile, direction: Direction): number | null {
  // Determine which pip value is facing a given direction based on orientation
  if (tile.orientation === 'H') {
    // Horizontal: leftPips faces W, rightPips faces E
    if (direction === 'W') return tile.leftPips
    if (direction === 'E') return tile.rightPips
  } else {
    // Vertical: leftPips faces N, rightPips faces S
    if (direction === 'N') return tile.leftPips
    if (direction === 'S') return tile.rightPips
  }
  return null
}