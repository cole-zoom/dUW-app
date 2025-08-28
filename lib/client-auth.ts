"use client"

/**
 * Client-side authentication utilities using Stack Auth.
 */

// Store the access token in memory for client-side use
let cachedToken: string | null = null
let tokenGetter: (() => Promise<string | null>) | null = null

/**
 * Set the cached token (called when Stack Auth provides it)
 */
export function setCachedToken(token: string | null) {
  cachedToken = token
}

/**
 * Set the token getter function (used to dynamically fetch tokens)
 */
export function setTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter
}

/**
 * Get the cached authentication token.
 */
export function getCachedToken(): string | null {
  return cachedToken
}

/**
 * Get the current access token, either from cache or by fetching fresh
 */
export async function getAccessToken(): Promise<string | null> {
  // First try to use the token getter if available
  if (tokenGetter) {
    try {
      const freshToken = await tokenGetter()
      if (freshToken) {
        cachedToken = freshToken // Update cache
        return freshToken
      }
    } catch (error) {
      console.error('[Auth] Failed to get fresh token:', error)
    }
  }
  
  // Fall back to cached token
  return cachedToken
}

/**
 * Get headers with authentication for API calls.
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  const token = await getAccessToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  } else {
    console.warn('[Auth] No access token available for request')
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
