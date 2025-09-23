'use client'

import React, { useState } from 'react'
import { Gamepad2, Users, Trophy, Settings } from 'lucide-react'
import DominoWashing from '@/components/DominoWashing'
import DominoComponent from '@/components/Domino'
import DominoGameMobile from '@/components/DominoGameMobile'
import DominoGameGrid from '@/components/DominoGameGrid'
import DominoGameGrid2 from '@/components/DominoGameGrid2'
import DominoGameGrid3 from '@/components/DominoGameGrid3'
import SimpleDominoGame from '@/components/SimpleDominoGame'
import SimpleDominoGameFixed from '@/components/SimpleDominoGameFixed'
import BasicDomino from '@/components/BasicDomino'
import WorkingDominoGame from '@/components/WorkingDominoGame'
import FinalWorkingDomino from '@/components/FinalWorkingDomino'
import TestDomino from '@/components/TestDomino'
import CleanDominoGame from '@/components/CleanDominoGame'
import ProperDominoGame from '@/components/ProperDominoGame'
import { createDominoSet } from '@/types/domino'

export default function Home() {
  const [gameMode, setGameMode] = useState<'lobby' | 'demo' | 'washing' | 'game' | 'grid' | 'grid2' | 'grid3' | 'simple' | 'fixed' | 'basic' | 'working' | 'final' | 'test' | 'clean' | 'proper'>('lobby')
  const sampleDominoes = [
    { id: '6-6', left: 6, right: 6, isDouble: true },
    { id: '5-5', left: 5, right: 5, isDouble: true },
    { id: '4-4', left: 4, right: 4, isDouble: true },
    { id: '3-3', left: 3, right: 3, isDouble: true },
    { id: '2-2', left: 2, right: 2, isDouble: true },
    { id: '1-1', left: 1, right: 1, isDouble: true },
    { id: '0-0', left: 0, right: 0, isDouble: true }
  ]

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

  if (gameMode === 'game') {
    return (
      <DominoGameMobile
        onGameEnd={(winner) => {
          console.log('Game ended, winner:', winner)
          setTimeout(() => setGameMode('lobby'), 3000)
        }}
        onBackToHome={() => setGameMode('lobby')}
      />
    )
  }

  if (gameMode === 'test') {
    return <TestDomino />
  }

  if (gameMode === 'grid') {
    return (
      <DominoGameGrid
        onGameEnd={(winner) => {
          console.log('Game ended, winner:', winner)
          setTimeout(() => setGameMode('lobby'), 3000)
        }}
        onBackToHome={() => setGameMode('lobby')}
      />
    )
  }

  if (gameMode === 'grid2') {
    return (
      <DominoGameGrid2
        onGameEnd={(winner) => {
          console.log('Game ended, winner:', winner)
          setTimeout(() => setGameMode('lobby'), 3000)
        }}
        onBackToHome={() => setGameMode('lobby')}
      />
    )
  }

  if (gameMode === 'grid3') {
    return (
      <DominoGameGrid3
        onGameEnd={(winner) => {
          console.log('Game ended, winner:', winner)
          setTimeout(() => setGameMode('lobby'), 3000)
        }}
        onBackToHome={() => setGameMode('lobby')}
      />
    )
  }

  if (gameMode === 'simple') {
    return (
      <SimpleDominoGame
        onGameEnd={(winner) => {
          console.log('Game ended, winner:', winner)
          setTimeout(() => setGameMode('lobby'), 3000)
        }}
        onBackToHome={() => setGameMode('lobby')}
      />
    )
  }

  if (gameMode === 'fixed') {
    return (
      <SimpleDominoGameFixed
        onGameEnd={(winner) => {
          console.log('Game ended, winner:', winner)
          setTimeout(() => setGameMode('lobby'), 3000)
        }}
        onBackToHome={() => setGameMode('lobby')}
      />
    )
  }

  if (gameMode === 'basic') {
    return (
      <BasicDomino
        onGameEnd={(winner) => {
          console.log('Game ended, winner:', winner)
          setTimeout(() => setGameMode('lobby'), 3000)
        }}
        onBackToHome={() => setGameMode('lobby')}
      />
    )
  }

  if (gameMode === 'working') {
    return (
      <WorkingDominoGame
        onGameEnd={(winner) => {
          console.log('Game ended, winner:', winner)
          setTimeout(() => setGameMode('lobby'), 3000)
        }}
        onBackToHome={() => setGameMode('lobby')}
      />
    )
  }

  if (gameMode === 'final') {
    return (
      <FinalWorkingDomino
        onGameEnd={(winner) => {
          console.log('Game ended, winner:', winner)
          setTimeout(() => setGameMode('lobby'), 3000)
        }}
        onBackToHome={() => setGameMode('lobby')}
      />
    )
  }

  if (gameMode === 'clean') {
    return (
      <CleanDominoGame
        onGameEnd={(winner) => {
          console.log('Game ended, winner:', winner)
          setTimeout(() => setGameMode('lobby'), 3000)
        }}
        onBackToHome={() => setGameMode('lobby')}
      />
    )
  }

  if (gameMode === 'proper') {
    return (
      <ProperDominoGame
        onGameEnd={(winner) => {
          console.log('Game ended, winner:', winner)
          setTimeout(() => setGameMode('lobby'), 3000)
        }}
        onBackToHome={() => setGameMode('lobby')}
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
                <div className="w-8 h-8 text-black flex items-center justify-center">
                  <svg viewBox="0 0 60 120" className="w-6 h-12">
                    {/* Vertical domino background */}
                    <rect x="5" y="5" width="50" height="110" fill="white" stroke="black" strokeWidth="3" rx="8"/>
                    
                    {/* Top half - 5 dots */}
                    <circle cx="18" cy="20" r="3" fill="black"/>
                    <circle cx="42" cy="20" r="3" fill="black"/>
                    <circle cx="30" cy="30" r="3" fill="black"/>
                    <circle cx="18" cy="40" r="3" fill="black"/>
                    <circle cx="42" cy="40" r="3" fill="black"/>
                    
                    {/* Center dividing line */}
                    <line x1="5" y1="60" x2="55" y2="60" stroke="black" strokeWidth="2"/>
                    
                    {/* Bottom half - 5 dots */}
                    <circle cx="18" cy="75" r="3" fill="black"/>
                    <circle cx="42" cy="75" r="3" fill="black"/>
                    <circle cx="30" cy="85" r="3" fill="black"/>
                    <circle cx="18" cy="95" r="3" fill="black"/>
                    <circle cx="42" cy="95" r="3" fill="black"/>
                  </svg>
                </div>
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
            ENTER THE DOJO - SLANG BONES LIKE A NINJA
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
            Step into the arena where only the strongest bone slayers survive! 
            Authentic ninja-style domino combat with realistic shuffling, fair selection, 
            and NO computer-generated hands. Challenge real warriors in our revolutionary 
            &quot;loser washes&quot; dojo system!
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            <button
              onClick={() => setGameMode('proper')}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black px-8 py-3 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/50 border-4 border-yellow-300 col-span-2"
            >
              ⭐ BEST - PROPER VERSION ⭐
            </button>
            <button
              onClick={() => setGameMode('clean')}
              className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white px-8 py-3 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-amber-500/50 border border-amber-400"
            >
              🆕 CLEAN VERSION
            </button>
            <button
              onClick={() => setGameMode('final')}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white px-8 py-3 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-green-500/50 border border-green-400"
            >
              🎯 FINAL VERSION
            </button>
            <button
              onClick={() => setGameMode('working')}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-8 py-3 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-red-500/50 border border-red-400"
            >
              ✅ WORKING GAME
            </button>
            <button
              onClick={() => setGameMode('basic')}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white px-8 py-3 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-purple-500/50 border border-purple-400"
            >
              🎲 BASIC LINE (SIMPLE)
            </button>
            <button
              onClick={() => setGameMode('fixed')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-8 py-3 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-blue-500/50 border border-blue-400"
            >
              ✨ FIXED GAME (WORKS!)
            </button>
            <button
              onClick={() => setGameMode('simple')}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white px-8 py-3 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-emerald-500/50 border border-emerald-400"
            >
              🎯 SIMPLE GAME (NEW)
            </button>
            <button
              onClick={() => setGameMode('grid3')}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white px-8 py-3 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-green-500/50 border border-green-400"
            >
              ✅ GRID V3 (FIXED)
            </button>
            <button
              onClick={() => setGameMode('grid2')}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white px-8 py-3 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-red-500/50 border border-red-400"
            >
              🎮 GRID SYSTEM V2
            </button>
            <button
              onClick={() => setGameMode('grid')}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black px-8 py-3 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-yellow-500/50 border border-yellow-400"
            >
              🎯 NEW GRID GAME
            </button>
            <button
              onClick={() => setGameMode('game')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-black px-8 py-3 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-purple-500/50 border border-purple-400"
            >
              🥷 Fight Computer Ninja
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
            Forged by ninjas for authentic bone-slaying combat. No rigged hands, no bots, just pure dojo warfare! 🥷⚁
          </p>
        </div>
      </footer>
    </div>
  )
}
