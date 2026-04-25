# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

pnpm monorepo with a React frontend (`stockscreener`), a UI component sandbox (`mockup-sandbox`), and shared libraries for the API spec and generated client code. The OpenAPI spec is the source of truth for the API contract — frontend hooks are generated from it. **This is a frontend-only project. The backend lives in a separate repository and is not part of this monorepo.**

## Commands

```bash
# Root
pnpm install                      # Install all dependencies
pnpm run dev                      # Start stockscreener on port 3000
pnpm run build                    # Typecheck + build all packages
pnpm run typecheck                # Full typecheck: libs first, then artifacts + scripts

# Per-package
pnpm --filter @workspace/stockscreener run dev
pnpm --filter @workspace/api-spec run codegen      # Regenerate React Query hooks from openapi.yaml
```

No test suite is configured.

## Architecture

```
artifacts/
  stockscreener/       ← main React app (React 19, Vite)
  mockup-sandbox/      ← UI component development sandbox
  api-server/          ← placeholder / mock server (currently empty)

lib/
  api-spec/            ← openapi.yaml + orval.config.ts (source of truth)
  api-client-react/    ← generated React Query hooks + custom fetch layer
    src/
      custom-fetch.ts  ← customFetch, ApiError, setBaseUrl, setOnUnauthorized
      generated/       ← Orval-generated hooks and TypeScript types
      index.ts         ← re-exports everything
```

### Codegen pipeline

`lib/api-spec/openapi.yaml` is the canonical API spec. Running `pnpm --filter @workspace/api-spec run codegen` (Orval) writes:
- `lib/api-client-react/src/generated/` — React Query hooks and TypeScript types

**Any new API endpoint** requires: update `openapi.yaml` → run codegen → consume hook in the frontend.

### TypeScript project references

The repo uses TypeScript composite projects. Always typecheck from the root (`pnpm run typecheck`). Individual package `typecheck` scripts work for local iteration, but cross-package type errors only surface in a full root build.

### Frontend routing

`stockscreener` uses `wouter`. The `BASE_URL` / `BASE_PATH` prefix supports subdirectory deployments.

| Route | Page |
|---|---|
| `/` | Home (stock screener) |
| `/portfolios` | PortfoliosList |
| `/portfolio` | Portfolio |
| `/watchlists` | WatchlistsList |
| `/watchlist` | WatchlistPage |
| `/auth` | Auth (login / register) |
| `/ticker/:idOrSymbol` | TickerDetail |

### Authentication

Cookie-based auth via HttpOnly cookies. `customFetch` always sends `credentials: "include"`.

- **User info** (email + fullName) is persisted in `localStorage` under the key `tt_user`.
- **Token refresh**: `AuthProvider` registers a `setOnUnauthorized` callback. When any fetch returns 401, `customFetch` calls that callback, which hits `POST /api/v1/auth/refresh`, and retries the original request once if refresh succeeds.
- **Proactive refresh**: `AuthProvider` refreshes the token every 10 minutes while a user is logged in.
- **Auth endpoints**: `POST /api/v1/auth/login`, `POST /api/v1/auth/registration`, `POST /api/v1/auth/logout`, `POST /api/v1/auth/refresh`

### Global error handling

`App.tsx` wires `QueryCache` and `MutationCache` with an `onError` handler that surfaces errors via `sonner` toasts:

- Query errors at 5xx (or non-`ApiError`) are **silent** — the UI shows empty/N/A states.
- Query errors at 4xx (e.g. 403) **show a toast**.
- Mutation errors always show a toast.
- Setting `meta.suppressErrorToast = true` on a query/mutation opts out of global toasts.
- A 401 from any query/mutation shows "Session expired, please sign in again".

### Production API

Set via `setBaseUrl()` in `artifacts/stockscreener/src/main.tsx`:
- Default: `https://core-production-3d7a.up.railway.app`
- Override with `VITE_API_URL` env var.

## Key environment variables

| Variable | Used by | Notes |
|---|---|---|
| `PORT` | `stockscreener` | Default: 3000 |
| `VITE_API_URL` | `stockscreener` | Production API base URL |
| `BASE_PATH` | `stockscreener` | Vite routing prefix |

## Stack

- **Frontend:** React 19, Vite 7, TanStack Query v5, Wouter, Tailwind CSS v4, Radix UI, Recharts, Framer Motion, React Hook Form, Zod
- **UI extras:** Sonner (toasts), next-themes (dark/light mode), cmdk, vaul, embla-carousel, react-day-picker, react-resizable-panels, react-icons, lucide-react
- **Tooling:** pnpm, TypeScript ~5.9, Orval (OpenAPI codegen)
