/**
 * Keycloak configuration with cocoon-ai defaults and Vite env var support.
 */

import type { KeycloakAuthConfig } from './types';

declare global {
  interface ImportMeta {
    env: Record<string, string | undefined>;
  }
}

/**
 * Create a Keycloak config from environment variables with cocoon-ai defaults.
 *
 * Reads from Vite env vars:
 * - VITE_KEYCLOAK_URL (default: https://auth.cocoon-ai.com)
 * - VITE_KEYCLOAK_REALM (default: cai-portal)
 * - VITE_KEYCLOAK_CLIENT_ID (default: provided clientId)
 */
export function createKeycloakConfig(defaults?: Partial<KeycloakAuthConfig>): KeycloakAuthConfig {
  const env = typeof import.meta !== 'undefined' ? import.meta.env : {};

  return {
    url: env.VITE_KEYCLOAK_URL ?? defaults?.url ?? 'https://auth.cocoon-ai.com',
    realm: env.VITE_KEYCLOAK_REALM ?? defaults?.realm ?? 'cai-portal',
    clientId: env.VITE_KEYCLOAK_CLIENT_ID ?? defaults?.clientId ?? 'cai-portal-frontend',
  };
}

/**
 * Check if we're in local auth mode (no Keycloak needed).
 *
 * Returns true when the API URL points to localhost,
 * unless VITE_FORCE_KEYCLOAK=true is set.
 */
export function isLocalAuthMode(): boolean {
  const env = typeof import.meta !== 'undefined' ? import.meta.env : {};

  if (env.VITE_FORCE_KEYCLOAK === 'true') {
    return false;
  }
  const apiUrl = env.VITE_API_URL ?? '';
  return apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1');
}
