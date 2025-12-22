// ============================================
// Rate Limiter
// In-memory rate limiting (use Redis in production for distributed systems)
// ============================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

// Default configurations for different route types
export const RATE_LIMIT_CONFIGS = {
  // Strict limits for auth routes to prevent brute force
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
  },
  // Standard API limits
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
  // More lenient for read operations
  read: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  },
  // Strict for write operations
  write: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
  },
  // Very strict for sensitive operations
  sensitive: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 requests per hour
  },
} as const;

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();

  constructor() {
    // Clean up expired entries every minute
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 60 * 1000);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key);
      }
    }
  }

  private getKey(identifier: string, route: string): string {
    return `${identifier}:${route}`;
  }

  check(
    identifier: string,
    route: string,
    config: RateLimitConfig = RATE_LIMIT_CONFIGS.api
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const key = this.getKey(identifier, route);
    const now = Date.now();

    let entry = this.store.get(key);

    // If no entry or window expired, create new entry
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
      };
    }

    entry.count++;
    this.store.set(key, entry);

    const remaining = Math.max(0, config.maxRequests - entry.count);
    const allowed = entry.count <= config.maxRequests;

    return {
      allowed,
      remaining,
      resetTime: entry.resetTime,
    };
  }

  reset(identifier: string, route: string): void {
    const key = this.getKey(identifier, route);
    this.store.delete(key);
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Helper function for API routes
export function checkRateLimit(
  request: Request,
  route: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.api
): { allowed: boolean; headers: Record<string, string> } {
  // Get identifier from IP or session
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0] || 'unknown';

  const result = rateLimiter.check(ip, route, config);

  const headers: Record<string, string> = {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetTime.toString(),
  };

  if (!result.allowed) {
    headers['Retry-After'] = Math.ceil((result.resetTime - Date.now()) / 1000).toString();
  }

  return {
    allowed: result.allowed,
    headers,
  };
}

// Response for rate limited requests
export function rateLimitedResponse(headers: Record<string, string>): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Too many requests. Please try again later.',
      code: 'RATE_LIMITED',
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }
  );
}
