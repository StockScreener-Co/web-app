# Holdings Count Badge — Design Spec

## Summary

Show the number of holdings in a portfolio as a badge in two places:
1. Portfolio list cards (so users can identify portfolios at a glance)
2. Portfolio detail page next to the Holdings section heading

## API Changes

Add `holdingCount: integer` to two schemas in `lib/api-spec/openapi.yaml`:

**PortfolioDto** (returned by `GET /v1/portfolios/my`):
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

**PortfolioDetailsDto** (returned by `GET /v1/portfolios/{id}`):
```yaml
holdingCount:
  type: integer
```
Added to `properties` and `required`.

After updating the spec, run:
```bash
pnpm --filter @workspace/api-spec run codegen
```

## UI — Portfolio List (`portfolios-list.tsx`)

Replace the existing "Click to view details" placeholder text in `CardContent` with a holdings badge:

```tsx
<span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
  {portfolio.holdingCount === 0 ? "No holdings" : `${portfolio.holdingCount} holdings`}
</span>
```

## UI — Portfolio Detail (`portfolio.tsx`)

Add a badge next to the "Holdings" section heading above the table (~line 577):

```tsx
<h2 className="text-2xl font-display font-bold flex items-center gap-2">
  Holdings
  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
    {portfolio?.holdingCount ?? assets.length}
  </span>
</h2>
```

Fallback to `assets.length` if `holdingCount` is not yet returned by the backend.

## No new components

Both badges use inline Tailwind — no new component files needed.
