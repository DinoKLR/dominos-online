'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Domino as DominoType } from '@/types/domino'

interface DominoProps {
  domino: DominoType
  faceDown?: boolean
  onClick?: () => void
  className?: string
  showAnimation?: boolean
}

const DominoComponent: React.FC<DominoProps> = ({ 
  domino, 
  faceDown = false, 
  onClick, 
  className = '',
  showAnimation = false 
}) => {
  const renderDots = (number: number, position: 'left' | 'right') => {
    const dots = []
    const dotPositions: Record<number, { x: number; y: number }[]> = {
      0: [],
      1: [{ x: 50, y: 50 }],
      2: [{ x: 30, y: 30 }, { x: 70, y: 70 }],
      3: [{ x: 30, y: 30 }, { x: 50, y: 50 }, { x: 70, y: 70 }],
      4: [{ x: 30, y: 30 }, { x: 70, y: 30 }, { x: 30, y: 70 }, { x: 70, y: 70 }],
      5: [{ x: 30, y: 30 }, { x: 70, y: 30 }, { x: 50, y: 50 }, { x: 30, y: 70 }, { x: 70, y: 70 }],
      6: [{ x: 30, y: 25 }, { x: 70, y: 25 }, { x: 30, y: 50 }, { x: 70, y: 50 }, { x: 30, y: 75 }, { x: 70, y: 75 }]
    }

    const positions = dotPositions[number] || []
    
    return positions.map((pos, i) => (
      <circle
        key={i}
        cx={pos.x}
        cy={pos.y}
        r="6"
        fill="#2c3e50"
        className="domino-dot"
      />
    ))
  }

  const MotionDiv = showAnimation ? motion.div : 'div'
  const motionProps = showAnimation ? {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  } : {}

  return (
    <MotionDiv
      className={`domino-tile cursor-pointer select-none ${className}`}
      onClick={onClick}
      {...motionProps}
    >
      <div className="relative">
        {faceDown ? (
          <div className="domino-back w-20 h-40 bg-gradient-to-br from-red-900 to-red-700 rounded-lg border-4 border-red-800 shadow-lg flex items-center justify-center">
            <div className="w-12 h-32 bg-gradient-to-b from-red-800 to-red-600 rounded border border-red-700 flex items-center justify-center">
              <div className="text-red-300 text-xs font-bold opacity-30">DOMINO</div>
            </div>
          </div>
        ) : (
          <div className="domino-face w-20 h-40 bg-gradient-to-br from-ivory to-white rounded-lg border-4 border-gray-400 shadow-lg relative overflow-hidden">
            {/* Top half */}
            <div className="relative w-full h-20 flex items-center justify-center border-b-2 border-gray-400">
              <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute">
                {renderDots(domino.left, 'left')}
              </svg>
            </div>
            
            {/* Bottom half */}
            <div className="relative w-full h-20 flex items-center justify-center">
              <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute">
                {renderDots(domino.right, 'right')}
              </svg>
            </div>
            
            {/* Subtle texture overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent pointer-events-none rounded-lg"></div>
          </div>
        )}
      </div>
    </MotionDiv>
  )
}

export default DominoComponent