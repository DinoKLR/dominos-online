# Dominoes Online - Project Notes

## Design Principles
- **MOBILE-FIRST RESPONSIVE DESIGN** - Always design for mobile screens first, then adapt for desktop
- The game should work perfectly on phones before considering desktop layouts
- Touch-friendly interface with appropriately sized tap targets
- Responsive scaling for different screen sizes

## Technical Stack
- Next.js with TypeScript
- Tailwind CSS for styling
- Framer Motion for animations
- React hooks for state management

## Game Features
- Domino game with proper rules
- Computer AI opponent
- Boneyard for drawing tiles
- Score tracking (Fives to 100)
- Washing/shuffling animation

## Current Issues to Fix
1. Dominoes stacking instead of spreading horizontally
2. Need proper spinner rules (4-way play)
3. Need visual indicators for playable dominoes
4. Better boneyard selection UI
5. Implement scoring system

## Important Notes
- The game component is called DominoGameMobile for a reason - mobile first!
- Always test on mobile viewport sizes first
- Ensure touch interactions work smoothly