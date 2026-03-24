import { Link, useLocation, useSearch } from "wouter";
import { useTheme } from "./theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { useLastPortfolio } from "@/hooks/use-last-portfolio";
import { useGetMyPortfolios } from "@workspace/api-client-react";
import { Moon, Sun, Search, Briefcase, Menu, X, User, LogOut, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

function PortfolioDropdown() {
  const { user } = useAuth();
  const { updateLastPortfolioId, lastPortfolioId } = useLastPortfolio();
  const [location, setLocation] = useLocation();
  const { data: portfolios, isLoading } = useGetMyPortfolios({
    query: {
      enabled: !!user,
      queryKey: ["/api/v1/portfolios/my", user?.id],
    },
  });

  const search = useSearch();
  const currentPortfolioIdFromUrl = useMemo(() => new URLSearchParams(search).get('id'), [search]);
  const currentPortfolioId = currentPortfolioIdFromUrl || lastPortfolioId;

  const currentPortfolio = portfolios?.find(p => p.id === currentPortfolioId);
  const portfolioLabel = currentPortfolio ? currentPortfolio.name : "Select Portfolio";

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 h-9 px-3 font-medium">
          <Briefcase className="w-4 h-4" />
          <span className="hidden lg:inline">{portfolioLabel}</span>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>My Portfolios</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="px-2 py-4 text-center text-xs text-muted-foreground italic">
            Loading portfolios...
          </div>
        ) : portfolios && portfolios.length > 0 ? (
          portfolios.map((portfolio) => (
            <DropdownMenuItem
              key={portfolio.id}
              onClick={() => {
                updateLastPortfolioId(portfolio.id);
                setLocation(`/portfolio?id=${portfolio.id}`);
              }}
              className="cursor-pointer"
            >
              {portfolio.name}
            </DropdownMenuItem>
          ))
        ) : (
          <div className="px-2 py-4 text-center text-xs text-muted-foreground italic">
            No portfolios found
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setLocation("/portfolios")}
          className="cursor-pointer text-primary focus:text-primary"
        >
          Manage Portfolios
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { lastPortfolioId } = useLastPortfolio();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const navLinks = [
    { href: "/", label: "Search", icon: Search },
    { 
      href: user && lastPortfolioId ? `/portfolio?id=${lastPortfolioId}` : "/portfolios", 
      label: "Portfolios", 
      icon: Briefcase 
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="w-full max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <div className="bg-primary/10 p-1.5 rounded-xl">
                <svg width="28" height="28" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="256" height="256" rx="60" fill="#16a34a"/>
                  <path d="M165 95C165 85 155 80 140 80H110C95 80 85 88 85 100C85 125 171 120 171 155C171 172 155 180 140 180H110C90 180 80 170 80 155" stroke="white" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M140 170L170 140L200 160L240 100" stroke="#4ade80" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="240" cy="100" r="8" fill="#4ade80"/>
                </svg>
              </div>
              <span className="font-display font-bold text-xl tracking-tight hidden sm:inline-block">
                Stock <span className="text-primary">Screener</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <PortfolioDropdown />
            <div className="h-6 w-px bg-border mx-2" />
            {navLinks.map((link) => {
              const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
            <div className="h-6 w-px bg-border mx-2" />
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-muted-foreground">
                    {user.fullName || user.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <Button variant="default" size="sm" className="rounded-full px-4">
                  Sign In
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            {user ? (
              <Button variant="ghost" size="icon" onClick={() => logout()} className="rounded-full text-destructive">
                <LogOut className="w-5 h-5" />
              </Button>
            ) : (
              <Link href="/auth">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="w-5 h-5" />
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-border/40 bg-background overflow-hidden"
            >
              <nav className="w-full max-w-[1600px] mx-auto px-6 py-4 flex flex-col gap-4">
                <div className="md:hidden">
                   <PortfolioDropdown />
                </div>
                {navLinks.map((link) => {
                  const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                        isActive 
                          ? "bg-primary/10 text-primary font-semibold" 
                          : "hover:bg-accent text-muted-foreground"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 w-full flex flex-col relative">
        {children}
      </main>
      
      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border/40 mt-auto">
        <p>© {new Date().getFullYear()} Stock Screener. MVP Frontend.</p>
      </footer>
    </div>
  );
}
