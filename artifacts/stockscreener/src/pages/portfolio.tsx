import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLastPortfolio } from "@/hooks/use-last-portfolio";
import { Link, useSearch, useLocation } from "wouter";
import {
  Briefcase, Search, Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetPortfolioById, useCreateTransaction, useSearchInstruments } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import type { OperationType } from "@/lib/api-client";

export default function Portfolio() {
  const { user } = useAuth();
  const { lastPortfolioId, updateLastPortfolioId } = useLastPortfolio();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ 
    instrumentId: "", 
    ticker: "", 
    quantity: "", 
    price: "", 
    tradeDate: new Date().toISOString().split('T')[0],
    operationType: "BUY" as OperationType
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [formError, setFormError] = useState("");

  const search = useSearch();
  const currentPortfolioId = useMemo(() => new URLSearchParams(search).get('id'), [search]);

  useEffect(() => {
    if (user && !currentPortfolioId && lastPortfolioId) {
      setLocation(`/portfolio?id=${lastPortfolioId}`);
    } else if (user && currentPortfolioId) {
      updateLastPortfolioId(currentPortfolioId);
    }
  }, [user, currentPortfolioId, lastPortfolioId, updateLastPortfolioId, setLocation]);

  const { data: portfolio, isLoading } = useGetPortfolioById(currentPortfolioId!, {
    query: {
      enabled: !!user && !!currentPortfolioId,
      queryKey: ["/api/v1/portfolios", currentPortfolioId],
    },
  });

  const { data: searchResults, isLoading: isSearching } = useSearchInstruments({
    query: searchTerm,
    limit: 5
  }, {
    query: {
      enabled: searchTerm.length > 1,
      queryKey: ["/api/v1/instruments/search", searchTerm, 5],
    }
  });

  const createTransaction = useCreateTransaction();

  const portfolioName = portfolio?.name || "Portfolio";

  const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
  const fmtPct = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!form.instrumentId) {
      setFormError("Please select an instrument from the search results");
      return;
    }

    if (!form.quantity || parseFloat(form.quantity) <= 0) {
      setFormError("Quantity must be greater than 0");
      return;
    }

    if (!form.price || parseFloat(form.price) < 0) {
      setFormError("Price cannot be negative");
      return;
    }

    try {
      await createTransaction.mutateAsync({
        portfolioId: currentPortfolioId!,
        data: {
          instrumentId: form.instrumentId,
          quantity: parseFloat(form.quantity),
          price: parseFloat(form.price),
          tradeDate: form.tradeDate,
          operationType: form.operationType,
        }
      });

      // Refresh portfolio data
      queryClient.invalidateQueries({ queryKey: ["/api/v1/portfolios", currentPortfolioId] });
      
      setShowAdd(false);
      setForm({
        instrumentId: "",
        ticker: "",
        quantity: "",
        price: "",
        tradeDate: new Date().toISOString().split('T')[0],
        operationType: "BUY"
      });
      setSearchTerm("");
    } catch (err: any) {
      setFormError(err.message || "Failed to add transaction");
    }
  }

  if (!user || !currentPortfolioId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-primary/10 p-6 rounded-full mb-6">
          <Briefcase className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-3xl font-display font-bold mb-3 tracking-tight">
          {!user ? "Please sign in" : "No Portfolio Selected"}
        </h2>
        <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
          {!user 
            ? "To manage your stock portfolio and track performance, you need to sign in to your account."
            : "Please select a portfolio from the menu or create a new one to start tracking your investments."}
        </p>
        <Link href={!user ? "/auth" : "/portfolios"}>
          <Button size="lg" className="rounded-2xl px-8 h-12 shadow-xl shadow-primary/20 font-semibold">
            {!user ? "Sign In or Register" : "Go to Portfolios"}
          </Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-12 text-center">Loading portfolio details...</div>;
  }

  const assets = portfolio?.assets || [];

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-display font-extrabold tracking-tight mb-1 flex items-center gap-3 text-balance">
            <Briefcase className="w-8 h-8 text-primary shrink-0" /> {portfolioName}
          </h1>
          <p className="text-muted-foreground">Manage holdings and track returns.</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="shadow-lg shadow-primary/20 rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> Add Position
        </Button>
      </div>

      {/* Add Position Dialog */}
      <Dialog open={showAdd} onOpenChange={(open) => {
        setShowAdd(open);
        if (!open) {
          setForm({
            instrumentId: "",
            ticker: "",
            quantity: "",
            price: "",
            tradeDate: new Date().toISOString().split("T")[0],
            operationType: "BUY",
          });
          setSearchTerm("");
          setFormError("");
        }
      }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Position</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 pt-2">
            {/* Instrument search */}
            <div className="relative">
              <Label className="mb-1.5 block">Search Instrument</Label>
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
                        onClick={() => {
                          setForm((f) => ({ ...f, instrumentId: instr.id, ticker: instr.symbol }));
                          setSearchTerm(instr.symbol);
                          setShowResults(false);
                        }}
                      >
                        <div>
                          <div className="font-bold text-sm">{instr.symbol}</div>
                          <div className="text-xs text-muted-foreground">{instr.name}</div>
                        </div>
                        <div className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground font-medium">
                          {instr.currency}
                        </div>
                      </button>
                    ))
                  ) : searchTerm.length > 1 ? (
                    <div className="p-4 text-sm text-center text-muted-foreground">No instruments found</div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Operation + Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">Operation</Label>
                <Select
                  value={form.operationType}
                  onValueChange={(v) => setForm((f) => ({ ...f, operationType: v as OperationType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUY">Buy</SelectItem>
                    <SelectItem value="SELL">Sell</SelectItem>
                    <SelectItem value="DIVIDEND">Dividend</SelectItem>
                    <SelectItem value="DEPOSIT">Deposit</SelectItem>
                    <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">Date</Label>
                <Input
                  type="date"
                  value={form.tradeDate}
                  onChange={(e) => setForm((f) => ({ ...f, tradeDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Quantity + Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">Quantity</Label>
                <Input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  placeholder="0.00"
                  min="0"
                  step="any"
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Price ($)</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="0.00"
                  min="0"
                  step="any"
                />
              </div>
            </div>

            {formError && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-2.5">
                {formError}
              </p>
            )}

            <DialogFooter>
              <Button
                type="submit"
                className="w-full font-bold shadow-lg shadow-primary/20"
                disabled={createTransaction.isPending}
              >
                {createTransaction.isPending ? "Adding..." : "Add Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {assets.length === 0 ? (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-28 bg-card/30 rounded-3xl border border-border/50 border-dashed"
        >
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <Briefcase className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Your portfolio is empty</h3>
          <p className="text-muted-foreground max-w-md mx-auto text-lg mb-8">
            Add your first position to start tracking performance and returns.
          </p>
          <div className="flex gap-3 justify-center">
            <Button size="lg" onClick={() => setShowAdd(true)} className="rounded-full shadow-lg shadow-primary/20 px-8">
              <Plus className="w-5 h-5 mr-2" /> Add Position
            </Button>
            <Link href="/">
              <Button size="lg" variant="outline" className="rounded-full px-8">
                <Search className="w-4 h-4 mr-2" /> Explore Assets
              </Button>
            </Link>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {/* Holdings Table */}
          <div>
            <h2 className="text-2xl font-display font-bold mb-5">Holdings</h2>
            <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-secondary/50 border-b border-border/50 text-sm font-medium text-muted-foreground">
                      <th className="p-4 pl-6 font-semibold">Asset</th>
                      <th className="p-4 font-semibold text-right">Current Price</th>
                      <th className="p-4 font-semibold text-right">Holdings</th>
                      <th className="p-4 font-semibold text-right">Value</th>
                      <th className="p-4 font-semibold text-right">Return</th>
                      {/* <th className="p-4 pr-6 font-semibold text-center w-16"></th> */}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    <AnimatePresence>
                      {assets.map((asset, i) => {
                        const isPosToday = asset.todayChange?.trend === 'UP';
                        const isPosTotal = asset.unrealizedPL?.trend === 'UP';
                        return (
                          <motion.tr
                            key={asset.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ delay: i * 0.04 }}
                            className="hover:bg-accent/20 transition-colors group"
                          >
                            <td className="p-4 pl-6">
                              <Link href={`/ticker/${asset.instrumentId}`} className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-sm flex-shrink-0">
                                  {asset.symbol.slice(0, 2)}
                                </div>
                                <div>
                                  <div className="font-bold hover:text-primary transition-colors">{asset.symbol}</div>
                                  <div className="text-xs text-muted-foreground">{asset.name}</div>
                                </div>
                              </Link>
                            </td>
                            <td className="p-4 text-right">
                              <div className="font-semibold">{fmt(asset.currentPrice)}</div>
                              <div className={`text-xs ${isPosToday ? "text-green-400" : asset.todayChange?.trend === 'DOWN' ? "text-destructive" : "text-muted-foreground"}`}>
                                {asset.todayChange?.ratio?.toFixed(2) ?? "0.00"}% 1D
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <div className="font-semibold">{asset.qty.toFixed(4)}</div>
                              <div className="text-xs text-muted-foreground">Avg {fmt(asset.avgPrice)}</div>
                            </td>
                            <td className="p-4 text-right">
                              <div className="font-semibold">{fmt(asset.value)}</div>
                              <div className="text-xs text-muted-foreground">{(asset.weight * 100).toFixed(1)}% of portfolio</div>
                            </td>
                            <td className="p-4 text-right">
                              <div className={`font-semibold ${isPosTotal ? "text-green-400" : asset.unrealizedPL?.trend === 'DOWN' ? "text-destructive" : "text-muted-foreground"}`}>
                                {fmt(asset.unrealizedPL?.value ?? 0)}
                              </div>
                              <div className={`text-xs ${isPosTotal ? "text-green-400" : asset.unrealizedPL?.trend === 'DOWN' ? "text-destructive" : "text-muted-foreground"}`}>
                                {fmtPct(asset.unrealizedPL?.ratio ?? 0)}
                              </div>
                            </td>
                            {/* <td className="p-4 pr-6 text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                onClick={() => {}}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td> */}
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
