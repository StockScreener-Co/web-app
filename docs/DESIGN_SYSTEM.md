# Stock Screener · Design System

**Version:** 0.1
**Status:** Draft — to be iterated as screens are built
**Audience:** designers, developers, and AI assistants generating UI for this product

---

## 1. Product context

Stock Screener is a personal-grade investing toolkit: portfolio tracking, performance analytics, dividend tracking, fundamentals deep-dive, and ticker screening.

**User profile:** the operator (and a small group of similar users). Treats the product as a **professional instrument**, not a consumer app. Knows what P/E, drawdown, and dividend yield mean. Spends long sessions with the screen open. Values information density, fast scanning, and predictability over decoration.

**Reference points:** TradingView, Snowball Analytics, Bloomberg Terminal (toned down), Linear (for the calm of the chrome).

**Product is NOT:** a brokerage, a social network, a beginner-friendly onboarding-heavy app, or a marketing site.

---

## 2. Design principles

These five principles override aesthetic preference. When in conflict with "pretty," they win.

### 2.1 Data is the protagonist
Numbers, tables, and charts are the content. Chrome (navigation, headers, padding) is supporting cast. If something is purely decorative — remove it.

### 2.2 Density with breathing room
Closer to TradingView than to Robinhood. Tight padding inside cells, but every block is clearly separated by borders or surface elevation. The eye should be able to land on a row in a 50-row table without effort.

### 2.3 Color encodes meaning, never mood
Three roles only:
- **Accent (amber)** = interactive (buttons, active state, focus, links). Never financial data.
- **Bull (green) / Bear (red)** = financial change only. Never decorative.
- **Neutral grays** = everything else.

If you find yourself reaching for a color "to make it pop" — stop. Use type weight, size, or position instead.

### 2.4 Predictable over surprising
The same component looks and behaves the same on every screen. A primary button is one thing. A metric card is one thing. A user should learn the language once.

### 2.5 Dark is home
Dark theme is the default and gets primary attention in design decisions. Light theme is fully supported but is a guest.

---

## 3. Color tokens

All tokens are defined as **semantic roles** (purpose), not literal names. Never use a raw hex in components — always reference the token.

### 3.1 Surfaces

Layered depth without shadows. Each level steps the background lighter (in dark) or differentiates by subtle warmth (in light).

| Token | Role | Dark | Light |
|---|---|---|---|
| `bg-0` | Page background | `#0A0C10` | `#FAFAF7` |
| `bg-1` | Default surface (cards, sidebar, topbar) | `#0F1217` | `#FFFFFF` |
| `bg-2` | Recessed surface (inputs, metric cards, hover rows) | `#161A20` | `#F4F4F0` |
| `bg-3` | Elevated surface (popovers, tooltips, dropdowns) | `#1D222A` | `#EBEAE3` |

**Rule:** never use pure black (`#000`) or pure white (`#FFF`). The light-theme background is intentionally warm off-white to match the amber accent.

### 3.2 Text

| Token | Role | Dark | Light |
|---|---|---|---|
| `fg-0` | Primary (headings, key numbers) | `#E6E8EB` | `#18181B` |
| `fg-1` | Secondary (body, labels next to values) | `#A8AEB8` | `#52525B` |
| `fg-2` | Tertiary (captions, muted metadata, table headers) | `#6E747D` | `#71717A` |
| `fg-3` | Disabled / placeholder | `#4A5260` | `#A1A1AA` |

### 3.3 Borders

| Token | Role | Dark | Light |
|---|---|---|---|
| `bd-1` | Default (between sections, around cards) | `#1F242C` | `#E4E4E0` |
| `bd-2` | Emphasized (button outline, hover) | `#2A303A` | `#D4D4D0` |
| `bd-3` | Strong (focus borders without rings) | `#3A4150` | `#A8A8A4` |

All borders are 1px. No double borders, no inset shadows simulating borders.

### 3.4 Accent — amber

Used **only** for interactive elements. Never tied to data.

