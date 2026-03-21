import { useParams, Link } from "wouter";
import { MOCK_TICKERS, generateChartData } from "@/lib/mock-data";
import { useState, useMemo } from "react";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, TrendingUp, TrendingDown, Info, Activity, DollarSign, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TickerDetail() {
  const { symbol } = useParams();
  const { addPosition } = usePortfolio();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [shares, setShares] = useState("");
  const [avgPrice, setAvgPrice] = useState("");

  const ticker = useMemo(() => MOCK_TICKERS.find(t => t.symbol === symbol), [symbol]);
  
  const chartData = useMemo(() => {
    if (!ticker) return [];
    return generateChartData(ticker.price, 0.03, 30);
  }, [ticker]);

  if (!ticker) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold mb-4">Ticker not found</h2>
        <Link href="/" className="text-primary hover:underline flex items-center justify-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Search
        </Link>
      </div>
    );
  }

  const isPositive = ticker.change >= 0;
  const chartColor = isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))';

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
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
                <span className={`text-lg font-medium flex items-center gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
                  {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  {isPositive ? '+' : ''}{ticker.change.toFixed(2)} ({isPositive ? '+' : ''}{ticker.changePercent.toFixed(2)}%)
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Mock Market Data • Delayed</p>
            </div>
            
            <Button 
              size="lg" 
              className="w-full sm:w-auto font-semibold shadow-lg shadow-primary/20"
              onClick={openDialogWithCurrentPrice}
            >
              <Plus className="w-5 h-5 mr-2" />
              Add to Portfolio
            </Button>
          </div>

          {/* Chart */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 h-[400px] shadow-sm">
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
                  domain={['dataMin - 10', 'auto']} 
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

          {/* About */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" /> About {ticker.name}
            </h3>
            <p className="text-muted-foreground leading-relaxed text-lg">
              {ticker.about}
            </p>
          </div>
        </div>

        {/* Sidebar - Right Side (1 col) */}
        <div className="space-y-6">
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Key Statistics
            </h3>
            <div className="space-y-4">
              <StatRow label="Market Cap" value={ticker.marketCap} icon={DollarSign} />
              <StatRow label="Volume" value={ticker.volume} icon={BarChart3} />
              <StatRow label="P/E Ratio" value={ticker.peRatio > 0 ? ticker.peRatio.toFixed(2) : 'N/A'} />
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
