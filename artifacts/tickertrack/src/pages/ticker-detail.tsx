import { useParams, Link, useLocation } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLastPortfolio } from "@/hooks/use-last-portfolio";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, TrendingUp, TrendingDown, Activity, DollarSign, Loader2, BookmarkPlus, Calendar, Info, Building2, Briefcase, Users, MapPin, Newspaper, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { customFetch, useCreateTransaction } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import type { OperationType } from "@/lib/api-client";

export interface TickerData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: string;
  peRatio: number;
  week52High: number;
  week52Low: number;
  about: string;
}

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

interface NewsDto {
  id: string;
  datetime: string;
  headline: string;
  source: string;
  url: string;
  image: string;
}

export default function TickerDetail() {
  const { idOrSymbol } = useParams();
  const { user } = useAuth();
  const { lastPortfolioId } = useLastPortfolio();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [shares, setShares] = useState("");
  const [avgPrice, setAvgPrice] = useState("");
  const [tradeDate, setTradeDate] = useState(new Date().toISOString().split('T')[0]);
  const [operationType, setOperationType] = useState<OperationType>("BUY");
  
  const [tickerApiData, setTickerApiData] = useState<TickerPageView | null>(null);
  const [priceData, setPriceData] = useState<CurrentPriceResponseDto | null>(null);
  const [news, setNews] = useState<NewsDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'profile'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<ChartPeriod>(ChartPeriod.ONE_MONTH);
  const [chartHistory, setChartHistory] = useState<PriceHistoryChartResponse | null>(null);
  const [isChartLoading, setIsChartLoading] = useState(false);

  const createTransaction = useCreateTransaction();

  useEffect(() => {
    // Check if it looks like a UUID (approximate check)
    const isUuid = idOrSymbol?.includes("-");
    
    if (isUuid) {
      setIsLoading(true);
      setIsPriceLoading(true);
      
      customFetch<TickerPageView>(`/api/v1/instruments/${idOrSymbol}`)
        .then(data => {
          setTickerApiData(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch ticker details:", err);
          setIsLoading(false);
        });

      customFetch<CurrentPriceResponseDto>(`/api/v1/prices/now/instrument/${idOrSymbol}`)
        .then(data => {
          setPriceData(data);
          setIsPriceLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch ticker price:", err);
          setIsPriceLoading(false);
        });

      setIsNewsLoading(true);
      customFetch<NewsDto[]>(`/api/v1/news/instrument/${idOrSymbol}`)
        .then(data => {
          setNews(data);
          setIsNewsLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch news:", err);
          setIsNewsLoading(false);
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
      customFetch<PriceHistoryChartResponse>(`/api/v1/prices/price-chart/instrument/${idOrSymbol}?period=${selectedPeriod}`)
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
    if (tickerApiData && tickerApiData.profile) {
      return {
        symbol: priceData?.symbol || tickerApiData.profile.name?.split(' ')[0].toUpperCase() || "UNKNOWN",
        name: tickerApiData.profile.name || "Unknown Company",
        price: priceData?.price || 0,
        change: priceData?.todayChange?.value || 0,
        changePercent: priceData?.todayChange?.ratio || 0,
        currency: priceData?.currency || "USD",
        about: tickerApiData.profile.details?.description || "",
        marketCap: tickerApiData.keyStats?.marketCap?.toLocaleString() || "N/A",
        peRatio: tickerApiData.keyStats?.peRatio || 0,
        week52High: tickerApiData.keyStats?.High52W || 0,
        week52Low: tickerApiData.keyStats?.Low52W || 0,
      };
    }
    return null;
  }, [tickerApiData, priceData]);
  
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
    return [];
  }, [chartHistory, selectedPeriod]);

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

  const handleAddPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add positions to your portfolio.",
        variant: "destructive"
      });
      setLocation("/auth");
      return;
    }

    if (!lastPortfolioId) {
      toast({
        title: "No portfolio selected",
        description: "Please create a portfolio first.",
        variant: "destructive"
      });
      setLocation("/portfolios");
      return;
    }

    const numShares = parseFloat(shares);
    const numPrice = parseFloat(avgPrice);

    if (isNaN(numShares) || numShares <= 0 || isNaN(numPrice) || numPrice < 0) {
      toast({
        title: "Invalid input",
        description: "Please enter valid numbers for shares and price.",
        variant: "destructive"
      });
      return;
    }

    try {
      await createTransaction.mutateAsync({
        portfolioId: lastPortfolioId,
        data: {
          instrumentId: tickerApiData?.instrumentId || idOrSymbol!,
          quantity: numShares,
          price: numPrice,
          tradeDate,
          operationType,
        }
      });

      // Refresh portfolio data in cache if it exists
      queryClient.invalidateQueries({ queryKey: ["/api/v1/portfolios", lastPortfolioId] });

      setIsDialogOpen(false);
      setShares("");
      setAvgPrice("");
      setTradeDate(new Date().toISOString().split('T')[0]);
      setOperationType("BUY");

      toast({
        title: "Position Added",
        description: `Successfully added ${numShares} shares of ${ticker.symbol} to your portfolio.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to add position. Please try again.",
        variant: "destructive"
      });
    }
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
        <div className="lg:col-span-3 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
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

              {/* Navigation Tabs */}
              <div className="flex gap-2 mt-6">
                <Button 
                  variant={activeTab === 'overview' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab('overview')}
                  className="rounded-full px-6"
                >
                  Overview
                </Button>
                <Button 
                  variant={activeTab === 'profile' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab('profile')}
                  className="rounded-full px-6"
                >
                  Profile
                </Button>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-3 self-start md:self-center">
              <Button 
                size="lg" 
                className="font-semibold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
                onClick={openDialogWithCurrentPrice}
              >
                <Plus className="w-5 h-5 mr-2" />
                Add to Portfolio
              </Button>
              <Button 
                variant="outline"
                size="lg" 
                className="font-semibold border-primary/20 hover:bg-primary/5 hover:text-primary transition-all"
                onClick={() => toast({ title: "Coming Soon", description: "Watchlist feature is under development." })}
              >
                <BookmarkPlus className="w-5 h-5 mr-2" />
                Add to Watchlist
              </Button>
            </div>
          </div>

          {activeTab === 'overview' ? (
            <div className="space-y-8">
              {/* Chart and Key Stats row */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                {/* Chart - Left (2 cols on xl) */}
                <div className="xl:col-span-2 bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
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

                {/* Key Statistics - Right (1 col on xl) */}
                <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm self-stretch">
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

              {/* News */}
              <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-primary" /> Latest News
                </h3>
                
                {isNewsLoading ? (
                  <div className="flex flex-col items-center py-12 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                    <p>Loading news...</p>
                  </div>
                ) : news.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {news.map((item) => (
                      <a 
                        key={item.id} 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group flex flex-col sm:flex-row gap-4 p-4 rounded-xl hover:bg-muted/30 transition-colors border border-transparent hover:border-border/50"
                      >
                        {item.image && (
                          <div className="w-full sm:w-32 h-24 rounded-lg overflow-hidden flex-shrink-0">
                            <img 
                              src={item.image} 
                              alt={item.headline} 
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                          </div>
                        )}
                        <div className="flex flex-col flex-grow">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
                              {item.source}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.datetime).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="font-bold text-lg leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                            {item.headline}
                          </h4>
                          <div className="mt-auto flex items-center text-xs text-primary font-medium">
                            Read more <ExternalLink className="w-3 h-3 ml-1" />
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border/50">
                    <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No news available for this ticker at the moment.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
        <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-sm">
          <h3 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" /> Company Profile
          </h3>
          <div className="space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              This section will display detailed company information, including history, executive team, and financial health.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" /> Core Business
                </h4>
                <p className="text-sm text-muted-foreground">Detailed business operations data will be available soon.</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" /> Leadership
                </h4>
                <p className="text-sm text-muted-foreground">Executive team profiles and organizational structure details.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No sidebar - content is full width with internal grid */}
      <div className="hidden">
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
                value={tickerApiData?.keyStats?.epsTtm !== undefined ? `$${tickerApiData.keyStats.epsTtm.toFixed(2)}` : 'N/A'} 
              />
              <StatRow label="52W High" value={`$${ticker.week52High.toFixed(2)}`} />
              <StatRow label="52W Low" value={`$${ticker.week52Low.toFixed(2)}`} />
            </div>
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
                <Label htmlFor="tradeDate">Trade Date</Label>
                <Input
                  id="tradeDate"
                  type="date"
                  value={tradeDate}
                  onChange={(e) => setTradeDate(e.target.value)}
                  className="h-10 bg-background"
                />
              </div>
              
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
              <Button 
                type="submit" 
                className="font-semibold shadow-md shadow-primary/20"
                disabled={createTransaction.isPending}
              >
                {createTransaction.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
