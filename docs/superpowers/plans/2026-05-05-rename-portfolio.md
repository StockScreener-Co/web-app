# Rename Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the ability to rename a portfolio via a shared dialog, accessible from both the portfolios list page and the portfolio detail page.

**Architecture:** Add `PUT /v1/portfolios/{id}` to the OpenAPI spec and regenerate hooks. Create a `RenamePortfolioDialog` component (mirrors `CreatePortfolioDialog`) used in both `portfolios-list.tsx` and `portfolio.tsx`.

**Tech Stack:** React 19, TanStack Query v5, React Hook Form, Zod, Orval (codegen), Tailwind CSS v4, Radix UI, Sonner (toasts), lucide-react

---

## File Map

| Action | File |
|---|---|
| Modify | `lib/api-spec/openapi.yaml` |
| Auto-generated | `lib/api-client-react/src/generated/api.ts` |
| Auto-generated | `lib/api-client-react/src/generated/api.schemas.ts` |
| Create | `artifacts/stockscreener/src/components/rename-portfolio-dialog.tsx` |
| Modify | `artifacts/stockscreener/src/pages/portfolios-list.tsx` |
| Modify | `artifacts/stockscreener/src/pages/portfolio.tsx` |

---

### Task 1: Add PUT endpoint to OpenAPI spec

**Files:**
- Modify: `lib/api-spec/openapi.yaml`

- [ ] **Step 1: Add `put` operation under `/v1/portfolios/{id}`**

In `lib/api-spec/openapi.yaml`, find the `delete` block under `/v1/portfolios/{id}` (around line 111) and insert the `put` block immediately before it:

```yaml
  /v1/portfolios/{id}:
    get:
      # ... existing get operation, unchanged ...
    put:
      operationId: updatePortfolio
      tags: [portfolios]
      summary: Update portfolio
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/PortfolioRequestDto"
      responses:
        "200":
          description: Successful response
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PortfolioDto"
    delete:
      # ... existing delete operation, unchanged ...
```

- [ ] **Step 2: Commit**

```bash
git add lib/api-spec/openapi.yaml
git commit -m "feat: add PUT /v1/portfolios/{id} to openapi spec"
```

---

### Task 2: Run codegen

**Files:**
- Auto-generated: `lib/api-client-react/src/generated/api.ts`

- [ ] **Step 1: Run codegen**

```bash
pnpm --filter @workspace/api-spec run codegen
```

Expected: no errors. Orval regenerates `lib/api-client-react/src/generated/api.ts`.

- [ ] **Step 2: Verify `useUpdatePortfolio` was generated**

```bash
grep -n "useUpdatePortfolio" lib/api-client-react/src/generated/api.ts
```

Expected: at least one line with `export const useUpdatePortfolio`.

- [ ] **Step 3: Commit generated files**

```bash
git add lib/api-client-react/src/generated/
git commit -m "chore: regenerate api client with updatePortfolio hook"
```

---

### Task 3: Create `RenamePortfolioDialog` component

**Files:**
- Create: `artifacts/stockscreener/src/components/rename-portfolio-dialog.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUpdatePortfolio } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const formSchema = z.object({
  name: z.string().min(1, "Name is mandatory").max(100, "Max length 100 symbols"),
});

type FormValues = z.infer<typeof formSchema>;

interface RenamePortfolioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolioId: string;
  currentName: string;
}

export function RenamePortfolioDialog({
  open,
  onOpenChange,
  portfolioId,
  currentName,
}: RenamePortfolioDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { mutate: updatePortfolio, isPending } = useUpdatePortfolio({
    mutation: {
      onSuccess: () => {
        toast.success("Portfolio renamed successfully");
        queryClient.invalidateQueries({ queryKey: ["/api/v1/portfolios/my", user?.email] });
        queryClient.invalidateQueries({ queryKey: ["/api/v1/portfolios", portfolioId] });
        onOpenChange(false);
      },
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: currentName },
  });

  useEffect(() => {
    if (open) {
      form.reset({ name: currentName });
    }
  }, [open, currentName, form]);

  const onSubmit = (values: FormValues) => {
    updatePortfolio({ id: portfolioId, data: values });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename Portfolio</DialogTitle>
          <DialogDescription>Enter a new name for your portfolio.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Portfolio Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. My Retirement Fund" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add artifacts/stockscreener/src/components/rename-portfolio-dialog.tsx
git commit -m "feat: add RenamePortfolioDialog component"
```

---

### Task 4: Add rename button to portfolios list cards

**Files:**
- Modify: `artifacts/stockscreener/src/pages/portfolios-list.tsx`

- [ ] **Step 1: Add imports**

At the top of `portfolios-list.tsx`, update the lucide-react import to include `Pencil`:

```tsx
import { Briefcase, Plus, ChevronRight, Loader2, Trash2, Pencil } from "lucide-react";
```

