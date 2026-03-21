import { usePortfolio } from "@/hooks/use-portfolio";
import { Link } from "wouter";
import { Briefcase, ArrowUpRight, ArrowDownRight, Search, Trash2, PieChart, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function Portfolio() {
  const { positions, stats, removePosition } = usePortfolio();

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  const formatPercent = (val: number) => `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;

  const isTotalPositive = stats.totalReturn >= 0;

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-display font-extrabold tracking-tight mb-2 flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-primary" /> Your Portfolio
          </h1>
          <p className="text-muted-foreground">Manage your holdings and track performance.</p>
        </div>
        <Link href="/">
          <Button className="shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> Add New Asset
          </Button>
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard 
          title="Total Value" 
          value={formatCurrency(stats.totalValue)} 
          icon={PieChart}
          subtitle={`${stats.positionCount} active positions`}
        />
        <StatCard 
          title="Total P&L" 
          value={formatCurrency(stats.totalReturn)} 
          valueClass={isTotalPositive ? 'text-success' : 'text-destructive'}
          icon={isTotalPositive ? ArrowUpRight : ArrowDownRight}
          subtitle="All time return"
        />
        <StatCard 
          title="Return %" 
          value={formatPercent(stats.totalReturnPercent)} 
          valueClass={isTotalPositive ? 'text-success' : 'text-destructive'}
          icon={isTotalPositive ? ArrowUpRight : ArrowDownRight}
          subtitle="Relative to cost basis"
        />
      </div>

      {/* Holdings List */}
      <div>
        <h2 className="text-2xl font-display font-bold mb-6">Holdings</h2>
        
        {positions.length > 0 ? (
          <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-secondary/50 border-b border-border/50 text-sm font-medium text-muted-foreground">
                    <th className="p-4 pl-6 font-semibold">Asset</th>
                    <th className="p-4 font-semibold text-right">Price</th>
                    <th className="p-4 font-semibold text-right">Holdings</th>
                    <th className="p-4 font-semibold text-right">Total Value</th>
                    <th className="p-4 font-semibold text-right">Return</th>
                    <th className="p-4 pr-6 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {positions.map((pos, i) => {
                    const isPosReturn = pos.totalReturn >= 0;
                    return (
                      <motion.tr 
                        key={pos.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="hover:bg-accent/30 transition-colors group"
                      >
                        <td className="p-4 pl-6">
                          <Link href={`/ticker/${pos.symbol}`} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-sm">
                              {pos.symbol.substring(0,2)}
                            </div>
                            <div>
                              <div className="font-bold text-foreground hover:text-primary transition-colors">{pos.symbol}</div>
                              <div className="text-xs text-muted-foreground">{pos.name}</div>
                            </div>
                          </Link>
                        </td>
                        <td className="p-4 text-right">
                          <div className="font-semibold">{formatCurrency(pos.currentPrice)}</div>
                          <div className={`text-xs ${pos.dayChangePercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {pos.dayChangePercent >= 0 ? '+' : ''}{pos.dayChangePercent.toFixed(2)}% (1D)
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="font-semibold">{pos.shares.toFixed(4)}</div>
                          <div className="text-xs text-muted-foreground">Avg: {formatCurrency(pos.avgPrice)}</div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="font-semibold text-foreground">{formatCurrency(pos.currentValue)}</div>
                        </td>
                        <td className="p-4 text-right">
                          <div className={`font-semibold ${isPosReturn ? 'text-success' : 'text-destructive'}`}>
                            {formatCurrency(pos.totalReturn)}
                          </div>
                          <div className={`text-xs ${isPosReturn ? 'text-success' : 'text-destructive'}`}>
                            {formatPercent(pos.totalReturnPercent)}
                          </div>
                        </td>
                        <td className="p-4 pr-6 text-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                            onClick={() => removePosition(pos.id)}
                            title="Remove position"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-24 bg-card/30 rounded-3xl border border-border/50 border-dashed">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <Briefcase className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Your portfolio is empty</h3>
            <p className="text-muted-foreground max-w-md mx-auto text-lg mb-8">
              Start building your portfolio by searching for stocks, ETFs, or crypto assets to track.
            </p>
            <Link href="/">
              <Button size="lg" className="rounded-full shadow-lg shadow-primary/20 px-8">
                <Search className="w-5 h-5 mr-2" /> Explore Assets
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, valueClass = "text-foreground" }: any) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 text-primary/5 group-hover:text-primary/10 transition-colors">
        <Icon className="w-32 h-32" />
      </div>
      <div className="relative z-10">
        <h3 className="text-muted-foreground font-medium mb-2">{title}</h3>
        <div className={`text-4xl font-display font-extrabold tracking-tight mb-2 ${valueClass}`}>
          {value}
        </div>
        {subtitle && <p className="text-sm text-muted-foreground/80">{subtitle}</p>}
      </div>
    </div>
  );
}
