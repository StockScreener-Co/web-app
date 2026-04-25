import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Loader2, Plus } from "lucide-react";
import {
  useGetWatchlists,
  useAddInstrumentToWatchlist,
  useCreateWatchlist,
} from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface AddToWatchlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instrumentId: string;
  symbol: string;
}

export function AddToWatchlistDialog({
  open,
  onOpenChange,
  instrumentId,
  symbol,
}: AddToWatchlistDialogProps) {
  const queryClient = useQueryClient();
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [showInlineCreate, setShowInlineCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { data: watchlists, isLoading } = useGetWatchlists({
    query: {
      enabled: open,
      queryKey: ["/api/v1/watchlists"],
    },
  });

  const { mutateAsync: addInstrument } = useAddInstrumentToWatchlist({
    mutation: { meta: { suppressErrorToast: true } },
  });
  const { mutateAsync: createWatchlist } = useCreateWatchlist({
    mutation: { meta: { suppressErrorToast: true } },
  });

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreateAndCheck = async () => {
    if (!newName.trim()) return;
    try {
      const created = await createWatchlist({ data: { name: newName.trim() } });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/watchlists"] });
      setCheckedIds((prev) => new Set(prev).add(created.id));
      setNewName("");
      setShowInlineCreate(false);
    } catch {
      toast.error("Failed to create watchlist");
    }
  };

  const handleSave = async () => {
    if (checkedIds.size === 0) {
      onOpenChange(false);
      return;
    }
    setIsSaving(true);
    const results = await Promise.allSettled(
      [...checkedIds].map((wid) =>
        addInstrument({ id: wid, instrumentId })
      )
    );
    setIsSaving(false);

    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length === 0) {
      toast.success(`Added ${symbol} to watchlist${checkedIds.size > 1 ? "s" : ""}`);
    } else {
      toast.error(`${failed.length} watchlist(s) failed — ticker may already be there`);
    }
    queryClient.invalidateQueries({ queryKey: ["/api/v1/watchlists"] });
    setCheckedIds(new Set());
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setCheckedIds(new Set());
      setShowInlineCreate(false);
      setNewName("");
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add {symbol} to Watchlist</DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-2 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : watchlists && watchlists.length > 0 ? (
            watchlists.map((wl) => (
              <label
                key={wl.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
              >
                <Checkbox
                  checked={checkedIds.has(wl.id)}
                  onCheckedChange={() => toggleCheck(wl.id)}
                />
                <span className="text-sm font-medium">{wl.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{wl.itemCount}</span>
              </label>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No watchlists yet.</p>
          )}
        </div>

        {showInlineCreate ? (
          <div className="flex gap-2 pt-1">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Watchlist name"
              className="h-8 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateAndCheck();
                if (e.key === "Escape") setShowInlineCreate(false);
              }}
            />
            <Button size="sm" onClick={handleCreateAndCheck} disabled={!newName.trim()}>
              Create
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setShowInlineCreate(true)}
            className="flex items-center gap-1.5 text-sm text-primary hover:underline pt-1"
          >
            <Plus className="w-4 h-4" /> Create new watchlist
          </button>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || checkedIds.size === 0}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
