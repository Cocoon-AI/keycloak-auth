/**
 * Authenticated Server-Sent Events (SSE) connections.
 *
 * EventSource doesn't support custom headers, so the token
 * is passed as a query parameter.
 */

import type { AuthManager } from './auth-manager';

export interface AuthSSEOptions {
  /** Additional query parameters. */
  params?: Record<string, string>;
  /** EventSource options (e.g., withCredentials). */
  eventSourceInit?: EventSourceInit;
}

/**
 * Create an authenticated EventSource connection.
 *
 * Refreshes the token before connecting and appends it as a query parameter.
 *
 * @param baseURL - Base URL for the SSE endpoint.
 * @param path - Path to the SSE endpoint.
 * @param authManager - The auth manager instance.
 * @param options - Additional options.
 *
 * @example
 * const es = await createAuthenticatedSSE('/api/v1', '/events/stream', authManager);
 * es.onmessage = (e) => console.log(e.data);
 * es.onerror = () => es.close();
 */
export async function createAuthenticatedSSE(
  baseURL: string,
  path: string,
  authManager: AuthManager,
  options?: AuthSSEOptions,
): Promise<EventSource> {
  const token = await authManager.getToken();
  const url = new URL(path.startsWith('http') ? path : `${baseURL}${path}`, window.location.origin);

  if (token) {
    url.searchParams.set('token', token);
  }

  if (options?.params) {
    for (const [key, value] of Object.entries(options.params)) {
      url.searchParams.set(key, value);
    }
  }

  return new EventSource(url.toString(), options?.eventSourceInit);
}
