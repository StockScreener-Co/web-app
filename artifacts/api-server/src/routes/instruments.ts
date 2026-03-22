import { Router, type IRouter } from "express";
import { GetMostPopularStocksResponse } from "@workspace/api-zod";

const router: IRouter = Router();

// Моковые данные в соответствии с новым форматом
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

router.get("/v1/stock-popularity/most-popular", (_req, res) => {
  const data = GetMostPopularStocksResponse.parse(MOST_POPULAR_INSTRUMENTS);
  res.json(data);
});

export default router;
