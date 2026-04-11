import { useState } from "react";
import { useLocation } from "wouter";
import { Bookmark, Plus, ChevronLeft, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useGetWatchlists, useDeleteWatchlist } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLastWatchlist } from "@/hooks/use-last-watchlist";
import { CreateWatchlistDialog } from "@/components/create-watchlist-dialog";

interface WatchlistSidebarProps {
  currentWatchlistId: string | null;
  isOpen: boolean;
  onToggle: () => void;
}

export function WatchlistSidebar({
  currentWatchlistId,
  isOpen,
  onToggle,
}: WatchlistSidebarProps) {
  const { user } = useAuth();
  const { updateLastWatchlistId } = useLastWatchlist();
  const [, setLocation] = useLocation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [watchlistToDelete, setWatchlistToDelete] = useState<{ id: string; name: string } | null>(null);

  const queryClient = useQueryClient();
  const { mutate: deleteWatchlist } = useDeleteWatchlist();

  const { data: watchlists, isLoading } = useGetWatchlists({
    query: {
      enabled: !!user,
      queryKey: ["/api/v1/watchlists"],
    },
  });

  const handleConfirmDelete = () => {
    if (!watchlistToDelete) return;
    const idToDelete = watchlistToDelete.id;
    const isDeletingCurrentWatchlist = idToDelete === currentWatchlistId;
    const remaining = watchlists?.filter((wl) => wl.id !== idToDelete);

    deleteWatchlist(
      { id: idToDelete },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/v1/watchlists"] });
          if (isDeletingCurrentWatchlist) {
            if (remaining && remaining.length > 0) {
              updateLastWatchlistId(remaining[0].id);
              setLocation(`/watchlist?id=${remaining[0].id}`);
            } else {
              setLocation("/watchlists");
            }
          }
          setWatchlistToDelete(null);
        },
      }
    );
  };

  const navigate = (id: string) => {
    updateLastWatchlistId(id);
    setLocation(`/watchlist?id=${id}`);
  };

  return (
    <>
      {/* Floating tab — visible when sidebar is closed (desktop only) */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 h-16 w-6 items-center justify-center bg-primary text-primary-foreground rounded-l-lg shadow-lg hover:bg-primary/90 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
        </button>
      )}

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="absolute inset-0 z-10 bg-black/40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`absolute right-0 top-0 bottom-0 z-20 w-64 flex flex-col border-l border-border/50 bg-card shadow-2xl transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <span className="text-sm font-semibold text-foreground">Watchlists</span>
          <Button variant="ghost" size="icon" onClick={onToggle} className="h-7 w-7">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-2">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : watchlists && watchlists.length > 0 ? (
            watchlists.map((wl) => {
              const isActive = wl.id === currentWatchlistId;
              return (
                <div key={wl.id} className="group relative flex items-center">
                  <button
                    onClick={() => navigate(wl.id)}
                    className={`flex items-center gap-3 flex-1 min-w-0 px-4 py-2.5 text-left transition-colors pr-9 ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    <Bookmark className="w-4 h-4 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{wl.name}</div>
                      <div className="text-xs opacity-60">
                        {wl.itemCount} ticker{wl.itemCount !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setWatchlistToDelete({ id: wl.id, name: wl.name })}
                    className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          ) : (
            <p className="px-4 py-4 text-xs text-muted-foreground text-center">
              No watchlists yet
            </p>
          )}
        </div>

        {/* Create button */}
        <div className="border-t border-border/50 p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="w-4 h-4" />
            New Watchlist
          </Button>
        </div>

        <CreateWatchlistDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      </aside>

      <AlertDialog
        open={!!watchlistToDelete}
        onOpenChange={(open) => !open && setWatchlistToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete watchlist?</AlertDialogTitle>
            <AlertDialogDescription>
              "{watchlistToDelete?.name}" will be permanently deleted along with all its tickers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
