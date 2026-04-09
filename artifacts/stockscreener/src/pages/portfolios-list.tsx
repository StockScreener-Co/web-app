import { useGetMyPortfolios, useDeletePortfolio } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useLastPortfolio } from "@/hooks/use-last-portfolio";
import { Link } from "wouter";
import { Briefcase, Plus, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { CreatePortfolioDialog } from "@/components/create-portfolio-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function PortfoliosList() {
  const { user } = useAuth();
  const { updateLastPortfolioId } = useLastPortfolio();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { data: portfolios, isLoading } = useGetMyPortfolios({
    query: {
      enabled: !!user,
      queryKey: ["/api/v1/portfolios/my", user?.id],
    },
  });

  const deletePortfolioMutation = useDeletePortfolio({
    mutation: {
      onSuccess: () => {
        toast.success("Portfolio deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["/api/v1/portfolios/my", user?.id] });
      },
    },
  });

  const handleDelete = (id: string) => {
    deletePortfolioMutation.mutate({ id });
  };

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-primary/10 p-6 rounded-full mb-6">
          <Briefcase className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-3xl font-display font-bold mb-3 tracking-tight">Please sign in</h2>
        <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
          To view and manage your portfolios, you need to sign in to your account.
        </p>
        <Link href="/auth">
          <Button size="lg" className="rounded-2xl px-8 h-12 shadow-xl shadow-primary/20 font-semibold">
            Sign In or Register
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-display font-extrabold tracking-tight mb-1 flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-primary" /> My Portfolios
          </h1>
          <p className="text-muted-foreground">Select a portfolio to manage or create a new one.</p>
        </div>
        <Button 
          className="shadow-lg shadow-primary/20 rounded-xl"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> Create New Portfolio
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Loading your portfolios...</p>
        </div>
      ) : portfolios && portfolios.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolios.map((portfolio) => (
            <div key={portfolio.id} className="relative group">
              <Link href={`/portfolio?id=${portfolio.id}`} onClick={() => updateLastPortfolioId(portfolio.id)}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer group-hover:bg-accent/5">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <Briefcase className="w-5 h-5 text-primary" />
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <CardTitle className="mt-4">{portfolio.name}</CardTitle>
                    <CardDescription>ID: {portfolio.id.slice(0, 8)}...</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground italic">Click to view details</p>
                  </CardContent>
                </Card>
              </Link>
              <div className="absolute top-4 right-12 opacity-0 group-hover:opacity-100 transition-opacity">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the portfolio
                        "{portfolio.name}" and all its assets.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDelete(portfolio.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-border">
          <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No portfolios found</h3>
          <p className="text-muted-foreground mb-8">You haven't created any portfolios yet.</p>
          <Button 
            variant="outline" 
            className="rounded-xl"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> Create Your First Portfolio
          </Button>
        </div>
      )}

      <CreatePortfolioDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
    </div>
  );
}
