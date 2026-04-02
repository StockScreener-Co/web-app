# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

pnpm monorepo with a React frontend (`stockscreener`), an Express 5 API server, and shared libraries for database access, API spec, and generated client code. The OpenAPI spec is the source of truth for the API contract — frontend hooks and server validation schemas are both generated from it.

## Commands

```bash
# Root
pnpm install                      # Install all dependencies
pnpm run start                    # Start both api-server (5000) and stockscreener (3000)
pnpm run dev:api                  # Start api-server only
pnpm run dev:web                  # Start stockscreener only
pnpm run build                    # Typecheck + build all packages
pnpm run typecheck                # tsc --build across all composite projects

# Per-package
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/stockscreener run dev
pnpm --filter @workspace/api-spec run codegen      # Regenerate React Query hooks + Zod schemas from openapi.yaml
pnpm --filter @workspace/db run push               # Push Drizzle schema to DB (requires DATABASE_URL)
```

No test suite is configured.

## Architecture

```
stockscreener (React 19, Vite)
    └── @workspace/api-client-react   ← generated React Query hooks + custom fetch
api-server (Express 5)
    └── @workspace/api-zod            ← generated Zod schemas for validation
Both generated from:
    └── @workspace/api-spec (openapi.yaml → Orval codegen)
api-server also uses:
    └── @workspace/db                 ← Drizzle ORM, PostgreSQL
```

### Codegen pipeline

`lib/api-spec/openapi.yaml` is the canonical API spec. Running `pnpm --filter @workspace/api-spec run codegen` (Orval) writes:
- `lib/api-client-react/src/generated/` — React Query hooks and TypeScript types
- `lib/api-zod/src/generated/` — Zod schemas and TypeScript types

**Any new API endpoint** requires: update `openapi.yaml` → run codegen → implement route in `api-server/src/routes/` → consume hook in the frontend.

### TypeScript project references

The repo uses TypeScript composite projects. Always typecheck from the root (`pnpm run typecheck`). Individual package `typecheck` scripts work for local iteration, but cross-package type errors only surface in a full root build.

### Frontend routing

`stockscreener` uses `wouter`. Routes support a `BASE_URL` / `BASE_PATH` prefix for subdirectory deployments. The production API URL is set in `artifacts/stockscreener/src/main.tsx` via `setBaseUrl()` and `setAuthTokenGetter()` from `@workspace/api-client-react`.

### API server

- Routes mounted under `/api` in `src/app.ts`
- Pino used for structured logging (HTTP middleware included)
- Zod schemas (from `@workspace/api-zod`) used for request/response validation
- esbuild bundles to `dist/index.mjs` for production

## Key environment variables

| Variable | Used by | Notes |
|---|---|---|
| `PORT` | `api-server`, `stockscreener` | Defaults: 5000 / 3000 |
| `VITE_API_URL` | `stockscreener` | Production API base URL |
| `BASE_PATH` | `stockscreener` | Vite routing prefix |

## Stack

- **Frontend:** React 19, Vite, TanStack Query, Wouter, Tailwind CSS v4, Radix UI, Recharts, Framer Motion, React Hook Form
- **Tooling:** pnpm, TypeScript ~5.9, Orval (OpenAPI codegen), esbuild
