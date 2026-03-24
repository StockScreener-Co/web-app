import { useState, useEffect, useCallback } from "react";

const LAST_PORTFOLIO_KEY = "tt_last_portfolio_id";

export function useLastPortfolio() {
  const [lastPortfolioId, setLastPortfolioId] = useState<string | null>(() => {
    return localStorage.getItem(LAST_PORTFOLIO_KEY);
  });

  const updateLastPortfolioId = useCallback((id: string | null) => {
    if (id) {
      localStorage.setItem(LAST_PORTFOLIO_KEY, id);
    } else {
      localStorage.removeItem(LAST_PORTFOLIO_KEY);
    }
    setLastPortfolioId(id);
  }, []);

  return {
    lastPortfolioId,
    updateLastPortfolioId,
  };
}
