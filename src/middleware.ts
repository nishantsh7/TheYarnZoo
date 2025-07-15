
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { UserRole } from '@/types';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const { pathname } = req.nextUrl;

  // Generic check for all protected routes
  const isProtectedRoute = pathname.startsWith('/admin') || pathname.startsWith('/profile');

  if (isProtectedRoute) {
    if (!token) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Role-specific check for /admin routes
  if (pathname.startsWith('/admin')) {
    const userRole = (token?.user as { role?: UserRole } | undefined)?.role;
    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // Allow the request to proceed if no protection rules match
  return NextResponse.next();
}

// Specify which paths the middleware should run on
export const config = {
  matcher: ['/admin/:path*', '/profile/:path*'], // Protect all routes under /admin and /profile
};
