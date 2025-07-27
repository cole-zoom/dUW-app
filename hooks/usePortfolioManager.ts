"use client"

import { useState, useEffect, useCallback } from "react"
import type { Portfolio, CreatePortfolioRequest, UpdatePortfolioRequest, APIResponse, CopiedStock } from "@/lib/types"
import { authenticatedFetch } from "@/lib/auth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

// Validation functions
function validatePortfolioName(name: string | undefined | null): string {
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new Error('Portfolio name cannot be empty')
  }
  return name.trim()
}

function validateCreatePortfolioRequest(data: CreatePortfolioRequest): CreatePortfolioRequest {
  return {
    name: validatePortfolioName(data.name)
  }
}

function validateUpdatePortfolioRequest(data: UpdatePortfolioRequest): UpdatePortfolioRequest {
  return {
    name: validatePortfolioName(data.name)
  }
}

export function usePortfolioManager() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedStock, setCopiedStock] = useState<CopiedStock>(null)

  // Helper function to make authenticated API calls with error handling
  const apiCall = useCallback(async <T>(
    url: string, 
    options: RequestInit = {}
  ): Promise<T> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}${url}`, options)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data: APIResponse<T> = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'API call failed')
      }

      return data.data as T
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  // GET /api/portfolios
  const fetchPortfolios = useCallback(async (): Promise<Portfolio[]> => {
    try {
      const fetchedPortfolios = await apiCall<Portfolio[]>('/api/portfolios')
      setPortfolios(fetchedPortfolios)
      return fetchedPortfolios
    } catch (err) {
      console.error('Failed to fetch portfolios:', err)
      return []
    }
  }, [apiCall])

  // POST /api/portfolios
  const createPortfolio = useCallback(async (name: string): Promise<Portfolio> => {
    const portfolioData: CreatePortfolioRequest = { name }
    // Validate input data
    const validatedData = validateCreatePortfolioRequest(portfolioData)
    
    const newPortfolio = await apiCall<Portfolio>('/api/portfolios', {
      method: 'POST',
      body: JSON.stringify(validatedData),
    })
    
    // Update local state
    setPortfolios(prev => [...prev, newPortfolio])
    return newPortfolio
  }, [apiCall])

  // PUT /api/portfolios/{id}
  const updatePortfolio = useCallback(async (
    portfolioId: string, 
    data: UpdatePortfolioRequest
  ): Promise<Portfolio> => {
    // Validate input data
    const validatedData = validateUpdatePortfolioRequest(data)
    
    const updatedPortfolio = await apiCall<Portfolio>(`/api/portfolios/${portfolioId}`, {
      method: 'PUT',
      body: JSON.stringify(validatedData),
    })
    
    // Update local state
    setPortfolios(prev => 
      prev.map(p => p.id === portfolioId ? updatedPortfolio : p)
    )
    return updatedPortfolio
  }, [apiCall])

  // DELETE /api/portfolios/{id}
  const deletePortfolio = useCallback(async (portfolioId: string): Promise<void> => {
    // Prevent deleting the last portfolio
    if (portfolios.length <= 1) {
      throw new Error('Cannot delete the last portfolio')
    }
    
    await apiCall<void>(`/api/portfolios/${portfolioId}`, {
      method: 'DELETE',
    })
    
    // Update local state
    setPortfolios(prev => prev.filter(p => p.id !== portfolioId))
  }, [apiCall, portfolios.length])

  // Helper function for the legacy addPortfolio interface
  const addPortfolio = useCallback(async (name: string): Promise<void> => {
    try {
      await createPortfolio(name)
    } catch (err) {
      console.error('Failed to add portfolio:', err)
    }
  }, [createPortfolio])

  // Handle copy stock events from the global event system
  useEffect(() => {
    const handleCopyStock = (event: CustomEvent) => {
      setCopiedStock(event.detail)
    }

    window.addEventListener("copyStock", handleCopyStock as EventListener)
    return () => window.removeEventListener("copyStock", handleCopyStock as EventListener)
  }, [])

  // Load portfolios on mount
  useEffect(() => {
    fetchPortfolios()
  }, [fetchPortfolios])

  // Helper function to check if a stock can be pasted in a portfolio
  const canPasteInPortfolio = useCallback((portfolioId: string): boolean => {
    if (!copiedStock || copiedStock.sourcePortfolioId === portfolioId) return false

    const targetPortfolio = portfolios.find(p => p.id === portfolioId)
    if (!targetPortfolio) return false

    return !targetPortfolio.stocks.some(stock => stock.ticker === copiedStock.stock.ticker)
  }, [copiedStock, portfolios])

  // Refresh a specific portfolio's stocks (useful after stock operations)
  const refreshPortfolio = useCallback(async (portfolioId: string): Promise<void> => {
    // For now, we'll just refetch all portfolios
    // In the future, we could optimize this to only fetch the specific portfolio
    await fetchPortfolios()
  }, [fetchPortfolios])

  return {
    // State
    portfolios,
    loading,
    error,
    copiedStock,
    
    // Portfolio operations
    fetchPortfolios,
    createPortfolio,
    updatePortfolio,
    deletePortfolio,
    addPortfolio, // Legacy interface
    
    // Stock clipboard operations
    canPasteInPortfolio,
    
    // Utility
    refreshPortfolio,
    clearError: () => setError(null),
  }
} 