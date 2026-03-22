import { useParams, Link } from "wouter";
import { MOCK_TICKERS, generateChartData } from "@/lib/mock-data";
import { useState, useMemo, useEffect } from "react";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, TrendingUp, TrendingDown, Info, Activity, DollarSign, Loader2, Calendar, MapPin, Users, Briefcase, Building2, BookmarkPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MetricCard {
  value: number;
  ratio: number;
  trend: "UP" | "DOWN" | "FLAT";
}

enum ChartPeriod {
  ONE_DAY = "ONE_DAY",
  FIVE_DAYS = "FIVE_DAYS",
  ONE_MONTH = "ONE_MONTH",
  YTD = "YTD",
  THREE_MONTHS = "THREE_MONTHS",
  SIX_MONTHS = "SIX_MONTHS",
  ONE_YEAR = "ONE_YEAR",
  FIVE_YEARS = "FIVE_YEARS",
  ALL = "ALL"
}

enum ChartInterval {
  ONE_MINUTE = "ONE_MINUTE",
  TEN_MINUTES = "TEN_MINUTES",
  ONE_DAY = "ONE_DAY",
  ONE_WEEK = "ONE_WEEK"
}

interface ChartPointDto {
  timestamp: string;
  price: number;
}

interface PriceHistoryChartResponse {
  symbol: string;
  currency: string;
  period: ChartPeriod;
  interval: ChartInterval;
  points: ChartPointDto[];
}

interface CurrentPriceResponseDto {
  symbol: string;
  price: number;
  currency: string;
  todayChange: MetricCard;
}

interface TickerPageView {
  instrumentId: string;
  profile: {
    name: string;
    founded: string;
    sector: string;
    industry: string;
    employeesNumber: string;
    ceoFullName: string;
    details: { description: string };
  };
  keyStats: {
    marketCap: number;
    peRatio: number;
    epsTtm: number;
    High52W: number;
    Low52W: number;
  };
}

