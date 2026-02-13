/**
 * Authenticated fetch() wrapper with automatic token refresh.
 *
 * Uses native fetch() — no Axios dependency.
 */

import type { AuthManager } from './auth-manager';

export interface AuthFetchOptions extends RequestInit {
  /** Skip adding Authorization header for this request. */
  skipAuth?: boolean;
}

/**
 * Create an authenticated fetch function that injects Bearer tokens.
 *
 * @param baseURL - Base URL for all requests (e.g., "/api/v1" or "https://api.example.com")
 * @param authManager - The auth manager instance for token access.
 *
 * @example
 * const api = createAuthFetch('/api/v1', authManager);
 * const resp = await api('/users/me');
 * const data = await resp.json();
 */
export function createAuthFetch(
  baseURL: string,
  authManager: AuthManager,
): (path: string, options?: AuthFetchOptions) => Promise<Response> {
  return async function authFetch(path: string, options: AuthFetchOptions = {}): Promise<Response> {
    const url = path.startsWith('http') ? path : `${baseURL}${path}`;
    const headers = new Headers(options.headers);

    if (!options.skipAuth) {
      const token = await authManager.getToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
      headers.set('Content-Type', 'application/json');
    }

    let response = await fetch(url, { ...options, headers });

    // On 401, try refreshing token and retry once
    if (response.status === 401 && !options.skipAuth && !authManager.isLocalMode) {
      const freshToken = await authManager.getToken();
      if (freshToken) {
        headers.set('Authorization', `Bearer ${freshToken}`);
        response = await fetch(url, { ...options, headers });
      }
    }

    return response;
  };
}
