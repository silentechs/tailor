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
  
  // Build list of allowed origins
  const allowedOrigins: string[] = [
    'http://localhost:3000',
    'http://localhost',
  ];
  
  // Add configured APP_URL
  if (process.env.APP_URL) {
    allowedOrigins.push(process.env.APP_URL);
  }
  
  // Add NEXT_PUBLIC_APP_URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    allowedOrigins.push(process.env.NEXT_PUBLIC_APP_URL);
  }
  
  // Add host-based URL (with and without www)
  if (host) {
    allowedOrigins.push(`https://${host}`);
    allowedOrigins.push(`http://${host}`);
    // Handle www/non-www variants
    if (host.startsWith('www.')) {
      allowedOrigins.push(`https://${host.slice(4)}`);
    } else {
      allowedOrigins.push(`https://www.${host}`);
    }
  }

  // Helper to check if URL starts with any allowed origin
  const isAllowedOrigin = (url: string | null): boolean => {
    if (!url) return true; // No origin/referer is OK
    return allowedOrigins.some(allowed => url.startsWith(allowed));
  };

  // Verify origin matches our app
  if (origin && !isAllowedOrigin(origin)) {
    return { valid: false, error: `Invalid origin: ${origin}` };
  }

  if (referer && !isAllowedOrigin(referer)) {
    return { valid: false, error: `Invalid referer: ${referer}` };
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
