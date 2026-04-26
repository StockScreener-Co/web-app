# Portfolio Server-Driven Columns — Design Spec

**Date:** 2026-04-26  
**Branch:** dev

## Overview

Replace the hardcoded frontend column list with server-driven column definitions fetched from `GET /api/v1/portfolios/columns`. Pass the user's selected columns as a query parameter to `GET /api/v1/portfolios/{id}?columns=...` so the backend returns only the requested fields. Collapse the previous four P&L columns (`todayPL`, `todayPLPct`, `totalPL`, `totalPLPct`) into two combined cells matching the Current Price column style.

---

## 1. OpenAPI Spec Changes (`lib/api-spec/openapi.yaml`)

### New schema: `PortfolioColumnDto`

```yaml
PortfolioColumnDto:
  type: object
  required: [key, label, isDefault, isLocked]
  properties:
    key:
      type: string
    label:
      type: string
    isDefault:
      type: boolean
    isLocked:
      type: boolean
```

### New endpoint: `GET /v1/portfolios/columns`

- `operationId`: `getPortfolioColumns`
- Tags: `[portfolios]`
- Response 200: `PortfolioColumnDto[]`
- No auth required beyond cookie (same as other portfolio endpoints)

### Updated endpoint: `GET /v1/portfolios/{id}`

Add optional query parameter:

```yaml
- name: columns
  in: query
  required: false
  schema:
    type: string
  description: Comma-separated list of column keys to include in assets
```

### Updated schema: `AssetDto`

Fields that become optional (backend returns only requested columns):
- `currentPrice`, `avgPrice`, `value`, `qty`, `todayChange`, `unrealizedPL`, `weight`

Always-present fields (symbol is locked, always returned):
- `id`, `instrumentId`, `symbol`, `name`

---

## 2. Codegen

After updating `openapi.yaml`, run:

```bash
pnpm --filter @workspace/api-spec run codegen
```

This regenerates `lib/api-client-react/src/generated/api.ts` and `api.schemas.ts` with:
- `useGetPortfolioColumns()` hook
- Updated `useGetPortfolioById()` with `params?: { columns?: string }` signature
- `PortfolioColumnDto` type
- `AssetDto` with optional fields

---

## 3. `usePortfolioColumns.ts` Refactor

**Remove:** hardcoded `ALL_COLUMNS`, `ColumnId` union type, `DEFAULT_VISIBLE` array.

**New behavior:**

1. Call `useGetPortfolioColumns()` to get server columns
2. On first load (no localStorage entry): initialize `visibleColumns` from keys where `isDefault: true`
3. On subsequent loads: read localStorage, filter against current server keys (removes deleted columns)
4. `toggleColumn(key)`: skip if `isLocked`, toggle in/out of visibleColumns, persist to localStorage
5. Export: `{ allColumns, visibleColumns, toggleColumn, isLoading }`

**Types:**

```ts
export type PortfolioColumnKey = string; // server-defined, e.g. "symbol", "currentPrice"
```

**localStorage key:** `ss-portfolio-columns` (same key, different format — now uses server keys directly)

**Edge cases:**
- While `isLoading`: `allColumns = []`, `visibleColumns = []` — portfolio query is disabled (no columns to request)
- If server returns an empty list: treat same as loading

---

## 4. `portfolio.tsx` Changes

### Portfolio query

Pass sorted `visibleColumns` as the `columns` param so the query key changes when selection changes → automatic refetch:

```ts
const columnsParam = [...visibleColumns].sort().join(",");

const { data: portfolio } = useGetPortfolioById(
  currentPortfolioId!,
  { columns: columnsParam },   // query param
  {
    query: {
      enabled: !!user && !!currentPortfolioId && visibleColumns.length > 0,
      queryKey: ["/api/v1/portfolios", currentPortfolioId, columnsParam],
    },
  }
);
```

### Table header

Remove: `todayPL`, `todayPLPct`, `totalPL`, `totalPLPct` columns.  
Add: `todayChange`, `unrealizedPL` columns.

Column header rendering loops over `allColumns` (server-driven), skipping `symbol` (always first, rendered separately as "Asset").

### Table cells — column key mapping

| Server key | Header | Cell |
|---|---|---|
| `symbol` | Asset | avatar + symbol + name (always visible, locked) |
| `currentPrice` | Current Price | `fmt(price)` + `ratio% 1D` colored by trend |
| `qty` | Qty | `qty.toFixed(4)` |
| `avgPrice` | Avg Price | `fmt(avgPrice)` |
| `value` | Value | `fmt(value)` |
| `todayChange` | Today P&L | `fmt(todayChange.value)` + `fmtPct(todayChange.ratio)` colored by trend |
| `unrealizedPL` | Total P&L | `fmt(unrealizedPL.value)` + `fmtPct(unrealizedPL.ratio)` colored by trend |
| `weight` | Portfolio Weight % | `(weight * 100).toFixed(1)%` |

All optional fields use `?? 0` fallback since backend only sends requested fields.

### Columns popover

Uses `allColumns` from `usePortfolioColumns` (server data). No change to UI structure — still renders `Checkbox` per column with `disabled` for locked.

---

## 5. Query Invalidation

After a successful `createTransaction` / `updateTransaction`:

```ts
queryClient.invalidateQueries({
  queryKey: ["/api/v1/portfolios", currentPortfolioId],
});
```

This already invalidates all variants (including the one with `columnsParam`) since React Query matches by prefix.

---

## Out of Scope

- Persisting column order (drag-to-reorder)
- Column-level sorting
- The `mockup-sandbox` artifact — no changes needed
