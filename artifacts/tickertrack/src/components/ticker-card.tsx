import { TickerData } from "@/lib/mock-data";
import { Link } from "wouter";
import { TrendingUp, TrendingDown } from "lucide-react";

export function TickerCard({ ticker }: { ticker: TickerData }) {
  const isPositive = ticker.change >= 0;

  return (
    <Link href={`/ticker/${ticker.symbol}`} className="block group">
      <div className="
        h-full bg-card rounded-2xl p-6
        border border-border/50
        shadow-sm shadow-black/5
        transition-all duration-300 ease-out
        hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-1
      ">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-display font-bold text-xl text-foreground group-hover:text-primary transition-colors">
              {ticker.symbol}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
              {ticker.name}
            </p>
          </div>
          <div className={`p-2 rounded-lg ${isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </div>
        </div>

        <div className="flex items-end justify-between mt-6">
          <div>
            <div className="text-2xl font-bold font-display tracking-tight text-foreground">
              ${ticker.price.toFixed(2)}
            </div>
            <div className={`text-sm font-medium mt-1 flex items-center gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? '+' : ''}{ticker.change.toFixed(2)} ({isPositive ? '+' : ''}{ticker.changePercent.toFixed(2)}%)
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
