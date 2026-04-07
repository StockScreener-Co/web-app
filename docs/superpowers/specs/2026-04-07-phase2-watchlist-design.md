# StockScreener — Phase 2 Design Spec: Watchlist

**Date:** 2026-04-07
**Author:** Vadym Pantielieienko
**Scope:** Phase 2 — Multi-watchlist CRUD with value investing signals
**Status:** Approved

---

## Context

Phase 0 + Phase 1 are complete. The app is usable as a personal portfolio tracker. The ticker page already has a "Add to Watchlist" button that is disabled with a tooltip "Coming soon — watchlist is planned". Phase 2 activates this feature.

**Goal:** Let users maintain multiple named watchlists of tickers, annotate each ticker with their own Intrinsic Value estimate, and automatically compute a BUY/HOLD/SELL signal based on price vs. IV adjusted for a configurable Margin of Safety.

---

## Page Structure

Two new pages that mirror the existing portfolio pattern exactly:

| Route | Page | Mirrors |
|---|---|---|
| `/watchlists` | List of all watchlists | `/portfolios` (portfolios-list.tsx) |
| `/watchlist?id=xxx` | Watchlist detail | `/portfolio` (portfolio.tsx) |

Navigation: add **Watchlist** link to the navbar → navigates to `/watchlists`.

Last-opened watchlist persists via a `useLastWatchlist` hook (same pattern as `useLastPortfolio`).

---

## API Spec — openapi.yaml Additions

Add the following paths and schemas. Run `pnpm --filter @workspace/api-spec run codegen` after updating.

### New Paths

```yaml
/v1/watchlists:
  get:
    operationId: getWatchlists
    tags: [watchlists]
    summary: List all watchlists for current user
    responses:
      "200":
        content:
          application/json:
            schema:
              type: array
              items: { $ref: '#/components/schemas/WatchlistDto' }
  post:
    operationId: createWatchlist
    tags: [watchlists]
    summary: Create a watchlist
    requestBody:
      required: true
      content:
        application/json:
          schema: { $ref: '#/components/schemas/WatchlistRequestDto' }
    responses:
      "200":
        content:
          application/json:
            schema: { $ref: '#/components/schemas/WatchlistDto' }

/v1/watchlists/{id}:
  get:
    operationId: getWatchlistById
    tags: [watchlists]
    summary: Get watchlist detail with items
    parameters:
      - { name: id, in: path, required: true, schema: { type: string, format: uuid } }
    responses:
      "200":
        content:
          application/json:
            schema: { $ref: '#/components/schemas/WatchlistDetailsDto' }
  patch:
    operationId: updateWatchlist
    tags: [watchlists]
    summary: Update watchlist name or margin of safety
    parameters:
      - { name: id, in: path, required: true, schema: { type: string, format: uuid } }
    requestBody:
      required: true
      content:
        application/json:
          schema: { $ref: '#/components/schemas/WatchlistUpdateDto' }
    responses:
      "200":
        content:
          application/json:
            schema: { $ref: '#/components/schemas/WatchlistDto' }
  delete:
    operationId: deleteWatchlist
    tags: [watchlists]
    summary: Delete a watchlist
    parameters:
      - { name: id, in: path, required: true, schema: { type: string, format: uuid } }
    responses:
      "204":
        description: No content

/v1/watchlists/{id}/instruments/{instrumentId}:
  post:
    operationId: addInstrumentToWatchlist
    tags: [watchlists]
    summary: Add an instrument to a watchlist
    parameters:
      - { name: id, in: path, required: true, schema: { type: string, format: uuid } }
      - { name: instrumentId, in: path, required: true, schema: { type: string, format: uuid } }
    responses:
      "200":
        content:
          application/json:
            schema: { $ref: '#/components/schemas/WatchlistItemDto' }
  patch:
    operationId: updateWatchlistItem
    tags: [watchlists]
    summary: Update intrinsic value for a watchlist item
    parameters:
      - { name: id, in: path, required: true, schema: { type: string, format: uuid } }
      - { name: instrumentId, in: path, required: true, schema: { type: string, format: uuid } }
    requestBody:
      required: true
      content:
        application/json:
          schema: { $ref: '#/components/schemas/WatchlistItemUpdateDto' }
    responses:
      "200":
        content:
          application/json:
            schema: { $ref: '#/components/schemas/WatchlistItemDto' }
  delete:
    operationId: removeInstrumentFromWatchlist
    tags: [watchlists]
    summary: Remove an instrument from a watchlist
    parameters:
      - { name: id, in: path, required: true, schema: { type: string, format: uuid } }
      - { name: instrumentId, in: path, required: true, schema: { type: string, format: uuid } }
    responses:
      "204":
        description: No content
```

