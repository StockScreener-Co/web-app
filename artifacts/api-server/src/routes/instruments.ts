import { Router, type IRouter } from "express";
import { GetMostPopularStocksResponse } from "@workspace/api-zod";

const router: IRouter = Router();

// --- Types from Issue Description ---

interface InstrumentDto {
  id: string;
  symbol: string;
  name: string;
  currency: string;
}

interface InstrumentKeyStatsDto {
  marketCap: number;
  peRatio: number;
  epsTtm: number; // Trailing Twelve Months
  High52W: number;
  Low52W: number;
}

interface InstrumentDetailsDto {
  description: string;
}

interface InstrumentProfileDto {
  name: string;
  founded: string;
  sector: string;
  industry: string;
  employeesNumber: string;
  ceoFullName: string;
  details: InstrumentDetailsDto;
}

interface TickerPageView {
  instrumentId: string;
  profile: InstrumentProfileDto;
  keyStats: InstrumentKeyStatsDto;
}

interface MetricCardDto {
  value: number;
  ratio: number;
  trend: "UP" | "DOWN" | "FLAT";
}

interface CurrentPriceResponseDto {
  symbol: string;
  price: number;
  currency: string;
  todayChange: MetricCardDto;
}

// --- Mock Data ---

const INSTRUMENTS: InstrumentDto[] = [
  { id: "550e8400-e29b-41d4-a716-446655440000", symbol: "AAPL", name: "Apple Inc.", currency: "USD" },
  { id: "550e8400-e29b-41d4-a716-446655440001", symbol: "MSFT", name: "Microsoft Corporation", currency: "USD" },
  { id: "550e8400-e29b-41d4-a716-446655440002", symbol: "NVDA", name: "NVIDIA Corporation", currency: "USD" },
  { id: "550e8400-e29b-41d4-a716-446655440003", symbol: "TSLA", name: "Tesla, Inc.", currency: "USD" },
  { id: "550e8400-e29b-41d4-a716-446655440004", symbol: "AMZN", name: "Amazon.com, Inc.", currency: "USD" },
];

const TICKER_PAGES: Record<string, TickerPageView> = {
  "550e8400-e29b-41d4-a716-446655440000": {
    instrumentId: "550e8400-e29b-41d4-a716-446655440000",
    profile: {
      name: "Apple Inc.",
      founded: "1976",
      sector: "Technology",
      industry: "Consumer Electronics",
      employeesNumber: "161,000",
      ceoFullName: "Tim Cook",
      details: { description: "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide." }
    },
    keyStats: {
      marketCap: 2.8e12,
      peRatio: 28.5,
      epsTtm: 6.42,
      High52W: 198.23,
      Low52W: 143.90,
    }
  },
  // Add others if needed...
};

// Existing mock data for popularity
const MOST_POPULAR_INSTRUMENTS = [
  {
    name: "Apple Inc.",
    price: {
      symbol: "AAPL",
      price: 187.32,
      currency: "USD",
      todayChange: {
        label: "Today",
        value: "+1.24",
        change: "+0.67%",
        isPositive: true,
      },
    },
    isDataComplete: true,
  },
  {
    name: "Microsoft Corporation",
    price: {
      symbol: "MSFT",
      price: 415.50,
      currency: "USD",
      todayChange: {
        label: "Today",
        value: "+2.15",
        change: "+0.52%",
        isPositive: true,
      },
    },
    isDataComplete: true,
  },
  {
    name: "NVIDIA Corporation",
    price: {
      symbol: "NVDA",
      price: 875.20,
      currency: "USD",
      todayChange: {
        label: "Today",
        value: "+15.40",
        change: "+1.79%",
        isPositive: true,
      },
    },
    isDataComplete: true,
  },
  {
    name: "Tesla, Inc.",
    price: {
      symbol: "TSLA",
      price: 175.43,
      currency: "USD",
      todayChange: {
        label: "Today",
        value: "-2.10",
        change: "-1.18%",
        isPositive: false,
      },
    },
    isDataComplete: true,
  },
];

const INSTRUMENT_PRICES: Record<string, CurrentPriceResponseDto> = {
  "550e8400-e29b-41d4-a716-446655440000": {
    symbol: "AAPL",
    price: 187.32,
    currency: "USD",
    todayChange: {
      value: 1.24,
      ratio: 0.67,
      trend: "UP"
    }
  },
  "550e8400-e29b-41d4-a716-446655440001": {
    symbol: "MSFT",
    price: 415.50,
    currency: "USD",
    todayChange: {
      value: 2.15,
      ratio: 0.52,
      trend: "UP"
    }
  },
  "550e8400-e29b-41d4-a716-446655440002": {
    symbol: "NVDA",
    price: 875.20,
    currency: "USD",
    todayChange: {
      value: 15.40,
      ratio: 1.79,
      trend: "UP"
    }
  },
  "550e8400-e29b-41d4-a716-446655440003": {
    symbol: "TSLA",
    price: 175.43,
    currency: "USD",
    todayChange: {
      value: -2.10,
      ratio: -1.18,
      trend: "DOWN"
    }
  },
};

router.get("/api/v1/prices/now/instrument/:instrumentId", (req, res) => {
  const { instrumentId } = req.params;
  const priceData = INSTRUMENT_PRICES[instrumentId];

  if (priceData) {
    res.json(priceData);
  } else {
    // Fallback for unknown instruments
    const inst = INSTRUMENTS.find(i => i.id === instrumentId);
    if (inst) {
      res.json({
        symbol: inst.symbol,
        price: 150.00,
        currency: inst.currency,
        todayChange: {
          value: 0.00,
          ratio: 0.00,
          trend: "FLAT"
        }
      });
    } else {
      res.status(404).json({ error: "Price not found for instrument" });
    }
  }
});

router.get("/api/v1/instruments/search", (req, res) => {
  const query = (req.query.query as string || "").toLowerCase();
  const limit = parseInt(req.query.limit as string || "10", 10);

  const results = INSTRUMENTS.filter(
    inst => inst.symbol.toLowerCase().includes(query) || inst.name.toLowerCase().includes(query)
  ).slice(0, limit);

  res.json(results);
});

router.get("/api/v1/instruments/:id", (req, res) => {
  const id = req.params.id;
  const page = TICKER_PAGES[id];

  if (page) {
    res.json(page);
  } else {
    // Fallback if not in TICKER_PAGES but in INSTRUMENTS
    const inst = INSTRUMENTS.find(i => i.id === id);
    if (inst) {
      res.json({
        instrumentId: inst.id,
        profile: {
          name: inst.name,
          founded: "N/A",
          sector: "N/A",
          industry: "N/A",
          employeesNumber: "N/A",
          ceoFullName: "N/A",
          details: { description: `${inst.name} (${inst.symbol}) info.` }
        },
        keyStats: {
          marketCap: 0,
          peRatio: 0,
          epsTtm: 0,
          High52W: 0,
          Low52W: 0,
        }
      });
    } else {
      res.status(404).json({ error: "Instrument not found" });
    }
  }
});

router.get("/api/v1/stock-popularity/most-popular", (_req, res) => {
  const data = GetMostPopularStocksResponse.parse(MOST_POPULAR_INSTRUMENTS);
  res.json(data);
});

export default router;
