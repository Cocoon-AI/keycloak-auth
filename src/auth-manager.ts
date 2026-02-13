/**
 * Framework-agnostic auth state management.
 *
 * Works with React, Alpine.js, or plain JavaScript.
 * Manages Keycloak initialization, token refresh, and auth state.
 */

import type { AuthUser, AuthState, KeycloakAuthConfig, AuthManagerCallbacks } from './types';
import { getKeycloak, initKeycloak } from './keycloak-instance';
import { isLocalAuthMode } from './config';

type StateChangeCallback = (state: AuthState) => void;

export interface AuthManager {
  /** Initialize auth — call once on app startup. */
  init(): Promise<void>;
  /** Get current auth state. */
  getState(): AuthState;
  /** Get current access token (refreshes if needed). */
  getToken(): Promise<string | null>;
  /** Trigger Keycloak login redirect. */
  login(redirectUri?: string): void;
  /** Local dev login with email/password. */
  localLogin(email: string, password: string): Promise<void>;
  /** Logout and clear state. */
  logout(redirectUri?: string): void;
  /** Subscribe to state changes. Returns unsubscribe function. */
  onStateChange(callback: StateChangeCallback): () => void;
  /** Whether running in local auth mode. */
  isLocalMode: boolean;
}

/**
 * Create a framework-agnostic auth manager.
 *
 * @example
 * // Plain JavaScript
 * const auth = createAuthManager(config, { fetchUser: (token) => fetch('/auth/me', ...) });
 * await auth.init();
 * auth.onStateChange(state => console.log(state));
 *
 * @example
 * // Alpine.js
 * Alpine.store('auth', createAuthManager(config, callbacks));
 * Alpine.store('auth').init();
 */
export function createAuthManager(
  config: KeycloakAuthConfig,
  callbacks?: AuthManagerCallbacks,
): AuthManager {
  const localMode = isLocalAuthMode();
  const listeners: Set<StateChangeCallback> = new Set();

  let state: AuthState = {
    user: null,
    token: localStorage.getItem('token'),
    isLoading: true,
    isAuthenticated: false,
  };

  function setState(update: Partial<AuthState>) {
    state = { ...state, ...update };
    listeners.forEach((cb) => cb(state));
  }

  function userFromToken(token: string): AuthUser {
    // Decode JWT payload (no verification — just for display)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        sub: payload.sub ?? '',
        email: payload.email ?? '',
        name: payload.name ?? payload.preferred_username,
        picture: payload.picture,
        roles: payload.realm_access?.roles ?? [],
      };
    } catch {
      return { sub: '', email: '', roles: [] };
    }
  }

  async function fetchAndSetUser(token: string) {
    localStorage.setItem('token', token);
    try {
      const user = callbacks?.fetchUser
        ? await callbacks.fetchUser(token)
        : userFromToken(token);
      setState({ user, token, isLoading: false, isAuthenticated: true });
    } catch {
      localStorage.removeItem('token');
      setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
    }
  }

  async function initKeycloakAuth() {
    try {
      const authenticated = await initKeycloak(config);
      const kc = getKeycloak(config);

      if (authenticated && kc.token) {
        await fetchAndSetUser(kc.token);

        // Set up token refresh
        kc.onTokenExpired = () => {
          kc.updateToken(30)
            .then((refreshed) => {
              if (refreshed && kc.token) {
                localStorage.setItem('token', kc.token);
                setState({ token: kc.token });
              }
            })
            .catch(() => {
              manager.logout();
            });
        };
      } else {
        // Silent SSO failed — try localStorage fallback
        const savedToken = localStorage.getItem('token');
        if (savedToken) {
          await fetchAndSetUser(savedToken);
        } else {
          setState({ isLoading: false });
        }
      }
    } catch {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        await fetchAndSetUser(savedToken);
      } else {
        setState({ isLoading: false });
      }
    }
  }

  const manager: AuthManager = {
    isLocalMode: localMode,

    async init() {
      if (localMode) {
        const token = localStorage.getItem('token');
        if (token) {
          await fetchAndSetUser(token);
        } else {
          setState({ isLoading: false });
        }
      } else {
        await initKeycloakAuth();
      }
    },

    getState() {
      return state;
    },

    async getToken() {
      if (!localMode) {
        const kc = getKeycloak(config);
        if (kc.authenticated) {
          try {
            await kc.updateToken(30);
            if (kc.token) {
              localStorage.setItem('token', kc.token);
              return kc.token;
            }
          } catch {
            // Fall through to localStorage
          }
        }
      }
      return localStorage.getItem('token');
    },

    login(redirectUri?: string) {
      const kc = getKeycloak(config);
      kc.login({ redirectUri: redirectUri ?? window.location.origin });
    },

    async localLogin(email: string, password: string) {
      if (!callbacks?.localLogin) {
        throw new Error('localLogin callback not provided');
      }
      const { token, user } = await callbacks.localLogin(email, password);
      localStorage.setItem('token', token);
      setState({ user, token, isLoading: false, isAuthenticated: true });
    },

    logout(redirectUri?: string) {
      localStorage.removeItem('token');
      setState({ user: null, token: null, isLoading: false, isAuthenticated: false });

      if (!localMode) {
        const kc = getKeycloak(config);
        if (kc.authenticated) {
          kc.logout({ redirectUri: redirectUri ?? window.location.origin });
        }
      }
    },

    onStateChange(callback: StateChangeCallback) {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
  };

  return manager;
}
