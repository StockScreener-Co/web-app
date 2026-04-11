// artifacts/stockscreener/src/pages/watchlist.tsx
import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLastWatchlist } from "@/hooks/use-last-watchlist";
import { Link, useSearch, useLocation } from "wouter";
import { Bookmark, Plus, Search, Trash2, Loader2, Pencil, FileText, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  useGetWatchlistById,
  useUpdateWatchlist,
  useUpdateWatchlistItem,
  useRemoveInstrumentFromWatchlist,
  useAddInstrumentToWatchlist,
  useSearchInstruments,
} from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { WatchlistItemDto } from "@/lib/api-client";

// ---- Signal logic (client-side) ----
type Signal = "BUY" | "HOLD" | "SELL" | null;

function computeSignal(
  currentPrice: number,
  intrinsicValue: number | null | undefined,
  marginOfSafety: number
): Signal {
  if (intrinsicValue == null || intrinsicValue <= 0) return null;
  const threshold = intrinsicValue * (1 - marginOfSafety / 100);
  if (currentPrice <= threshold) return "BUY";
  if (currentPrice > intrinsicValue) return "SELL";
  return "HOLD";
}

function SignalBadge({ signal }: { signal: Signal }) {
  if (signal === null) return <span className="text-muted-foreground">—</span>;
  const styles: Record<NonNullable<Signal>, string> = {
    BUY: "bg-green-500/15 text-green-400 border-green-500/30",
    HOLD: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    SELL: "bg-destructive/15 text-destructive border-destructive/30",
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${styles[signal]}`}>
      {signal}
    </span>
  );
}

// ---- Inline IV editor cell ----
function IVCell({
  item,
  watchlistId,
}: {
  item: WatchlistItemDto;
  watchlistId: string;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(
    item.intrinsicValue != null ? String(item.intrinsicValue) : ""
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const { mutate: updateItem, isPending } = useUpdateWatchlistItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/v1/watchlists", watchlistId] });
        setEditing(false);
      },
      onError: () => {
        setEditing(false);
      },
    },
  });

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (!editing) {
      setDraft(item.intrinsicValue != null ? String(item.intrinsicValue) : "");
    }
  }, [item.intrinsicValue, editing]);

  const commit = () => {
    const parsed = draft === "" ? null : parseFloat(draft);
    if (parsed !== null && (isNaN(parsed) || parsed < 0)) {
      setEditing(false);
      return;
    }
    updateItem({
      id: watchlistId,
      instrumentId: item.instrumentId,
      data: { intrinsicValue: parsed },
    });
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        type="number"
        value={draft}
        min={0}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") inputRef.current?.blur();
          if (e.key === "Escape") {
            setDraft(item.intrinsicValue != null ? String(item.intrinsicValue) : "");
            setEditing(false);
          }
        }}
        className="w-28 h-7 text-sm"
        disabled={isPending}
      />
    );
  }

  return (
    <button
      onClick={() => {
        setDraft(item.intrinsicValue != null ? String(item.intrinsicValue) : "");
        setEditing(true);
      }}
      className="text-sm hover:text-primary transition-colors min-w-[4rem] text-left"
    >
      {item.intrinsicValue != null ? `$${item.intrinsicValue.toFixed(2)}` : <span className="text-muted-foreground">—</span>}
    </button>
  );
}

// ---- Note popover button ----
function NoteButton({
  item,
  watchlistId,
}: {
  item: WatchlistItemDto;
  watchlistId: string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(item.note ?? "");

  const { mutate: updateItem, isPending } = useUpdateWatchlistItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/v1/watchlists", watchlistId] });
        setOpen(false);
      },
    },
  });

  const save = () => {
    updateItem({
      id: watchlistId,
      instrumentId: item.instrumentId,
      data: { note: draft.trim() === "" ? null : draft.trim() },
    });
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(item.note ?? "");
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 transition-all ${
            item.note
              ? "text-primary opacity-100"
              : "text-muted-foreground hover:text-primary hover:bg-primary/10"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start" side="bottom">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Note for {item.symbol}
          </p>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a note..."
            className="text-sm resize-none h-24"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={save} disabled={isPending}>
              {isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ---- Margin of Safety inline editor ----
function MoSEditor({
  watchlistId,
  value,
}: {
  watchlistId: string;
  value: number;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (!editing) {
      setDraft(String(value));
    }
  }, [value, editing]);

  const { mutate: updateWatchlist, isPending } = useUpdateWatchlist({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/v1/watchlists", watchlistId] });
        setEditing(false);
      },
      onError: () => {
        setEditing(false);
      },
    },
  });

  const commit = () => {
    const parsed = parseFloat(draft);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      setEditing(false);
      return;
    }
    updateWatchlist({ id: watchlistId, data: { marginOfSafety: parsed } });
  };

  if (editing) {
    return (
      <div className="inline-flex items-center gap-1">
        <Input
          ref={inputRef}
          type="number"
          value={draft}
          min={0}
          max={100}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") inputRef.current?.blur();
            if (e.key === "Escape") setEditing(false);
          }}
          className="w-20 h-7 text-sm"
          disabled={isPending}
        />
        <span className="text-sm text-muted-foreground">%</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        setDraft(String(value));
        setEditing(true);
      }}
      className="text-sm font-semibold hover:text-primary transition-colors"
    >
      {value}% <Pencil className="w-3 h-3 inline-block ml-1 opacity-50" />
    </button>
  );
}

// ---- Add Ticker dialog (from within watchlist detail) ----
function AddTickerDialog({
  watchlistId,
  open,
  onOpenChange,
}: {
  watchlistId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);

  const { data: searchResults, isLoading: isSearching } = useSearchInstruments(
    { query: searchTerm, limit: 5 },
    {
      query: {
        enabled: searchTerm.length > 1,
        queryKey: ["/api/v1/instruments/search", searchTerm, 5],
      },
    }
  );

  const { mutate: addInstrument, isPending } = useAddInstrumentToWatchlist({
    mutation: {
      meta: { suppressErrorToast: true },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/v1/watchlists", watchlistId] });
        queryClient.invalidateQueries({ queryKey: ["/api/v1/watchlists"] });
        onOpenChange(false);
        setSearchTerm("");
      },
      onError: (error: any) => {
        if (error?.status === 409) {
          toast.error("Ticker is already in this watchlist");
        } else {
          toast.error("Failed to add ticker");
        }
      },
    },
  });

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) setSearchTerm(""); onOpenChange(next); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Ticker</DialogTitle>
        </DialogHeader>
        <div className="relative pt-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value.toUpperCase());
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              placeholder="e.g. AAPL"
              className="pl-10"
              autoFocus
            />
          </div>
          {showResults && searchTerm.length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-sm text-center text-muted-foreground">Searching...</div>
              ) : searchResults && searchResults.length > 0 ? (
                searchResults.map((instr) => (
                  <button
                    key={instr.id}
                    type="button"
                    className="w-full text-left px-4 py-3 hover:bg-accent flex items-center justify-between transition-colors border-b border-border/50 last:border-0"
                    disabled={isPending}
                    onClick={() => {
                      addInstrument({ id: watchlistId, instrumentId: instr.id });
                      setShowResults(false);
                    }}
                  >
                    <div>
                      <div className="font-bold text-sm">{instr.symbol}</div>
                      <div className="text-xs text-muted-foreground">{instr.name}</div>
                    </div>
                  </button>
                ))
              ) : searchTerm.length > 1 ? (
                <div className="p-4 text-sm text-center text-muted-foreground">No instruments found</div>
              ) : null}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---- Main page ----
export default function WatchlistPage() {
  const { user } = useAuth();
  const { lastWatchlistId, updateLastWatchlistId } = useLastWatchlist();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [showAddTicker, setShowAddTicker] = useState(false);

  const search = useSearch();
  const currentWatchlistId = useMemo(() => new URLSearchParams(search).get("id"), [search]);

  useEffect(() => {
    if (user && !currentWatchlistId && lastWatchlistId) {
      setLocation(`/watchlist?id=${lastWatchlistId}`);
    } else if (user && currentWatchlistId) {
      updateLastWatchlistId(currentWatchlistId);
    }
  }, [user, currentWatchlistId, lastWatchlistId, updateLastWatchlistId, setLocation]);

  const { data: watchlist, isLoading } = useGetWatchlistById(currentWatchlistId!, {
    query: {
      enabled: !!user && !!currentWatchlistId,
      queryKey: ["/api/v1/watchlists", currentWatchlistId],
    },
  });

  const { mutate: removeInstrument } = useRemoveInstrumentFromWatchlist({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/v1/watchlists", currentWatchlistId] });
        queryClient.invalidateQueries({ queryKey: ["/api/v1/watchlists"] });
      },
    },
  });

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-primary/10 p-6 rounded-full mb-6">
          <Bookmark className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-3xl font-display font-bold mb-3 tracking-tight">
          Please sign in
        </h2>
        <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
          Sign in to manage your watchlists.
        </p>
        <Link href="/auth">
          <Button size="lg" className="rounded-2xl px-8 h-12 shadow-xl shadow-primary/20 font-semibold">
            Sign In or Register
          </Button>
        </Link>
      </div>
    );
  }

  const items = watchlist?.items ?? [];
  const marginOfSafety = watchlist?.marginOfSafety ?? 0;

  return (
    <div className="flex flex-1">
      <div className="flex-1 min-w-0 overflow-y-auto">
        {!currentWatchlistId ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-primary/10 p-6 rounded-full mb-6">
              <Bookmark className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-3xl font-display font-bold mb-3 tracking-tight">
              No Watchlist Selected
            </h2>
            <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
              Select a watchlist from the sidebar or create a new one.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : (
          <div className="w-full max-w-[1600px] mx-auto px-6 py-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
              <div>
                <h1 className="text-4xl font-display font-extrabold tracking-tight mb-2 flex items-center gap-3">
                  <Bookmark className="w-8 h-8 text-primary shrink-0" /> {watchlist?.name}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <span>Margin of Safety:</span>
                  {currentWatchlistId && (
                    <MoSEditor watchlistId={currentWatchlistId} value={marginOfSafety} />
                  )}
                </div>
              </div>
              <Button
                onClick={() => setShowAddTicker(true)}
                className="shadow-lg shadow-primary/20 rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Ticker
              </Button>
            </div>

            {items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-28 bg-card/30 rounded-3xl border border-border/50 border-dashed"
              >
                <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Bookmark className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Your watchlist is empty</h3>
                <p className="text-muted-foreground max-w-md mx-auto text-lg mb-8">
                  Add tickers to track their intrinsic value and get BUY/HOLD/SELL signals.
                </p>
                <Button
                  size="lg"
                  onClick={() => setShowAddTicker(true)}
                  className="rounded-full shadow-lg shadow-primary/20 px-8"
                >
                  <Plus className="w-5 h-5 mr-2" /> Add Ticker
                </Button>
              </motion.div>
            ) : (
              <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-secondary/50 border-b border-border/50 text-sm font-medium text-muted-foreground">
                        <th className="p-4 pl-6 font-semibold">Symbol / Name</th>
                        <th className="p-4 font-semibold text-right">Price</th>
                        <th className="p-4 font-semibold text-right">Today</th>
                        <th className="p-4 font-semibold text-right">Intrinsic Value</th>
                        <th className="p-4 font-semibold text-right">IV + MoS</th>
                        <th className="p-4 font-semibold text-center">Signal</th>
                        <th className="p-4 pr-6 font-semibold text-center w-16">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      <AnimatePresence>
                        {items.map((item, i) => {
                          const signal = computeSignal(item.currentPrice, item.intrinsicValue, marginOfSafety);
                          const ivWithMos =
                            item.intrinsicValue != null
                              ? item.intrinsicValue * (1 - marginOfSafety / 100)
                              : null;
                          const todayTrend = item.todayChange?.trend;
                          return (
                            <motion.tr
                              key={item.instrumentId}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              transition={{ delay: i * 0.04 }}
                              className="hover:bg-accent/20 transition-colors group"
                            >
                              <td className="p-4 pl-6">
                                <Link
                                  href={`/ticker/${item.instrumentId}`}
                                  className="flex items-center gap-3"
                                >
                                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-sm flex-shrink-0">
                                    {item.symbol.slice(0, 2)}
                                  </div>
                                  <div>
                                    <div className="font-bold hover:text-primary transition-colors">
                                      {item.symbol}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{item.name}</div>
                                  </div>
                                </Link>
                              </td>
                              <td className="p-4 text-right font-semibold">
                                ${item.currentPrice.toFixed(2)}
                              </td>
                              <td
                                className={`p-4 text-right font-semibold text-sm ${
                                  todayTrend === "UP"
                                    ? "text-green-400"
                                    : todayTrend === "DOWN"
                                    ? "text-destructive"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {item.todayChange?.ratio != null
                                  ? `${item.todayChange.ratio > 0 ? "+" : ""}${item.todayChange.ratio.toFixed(2)}%`
                                  : "—"}
                              </td>
                              <td className="p-4 text-right">
                                {currentWatchlistId && (
                                  <IVCell item={item} watchlistId={currentWatchlistId} />
                                )}
                              </td>
                              <td className="p-4 text-right text-sm font-semibold">
                                {ivWithMos != null ? `$${ivWithMos.toFixed(2)}` : <span className="text-muted-foreground">—</span>}
                              </td>
                              <td className="p-4 text-center">
                                <SignalBadge signal={signal} />
                              </td>
                              <td className="p-4 pr-6 text-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                  onClick={() =>
                                    removeInstrument({
                                      id: currentWatchlistId!,
                                      instrumentId: item.instrumentId,
                                    })
                                  }
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {currentWatchlistId && (
              <AddTickerDialog
                watchlistId={currentWatchlistId}
                open={showAddTicker}
                onOpenChange={setShowAddTicker}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
