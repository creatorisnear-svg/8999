import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAiResearchProducts,
  useAiTrendingNiches,
  useAiProductAnalysis,
  useAiAutopilot,
  useCreateProduct,
  useCreateCampaign,
  getListProductsQueryKey,
  getListCampaignsQueryKey,
} from "@workspace/api-client-react";
import {
  Sparkles, Plus, TrendingUp, DollarSign, Users, Loader2,
  Zap, BarChart3, ChevronRight, CheckCircle2, X, Copy, Check,
  AlertTriangle, ThumbsUp, ShieldAlert, Target, Rocket,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductIdea = {
  name: string;
  description: string;
  category: string;
  estimatedCost: number;
  estimatedSellingPrice: number;
  profitMargin: number;
  trendScore: number;
  competitionLevel?: string;
  monthlyRevenuePotential?: string;
  whyItWorks: string;
  targetAudience: string;
  viralAngles?: string[];
  trendingHooks?: string[];
  sourcingTip?: string;
  riskLevel?: string;
};

type TrendingNiche = {
  name: string;
  emoji: string;
  description: string;
  opportunityScore: number;
  competitionLevel: string;
  avgProfitMargin: number;
  whyNow: string;
  exampleProducts: string[];
};

type AnalysisResult = {
  verdict: string;
  verdictReason: string;
  opportunityScore: number;
  businessPlan?: Record<string, string>;
  pricingStrategy?: Record<string, string>;
  launchPlan?: Array<{ week: number; focus: string; actions: string[] }>;
  contentAngles?: Array<{ angle: string; hook: string; format: string }>;
  risks?: string[];
  competitorWeaknesses?: string;
  winningStrategy?: string;
};

type AutopilotResult = {
  suppliers: Array<{
    name: string; platform: string; url: string;
    shippingTime: string; rating: number; minOrderQuantity: number; notes: string;
  }>;
  contentPieces: Array<{
    title: string; contentType: string; content: string; hashtags: string; hook: string;
  }>;
  launchChecklist: string[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function TrendBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-primary" : score >= 60 ? "bg-yellow-500" : "bg-muted-foreground";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold tabular-nums">{score}</span>
    </div>
  );
}

const competitionBadge: Record<string, string> = {
  low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const riskBadge: Record<string, string> = {
  low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
    </Button>
  );
}

// ─── Trending Niches Panel ────────────────────────────────────────────────────

function TrendingNichesPanel({ onSelect }: { onSelect: (niche: string) => void }) {
  const { mutate, isPending, data } = useAiTrendingNiches();
  const niches: TrendingNiche[] = (data as any)?.niches ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Trending Niches Right Now
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">AI-powered niche intelligence — click any to research</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => mutate(undefined)} disabled={isPending}>
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
            {isPending ? "Analyzing..." : "Get Trending Niches"}
          </Button>
        </div>
      </CardHeader>
      {niches.length > 0 && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {niches.map((n) => (
              <button
                key={n.name}
                onClick={() => onSelect(n.name)}
                className="text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-base">{n.emoji}</span>
                      <span className="text-sm font-semibold">{n.name}</span>
                      <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", competitionBadge[n.competitionLevel] ?? competitionBadge.medium)}>
                        {n.competitionLevel} comp
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{n.whyNow}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-muted-foreground">Opportunity</span>
                      <TrendBar score={n.opportunityScore} />
                      <span className="text-xs font-medium text-primary flex-shrink-0">~{n.avgProfitMargin}% margin</span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Product Analysis Dialog ──────────────────────────────────────────────────

function AnalysisDialog({
  open, onClose, product,
}: {
  open: boolean;
  onClose: () => void;
  product: ProductIdea | null;
}) {
  const { mutate, isPending, data } = useAiProductAnalysis();
  const result = data as AnalysisResult | null;

  const verdictColor =
    result?.verdict === "BUY" ? "text-green-600" :
    result?.verdict === "PASS" ? "text-red-600" : "text-yellow-600";

  const verdictIcon =
    result?.verdict === "BUY" ? <ThumbsUp className="w-5 h-5" /> :
    result?.verdict === "PASS" ? <X className="w-5 h-5" /> :
    <AlertTriangle className="w-5 h-5" />;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Deep Dive: {product?.name}
          </DialogTitle>
        </DialogHeader>

        {!result && (
          <div className="py-4">
            <Button
              onClick={() => product && mutate({ data: {
                productName: product.name,
                productDescription: product.description,
                estimatedCost: product.estimatedCost,
                estimatedSellingPrice: product.estimatedSellingPrice,
              }})}
              disabled={isPending}
              className="w-full"
            >
              {isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing (takes ~10s)...</>
                : <><BarChart3 className="w-4 h-4 mr-2" />Run Full AI Analysis</>}
            </Button>
            {isPending && (
              <p className="text-xs text-center text-muted-foreground mt-3">
                AI is analyzing revenue potential, competition, pricing strategy, and building your 3-week launch plan...
              </p>
            )}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Verdict */}
            <div className={cn("flex items-center gap-3 p-4 rounded-xl border-2", {
              "border-green-300 bg-green-50 dark:bg-green-950/20": result.verdict === "BUY",
              "border-red-300 bg-red-50 dark:bg-red-950/20": result.verdict === "PASS",
              "border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20": result.verdict === "RISKY",
            })}>
              <div className={cn("font-black text-2xl", verdictColor)}>{verdictIcon}</div>
              <div>
                <div className={cn("text-xl font-black", verdictColor)}>{result.verdict}</div>
                <p className="text-sm">{result.verdictReason}</p>
              </div>
              <div className="ml-auto text-center">
                <div className="text-2xl font-black text-primary">{result.opportunityScore}</div>
                <div className="text-xs text-muted-foreground">/ 100</div>
              </div>
            </div>

            <Tabs defaultValue="business">
              <TabsList className="w-full">
                <TabsTrigger value="business" className="flex-1 text-xs">Business</TabsTrigger>
                <TabsTrigger value="launch" className="flex-1 text-xs">Launch Plan</TabsTrigger>
                <TabsTrigger value="content" className="flex-1 text-xs">Content</TabsTrigger>
                <TabsTrigger value="risks" className="flex-1 text-xs">Risks</TabsTrigger>
              </TabsList>

              <TabsContent value="business" className="mt-4 space-y-3">
                {result.businessPlan && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(result.businessPlan).map(([k, v]) => (
                      <div key={k} className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</p>
                        <p className="font-bold text-sm mt-0.5">{v}</p>
                      </div>
                    ))}
                  </div>
                )}
                {result.pricingStrategy && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide">Pricing Strategy</p>
                    {Object.entries(result.pricingStrategy).map(([k, v]) => (
                      <div key={k}>
                        <p className="text-xs text-muted-foreground capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</p>
                        <p className="text-sm font-medium">{String(v)}</p>
                      </div>
                    ))}
                  </div>
                )}
                {result.winningStrategy && (
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1">Winning Strategy</p>
                    <p className="text-sm">{result.winningStrategy}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="launch" className="mt-4 space-y-3">
                {result.launchPlan?.map((week) => (
                  <div key={week.week} className="border border-border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold bg-primary text-white px-2 py-0.5 rounded-full">Week {week.week}</span>
                      <span className="text-sm font-semibold">{week.focus}</span>
                    </div>
                    <ul className="space-y-1">
                      {week.actions.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="content" className="mt-4 space-y-3">
                {result.contentAngles?.map((a, i) => (
                  <div key={i} className="border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-sm font-semibold">{a.angle}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="flex-1 bg-muted/50 rounded px-2.5 py-1.5">
                        <p className="text-xs text-muted-foreground">Hook</p>
                        <p className="text-sm italic">"{a.hook}"</p>
                      </div>
                      <CopyBtn text={a.hook} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">{a.format}</p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="risks" className="mt-4 space-y-3">
                {result.risks && result.risks.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Risks to Know</p>
                    <ul className="space-y-1.5">
                      {result.risks.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <ShieldAlert className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0 mt-0.5" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.competitorWeaknesses && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase mb-1">Exploit Competitor Weaknesses</p>
                    <p className="text-sm">{result.competitorWeaknesses}</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Autopilot Dialog ─────────────────────────────────────────────────────────

function AutopilotDialog({
  open, onClose, product,
}: {
  open: boolean;
  onClose: () => void;
  product: ProductIdea | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutate, isPending, data } = useAiAutopilot();
  const createProduct = useCreateProduct();
  const createCampaign = useCreateCampaign();

  const result = data as AutopilotResult | null;
  const [savedProduct, setSavedProduct] = useState(false);
  const [savedContent, setSavedContent] = useState<Set<number>>(new Set());

  function handleLaunch() {
    if (!product) return;
    mutate({ data: {
      productName: product.name,
      productDescription: product.description,
      targetAudience: product.targetAudience,
    }});
  }

  function saveProduct() {
    if (!product) return;
    createProduct.mutate({ data: {
      name: product.name,
      description: product.description,
      category: product.category,
      estimatedCost: product.estimatedCost,
      estimatedSellingPrice: product.estimatedSellingPrice,
      trendScore: product.trendScore,
      status: "active",
      notes: `Why it works: ${product.whyItWorks}\nTarget: ${product.targetAudience}`,
    }}, {
      onSuccess: () => {
        setSavedProduct(true);
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast({ title: `"${product.name}" added to Products` });
      },
    });
  }

  function saveContent(piece: AutopilotResult["contentPieces"][0], idx: number) {
    createCampaign.mutate({ data: {
      title: piece.title,
      contentType: piece.contentType as any,
      content: piece.content,
      hashtags: piece.hashtags,
      targetAudience: product?.targetAudience ?? null,
      status: "draft",
    }}, {
      onSuccess: () => {
        setSavedContent(s => new Set([...s, idx]));
        queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
        toast({ title: `"${piece.title}" saved to Campaigns` });
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={() => { onClose(); setSavedProduct(false); setSavedContent(new Set()); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            Autopilot: {product?.name}
          </DialogTitle>
        </DialogHeader>

        {!result && (
          <div className="py-4 space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-400 mb-1">⚡ What Autopilot does in one click:</p>
              <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-0.5">
                <li>• Finds 3 real suppliers with shipping times</li>
                <li>• Writes a viral TikTok caption, video script, and 5 hook lines</li>
                <li>• Gives you a step-by-step launch checklist</li>
              </ul>
            </div>
            <Button onClick={handleLaunch} disabled={isPending} className="w-full" size="lg">
              {isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Building your launch package...</>
                : <><Zap className="w-4 h-4 mr-2" />Run Autopilot</>}
            </Button>
            {isPending && (
              <p className="text-xs text-center text-muted-foreground">
                AI is finding suppliers and writing viral content for you...
              </p>
            )}
          </div>
        )}

        {result && (
          <div className="space-y-5">
            {/* Save Product */}
            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
              <div>
                <p className="text-sm font-semibold">{product?.name}</p>
                <p className="text-xs text-muted-foreground">{product?.category} · {product?.profitMargin}% margin</p>
              </div>
              <Button size="sm" variant={savedProduct ? "outline" : "default"} disabled={savedProduct} onClick={saveProduct}>
                {savedProduct ? <><Check className="w-3.5 h-3.5 mr-1.5" />Saved</> : <><Plus className="w-3.5 h-3.5 mr-1.5" />Save Product</>}
              </Button>
            </div>

            <Tabs defaultValue="content">
              <TabsList className="w-full">
                <TabsTrigger value="content" className="flex-1 text-xs">Content ({result.contentPieces.length})</TabsTrigger>
                <TabsTrigger value="suppliers" className="flex-1 text-xs">Suppliers ({result.suppliers.length})</TabsTrigger>
                <TabsTrigger value="checklist" className="flex-1 text-xs">Checklist</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="mt-3 space-y-3">
                {result.contentPieces.map((piece, idx) => (
                  <div key={idx} className="border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{piece.title}</span>
                        <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{piece.contentType}</span>
                      </div>
                      <Button size="sm" variant={savedContent.has(idx) ? "outline" : "default"}
                        disabled={savedContent.has(idx)} onClick={() => saveContent(piece, idx)}>
                        {savedContent.has(idx) ? "Saved" : "Save"}
                      </Button>
                    </div>
                    <div className="bg-muted/50 rounded p-2.5 relative">
                      <div className="absolute top-2 right-2">
                        <CopyBtn text={piece.content} />
                      </div>
                      <p className="text-sm whitespace-pre-wrap pr-6">{piece.content}</p>
                    </div>
                    <p className="text-xs text-primary mt-1.5">{piece.hashtags}</p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="suppliers" className="mt-3 space-y-3">
                {result.suppliers.map((s, i) => (
                  <div key={i} className="border border-border rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.platform} · {s.shippingTime} · MOQ: {s.minOrderQuantity}</p>
                        <p className="text-xs mt-1">{s.notes}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs font-bold text-primary">⭐ {s.rating}</div>
                        <a href={s.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs underline text-blue-600 dark:text-blue-400">View</a>
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="checklist" className="mt-3">
                <ul className="space-y-2">
                  {result.launchChecklist.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-primary">{i + 1}</span>
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Research() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const researchMutation = useAiResearchProducts();
  const createProduct = useCreateProduct();

  const [niche, setNiche] = useState("");
  const [budget, setBudget] = useState("");
  const [count, setCount] = useState("5");
  const [ideas, setIdeas] = useState<ProductIdea[]>([]);
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [analysisProduct, setAnalysisProduct] = useState<ProductIdea | null>(null);
  const [autopilotProduct, setAutopilotProduct] = useState<ProductIdea | null>(null);

  function handleResearch(overrideNiche?: string) {
    const target = overrideNiche ?? niche.trim();
    if (!target) {
      toast({ title: "Enter a niche to research", variant: "destructive" });
      return;
    }
    if (overrideNiche) setNiche(overrideNiche);
    researchMutation.mutate({
      data: { niche: target, budget: budget ? Number(budget) : null, count: Number(count) },
    }, {
      onSuccess: (data) => {
        setIdeas((data as any).ideas ?? []);
        setSaved(new Set());
        if (!(data as any).ideas?.length) toast({ title: "No ideas returned. Try a different niche." });
      },
      onError: () => toast({ title: "Research failed. Try again.", variant: "destructive" }),
    });
  }

  function handleSave(idea: ProductIdea, idx: number) {
    createProduct.mutate({ data: {
      name: idea.name,
      description: idea.description,
      category: idea.category,
      estimatedCost: idea.estimatedCost,
      estimatedSellingPrice: idea.estimatedSellingPrice,
      trendScore: idea.trendScore,
      status: "researching",
      notes: `Why it works: ${idea.whyItWorks}\nTarget: ${idea.targetAudience}${idea.sourcingTip ? `\nSourcing: ${idea.sourcingTip}` : ""}`,
    }}, {
      onSuccess: () => {
        setSaved(s => new Set([...s, idx]));
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast({ title: `"${idea.name}" saved to Products` });
      },
    });
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold">AI Product Research</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Find trending products, get deep analysis, and launch with one click</p>
      </div>

      {/* Trending Niches */}
      <TrendingNichesPanel onSelect={(n) => handleResearch(n)} />

      {/* Search Form */}
      <Card>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <Label>Niche / Category *</Label>
              <Input
                data-testid="input-research-niche"
                value={niche}
                onChange={e => setNiche(e.target.value)}
                placeholder="e.g. LED lighting, Pet accessories"
                onKeyDown={e => e.key === "Enter" && handleResearch()}
              />
            </div>
            <div>
              <Label>Max Cost per Unit ($)</Label>
              <Input
                data-testid="input-research-budget"
                type="number"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="e.g. 15"
              />
            </div>
            <div>
              <Label>Number of Ideas</Label>
              <Input
                data-testid="input-research-count"
                type="number"
                min="1"
                max="10"
                value={count}
                onChange={e => setCount(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={() => handleResearch()}
            disabled={researchMutation.isPending}
            className="w-full sm:w-auto"
            data-testid="button-research"
          >
            {researchMutation.isPending
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Finding Products...</>
              : <><Sparkles className="w-4 h-4 mr-2" />Find Trending Products</>}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {ideas.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {ideas.length} Products Found for "{niche}"
          </h2>
          {ideas.map((idea, idx) => (
            <Card key={idx} data-testid={`card-idea-${idx}`}>
              <CardContent className="p-4 sm:p-5">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold">{idea.name}</h3>
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{idea.category}</span>
                        {idea.competitionLevel && (
                          <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", competitionBadge[idea.competitionLevel] ?? competitionBadge.medium)}>
                            {idea.competitionLevel} competition
                          </span>
                        )}
                        {idea.riskLevel && (
                          <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", riskBadge[idea.riskLevel] ?? riskBadge.medium)}>
                            {idea.riskLevel} risk
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{idea.description}</p>
                    </div>
                  </div>

                  {/* Trend + Financials */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                      <p className="text-xs text-muted-foreground">Cost</p>
                      <p className="font-bold text-sm">${idea.estimatedCost}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                      <p className="text-xs text-muted-foreground">Price</p>
                      <p className="font-bold text-sm">${idea.estimatedSellingPrice}</p>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-2.5 text-center">
                      <p className="text-xs text-muted-foreground">Margin</p>
                      <p className="font-bold text-sm text-primary">{idea.profitMargin}%</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                      <p className="text-xs text-muted-foreground">Revenue Est.</p>
                      <p className="font-bold text-xs text-green-700 dark:text-green-400">{idea.monthlyRevenuePotential ?? "—"}</p>
                    </div>
                  </div>

                  {/* Trend score */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Trend Score</p>
                    <TrendBar score={idea.trendScore} />
                  </div>

                  {/* Why + Audience */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Why It Works</p>
                      <p className="text-sm">{idea.whyItWorks}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <Users className="w-3 h-3" /> Target Audience
                      </p>
                      <p className="text-sm">{idea.targetAudience}</p>
                    </div>
                  </div>

                  {/* Viral Hooks */}
                  {idea.trendingHooks && idea.trendingHooks.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">🎣 Viral Hook Lines</p>
                      <div className="space-y-1.5">
                        {idea.trendingHooks.map((hook, hi) => (
                          <div key={hi} className="flex items-center gap-2 bg-muted/50 rounded px-2.5 py-1.5">
                            <p className="text-sm flex-1 italic">"{hook}"</p>
                            <CopyBtn text={hook} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Content Angles */}
                  {idea.viralAngles && idea.viralAngles.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">🎬 Content Angles</p>
                      <div className="flex flex-wrap gap-1.5">
                        {idea.viralAngles.map((a, ai) => (
                          <span key={ai} className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {idea.sourcingTip && (
                    <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2.5 py-1.5">
                      <span className="font-medium">Sourcing tip:</span> {idea.sourcingTip}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAnalysisProduct(idea)}
                    >
                      <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                      Deep Dive
                    </Button>
                    <Button
                      size="sm"
                      className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                      onClick={() => setAutopilotProduct(idea)}
                    >
                      <Zap className="w-3.5 h-3.5 mr-1.5" />
                      Autopilot ⚡
                    </Button>
                    <div className="flex-1" />
                    <Button
                      variant={saved.has(idx) ? "outline" : "default"}
                      size="sm"
                      disabled={saved.has(idx) || createProduct.isPending}
                      onClick={() => handleSave(idea, idx)}
                      data-testid={`button-save-idea-${idx}`}
                    >
                      {saved.has(idx) ? <><Check className="w-3.5 h-3.5 mr-1.5" />Saved</> : <><Plus className="w-3.5 h-3.5 mr-1.5" />Save</>}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!researchMutation.isPending && ideas.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Rocket className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Click a trending niche above or search any category</p>
          <p className="text-sm mt-1">AI returns products with viral hooks, revenue estimates, and a complete launch strategy</p>
        </div>
      )}

      {/* Dialogs */}
      <AnalysisDialog
        open={!!analysisProduct}
        onClose={() => setAnalysisProduct(null)}
        product={analysisProduct}
      />
      <AutopilotDialog
        open={!!autopilotProduct}
        onClose={() => setAutopilotProduct(null)}
        product={autopilotProduct}
      />
    </div>
  );
}