export default function TickerDetail() {
  const { idOrSymbol } = useParams();
  const { addPosition } = usePortfolio();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [shares, setShares] = useState("");
  const [avgPrice, setAvgPrice] = useState("");
  const [tickerApiData, setTickerApiData] = useState<TickerPageView | null>(null);
  const [priceData, setPriceData] = useState<CurrentPriceResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<ChartPeriod>(ChartPeriod.ONE_MONTH);
  const [chartHistory, setChartHistory] = useState<PriceHistoryChartResponse | null>(null);
  const [isChartLoading, setIsChartLoading] = useState(false);

  useEffect(() => {
    // Check if it looks like a UUID (approximate check)
    const isUuid = idOrSymbol?.includes("-");
    
    if (isUuid) {
      setIsLoading(true);
      setIsPriceLoading(true);
      
      fetch(`/api/v1/instruments/${idOrSymbol}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          setTickerApiData(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch ticker details:", err);
          setIsLoading(false);
        });

      fetch(`/api/v1/prices/now/instrument/${idOrSymbol}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          setPriceData(data);
          setIsPriceLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch ticker price:", err);
          setIsPriceLoading(false);
        });
    } else {
      setTickerApiData(null);
      setPriceData(null);
    }
  }, [idOrSymbol]);

  useEffect(() => {
    const isUuid = idOrSymbol?.includes("-");
    if (isUuid) {
      setIsChartLoading(true);
      fetch(`/api/v1/prices/price-chart/instrument/${idOrSymbol}?period=${selectedPeriod}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          setChartHistory(data);
          setIsChartLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch chart history:", err);
          setIsChartLoading(false);
        });
    } else {
      setChartHistory(null);
    }
  }, [idOrSymbol, selectedPeriod]);

  const ticker = useMemo(() => {
    if (tickerApiData) {
      const mockMatch = MOCK_TICKERS.find(t => t.name === tickerApiData.profile.name);
      
      return {
        symbol: priceData?.symbol || mockMatch?.symbol || tickerApiData.profile.name.split(' ')[0].toUpperCase(),
        name: tickerApiData.profile.name,
        price: priceData?.price || mockMatch?.price || 0,
        change: priceData?.todayChange?.value || mockMatch?.change || 0,
        changePercent: priceData?.todayChange?.ratio || mockMatch?.changePercent || 0,
        currency: priceData?.currency || "USD",
        about: tickerApiData.profile.details.description,
        marketCap: tickerApiData.keyStats.marketCap.toLocaleString(),
        peRatio: tickerApiData.keyStats.peRatio,
        week52High: tickerApiData.keyStats.High52W,
        week52Low: tickerApiData.keyStats.Low52W,
      };
    }
    return MOCK_TICKERS.find(t => t.symbol === idOrSymbol);
  }, [idOrSymbol, tickerApiData, priceData]);
  
  const chartData = useMemo(() => {
    if (chartHistory && chartHistory.points) {
      return chartHistory.points.map(point => ({
        date: new Date(point.timestamp).toLocaleDateString(undefined, { 
          month: 'short', 
          day: 'numeric',
          hour: selectedPeriod === ChartPeriod.ONE_DAY ? '2-digit' : undefined,
          minute: selectedPeriod === ChartPeriod.ONE_DAY ? '2-digit' : undefined
        }),
        price: point.price,
        fullTimestamp: point.timestamp
      }));
    }
    if (!ticker || ticker.price === 0) return [];
    return generateChartData(ticker.price, 0.03, 30);
  }, [ticker, chartHistory, selectedPeriod]);

  if (isLoading) {
    return (
      <div className="w-full max-w-[1600px] mx-auto px-6 py-48 text-center flex flex-col items-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-xl text-muted-foreground">Loading ticker details...</p>
      </div>
    );
  }

  if (!ticker) {
    return (
      <div className="w-full max-w-[1600px] mx-auto px-6 py-24 text-center">
        <h2 className="text-2xl font-bold mb-4">Ticker not found</h2>
        <Link href="/" className="text-primary hover:underline flex items-center justify-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Search
        </Link>
      </div>
    );
  }

  const isPositive = ticker.change >= 0;
  const chartColor = ticker.price > 0 ? (isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))') : 'hsl(var(--primary))';

  const handleAddPosition = (e: React.FormEvent) => {
    e.preventDefault();
    const numShares = parseFloat(shares);
    const numPrice = parseFloat(avgPrice);

    if (isNaN(numShares) || numShares <= 0 || isNaN(numPrice) || numPrice <= 0) {
      toast({
        title: "Invalid input",
        description: "Please enter valid numbers for shares and price.",
        variant: "destructive"
      });
      return;
    }

    addPosition(ticker.symbol, numShares, numPrice);
    setIsDialogOpen(false);
    setShares("");
    setAvgPrice("");
    toast({
      title: "Position Added",
      description: `Successfully added ${numShares} shares of ${ticker.symbol} to your portfolio.`,
    });
  };

  const openDialogWithCurrentPrice = () => {
    setAvgPrice(ticker.price.toString());
    setIsDialogOpen(true);
  };

  const isMarketDataReal = tickerApiData && ticker.price > 0;

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 py-8">
      <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to Search
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Left Side (2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-display font-extrabold tracking-tight">{ticker.symbol}</h1>
                <span className="text-xl text-muted-foreground">{ticker.name}</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold tracking-tighter">${ticker.price.toFixed(2)}</span>
                {ticker.price > 0 && (
                  <span className={`text-lg font-medium flex items-center gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
                    {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    {isPositive ? '+' : ''}{ticker.change.toFixed(2)} ({isPositive ? '+' : ''}{ticker.changePercent.toFixed(2)}%)
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {isMarketDataReal ? "Real-time Market Data" : "Mock Market Data • Delayed"}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> Price Chart
              </h3>
              <div className="flex bg-muted/50 p-1 rounded-lg overflow-x-auto no-scrollbar">
                {(Object.keys(ChartPeriod) as Array<keyof typeof ChartPeriod>).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(ChartPeriod[period])}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                      selectedPeriod === ChartPeriod[period]
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {period === "ONE_DAY" ? "1D" :
                     period === "FIVE_DAYS" ? "5D" :
                     period === "ONE_MONTH" ? "1M" :
                     period === "THREE_MONTHS" ? "3M" :
                     period === "SIX_MONTHS" ? "6M" :
                     period === "YTD" ? "YTD" :
                     period === "ONE_YEAR" ? "1Y" :
                     period === "FIVE_YEARS" ? "5Y" : "ALL"}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[350px] relative">
              {isChartLoading && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={30}
                  />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '0.75rem',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      color: 'hsl(var(--foreground))'
                    }}
                    itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke={chartColor} 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: chartColor, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* About */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" /> About {ticker.name}
            </h3>
            <p className="text-muted-foreground leading-relaxed text-lg mb-6">
              {ticker.about}
            </p>

            {tickerApiData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Founded</p>
                    <p className="font-medium">{tickerApiData.profile.founded}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Sector</p>
                    <p className="font-medium">{tickerApiData.profile.sector}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Industry</p>
                    <p className="font-medium">{tickerApiData.profile.industry}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Employees</p>
                    <p className="font-medium">{tickerApiData.profile.employeesNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">CEO</p>
                    <p className="font-medium">{tickerApiData.profile.ceoFullName}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Right Side (1 col) */}
        <div className="space-y-6">
          {/* Action Card */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm ring-1 ring-primary/5">
            <h3 className="text-lg font-display font-bold mb-4">Actions</h3>
            <div className="flex flex-col gap-3">
              <Button 
                size="lg" 
                className="w-full font-semibold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
                onClick={openDialogWithCurrentPrice}
              >
                <Plus className="w-5 h-5 mr-2" />
                Add to Portfolio
              </Button>
              <Button 
                variant="outline"
                size="lg" 
                className="w-full font-semibold border-primary/20 hover:bg-primary/5 hover:text-primary transition-all"
                onClick={() => toast({ title: "Coming Soon", description: "Watchlist feature is under development." })}
              >
                <BookmarkPlus className="w-5 h-5 mr-2" />
                Add to Watchlist
              </Button>
            </div>
            <p className="text-[10px] text-center text-muted-foreground mt-4 leading-relaxed">
              Track your investments and get real-time alerts by adding this ticker to your portfolio.
            </p>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Key Statistics
            </h3>
            <div className="space-y-4">
              <StatRow label="Market Cap" value={ticker.marketCap} icon={DollarSign} />
              <StatRow 
                label="P/E Ratio" 
                value={ticker.peRatio !== undefined ? (typeof ticker.peRatio === 'number' ? ticker.peRatio.toFixed(2) : ticker.peRatio) : 'N/A'} 
              />
              <StatRow 
                label="EPS (TTM)" 
                value={tickerApiData ? `$${tickerApiData.keyStats.epsTtm.toFixed(2)}` : 'N/A'} 
              />
              <StatRow label="52W High" value={`$${ticker.week52High.toFixed(2)}`} />
              <StatRow label="52W Low" value={`$${ticker.week52Low.toFixed(2)}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Add Position Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add {ticker.symbol} to Portfolio</DialogTitle>
            <DialogDescription>
              Record your purchase of {ticker.name} to start tracking it.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddPosition}>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="shares">Number of Shares</Label>
                <Input
                  id="shares"
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="e.g. 10.5"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  className="h-12 text-lg bg-background"
                  autoFocus
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Average Cost Per Share ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 150.25"
                  value={avgPrice}
                  onChange={(e) => setAvgPrice(e.target.value)}
                  className="h-12 text-lg bg-background"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="font-semibold shadow-md shadow-primary/20">
                Save Position
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatRow({ label, value, icon: Icon }: { label: string, value: string | number, icon?: React.ElementType }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
      <span className="text-muted-foreground flex items-center gap-2 text-sm">
        {Icon && <Icon className="w-4 h-4 opacity-50" />}
        {label}
      </span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
