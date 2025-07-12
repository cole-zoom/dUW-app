"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Trash2 } from "lucide-react"
import type { Stock } from "@/lib/types"

interface StockCardProps {
  stock: Stock
  onDelete: () => void
  portfolioId: string
}

export function StockCard({ stock, onDelete, portfolioId }: StockCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleCopy = () => {
    // Dispatch custom event for copying stock
    window.dispatchEvent(
      new CustomEvent("copyStock", {
        detail: { stock, sourcePortfolioId: portfolioId },
      }),
    )
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isHovered) return

      // Check for Cmd+C (Mac) or Ctrl+C (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "c") {
        e.preventDefault()
        handleCopy()

        // Visual feedback
        if (cardRef.current) {
          cardRef.current.style.transform = "scale(0.98)"
          setTimeout(() => {
            if (cardRef.current) {
              cardRef.current.style.transform = "scale(1)"
            }
          }, 150)
        }
      }
    }

    if (isHovered) {
      document.addEventListener("keydown", handleKeyDown)
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isHovered, stock, portfolioId])

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        stock,
        sourcePortfolioId: portfolioId,
      }),
    )
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  return (
    <Card
      ref={cardRef}
      className={`bg-muted/50 transition-all duration-200 cursor-pointer select-none ${
        isHovered ? "ring-2 ring-primary/50 shadow-md" : ""
      } ${isDragging ? "opacity-50 scale-95" : ""}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-medium">{stock.name}</h4>
            <p className="text-sm text-muted-foreground">{stock.shares} shares</p>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {isHovered && <div className="mt-2 text-xs text-muted-foreground">Press Cmd+C to copy • Drag to move</div>}
      </CardContent>
    </Card>
  )
}
