import { useState, useCallback } from "react";

const LAST_WATCHLIST_KEY = "ss-last-watchlist";

export function useLastWatchlist() {
  const [lastWatchlistId, setLastWatchlistId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LAST_WATCHLIST_KEY);
    } catch (e) {
      return null;
    }
  });

  const updateLastWatchlistId = useCallback((id: string | null) => {
    try {
      if (id) {
        localStorage.setItem(LAST_WATCHLIST_KEY, id);
      } else {
        localStorage.removeItem(LAST_WATCHLIST_KEY);
      }
    } catch (e) {
      console.error("Failed to update last watchlist id:", e);
    }
    setLastWatchlistId(id);
  }, []);

  return {
    lastWatchlistId,
    updateLastWatchlistId,
  };
}
