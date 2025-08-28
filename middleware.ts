import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { stackApp } from '@/lib/stack-auth'

/**
 * Next.js middleware for authentication using Stack Auth.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Public paths that don't require authentication
  const publicPaths = ['/landing', '/', '/api/webhook', '/handler']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  
  // Check if user is authenticated
  const user = await stackApp.getUser()
  const isAuthenticated = !!user
  
  // Redirect logic
  if (!isAuthenticated && !isPublicPath) {
    // Redirect unauthenticated users to landing page
    return NextResponse.redirect(new URL('/landing', request.url))
  }
  
  if (isAuthenticated && pathname === '/landing') {
    // Redirect authenticated users away from landing page
    return NextResponse.redirect(new URL('/portfolio', request.url))
  }
  
  // For root path, redirect based on auth status
  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/portfolio', request.url))
    } else {
      return NextResponse.redirect(new URL('/landing', request.url))
    }
  }

  return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public/).*)',
  ],
} 