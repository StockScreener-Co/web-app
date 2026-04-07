# StockScreener — Phase 0 + Phase 1 Design Spec

**Date:** 2026-04-07  
**Author:** Vadym Pantielieienko  
**Scope:** Phase 0 (tech debt cleanup) + Phase 1 (MVP1 — personal portfolio tracker)  
**Status:** Approved

---

## Context

A pnpm monorepo with a React 19 frontend (`stockscreener`). Backend lives in a separate repository and is not part of this monorepo. The OpenAPI spec (`lib/api-spec/openapi.yaml`) is the source of truth; React Query hooks are generated from it via Orval.

**Current state problems:**
- `ticker-detail.tsx` uses raw `customFetch` calls and local type definitions, bypassing the generated client
- Portfolio add-position modal uses a custom Framer Motion overlay instead of the shadcn `Dialog` component used elsewhere
- Several backend endpoints already exist and are called in the frontend but are absent from `openapi.yaml`, so the generated client doesn't cover them

**Goal of this work:** make the app usable as a personal daily portfolio tracker.

---

## Phase 0 — Tech Debt Cleanup

**Time estimate:** ~2 days. Scope is hard-limited to the items below. No other refactoring.

### 0.1 — Sync `openapi.yaml` with the real backend

Add the following paths and their response schemas to `lib/api-spec/openapi.yaml`:

**Endpoints currently called in code but missing from spec:**

| Method | Path | Response | Notes |
|---|---|---|---|
| GET | `/v1/instruments/{instrumentId}` | `InstrumentPageViewDto` | Full ticker view: price + keyStats + profile.name + description |
| GET | `/v1/news/instrument/{instrumentId}` | `NewsDto[]` | Latest news for ticker |
| GET | `/v1/prices/price-chart/instrument/{instrumentId}` | `PriceHistoryChartResponseDto` | Accepts `?period={ChartPeriod}` query param |

**New endpoints required for Phase 1 (add to spec now, implement on backend per need):**

| Method | Path | Request | Response | Notes |
|---|---|---|---|---|
| GET | `/v1/transactions/portfolio/{portfolioId}` | — | `TransactionResponseDto[]` | List all transactions for a portfolio |
| PATCH | `/v1/transactions/{transactionId}` | `TransactionRequestDto` | `TransactionResponseDto` | Edit a transaction |
| DELETE | `/v1/transactions/{transactionId}` | — | 204 | Delete a transaction |

**New DTOs to add:**

```yaml
InstrumentPageViewDto:
  properties:
    instrumentId: { type: string, format: uuid }
    companyName: { type: string }
    currPrice: { $ref: '#/components/schemas/CurrentPriceResponseDto' }
    keyStats:
      type: object
      properties:
        marketCap: { type: number }
        peRatio: { type: number }
        peTtmRatio: { type: number }
        epsTtm: { type: number }
        high52W: { type: number }
        low52W: { type: number }
        volume: { type: number }
        dividendYield: { type: number }
        beta: { type: number }
        revenueTtm: { type: number }
        netIncomeTtm: { type: number }
    profile:
      type: object
      properties:
        name: { type: string }
        details:
          type: object
          properties:
            description: { type: string }

NewsDto:
  properties:
    id: { type: string }
    datetime: { type: string }
    headline: { type: string }
    source: { type: string }
    url: { type: string }
    image: { type: string }

PriceHistoryChartResponseDto:
  properties:
    symbol: { type: string }
    currency: { type: string }
    period: { $ref: '#/components/schemas/ChartPeriod' }
    interval: { $ref: '#/components/schemas/ChartInterval' }
    points:
      type: array
      items: { $ref: '#/components/schemas/ChartPointDto' }

ChartPeriod:
  type: string
  enum: [ONE_DAY, FIVE_DAYS, ONE_MONTH, THREE_MONTHS, SIX_MONTHS, YTD, ONE_YEAR, FIVE_YEARS, ALL]

ChartInterval:
  type: string
  enum: [ONE_MINUTE, TEN_MINUTES, ONE_DAY, ONE_WEEK]

ChartPointDto:
  properties:
    timestamp: { type: string }
    price: { type: number }
```

