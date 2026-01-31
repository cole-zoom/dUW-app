"use client"

import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/Theme/theme-toggle'
import { useStackApp } from "@stackframe/stack"
import { PixelText } from '@/components/8bit/PixelLetter'
import { PixelGradientCSS, ScanlineOverlay } from '@/components/8bit/PixelBackground'

export default function LandingPage() {
  const { theme } = useTheme()
  const app = useStackApp()

  const handleAuth = async (mode: 'signin' | 'signup') => {
    if (!app) {
      alert("Authentication not configured. Check console for details.")
      return
    }

    try {
      if (mode === 'signin') {
        await app.redirectToSignIn()
      } else {
        await app.redirectToSignUp()
      }
    } catch (error) {
      console.error("Authentication redirect failed:", error)
      alert(`Authentication failed: ${error}`)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated 8-bit gradient background */}
      <PixelGradientCSS />

      {/* Pixel grid overlay */}
      <div className="absolute inset-0 pixel-grid-overlay" />

      {/* Scanline effect */}
      <ScanlineOverlay className="z-10" />

      {/* Content */}
      <div className="relative z-20 min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="w-full p-4 sm:p-6">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-white font-mono text-lg tracking-wider">dUW</span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <button
                onClick={() => handleAuth('signin')}
                className="pixel-button text-sm"
              >
                Log In
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* 8-bit Title */}
            <div className="mb-8 flex flex-col items-center gap-4">
              <PixelText text="DUWILIGENCE" size={48} className="flex-wrap justify-center" />
            </div>

            {/* Subtitle */}
            <p className="font-mono text-white/80 text-lg sm:text-xl mb-12 max-w-xl mx-auto tracking-wide">
              Portfolio-Specific Newsletter
            </p>

            {/* 8-bit styled CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button
                onClick={() => handleAuth('signup')}
                className="pixel-button text-base px-8 py-4"
              >
                Get Started
              </button>
            </div>
          </div>

          {/* Decorative 8-bit elements */}
          <div className="mt-16 flex gap-8 opacity-60">
            <div className="w-4 h-4 bg-[#5A7A60]" />
            <div className="w-4 h-4 bg-[#A5859F]" />
            <div className="w-4 h-4 bg-white" />
            <div className="w-4 h-4 bg-[#A5859F]" />
            <div className="w-4 h-4 bg-[#5A7A60]" />
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full p-6 text-center">
          <p className="font-mono text-white/50 text-sm">
            2025 Duwiligence
          </p>
        </footer>
      </div>

      {/* Animated floating pixels decoration */}
      <FloatingPixels />
    </div>
  )
}

// Animated floating pixel decorations
function FloatingPixels() {
  const pixels = [
    { size: 12, x: '10%', y: '20%', delay: 0, color: '#5A7A60' },
    { size: 8, x: '85%', y: '15%', delay: 1, color: '#A5859F' },
    { size: 16, x: '75%', y: '70%', delay: 2, color: '#5A7A60' },
    { size: 10, x: '15%', y: '75%', delay: 0.5, color: '#A5859F' },
    { size: 14, x: '90%', y: '45%', delay: 1.5, color: '#5A7A60' },
    { size: 8, x: '5%', y: '50%', delay: 2.5, color: '#A5859F' },
  ]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-5">
      {pixels.map((pixel, index) => (
        <div
          key={index}
          className="absolute animate-pulse"
          style={{
            width: pixel.size,
            height: pixel.size,
            left: pixel.x,
            top: pixel.y,
            backgroundColor: pixel.color,
            animationDelay: `${pixel.delay}s`,
            animationDuration: '3s',
            opacity: 0.4,
          }}
        />
      ))}
    </div>
  )
}
