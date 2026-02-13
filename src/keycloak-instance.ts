/**
 * Singleton Keycloak instance with StrictMode double-init protection.
 */

import Keycloak from 'keycloak-js';
import type { KeycloakAuthConfig } from './types';

let keycloakInstance: Keycloak | null = null;
let initPromise: Promise<boolean> | null = null;
let initialized = false;

/**
 * Get or create the Keycloak singleton instance.
 */
export function getKeycloak(config: KeycloakAuthConfig): Keycloak {
  if (!keycloakInstance) {
    keycloakInstance = new Keycloak({
      url: config.url,
      realm: config.realm,
      clientId: config.clientId,
    });
  }
  return keycloakInstance;
}

/**
 * Initialize Keycloak with check-sso and PKCE S256.
 *
 * Safe to call multiple times — subsequent calls return the same promise.
 * Handles React StrictMode double-mount by tracking initialization state.
 */
export async function initKeycloak(config: KeycloakAuthConfig): Promise<boolean> {
  if (initialized) {
    const kc = getKeycloak(config);
    return kc.authenticated ?? false;
  }

  if (initPromise) {
    return initPromise;
  }

  const kc = getKeycloak(config);

  initPromise = kc
    .init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      pkceMethod: 'S256',
      checkLoginIframe: false,
    })
    .then((authenticated) => {
      initialized = true;
      return authenticated;
    });

  return initPromise;
}

/**
 * Reset the Keycloak singleton (for testing).
 */
export function resetKeycloak(): void {
  keycloakInstance = null;
  initPromise = null;
  initialized = false;
}
