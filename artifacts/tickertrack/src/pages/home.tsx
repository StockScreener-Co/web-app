import { useState, useMemo } from "react";
import { Search, TrendingUp, PieChart, Bell, ShieldCheck, ArrowRight, Plus, BarChart2, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MOCK_TICKERS, searchTickers } from "@/lib/mock-data";
import { TickerCard } from "@/components/ticker-card";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const PORTFOLIO_DEMO = [
  { symbol: "AAPL", name: "Apple Inc.", shares: 10, avgPrice: 150, currentPrice: 175.43, color: "#22c55e" },
  { symbol: "NVDA", name: "NVIDIA", shares: 5, avgPrice: 600, currentPrice: 785.42, color: "#16a34a" },
  { symbol: "TSLA", name: "Tesla", shares: 8, avgPrice: 220, currentPrice: 248.15, color: "#4ade80" },
  { symbol: "MSFT", name: "Microsoft", shares: 6, avgPrice: 320, currentPrice: 378.85, color: "#86efac" },
];

const DEMO_VALUE = PORTFOLIO_DEMO.reduce((s, p) => s + p.shares * p.currentPrice, 0);
const DEMO_COST = PORTFOLIO_DEMO.reduce((s, p) => s + p.shares * p.avgPrice, 0);
const DEMO_RETURN = DEMO_VALUE - DEMO_COST;
const DEMO_RETURN_PCT = ((DEMO_RETURN / DEMO_COST) * 100).toFixed(2);

const PIE_DATA = PORTFOLIO_DEMO.map(p => ({
  name: p.symbol,
  value: Math.round(p.shares * p.currentPrice),
  color: p.color,
}));

const FEATURES = [
  {
    icon: PieChart,
    title: "Allocation Breakdown",
    desc: "See exactly how your capital is distributed across assets with a real-time pie chart.",
  },
  {
    icon: TrendingUp,
    title: "P&L Tracking",
    desc: "Track total return, gain/loss per position, and overall portfolio performance at a glance.",
  },
  {
    icon: Bell,
    title: "Watchlist",
    desc: "Save tickers you're following without committing capital. Never miss a move.",
  },
  {
    icon: ShieldCheck,
    title: "Stored Locally",
    desc: "Your portfolio data never leaves your device. Private by default, always.",
  },
];

export default function Home() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query) return MOCK_TICKERS.slice(0, 8);
    return searchTickers(query);
  }, [query]);

  const popularTags = ["AAPL", "TSLA", "NVDA", "MSFT", "BTC", "SPY"];

  return (
    <div className="flex-1 w-full">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 z-0">
          <img
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
            alt="finance background"
            className="w-full h-full object-cover opacity-60 mix-blend-screen"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-20 lg:py-28 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy + Search */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-foreground mb-5 leading-[1.1]">
                Track your portfolio.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-300">
                  Find your next opportunity.
                </span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-md leading-relaxed">
                Search stocks, ETFs, and crypto. Build a portfolio with real P&L tracking — no sign-up required.
              </p>

              <div className="relative max-w-xl mb-4">
                <div className="relative flex items-center bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all">
                  <Search className="w-5 h-5 text-muted-foreground ml-4 flex-shrink-0" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search stocks, ETFs… (AAPL, TSLA, BTC)"
                    className="w-full border-0 bg-transparent text-base py-5 px-3 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60 h-14"
                  />
                  <div className="pr-2">
                    <Button size="sm" className="rounded-xl shadow-sm shadow-primary/30">
                      Search <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-8">
                <span className="text-sm text-muted-foreground">Popular:</span>
                {popularTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground border border-border hover:border-primary hover:text-primary transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <Link href="/portfolio">
                  <Button size="lg" className="rounded-xl shadow-lg shadow-primary/25 px-6">
                    <BarChart2 className="w-4 h-4 mr-2" />
                    Build Portfolio
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="rounded-xl px-6" onClick={() => {
                  document.getElementById('market-section')?.scrollIntoView({ behavior: 'smooth' });
                }}>
                  View Markets
                </Button>
              </div>

              <div className="mt-6 flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-primary" /> Free to use</span>
                <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-primary" /> No sign-up</span>
                <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-primary" /> Real-time data</span>
              </div>
            </motion.div>

            {/* Right: Portfolio Demo Widget */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="hidden lg:block"
            >
              <PortfolioDemoWidget />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Portfolio Features Section */}
      <div className="border-b border-border/40 bg-card/30">
        <div className="container mx-auto px-4 py-16 max-w-6xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-4">
              <PieChart className="w-4 h-4" /> Portfolio Tracker
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight mb-4">
              Everything you need to manage your investments
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              Add positions, track gains and losses, and see your full allocation — all in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.07 }}
                className="bg-card border border-border/50 rounded-2xl p-6 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all group"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/portfolio">
              <Button size="lg" className="rounded-xl shadow-lg shadow-primary/20 px-8">
                <Plus className="w-4 h-4 mr-2" /> Start Building Your Portfolio
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Market Overview */}
      <div id="market-section" className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-display font-bold">
            {query ? `Results for "${query}"` : "Market Overview"}
          </h2>
          <span className="text-sm text-muted-foreground">{results.length} assets</span>
        </div>

        {results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {results.map((ticker, i) => (
              <motion.div
                key={ticker.symbol}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <TickerCard ticker={ticker} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-card/50 rounded-3xl border border-border/50 border-dashed">
            <Search className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No tickers found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Try searching for AAPL, MSFT, or BTC.
            </p>
            <button onClick={() => setQuery("")} className="mt-5 text-primary hover:underline font-medium text-sm">
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PortfolioDemoWidget() {
  const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="relative">
      {/* Glow */}
      <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl" />
      <div className="relative bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="border-b border-border/40 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Your Portfolio</p>
              <p className="text-2xl font-display font-extrabold">{fmt(DEMO_VALUE)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-0.5">Total Return</p>
              <p className="text-lg font-bold text-green-400">+{fmt(DEMO_RETURN)}</p>
              <p className="text-xs text-green-500">+{DEMO_RETURN_PCT}%</p>
            </div>
          </div>
        </div>

        {/* Chart + Holdings split */}
        <div className="grid grid-cols-5">
          {/* Pie */}
          <div className="col-span-2 flex flex-col items-center justify-center py-5 border-r border-border/30">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Allocation</p>
            <div style={{ width: 110, height: 110 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={30} outerRadius={52} paddingAngle={3} dataKey="value" stroke="none">
                    {PIE_DATA.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => [fmt(v), ""]}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1">
              {PIE_DATA.map(p => (
                <div key={p.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                  {p.name}
                </div>
              ))}
            </div>
          </div>

          {/* Holdings mini-list */}
          <div className="col-span-3 py-3">
            {PORTFOLIO_DEMO.map(pos => {
              const value = pos.shares * pos.currentPrice;
              const ret = ((pos.currentPrice - pos.avgPrice) / pos.avgPrice) * 100;
              return (
                <div key={pos.symbol} className="flex items-center justify-between px-4 py-2 hover:bg-accent/20 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                      {pos.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-none mb-0.5">{pos.symbol}</p>
                      <p className="text-xs text-muted-foreground">{pos.shares} shares</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{fmt(value)}</p>
                    <p className="text-xs text-green-400">+{ret.toFixed(1)}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA strip */}
        <Link href="/portfolio">
          <div className="border-t border-border/40 px-5 py-3 flex items-center justify-between hover:bg-accent/20 transition-colors cursor-pointer group">
            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Open your portfolio</span>
            <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}
