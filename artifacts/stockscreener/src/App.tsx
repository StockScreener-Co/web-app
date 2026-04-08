import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { ErrorBoundary } from "@/components/error-boundary";

import Home from "@/pages/home";
import PortfoliosList from "@/pages/portfolios-list";
import Portfolio from "@/pages/portfolio";
import TickerDetail from "@/pages/ticker-detail";
import AuthPage from "@/pages/auth";
import NotFound from "@/pages/not-found";
import WatchlistsList from "@/pages/watchlists-list";
import WatchlistPage from "@/pages/watchlist";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      throwOnError: false,
      retry: (failureCount, error: any) => {
        // Не ретраить 4xx ошибки
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      throwOnError: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/portfolios" component={PortfoliosList} />
        <Route path="/portfolio" component={Portfolio} />
        <Route path="/watchlists" component={WatchlistsList} />
        <Route path="/watchlist" component={WatchlistPage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/ticker/:idOrSymbol" component={TickerDetail} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function AppContent() {
  const rawBase = import.meta.env.BASE_URL || "";
  const base = (rawBase === "./" || rawBase === "/") ? "" : rawBase.replace(/\/$/, "");

  return (
    <WouterRouter base={base}>
      <ErrorBoundary>
        <Router />
      </ErrorBoundary>
    </WouterRouter>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="ss-theme">
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AppContent />
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;