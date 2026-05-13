import { useGetDashboardStats, useListProducts, useListCampaigns } from "@workspace/api-client-react";
import { Package, Truck, Megaphone, TrendingUp, CheckCircle, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

function StatCard({ title, value, icon: Icon, sub, color }: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  sub?: string;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold mt-1" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, "-")}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color ?? "bg-primary/10"}`}>
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const statusColors: Record<string, string> = {
  researching: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  paused: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  archived: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const campaignStatusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  ready: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  posted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: products, isLoading: productsLoading } = useListProducts();
  const { data: campaigns, isLoading: campaignsLoading } = useListCampaigns();

  const recentProducts = products?.slice(-5).reverse() ?? [];
  const recentCampaigns = campaigns?.slice(-5).reverse() ?? [];

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Your TikTok dropshipping command center</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statsLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : (
          <>
            <StatCard title="Total Products" value={stats?.totalProducts ?? 0} icon={Package} sub={`${stats?.activeProducts ?? 0} active`} />
            <StatCard title="Suppliers" value={stats?.totalSuppliers ?? 0} icon={Truck} />
            <StatCard title="Campaigns" value={stats?.totalCampaigns ?? 0} icon={Megaphone} sub={`${stats?.postedCampaigns ?? 0} posted`} />
            <StatCard title="Active Products" value={stats?.activeProducts ?? 0} icon={CheckCircle} color="bg-green-100 dark:bg-green-900/20" />
            <StatCard title="Ready to Post" value={stats?.readyCampaigns ?? 0} icon={Send} color="bg-blue-100 dark:bg-blue-900/20" />
            <StatCard
              title="Avg Profit Margin"
              value={stats?.avgProfitMargin != null ? `${Number(stats.avgProfitMargin).toFixed(1)}%` : "—"}
              icon={TrendingUp}
              color="bg-primary/10"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {productsLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : recentProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No products yet. Start by researching a niche.</p>
            ) : (
              recentProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0" data-testid={`product-row-${p.id}`}>
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.profitMargin && (
                      <span className="text-xs font-semibold text-primary">{Number(p.profitMargin).toFixed(0)}% margin</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[p.status]}`}>{p.status}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Campaigns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {campaignsLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : recentCampaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No campaigns yet. Generate content with AI.</p>
            ) : (
              recentCampaigns.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0" data-testid={`campaign-row-${c.id}`}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{c.contentType.replace("_", " ")}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2 ${campaignStatusColors[c.status]}`}>{c.status}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
