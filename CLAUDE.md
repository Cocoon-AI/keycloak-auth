## Project Overview

Shared Keycloak authentication library for Cocoon AI SPA frontends. Published as `@cocoon-ai/keycloak-auth`.

Used by portal and billie (React SPAs). Not needed for session-based apps like spyder — those use only the Python package (`keycloak-cocoon-ai`).

Companion to the Python backend package: [Cocoon-AI/keycloak-cocoon-ai](https://github.com/Cocoon-AI/keycloak-cocoon-ai).

## Architecture

SPA token-based auth: browser handles OAuth via keycloak-js, sends Bearer tokens to the backend.

```
Browser  ──keycloak-js──>  Keycloak  ──token──>  Browser
Browser  ──Bearer token──> FastAPI   ──validate──> JWKS
```

## Directory Structure

```
src/
  index.ts                        # Core exports (no React)
  config.ts                       # createKeycloakConfig(), isLocalAuthMode()
  types.ts                        # AuthUser, AuthState, KeycloakAuthConfig, AuthManagerCallbacks
  keycloak-instance.ts            # Singleton getKeycloak() + initKeycloak() with StrictMode guard
  auth-manager.ts                 # createAuthManager() — framework-agnostic state + token mgmt
  http.ts                         # createAuthFetch() — native fetch() wrapper with Bearer injection
  sse.ts                          # createAuthenticatedSSE() — token via query param
  react/
    index.ts                      # React subpath exports
    AuthProvider.tsx              # React context wrapping auth-manager
    useAuth.ts                    # Hook returning auth state + actions
public/
  silent-check-sso.html           # For Keycloak silent SSO check
package.json                      # @cocoon-ai/keycloak-auth, exports "." and "./react"
tsconfig.json
```

## Key Design Decisions

- **Native fetch, no Axios** — `http.ts` uses native `fetch()`. One less dependency.
- **keycloak-js directly, no @react-keycloak/web** — That wrapper is unmaintained and doesn't support React 19. We use keycloak-js with our own thin React context.
- **PKCE S256** — Init uses `pkceMethod: 'S256'` for all Keycloak flows.
- **Token via query param** — SSE/EventSource can't set headers, so `?token=` is supported as fallback.
- **Factory pattern** — `createAuthManager(config)` returns a framework-agnostic auth manager. No module-level singletons.

## Dependencies

- **Direct**: `keycloak-js`
- **Peer (optional)**: `react` (only needed when importing from `/react`)

## Common Commands

```bash
npm run typecheck               # tsc --noEmit
npm run build                   # tsc → dist/
npm run clean                   # rm -rf dist
```

## Important Patterns

### StrictMode protection

`keycloak-instance.ts` tracks initialization state to prevent double-init when React StrictMode remounts components. The `initKeycloak()` function returns the same promise if called multiple times.

### Two subpath exports

- `@cocoon-ai/keycloak-auth` — Core: config, auth manager, fetch wrapper, SSE. Framework-agnostic.
- `@cocoon-ai/keycloak-auth/react` — React context (`AuthProvider`) and hook (`useAuth`). Requires `react` peer dep.

## Cocoon AI Defaults

- Server URL: `https://auth.cocoon-ai.com`
- Realm: `cai-portal`
- Client ID: `cai-portal-frontend`

Override per-app via `createKeycloakConfig({ clientId: 'billie' })`.

## Consumers

| Project | Pattern |
|---------|---------|
| **Portal** | React (`AuthProvider` + `useAuth`) |
| **Billie** | React (`AuthProvider` + `useAuth`) |
| **Spyder** | Not used (server-rendered, uses Python session auth only) |
