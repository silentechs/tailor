import { useEffect, useState } from 'react';

let globalCsrfToken: string | null = null;

// Helper to get/set token from window object for cross-module synchronization
function getWindowToken(): string | null {
  if (typeof window !== 'undefined') {
    return (window as any).__csrfToken || null;
  }
  return null;
}

function setWindowToken(token: string) {
  if (typeof window !== 'undefined') {
    (window as any).__csrfToken = token;
  }
}

export function useCsrf() {
  const [csrfToken, setCsrfToken] = useState<string | null>(globalCsrfToken || getWindowToken());
  const [isLoading, setIsLoading] = useState(!globalCsrfToken && !getWindowToken());
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Check both sources
    const existingToken = globalCsrfToken || getWindowToken();
    if (existingToken) {
      globalCsrfToken = existingToken;
      setWindowToken(existingToken);
      setCsrfToken(existingToken);
      setIsLoading(false);
      return;
    }

    async function fetchToken(retries = 2) {
      try {
        const response = await fetch('/api/csrf');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        if (data.success) {
          globalCsrfToken = data.csrfToken;
          setWindowToken(data.csrfToken);
          setCsrfToken(data.csrfToken);
        } else {
          throw new Error(data.error || 'Failed to fetch CSRF token');
        }
      } catch (err) {
        if (retries > 0) {
          setTimeout(() => fetchToken(retries - 1), 1000);
        } else {
          setError(err instanceof Error ? err : new Error('Unknown error fetching CSRF token'));
        }
      } finally {
        if (retries === 0 || globalCsrfToken) {
          setIsLoading(false);
        }
      }
    }

    fetchToken();
  }, []);

  return { csrfToken, isLoading, error };
}

export function getCsrfTokenSync(): string | null {
  // Check both module-level cache and window object
  return globalCsrfToken || getWindowToken();
}
