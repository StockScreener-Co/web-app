import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { ErrorBoundary } from "@/components/error-boundary";
import { ApiError } from "@workspace/api-client-react";
import { getApiErrorMessage } from "@/lib/api-error";

import Home from "@/pages/home";
import PortfoliosList from "@/pages/portfolios-list";
import Portfolio from "@/pages/portfolio";
import TickerDetail from "@/pages/ticker-detail";
import AuthPage from "@/pages/auth";
import NotFound from "@/pages/not-found";
import WatchlistsList from "@/pages/watchlists-list";
import WatchlistPage from "@/pages/watchlist";

function handleGlobalError(error: unknown, isQuery: boolean) {
  if (error instanceof ApiError && error.status === 401) {
    toast.error("Session expired, please sign in again");
    return;
  }
  const fallback = isQuery ? "Failed to load data" : "Something went wrong";
  toast.error(getApiErrorMessage(error, fallback));
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.meta?.suppressErrorToast) return;
      handleGlobalError(error, true);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      if (mutation.meta?.suppressErrorToast) return;
      handleGlobalError(error, false);
    },
  }),
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