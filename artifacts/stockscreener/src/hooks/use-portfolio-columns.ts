import { useEffect, useState } from "react";
import { useGetPortfolioColumns } from "@/lib/api-client";

const STORAGE_KEY = "ss-portfolio-columns";

export function usePortfolioColumns() {
  const { data: serverColumns, isLoading } = useGetPortfolioColumns();
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!serverColumns || serverColumns.length === 0) return;

    const stored = (() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as string[]) : null;
      } catch {
        return null;
      }
    })();

    const serverKeys = new Set(serverColumns.map((c) => c.key));

    if (stored) {
      setVisibleColumns(stored.filter((k) => serverKeys.has(k)));
    } else {
      setVisibleColumns(serverColumns.filter((c) => c.isDefault).map((c) => c.key));
    }

    setInitialized(true);
  }, [serverColumns]);

  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns));
  }, [visibleColumns, initialized]);

  function toggleColumn(key: string) {
    const col = serverColumns?.find((c) => c.key === key);
    if (!col || col.isLocked) return;
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  return {
    allColumns: serverColumns ?? [],
    visibleColumns,
    toggleColumn,
    isLoading,
  };
}
