import { useGetDashboardStats, useListProducts, useListCampaigns } from "@workspace/api-client-react";
import {
  Package, Truck, Megaphone, TrendingUp, CheckCircle, Send,
  Sparkles, Zap, BarChart3, ChevronRight, Rocket,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

function StatCard({ title, value, icon: Icon, sub, color }: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  sub?: string;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold mt-1" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, "-")}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${color ?? "bg-primary/10"}`}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
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

const quickActions = [
  {
    href: "/research",
    icon: Sparkles,
    label: "Find Trending Products",
    desc: "AI scans niches & finds winners",
    color: "from-primary/10 to-primary/5",
    iconColor: "text-primary",
  },
  {
    href: "/research",
    icon: Zap,
    label: "Autopilot Launch",
    desc: "Suppliers + content in one click",
    color: "from-yellow-500/10 to-yellow-500/5",
    iconColor: "text-yellow-600",
  },
  {
    href: "/generator",
    icon: BarChart3,
    label: "Generate Content",
    desc: "TikTok scripts, hooks & captions",
    color: "from-blue-500/10 to-blue-500/5",
    iconColor: "text-blue-600",
  },
  {
    href: "/research",
    icon: TrendingUp,
    label: "Trending Niches",
    desc: "See what's hot right now",
    color: "from-green-500/10 to-green-500/5",
    iconColor: "text-green-600",
  },
];

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: products, isLoading: productsLoading } = useListProducts();
  const { data: campaigns, isLoading: campaignsLoading } = useListCampaigns();

  const recentProducts = products?.slice(-5).reverse() ?? [];
  const recentCampaigns = campaigns?.slice(-5).reverse() ?? [];
  const isEmpty = !productsLoading && !campaignsLoading && recentProducts.length === 0 && recentCampaigns.length === 0;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Your TikTok dropshipping command center</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickActions.map((a) => (
          <Link key={a.label} href={a.href}>
            <div className={`group p-3 sm:p-4 rounded-xl bg-gradient-to-br ${a.color} border border-border hover:border-primary/30 transition-all cursor-pointer h-full`}>
              <a.icon className={`w-5 h-5 ${a.iconColor} mb-2`} />
              <p className="text-sm font-semibold leading-tight">{a.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">{a.desc}</p>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mt-2 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {statsLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4 sm:p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
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

      {/* Getting Started — only show when no data yet */}
      {isEmpty && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Rocket className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-semibold">Get started in 3 steps</p>
                <ol className="space-y-1.5 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5">1</span>
                    <span>Go to <Link href="/research" className="text-primary underline font-medium">AI Research</Link> → click "Get Trending Niches" to see what's hot right now</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5">2</span>
                    <span>Click a niche to research products, then hit <span className="font-semibold text-yellow-600">⚡ Autopilot</span> on any product to get suppliers + content instantly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center flex-shrink-0 font-bold mt-0.5">3</span>
                    <span>Save content to <Link href="/campaigns" className="text-primary underline font-medium">Campaigns</Link>, mark it Ready, then post on TikTok</span>
                  </li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Products + Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Products</CardTitle>
              <Link href="/products" className="text-xs text-primary hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-0.5">
            {productsLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full mb-2" />)
            ) : recentProducts.length === 0 ? (
              <div className="py-6 text-center">
                <Package className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No products yet</p>
                <Link href="/research" className="text-xs text-primary hover:underline mt-1 inline-block">Research products →</Link>
              </div>
            ) : (
              recentProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0" data-testid={`product-row-${p.id}`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.category}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    {p.profitMargin && (
                      <span className="text-xs font-semibold text-primary">{Number(p.profitMargin).toFixed(0)}%</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[p.status]}`}>{p.status}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Campaigns</CardTitle>
              <Link href="/campaigns" className="text-xs text-primary hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-0.5">
            {campaignsLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full mb-2" />)
            ) : recentCampaigns.length === 0 ? (
              <div className="py-6 text-center">
                <Megaphone className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No campaigns yet</p>
                <Link href="/generator" className="text-xs text-primary hover:underline mt-1 inline-block">Generate content →</Link>
              </div>
            ) : (
              recentCampaigns.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0" data-testid={`campaign-row-${c.id}`}>
                  <div className="min-w-0 flex-1">
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
