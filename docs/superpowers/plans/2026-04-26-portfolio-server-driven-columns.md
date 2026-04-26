# Portfolio Server-Driven Columns — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded frontend column list with server-driven column definitions; pass selected columns as a query param to the portfolio endpoint so the backend returns only requested fields.

**Architecture:** Update the OpenAPI spec with a new `/columns` endpoint and a `columns` query param on `GET /v1/portfolios/{id}`, regenerate hooks via Orval, refactor `usePortfolioColumns` to call the server, and update the portfolio page to parameterize its data fetch with selected columns.

**Tech Stack:** TypeScript, React 19, TanStack Query v5, Orval (codegen), Vite, Tailwind CSS v4

---

## Files Changed / Created

| Action | File |
|---|---|
| Modify | `lib/api-spec/openapi.yaml` |
| Regenerated | `lib/api-client-react/src/generated/api.ts` |
| Regenerated | `lib/api-client-react/src/generated/api.schemas.ts` |
| Rewrite | `artifacts/stockscreener/src/hooks/use-portfolio-columns.ts` |
| Modify | `artifacts/stockscreener/src/pages/portfolio.tsx` |

---

## Task 1: Update openapi.yaml

**Files:**
- Modify: `lib/api-spec/openapi.yaml`

- [ ] **Step 1: Add `PortfolioColumnDto` schema**

In `lib/api-spec/openapi.yaml`, inside `components.schemas`, add after `PortfolioRequestDto` (line ~629):

```yaml
    PortfolioColumnDto:
      type: object
      properties:
        key:
          type: string
        label:
          type: string
        isDefault:
          type: boolean
        isLocked:
          type: boolean
      required:
        - key
        - label
        - isDefault
        - isLocked
```

- [ ] **Step 2: Add `GET /v1/portfolios/columns` endpoint**

