import { NextResponse } from 'next/server';
import { checkCSRF, csrfErrorResponse } from './csrf';
import { captureError } from './logger';
import { checkRateLimit, RATE_LIMIT_CONFIGS, rateLimitedResponse } from './rate-limiter';
import { sanitizeObject, validateInput } from './sanitize';
import { SECURITY_HEADERS } from './security-headers';

// ============================================
// Unified API Security Middleware
// Combines rate limiting, CSRF, validation, and sanitization
// ============================================

export interface SecurityConfig {
  rateLimit?: keyof typeof RATE_LIMIT_CONFIGS;
  skipCSRF?: boolean;
  validateBody?: boolean;
  sanitizeBody?: boolean;
}

export interface SecurityCheckResult {
  passed: boolean;
  response?: Response;
  sanitizedBody?: unknown;
}

// Main security check function for API routes
export async function securityCheck(
  request: Request,
  route: string,
  config: SecurityConfig = {}
): Promise<SecurityCheckResult> {
  const { rateLimit = 'api', skipCSRF = false, validateBody = true, sanitizeBody = true } = config;

  // 1. Rate Limiting
  const rateLimitConfig = RATE_LIMIT_CONFIGS[rateLimit];
  const { allowed, headers } = checkRateLimit(request, route, rateLimitConfig);

  if (!allowed) {
    return {
      passed: false,
      response: rateLimitedResponse(headers),
    };
  }

  // 2. CSRF Protection (for non-GET requests)
  if (!skipCSRF && !['GET', 'HEAD', 'OPTIONS'].includes(request.method.toUpperCase())) {
    const csrfResult = await checkCSRF(request);
    if (!csrfResult.valid) {
      console.warn(`CSRF failure on ${route}: ${csrfResult.error}`);
      return {
        passed: false,
        response: csrfErrorResponse(csrfResult.error || 'Invalid CSRF token'),
      };
    }
  }

  // 3. Body Validation and Sanitization (for POST, PUT, PATCH)
  let sanitizedBody: unknown;

  if (
    ['POST', 'PUT', 'PATCH'].includes(request.method.toUpperCase()) &&
    (validateBody || sanitizeBody)
  ) {
    try {
      const body = await request.clone().json();

      // Validate for injection patterns
      if (validateBody && typeof body === 'object' && body !== null) {
        const bodyStr = JSON.stringify(body);
        const validation = validateInput(bodyStr);

        if (!validation.valid) {
          return {
            passed: false,
            response: NextResponse.json(
              {
                success: false,
                error: 'Invalid input detected',
                code: 'INVALID_INPUT',
              },
              { status: 400, headers: SECURITY_HEADERS }
            ),
          };
        }
      }

      // Sanitize the body
      if (sanitizeBody && typeof body === 'object' && body !== null) {
        sanitizedBody = sanitizeObject(body as Record<string, unknown>);
      } else {
        sanitizedBody = body;
      }
    } catch {
      // If body parsing fails, continue without sanitized body
      // The route handler will handle the error
    }
  }

  return {
    passed: true,
    sanitizedBody,
  };
}

// Helper to create secure JSON response with security headers
export function secureJsonResponse(
  data: unknown,
  options?: { status?: number; rateLimitHeaders?: Record<string, string> }
): NextResponse {
  const { status = 200, rateLimitHeaders = {} } = options || {};

  return NextResponse.json(data, {
    status,
    headers: {
      ...SECURITY_HEADERS,
      ...rateLimitHeaders,
    },
  });
}

// Helper to create error response with security headers
export function secureErrorResponse(
  error: string,
  status: number = 400,
  code?: string
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(code && { code }),
    },
    {
      status,
      headers: SECURITY_HEADERS,
    }
  );
}

// Wrapper for protected API routes
export function withSecurity(
  handler: (request: Request, context: { sanitizedBody?: unknown }) => Promise<Response>,
  route: string,
  config?: SecurityConfig
) {
  return async (request: Request): Promise<Response> => {
    const securityResult = await securityCheck(request, route, config);

    if (!securityResult.passed) {
      return securityResult.response!;
    }

    try {
      const response = await handler(request, {
        sanitizedBody: securityResult.sanitizedBody,
      });

      // Add security headers to response
      const headers = new Headers(response.headers);
      for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
        if (value && !headers.has(key)) {
          headers.set(key, value);
        }
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      captureError(`API:${route}`, error);
      return secureErrorResponse('Internal server error', 500, 'INTERNAL_ERROR');
    }
  };
}
