import { getAuthHeaders } from '@/lib/db/getAuthHeaders';

type ApiFetchOptions = RequestInit & { headers?: HeadersInit };

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers.map(([key, value]) => [key, String(value)]));
  }
  return { ...(headers as Record<string, string>) };
}

export async function apiFetch(input: RequestInfo | URL, options: ApiFetchOptions = {}) {
  const authHeaders = await getAuthHeaders().catch(() => ({}));
  const mergedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(authHeaders || {}),
    ...normalizeHeaders(options.headers),
  };

  return fetch(input, {
    ...options,
    headers: mergedHeaders,
    credentials: 'include', // EXPLÍCITAMENTE INCLUIDO PARA ENVIAR COOKIES
  });
}

export default apiFetch;
