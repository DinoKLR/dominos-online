'use client'

import React from 'react'

const TestDomino = () => {
  const dominoes = [
    { id: '1', x: 30, y: 50 },
    { id: '2', x: 40, y: 50 },
    { id: '3', x: 50, y: 50 },
    { id: '4', x: 60, y: 50 },
    { id: '5', x: 70, y: 50 }
  ]

  return (
    <div className="fixed inset-0 bg-green-800">
      <div className="text-white text-center p-4">Test Domino Positioning</div>

      {/* Test dominoes with absolute positioning */}
      {dominoes.map((d) => (
        <div
          key={d.id}
          className="absolute bg-white border-2 border-black"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: '60px',
            height: '120px',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="text-black text-center mt-4">{d.id}</div>
        </div>
      ))}
    </div>
  )
}

export default TestDomino