Add the `RenamePortfolioDialog` import after the existing dialog imports:

```tsx
import { RenamePortfolioDialog } from "@/components/rename-portfolio-dialog";
```

- [ ] **Step 2: Add `renameTarget` state**

Inside the `PortfoliosList` component, after the existing `useState` declarations, add:

```tsx
const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
```

- [ ] **Step 3: Add pencil button to each card**

Inside the `portfolios.map(...)` block, the existing trash button sits in a div at `absolute top-4 right-12`. Add a sibling div for the pencil button immediately before it:

```tsx
{/* Rename button */}
<div className="absolute top-4 right-20 opacity-0 group-hover:opacity-100 transition-opacity">
  <Button
    variant="ghost"
    size="icon"
    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/20 rounded-full"
    onClick={(e) => {
      e.preventDefault();
      setRenameTarget({ id: portfolio.id, name: portfolio.name });
    }}
  >
    <Pencil className="w-4 h-4" />
  </Button>
</div>
{/* Delete button — existing, unchanged */}
<div className="absolute top-4 right-12 opacity-0 group-hover:opacity-100 transition-opacity">
  ...
```

Note: `e.preventDefault()` is needed because the card is wrapped in a `<Link>`.

- [ ] **Step 4: Add `RenamePortfolioDialog` at the bottom of the return**

Just before the closing `</div>` of the component return, after the existing `<CreatePortfolioDialog .../>`:

```tsx
<RenamePortfolioDialog
  open={!!renameTarget}
  onOpenChange={(open) => { if (!open) setRenameTarget(null); }}
  portfolioId={renameTarget?.id ?? ""}
  currentName={renameTarget?.name ?? ""}
/>
```

- [ ] **Step 5: Typecheck**

```bash
pnpm run typecheck
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add artifacts/stockscreener/src/pages/portfolios-list.tsx
git commit -m "feat: add rename button to portfolio list cards"
```

---

### Task 5: Add rename button to portfolio detail page header

**Files:**
- Modify: `artifacts/stockscreener/src/pages/portfolio.tsx`

- [ ] **Step 1: Add `renameDialogOpen` state**

Inside the `Portfolio` component, after the existing state declarations, add:

```tsx
const [renameDialogOpen, setRenameDialogOpen] = useState(false);
```

- [ ] **Step 2: Add import for `RenamePortfolioDialog`**

At the top of `portfolio.tsx`, add after the existing component imports:

```tsx
import { RenamePortfolioDialog } from "@/components/rename-portfolio-dialog";
```

`Pencil` is already imported on line 28: `import { Columns3, Pencil, Trash2 } from "lucide-react";` — no change needed.

- [ ] **Step 3: Add pencil button in the header `<h1>`**

Find the portfolio page header (around line 369):

```tsx
<h1 className="text-4xl font-display font-extrabold tracking-tight mb-1 flex items-center gap-3 text-balance">
  <Briefcase className="w-8 h-8 text-primary shrink-0" /> {portfolioName}
</h1>
```

Replace with:

```tsx
<h1 className="text-4xl font-display font-extrabold tracking-tight mb-1 flex items-center gap-3 text-balance">
  <Briefcase className="w-8 h-8 text-primary shrink-0" /> {portfolioName}
  <Button
    variant="ghost"
    size="icon"
    className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
    onClick={() => setRenameDialogOpen(true)}
  >
    <Pencil className="w-4 h-4" />
  </Button>
</h1>
```

- [ ] **Step 4: Add `RenamePortfolioDialog` before the closing `</div>` of the component return**

At the very end of the `portfolio.tsx` return, before the final `</div>`:

```tsx
<RenamePortfolioDialog
  open={renameDialogOpen}
  onOpenChange={setRenameDialogOpen}
  portfolioId={currentPortfolioId!}
  currentName={portfolioName}
/>
```

- [ ] **Step 5: Typecheck**

```bash
pnpm run typecheck
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add artifacts/stockscreener/src/pages/portfolio.tsx
git commit -m "feat: add rename button to portfolio detail page header"
```

---

## Manual Verification Checklist

After all tasks are complete, verify in the browser (`pnpm run dev`):

- [ ] Hover over a portfolio card in `/portfolios` — pencil icon appears to the left of the trash icon
- [ ] Click pencil icon — `RenamePortfolioDialog` opens with the current name pre-filled
- [ ] Submit with an empty name — validation error "Name is mandatory" appears
- [ ] Submit with a name > 100 chars — validation error appears
- [ ] Submit a valid new name — success toast, card title updates
- [ ] On `/portfolio` page — pencil icon appears next to the portfolio name in the header
- [ ] Click it — dialog opens with current name pre-filled
- [ ] Submit a valid new name — success toast, page `<h1>` title updates
