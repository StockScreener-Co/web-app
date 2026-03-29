import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";

import Home from "@/pages/home";
import PortfoliosList from "@/pages/portfolios-list";
import Portfolio from "@/pages/portfolio";
import TickerDetail from "@/pages/ticker-detail";
import AuthPage from "@/pages/auth";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/portfolios" component={PortfoliosList} />
        <Route path="/portfolio" component={Portfolio} />
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
      <Router />
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
