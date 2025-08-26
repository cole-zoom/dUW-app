/**
 * Authentication utilities for the crypto dashboard.
 * Currently uses a hard-coded user ID, but designed to be easily
 * upgraded to proper authentication in the future.
 */

// For now, we use a hard-coded user ID
// In the future, this will come from authentication
const CURRENT_USER_ID = "6fa7321b-7290-46ae-836d-a83e988d0960"

/**
 * Get the current user ID.
 * In the future, this will be retrieved from authentication state/token.
 */
export function getCurrentUserId(): string {
  return CURRENT_USER_ID
}

/**
 * Get headers with authentication for API calls.
 */
export function getAuthHeaders(): HeadersInit {
  return {
    'userID': getCurrentUserId(),
    'Content-Type': 'application/json',
  }
}

/**
 * Create an authenticated fetch request with proper headers.
 */
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  console.log('[Auth] Making authenticated fetch to:', url)
  console.log('[Auth] Current window.location.origin:', window.location.origin)
  
  const authHeaders = getAuthHeaders()
  
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
 * For now, always returns true since we're using a hard-coded user ID.
 * In the future, this will check for valid authentication.
 */
export function isAuthenticated(): boolean {
  return true
} 