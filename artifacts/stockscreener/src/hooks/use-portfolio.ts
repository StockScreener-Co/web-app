import { useState, useEffect } from 'react';

export interface PortfolioItem {
  id: string;
  symbol: string;
  shares: number;
  avgPrice: number;
  dateAdded: string;
}

const STORAGE_KEY = 'ss_portfolio';

export function usePortfolio() {
  const [positions, setPositions] = useState<PortfolioItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to load portfolio from localStorage', e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  }, [positions]);

  const addPosition = (symbol: string, shares: number, avgPrice: number) => {
    const newPosition: PortfolioItem = {
      id: crypto.randomUUID(),
      symbol: symbol.toUpperCase(),
      shares,
      avgPrice,
      dateAdded: new Date().toISOString(),
    };
    setPositions(prev => [...prev, newPosition]);
  };

  const removePosition = (id: string) => {
    setPositions(prev => prev.filter(p => p.id !== id));
  };

  // Enriched data
  const enrichedPositions = positions.map(pos => {
    const currentPrice = pos.avgPrice; // Fallback to avgPrice if we don't have current price
    const currentValue = pos.shares * currentPrice;
    const totalCost = pos.shares * pos.avgPrice;
    const totalReturn = currentValue - totalCost;
    const totalReturnPercent = (totalReturn / totalCost) * 100;

    return {
      ...pos,
      name: pos.symbol,
      currentPrice,
      currentValue,
      totalCost,
      totalReturn,
      totalReturnPercent,
      dayChangePercent: 0
    };
  });

  const totalValue = enrichedPositions.reduce((sum, p) => sum + p.currentValue, 0);
  const totalCost = enrichedPositions.reduce((sum, p) => sum + p.totalCost, 0);
  const totalReturn = totalValue - totalCost;
  const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

  return {
    positions: enrichedPositions,
    rawPositions: positions,
    addPosition,
    removePosition,
    stats: {
      totalValue,
      totalCost,
      totalReturn,
      totalReturnPercent,
      positionCount: positions.length
    }
  };
}
