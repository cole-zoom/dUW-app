"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StockCard } from "@/components/stock/StockCard"
import { AddStockDialog } from "@/components/stock/AddStockDialog"
import { MoreHorizontal, Plus, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Stock } from "@/lib/types"

interface PortfolioCardProps {
  id: string
  title: string
  stocks: Stock[]
  onAddStock: (portfolioId: string, stock: Omit<Stock, "id">) => void
  onDeleteStock: (portfolioId: string, stockId: string) => void
  onDeletePortfolio: (portfolioId: string) => void
  onPasteStock: (portfolioId: string) => void
  onMoveStock: (fromPortfolioId: string, toPortfolioId: string, stock: Stock) => void
  copiedStock: Stock | null
  canPaste: boolean
}

export function PortfolioCard({
  id,
  title,
  stocks,
  onAddStock,
  onDeleteStock,
  onDeletePortfolio,
  onPasteStock,
  onMoveStock,
  copiedStock,
  canPaste,
}: PortfolioCardProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleAddStock = (stock: Omit<Stock, "id">) => {
    onAddStock(id, stock)
    setIsAddDialogOpen(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set isDragOver to false if we're leaving the card entirely
    if (!cardRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"))
      const { stock, sourcePortfolioId } = data

      // Don't allow dropping in the same portfolio
      if (sourcePortfolioId === id) return

      // Check if stock already exists in target portfolio
      const stockExists = stocks.some((s) => s.name === stock.name)
      if (stockExists) return

      onMoveStock(sourcePortfolioId, id, stock)
    } catch (error) {
      console.error("Error handling drop:", error)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isHovered || !canPaste) return

      // Check for Cmd+V (Mac) or Ctrl+V (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "v") {
        e.preventDefault()
        onPasteStock(id)

        // Visual feedback
        if (cardRef.current) {
          cardRef.current.style.transform = "scale(1.02)"
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
  }, [isHovered, canPaste, id, onPasteStock])

  return (
    <Card
      ref={cardRef}
      className={`w-80 h-fit transition-all duration-200 ${
        isDragOver ? "ring-2 ring-primary shadow-lg scale-105" : ""
      } ${isHovered && canPaste ? "ring-1 ring-muted-foreground/30" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canPaste && <DropdownMenuItem onClick={() => onPasteStock(id)}>Paste Stock</DropdownMenuItem>}
            <DropdownMenuItem onClick={() => onDeletePortfolio(id)} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Portfolio
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-3">
        {stocks.map((stock) => (
          <StockCard key={stock.id} stock={stock} onDelete={() => onDeleteStock(id, stock.id)} portfolioId={id} />
        ))}
        <Button
          variant="outline"
          className="w-full h-20 border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-6 w-6 mr-2" />
          Add Stock
        </Button>
        {isDragOver && (
          <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center">
            <p className="text-primary font-medium">Drop stock here</p>
          </div>
        )}
        {isHovered && canPaste && (
          <div className="text-xs text-muted-foreground text-center">Press Cmd+V to paste copied stock</div>
        )}
        <AddStockDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onAddStock={handleAddStock} />
      </CardContent>
    </Card>
  )
}
