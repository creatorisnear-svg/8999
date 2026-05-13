import { useState, useEffect } from "react";
import {
  useGetShopSettings,
  useUpdateShopSettings,
  useAuthLogout,
} from "@workspace/api-client-react";
import {
  Store,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Loader2,
  Save,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

interface SettingsProps {
  onLogout: () => void;
}

const REGIONS = [
  { value: "US", label: "United States" },
  { value: "UK", label: "United Kingdom" },
  { value: "ID", label: "Indonesia" },
  { value: "MY", label: "Malaysia" },
  { value: "TH", label: "Thailand" },
  { value: "VN", label: "Vietnam" },
  { value: "SG", label: "Singapore" },
  { value: "PH", label: "Philippines" },
];

export default function Settings({ onLogout }: SettingsProps) {
  const { toast } = useToast();
  const { data: shopSettings, isLoading } = useGetShopSettings();
  const updateSettings = useUpdateShopSettings();
  const logout = useAuthLogout();

  const [form, setForm] = useState({
    shopName: "",
    shopUrl: "",
    sellerId: "",
    region: "",
    accessToken: "",
  });

  useEffect(() => {
    if (shopSettings) {
      setForm({
        shopName: shopSettings.shopName ?? "",
        shopUrl: shopSettings.shopUrl ?? "",
        sellerId: shopSettings.sellerId ?? "",
        region: shopSettings.region ?? "",
        accessToken: shopSettings.accessToken ?? "",
      });
    }
  }, [shopSettings]);

  function handleSave() {
    updateSettings.mutate(
      {
        data: {
          shopName: form.shopName || null,
          shopUrl: form.shopUrl || null,
          sellerId: form.sellerId || null,
          region: form.region || null,
          accessToken: form.accessToken || null,
        },
      },
      {
        onSuccess: () => toast({ title: "Settings saved" }),
        onError: () =>
          toast({ title: "Failed to save settings", variant: "destructive" }),
      },
    );
  }

  function handleLogout() {
    logout.mutate(undefined, { onSuccess: () => onLogout() });
  }

  const isConnected = shopSettings?.isConnected ?? false;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your TikTok Shop connection and account
        </p>
      </div>

      {/* TikTok Shop Connection */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center flex-shrink-0">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">TikTok Shop</CardTitle>
                <CardDescription className="text-xs">
                  Connect your seller account
                </CardDescription>
              </div>
            </div>
            {isConnected ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                <AlertCircle className="w-3.5 h-3.5" /> Not connected
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Info banner */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
            <p className="font-semibold mb-1">How to get your credentials</p>
            <ol className="list-decimal list-inside space-y-0.5 text-blue-700 dark:text-blue-400">
              <li>
                Go to{" "}
                <a
                  href="https://seller.tiktok.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline inline-flex items-center gap-0.5"
                >
                  TikTok Seller Center
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Navigate to Settings → Developer → API Access</li>
              <li>Generate an access token and copy your Shop ID</li>
            </ol>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Shop Name</Label>
                  <Input
                    value={form.shopName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, shopName: e.target.value }))
                    }
                    placeholder="My TikTok Shop"
                    data-testid="input-shop-name"
                  />
                </div>
                <div>
                  <Label>Region</Label>
                  <select
                    value={form.region}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, region: e.target.value }))
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    data-testid="select-region"
                  >
                    <option value="">Select region...</option>
                    {REGIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label>Shop URL</Label>
                <Input
                  value={form.shopUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, shopUrl: e.target.value }))
                  }
                  placeholder="https://shop.tiktok.com/@yourshop"
                  data-testid="input-shop-url"
                />
              </div>
              <div>
                <Label>Seller / Shop ID</Label>
                <Input
                  value={form.sellerId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sellerId: e.target.value }))
                  }
                  placeholder="Your Shop ID from Seller Center"
                  data-testid="input-seller-id"
                />
              </div>
              <div>
                <Label>Access Token</Label>
                <Input
                  type="password"
                  value={form.accessToken}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, accessToken: e.target.value }))
                  }
                  placeholder="Paste your API access token"
                  data-testid="input-access-token"
                />
              </div>
              <Button
                onClick={handleSave}
                disabled={updateSettings.isPending}
                className="w-full"
                data-testid="button-save-settings"
              >
                {updateSettings.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Sign out</p>
              <p className="text-xs text-muted-foreground">
                You'll need your password to sign back in
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={logout.isPending}
              data-testid="button-logout"
            >
              {logout.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
