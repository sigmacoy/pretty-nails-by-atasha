import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_ROUTES = ['/login', '/register'];
const CUSTOMER_ROUTES = ['/my-bookings', '/loyalty', '/profile'];
const ADMIN_ROUTES = ['/admin'];
const STAFF_ROUTES = ['/staff/scanner'];

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'prettynails-secret-key-for-jwt-token-generation-must-be-at-least-256-bits-long'
);

async function getUserRoleFromToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return (payload.role as string) || null;
  } catch {
    return null;
  }
}

function isSafeRedirect(redirectTo: string): boolean {
  return redirectTo.startsWith('/') && !redirectTo.startsWith('//') && !redirectTo.startsWith('/\\');
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('prettynails_token')?.value;
  const userRole = await getUserRoleFromToken(token);
  const isAdmin = userRole === 'ADMIN';
  const isStaff = userRole === 'STAFF' || userRole === 'ADMIN';

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const isCustomerRoute = CUSTOMER_ROUTES.some((route) => pathname.startsWith(route));
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));
  const isStaffRoute = STAFF_ROUTES.some((route) => pathname.startsWith(route));

  // Redirect authenticated users away from auth pages
  if (isPublicRoute && token) {
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    const redirectTo = isSafeRedirect(redirectParam || '') ? redirectParam! : (isAdmin ? '/admin' : '/');
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

  // Protect staff routes - require staff or admin role
  if (isStaffRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isStaffRoute && token && !isStaff) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images|site.webmanifest|favicon-16x16.png|apple-touch-icon.png).*)',
  ],
};