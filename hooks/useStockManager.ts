"use client"

import { useState, useCallback } from "react"
import type { Stock, CreateStockRequest, UpdateStockRequest, MoveStockRequest, APIResponse } from "@/lib/types"
import { useStackAuth } from "./useStackAuth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

// Validation functions
function validateStockTicker(ticker: string | undefined | null): string {
  if (!ticker || typeof ticker !== 'string' || ticker.trim() === '') {
    throw new Error('Stock ticker cannot be empty')
  }
  return ticker.trim().toUpperCase()
}

function validateStockShares(shares: any): number {
  if (shares === undefined || shares === null || shares === '') {
    throw new Error('Number of shares cannot be empty')
  }
  
  const numShares = typeof shares === 'string' ? parseFloat(shares) : shares
  
  if (typeof shares === 'string' && shares.trim() === '') {
    throw new Error('Number of shares cannot be empty')
  }
  
  if (isNaN(numShares) || typeof numShares !== 'number') {
    throw new Error('Number of shares must be a valid number')
  }
  
  if (numShares <= 0) {
    throw new Error('Number of shares must be greater than 0')
  }
  
  return numShares
}

function validateCreateStockRequest(data: CreateStockRequest): CreateStockRequest {
  return {
    ticker: validateStockTicker(data.ticker),
    shares: validateStockShares(data.shares)
  }
}

function validateUpdateStockRequest(data: UpdateStockRequest): UpdateStockRequest {
  const validated: UpdateStockRequest = {}
  
  if (data.ticker !== undefined) {
    validated.ticker = validateStockTicker(data.ticker)
  }
  
  if (data.shares !== undefined) {
    validated.shares = validateStockShares(data.shares)
  }
  
  return validated
}

export function useStockManager() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { authenticatedFetch } = useStackAuth()

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
  }, [authenticatedFetch])

  // GET /api/portfolios/{portfolio_id}/stocks
  const getStocks = useCallback(async (portfolioId: string): Promise<Stock[]> => {
    return apiCall<Stock[]>(`/api/portfolios/${portfolioId}/stocks`)
  }, [apiCall])

  // POST /api/portfolios/{portfolio_id}/stocks
  const createStock = useCallback(async (
    portfolioId: string, 
    stockData: CreateStockRequest
  ): Promise<Stock> => {
    // Validate input data
    const validatedData = validateCreateStockRequest(stockData)
    
    return apiCall<Stock>(`/api/portfolios/${portfolioId}/stocks`, {
      method: 'POST',
      body: JSON.stringify(validatedData),
    })
  }, [apiCall])

  // PUT /api/portfolios/{portfolio_id}/stocks/{stock_id}
  const updateStock = useCallback(async (
    portfolioId: string,
    stockId: string, 
    stockData: UpdateStockRequest
  ): Promise<Stock> => {
    // Validate input data
    const validatedData = validateUpdateStockRequest(stockData)
    
    return apiCall<Stock>(`/api/portfolios/${portfolioId}/stocks/${stockId}`, {
      method: 'PUT',
      body: JSON.stringify(validatedData),
    })
  }, [apiCall])

  // DELETE /api/portfolios/{portfolio_id}/stocks/{stock_id}
  const deleteStock = useCallback(async (
    portfolioId: string,
    stockId: string
  ): Promise<void> => {
    return apiCall<void>(`/api/portfolios/${portfolioId}/stocks/${stockId}`, {
      method: 'DELETE',
    })
  }, [apiCall])

  // Helper function to add stock with optimistic UI updates
  const addStockToPortfolio = useCallback(async (
    portfolioId: string,
    stockData: Omit<Stock, "id" | "portfolio_id" | "created_at" | "updated_at">
  ): Promise<Stock> => {
    const createRequest: CreateStockRequest = {
      ticker: stockData.ticker,
      shares: stockData.shares,
    }
    
    return createStock(portfolioId, createRequest)
  }, [createStock])

  // Helper function to move stock between portfolios
  const moveStock = useCallback(async (
    fromPortfolioId: string,
    toPortfolioId: string,
    stock: Stock
  ): Promise<Stock> => {
    const moveRequest: MoveStockRequest = {
      to_portfolio_id: toPortfolioId
    }
    
    return apiCall<Stock>(`/api/portfolios/${fromPortfolioId}/stocks/${stock.id}/move`, {
      method: 'PATCH',
      body: JSON.stringify(moveRequest),
    })
  }, [apiCall])

  return {
    // State
    loading,
    error,
    
    // API methods
    getStocks,
    createStock,
    updateStock,
    deleteStock,
    
    // Helper methods
    addStockToPortfolio,
    moveStock,
    
    // Utility
    clearError: () => setError(null),
  }
} 