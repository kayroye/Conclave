import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Paths that don't require authentication
const publicPaths = [
  '/',
  '/home',
  '/api/user', // Keep the user API public for initial auth check
]

export function middleware(request: NextRequest) {
  // Check if the path requires authentication
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path || 
    request.nextUrl.pathname.startsWith('/api/')  // Keep all API routes public for now
  )

  // Get the user ID from cookies
  const userId = request.cookies.get('user_id')

  // If the path is not public and there's no user ID, redirect to home
  if (!isPublicPath && !userId) {
    const homeUrl = new URL('/home', request.url)
    return NextResponse.redirect(homeUrl)
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
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
} 