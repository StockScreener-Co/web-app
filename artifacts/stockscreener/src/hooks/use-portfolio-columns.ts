import { useState, useEffect } from "react";

export const ALL_COLUMNS = [
  { id: "asset" as const, label: "Symbol / Name", locked: true },
  { id: "currentPrice" as const, label: "Current Price", locked: false },
  { id: "qty" as const, label: "Qty", locked: false },
  { id: "avgPrice" as const, label: "Avg Price", locked: false },
  { id: "value" as const, label: "Value", locked: false },
  { id: "todayPL" as const, label: "Today P&L $", locked: false },
  { id: "todayPLPct" as const, label: "Today P&L %", locked: false },
  { id: "totalPL" as const, label: "Total P&L $", locked: false },
  { id: "totalPLPct" as const, label: "Total P&L %", locked: false },
  { id: "weight" as const, label: "Portfolio Weight %", locked: false },
];

export type ColumnId = (typeof ALL_COLUMNS)[number]["id"];

const DEFAULT_VISIBLE: ColumnId[] = [
  "asset",
  "currentPrice",
  "qty",
  "avgPrice",
  "value",
  "todayPL",
  "totalPL",
];
const STORAGE_KEY = "ss-portfolio-columns";

export function usePortfolioColumns() {
  const [visibleColumns, setVisibleColumns] = useState<ColumnId[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return DEFAULT_VISIBLE;
      const parsed: unknown = JSON.parse(stored);
      return Array.isArray(parsed) ? (parsed as ColumnId[]) : DEFAULT_VISIBLE;
    } catch {
      return DEFAULT_VISIBLE;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  function toggleColumn(id: ColumnId) {
    if (id === "asset") return;
    setVisibleColumns((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  return { visibleColumns, toggleColumn, allColumns: ALL_COLUMNS };
}