In `lib/api-spec/openapi.yaml`, inside `paths`, add a new path **before** `/v1/portfolios/{id}` (so it doesn't get swallowed by the path param route — add it after `/v1/portfolios/my` at line ~72):

```yaml
  /v1/portfolios/columns:
    get:
      operationId: getPortfolioColumns
      tags: [portfolios]
      summary: Get available portfolio columns
      responses:
        "200":
          description: Successful response
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/PortfolioColumnDto"
```

- [ ] **Step 3: Add `columns` query param to `GET /v1/portfolios/{id}`**

Find the `GET /v1/portfolios/{id}` path (line ~72). Its `parameters` block currently only has the `id` path param. Add the `columns` query param:

```yaml
  /v1/portfolios/{id}:
    get:
      operationId: getPortfolioById
      tags: [portfolios]
      summary: Get portfolio by id
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: columns
          in: query
          required: false
          schema:
            type: string
          description: Comma-separated column keys to include in assets (e.g. "currentPrice,qty,value")
```

- [ ] **Step 4: Make optional fields in `AssetDto` optional**

Find the `AssetDto` schema `required` list (line ~617). Change it so only identity fields are required. The full updated `AssetDto` schema:

```yaml
    AssetDto:
      type: object
      properties:
        id:
          type: string
          format: uuid
        instrumentId:
          type: string
          format: uuid
        symbol:
          type: string
        name:
          type: string
        qty:
          type: number
        avgPrice:
          type: number
        weight:
          type: number
        value:
          type: number
        currentPrice:
          type: number
        unrealizedPL:
          $ref: "#/components/schemas/MetricCard"
        todayChange:
          $ref: "#/components/schemas/MetricCard"
      required:
        - id
        - instrumentId
        - symbol
        - name
```

- [ ] **Step 5: Commit**

```bash
git add lib/api-spec/openapi.yaml
git commit -m "feat(api-spec): add portfolios/columns endpoint and columns query param"
```

---

## Task 2: Run codegen

**Files:**
- Regenerated: `lib/api-client-react/src/generated/api.ts`
- Regenerated: `lib/api-client-react/src/generated/api.schemas.ts`

- [ ] **Step 1: Run Orval**

```bash
pnpm --filter @workspace/api-spec run codegen
```

Expected: prints Orval output with no errors, updates files in `lib/api-client-react/src/generated/`.

- [ ] **Step 2: Verify generated types in `api.schemas.ts`**

Open `lib/api-client-react/src/generated/api.schemas.ts` and confirm:
- `PortfolioColumnDto` type exists with fields `key`, `label`, `isDefault`, `isLocked`
- `GetPortfolioByIdParams` type exists with optional `columns?: string`
- `AssetDto` required fields are only `id`, `instrumentId`, `symbol`, `name` (others are optional, typed `number | undefined` or `MetricCard | undefined`)

- [ ] **Step 3: Verify generated hooks in `api.ts`**

Open `lib/api-client-react/src/generated/api.ts` and confirm:
- `useGetPortfolioColumns` hook exists (no path params, no query params)
- `useGetPortfolioById` hook now has signature `(id: string, params?: GetPortfolioByIdParams, options?: ...)`

- [ ] **Step 4: Commit**

```bash
git add lib/api-client-react/src/generated/
git commit -m "chore: regenerate api client with portfolio columns support"
```

---

## Task 3: Rewrite `use-portfolio-columns.ts`

**Files:**
- Rewrite: `artifacts/stockscreener/src/hooks/use-portfolio-columns.ts`

- [ ] **Step 1: Replace file contents**

Replace the entire `artifacts/stockscreener/src/hooks/use-portfolio-columns.ts` with:

```typescript
import { useEffect, useState } from "react";
import { useGetPortfolioColumns } from "@/lib/api-client";

const STORAGE_KEY = "ss-portfolio-columns";

export function usePortfolioColumns() {
  const { data: serverColumns, isLoading } = useGetPortfolioColumns();
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!serverColumns || serverColumns.length === 0) return;

    const stored = (() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as string[]) : null;
      } catch {
        return null;
      }
    })();

    const serverKeys = new Set(serverColumns.map((c) => c.key));

    if (stored) {
      setVisibleColumns(stored.filter((k) => serverKeys.has(k)));
    } else {
      setVisibleColumns(serverColumns.filter((c) => c.isDefault).map((c) => c.key));
    }

    setInitialized(true);
  }, [serverColumns]);

  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns));
  }, [visibleColumns, initialized]);

  function toggleColumn(key: string) {
    const col = serverColumns?.find((c) => c.key === key);
    if (!col || col.isLocked) return;
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  return {
    allColumns: serverColumns ?? [],
    visibleColumns,
    toggleColumn,
    isLoading,
  };
}
```

Note: `ColumnId` type and `ALL_COLUMNS` constant are deleted — consumers now use `string` keys matching the server-defined column keys.

- [ ] **Step 2: Run typecheck to catch breakage from removed `ColumnId` type**

```bash
pnpm run typecheck
```

Expected: type errors in `portfolio.tsx` where it references `ColumnId` — those are fixed in Task 4. If errors appear in other files, fix them now.

- [ ] **Step 3: Commit**

```bash
git add artifacts/stockscreener/src/hooks/use-portfolio-columns.ts
git commit -m "feat: fetch portfolio columns from server in usePortfolioColumns"
```

---

## Task 4: Update `portfolio.tsx`

**Files:**
- Modify: `artifacts/stockscreener/src/pages/portfolio.tsx`

- [ ] **Step 1: Remove `ColumnId` import**

In `artifacts/stockscreener/src/pages/portfolio.tsx`, find:

```typescript
import { usePortfolioColumns, type ColumnId } from "@/hooks/use-portfolio-columns";
```

Replace with:

```typescript
import { usePortfolioColumns } from "@/hooks/use-portfolio-columns";
```

- [ ] **Step 2: Build `columnsParam` and update `useGetPortfolioById` call**

Find the block starting at:

```typescript
  const { data: portfolio, isLoading } = useGetPortfolioById(currentPortfolioId!, {
    query: {
      enabled: !!user && !!currentPortfolioId,
      queryKey: ["/api/v1/portfolios", currentPortfolioId],
    },
  });
```

Replace with:

```typescript
  const columnsParam = [...visibleColumns].sort().join(",");

  const { data: portfolio, isLoading } = useGetPortfolioById(
    currentPortfolioId!,
    { columns: columnsParam },
    {
      query: {
        enabled: !!user && !!currentPortfolioId && visibleColumns.length > 0,
        queryKey: ["/api/v1/portfolios", currentPortfolioId, columnsParam],
      },
    }
  );
```

**Important:** Move `const { visibleColumns, toggleColumn, allColumns } = usePortfolioColumns();` to **before** this block (it must be declared before `columnsParam` uses it). Currently it's on line 93 — it stays there, which is already before the `useGetPortfolioById` call at line 73. Check the order after the edit.

Wait — currently `useGetPortfolioById` is at line 73 and `usePortfolioColumns` is at line 93. After adding `columnsParam` based on `visibleColumns`, you need to move the `usePortfolioColumns` call to before `useGetPortfolioById`. Reorder to:

```typescript
  // Move usePortfolioColumns to before useGetPortfolioById:
  const { visibleColumns, toggleColumn, allColumns, isLoading: isColumnsLoading } = usePortfolioColumns();

  const columnsParam = [...visibleColumns].sort().join(",");

  const { data: portfolio, isLoading } = useGetPortfolioById(
    currentPortfolioId!,
    { columns: columnsParam },
    {
      query: {
        enabled: !!user && !!currentPortfolioId && visibleColumns.length > 0,
        queryKey: ["/api/v1/portfolios", currentPortfolioId, columnsParam],
      },
    }
  );
```

Then remove the old `const { visibleColumns, toggleColumn, allColumns } = usePortfolioColumns();` line at line 93.

- [ ] **Step 3: Add a `renderCell` helper and a `colorByTrend` helper above the `return` statement**

Add these two helpers inside the component body, just before the `return (` statement:

```typescript
  function colorByTrend(trend: string | undefined) {
    if (trend === "UP") return "text-green-400";
    if (trend === "DOWN") return "text-destructive";
    return "text-muted-foreground";
  }

  function renderCell(asset: (typeof assets)[number], key: string) {
    switch (key) {
      case "currentPrice":
        return (
          <td key={key} className="p-4 text-right">
            <div className="font-semibold">{fmt(asset.currentPrice ?? 0)}</div>
            <div className={`text-xs ${colorByTrend(asset.todayChange?.trend)}`}>
              {asset.todayChange?.ratio?.toFixed(2) ?? "0.00"}% 1D
            </div>
          </td>
        );
      case "qty":
        return (
          <td key={key} className="p-4 text-right">
            <div className="font-semibold">{(asset.qty ?? 0).toFixed(4)}</div>
          </td>
        );
      case "avgPrice":
        return (
          <td key={key} className="p-4 text-right">
            <div className="font-semibold">{fmt(asset.avgPrice ?? 0)}</div>
          </td>
        );
      case "value":
        return (
          <td key={key} className="p-4 text-right">
            <div className="font-semibold">{fmt(asset.value ?? 0)}</div>
          </td>
        );
      case "todayChange":
        return (
          <td key={key} className="p-4 text-right">
            <div className={`font-semibold ${colorByTrend(asset.todayChange?.trend)}`}>
              {fmt(asset.todayChange?.value ?? 0)}
            </div>
            <div className={`text-xs ${colorByTrend(asset.todayChange?.trend)}`}>
              {fmtPct(asset.todayChange?.ratio ?? 0)}
            </div>
          </td>
        );
      case "unrealizedPL":
        return (
          <td key={key} className="p-4 text-right">
            <div className={`font-semibold ${colorByTrend(asset.unrealizedPL?.trend)}`}>
              {fmt(asset.unrealizedPL?.value ?? 0)}
            </div>
            <div className={`text-xs ${colorByTrend(asset.unrealizedPL?.trend)}`}>
              {fmtPct(asset.unrealizedPL?.ratio ?? 0)}
            </div>
          </td>
        );
      case "weight":
        return (
          <td key={key} className="p-4 text-right">
            <div className="font-semibold">{((asset.weight ?? 0) * 100).toFixed(1)}%</div>
          </td>
        );
      default:
        return null;
    }
  }
```

- [ ] **Step 4: Replace the table `<thead>` row**

Find the existing `<thead>` block (around line 561):

```tsx
                  <thead>
                    <tr className="bg-secondary/50 border-b border-border/50 text-sm font-medium text-muted-foreground">
                      <th className="p-4 pl-6 font-semibold">Asset</th>
                      {visibleColumns.includes("currentPrice") && <th className="p-4 font-semibold text-right">Current Price</th>}
                      {visibleColumns.includes("qty") && <th className="p-4 font-semibold text-right">Qty</th>}
                      {visibleColumns.includes("avgPrice") && <th className="p-4 font-semibold text-right">Avg Price</th>}
                      {visibleColumns.includes("value") && <th className="p-4 font-semibold text-right">Value</th>}
                      {visibleColumns.includes("todayPL") && <th className="p-4 font-semibold text-right">Today P&L $</th>}
                      {visibleColumns.includes("todayPLPct") && <th className="p-4 font-semibold text-right">Today P&L %</th>}
                      {visibleColumns.includes("totalPL") && <th className="p-4 font-semibold text-right">Total P&L $</th>}
                      {visibleColumns.includes("totalPLPct") && <th className="p-4 font-semibold text-right">Total P&L %</th>}
                      {visibleColumns.includes("weight") && <th className="p-4 font-semibold text-right">Weight %</th>}
                    </tr>
                  </thead>
```

Replace with:

```tsx
                  <thead>
                    <tr className="bg-secondary/50 border-b border-border/50 text-sm font-medium text-muted-foreground">
                      <th className="p-4 pl-6 font-semibold">Asset</th>
                      {allColumns
                        .filter((col) => col.key !== "symbol" && visibleColumns.includes(col.key))
                        .map((col) => (
                          <th key={col.key} className="p-4 font-semibold text-right">
                            {col.label}
                          </th>
                        ))}
                    </tr>
                  </thead>
```

- [ ] **Step 5: Replace the table `<tbody>` cell block**

Find the block of conditional `<td>` cells inside the `assets.map()` (lines ~598–662). It starts after the Asset `<td>` and ends before `</motion.tr>`. Replace everything from after the Asset `<td>` up to and including the Weight `<td>` with:

```tsx
                          {allColumns
                            .filter((col) => col.key !== "symbol" && visibleColumns.includes(col.key))
                            .map((col) => renderCell(asset, col.key))}
```

The full `<motion.tr>` body after the change:

```tsx
                        <motion.tr
                          key={asset.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ delay: i * 0.04 }}
                          className="hover:bg-accent/20 transition-colors group"
                        >
                          {/* Asset — always visible, locked */}
                          <td className="p-4 pl-6">
                            <Link href={`/ticker/${asset.instrumentId}`} className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-sm flex-shrink-0">
                                {asset.symbol.slice(0, 2)}
                              </div>
                              <div>
                                <div className="font-bold hover:text-primary transition-colors">{asset.symbol}</div>
                                <div className="text-xs text-muted-foreground">{asset.name}</div>
                              </div>
                            </Link>
                          </td>

                          {allColumns
                            .filter((col) => col.key !== "symbol" && visibleColumns.includes(col.key))
                            .map((col) => renderCell(asset, col.key))}
                        </motion.tr>
```

- [ ] **Step 6: Update the Columns popover**

Find the popover content (around line 536):

```tsx
                  <div className="space-y-2">
                    {allColumns.map((col) => (
                      <div key={col.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`col-${col.id}`}
                          checked={visibleColumns.includes(col.id as ColumnId)}
                          disabled={col.locked}
                          onCheckedChange={() => toggleColumn(col.id as ColumnId)}
                        />
                        <label
                          htmlFor={`col-${col.id}`}
                          className={`text-sm ${col.locked ? "text-muted-foreground" : "cursor-pointer"}`}
                        >
                          {col.label}
                        </label>
                      </div>
                    ))}
                  </div>
```

Replace with:

```tsx
                  <div className="space-y-2">
                    {allColumns.map((col) => (
                      <div key={col.key} className="flex items-center gap-2">
                        <Checkbox
                          id={`col-${col.key}`}
                          checked={visibleColumns.includes(col.key)}
                          disabled={col.isLocked}
                          onCheckedChange={() => toggleColumn(col.key)}
                        />
                        <label
                          htmlFor={`col-${col.key}`}
                          className={`text-sm ${col.isLocked ? "text-muted-foreground" : "cursor-pointer"}`}
                        >
                          {col.label}
                        </label>
                      </div>
                    ))}
                  </div>
```

- [ ] **Step 7: Update the loading guard to also cover columns loading**

Find the existing loading guard (around line 277):

```tsx
  if (isLoading) {
    return <div className="p-12 text-center">Loading portfolio details...</div>;
  }
```

Replace with:

```tsx
  if (isColumnsLoading || isLoading) {
    return <div className="p-12 text-center">Loading portfolio details...</div>;
  }
```

- [ ] **Step 8: Run typecheck**

```bash
pnpm run typecheck
```

Expected: no errors. Fix any remaining type errors related to `ColumnId` references if they appear.

- [ ] **Step 9: Commit**

```bash
git add artifacts/stockscreener/src/pages/portfolio.tsx
git commit -m "feat: use server-driven columns in portfolio page"
```

---

## Task 5: Manual verification

- [ ] **Step 1: Start dev server**

```bash
pnpm run dev
```

- [ ] **Step 2: Open portfolio page**

Navigate to `http://localhost:3000/portfolio?id=<any-portfolio-id>`. Verify:
- The "Columns" popover shows the server-defined column list (8 columns from the new endpoint)
- Default visible columns match `isDefault: true` from the server response
- "Symbol / Name" checkbox is disabled (locked)

- [ ] **Step 3: Toggle columns**

Toggle a column off → verify the table column disappears AND the network request for the portfolio re-fires with the updated `?columns=...` param (check Network tab in DevTools).

- [ ] **Step 4: Verify P&L cell style**

Check that `todayChange` and `unrealizedPL` cells each show two lines: dollar value on top (colored by trend), percentage below (colored by trend) — matching the Current Price column style.

- [ ] **Step 5: Refresh page**

Refresh the browser. Verify that the column selection persists from localStorage and the correct columns are shown without a flash.

- [ ] **Step 6: Final commit if any fixups were needed**

```bash
git add -p
git commit -m "fix: portfolio columns post-verification fixups"
```