| Token | Role | Dark | Light |
|---|---|---|---|
| `acc` | Default (primary button, active state) | `#D97706` | `#B45309` |
| `acc-h` | Hover | `#F59E0B` | `#92400E` |
| `acc-a` | Active / pressed | `#B45309` | `#78350F` |
| `acc-text` | Amber text on dark surfaces | `#FBBF24` | `#92400E` |
| `acc-soft` | Tinted background (active sidebar item, badges) | `rgba(217, 119, 6, 0.14)` | `rgba(180, 83, 9, 0.10)` |

The dark-theme amber is intentionally pulled toward the orange end (saturation reduced from Tailwind `amber-500`). This survives long sessions; pure `#F59E0B` does not.

### 3.5 Semantic — financial and system

| Token | Role | Dark | Light |
|---|---|---|---|
| `bull` | Positive change (P&L up, price up) | `#34D399` | `#059669` |
| `bull-soft` | Tinted bull background (badges) | `rgba(52, 211, 153, 0.14)` | `rgba(5, 150, 105, 0.10)` |
| `bear` | Negative change (P&L down, price down) | `#F87171` | `#DC2626` |
| `bear-soft` | Tinted bear background | `rgba(248, 113, 113, 0.14)` | `rgba(220, 38, 38, 0.10)` |
| `info` | Informational (neutral notice, dividend tag) | `#60A5FA` | `#2563EB` |
| `info-soft` | Tinted info background | `rgba(96, 165, 250, 0.14)` | `rgba(37, 99, 235, 0.10)` |
| `warn` | Warning (stale data, threshold exceeded) | `#FBBF24` | `#B45309` |
| `warn-soft` | Tinted warn background | `rgba(251, 191, 36, 0.14)` | `rgba(180, 83, 9, 0.10)` |

**Bull/bear notes:**
- Both are intentionally desaturated. Saturated red and green on a dark background are the single most fatiguing combination in fintech UIs.
- Always pair color with a glyph (`▲` `▼` or `+` `−`) for accessibility (color-blindness) and scannability.

### 3.6 Categorical palette (charts, allocation)

For series that need distinction without semantic meaning (asset classes, sectors, multiple lines):

| Position | Dark | Light | Suggested role |
|---|---|---|---|
| 1 | `#D97706` (amber) | `#B45309` | Primary series |
| 2 | `#60A5FA` (blue) | `#2563EB` | Secondary |
| 3 | `#34D399` (green) | `#059669` | Tertiary |
| 4 | `#A78BFA` (violet) | `#7C3AED` | 4th |
| 5 | `#F472B6` (pink) | `#DB2777` | 5th |
| 6 | `#22D3EE` (cyan) | `#0891B2` | 6th |
| 7 | `#6E747D` (neutral) | `#71717A` | Cash / Other |

Never exceed 7 series in one chart. Beyond that, group into "Other."

---

## 4. Typography

### 4.1 Font families

| Family | Use | Reason |
|---|---|---|
| **Inter** | All UI text — headings, body, labels | Excellent legibility at small sizes; designed for screens |
| **IBM Plex Mono** | All numbers in tables and data displays | Tabular figures align by digit; distinguishes 0/O and 1/l |

If using Inter for numbers in flowing text, enable `font-variant-numeric: tabular-nums`. Inter has tabular figures built in — but they are not the default.

### 4.2 Type scale

| Token | Size | Weight | Line height | Letter-spacing | Use |
|---|---|---|---|---|---|
| `display` | 28px | 600 | 1.2 | -0.5px | Hero numbers (portfolio total on dashboard) |
| `h1` | 20px | 600 | 1.3 | 0 | Page titles |
| `h2` | 16px | 500 | 1.4 | 0 | Section titles |
| `h3` | 14px | 500 | 1.4 | 0 | Card titles |
| `body` | 13px | 400 | 1.5 | 0 | Default body text, descriptions |
| `caption` | 11px | 400 | 1.4 | 0 | Metadata, helper text, last-updated stamps |
| `label` | 10px | 500 | 1.2 | 0.6px | All-caps labels above values (e.g., "DAY P&L") |
| `mono` | 13px | 400 | 1.4 | 0 | Numbers — tickers, prices, percentages |
| `mono-sm` | 11px | 400 | 1.4 | 0 | Numbers in compact tables, badges |

