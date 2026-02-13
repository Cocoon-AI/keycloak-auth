/**
 * @cocoon-ai/keycloak-auth — Shared Keycloak authentication for Cocoon AI SPAs.
 *
 * Core exports (framework-agnostic). For React, import from '@cocoon-ai/keycloak-auth/react'.
 */

export { createKeycloakConfig, isLocalAuthMode } from './config';
export { getKeycloak, initKeycloak, resetKeycloak } from './keycloak-instance';
export { createAuthManager } from './auth-manager';
export { createAuthFetch } from './http';
export { createAuthenticatedSSE } from './sse';

export type {
  AuthUser,
  AuthState,
  KeycloakAuthConfig,
  AuthManagerCallbacks,
} from './types';
export type { AuthManager } from './auth-manager';
export type { AuthFetchOptions } from './http';
export type { AuthSSEOptions } from './sse';
