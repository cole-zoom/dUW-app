"use client"

import React, { useEffect, useState } from 'react'

interface PixelBackgroundProps {
  className?: string
}

export function PixelBackground({ className = '' }: PixelBackgroundProps) {
  const [frame, setFrame] = useState(0)

  // Animate at 8-bit style frame rate (slower, choppy)
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % 4)
    }, 500) // 2 fps for that retro feel
    return () => clearInterval(interval)
  }, [])

  // Color palette - using app colors
  const colors = [
    'hsl(213, 11%, 13%)',   // Deep night blue-gray (background)
    'hsl(214, 11%, 20%)',   // Slightly lighter
    'hsl(214, 11%, 27%)',   // Shadow gray
    'hsl(205, 33%, 35%)',   // Muted blue hint
  ]

  const pixelSize = 40
  const cols = Math.ceil(1920 / pixelSize) + 1
  const rows = Math.ceil(1080 / pixelSize) + 1

  // Generate pixel grid with animated gradient
  const pixels: React.ReactNode[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Create diagonal gradient effect with animation
      const diagonalPos = (row + col + frame) % (colors.length * 2)
      const colorIndex = diagonalPos < colors.length
        ? diagonalPos
        : colors.length * 2 - diagonalPos - 1

      // Add some randomness for that 8-bit dither effect
      const noise = ((row * 7 + col * 13) % 3) - 1
      const finalColorIndex = Math.max(0, Math.min(colors.length - 1, colorIndex + noise))

      pixels.push(
        <rect
          key={`${row}-${col}`}
          x={col * pixelSize}
          y={row * pixelSize}
          width={pixelSize}
          height={pixelSize}
          fill={colors[finalColorIndex]}
        />
      )
    }
  }

  return (
    <svg
      className={`absolute inset-0 w-full h-full ${className}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ minWidth: '100%', minHeight: '100%' }}
    >
      {pixels}
    </svg>
  )
}

// Alternative: CSS-based animated gradient with pixelated effect
export function PixelGradientCSS({ className = '' }: PixelBackgroundProps) {
  return (
    <div className={`absolute inset-0 ${className}`}>
      {/* Animated gradient layer */}
      <div
        className="absolute inset-0 animate-gradient-shift"
        style={{
          background: `linear-gradient(
            135deg,
            hsl(213, 11%, 13%) 0%,
            hsl(214, 11%, 20%) 25%,
            hsl(214, 11%, 27%) 50%,
            hsl(205, 33%, 30%) 75%,
            hsl(213, 11%, 13%) 100%
          )`,
          backgroundSize: '400% 400%',
        }}
      />
      {/* Pixelation overlay using SVG filter */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ mixBlendMode: 'overlay' }}>
        <defs>
          <pattern id="pixelPattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="8" height="8" fill="transparent" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pixelPattern)" />
      </svg>
    </div>
  )
}

// Scanline effect for extra retro feel
export function ScanlineOverlay({ className = '' }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        background: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(0, 0, 0, 0.1) 2px,
          rgba(0, 0, 0, 0.1) 4px
        )`,
      }}
    />
  )
}