### 4.3 Weight rules

- Only **two weights**: 400 (regular) and 500 (medium). 600 is reserved for `display` and `h1` only.
- Never use 700+. It looks heavy and amateur in dark themes.

### 4.4 Number formatting

This is part of typography because it controls visual rhythm.

- **Currency:** `$184,302.47` — two decimals always for primary displays; integer for compact contexts.
- **Percentage:** `+1.42%` — always sign and two decimals for changes; one decimal for allocations (`38.0%`).
- **Large numbers:** use thousands separators (`1,204,182`); for hero displays optionally collapse to `1.20M` / `1.20B`.
- **Negative numbers:** prefix with `−` (Unicode minus, U+2212), not hyphen `-`. Cleaner alignment.

---

## 5. Spacing, radius, borders

### 5.1 Spacing scale

Built on a 4px grid. Use only these values; do not invent intermediate ones.

| Token | px |
|---|---|
| `0` | 0 |
| `0.5` | 2 |
| `1` | 4 |
| `1.5` | 6 |
| `2` | 8 |
| `2.5` | 10 |
| `3` | 12 |
| `4` | 16 |
| `5` | 20 |
| `6` | 24 |
| `8` | 32 |
| `10` | 40 |

**Density guidance:**
- Inside table cells: 6–8px vertical, 8–14px horizontal.
- Inside cards: 10–14px padding.
- Between cards: 8–12px gap.
- Between page sections: 16–24px.
- Page outer padding: 16–20px (this is a dense product — not 32+).

### 5.2 Radius

| Token | px | Use |
|---|---|---|
| `radius-xs` | 3 | Badges, very small inline pills |
| `radius-sm` | 4 | Inputs, dropdowns, tooltip bubbles |
| `radius-md` | 5–6 | Buttons, segmented controls |
| `radius-lg` | 8 | Cards, modals, large containers |
| `radius-xl` | 10 | Outer shells |

**Rule:** never use a radius greater than 10 anywhere in the product. This is a precision instrument; soft pillowy corners undermine that.

### 5.3 Borders

- Always 1px.
- Default `bd-1` between cards and sections.
- `bd-2` for input outlines and emphasized elements.
- `bd-3` only when the element needs to read as "selected" or "in focus."
- No double borders. No inset/outset.

### 5.4 Elevation

We do **not** use shadows for elevation. Depth comes from background level (`bg-0` → `bg-3`). The only acceptable shadow is a soft 1–2px glow under popovers and modals to lift them off the page, and only in light mode.

---

## 6. Iconography

- **Library:** Lucide. Single source for all icons — no mixing.
- **Sizes:** 14px (inline with body), 16px (default UI, inside buttons), 20px (sidebar nav), 24px (page headers, empty states).
- **Stroke:** 1.5–1.75. Never bolder; thin strokes match the chrome.
- **Color:** inherit from text (`fg-1` by default, `fg-0` when emphasized, `acc-text` when interactive-active).

---

## 7. Components

Every component below is specified by purpose, variants, sizes, states, and rules. Implementation lives in a separate file.

### 7.1 Button

**Variants:**
- `primary` — amber fill, white text. One per screen, used for the dominant action.
- `secondary` — transparent, `bd-2` outline, `fg-0` text. Default action.
- `ghost` — no border, no background, `fg-1` text. Tertiary actions, toolbar buttons.
- `danger` — transparent, `bd-2` outline, `bear` text. Destructive actions (sell all, delete).

**Sizes:** `sm` (24px height), `md` (30px height — default), `lg` (36px height, only for primary CTAs in modals/empty states).

**States:** default, hover, active, focus (2px amber-soft ring), disabled (`fg-3` text, no hover).

**Rules:**
- One primary button per visible region. If you want two, one of them is secondary.
- Icon-only buttons must have `aria-label`.
- Button text is sentence case. Never ALL CAPS. Never Title Case.

### 7.2 Input / Select / Search

