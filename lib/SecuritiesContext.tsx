"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { Securities, SecuritiesTrieResponse, TrieNode, APIResponse } from "@/lib/types"
import { useStackAuth } from "@/hooks/useStackAuth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

interface SecuritiesContextType {
  securitiesTrie: TrieNode | null
  loading: boolean
  error: string | null
  initialized: boolean
  searchSecurities: (query: string) => Securities[]
  clearError: () => void
}

const SecuritiesContext = createContext<SecuritiesContextType | undefined>(undefined)

interface SecuritiesProviderProps {
  children: React.ReactNode
}

export function SecuritiesProvider({ children }: SecuritiesProviderProps) {
  const [securitiesTrie, setSecuritiesTrie] = useState<TrieNode | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [loadingPromise, setLoadingPromise] = useState<Promise<void> | null>(null)
  
  // Use Stack Auth for authenticated requests
  const { authenticatedFetch } = useStackAuth()

  // Helper function to make authenticated API calls with error handling
  const apiCall = useCallback(async <T,>(
    url: string, 
    options: RequestInit = {}
  ): Promise<T> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}${url}`, options)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error(`[Securities] API error:`, errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      // For the trie endpoint, the server returns the data directly, not wrapped in APIResponse
      if (url.includes('/api/securities/trie')) {
        const data = await response.json()
        return data as T
      }

      // For other endpoints, expect APIResponse wrapper
      const data: APIResponse<T> = await response.json()
      
      if (!data.success) {
        console.error(`[Securities] API call failed:`, data.error)
        throw new Error(data.error || 'API call failed')
      }

      return data.data as T
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error(`[Securities] API call error:`, errorMessage)
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [authenticatedFetch])

  // Load securities trie once on initialization
  const loadSecuritiesTrie = useCallback(async (): Promise<void> => {
    if (initialized || loadingPromise) {
      if (loadingPromise) {
        await loadingPromise
      }
      return
    }
    
    const promise = (async () => {
      try {
        // Add cache busting parameter to force fresh request
        const cacheBuster = `?t=${Date.now()}`
        const trieResponse = await apiCall<SecuritiesTrieResponse>(`/api/securities/trie${cacheBuster}`)
        
        const rootNode = trieResponse.trie.root
        if (!rootNode) {
          throw new Error('No root node found in trie response')
        }
        
        setSecuritiesTrie(rootNode)
        setInitialized(true)
      } catch (err) {
        console.error('[Securities] Failed to load securities trie:', err)
        setError(err instanceof Error ? err.message : 'Failed to load securities')
      } finally {
        setLoadingPromise(null)
      }
    })()
    
    setLoadingPromise(promise)
    await promise
  }, [apiCall])

  // Search function that traverses the trie based on input
  const searchSecurities = useCallback((query: string): Securities[] => {
    if (!securitiesTrie || !query) {
      return []
    }
    
    const upperQuery = query.toUpperCase()
    let currentNode = securitiesTrie
    
    // Traverse the trie using Unicode code points (Go runes become numeric string keys in JSON)
    for (let i = 0; i < upperQuery.length; i++) {
      const char = upperQuery[i]
      const charCode = char.charCodeAt(0).toString()
      
      if (!currentNode.children || !currentNode.children[charCode]) {
        return []
      }
      currentNode = currentNode.children[charCode]
    }
    
    // Collect all securities from this node and its descendants
    const results: Securities[] = []
    
    const collectSecurities = (node: TrieNode) => {
      if (node.securities) {
        results.push(...node.securities)
      }
      
      if (node.children) {
        Object.values(node.children).forEach(childNode => {
          collectSecurities(childNode)
        })
      }
    }
    
    collectSecurities(currentNode)
    
    // Sort by ticker length first (exact matches first), then alphabetically
    const sortedResults = results.sort((a, b) => {
      const aStartsWithQuery = a.ticker.startsWith(upperQuery)
      const bStartsWithQuery = b.ticker.startsWith(upperQuery)
      
      if (aStartsWithQuery && !bStartsWithQuery) return -1
      if (!aStartsWithQuery && bStartsWithQuery) return 1
      
      if (a.ticker.length !== b.ticker.length) {
        return a.ticker.length - b.ticker.length
      }
      
      return a.ticker.localeCompare(b.ticker)
    })
    
    return sortedResults
  }, [securitiesTrie])

  // Load trie on mount
  useEffect(() => {
    loadSecuritiesTrie()
  }, [loadSecuritiesTrie])

  const clearError = useCallback(() => setError(null), [])

  const value: SecuritiesContextType = {
    securitiesTrie,
    loading,
    error,
    initialized,
    searchSecurities,
    clearError,
  }

  return (
    <SecuritiesContext.Provider value={value}>
      {children}
    </SecuritiesContext.Provider>
  )
}

export function useSecurities(): SecuritiesContextType {
  const context = useContext(SecuritiesContext)
  if (context === undefined) {
    throw new Error('useSecurities must be used within a SecuritiesProvider')
  }
  return context
}