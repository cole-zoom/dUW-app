"use client"

import { useUser } from "@stackframe/stack"
import { useCallback } from "react"

/**
 * Custom hook to use Stack Auth with proper token management
 */
export function useStackAuth() {
  const user = useUser()
  
  /**
   * Get the current access token from Stack Auth
   */
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!user) {
      return null
    }
    
    try {
      const authJson = await user.getAuthJson()
      
      if (!authJson?.accessToken) {
        return null
      }
      
      return authJson.accessToken
    } catch (error) {
      console.error('[useStackAuth] Failed to get access token:', error)
      return null
    }
  }, [user])
  
  /**
   * Create authenticated fetch with proper headers
   */
  const authenticatedFetch = useCallback(async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const token = await getAccessToken()
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    return fetch(url, {
      ...options,
      headers,
    })
  }, [getAccessToken])
  
  return {
    user,
    userId: user?.id || null,
    isAuthenticated: !!user,
    getAccessToken,
    authenticatedFetch,
  }
}
