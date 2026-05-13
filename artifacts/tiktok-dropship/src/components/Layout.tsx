import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Package,
  Sparkles,
  Truck,
  Megaphone,
  Wand2,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/research", label: "AI Research", icon: Sparkles },
  { href: "/suppliers", label: "Suppliers", icon: Truck },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/generator", label: "AI Generator", icon: Wand2 },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-60 flex-shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-sidebar-foreground tracking-tight">TikTok Drop</div>
              <div className="text-xs text-muted-foreground">Dropship AI</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link key={href} href={href}>
                <div
                  data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-primary" : "")} />
                  {label}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-sidebar-border">
          <div className="text-xs text-muted-foreground">Powered by AI</div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
