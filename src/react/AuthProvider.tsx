/**
 * React AuthProvider — wraps the framework-agnostic AuthManager in React context.
 *
 * This is for existing React SPAs (portal, billie) during their transition
 * to server-rendered apps. New apps should use session-based auth instead.
 */

import { createContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { AuthUser, AuthState, KeycloakAuthConfig, AuthManagerCallbacks } from '../types';
import { createAuthManager, type AuthManager } from '../auth-manager';

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  loginWithKeycloak: (redirectUri?: string) => void;
  logout: (redirectUri?: string) => void;
  isLocalMode: boolean;
  /** Access the underlying AuthManager for advanced use (e.g., getToken()). */
  manager: AuthManager;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export interface AuthProviderProps {
  children: ReactNode;
  config: KeycloakAuthConfig;
  callbacks?: AuthManagerCallbacks;
}

export function AuthProvider({ children, config, callbacks }: AuthProviderProps) {
  const [manager] = useState(() => createAuthManager(config, callbacks));
  const [state, setState] = useState<AuthState>(manager.getState());

  useEffect(() => {
    const unsubscribe = manager.onStateChange(setState);
    manager.init();
    return unsubscribe;
  }, [manager]);

  const login = useCallback(
    async (email: string, password: string) => {
      await manager.localLogin(email, password);
    },
    [manager],
  );

  const loginWithKeycloak = useCallback(
    (redirectUri?: string) => {
      manager.login(redirectUri);
    },
    [manager],
  );

  const logout = useCallback(
    (redirectUri?: string) => {
      manager.logout(redirectUri);
    },
    [manager],
  );

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        loginWithKeycloak,
        logout,
        isLocalMode: manager.isLocalMode,
        manager,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