### New DTOs

```yaml
WatchlistDto:
  type: object
  properties:
    id: { type: string, format: uuid }
    name: { type: string }
    marginOfSafety: { type: number }   # 0–100, e.g. 20 = 20%
    itemCount: { type: integer }       # number of instruments in this watchlist
  required: [id, name, marginOfSafety, itemCount]

WatchlistRequestDto:
  type: object
  properties:
    name: { type: string, maxLength: 100 }
  required: [name]

WatchlistUpdateDto:
  type: object
  properties:
    name: { type: string, maxLength: 100 }
    marginOfSafety: { type: number, minimum: 0, maximum: 100 }

WatchlistDetailsDto:
  type: object
  properties:
    id: { type: string, format: uuid }
    name: { type: string }
    marginOfSafety: { type: number }
    items:
      type: array
      items: { $ref: '#/components/schemas/WatchlistItemDto' }
  required: [id, name, marginOfSafety, items]

WatchlistItemDto:
  type: object
  properties:
    instrumentId: { type: string, format: uuid }
    symbol: { type: string }
    name: { type: string }
    currentPrice: { type: number }
    todayChange: { $ref: '#/components/schemas/MetricCard' }
    intrinsicValue: { type: number, nullable: true }
  required: [instrumentId, symbol, name, currentPrice, todayChange]

WatchlistItemUpdateDto:
  type: object
  properties:
    intrinsicValue: { type: number, nullable: true }
```

After updating: run `pnpm --filter @workspace/api-spec run codegen`.

---

## 2.1 — /watchlists Page (Watchlist List)

Mirror of `portfolios-list.tsx`. Differences:

- Title: "My Watchlists"
- Navbar link: "Watchlist" → `/watchlists`
- Create dialog: single `Name` field → `useCreateWatchlist()`
- Each card shows: name + item count (`watchlist.itemCount`) + "Open →" link + Delete icon
- Delete: shadcn `<AlertDialog>` → `useDeleteWatchlist()` → invalidates `["/api/v1/watchlists"]`
- On open: navigates to `/watchlist?id=xxx`

Hook: `useLastWatchlist` — same pattern as `useLastPortfolio`, stores last watchlist id in localStorage under key `ss-last-watchlist`. On load, if no `?id` param and a saved id exists, redirect to `/watchlist?id=<saved>`.

---

## 2.2 — /watchlist?id=xxx Page (Watchlist Detail)

### Header

```
┌─────────────────────────────────────────────────────────────────────┐
│ Tech Stocks                    Margin of Safety: [20%] ✏   + Add   │
└─────────────────────────────────────────────────────────────────────┘
```

- **Name**: displayed as page title (editable in Phase 3+ if needed)
- **Margin of Safety**: inline editable `<Input>` in header. On blur/Enter → `useUpdateWatchlist({ marginOfSafety })`. Displayed as `%` suffix. Default: `0` (no MoS applied).
- **+ Add Ticker**: opens "Add to Watchlist" search dialog (see 2.3 for the reverse flow)

### Holdings Table

Columns (all fixed, no column picker in Phase 2):

