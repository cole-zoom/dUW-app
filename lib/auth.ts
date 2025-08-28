/**
 * Authentication utilities for the crypto dashboard using Stack Auth.
 */

import { stackApp } from "./stack-auth"

/**
 * Get the current user from Stack Auth.
 */
export async function getCurrentUser() {
  if (typeof window === 'undefined') {
    // Server-side: use Stack Auth server methods
    const user = await stackApp.getUser()
    return user
  } else {
    // Client-side: This will be handled by the AuthContext
    return null
  }
}

/**
 * Get the current user ID.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.id || null
}

/**
 * Get the authentication token.
 */
export async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    // Server-side
    const user = await stackApp.getUser({ or: 'redirect' })
    if (user) {
      // Get the access token from Stack Auth
      const tokens = await stackApp.getAuthJson()
      return tokens?.accessToken || null
    }
  } else {
    // Client-side: Stack Auth stores the token in cookies
    // We need to retrieve it from the Stack Auth client
    try {
      const response = await fetch('/api/auth/session')
      if (response.ok) {
        const data = await response.json()
        return data.accessToken || null
      }
    } catch (error) {
      console.error('Failed to get auth token:', error)
    }
  }
  
  return null
}

/**
 * Get headers with authentication for API calls.
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getAuthToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return headers
}

/**
 * Create an authenticated fetch request with proper headers.
 */
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const authHeaders = await getAuthHeaders()
  
  return fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  })
}

/**
 * Check if user is authenticated.
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return !!user
} 