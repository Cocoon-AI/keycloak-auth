/**
 * Shared auth types for Cocoon AI SPAs.
 */

export interface AuthUser {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  roles: string[];
  /** The actual backend role (e.g., from /auth/me) — set by fetchUser callback */
  actualRole?: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface KeycloakAuthConfig {
  url: string;
  realm: string;
  clientId: string;
}

export interface AuthManagerCallbacks {
  /**
   * Called after Keycloak authentication to fetch full user profile
   * from the app's backend (e.g., GET /auth/me).
   */
  fetchUser?: (token: string) => Promise<AuthUser>;
  /**
   * Called for local dev login (email/password) — only used in local mode.
   */
  localLogin?: (email: string, password: string) => Promise<{ token: string; user: AuthUser }>;
}
