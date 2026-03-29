import { Link } from "wouter";
import { TrendingUp, TrendingDown } from "lucide-react";

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

export interface InstrumentMostPopularDto {
  name: string;
  price: {
    symbol: string;
    price: number;
    currency: string;
    todayChange: {
      label?: string;
      value: string;
      change?: string;
      isPositive?: boolean;
    };
  };
  isDataComplete: boolean;
}

export interface InstrumentDto {
  id: string;
  symbol: string;
  name: string;
  currency: string;
}

export function TickerCard({ ticker }: { ticker: TickerData | InstrumentMostPopularDto | InstrumentDto }) {
  const isDto = 'isDataComplete' in ticker;
  const isSearchDto = 'id' in ticker && !isDto;
  
  const symbol = isSearchDto ? ticker.symbol : (isDto ? (ticker.price?.symbol ?? ticker.name) : ticker.symbol);
  const name = ticker.name;
  const price = isSearchDto ? 0 : (isDto ? (ticker.price?.price ?? 0) : (ticker as any).price ?? 0);
  const isPositive = isSearchDto ? true : (isDto 
    ? (ticker.price?.todayChange?.isPositive ?? true)
    : (ticker as any).change >= 0);
  const changeLabel = isSearchDto ? (ticker as any).currency : (isDto 
    ? (ticker.price?.todayChange ? `${ticker.price.todayChange.value} (${ticker.price.todayChange.change ?? ''})` : '-')
    : `${isPositive ? '+' : ''}${(ticker as any).change?.toFixed(2) ?? '0.00'} (${isPositive ? '+' : ''}${(ticker as any).changePercent?.toFixed(2) ?? '0.00'}%)`);

  // Use id for navigation if available (e.g. from search), otherwise fall back to symbol
  const idOrSymbol = isSearchDto ? (ticker as any).id : symbol;
  const href = `/ticker/${idOrSymbol}`;

  return (
    <Link href={href} className="block group">
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
              {symbol}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
              {name}
            </p>
          </div>
          <div className={`p-2 rounded-lg ${isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </div>
        </div>

        <div className="flex items-end justify-between mt-6">
          <div>
            {!isSearchDto && (
              <div className="text-2xl font-bold font-display tracking-tight text-foreground">
                ${price.toFixed(2)}
              </div>
            )}
            <div className={`text-sm font-medium mt-1 flex items-center gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {changeLabel}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
