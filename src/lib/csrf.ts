import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// CSRF Protection
// Double-submit cookie pattern
// ============================================

const CSRF_COOKIE_NAME = 'sc_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_EXPIRY_HOURS = 24;

// Generate a new CSRF token
export async function generateCSRFToken(): Promise<string> {
  const token = uuidv4();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + CSRF_EXPIRY_HOURS);

  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: expiresAt,
    path: '/',
  });

  return token;
}

// Get existing CSRF token or generate new one
export async function getCSRFToken(): Promise<string> {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (existingToken) {
    return existingToken;
  }

  return generateCSRFToken();
}

// Validate CSRF token from request
export async function validateCSRFToken(request: Request): Promise<boolean> {
  // Skip CSRF for safe methods
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true;
  }

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  // Both must exist and match
  if (!cookieToken || !headerToken) {
    return false;
  }

  return cookieToken === headerToken;
}

// Middleware-style CSRF check
export async function checkCSRF(request: Request): Promise<{ valid: boolean; error?: string }> {
  // Skip for safe methods
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return { valid: true };
  }

  // Check origin/referer for additional protection
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');
  const appUrl = process.env.APP_URL || `https://${host}`;

  // Verify origin matches our app
  if (origin && !origin.startsWith(appUrl) && !origin.startsWith('http://localhost')) {
    return { valid: false, error: 'Invalid origin' };
  }

  if (referer && !referer.startsWith(appUrl) && !referer.startsWith('http://localhost')) {
    return { valid: false, error: 'Invalid referer' };
  }

  // Validate CSRF token
  const isValid = await validateCSRFToken(request);
  if (!isValid) {
    const cookieStore = await cookies();
    const hasCookie = !!cookieStore.get(CSRF_COOKIE_NAME);
    const hasHeader = !!request.headers.get(CSRF_HEADER_NAME);

    return {
      valid: false,
      error: `Invalid CSRF token (Cookie: ${hasCookie ? 'present' : 'missing'}, Header: ${hasHeader ? 'present' : 'missing'})`,
    };
  }

  return { valid: true };
}

// Response for CSRF failures
export function csrfErrorResponse(error: string): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'CSRF validation failed',
      details: error,
      code: 'CSRF_INVALID',
    }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
