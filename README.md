# @cocoon-ai/keycloak-auth

Shared Keycloak authentication library for Cocoon AI SPA frontends (React, Alpine.js, vanilla JS).

Companion to the Python backend package: [`keycloak-cocoon-ai`](https://github.com/Cocoon-AI/keycloak-cocoon-ai).

## Install

```bash
npm install git+ssh://git@github.com/Cocoon-AI/keycloak-auth.git
```

## Core (framework-agnostic)

```typescript
import { createKeycloakConfig, createAuthManager, createAuthFetch } from '@cocoon-ai/keycloak-auth';

// Config with cocoon-ai defaults (reads VITE_KEYCLOAK_* env vars)
const config = createKeycloakConfig({ clientId: 'my-app' });

// Auth manager — works with React, Alpine.js, or plain JS
const auth = createAuthManager(config, {
  fetchUser: async (token) => {
    const resp = await fetch('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return resp.json();
  },
});

await auth.init();

// Subscribe to state changes
auth.onStateChange((state) => {
  console.log(state.isAuthenticated, state.user);
});

// Authenticated fetch (auto-injects Bearer token, retries on 401)
const api = createAuthFetch('/api/v1', auth);
const resp = await api('/users/me');

// Authenticated SSE
import { createAuthenticatedSSE } from '@cocoon-ai/keycloak-auth';
const es = await createAuthenticatedSSE('/api/v1', '/events/stream', auth);
es.onmessage = (e) => console.log(e.data);
```

## React Integration

```tsx
import { AuthProvider, useAuth } from '@cocoon-ai/keycloak-auth/react';
import { createKeycloakConfig } from '@cocoon-ai/keycloak-auth';

const config = createKeycloakConfig({ clientId: 'my-app' });

function App() {
  return (
    <AuthProvider config={config} callbacks={{ fetchUser }}>
      <Main />
    </AuthProvider>
  );
}

function Main() {
  const { user, isAuthenticated, isLoading, login, logout, manager } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <button onClick={() => login('', '')}>Login</button>;

  return <div>Hello {user.name} <button onClick={() => logout()}>Logout</button></div>;
}
```

## Alpine.js Integration

```javascript
import { createKeycloakConfig, createAuthManager } from '@cocoon-ai/keycloak-auth';

const config = createKeycloakConfig({ clientId: 'my-app' });
const auth = createAuthManager(config);

Alpine.store('auth', {
  ...auth.getState(),
  async init() {
    auth.onStateChange((state) => {
      Object.assign(Alpine.store('auth'), state);
    });
    await auth.init();
  },
  login: () => auth.login(),
  logout: () => auth.logout(),
});
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_KEYCLOAK_URL` | `https://auth.cocoon-ai.com` | Keycloak server URL |
| `VITE_KEYCLOAK_REALM` | `cai-portal` | Keycloak realm |
| `VITE_KEYCLOAK_CLIENT_ID` | `cai-portal-frontend` | Keycloak client ID |
| `VITE_API_URL` | — | Backend API URL (localhost = local auth mode) |
| `VITE_FORCE_KEYCLOAK` | — | Set to `true` to use Keycloak even locally |

## SSO Setup

Copy `public/silent-check-sso.html` to your app's public directory for silent SSO checks.

## Development

```bash
npm install
npm run typecheck    # tsc --noEmit
npm run build        # tsc → dist/
```