- Height matches button `md` (30px).
- Background `bg-2`, border `bd-1`, text `fg-0`, placeholder `fg-3`.
- Focus: border becomes `acc`, plus 2px `acc-soft` ring outside.
- Inside dense forms, group horizontally with 8px gap. Inside settings/forms, vertical with `label` (10px uppercase) above each input.
- Search input has a 14px Lucide search icon at left, 8px from edge, `fg-2` color.

### 7.3 Badge

Compact label, monospace, ALL CAPS, 10px, padding `2px 7px`, radius `xs`.

**Variants:**
- `acc` — amber-soft background, amber text. Use for status tags like "PRO," "ACTIVE."
- `bull` — bull-soft background, bull text. P&L positive indicators.
- `bear` — bear-soft background, bear text. P&L negative indicators.
- `info` — info-soft, info text. "DIV," "NEW."
- `neutral` — `bg-3` background, `fg-1` text. "HOLD," currency codes.

### 7.4 Tabs

- Underline style only. No pill tabs.
- Active tab: `fg-0` text, 2px amber underline.
- Inactive: `fg-1` text, no border. Hover: `fg-0`.
- Tabs sit on a 1px `bd-1` baseline.
- Padding: 8px vertical, 14px horizontal.

### 7.5 Card

**Variants:**
- `default` — `bg-1` background, `bd-1` border, radius `lg`, padding 12px–14px. The standard container.
- `metric` — `bg-2` background, no border, radius `md`, padding 10px–12px. For metric blocks (label + value + delta).
- `elevated` — `bg-3` background, no border. For popovers and dropdowns only.

### 7.6 Tooltip

- Background `bg-3`, 1px `bd-2` border, radius `sm`, padding `4px 8px`.
- Font: `caption` (11px), `fg-0` color.
- 6px offset from trigger.
- 200ms delay before show; instant hide.
- Maximum width 240px. Wrap to 2 lines max.

### 7.7 Table

The single most important component in this product.

**Structure:**
- Header row: `bg-1` background (or `bg-0` if table is on a card), `fg-2` text, label style (10px uppercase, `letter-spacing: 0.5px`), 1px `bd-1` bottom border.
- Body rows: `fg-0` text for primary cells, `fg-1` for secondary cells, 1px `bd-1` between rows.
- Hover: row background becomes `bg-2`.
- Last row has no bottom border.

**Density:**
- Compact (default for portfolios, screener): 7px vertical padding, 12px row height when accounting for line-height.
- Comfortable (used only when table is the only content on screen): 10px vertical padding.

**Alignment:**
- Tickers, names, text → left.
- All numbers (qty, price, change, value, P&L) → right.
- Status badges → left or right depending on column role.

**Number cells:** always `mono` font, `tabular-nums`. Always.

**Sort indicators:** small `▲`/`▼` glyph in `fg-2` next to the column label, 11px, 4px gap. Active sort makes the label `fg-0`.

### 7.8 Empty / Loading / Error states

Every screen that shows data must define all three states.

- **Empty:** centered, 24px Lucide icon in `fg-2`, `body` text in `fg-1`, optional primary button below.
- **Loading:** skeleton blocks (`bg-2` background, no animation more aggressive than a slow pulse). Don't use spinners for data — they imply "loading the whole page."
- **Error:** `bear` icon, `body` text, "Retry" secondary button. Never blame the user.

---

## 8. Fintech primitives

These are product-specific composite components built on top of Section 7. They are not part of any shadcn-style library — they are owned by this product.

### 8.1 PriceChange

Displays a financial delta. Always carries: glyph + value + color.

- Format: `▲ 1.42%` (positive), `▼ 1.04%` (negative), `— 0.00%` (flat).
- Color: `bull` / `bear` / `fg-2` respectively.
- Font: `mono`, 12–13px depending on context.
- Variants: percentage-only, currency-only (`+$2,581`), or combined (`+$2,581 · 1.42%`).
- Never use just color or just glyph. Always both.

### 8.2 MetricCard

Container for one summary number.

- Structure (top to bottom): label (10px ALL CAPS, `fg-2`) → value (`display` or `h1` depending on importance) → delta (PriceChange component, optional).
- Background `bg-2`, no border, radius `md`, padding 10px 12px.
- Used in grids of 2–6 across the top of any analytics screen.

