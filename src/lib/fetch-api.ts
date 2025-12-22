import { getCsrfTokenSync } from '@/hooks/use-csrf';

export async function fetchApi(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});

  if (!['GET', 'HEAD', 'OPTIONS'].includes(options.method?.toUpperCase() || 'GET')) {
    const token = getCsrfTokenSync();
    if (token) {
      headers.set('x-csrf-token', token);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}
