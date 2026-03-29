import { useState, useEffect, useCallback } from "react";

const LAST_PORTFOLIO_KEY = "tt_last_portfolio_id";

export function useLastPortfolio() {
  const [lastPortfolioId, setLastPortfolioId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LAST_PORTFOLIO_KEY);
    } catch (e) {
      return null;
    }
  });

  const updateLastPortfolioId = useCallback((id: string | null) => {
    try {
      if (id) {
        localStorage.setItem(LAST_PORTFOLIO_KEY, id);
      } else {
        localStorage.removeItem(LAST_PORTFOLIO_KEY);
      }
    } catch (e) {
      console.error("Failed to update last portfolio id:", e);
    }
    setLastPortfolioId(id);
  }, []);

  return {
    lastPortfolioId,
    updateLastPortfolioId,
  };
}
