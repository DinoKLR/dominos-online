'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Domino as DominoType, createDominoSet } from '@/types/domino'
import DominoComponent from './Domino'

interface DominoWashingProps {
  onWashComplete: (dominoes: DominoType[]) => void
  washingPlayer: string
  isCurrentPlayerWashing: boolean
}

const DominoWashing: React.FC<DominoWashingProps> = ({
  onWashComplete,
  washingPlayer,
  isCurrentPlayerWashing
}) => {
  const [dominoes, setDominoes] = useState<DominoType[]>([])
  const [isWashing, setIsWashing] = useState(false)
  const [timeLeft, setTimeLeft] = useState(7)
  const [washingComplete, setWashingComplete] = useState(false)
  const washAreaRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout>(null)

  useEffect(() => {
    // Initialize dominoes with random positions
    const newDominoes = createDominoSet().map((domino, index) => ({
      ...domino,
      x: Math.random() * 400 + 50,
      y: Math.random() * 300 + 50,
      rotation: Math.random() * 360
    }))
    setDominoes(newDominoes)
  }, [])

  useEffect(() => {
    if (isCurrentPlayerWashing && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      autoCompleteWash()
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [timeLeft, isCurrentPlayerWashing])

  const shuffleDominoes = () => {
    if (!isCurrentPlayerWashing) return

    setIsWashing(true)
    
    // Animate dominoes to new random positions
    const shuffledDominoes = dominoes.map(domino => ({
      ...domino,
      x: Math.random() * 400 + 50,
      y: Math.random() * 300 + 50,
      rotation: Math.random() * 360
    }))
    
    setDominoes(shuffledDominoes)
    
    setTimeout(() => {
      setIsWashing(false)
    }, 500)
  }

  const autoCompleteWash = () => {
    setWashingComplete(true)
    
    // Final shuffle and organize
    const finalDominoes = createDominoSet().map((domino, index) => {
      const angle = (index / 28) * 2 * Math.PI
      const radius = 120
      return {
        ...domino,
        x: 250 + radius * Math.cos(angle),
        y: 200 + radius * Math.sin(angle),
        rotation: 0
      }
    })
    
    setDominoes(finalDominoes)
    
    setTimeout(() => {
      onWashComplete(finalDominoes)
    }, 2000)
  }

  const handleWashAreaClick = (e: React.MouseEvent) => {
    if (!isCurrentPlayerWashing || washingComplete) return
    
    const rect = washAreaRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Create ripple effect at click position
    shuffleDominoes()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-black via-slate-900 to-black p-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400 mb-2">NINJA BONE WASHING 🥷</h2>
        {isCurrentPlayerWashing ? (
          <div className="bg-gradient-to-r from-green-500 to-cyan-500 text-black px-6 py-3 rounded-lg font-bold border border-green-400 shadow-lg shadow-green-500/50">
            YOUR TURN TO WASH - Click to shuffle the bones like a true ninja!
          </div>
        ) : (
          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-6 py-3 rounded-lg font-bold border border-cyan-400 shadow-lg shadow-cyan-500/50">
            {washingPlayer} is washing the bones in the dojo...
          </div>
        )}
      </div>

      {/* Timer */}
      {isCurrentPlayerWashing && !washingComplete && (
        <div className="mb-4">
          <div className="bg-gradient-to-r from-green-400 to-cyan-400 rounded-full p-4 shadow-lg border-4 border-green-500">
            <div className={`text-4xl font-bold ${timeLeft <= 3 ? 'text-black animate-pulse' : 'text-black'}`}>
              {timeLeft}
            </div>
          </div>
        </div>
      )}

      {/* Ninja Dojo Training Area */}
      <div 
        ref={washAreaRef}
        className="relative bg-gradient-to-br from-slate-800 to-black border-8 border-green-400 rounded-2xl shadow-2xl cursor-pointer shadow-green-500/50"
        style={{ width: '500px', height: '400px' }}
        onClick={handleWashAreaClick}
      >
        {/* Boxing ring mat texture overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black rounded-xl opacity-95 pointer-events-none">
          {/* Ring rope lines */}
          <div className="absolute top-8 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-cyan-400 shadow-lg shadow-green-400/50"></div>
          <div className="absolute bottom-8 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-cyan-400 shadow-lg shadow-green-400/50"></div>
          <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-cyan-400 shadow-lg shadow-green-400/50"></div>
          <div className="absolute right-8 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-cyan-400 shadow-lg shadow-green-400/50"></div>
        </div>
        
        {/* Dominoes */}
        <AnimatePresence>
          {dominoes.map((domino, index) => (
            <motion.div
              key={domino.id}
              className="absolute"
              initial={{ 
                x: domino.x, 
                y: domino.y, 
                rotate: domino.rotation || 0 
              }}
              animate={{ 
                x: domino.x, 
                y: domino.y, 
                rotate: domino.rotation || 0 
              }}
              transition={{ 
                duration: 0.5,
                type: "spring",
                damping: 10
              }}
              style={{
                left: `${domino.x}px`,
                top: `${domino.y}px`,
                transform: `translate(-50%, -50%) rotate(${domino.rotation || 0}deg)`,
                zIndex: washingComplete ? 28 - index : Math.floor(Math.random() * 10)
              }}
            >
              <div className="scale-75">
                <DominoComponent 
                  domino={domino} 
                  faceDown={!washingComplete}
                  showAnimation={false}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Instructions overlay */}
        {isCurrentPlayerWashing && !washingComplete && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-gradient-to-r from-green-500/90 to-cyan-500/90 text-black px-6 py-3 rounded-lg text-center border border-green-400 shadow-lg">
              <div className="text-lg font-bold mb-2">🥷 CLICK TO SHUFFLE THE BONES!</div>
              <div className="text-sm font-semibold">Mix them well before time runs out, ninja!</div>
            </div>
          </div>
        )}

        {/* Washing complete message */}
        {washingComplete && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-green-500 to-cyan-500 text-black px-8 py-4 rounded-lg text-center shadow-xl border-2 border-green-400"
            >
              <div className="text-2xl font-bold mb-2">🥷 BONE WASHING COMPLETE!</div>
              <div className="text-lg font-semibold">Ready for ninja bone selection...</div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Bottom instructions */}
      <div className="mt-6 max-w-lg text-center">
        <p className="text-green-400 font-semibold">
          🥷 The defeated warrior from the previous battle must wash the bones. 
          Click around the dojo to shuffle them like a true ninja. 
          {isCurrentPlayerWashing ? " You have 10 seconds to prove your worth!" : " Watch the ninja work!"}
        </p>
      </div>
    </div>
  )
}

export default DominoWashing