| Column | Source | Notes |
|---|---|---|
| Symbol / Name | `item.symbol`, `item.name` | Clickable link → `/ticker/{instrumentId}` |
| Price | `item.currentPrice` | |
| Today | `item.todayChange.ratio` | Colored green/red/muted per `trend` |
| Intrinsic Value | `item.intrinsicValue` | Inline editable `<Input>`. On blur/Enter → `useUpdateWatchlistItem({ intrinsicValue })`. Shows `—` placeholder if null. |
| IV + MoS | computed | `IV × (1 − marginOfSafety / 100)`. Shows `—` if IV is null. |
| Signal | computed | See signal logic below. |
| Remove | — | Trash icon → `useRemoveInstrumentFromWatchlist()` → invalidates watchlist query |

### Signal Logic (computed client-side)

```
if intrinsicValue is null → "—" (no color)
else if currentPrice ≤ intrinsicValue × (1 − marginOfSafety / 100) → BUY  (green badge)
else if currentPrice > intrinsicValue → SELL (red badge)
else → HOLD (yellow badge)
```

Implemented via `useMemo` per row. No backend involvement.

### Add Ticker (from watchlist detail page)

"+ Add Ticker" button → shadcn `<Dialog>` with instrument search input (same `useSearchInstruments` pattern as portfolio add-position dialog). Selecting a result calls `useAddInstrumentToWatchlist(watchlistId, instrumentId)` → invalidates watchlist detail query → dialog closes. If instrument already in watchlist, backend returns conflict — frontend shows toast "Already in watchlist".

---

## 2.3 — "Add to Watchlist" Dialog (on Ticker Page)

The existing disabled "Add to Watchlist" `<Button>` (with tooltip "Coming soon") becomes active.

**Flow:**
1. User clicks "Add to Watchlist" on `/ticker/:id` page
2. `<Dialog>` opens — title: "Add {symbol} to Watchlist"
3. Loads all user watchlists via `useGetWatchlists()`
4. Displays each watchlist as a `<Checkbox>` row (shadcn)
5. At bottom: "**+ Create new watchlist**" inline link → toggles an inline `<Input>` + "Create" button (no nested dialog). On submit: `useCreateWatchlist({ name })` → adds to list and pre-checks the new watchlist.
6. "Save" → for each checked watchlist: `useAddInstrumentToWatchlist(watchlistId, instrumentId)` — fires in parallel
7. No pre-checked state (no check for "already in watchlist") — backend handles idempotency

Remove from watchlist is done from the watchlist detail page, not from the ticker page.

---

## 2.4 — Navbar Update

Add "Watchlist" link to the existing navbar layout component. Position: after "Portfolios", before any user profile controls.

```
Home | Portfolios | Watchlist | …
```

---

## Backend Endpoints Required

All 8 endpoints above need backend implementation. Frontend can be built against test data as soon as the GET endpoints return mock data.

| Priority | Method | Path |
|---|---|---|
| P1 | GET | `/v1/watchlists` |
| P1 | GET | `/v1/watchlists/{id}` |
| P1 | POST | `/v1/watchlists` |
| P1 | DELETE | `/v1/watchlists/{id}` |
| P2 | POST | `/v1/watchlists/{id}/instruments/{instrumentId}` |
| P2 | DELETE | `/v1/watchlists/{id}/instruments/{instrumentId}` |
| P2 | PATCH | `/v1/watchlists/{id}` |
| P2 | PATCH | `/v1/watchlists/{id}/instruments/{instrumentId}` |

---

## What is Explicitly OUT of Phase 2

- Price alerts / notifications
- Watchlist sharing
- Column picker for watchlist table
- Sorting / filtering watchlist rows
- "Already added" pre-check state in the Add to Watchlist dialog
- Rename watchlist inline (can be added to PATCH later)
- Notes column (from spreadsheet — deferred to Phase 3)
