import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Package,
  Sparkles,
  Truck,
  Megaphone,
  Wand2,
  TrendingUp,
  Settings,
  Menu,
  X,
  BrainCircuit,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, highlight: false },
  { href: "/advisor", label: "AI Advisor", icon: BrainCircuit, highlight: true },
  { href: "/research", label: "AI Research", icon: Sparkles, highlight: false },
  { href: "/products", label: "Products", icon: Package, highlight: false },
  { href: "/suppliers", label: "Suppliers", icon: Truck, highlight: false },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone, highlight: false },
  { href: "/generator", label: "AI Generator", icon: Wand2, highlight: false },
  { href: "/settings", label: "Settings", icon: Settings, highlight: false },
];

function NavContent({
  location,
  onNav,
}: {
  location: string;
  onNav?: () => void;
}) {
  return (
    <>
      <div className="px-5 py-5 border-b border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-pink-400 flex items-center justify-center shadow-lg shadow-primary/30">
            <TrendingUp className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-sidebar-foreground tracking-tight">
              TikTok Drop
            </div>
            <div className="text-[11px] text-primary/70 font-medium">AI Dropship Suite</div>
          </div>
        </div>
      </div>

      <div className="px-3 pt-3 pb-1">
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-1">Navigation</div>
      </div>

      <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, highlight }) => {
          const isActive =
            href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link key={href} href={href}>
              <div
                data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={onNav}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer",
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/25"
                    : highlight
                      ? "text-primary hover:bg-primary/10 border border-primary/20 hover:border-primary/40"
                      : "text-sidebar-foreground hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 flex-shrink-0",
                    isActive ? "text-white" : highlight ? "text-primary" : "text-muted-foreground",
                  )}
                />
                {label}
                {highlight && !isActive && (
                  <span className="ml-auto text-[10px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" />AI
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <div className="text-xs text-muted-foreground">AI Online · Powered by GPT-4o</div>
        </div>
      </div>
    </>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-shrink-0 border-r border-sidebar-border bg-sidebar flex-col">
        <NavContent location={location} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-3 h-8 w-8"
          onClick={() => setMobileOpen(false)}
        >
          <X className="w-4 h-4" />
        </Button>
        <NavContent location={location} onNav={() => setMobileOpen(false)} />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-background sticky top-0 z-30 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-pink-400 flex items-center justify-center shadow-md shadow-primary/30">
              <TrendingUp className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight">TikTok Drop</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
