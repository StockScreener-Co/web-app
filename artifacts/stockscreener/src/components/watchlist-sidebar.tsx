import { useState } from "react";
import { useLocation } from "wouter";
import { Bookmark, Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGetWatchlists } from "@/lib/api-client";
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

  const { data: watchlists, isLoading } = useGetWatchlists({
    query: {
      enabled: !!user,
      queryKey: ["/api/v1/watchlists"],
    },
  });

  const navigate = (id: string) => {
    updateLastWatchlistId(id);
    setLocation(`/watchlist?id=${id}`);
  };

  return (
    <aside
      className={`flex flex-col shrink-0 border-r border-border/50 bg-card/30 transition-all duration-200 overflow-hidden ${
        isOpen ? "w-64" : "w-14"
      }`}
    >
      {/* Toggle button */}
      <div className="flex items-center justify-end p-2 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8">
          {isOpen ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
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
            if (!isOpen) {
              return (
                <Tooltip key={wl.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => navigate(wl.id)}
                      className={`flex items-center justify-center w-full h-10 transition-colors ${
                        isActive
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="font-medium">{wl.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {wl.itemCount} ticker{wl.itemCount !== 1 ? "s" : ""}
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            }
            return (
              <button
                key={wl.id}
                onClick={() => navigate(wl.id)}
                className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors ${
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
            );
          })
        ) : (
          isOpen && (
            <p className="px-4 py-4 text-xs text-muted-foreground text-center">
              No watchlists yet
            </p>
          )
        )}
      </div>

      {/* Create button */}
      <div className="border-t border-border/50 p-2">
        {isOpen ? (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="w-4 h-4" />
            New Watchlist
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-full h-9 text-muted-foreground hover:text-foreground"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">New Watchlist</TooltipContent>
          </Tooltip>
        )}
      </div>

      <CreateWatchlistDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </aside>
  );
}
