
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { UserRole } from '@/types';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const { pathname } = req.nextUrl;

  // Protect /admin routes
  if (pathname.startsWith('/admin')) {
    if (!token) {
      // If no token, redirect to login page
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname); // Pass the original path as callbackUrl
      return NextResponse.redirect(loginUrl);
    }

    // If token exists, check role
    const userRole = (token.user as { role?: UserRole } | undefined)?.role;
    if (userRole !== 'admin') {
      // If not admin, redirect to home page or a specific "not authorized" page
      // For simplicity, redirecting to home for now.
      // You could create a /unauthorized page and redirect there.
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // Allow the request to proceed if no protection rules match
  return NextResponse.next();
}

// Specify which paths the middleware should run on
export const config = {
  matcher: ['/admin/:path*'], // Protect all routes under /admin
};
