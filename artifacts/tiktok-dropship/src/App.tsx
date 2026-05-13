import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Research from "@/pages/Research";
import Suppliers from "@/pages/Suppliers";
import Campaigns from "@/pages/Campaigns";
import Generator from "@/pages/Generator";
import Settings from "@/pages/Settings";
import Advisor from "@/pages/Advisor";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import { authMe } from "@workspace/api-client-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function AuthGate() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => authMe(),
    retry: false,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.authenticated) {
    return (
      <Login
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["auth-me"] });
          refetch();
        }}
      />
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/products" component={Products} />
        <Route path="/research" component={Research} />
        <Route path="/suppliers" component={Suppliers} />
        <Route path="/campaigns" component={Campaigns} />
        <Route path="/advisor" component={Advisor} />
        <Route path="/generator" component={Generator} />
        <Route path="/settings">
          {() => (
            <Settings
              onLogout={() => {
                queryClient.invalidateQueries({ queryKey: ["auth-me"] });
              }}
            />
          )}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthGate />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
