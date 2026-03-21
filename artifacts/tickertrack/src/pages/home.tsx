import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MOCK_TICKERS, searchTickers } from "@/lib/mock-data";
import { TickerCard } from "@/components/ticker-card";
import { motion } from "framer-motion";

export default function Home() {
  const [query, setQuery] = useState("");
  
  const results = useMemo(() => {
    if (!query) return MOCK_TICKERS.slice(0, 8); // Show popular by default
    return searchTickers(query);
  }, [query]);

  const popularTags = ["AAPL", "TSLA", "NVDA", "BTC", "SPY"];

  return (
    <div className="flex-1 w-full">
      {/* Hero Section */}
      <div className="relative py-24 lg:py-32 overflow-hidden border-b border-border/40">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Abstract dark finance background" 
            className="w-full h-full object-cover opacity-60 mix-blend-screen"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-extrabold tracking-tight text-foreground mb-6">
              Track your portfolio. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-300">
                Find your edge.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Real-time mock data, beautiful charts, and seamless portfolio tracking without the clutter.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative max-w-2xl mx-auto"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:bg-primary/30 transition-all duration-300 opacity-50" />
              <div className="relative flex items-center bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all">
                <Search className="w-6 h-6 text-muted-foreground ml-4" />
                <Input 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for a ticker (e.g. AAPL, BTC, SPY)..."
                  className="w-full border-0 bg-transparent text-lg py-6 px-4 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60 h-16"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <span className="text-sm text-muted-foreground py-1.5 px-2">Trending:</span>
              {popularTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="px-4 py-1.5 rounded-full text-sm font-medium bg-secondary text-secondary-foreground border border-border hover:border-primary hover:text-primary transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Results Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-display font-bold">
            {query ? `Search Results for "${query}"` : "Market Overview"}
          </h2>
          <span className="text-sm text-muted-foreground">{results.length} assets</span>
        </div>

        {results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {results.map((ticker, i) => (
              <motion.div
                key={ticker.symbol}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <TickerCard ticker={ticker} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-card/50 rounded-3xl border border-border/50 border-dashed">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No tickers found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              We couldn't find any assets matching "{query}". Try searching for popular symbols like AAPL, MSFT, or BTC.
            </p>
            <button 
              onClick={() => setQuery("")}
              className="mt-6 text-primary hover:underline font-medium"
            >
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
