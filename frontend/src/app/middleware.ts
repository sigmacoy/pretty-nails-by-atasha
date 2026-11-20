import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/register', '/staff/scanner'];
const CUSTOMER_ROUTES = ['/my-bookings', '/loyalty', '/profile'];
const ADMIN_ROUTES = ['/admin'];

// Decode JWT payload (without verification) to get user role
function decodeJwtPayload(token: string): { role?: string } | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function getUserRoleFromToken(token: string | undefined): string | null {
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  return payload?.role || null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('prettynails_token')?.value;
  const userRole = getUserRoleFromToken(token);
  const isAdmin = userRole === 'ADMIN';

  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
  const isCustomerRoute = CUSTOMER_ROUTES.some(route => pathname.startsWith(route));
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));

  // Redirect authenticated users away from auth pages
  if (isPublicRoute && token) {
    // Redirect admins to admin dashboard, others to their intended destination or home
    const redirectTo = isAdmin
      ? '/admin'
      : (request.nextUrl.searchParams.get('redirect') || '/');
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  // Protect customer routes
  if (isCustomerRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protect admin routes - redirect to login if not authenticated
  if (isAdminRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated non-admin tries to access admin routes, redirect to home
  if (isAdminRoute && token && !isAdmin) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
};