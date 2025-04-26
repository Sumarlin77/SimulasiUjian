import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const path = request.nextUrl.pathname;

  // Public paths that don't require authentication
  const publicPaths = [
    '/login',
    '/register',
    '/api/auth/login',
    '/api/auth/register',
    '/favicon.ico',
    '/assets',
  ];

  // If user is authenticated and trying to access the root path, redirect them to their dashboard
  if (token && path === '/') {
    try {
      const session = await verifyToken(token);
      if (session) {
        // Redirect based on user role
        if (session.role === 'ADMIN') {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        } else {
          return NextResponse.redirect(new URL('/participant/dashboard', request.url));
        }
      }
    } catch (error) {
      // If token verification fails, let them access the public page
      return NextResponse.next();
    }
  }

  // Check if the path is a public path
  const isPublicPath = publicPaths.some(publicPath =>
    path === publicPath ||
    path === '/' ||
    path.startsWith('/api/auth/') ||
    path.startsWith('/assets/') ||
    path.startsWith('/_next/')
  );

  // If the path is public, allow access without token
  if (isPublicPath) {
    return NextResponse.next();
  }

  // For protected routes, require a valid token
  if (!token) {
    // Redirect to login page if accessing admin/participant pages
    if (path.startsWith('/admin') || path.startsWith('/participant')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Return unauthorized for API requests
    if (path.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Default handler for missing token
    return NextResponse.next();
  }

  // If a token exists, verify it
  if (token) {
    try {
      const session = await verifyToken(token);

      // If the token is invalid, clear it and redirect to login
      if (!session) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('token');
        return response;
      }

      // Role-based access control
      if (path.startsWith('/admin') && session.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/participant/dashboard', request.url));
      }

      if (path.startsWith('/participant') && session.role !== 'PARTICIPANT') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }

      return NextResponse.next();
    } catch (error) {
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /_next (Next.js static files)
     * 2. /fonts (static font files)
     * 3. /images (static image files)
     * 4. /favicon.ico, /sitemap, /robots.txt
     */
    '/((?!_next|fonts|images|favicon.ico|sitemap|robots.txt).*)',
  ],
}; 