After updating the spec: run `pnpm --filter @workspace/api-spec run codegen`.

### 0.2 — Refactor `ticker-detail.tsx`

Replace all raw `customFetch` data-fetching with generated React Query hooks:

| Before | After |
|---|---|
| `customFetch('/api/v1/instruments/{id}')` in `useEffect` | `useGetInstrumentById(id)` |
| `customFetch('/api/v1/news/instrument/{id}')` | `useGetNewsForInstrument(id)` |
| `customFetch('/api/v1/prices/price-chart/...')` | `useGetPriceChart(id, { period })` |
| `customFetch('/api/v1/instruments/{id}/profile')` | `useGetInstrumentProfile(id)` (already in spec) |

Remove all locally-defined duplicate types: `TickerPageView`, `ChartPeriod`, `ChartInterval`, `ChartPointDto`, `PriceHistoryChartResponse`, `CurrentPriceResponseDto`, `MetricCard` (local), `NewsDto`. Import from `@workspace/api-client-react` instead.

Result: `ticker-detail.tsx` has no local data-fetching logic, only UI rendering.

### 0.3 — Unify Add Position modal in `portfolio.tsx`

Replace the custom Framer Motion overlay modal with shadcn `<Dialog>` (same component already used on the ticker-detail Add to Portfolio dialog).

Replace raw HTML inputs with shadcn components:
- `<input type="text">` → `<Input>`
- `<input type="number">` → `<Input type="number">`
- `<input type="date">` → `<Input type="date">`
- `<select>` → `<Select>` from shadcn

Visual result is the same; the pattern becomes consistent across the app.

---

## Phase 1 — MVP1: Personal Portfolio Tracker

### 1.1 — Portfolio Aggregates Header

**Data source:** computed client-side from `PortfolioDetailsDto.assets` — no new API endpoint needed.

**Formulas:**
```
totalValue     = sum(asset.value)
todayPLDollar  = sum(asset.todayChange.value)
                 ⚠️ Verify: todayChange.value must be total position change (not per-share).
                    If per-share: use sum(asset.todayChange.value × asset.qty) instead.
todayPLPct     = todayPLDollar / (totalValue - todayPLDollar) × 100
totalPLDollar  = sum(asset.unrealizedPL.value)
totalCost      = sum(asset.qty × asset.avgPrice)
totalPLPct     = totalPLDollar / totalCost × 100
positionCount  = assets.length
```

**UI:** 4 metric cards displayed above the holdings table.

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Portfolio    │  │ Today P&L    │  │ Total P&L    │  │ Holdings     │
│ $45,231      │  │ +$312 +0.7%  │  │ +$8,421 +22% │  │ 7 positions  │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

- Today P&L and Total P&L cards: value and percentage colored green (UP) / red (DOWN) / muted (FLAT) based on sign
- Animated with Framer Motion on mount (existing animation patterns in the app)
- Computed via `useMemo` inside the portfolio page component

### 1.2 — Column Picker for Holdings Table

**Available columns (10 total):**

| Column | ID | Default visible |
|---|---|---|
| Symbol / Name | `asset` | ✅ Locked — always shown |
| Current Price | `currentPrice` | ✅ |
| Qty | `qty` | ✅ |
| Avg Price | `avgPrice` | ✅ |
| Value | `value` | ✅ |
| Today P&L $ | `todayPL` | ✅ |
| Today P&L % | `todayPLPct` | ☐ |
| Total P&L $ | `totalPL` | ✅ |
| Total P&L % | `totalPLPct` | ☐ |
| Portfolio Weight % | `weight` | ☐ |

**Persistence:** `localStorage` under key `ss-portfolio-columns`. Cross-device sync is out of scope for Phase 1.

**UI:** "Columns" button (top-right above the table) → shadcn `<Popover>` → list of `<Checkbox>` items. Column order is fixed (no drag-to-reorder in Phase 1). The "Asset" column cannot be unchecked.

