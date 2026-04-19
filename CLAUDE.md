# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

pnpm monorepo with a React frontend (`stockscreener`), a UI component sandbox (`mockup-sandbox`), and shared libraries for the API spec and generated client code. The OpenAPI spec is the source of truth for the API contract — frontend hooks are generated from it. **This is a frontend-only project. The backend lives in a separate repository and is not part of this monorepo.**

## Commands

```bash
# Root
pnpm install                      # Install all dependencies
pnpm run dev                      # Start stockscreener (3000)
pnpm run build                    # Typecheck + build all packages
pnpm run typecheck                # tsc --build across all composite projects

# Per-package
pnpm --filter @workspace/stockscreener run dev
pnpm --filter @workspace/api-spec run codegen      # Regenerate React Query hooks from openapi.yaml
```

No test suite is configured.

## Architecture

```
stockscreener (React 19, Vite)
    └── @workspace/api-client-react   ← generated React Query hooks + custom fetch
Both generated from:
    └── @workspace/api-spec (openapi.yaml → Orval codegen)
mockup-sandbox (React, Vite)          ← UI component development sandbox
```

### Codegen pipeline

`lib/api-spec/openapi.yaml` is the canonical API spec. Running `pnpm --filter @workspace/api-spec run codegen` (Orval) writes:
- `lib/api-client-react/src/generated/` — React Query hooks and TypeScript types

**Any new API endpoint** requires: update `openapi.yaml` → run codegen → consume hook in the frontend.

### TypeScript project references

The repo uses TypeScript composite projects. Always typecheck from the root (`pnpm run typecheck`). Individual package `typecheck` scripts work for local iteration, but cross-package type errors only surface in a full root build.

### Frontend routing

`stockscreener` uses `wouter`. Routes support a `BASE_URL` / `BASE_PATH` prefix for subdirectory deployments. The production API URL is set in `artifacts/stockscreener/src/main.tsx` via `setBaseUrl()` from `@workspace/api-client-react`.

## Key environment variables

| Variable | Used by | Notes |
|---|---|---|
| `PORT` | `stockscreener` | Default: 3000 |
| `VITE_API_URL` | `stockscreener` | Production API base URL |
| `BASE_PATH` | `stockscreener` | Vite routing prefix |

## Stack

- **Frontend:** React 19, Vite, TanStack Query, Wouter, Tailwind CSS v4, Radix UI, Recharts, Framer Motion, React Hook Form
- **Tooling:** pnpm, TypeScript ~5.9, Orval (OpenAPI codegen)
