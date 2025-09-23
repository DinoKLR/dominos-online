# Dominoes Grid System Implementation Plan

## Overview
Complete refactor of the current domino placement system to implement a deterministic grid-based system with chain tracking and legal move validation as per DOMINO_GRID_SPEC.md

## Phase 1: Core Data Structures (Foundation)
### Goal: Establish the fundamental data models and board representation

1. **Board Matrix Setup**
   - Create 60x40 cell board matrix
   - Each cell can hold: `{ tileId: string | null, half: 0 | 1 }`
   - Define CSS variable `--cell-size: 30px` for consistent sizing

2. **Tile Model Enhancement**
   - Update Tile interface with orientation ('H'|'V'), position, rotation
   - Add placed boolean flag
   - Ensure isDouble flag is properly set

3. **State Management Structure**
   - Create GameState with boardMatrix, tiles Map, chains Map
   - Add occupied 2D array for O(1) collision checks
   - Initialize legalEndpoints cache

## Phase 2: Chain Graph System
### Goal: Implement chain tracking and endpoint management

1. **Chain Data Structure**
   - Create Chain class with segments and endpoints
   - Implement Endpoint with row, col, facing direction, requiredPips

2. **Chain Operations**
   - Initialize first chain when first domino is placed
   - Add methods to extend chains with new segments
   - Update endpoints when tiles are placed

3. **Endpoint Management**
   - Maintain legalEndpoints cache
   - Calculate facing directions based on tile placement
   - Track requiredPips for matching

## Phase 3: Legal Move Validation
### Goal: Implement comprehensive move validation logic

1. **Occupancy Checks**
   - Check if target cells are within bounds
   - Verify cells are not already occupied

2. **Adjacency Validation**
   - Check if tile touches exactly one endpoint
   - Ensure orthogonal adjacency only (no diagonals)

3. **Pip Matching**
   - Verify touching pip matches endpoint.requiredPips
   - Handle orientation-based pip facing

4. **Orientation Validation**
   - Ensure tile orientation allows connection to endpoint
   - Validate rotation makes sense for endpoint facing

## Phase 4: Grid Snapping & Placement
### Goal: Implement snap-to-grid mechanics

1. **Grid Coordinate Conversion**
   - Convert screen coordinates to grid cells
   - Calculate nearest valid anchor point

2. **Snap Preview**
   - Show ghost tile at snap position
   - Visual indicators for valid/invalid placement

3. **Placement Execution**
   - Update boardMatrix with both tile halves
   - Update chain graph
   - Recalculate legal endpoints

## Phase 5: UI Rendering System
### Goal: Create clean visual representation

1. **Grid Rendering**
   - CSS Grid or absolute positioning with --cell-size
   - Debug grid lines (toggleable)

2. **Tile Rendering**
   - Position tiles based on grid coordinates
   - Handle H/V orientation display
   - Proper rotation transforms

3. **Visual Feedback**
   - Highlight legal placement zones
   - Show endpoint markers in debug mode
   - Invalid placement indicators

## Phase 6: Special Rules & Features
### Goal: Handle doubles and advanced placement rules

1. **Double Domino Rules**
   - Implement perpendicular placement for doubles
   - Support 'cap' and 'cross' styles
   - Handle endpoint branching for cross style

2. **Turn/Bend Support**
   - Allow chains to change direction
   - Update facing when tiles create turns

3. **Edge Detection**
   - Mark endpoints as blocked near board edges
   - Prevent illegal placements that would go out of bounds

## Phase 7: Testing & Debug Tools
### Goal: Ensure system reliability

1. **Debug Overlay**
   - Show grid coordinates
   - Display endpoint markers with facing arrows
   - Highlight occupied cells

2. **Validation Testing**
   - Test all placement scenarios
   - Verify no overlaps possible
   - Check chain continuity

3. **Performance Optimization**
   - Ensure O(1) lookups
   - No DOM queries during validation
   - Efficient state updates

## Implementation Order & Priority

### Critical Path (Must Complete First):
1. Board Matrix & Core Data Structures
2. Basic Occupancy Checking
3. Simple Grid Rendering

### Core Functionality:
4. Chain Graph Implementation
5. Legal Move Validation
6. Grid Snapping System
7. Proper Tile Rendering

### Enhanced Features:
8. Double Domino Rules
9. Visual Feedback System
10. Debug Tools

### Polish:
11. Animations
12. Sound Effects
13. Rule Variants

## Technical Decisions

1. **State Management**: Use React state with immutable updates
2. **Coordinate System**: Row-major indexing (row, col)
3. **Rendering**: CSS Grid for board, absolute positioning for tiles
4. **Collision Detection**: Pure state-based, no DOM queries
5. **Chain Tracking**: Directed graph with endpoint caching

## Risk Mitigation

1. **Overlap Prevention**: Strict occupancy checking before any placement
2. **State Consistency**: Single source of truth in boardMatrix
3. **Performance**: O(1) operations, avoid full board scans
4. **Edge Cases**: Comprehensive validation for board boundaries

## Success Criteria

- [ ] No overlapping dominoes possible
- [ ] All legal moves correctly identified
- [ ] Chain continuity maintained
- [ ] Doubles handled per rules
- [ ] Grid snapping works smoothly
- [ ] Performance remains fast with full board
- [ ] State can be serialized/restored