**Implementation:** a `usePortfolioColumns` hook manages the column state (read/write to `localStorage`, returns `{ visibleColumns, toggleColumn }`). The holdings table renders only the columns in `visibleColumns`.

### 1.3 — Holdings Table: Enhancements

The existing table structure stays. New columns from the picker fill in naturally. No structural changes to the table layout beyond adding the new column slots.

One addition: **link from each row to the ticker page** (already exists — `asset.instrumentId`). Confirm it works correctly post-Phase-0 refactor.

### 1.4 — Portfolio Tabs: Holdings + Transactions

The portfolio page gets a `<Tabs>` component (shadcn) with two tabs:

- **Holdings** — current assets table (with column picker and aggregates header)
- **Transactions** — full transaction history

**Transactions tab data source:** new endpoint `GET /v1/transactions/portfolio/{portfolioId}` → `TransactionResponseDto[]`.

Backend needs to implement this endpoint. Frontend adds it to `openapi.yaml` first (see Phase 0), runs codegen, then uses the generated `useGetTransactionsForPortfolio(portfolioId)` hook.

**Transactions table columns:** Date | Symbol | Type | Qty | Price | Total ($) | Actions

**Total** = `qty × price`.

**Actions column:**
- Edit icon → opens the Add Position `Dialog` pre-filled with transaction data → submits `PATCH /v1/transactions/{id}` via generated `useUpdateTransaction` hook
- Delete icon → shadcn `<AlertDialog>` ("Delete this transaction?") → `DELETE /v1/transactions/{id}` via generated `useDeleteTransaction` hook → invalidates `["/api/v1/transactions/portfolio", portfolioId]` query key

### 1.5 — Ticker Page: Key Statistics Expansion

Expand the Key Statistics panel from 5 metrics to up to 10, using fields already available in `InstrumentPageViewDto.keyStats`:

**Current:** Market Cap, P/E (TTM), EPS (TTM), 52W High, 52W Low

**Add (show "N/A" gracefully if null):** Volume, Dividend Yield, Beta, Revenue (TTM), Net Income (TTM)

All values already handled by the `safeFixed` helper that won't crash on null/undefined.

### 1.6 — Ticker Page: Company Profile Restructure

**Before:** 4 equal-weight cards (Business / Leadership / Location / Contact)

**After:**
1. `About` description — full width, prominent, at the top
2. "Company" card — Sector, Industry, Type, Exchange, CEO, Employees
3. "Details" section (collapsible or lower priority) — Location + Contact

Rationale: investors care about what the company does and who runs it. Physical address is secondary.

### 1.7 — Watchlist Button (ticker page)

No implementation in Phase 1. Change the button behavior:
- Keep the `<Button>` visible (signals planned feature)
- Replace `toast("Coming Soon")` with a `<Tooltip>` on the button: "Coming soon — watchlist is planned"
- Button becomes `disabled` with `cursor-not-allowed` + opacity, not a click handler

---

## What is explicitly OUT of Phase 1

- Watchlist CRUD (Phase 2)
- Multi-currency support
- CSV import
- Column drag-to-reorder
- Portfolio performance chart (value over time)
- User preference sync across devices
- Paid valuation tool (Phase 3)
- Authentication/billing tiers

---

## Backend Endpoints Required for Phase 1

These need to be implemented in the backend repo before the corresponding frontend features can be built:

| Priority | Method | Path | Needed for |
|---|---|---|---|
| P1 | GET | `/v1/transactions/portfolio/{portfolioId}` | Transactions tab |
| P2 | PATCH | `/v1/transactions/{transactionId}` | Edit transaction |
| P2 | DELETE | `/v1/transactions/{transactionId}` | Delete transaction |

Frontend can proceed on 1.1, 1.2, 1.3, 1.5, 1.6, 1.7 without waiting for these.

---

## Next Steps

1. User reviews this spec
2. Invoke `superpowers:writing-plans` to generate an implementation plan with numbered steps
3. Execute Phase 0 first (fully), then Phase 1 features in order: header → column picker → transactions tab → ticker page polish
