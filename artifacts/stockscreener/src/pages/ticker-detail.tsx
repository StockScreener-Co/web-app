import { useParams, Link, useLocation } from "wouter";
import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLastPortfolio } from "@/hooks/use-last-portfolio";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, TrendingUp, TrendingDown, Activity, DollarSign, Loader2, BookmarkPlus, Building2, Users, MapPin, Newspaper, ExternalLink, Phone, Globe, Landmark, BriefcaseBusiness } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AddToWatchlistDialog } from "@/components/add-to-watchlist-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateTransaction,
  useSearchInstruments,
  useGetInstrumentById,
  useGetNewsForInstrument,
  useGetPriceChartForInstrument,
  useGetInstrumentProfile,
  ChartPeriod,
} from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import type { OperationType } from "@/lib/api-client";

// Safe number formatter — никогда не крашится
function safeFixed(value: number | undefined | null, digits = 2): string {
  if (value == null || isNaN(value)) return "N/A";
  return value.toFixed(digits);
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
  const [activeTab, setActiveTab] = useState<'overview' | 'profile'>('overview');
  const [isWatchlistDialogOpen, setIsWatchlistDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(ChartPeriod.ONE_MONTH);

  const createTransaction = useCreateTransaction();

  const isUuid = !!idOrSymbol && idOrSymbol.includes("-");

  const { data: searchResults, isLoading: isSearchLoading } = useSearchInstruments(
    { query: idOrSymbol ?? "", limit: 1 },
    { query: { enabled: !!idOrSymbol && !isUuid, queryKey: ["/api/v1/instruments/search", idOrSymbol] } }
  );

  const instrumentId: string | undefined = isUuid
    ? idOrSymbol
    : searchResults?.find(
        (r) => r.symbol.toUpperCase() === idOrSymbol?.toUpperCase()
      )?.id;

  const { data: instrumentData, isLoading: isInstrumentLoading } = useGetInstrumentById(
    instrumentId ?? "",
    { query: { enabled: !!instrumentId, queryKey: ["/api/v1/instruments", instrumentId] } }
  );

  const { data: newsData, isLoading: isNewsLoading } = useGetNewsForInstrument(
    instrumentId ?? "",
    { query: { enabled: !!instrumentId, queryKey: ["/api/v1/news/instrument", instrumentId] } }
  );

  const { data: chartHistory, isLoading: isChartLoading } = useGetPriceChartForInstrument(
    instrumentId ?? "",
    { period: selectedPeriod as any },
    { query: { enabled: !!instrumentId, queryKey: ["/api/v1/prices/price-chart/instrument", instrumentId, selectedPeriod] } }
  );

  const { data: companyProfile, isLoading: isProfileLoading } = useGetInstrumentProfile(
    instrumentId ?? "",
    { query: { enabled: !!instrumentId && activeTab === "profile", queryKey: ["/api/v1/instruments", instrumentId, "profile"] } }
  );

  const isLoading = isInstrumentLoading || (isSearchLoading && !isUuid);
  const news = newsData ?? [];

  const ticker = useMemo(() => {
    if (!instrumentData) return null;
    const keyStats = instrumentData.keyStats ?? {};
    const currPrice = instrumentData.currPrice;
    return {
      symbol: currPrice?.symbol ?? idOrSymbol?.toUpperCase() ?? "UNKNOWN",
      name: instrumentData.companyName ?? "Unknown Company",
      price: currPrice?.price ?? 0,
      change: currPrice?.todayChange?.value ?? 0,
      changePercent: currPrice?.todayChange?.ratio ?? 0,
      currency: currPrice?.currency ?? "USD",
      about: instrumentData.profile?.details?.description ?? "",
      marketCap: keyStats.marketCap?.toLocaleString() ?? "N/A",
      peRatio: keyStats.peTtmRatio ?? keyStats.peRatio ?? null,
      epsTtm: keyStats.epsTtm ?? null,
      week52High: keyStats.high52W ?? null,
      week52Low: keyStats.low52W ?? null,
      volume: keyStats.volume ?? null,
      dividendYield: keyStats.dividendYield ?? null,
      beta: keyStats.beta ?? null,
      revenueTtm: keyStats.revenueTtm ?? null,
      netIncomeTtm: keyStats.netIncomeTtm ?? null,
    };
  }, [instrumentData, idOrSymbol]);

  const chartData = useMemo(() => {
    if (chartHistory?.points) {
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
          instrumentId: instrumentId ?? idOrSymbol!,
          quantity: numShares,
          price: numPrice,
          tradeDate,
          operationType,
        }
      });

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

  const isMarketDataReal = instrumentData && ticker.price > 0;

  const handleProfileTabClick = () => setActiveTab('profile');

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 py-8">
      <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to Search
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-display font-extrabold tracking-tight">{ticker.symbol}</h1>
                <span className="text-xl text-muted-foreground">{ticker.name}</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold tracking-tighter">${safeFixed(ticker.price)}</span>
                {ticker.price > 0 && (
                  <span className={`text-lg font-medium flex items-center gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
                    {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    {isPositive ? '+' : ''}{safeFixed(ticker.change)} ({isPositive ? '+' : ''}{safeFixed(ticker.changePercent)}%)
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {isMarketDataReal ? "Real-time Market Data" : "Mock Market Data • Delayed"}
              </p>

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
                  onClick={handleProfileTabClick}
                  className="rounded-full px-6"
                >
                  Profile
                </Button>
              </div>
            </div>

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
                className="font-semibold border-primary/20"
                onClick={() => setIsWatchlistDialogOpen(true)}
                disabled={!user || !instrumentId}
              >
                <BookmarkPlus className="w-5 h-5 mr-2" />
                Add to Watchlist
              </Button>
            </div>
          </div>

          {activeTab === 'overview' ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
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

                <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm self-stretch">
                  <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" /> Key Statistics
                  </h3>
                  <div className="space-y-4">
                    <StatRow label="Market Cap" value={ticker.marketCap} icon={DollarSign} />
                    <StatRow label="P/E Ratio" value={ticker.peRatio != null ? safeFixed(ticker.peRatio) : "N/A"} />
                    <StatRow label="EPS (TTM)" value={ticker.epsTtm != null ? `$${safeFixed(ticker.epsTtm)}` : "N/A"} />
                    <StatRow label="52W High" value={ticker.week52High != null ? `$${safeFixed(ticker.week52High)}` : "N/A"} />
                    <StatRow label="52W Low" value={ticker.week52Low != null ? `$${safeFixed(ticker.week52Low)}` : "N/A"} />
                    <StatRow label="Volume" value={ticker.volume != null ? ticker.volume.toLocaleString() : "N/A"} />
                    <StatRow label="Dividend Yield" value={ticker.dividendYield != null ? `${safeFixed(ticker.dividendYield)}%` : "N/A"} />
                    <StatRow label="Beta" value={ticker.beta != null ? safeFixed(ticker.beta) : "N/A"} />
                    <StatRow label="Revenue (TTM)" value={ticker.revenueTtm != null ? `$${(ticker.revenueTtm / 1e9).toFixed(2)}B` : "N/A"} />
                    <StatRow label="Net Income (TTM)" value={ticker.netIncomeTtm != null ? `$${(ticker.netIncomeTtm / 1e9).toFixed(2)}B` : "N/A"} />
                  </div>
                </div>
              </div>

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
                              {item.datetime ? new Date(item.datetime).toLocaleDateString() : ""}
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

              {isProfileLoading ? (
                <div className="flex flex-col items-center py-16 text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" />
                  <p>Loading profile...</p>
                </div>
              ) : !companyProfile ? (
                <div className="py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border/50">
                  <Building2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No profile data available for this instrument.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* 1. About — full width, at top */}
                  {companyProfile.description && (
                    <div>
                      <h4 className="font-bold text-lg mb-3">About</h4>
                      <p className="text-muted-foreground leading-relaxed">{companyProfile.description}</p>
                    </div>
                  )}

                  {/* 2. Company card — consolidated business + leadership */}
                  <div className="p-5 rounded-xl bg-muted/30 border border-border/50 space-y-3">
                    <h4 className="font-bold flex items-center gap-2">
                      <BriefcaseBusiness className="w-4 h-4 text-primary" /> Company
                    </h4>
                    {companyProfile.sector && <ProfileRow label="Sector" value={companyProfile.sector} />}
                    {companyProfile.industry && <ProfileRow label="Industry" value={companyProfile.industry} />}
                    {companyProfile.type && <ProfileRow label="Type" value={companyProfile.type} />}
                    {companyProfile.exchange && <ProfileRow label="Exchange" value={companyProfile.exchange} />}
                    {companyProfile.ceo && <ProfileRow label="CEO" value={companyProfile.ceo} />}
                    {companyProfile.employees != null && companyProfile.employees > 0 && (
                      <ProfileRow label="Employees" value={companyProfile.employees.toLocaleString()} />
                    )}
                  </div>

                  {/* 3. Location + Contact grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 rounded-xl bg-muted/30 border border-border/50 space-y-3">
                      <h4 className="font-bold flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" /> Location
                      </h4>
                      {companyProfile.address && <ProfileRow label="Address" value={companyProfile.address} />}
                      {companyProfile.address2 && <ProfileRow label="" value={companyProfile.address2} />}
                      {companyProfile.city && <ProfileRow label="City" value={companyProfile.city} />}
                      {companyProfile.state && <ProfileRow label="State" value={companyProfile.state} />}
                      {companyProfile.zip && <ProfileRow label="ZIP" value={companyProfile.zip} />}
                      {companyProfile.country && <ProfileRow label="Country" value={companyProfile.country} />}
                    </div>

                    <div className="p-5 rounded-xl bg-muted/30 border border-border/50 space-y-3">
                      <h4 className="font-bold flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-primary" /> Contact
                      </h4>
                      {companyProfile.phone && (
                        <div className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                          <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 opacity-50" /> Phone
                          </span>
                          <span className="font-medium text-sm">{companyProfile.phone}</span>
                        </div>
                      )}
                      {companyProfile.website && (
                        <div className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                          <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5 opacity-50" /> Website
                          </span>
                          <a
                            href={companyProfile.website.startsWith('http') ? companyProfile.website : `https://${companyProfile.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            {companyProfile.website.replace(/^https?:\/\//, '')}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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

      {instrumentId && ticker && (
        <AddToWatchlistDialog
          open={isWatchlistDialogOpen}
          onOpenChange={setIsWatchlistDialogOpen}
          instrumentId={instrumentId}
          symbol={ticker.symbol}
        />
      )}
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
      <span className={`font-medium text-sm ${!label ? "text-muted-foreground" : "text-foreground"}`}>{value}</span>
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