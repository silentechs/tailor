import { useEffect, useState } from 'react';

let globalCsrfToken: string | null = null;

export function useCsrf() {
  const [csrfToken, setCsrfToken] = useState<string | null>(globalCsrfToken);
  const [isLoading, setIsLoading] = useState(!globalCsrfToken);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (globalCsrfToken) {
      setCsrfToken(globalCsrfToken);
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

export function getCsrfTokenSync() {
  return globalCsrfToken;
}
