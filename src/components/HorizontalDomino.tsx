'use client'

import React from 'react'

interface HorizontalDominoProps {
  left: number
  right: number
  onClick?: () => void
  className?: string
}

const HorizontalDomino: React.FC<HorizontalDominoProps> = ({
  left,
  right,
  onClick,
  className = ''
}) => {
  const renderDots = (value: number) => {
    const patterns: Record<number, React.JSX.Element[]> = {
      0: [],
      1: [<circle key="1" cx="25" cy="25" r="5" fill="#1a1a1a" />],
      2: [
        <circle key="1" cx="15" cy="15" r="5" fill="#1a1a1a" />,
        <circle key="2" cx="35" cy="35" r="5" fill="#1a1a1a" />
      ],
      3: [
        <circle key="1" cx="15" cy="15" r="5" fill="#1a1a1a" />,
        <circle key="2" cx="25" cy="25" r="5" fill="#1a1a1a" />,
        <circle key="3" cx="35" cy="35" r="5" fill="#1a1a1a" />
      ],
      4: [
        <circle key="1" cx="15" cy="15" r="5" fill="#1a1a1a" />,
        <circle key="2" cx="35" cy="15" r="5" fill="#1a1a1a" />,
        <circle key="3" cx="15" cy="35" r="5" fill="#1a1a1a" />,
        <circle key="4" cx="35" cy="35" r="5" fill="#1a1a1a" />
      ],
      5: [
        <circle key="1" cx="15" cy="15" r="5" fill="#1a1a1a" />,
        <circle key="2" cx="35" cy="15" r="5" fill="#1a1a1a" />,
        <circle key="3" cx="25" cy="25" r="5" fill="#1a1a1a" />,
        <circle key="4" cx="15" cy="35" r="5" fill="#1a1a1a" />,
        <circle key="5" cx="35" cy="35" r="5" fill="#1a1a1a" />
      ],
      6: [
        <circle key="1" cx="15" cy="12" r="5" fill="#1a1a1a" />,
        <circle key="2" cx="35" cy="12" r="5" fill="#1a1a1a" />,
        <circle key="3" cx="15" cy="25" r="5" fill="#1a1a1a" />,
        <circle key="4" cx="35" cy="25" r="5" fill="#1a1a1a" />,
        <circle key="5" cx="15" cy="38" r="5" fill="#1a1a1a" />,
        <circle key="6" cx="35" cy="38" r="5" fill="#1a1a1a" />
      ]
    }
    return patterns[value] || []
  }

  return (
    <div
      className={`cursor-pointer ${className}`}
      onClick={onClick}
      style={{ width: '120px', height: '60px' }}
    >
      <svg width="120" height="60" viewBox="0 0 120 60" style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))' }}>
        {/* Background with rounded corners like real dominoes */}
        <rect x="1" y="1" width="118" height="58" rx="6" ry="6" fill="#FFFEF0" stroke="#2C2C2C" strokeWidth="1.5" />
        {/* Left half */}
        <g transform="translate(10, 5)">
          {renderDots(left)}
        </g>

        {/* Dividing line */}
        <line x1="60" y1="5" x2="60" y2="55" stroke="#333" strokeWidth="2" />

        {/* Right half */}
        <g transform="translate(70, 5)">
          {renderDots(right)}
        </g>
      </svg>
    </div>
  )
}

export default HorizontalDomino