import { useState } from "react";
import { usePortfolio } from "@/hooks/use-portfolio";
import { Link } from "wouter";
import {
  Briefcase, ArrowUpRight, ArrowDownRight, Search, Trash2,
  PieChart, Plus, BarChart2, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  PieChart as RechartsPie, Pie, Cell, ResponsiveContainer,
  Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid
} from "recharts";
import { MOCK_TICKERS, generateChartData } from "@/lib/mock-data";

const PALETTE = ["#22c55e", "#16a34a", "#4ade80", "#86efac", "#bbf7d0", "#dcfce7", "#10b981", "#059669"];

function generatePortfolioHistory(positions: any[]) {
  if (positions.length === 0) return [];
  const days = 30;
  const now = new Date();
  return Array.from({ length: days + 1 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (days - i));
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const factor = 0.85 + (i / days) * 0.15 + (Math.random() - 0.45) * 0.02;
    const value = positions.reduce((sum: number, p: any) => sum + p.shares * p.currentPrice * factor, 0);
    return { date: label, value: Math.round(value) };
  });
}

export default function Portfolio() {
  const { positions, stats, removePosition, addPosition } = usePortfolio();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ticker: "", shares: "", avgPrice: "" });
  const [formError, setFormError] = useState("");

  const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
  const fmtPct = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;
  const isPos = stats.totalReturn >= 0;

  const pieData = positions.map((p, i) => ({
    name: p.symbol,
    value: Math.round(p.currentValue),
    color: PALETTE[i % PALETTE.length],
  }));

  const historyData = generatePortfolioHistory(positions);
  const historyStart = historyData[0]?.value ?? 0;
  const historyEnd = historyData[historyData.length - 1]?.value ?? 0;
  const historyChange = historyEnd - historyStart;
  const historyChangePct = historyStart > 0 ? ((historyChange / historyStart) * 100).toFixed(2) : "0.00";

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const ticker = form.ticker.trim().toUpperCase();
    const shares = parseFloat(form.shares);
    const avgPrice = parseFloat(form.avgPrice);
    if (!ticker) { setFormError("Enter a ticker symbol"); return; }
    if (!MOCK_TICKERS.find(t => t.symbol === ticker)) {
      setFormError(`"${ticker}" not found. Try: AAPL, TSLA, NVDA, MSFT, AMZN, GOOGL, META, SPY, BTC`);
      return;
    }
    if (isNaN(shares) || shares <= 0) { setFormError("Enter a valid number of shares"); return; }
    if (isNaN(avgPrice) || avgPrice <= 0) { setFormError("Enter a valid average buy price"); return; }
    addPosition(ticker, shares, avgPrice);
    setForm({ ticker: "", shares: "", avgPrice: "" });
    setShowAdd(false);
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-display font-extrabold tracking-tight mb-1 flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-primary" /> Your Portfolio
          </h1>
          <p className="text-muted-foreground">Manage holdings, track returns, analyze allocation.</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="shadow-lg shadow-primary/20 rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> Add Position
        </Button>
      </div>

      {/* Add Position Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-bold">Add Position</h2>
                <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Ticker Symbol</label>
                  <input
                    value={form.ticker}
                    onChange={e => setForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }))}
                    placeholder="e.g. AAPL"
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Number of Shares</label>
                  <input
                    type="number"
                    value={form.shares}
                    onChange={e => setForm(f => ({ ...f, shares: e.target.value }))}
                    placeholder="e.g. 10"
                    min="0"
                    step="any"
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Average Buy Price ($)</label>
                  <input
                    type="number"
                    value={form.avgPrice}
                    onChange={e => setForm(f => ({ ...f, avgPrice: e.target.value }))}
                    placeholder="e.g. 150.00"
                    min="0"
                    step="any"
                    className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/50"
                  />
                </div>
                {formError && (
                  <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-2.5">{formError}</p>
                )}
                <Button type="submit" className="w-full rounded-xl mt-2">
                  Add to Portfolio
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {positions.length === 0 ? (
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
            Add your first position to start tracking performance, allocation, and returns.
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
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <StatCard title="Total Value" value={fmt(stats.totalValue)} subtitle={`${stats.positionCount} position${stats.positionCount !== 1 ? "s" : ""}`} icon={PieChart} />
            <StatCard
              title="Total P&L"
              value={fmt(stats.totalReturn)}
              subtitle="All-time return"
              icon={isPos ? ArrowUpRight : ArrowDownRight}
              valueClass={isPos ? "text-green-400" : "text-destructive"}
            />
            <StatCard
              title="Return %"
              value={fmtPct(stats.totalReturnPercent)}
              subtitle="vs. cost basis"
              icon={BarChart2}
              valueClass={isPos ? "text-green-400" : "text-destructive"}
            />
          </div>

          {/* Chart + Allocation row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Portfolio History Chart */}
            <div className="lg:col-span-2 bg-card border border-border/50 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="font-display font-bold text-lg mb-1">Portfolio Performance</h2>
                  <p className="text-sm text-muted-foreground">Last 30 days</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${parseFloat(historyChangePct) >= 0 ? "text-green-400" : "text-destructive"}`}>
                    {parseFloat(historyChangePct) >= 0 ? "+" : ""}{historyChangePct}%
                  </p>
                  <p className="text-xs text-muted-foreground">{parseFloat(historyChangePct) >= 0 ? "▲" : "▼"} {fmt(Math.abs(historyChange))}</p>
                </div>
              </div>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval={6} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} width={48} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }}
                      formatter={(v: number) => [fmt(v), "Value"]}
                    />
                    <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} fill="url(#portfolioGrad)" dot={false} activeDot={{ r: 4, fill: "#22c55e" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Allocation Pie */}
            <div className="bg-card border border-border/50 rounded-2xl p-6">
              <h2 className="font-display font-bold text-lg mb-1">Allocation</h2>
              <p className="text-sm text-muted-foreground mb-4">By current value</p>
              <div style={{ height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={72} paddingAngle={3} dataKey="value" stroke="none">
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12 }}
                      formatter={(v: number) => [fmt(v), ""]}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-3">
                {pieData.map(p => {
                  const pct = ((p.value / stats.totalValue) * 100).toFixed(1);
                  return (
                    <div key={p.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                        <span className="font-medium">{p.name}</span>
                      </div>
                      <span className="text-muted-foreground">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

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
                      <th className="p-4 pr-6 font-semibold text-center w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    <AnimatePresence>
                      {positions.map((pos, i) => {
                        const isPosPos = pos.totalReturn >= 0;
                        const alloc = ((pos.currentValue / stats.totalValue) * 100).toFixed(1);
                        return (
                          <motion.tr
                            key={pos.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ delay: i * 0.04 }}
                            className="hover:bg-accent/20 transition-colors group"
                          >
                            <td className="p-4 pl-6">
                              <Link href={`/ticker/${pos.symbol}`} className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-sm flex-shrink-0">
                                  {pos.symbol.slice(0, 2)}
                                </div>
                                <div>
                                  <div className="font-bold hover:text-primary transition-colors">{pos.symbol}</div>
                                  <div className="text-xs text-muted-foreground">{pos.name}</div>
                                </div>
                              </Link>
                            </td>
                            <td className="p-4 text-right">
                              <div className="font-semibold">{fmt(pos.currentPrice)}</div>
                              <div className={`text-xs ${pos.dayChangePercent >= 0 ? "text-green-400" : "text-destructive"}`}>
                                {pos.dayChangePercent >= 0 ? "+" : ""}{pos.dayChangePercent.toFixed(2)}% 1D
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <div className="font-semibold">{pos.shares.toFixed(4)}</div>
                              <div className="text-xs text-muted-foreground">Avg {fmt(pos.avgPrice)}</div>
                            </td>
                            <td className="p-4 text-right">
                              <div className="font-semibold">{fmt(pos.currentValue)}</div>
                              <div className="text-xs text-muted-foreground">{alloc}% of portfolio</div>
                            </td>
                            <td className="p-4 text-right">
                              <div className={`font-semibold ${isPosPos ? "text-green-400" : "text-destructive"}`}>
                                {fmt(pos.totalReturn)}
                              </div>
                              <div className={`text-xs ${isPosPos ? "text-green-400" : "text-destructive"}`}>
                                {fmtPct(pos.totalReturnPercent)}
                              </div>
                            </td>
                            <td className="p-4 pr-6 text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                onClick={() => removePosition(pos.id)}
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
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, valueClass = "text-foreground" }: any) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
      <div className="absolute -right-5 -top-5 text-primary/5 group-hover:text-primary/10 transition-colors">
        <Icon className="w-28 h-28" />
      </div>
      <div className="relative z-10">
        <h3 className="text-muted-foreground font-medium mb-2 text-sm">{title}</h3>
        <div className={`text-3xl font-display font-extrabold tracking-tight mb-1.5 ${valueClass}`}>{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground/80">{subtitle}</p>}
      </div>
    </div>
  );
}
