"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"

interface EditableSharesProps {
  shares: number
  ticker: string
  portfolioId: string
  stockId: string
  onUpdate: (portfolioId: string, stockId: string, data: { shares: number }) => Promise<void>
}

export function EditableShares({ shares, ticker, portfolioId, stockId, onUpdate }: EditableSharesProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(shares.toString())
  const [isUpdating, setIsUpdating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card interaction
    setIsEditing(true)
    setEditValue(shares.toString())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const handleBlur = () => {
    handleSave()
  }

  const handleSave = async () => {
    if (isUpdating) return

    const newShares = parseFloat(editValue)
    
    // Validate the input
    if (isNaN(newShares) || newShares <= 0) {
      setEditValue(shares.toString())
      setIsEditing(false)
      return
    }

    // If no change, just exit edit mode
    if (newShares === shares) {
      setIsEditing(false)
      return
    }

    setIsUpdating(true)
    try {
      await onUpdate(portfolioId, stockId, { shares: newShares })
      setIsEditing(false)
    } catch (error) {
      // Revert to original value on error
      setEditValue(shares.toString())
      setIsEditing(false)
      console.error('Failed to update shares:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancel = () => {
    setEditValue(shares.toString())
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type="number"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="text-sm text-muted-foreground bg-transparent border-none p-0 h-auto min-h-0 w-16 focus-visible:ring-0 focus-visible:ring-offset-0"
        step="any"
        min="0"
        disabled={isUpdating}
      />
    )
  }

  return (
    <p 
      className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
      onClick={handleClick}
      title="Click to edit shares"
    >
      {shares} shares
    </p>
  )
}