### 8.3 Sparkline

Mini chart inside a card or table cell.

- Height: 28–40px depending on context.
- Stroke: 1.4–1.6px, color = `bull` or `bear` based on net direction (last value vs first).
- Optional gradient fill underneath, 35% → 0% opacity.
- No axes, no labels, no grid. The number nearby provides context.

### 8.4 AllocationBar

Horizontal stacked bar showing portfolio composition.

- Height: 6–8px, radius `xs`, uses categorical palette (Section 3.6).
- Always paired with a legend: 8px swatch + label + percentage.
- Sort segments largest-to-smallest. "Cash" / "Other" always last, in `fg-2` neutral.

### 8.5 TickerCell

Standard cell for displaying an instrument identifier in tables.

- Layout: optional logo (16px, radius `xs`) + ticker symbol (`mono`, 500 weight, `fg-0`) + optional company name (`body`, `fg-1`, truncate at column width).
- If logo unavailable, omit (do not show placeholder square).

### 8.6 NumberCell

Wrapper for any displayed number to enforce formatting rules.

- Currency, percent, count, or price formats (Section 4.4).
- Always `mono`, `tabular-nums`, right-aligned.
- Optional color coding: `bull`/`bear` for changes, `fg-0` for absolute values, `fg-2` for de-emphasized.
- Negative values render with Unicode `−`, never hyphen.

### 8.7 P&L color rules (critical)

This product's most fundamental visual rule. Read carefully.

