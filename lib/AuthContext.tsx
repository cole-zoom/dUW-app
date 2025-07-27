"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { getCurrentUserId, isAuthenticated } from './auth'

interface AuthContextType {
  userId: string | null
  isAuthenticated: boolean
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  userId: null,
  isAuthenticated: false,
  loading: true,
})

interface AuthProviderProps {
  children: React.ReactNode
}

/**
 * Auth provider that manages authentication state.
 * Currently uses hard-coded user ID, but designed to be easily
 * upgraded when we implement proper authentication.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    // Simulate auth check - in the future this will be a real auth check
    const checkAuth = async () => {
      try {
        const isAuth = isAuthenticated()
        setAuthenticated(isAuth)
        
        if (isAuth) {
          setUserId(getCurrentUserId())
        } else {
          setUserId(null)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setAuthenticated(false)
        setUserId(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const value: AuthContextType = {
    userId,
    isAuthenticated: authenticated,
    loading,
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