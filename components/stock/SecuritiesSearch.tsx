"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import type { Securities } from "@/lib/types"

interface SecuritiesSearchProps {
  onSelect: (ticker: string) => void
  placeholder?: string
  value?: string
  className?: string
  disabled?: boolean
  searchResults: Securities[]
  onSearch: (query: string) => void
  loading?: boolean
}

export function SecuritiesSearch({
  onSelect,
  placeholder = "e.g., AAPL, TSLA",
  value = "",
  className = "",
  disabled = false,
  searchResults,
  onSearch,
  loading = false
}: SecuritiesSearchProps) {
  const [inputValue, setInputValue] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Debounced search
  const debouncedSearch = useCallback((query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    debounceRef.current = setTimeout(() => {
      onSearch(query)
    }, 300)
  }, [onSearch])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setSelectedIndex(-1)
    setIsOpen(true)
    
    if (newValue.trim()) {
      debouncedSearch(newValue.trim())
    } else {
      setIsOpen(false)
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || searchResults.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleSelect(searchResults[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Handle selection
  const handleSelect = (security: Securities) => {
    setInputValue(security.ticker)
    setIsOpen(false)
    setSelectedIndex(-1)
    onSelect(security.ticker)
  }

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value)
  }, [value])

  const displayResults = searchResults.slice(0, 10) // Limit to 10 results for performance

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (inputValue.trim() && searchResults.length > 0) {
            setIsOpen(true)
          }
        }}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        autoComplete="off"
      />
      
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60"
        >
          {loading && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Searching...
            </div>
          )}
          
          {!loading && displayResults.length === 0 && inputValue.trim() && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No securities found
            </div>
          )}
          
          {!loading && displayResults.length > 0 && (
            <ScrollArea className="max-h-60">
              {displayResults.map((security, index) => (
                <button
                  key={security.ticker}
                  className={`w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none ${
                    index === selectedIndex ? 'bg-accent text-accent-foreground' : ''
                  }`}
                  onClick={() => handleSelect(security)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{security.ticker}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {security.name}
                    </span>
                  </div>
                </button>
              ))}
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  )
}
