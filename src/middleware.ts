import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Security headers to apply to all responses
const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
};

// Routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/register',
  '/discover',
  '/gallery',
  '/showcase',
  '/privacy',
  '/terms',
  '/offline',
  '/api/auth/login',
  '/api/auth/register',
  '/api/health',
  '/api/discover',
  '/api/gallery',
];

// Routes that start with these prefixes are public
const publicPrefixes = [
  '/track/',
  '/showcase/',
  '/invoice-preview/',
  '/api/track/',
  '/api/showcase/public',
  '/api/portfolio/public',
];

// Admin-only routes
const adminRoutes = ['/admin'];

// API routes that require authentication
const _protectedApiPrefixes = [
  '/api/clients',
  '/api/orders',
  '/api/payments',
  '/api/invoices',
  '/api/portfolio',
  '/api/notifications',
  '/api/dashboard',
  '/api/analytics',
  '/api/user',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Check if route is public
  const isPublicRoute =
    publicRoutes.includes(pathname) || publicPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Get session cookie
  const sessionToken = request.cookies.get('sc_session')?.value;

  // If no session and accessing protected route
  if (!sessionToken) {
    // For API routes, return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // For page routes, redirect to login
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For protected routes, we'll validate session on the server component level
  // Here we just check cookie exists

  // Check admin routes
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  if (isAdminRoute) {
    // Admin validation will happen server-side
    // This middleware just ensures there's a session
  }

  // Add security headers to response
  const response = NextResponse.next();

  // Apply security headers
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  // Add HSTS in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
