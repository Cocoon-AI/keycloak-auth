/**
 * React hook for accessing auth state.
 */

import { useContext } from 'react';
import { AuthContext, type AuthContextType } from './AuthProvider';

/**
 * Access auth state and actions from within a component.
 *
 * Must be used inside an <AuthProvider>.
 *
 * @example
 * function Profile() {
 *   const { user, isAuthenticated, logout } = useAuth();
 *   if (!isAuthenticated) return <div>Not logged in</div>;
 *   return <div>Hello {user.name} <button onClick={() => logout()}>Logout</button></div>;
 * }
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
}
