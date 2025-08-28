"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useUser } from '@stackframe/stack'
import { setCachedToken, setTokenGetter } from './client-auth'

interface AuthContextType {
  userId: string | null
  isAuthenticated: boolean
  loading: boolean
  token: string | null
  getAccessToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType>({
  userId: null,
  isAuthenticated: false,
  loading: true,
  token: null,
  getAccessToken: async () => null,
})

interface AuthProviderProps {
  children: React.ReactNode
}

/**
 * Auth provider that manages authentication state using Stack Auth.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const user = useUser()
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  // Function to get the current access token from Stack Auth
  const getAccessToken = async (): Promise<string | null> => {
    if (!user) return null
    
    try {
      const authJson = await user.getAuthJson()
      return authJson?.accessToken || null
    } catch (error) {
      console.error('[AuthContext] Failed to get access token:', error)
      return null
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (user) {
          // Set the token getter function for dynamic token retrieval
          setTokenGetter(getAccessToken)
          
          // Get the actual access token from Stack Auth
          const accessToken = await getAccessToken()
          setCachedToken(accessToken)
          setToken(accessToken)
        } else {
          setTokenGetter(() => Promise.resolve(null))
          setCachedToken(null)
          setToken(null)
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [user])

  const value: AuthContextType = {
    userId: user?.id || null,
    isAuthenticated: !!user,
    loading,
    token,
    getAccessToken,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to use auth context.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 