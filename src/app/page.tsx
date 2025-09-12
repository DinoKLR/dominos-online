'use client'

import React, { useState } from 'react'
import { Gamepad2, Users, Trophy, Settings } from 'lucide-react'
import DominoWashing from '@/components/DominoWashing'
import DominoComponent from '@/components/Domino'
import { createDominoSet } from '@/types/domino'

export default function Home() {
  const [gameMode, setGameMode] = useState<'lobby' | 'demo' | 'washing'>('lobby')
  const sampleDominoes = createDominoSet().slice(0, 7)

  if (gameMode === 'demo') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-700 to-green-500 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">NINJA BONES SHOWCASE</h1>
            <button
              onClick={() => setGameMode('lobby')}
              className="bg-white text-green-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Back to Lobby
            </button>
          </div>
          
          <div className="grid grid-cols-4 md:grid-cols-7 gap-4 justify-center">
            {sampleDominoes.map((domino) => (
              <div key={domino.id} className="flex justify-center">
                <DominoComponent domino={domino} showAnimation={true} />
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold text-green-400 mb-4">AUTHENTIC BONE PHYSICS</h2>
            <p className="text-white/90 max-w-2xl mx-auto font-semibold">
              Each bone is forged with authentic dot patterns and realistic 3D ninja styling. 
              Experience smooth combat animations and interactive gameplay that feels like real dojo battles!
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (gameMode === 'washing') {
    return (
      <DominoWashing
        onWashComplete={(dominoes) => {
          console.log('Washing complete:', dominoes)
          setTimeout(() => setGameMode('lobby'), 3000)
        }}
        washingPlayer="You"
        isCurrentPlayerWashing={true}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700">
      {/* Header */}
      <header className="border-b border-slate-600 bg-slate-800/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-green-400 to-cyan-500 p-3 rounded-xl shadow-lg shadow-green-500/50">
                <Gamepad2 className="w-8 h-8 text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">NINJA BONES</h1>
                <p className="text-green-400 text-sm font-semibold">For the Real Bone Slayers 🥷</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-white font-semibold">Welcome back!</div>
                <div className="text-slate-400 text-sm">Ready to play?</div>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-cyan-600 rounded-full flex items-center justify-center text-black font-bold shadow-lg shadow-green-500/50">
                N
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-cyan-400 to-green-400 mb-6">
            ENTER THE DOJO - SLING BONES LIKE A NINJA
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
            Step into the arena where only the strongest bone slayers survive! 
            Authentic ninja-style domino combat with realistic shuffling, fair selection, 
            and NO computer-generated hands. Challenge real warriors in our revolutionary 
            &quot;loser washes&quot; dojo system!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setGameMode('demo')}
              className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-400 hover:to-cyan-400 text-black px-8 py-3 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-green-500/50 border border-green-400"
            >
              View Ninja Bones
            </button>
            <button
              onClick={() => setGameMode('washing')}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black px-8 py-3 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/50 border border-cyan-400"
            >
              Try Ninja Washing
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-600 rounded-2xl p-8">
            <div className="bg-green-500/20 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
              <Users className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-green-400 mb-4">REAL WARRIORS ONLY</h3>
            <p className="text-slate-300">
              No bots, no fake ninjas. Every battle is against real bone slayers. 
              Challenge your crew or get matched with warriors at your skill level.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-600 rounded-2xl p-8">
            <div className="bg-yellow-500/20 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
              <Trophy className="w-8 h-8 text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold text-cyan-400 mb-4">PURE NINJA SKILL</h3>
            <p className="text-slate-300">
              Authentic bone shuffling where the defeated warrior washes. 
              No rigged algorithms - just pure ninja skill and dojo luck.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-600 rounded-2xl p-8">
            <div className="bg-blue-500/20 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
              <Settings className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-green-400 mb-4">ADVANCED DOJO TECH</h3>
            <p className="text-slate-300">
              Real-time ninja chat, combat emojis, warrior network, and sick graphics 
              that dominate on mobile and desktop.
            </p>
          </div>
        </div>

        {/* Game Mode Selection */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-600 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400 mb-6 text-center">CHOOSE YOUR BATTLE</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-black p-6 rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-green-500/50 border border-green-400">
              <h4 className="text-xl font-bold mb-2">QUICK BATTLE</h4>
              <p className="text-black/80 font-semibold">Get matched with a random warrior instantly</p>
            </button>
            <button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-black p-6 rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/50 border border-cyan-400">
              <h4 className="text-xl font-bold mb-2">CHALLENGE CREW</h4>
              <p className="text-black/80 font-semibold">Invite your ninja crew for private battles</p>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-600 bg-slate-900/50 backdrop-blur-sm py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-green-400 font-semibold">
            Forged by ninjas for authentic bone-slaying combat. No rigged hands, no bots, just pure dojo warfare! 🥷🎲
          </p>
        </div>
      </footer>
    </div>
  )
}
