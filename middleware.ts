import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js middleware for authentication.
 * Currently just logs requests for debugging.
 * In the future, this will handle proper authentication checks.
 */
export function middleware(request: NextRequest) {
  // For now, just log API requests for debugging
  if (request.nextUrl.pathname.startsWith('/api/')) {
    console.log(`API Request: ${request.method} ${request.nextUrl.pathname}`)
    
    // In the future, we'll add authentication checks here:
    // - Verify JWT tokens
    // - Check user sessions
    // - Redirect unauthenticated users
  }

  return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Match all dashboard routes (for future auth checks)
    '/dashboard/:path*',
    '/portfolio/:path*',
  ],
} 