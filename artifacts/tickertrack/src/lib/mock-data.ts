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

export const MOCK_TICKERS: TickerData[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 175.43,
    change: 4.35,
    changePercent: 2.54,
    marketCap: "2.8T",
    peRatio: 28.5,
    week52High: 198.23,
    week52Low: 143.90,
    about: "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide."
  },
  {
    symbol: "TSLA",
    name: "Tesla, Inc.",
    price: 248.15,
    change: -3.12,
    changePercent: -1.23,
    marketCap: "780B",
    peRatio: 45.2,
    week52High: 299.29,
    week52Low: 152.37,
    about: "Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems."
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    price: 785.42,
    change: 26.15,
    changePercent: 3.45,
    marketCap: "1.9T",
    peRatio: 65.8,
    week52High: 823.94,
    week52Low: 204.21,
    about: "NVIDIA Corporation provides graphics, and compute and networking solutions in the United States, Taiwan, China, and internationally."
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    price: 378.85,
    change: 2.51,
    changePercent: 0.67,
    marketCap: "2.9T",
    peRatio: 35.1,
    week52High: 384.30,
    week52Low: 245.61,
    about: "Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide."
  },
  {
    symbol: "AMZN",
    name: "Amazon.com, Inc.",
    price: 152.34,
    change: -1.00,
    changePercent: -0.65,
    marketCap: "1.6T",
    peRatio: 41.2,
    week52High: 155.63,
    week52Low: 88.12,
    about: "Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions through online and physical stores in North America and internationally."
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    price: 140.20,
    change: 1.55,
    changePercent: 1.12,
    marketCap: "1.8T",
    peRatio: 24.3,
    week52High: 141.22,
    week52Low: 88.58,
    about: "Alphabet Inc. offers various products and platforms in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America."
  },
  {
    symbol: "META",
    name: "Meta Platforms, Inc.",
    price: 505.30,
    change: 14.18,
    changePercent: 2.89,
    marketCap: "1.3T",
    peRatio: 31.7,
    week52High: 512.20,
    week52Low: 167.66,
    about: "Meta Platforms, Inc. engages in the development of products that enable people to connect and share with friends and family through mobile devices, personal computers, virtual reality headsets, and wearables."
  },
  {
    symbol: "SPY",
    name: "SPDR S&P 500 ETF Trust",
    price: 502.10,
    change: 1.70,
    changePercent: 0.34,
    marketCap: "480B",
    peRatio: 0,
    week52High: 503.50,
    week52Low: 380.65,
    about: "The Trust seeks to provide investment results that, before expenses, correspond generally to the price and yield performance of the S&P 500 Index."
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    price: 64230.50,
    change: 1250.20,
    changePercent: 1.98,
    marketCap: "1.2T",
    peRatio: 0,
    week52High: 69000.00,
    week52Low: 25000.00,
    about: "Bitcoin is a decentralized digital currency, without a central bank or single administrator, that can be sent from user to user on the peer-to-peer bitcoin network without the need for intermediaries."
  }
];

export function generateChartData(startPrice: number, volatility: number = 0.02, days: number = 30) {
  const data = [];
  let currentPrice = startPrice * (1 - (volatility * days / 2)); // Start a bit lower generally to trend towards current
  
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Add random walk
    const change = currentPrice * volatility * (Math.random() - 0.45);
    currentPrice += change;
    
    // Ensure final point matches exactly
    if (i === 0) currentPrice = startPrice;
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: Number(currentPrice.toFixed(2))
    });
  }
  
  return data;
}

export function searchTickers(query: string): TickerData[] {
  if (!query) return [];
  const q = query.toLowerCase();
  return MOCK_TICKERS.filter(
    t => t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
  );
}
