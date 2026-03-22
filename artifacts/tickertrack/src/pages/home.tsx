import { useState, useMemo, useEffect } from "react";
import { Search, TrendingUp, PieChart, Bell, ShieldCheck, ArrowRight, Plus, BarChart2, Star, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchTickers } from "@/lib/mock-data";
import { TickerCard, InstrumentMostPopularDto } from "@/components/ticker-card";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useAuth } from "@/hooks/use-auth";

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
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [popularInstruments, setPopularInstruments] = useState<InstrumentMostPopularDto[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(false);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);

  useEffect(() => {
    async function fetchPopular() {
      setIsLoadingPopular(true);
      try {
        const res = await fetch("/api/v1/stock-popularity/most-popular");
        if (res.ok) {
          const data = await res.json();
          setPopularInstruments(data);
        }
      } catch (err) {
        console.error("Failed to fetch popular instruments:", err);
      } finally {
        setIsLoadingPopular(false);
      }
    }

    fetchPopular();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsLoadingSearch(false);
      return;
    }

    setIsLoadingSearch(true);
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/instruments/search?query=${encodeURIComponent(query)}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsLoadingSearch(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);


  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <div className="flex-1 w-full" onClick={() => setIsSearchFocused(false)}>
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-border/40">
        {/* Animated CSS Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="hero-dot-grid absolute inset-0" />
          <div className="absolute top-[-15%] left-[5%] w-[700px] h-[700px] rounded-full bg-primary/10 blur-[130px] animate-pulse-slow" />
          <div className="absolute top-[10%] right-[-8%] w-[500px] h-[500px] rounded-full bg-emerald-700/10 blur-[100px] animate-pulse-slow2" />
          <div className="absolute bottom-[-20%] left-[35%] w-[600px] h-[600px] rounded-full bg-primary/6 blur-[150px] animate-pulse-slow" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/55 to-background" />
        </div>

        <div className="w-full max-w-[1600px] relative z-10 mx-auto px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
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
                Search stocks, ETFs, and crypto. Build a portfolio with real P&L tracking.
              </p>

              <div className="relative max-w-xl mb-4">
                <div 
                  className="relative flex items-center bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Search className="w-5 h-5 text-muted-foreground ml-4 flex-shrink-0" />
                  <Input
                    value={query}
                    onFocus={() => setIsSearchFocused(true)}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setIsSearchFocused(true);
                    }}
                    placeholder="Search stocks, ETFs… (AAPL, TSLA, BTC)"
                    className="w-full border-0 bg-transparent text-base py-5 px-4 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60 h-14"
                  />
                </div>

                {/* Search Results Dropdown */}
                {isSearchFocused && query.trim() && (
                  <div 
                    className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[400px] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isLoadingSearch ? (
                      <div className="p-8 text-center">
                        <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Searching...</p>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="overflow-y-auto py-2">
                        {searchResults.map((item) => (
                          <Link 
                            key={item.id} 
                            href={`/ticker/${item.id}`}
                            className="flex items-center justify-between px-5 py-3 hover:bg-accent/50 transition-colors group"
                            onClick={() => setIsSearchFocused(false)}
                          >
                            <div>
                              <div className="font-bold text-foreground group-hover:text-primary transition-colors">{item.symbol}</div>
                              <div className="text-xs text-muted-foreground">{item.name}</div>
                            </div>
                            <div className="text-xs font-medium text-muted-foreground uppercase">{item.currency}</div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <p className="text-sm text-muted-foreground">No results found for "{query}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Link href={user ? "/portfolio" : "/auth"}>
                  <Button size="lg" className="rounded-xl shadow-lg shadow-primary/25 px-6">
                    <BarChart2 className="w-4 h-4 mr-2" />
                    {user ? "Go to Portfolio" : "Get Started"}
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
                <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-primary" /> {user ? "Logged in" : "Sync across devices"}</span>
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
        <div className="w-full max-w-[1600px] mx-auto px-6 py-16">
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
            <Link href={user ? "/portfolio" : "/auth"}>
              <Button size="lg" className="rounded-xl shadow-lg shadow-primary/20 px-8">
                <Plus className="w-4 h-4 mr-2" /> {user ? "Manage Portfolio" : "Start Building Your Portfolio"}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Market Overview */}
      <div id="market-section" className="w-full max-w-[1600px] mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-display font-bold">Market Overview</h2>
          <span className="text-sm text-muted-foreground">{popularInstruments.length} assets</span>
        </div>

        {isLoadingPopular ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Loading popular instruments...</p>
          </div>
        ) : popularInstruments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularInstruments.map((ticker, i) => (
              <motion.div
                key={'id' in ticker ? ticker.id : ('symbol' in ticker ? ticker.symbol : ticker.price.symbol)}
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
            <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No data available</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Check back later for market updates.
            </p>
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