| Value type | Coloring |
|---|---|
| Day change (price, %) | `bull` if ≥ 0, `bear` if < 0 |
| Realized P&L | `bull` if ≥ 0, `bear` if < 0 |
| Unrealized P&L | `bull` if ≥ 0, `bear` if < 0 |
| Position value (absolute) | `fg-0` — never colored |
| Quantity, share count | `fg-0` — never colored |
| Cost basis, average price | `fg-0` — never colored |
| Allocation % | `fg-0` — never colored |
| Yield, dividend rate | `fg-0` — never colored (it's not a "change") |

**Why this matters:** if every number is colored, no color means anything. Reserve red/green for actual changes.

---

## 9. Layout patterns

### 9.1 App shell

```
┌─────┬──────────────────────────────────┐
│     │  topbar (56px)                   │
│ side├──────────────────────────────────┤
│ 220 │                                  │
│ px  │  page content                    │
│     │                                  │
└─────┴──────────────────────────────────┘
```

- Sidebar: `bg-1` background, 1px `bd-1` right border, 220px wide on desktop, collapsible to 56px (icons only).
- Topbar: `bg-1` background, 1px `bd-1` bottom border, 56px tall. Contains: global search (Cmd+K), market status indicator, currency selector, notifications, primary CTA, user menu.
- Content area: `bg-0` background, padding 16–20px.

### 9.2 Page header

Every page starts with this block:

- Page title (`h1`, `fg-0`).
- Optional subtitle on the same line, `body`, `fg-1`, separated by `·` or pipe.
- Right side: page-level actions (filter, export, primary CTA).
- 16px gap below before content.

### 9.3 Filter bar

For screener and table-heavy screens:

- Horizontal row, `bg-1` background, 12px padding, 1px `bd-1` border, radius `md`.
- Left side: filter chips (each is a small badge-like pill with label + value + remove `×`).
- Right side: "Clear all" ghost button, "Save filter" secondary button.
- 12px gap below before the table.

### 9.4 Drawer / Side panel

For ticker details opened from a screener row, edit forms, etc.

- Slides from the right.
- Width: 480–560px (do not block the underlying content).
- `bg-1` background, 1px `bd-1` left border.
- Internal padding 16–20px.

---

## 10. Charts

This section governs all data visualization (price charts, performance, allocation).

### 10.1 Axes and grid

- Grid lines: 1px, color `bd-1`. Horizontal only by default. Vertical grid only when timestamps are equally spaced.
- Axis labels: `caption` (11px), `fg-2` color.
- No axis lines themselves. Grid implies the axis.

### 10.2 Tooltips on charts

- Container: `bg-3`, 1px `bd-2`, radius `sm`, padding `8px 10px`.
- Title (timestamp or category): `caption`, `fg-2`.
- Value rows: 6px swatch + label (`fg-1`) + value (`mono`, `fg-0`), 4px row gap.
- Hover line on the chart: 1px, `fg-3`, dashed (`2 2`).

### 10.3 Price chart specifics

- **Line variant:** 1.5px stroke, color = `bull` or `bear` based on net direction over the visible range. Optional gradient fill.
- **Candlestick variant:** body width responsive to zoom, never less than 2px wide. Up = `bull`, down = `bear`. Wicks 1px, same color as body.
- **Volume bars (if shown):** 30% opacity of the candle color, separate panel below the price panel.

### 10.4 Allocation chart (donut / treemap)

- Donut: stroke width 16px on a chart of diameter 120px. Center shows total + label.
- Treemap: 1px `bd-1` borders between cells. Labels in `caption`, contrast text against fill.

---

## 11. Anti-patterns

Things that look fine in isolation but are wrong for this product.

| Don't | Why |
|---|---|
| Pure black `#000` or pure white `#FFF` backgrounds | Too harsh; we use slightly warm off-tones |
| Saturated emerald / red P&L colors | Eye fatigue over long sessions |
| Amber on a financial number | Breaks the data/interaction color separation |
| Bold weights (600+) outside `display` and `h1` | Looks aggressive, breaks calm density |
| Drop shadows for card elevation | Use background level instead |
| Rounded corners > 10px | Undermines the precision-instrument feel |
| Title Case or ALL CAPS in body text | Reserved for `label` style only |
| Spinners for data loading | Use skeleton blocks |
| Color without glyph for P&L | Fails accessibility; always pair |
| Hyphen `-` for negative numbers | Use Unicode `−` (U+2212) for alignment |
| More than one primary button per region | Erodes hierarchy |
| Mixed icon libraries | Lucide only |
| Proportional fonts for table numbers | Always `mono` with `tabular-nums` |
| Decorative gradients on cards | Distracts from data |
| Multi-color charts without semantic reason | Use up to 7 categorical colors max, never as decoration |

---

## 12. New-screen checklist

Before considering a screen done, verify each item:

**Structure**
- [ ] Page header with title and (if needed) right-side actions
- [ ] Empty, loading, and error states defined
- [ ] Mobile/narrow layout considered (or explicitly deferred)

**Color**
- [ ] No raw hex values; all colors via tokens
- [ ] Amber used only on interactive elements
- [ ] Bull/bear used only on actual change values
- [ ] Every P&L number paired with a glyph (`▲`/`▼` or `+`/`−`)
- [ ] Both dark and light theme verified

**Typography**
- [ ] All numbers in `mono` with `tabular-nums`
- [ ] Negative numbers use Unicode `−`
- [ ] No font weight above 500 (except `display`/`h1`)
- [ ] No Title Case or ALL CAPS outside `label` style

**Layout**
- [ ] Spacing values from the scale (no arbitrary `13px` paddings)
- [ ] Radius from the scale (no values above 10px)
- [ ] One primary button per region maximum
- [ ] Section dividers via 1px `bd-1`, not shadows

**Components**
- [ ] All UI elements use defined components (Section 7) or fintech primitives (Section 8)
- [ ] No custom one-off variants without justification
- [ ] All icons from Lucide
- [ ] All interactive elements have hover, focus, active, and disabled states defined

**Content**
- [ ] All copy is sentence case
- [ ] No filler microcopy ("Welcome!", "Awesome!")
- [ ] Currency, percent, and count formatting correct (Section 4.4)

---

## 13. Versioning and changes

This document is the source of truth. When implementation diverges, the implementation is wrong — fix the code, not the doc.

When the doc itself needs to change (new component, refined token), bump the version at the top, and add a brief changelog entry below.

### Changelog

- **0.1** — Initial draft. Tokens, typography, components, fintech primitives, anti-patterns, checklist. Stack-agnostic.

---

*End of design system.*
