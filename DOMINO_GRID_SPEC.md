# SYSTEM INTENT FOR CLAUDE CODE — DOMINOES BOARD LAYOUT (NEXT.JS + CSS/JS)

You are building the board and tile-placement system for a dominoes game (Next.js, JS, CSS). Focus on correct geometry, legal moves, and zero overlap. Do not change tech choices. Ask questions only if absolutely necessary; otherwise follow this spec.

## 1) Coordinate System & Grid

Use a discrete grid as the single source of truth. One "pip cell" is the base unit.

Each domino occupies exactly 2 contiguous cells (2×1 if horizontal, 1×2 if vertical).

Define a board matrix sized generously (e.g., 60×40 cells) so trains can bend.

Keep an immutable cell size --cell (CSS variable) and render the grid with CSS Grid or absolutely positioned cells using that size for snapping.

Maintain two representations in state:
- `boardMatrix[row][col] → { tileId | null, half: 0|1 }`
- A graph of chains (see §4) describing legal endpoints and directions.

## 2) Tile Model

```
Tile: {
  id,
  leftPips,
  rightPips,
  orientation: 'H'|'V',
  position: {row, col},
  rotation: 0|90|180|270,
  placed: boolean,
  isDouble: boolean
}
```

For horizontal (H) tiles:
- The left half occupies (row, col), the right half occupies (row, col+1).

For vertical (V) tiles:
- The top half occupies (row, col), the bottom half occupies (row+1, col).

Pip semantics:
- For H: leftPips faces west side, rightPips faces east side.
- For V: leftPips faces north side, rightPips faces south side.
- A double is leftPips === rightPips with isDouble = true.

## 3) Drag/Snap & Hit-Testing

Allow free drag in screen coords, but on drop:
1. Convert pointer coords → nearest grid anchor (top-left cell for the tile).
2. Compute the occupied cell pair from the anchor + orientation.
3. Run validation (collision, bounds, legality) before committing placement.

No partial overlap is ever allowed:
- Reject if either occupied cell is out of bounds or boardMatrix not null.

After a valid place, update:
- boardMatrix (mark both halves)
- the chain graph (add/close endpoints)
- the current legal endpoints cache (see §4)

## 4) Chain Graph & Legal Endpoints

Represent the layout as one or more chains (paths). Each chain has:

```
Chain {
  id
  segments: Array<Segment> // each segment references a Tile (id) and its placing direction
  endpoints: [Endpoint, Endpoint] // two ends unless closed by a double
}

Endpoint {
  row, col,     // grid coordinate of the open end "node"
  facing: 'N'|'E'|'S'|'W', // direction outward from existing chain
  requiredPips: number      // pips that must match on the attaching tile side
}
```

Initial start: the first tile starts a chain with two endpoints (one each side).

Placing a tile extends exactly one endpoint (unless placing a double as a "cap").

Doubles rule:
- A double is placed perpendicular to the chain's direction at the endpoint.
- When placed, it temporarily creates two sub-endpoints that must be satisfied (depending on rule set).
- For classic rules, the double "opens" cross flow; for simplified play, treat it as a cap that requires the next tile to match the same pips and proceed orthogonally.
- Encode your variant as config: `rules.doubleOpenStyle: 'cap'|'cross'`.

## 5) Legality Checks (exact sequence)

Given a dragged tile with known orientation and a candidate anchor:

1. **Compute Occupancy**: Get the 2 target cells. If either is OOB or occupied → reject.

2. **Adjacency to Chain**: Identify which endpoint this placement would connect to:
   - The touching half of the new tile must abut the endpoint cell in the opposite direction of the endpoint's facing
   - Use orthogonal adjacency only (no diagonals)

3. **Pip Match**:
   - Determine which half is touching the endpoint
   - The pip value on the touching side of the new tile must equal endpoint.requiredPips

4. **Orientation & Facing**:
   - The tile's orientation/rotation must place its touching half on the endpoint side

5. **Side-Bump Safety**: Prevent illegal side adjacency that touches other tiles not part of this connection

6. **Update State On Success**:
   - Write the tile halves to boardMatrix
   - Append tile as a new Segment to the chain
   - Replace the consumed endpoint with a new endpoint at the far half
   - Handle doubles per configured rule

## 6) Overlap & Collision Prevention (deterministic)

Keep a constant-time occupancy map:
```
occupied[row][col] = { tileId, half } | null
```

All placement decisions consult only this map + chain endpoints.
Never rely on DOM overlap; geometry is dictated by the grid state.

## 7) Bending Paths (Turns)

Turns occur naturally because each placement uses the endpoint's current facing.

When a player rotates a tile before dropping, the endpoint facing constrains which rotations are legal.

For UI, preview a ghost tile snapped to the candidate anchor; invalidate visually if illegal.

## 8) Z-Index & Rendering Order

Render tiles in placement order; set a base stacking context so later tiles appear above earlier.

While dragging, raise the dragged tile's z-index; revert on drop/cancel.

## 9) Edge/Boundary Behavior

If an endpoint is too close to the board edge to accept any legal orientation, mark it blocked.

Provide a soft "nudge" tool (optional) that shifts the entire chain within the matrix if needed.

## 10) Rule Variants (configurable)

```
rules.matchBothHalvesToEndpoint = false // standard: only touching half needs to match
rules.allowSideAdjacency = false // prevents parallel "brushing"
rules.doubleOpenStyle = 'cap'|'cross'
rules.multiChain = true // support multiple trains if needed
```

## 11) State Shape (example)

```
GameState {
  boardRows, boardCols, cellSizePx,
  occupied: 2D array,
  tiles: Map<tileId, Tile>,
  chains: Map<chainId, Chain>,
  legalEndpoints: Array<Endpoint>, // cache from chains
  dragging: { tileId|null, preview: {row,col,orientation,isLegal} }
}
```

All legality checks operate purely on occupied + legalEndpoints.
Rendering reads from tiles + occupied.

## 12) UX Cues

- While dragging: show snap preview and illegal reasons
- On drop fail: animate shake and keep tile in rack
- On drop success: commit, update endpoints, announce new open pips

## 13) Deterministic Rotation & Snapping

Rotation cycles 0→90→180→270 with key or UI button while dragging.

Snap position is always computed from the half that will touch the endpoint.

## 14) Testing Hooks

Provide debug overlay to:
- Draw endpoint markers (arrow for facing, label for requiredPips)
- Toggle cell indexes to spot off-by-one
- Highlight illegal side adjacency

## 15) Persistence

Serialize:
- Tiles: id, row, col, orientation, rotation
- Chains: ordered list of tileIds + endpoints snapshot

On load, rebuild occupied and legalEndpoints from chains.

## 16) Performance

- Keep all checks O(1): at most 6 neighbor lookups
- Avoid DOM queries during legality; rely on state only

## 17) What NOT to do

- Don't compute geometry from DOM rectangles
- Don't allow partial cell offsets; always snap to grid
- Don't infer legal endpoints by scanning the whole board each time; maintain the endpoint cache