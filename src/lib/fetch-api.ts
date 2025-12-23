import { getCsrfTokenSync } from '@/hooks/use-csrf';

// Cache for pending CSRF token fetch
let csrfFetchPromise: Promise<string | null> | null = null;

// Fetch CSRF token from API if not available in cache
async function ensureCsrfToken(): Promise<string | null> {
  // Already have a token
  const existingToken = getCsrfTokenSync();
  if (existingToken) {
    return existingToken;
  }

  // Already fetching - wait for it
  if (csrfFetchPromise) {
    return csrfFetchPromise;
  }

  // Fetch new token
  csrfFetchPromise = (async () => {
    try {
      const response = await fetch('/api/csrf');
      if (!response.ok) {
        console.warn('Failed to fetch CSRF token:', response.status);
        return null;
      }
      const data = await response.json();
      if (data.success && data.csrfToken) {
        // The useCsrf hook stores this globally, but we also update directly
        // in case the hook hasn't been initialized yet
        if (typeof window !== 'undefined') {
          (window as any).__csrfToken = data.csrfToken;
        }
        return data.csrfToken;
      }
      return null;
    } catch (error) {
      console.warn('Error fetching CSRF token:', error);
      return null;
    } finally {
      csrfFetchPromise = null;
    }
  })();

  return csrfFetchPromise;
}

export async function fetchApi(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});

  if (!['GET', 'HEAD', 'OPTIONS'].includes(options.method?.toUpperCase() || 'GET')) {
    // Try to get existing token first, then fetch if needed
    let token = getCsrfTokenSync();
    if (!token) {
      token = await ensureCsrfToken();
    }
    if (token) {
      headers.set('x-csrf-token', token);
    } else {
      console.warn(`fetchApi: No CSRF token available for ${options.method} request to ${url}`);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}
