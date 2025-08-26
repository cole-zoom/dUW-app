"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SecuritiesSearch } from "./SecuritiesSearch"
import { useSecurities } from "@/lib/SecuritiesContext"
import type { Securities } from "@/lib/types"

interface AddStockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddStock: (stock: { ticker: string; shares: number }) => void
}

export function AddStockDialog({ open, onOpenChange, onAddStock }: AddStockDialogProps) {
  const [ticker, setTicker] = useState("")
  const [shares, setShares] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Securities[]>([])
  const { 
    searchSecurities, 
    loading: securitiesLoading,
    initialized,
    error: securitiesError
  } = useSecurities()

  // Log securities context state for debugging
  useEffect(() => {
    console.log('[AddStockDialog] Securities context state:', {
      initialized,
      loading: securitiesLoading,
      error: securitiesError,
      dialogOpen: open
    })
  }, [initialized, securitiesLoading, securitiesError, open])

  // Handle search
  const handleSearch = (query: string) => {
    console.log('[AddStockDialog] Handling search for query:', query)
    setSearchQuery(query)
    const results = searchSecurities(query)
    console.log('[AddStockDialog] Search results:', results.length, 'securities found')
    setSearchResults(results)
  }

  // Handle ticker selection
  const handleTickerSelect = (selectedTicker: string) => {
    setTicker(selectedTicker)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (ticker.trim() && shares.trim() && !isNaN(Number(shares))) {
      onAddStock({
        ticker: ticker.trim(),
        shares: Number(shares),
      })
      setTicker("")
      setShares("")
      setSearchQuery("")
      setSearchResults([])
      onOpenChange(false)
    }
  }

  const handleClose = () => {
    setTicker("")
    setShares("")
    setSearchQuery("")
    setSearchResults([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Stock</DialogTitle>
          <DialogDescription>
            Enter the stock ticker and number of shares you want to add to this portfolio.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ticker" className="text-right">
                Stock Ticker
              </Label>
              <div className="col-span-3">
                <SecuritiesSearch
                  onSelect={handleTickerSelect}
                  onSearch={handleSearch}
                  searchResults={searchResults}
                  loading={securitiesLoading}
                  value={ticker}
                  placeholder="e.g., AAPL, TSLA"
                  className=""
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="shares" className="text-right">
                Shares
              </Label>
              <Input
                id="shares"
                type="number"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className="col-span-3"
                placeholder="0"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Add Stock</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
