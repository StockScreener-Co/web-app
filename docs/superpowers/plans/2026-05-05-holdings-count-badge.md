# Holdings Count Badge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the number of holdings as a badge on portfolio list cards and on the portfolio detail page next to the Holdings section heading.

**Architecture:** Add `holdingCount` to both `PortfolioDto` and `PortfolioDetailsDto` in the OpenAPI spec, regenerate types via Orval codegen, then consume the field in two UI components. No new components — inline Tailwind badges only.

**Tech Stack:** OpenAPI (Orval codegen), React 19, Tailwind CSS v4, TanStack Query v5

---

## File Map

| File | Change |
|---|---|
| `lib/api-spec/openapi.yaml` | Add `holdingCount: integer` to `PortfolioDto` and `PortfolioDetailsDto` |
| `lib/api-client-react/src/generated/api.schemas.ts` | Auto-updated by codegen |
| `artifacts/stockscreener/src/pages/portfolios-list.tsx` | Replace "Click to view details" with holdings badge |
| `artifacts/stockscreener/src/pages/portfolio.tsx` | Add count badge next to "Holdings" heading |

---

### Task 1: Update OpenAPI spec

**Files:**
- Modify: `lib/api-spec/openapi.yaml`

- [ ] **Step 1: Add `holdingCount` to `PortfolioDto`**

Find the `PortfolioDto` schema (currently around line 607) and update it:

```yaml
    PortfolioDto:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        holdingCount:
          type: integer
      required:
        - id
        - name
        - holdingCount
```

- [ ] **Step 2: Add `holdingCount` to `PortfolioDetailsDto`**

Find the `PortfolioDetailsDto` schema (currently around line 618) and add the field:

```yaml
    PortfolioDetailsDto:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        assets:
          type: array
          items:
            $ref: "#/components/schemas/AssetDto"
        totalValue:
          type: number
        annualIncome:
          type: number
        yieldOnCostRatio:
          type: number
        avgDivGrow5YRatio:
          type: number
        holdingCount:
          type: integer
      required:
        - id
        - name
        - assets
        - holdingCount
```

- [ ] **Step 3: Run codegen**

```bash
pnpm --filter @workspace/api-spec run codegen
```

Expected: `lib/api-client-react/src/generated/api.schemas.ts` is updated — `PortfolioDto` and `PortfolioDetailsDto` now include `holdingCount: number`.

- [ ] **Step 4: Verify types compile**

```bash
pnpm run typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add lib/api-spec/openapi.yaml lib/api-client-react/src/generated/
git commit -m "feat: add holdingCount to PortfolioDto and PortfolioDetailsDto"
```

---

### Task 2: Holdings badge on portfolio list cards

**Files:**
- Modify: `artifacts/stockscreener/src/pages/portfolios-list.tsx:108-110`

- [ ] **Step 1: Replace placeholder text with badge**

Find the `CardContent` block (around line 108) that currently reads:

```tsx
                  <CardContent>
                    <p className="text-xs text-muted-foreground italic">Click to view details</p>
                  </CardContent>
```

Replace with:

```tsx
                  <CardContent>
                    <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                      {portfolio.holdingCount === 0 ? "No holdings" : `${portfolio.holdingCount} holdings`}
                    </span>
                  </CardContent>
```

- [ ] **Step 2: Verify types compile**

```bash
pnpm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add artifacts/stockscreener/src/pages/portfolios-list.tsx
git commit -m "feat: show holdings count badge on portfolio list cards"
```

---

### Task 3: Holdings badge on portfolio detail page

**Files:**
- Modify: `artifacts/stockscreener/src/pages/portfolio.tsx:576-578`

- [ ] **Step 1: Add badge next to Holdings heading**

Find the Holdings section heading inside `TabsContent value="holdings"` (around line 576):

```tsx
              <h2 className="text-2xl font-display font-bold">Holdings</h2>
```

Replace with:

```tsx
              <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                Holdings
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                  {portfolio?.holdingCount ?? assets.length}
                </span>
              </h2>
```

The `portfolio?.holdingCount ?? assets.length` fallback ensures the badge still renders while the backend is being updated.

- [ ] **Step 2: Verify types compile**

```bash
pnpm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add artifacts/stockscreener/src/pages/portfolio.tsx
git commit -m "feat: show holdings count badge on portfolio detail page"
```
