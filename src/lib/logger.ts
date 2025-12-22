/**
 * Production-ready logging utility for StitchCraft
 *
 * This provides structured error logging that:
 * - In development: logs to console with full details
 * - In production: silently captures errors (ready for Sentry integration)
 *
 * To enable Sentry later:
 * 1. Install: npm install @sentry/nextjs
 * 2. Run: npx @sentry/wizard@latest -i nextjs
 * 3. Uncomment the Sentry imports and calls below
 */

// Uncomment when Sentry is installed:
// import * as Sentry from '@sentry/nextjs';

const isDev = process.env.NODE_ENV === 'development';

type LogContext = Record<string, unknown>;

interface LogError {
  message: string;
  stack?: string;
  name?: string;
  [key: string]: unknown;
}

function normalizeError(error: unknown): LogError {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
    };
  }
  if (typeof error === 'string') {
    return { message: error };
  }
  if (typeof error === 'object' && error !== null) {
    return { message: JSON.stringify(error), ...(error as Record<string, unknown>) };
  }
  return { message: String(error) };
}

/**
 * Capture and log an error
 *
 * @param label - A descriptive label for the error location (e.g., 'OrdersAPI', 'PaymentFlow')
 * @param error - The error object or message
 * @param context - Optional additional context
 */
export function captureError(label: string, error: unknown, context?: LogContext): void {
  const normalizedError = normalizeError(error);

  if (isDev) {
    // Development: Full console output for debugging
    console.error(`[${label}]`, normalizedError.message, context || '');
    if (normalizedError.stack) {
      console.error(normalizedError.stack);
    }
  } else {
    // Production: Silent capture (ready for Sentry)
    // Uncomment when Sentry is installed:
    // Sentry.captureException(error instanceof Error ? error : new Error(normalizedError.message), {
    //   tags: { label },
    //   extra: { ...context, originalError: normalizedError },
    // });
  }
}

/**
 * Capture a warning (non-critical issue)
 */
export function captureWarning(label: string, message: string, context?: LogContext): void {
  if (isDev) {
    console.warn(`[${label}]`, message, context || '');
  } else {
    // Uncomment when Sentry is installed:
    // Sentry.captureMessage(message, {
    //   level: 'warning',
    //   tags: { label },
    //   extra: context,
    // });
  }
}

/**
 * Capture an info message (for tracking important events)
 */
export function captureInfo(label: string, message: string, context?: LogContext): void {
  if (isDev) {
    console.info(`[${label}]`, message, context || '');
  }
  // In production, info messages are typically not sent to error tracking
}

/**
 * Create a scoped logger for a specific module/feature
 *
 * @example
 * const logger = createLogger('PaymentService');
 * logger.error(error, { orderId: '123' });
 */
export function createLogger(label: string) {
  return {
    error: (error: unknown, context?: LogContext) => captureError(label, error, context),
    warn: (message: string, context?: LogContext) => captureWarning(label, message, context),
    info: (message: string, context?: LogContext) => captureInfo(label, message, context),
  };
}

// Default export for quick usage
export default {
  error: captureError,
  warn: captureWarning,
  info: captureInfo,
  createLogger,
};
