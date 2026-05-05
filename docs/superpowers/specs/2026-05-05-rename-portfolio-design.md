# Rename Portfolio — Design Spec

**Date:** 2026-05-05  
**Status:** Approved

## Overview

Add the ability to rename a portfolio. The rename action is accessible in two places: the portfolios list page (card hover) and the portfolio detail page (header). A shared dialog component handles both entry points.

## API Layer

Add `PUT /api/v1/portfolios/{id}` to `lib/api-spec/openapi.yaml`:

- **Path param:** `id` (UUID)
- **Request body:** `PortfolioRequestDto` (schema already exists — `name: string`, required, maxLength 100)
- **Response:** `PortfolioDto` (schema already exists — `id: UUID`, `name: string`)
- **operationId:** `updatePortfolio`

Run codegen after updating the spec to generate the `useUpdatePortfolio` hook.

## New Component: `RenamePortfolioDialog`

**File:** `artifacts/stockscreener/src/components/rename-portfolio-dialog.tsx`

Mirrors `CreatePortfolioDialog` in structure:
- Uses React Hook Form + Zod with same validation rules: `min(1, "Name is mandatory")`, `max(100, "Max length 100 symbols")`
- Pre-fills the input with `currentName`
- On success: shows `toast.success("Portfolio renamed successfully")`, invalidates two query keys:
  - `["/api/v1/portfolios/my", user.email]` — refreshes the portfolios list
  - `["/api/v1/portfolios", portfolioId]` — refreshes the portfolio detail page

**Props:**
```ts
interface RenamePortfolioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolioId: string;
  currentName: string;
}
```

## Portfolios List Page (`portfolios-list.tsx`)

Add a `Pencil` icon button on each portfolio card, positioned to the left of the existing `Trash2` button. Both buttons share the same hover-reveal pattern (`absolute top-4 opacity-0 group-hover:opacity-100`).

State: `renameTarget: { id: string; name: string } | null` — set on pencil click, cleared when dialog closes.

## Portfolio Detail Page (`portfolio.tsx`)

Add a `variant="ghost" size="icon"` button with a `Pencil` icon inline in the `<h1>` header area, next to the portfolio name. State: `renameDialogOpen: boolean`.

## Query Invalidation

| Location | Keys invalidated |
|---|---|
| After rename | `["/api/v1/portfolios/my", user.email]` |
| After rename | `["/api/v1/portfolios", portfolioId]` |

The second key matches the prefix used by `useGetPortfolioById` in `portfolio.tsx`, so the detail page title updates immediately after rename.

## Out of Scope

- Renaming from a dropdown/context menu
- Optimistic updates
- Inline (click-to-edit) renaming
