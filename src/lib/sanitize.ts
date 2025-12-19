// ============================================
// Input Sanitization
// Prevents XSS, injection attacks, and malformed input
// ============================================

// HTML entities to escape
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

// Escape HTML special characters to prevent XSS
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

// Remove potentially dangerous HTML tags
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

// Sanitize a string for safe storage and display
export function sanitizeString(str: string | null | undefined): string {
  if (!str) return '';

  return (
    str
      .trim()
      // Remove null bytes
      .replace(/\0/g, '')
      // Remove control characters except newlines and tabs
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Limit consecutive whitespace
      .replace(/\s+/g, ' ')
  );
}

// Sanitize for display (escape HTML)
export function sanitizeForDisplay(str: string | null | undefined): string {
  if (!str) return '';
  return escapeHtml(sanitizeString(str));
}

// Sanitize email address
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return '';

  return (
    email
      .toLowerCase()
      .trim()
      // Remove any characters that shouldn't be in an email
      .replace(/[^\w.@+-]/g, '')
      // Limit length
      .slice(0, 254)
  );
}

// Sanitize phone number (Ghana format)
export function sanitizePhone(phone: string | null | undefined): string {
  if (!phone) return '';

  // Keep only digits and + sign
  return phone.replace(/[^\d+]/g, '').slice(0, 15);
}

// Sanitize URL
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    return parsed.href;
  } catch {
    return null;
  }
}

// Sanitize filename
export function sanitizeFilename(filename: string | null | undefined): string {
  if (!filename) return '';

  return (
    filename
      // Remove path separators
      .replace(/[/\\]/g, '')
      // Remove null bytes
      .replace(/\0/g, '')
      // Remove other potentially dangerous characters
      .replace(/[<>:"|?*]/g, '')
      // Limit length
      .slice(0, 255)
  );
}

// Sanitize object recursively
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'string'
          ? sanitizeString(item)
          : typeof item === 'object' && item !== null
            ? sanitizeObject(item as Record<string, unknown>)
            : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

// Validate and sanitize numeric input
export function sanitizeNumber(
  value: unknown,
  options?: {
    min?: number;
    max?: number;
    defaultValue?: number;
  }
): number {
  const {
    min = Number.MIN_SAFE_INTEGER,
    max = Number.MAX_SAFE_INTEGER,
    defaultValue = 0,
  } = options || {};

  if (value === null || value === undefined) {
    return defaultValue;
  }

  const num = typeof value === 'number' ? value : parseFloat(String(value));

  if (Number.isNaN(num)) {
    return defaultValue;
  }

  return Math.max(min, Math.min(max, num));
}

// Validate and sanitize integer input
export function sanitizeInteger(
  value: unknown,
  options?: {
    min?: number;
    max?: number;
    defaultValue?: number;
  }
): number {
  return Math.floor(sanitizeNumber(value, options));
}

// Sanitize array of strings
export function sanitizeStringArray(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];

  return arr
    .filter((item): item is string => typeof item === 'string')
    .map((item) => sanitizeString(item))
    .filter((item) => item.length > 0);
}

// Check for SQL injection patterns (extra layer, Prisma already protects)
export function hasSQLInjectionPattern(str: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|UNION)\b)/i,
    /--/,
    /;.*(\b(SELECT|INSERT|UPDATE|DELETE|DROP)\b)/i,
    /\/\*.*\*\//,
    /\bOR\b.*\b=\b/i,
    /\bAND\b.*\b=\b/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(str));
}

// Check for XSS patterns
export function hasXSSPattern(str: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:/gi,
    /vbscript:/gi,
  ];

  return xssPatterns.some((pattern) => pattern.test(str));
}

// Comprehensive input validation
export function validateInput(str: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (hasSQLInjectionPattern(str)) {
    issues.push('Potential SQL injection pattern detected');
  }

  if (hasXSSPattern(str)) {
    issues.push('Potential XSS pattern detected');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
