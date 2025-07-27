/**
 * Authentication utilities for the crypto dashboard.
 * Currently uses a hard-coded user ID, but designed to be easily
 * upgraded to proper authentication in the future.
 */

// For now, we use a hard-coded user ID
// In the future, this will come from authentication
const CURRENT_USER_ID = "c62292e5-9005-4ce0-8b9d-7953bcef9890"

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