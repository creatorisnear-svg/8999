import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  BrainCircuit,
  Zap,
  TrendingUp,
  CalendarDays,
  MessageSquare,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
  BarChart2,
  Clock,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// ─── types ────────────────────────────────────────────────────────────────────

type Tab = "discover" | "marketing" | "calendar" | "ask";

interface DiscoverProduct {
  name: string;
  emoji: string;
  category: string;
  description: string;
  whyNow: string;
  estimatedCost: number;
  estimatedSellingPrice: number;
  profitMargin: number;
  trendScore: number;
  viralAngle: string;
  firstHook: string;
  sourcingKeyword: string;
}

interface DiscoverResult {
  marketContext: string;
  products: DiscoverProduct[];
}

interface MarketingStrategyResult {
  summary: string;
  targetAudience: Record<string, string>;
  contentStrategy: Record<string, unknown>;
  weeklyPlan: Array<{ week: number; theme: string; goal: string; dailyActions: string[]; successMetric: string }>;
  tiktokTactics: string[];
  hashtagStrategy: Record<string, unknown>;
  budgetAllocation: Record<string, string>;
  kpis: string[];
}

interface CalendarDay {
  day: number;
  theme: string;
  posts: Array<{
    time: string;
    contentType: string;
    hook: string;
    topic: string;
    script: string;
    hashtags: string;
    expectedOutcome: string;
  }>;
}

interface CalendarResult {
  weekSummary: string;
  days: CalendarDay[];
  proTips: string[];
}

interface AskResult {
  answer: string;
  actionItems: string[];
  followUpQuestions: string[];
}

// ─── api helpers ──────────────────────────────────────────────────────────────

// Respects VITE_API_URL so that on Koyeb (separate API host) calls still work.
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

async function postAI<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── small shared components ─────────────────────────────────────────────────

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-5", className)}>
      {children}
    </div>
  );
}

function LoadingSpinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

// ─── Discover Tab ─────────────────────────────────────────────────────────────

function DiscoverTab() {
  const [result, setResult] = useState<DiscoverResult | null>(null);
  const [expanded, setExpanded] = useState<number | null>(0);
  const { toast } = useToast();

  const { mutate, isPending } = useMutation({
    mutationFn: () => postAI<DiscoverResult>("/ai/discover"),
    onSuccess: (data) => { setResult(data); setExpanded(0); },
    onError: () => toast({ title: "Error", description: "AI request failed. Try again.", variant: "destructive" }),
  });

  const trendColor = (score: number) =>
    score >= 85 ? "text-green-500" : score >= 70 ? "text-yellow-500" : "text-orange-500";

  return (
    <div className="space-y-5">
      <SectionCard>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" /> What Should I Sell Right Now?
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              AI scans current TikTok trends and picks 5 products you can start selling today — no input needed.
            </p>
          </div>
          <Button onClick={() => mutate()} disabled={isPending} size="lg" className="w-full sm:w-auto shrink-0">
            {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing trends…</> : result ? <><RefreshCw className="w-4 h-4 mr-2" />Refresh picks</> : <><Sparkles className="w-4 h-4 mr-2" />Discover winners</>}
          </Button>
        </div>
      </SectionCard>

      {isPending && <LoadingSpinner label="Scanning TikTok trends for you…" />}

      {result && !isPending && (
        <div className="space-y-4">
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground/80">
            <span className="font-semibold text-primary">Market context: </span>{result.marketContext}
          </div>

          {result.products.map((p, i) => (
            <SectionCard key={i} className="p-0 overflow-hidden">
              <button
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                <span className="text-2xl">{p.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm truncate">{p.name}</span>
                    <Badge variant="secondary" className="text-xs">{p.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.description}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className={cn("text-sm font-bold", trendColor(p.trendScore))}>
                      {p.trendScore}/100
                    </div>
                    <div className="text-xs text-muted-foreground">trend</div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-green-500">{p.profitMargin}%</div>
                    <div className="text-xs text-muted-foreground">margin</div>
                  </div>
                  {expanded === i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {expanded === i && (
                <div className="border-t border-border px-5 py-4 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Source cost", value: `$${p.estimatedCost}`, icon: DollarSign },
                      { label: "Sell price", value: `$${p.estimatedSellingPrice}`, icon: DollarSign },
                      { label: "Profit margin", value: `${p.profitMargin}%`, icon: BarChart2 },
                      { label: "Trend score", value: `${p.trendScore}/100`, icon: TrendingUp },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="rounded-lg bg-muted/40 p-3">
                        <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                          <Icon className="w-3.5 h-3.5" />
                          <span className="text-xs">{label}</span>
                        </div>
                        <div className="font-semibold text-sm">{value}</div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Why now</p>
                    <p className="text-sm">{p.whyNow}</p>
                  </div>

                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-2">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide">Best TikTok angle</p>
                    <p className="text-sm">{p.viralAngle}</p>
                    <div className="pt-1 border-t border-primary/15">
                      <p className="text-xs text-muted-foreground mb-0.5">Your first line on camera:</p>
                      <p className="text-sm font-medium italic">"{p.firstHook}"</p>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg px-3 py-2.5 space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-foreground text-xs">Search keyword:</span>
                      <code className="bg-background px-1.5 py-0.5 rounded text-xs border">{p.sourcingKeyword}</code>
                    </div>
                    <div className="flex gap-4 flex-wrap">
                      {(p as any).aliexpressUrl && (
                        <a href={(p as any).aliexpressUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary underline flex items-center gap-0.5 font-medium">
                          Search AliExpress <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                      {(p as any).cjUrl && (
                        <a href={(p as any).cjUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary underline flex items-center gap-0.5 font-medium">
                          Search CJDropshipping <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Marketing Strategy Tab ───────────────────────────────────────────────────

function MarketingTab() {
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [goal, setGoal] = useState("");
  const [result, setResult] = useState<MarketingStrategyResult | null>(null);
  const { toast } = useToast();

  const { mutate, isPending } = useMutation({
    mutationFn: () => postAI<MarketingStrategyResult>("/ai/marketing-strategy", { productName, productDescription, budget: budget || undefined, goal: goal || undefined }),
    onSuccess: setResult,
    onError: () => toast({ title: "Error", description: "AI request failed. Try again.", variant: "destructive" }),
  });

  const contentMix = result?.contentStrategy?.contentMix as Record<string, string> | undefined;
  const bestFormats = result?.contentStrategy?.bestFormats as string[] | undefined;
  const bestPostingTimes = result?.contentStrategy?.bestPostingTimes as string[] | undefined;

  return (
    <div className="space-y-5">
      <SectionCard>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-primary" /> Marketing Strategy Generator
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Product name *</label>
            <Input placeholder="e.g. Magnetic Phone Mount" value={productName} onChange={e => setProductName(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">What is it / who is it for? *</label>
            <Textarea rows={2} placeholder="e.g. A strong magnetic phone mount for cars, for commuters and ride-share drivers" value={productDescription} onChange={e => setProductDescription(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Monthly budget (optional)</label>
            <Input placeholder="e.g. $200" value={budget} onChange={e => setBudget(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Revenue goal (optional)</label>
            <Input placeholder="e.g. $3K/month in 60 days" value={goal} onChange={e => setGoal(e.target.value)} />
          </div>
        </div>
        <Button className="mt-4 w-full sm:w-auto" onClick={() => mutate()} disabled={isPending || !productName || !productDescription}>
          {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Building strategy…</> : <><Sparkles className="w-4 h-4 mr-2" />Generate strategy</>}
        </Button>
      </SectionCard>

      {isPending && <LoadingSpinner label="Building your custom marketing strategy…" />}

      {result && !isPending && (
        <div className="space-y-4">
          <SectionCard className="border-primary/30 bg-primary/5">
            <p className="text-sm font-medium">{result.summary}</p>
          </SectionCard>

          <div className="grid sm:grid-cols-2 gap-4">
            <SectionCard>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-primary" />Target Audience</h3>
              <div className="space-y-2">
                {Object.entries(result.targetAudience).map(([k, v]) => (
                  <div key={k}>
                    <span className="text-xs font-semibold text-muted-foreground capitalize">{k}: </span>
                    <span className="text-sm">{v}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-primary" />Posting Schedule</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground">Frequency: </span>
                  <span className="text-sm">{result.contentStrategy?.postingFrequency as string}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-muted-foreground">Best times: </span>
                  <span className="text-sm">{bestPostingTimes?.join(", ")}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-muted-foreground">Video length: </span>
                  <span className="text-sm">{result.contentStrategy?.videoLength as string}</span>
                </div>
              </div>
            </SectionCard>
          </div>

          {contentMix && (
            <SectionCard>
              <h3 className="text-sm font-semibold mb-3">Content Mix</h3>
              <div className="space-y-2">
                {Object.entries(contentMix).map(([k, v]) => (
                  <div key={k} className="flex items-start gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm"><span className="font-medium capitalize">{k}:</span> {v}</span>
                  </div>
                ))}
              </div>
              {bestFormats && bestFormats.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Best formats</p>
                  <div className="space-y-1">
                    {bestFormats.map((f, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-primary text-xs font-bold">{i + 1}.</span>
                        <span className="text-sm">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>
          )}

          <SectionCard>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-primary" />4-Week Growth Plan</h3>
            <div className="space-y-3">
              {result.weeklyPlan.map((w) => (
                <div key={w.week} className="rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">Week {w.week}</Badge>
                    <span className="text-sm font-semibold">{w.theme}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{w.goal}</span>
                  </div>
                  <ul className="space-y-1">
                    {w.dailyActions.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                        {a}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Success: </span>{w.successMetric}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="grid sm:grid-cols-2 gap-4">
            <SectionCard>
              <h3 className="text-sm font-semibold mb-3">TikTok Tactics</h3>
              <ul className="space-y-2">
                {result.tiktokTactics.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-primary font-bold shrink-0">{i + 1}.</span> {t}
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" />Budget Allocation</h3>
              <div className="space-y-2">
                {Object.entries(result.budgetAllocation ?? {}).map(([k, v]) => (
                  <div key={k}>
                    <span className="text-xs font-semibold text-muted-foreground capitalize">{k}: </span>
                    <span className="text-sm">{v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground mb-1">KPIs to track</p>
                <ul className="space-y-1">
                  {result.kpis?.map((k, i) => (
                    <li key={i} className="text-xs text-muted-foreground">• {k}</li>
                  ))}
                </ul>
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Content Calendar Tab ─────────────────────────────────────────────────────

function CalendarTab() {
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [postsPerDay, setPostsPerDay] = useState("2");
  const [result, setResult] = useState<CalendarResult | null>(null);
  const [expanded, setExpanded] = useState<number>(0);
  const { toast } = useToast();

  const { mutate, isPending } = useMutation({
    mutationFn: () => postAI<CalendarResult>("/ai/content-calendar", { productName, productDescription, postsPerDay: parseInt(postsPerDay) }),
    onSuccess: (data) => { setResult(data); setExpanded(0); },
    onError: () => toast({ title: "Error", description: "AI request failed. Try again.", variant: "destructive" }),
  });

  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="space-y-5">
      <SectionCard>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <CalendarDays className="w-5 h-5 text-primary" /> 7-Day Content Calendar
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Product name *</label>
            <Input placeholder="e.g. Self-Watering Plant Pots" value={productName} onChange={e => setProductName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">What it does / who it's for *</label>
            <Input placeholder="e.g. Plant pots that water themselves for busy plant lovers" value={productDescription} onChange={e => setProductDescription(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Posts per day</label>
            <Select value={postsPerDay} onValueChange={setPostsPerDay}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 post/day</SelectItem>
                <SelectItem value="2">2 posts/day</SelectItem>
                <SelectItem value="3">3 posts/day</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button className="mt-4 w-full sm:w-auto" onClick={() => mutate()} disabled={isPending || !productName || !productDescription}>
          {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Building calendar…</> : <><CalendarDays className="w-4 h-4 mr-2" />Generate calendar</>}
        </Button>
      </SectionCard>

      {isPending && <LoadingSpinner label="Crafting your 7-day content plan…" />}

      {result && !isPending && (
        <div className="space-y-4">
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
            <span className="font-semibold text-primary">Week strategy: </span>{result.weekSummary}
          </div>

          <div className="space-y-3">
            {(result.days ?? []).map((day, i) => (
              <SectionCard key={i} className="p-0 overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/30 transition-colors"
                  onClick={() => setExpanded(expanded === i ? -1 : i)}
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs text-primary font-bold leading-none">{dayNames[i]?.slice(0, 3) ?? `D${day.day}`}</span>
                    <span className="text-lg font-bold text-primary leading-none">{day.day}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{day.theme}</p>
                    <p className="text-xs text-muted-foreground">{day.posts?.length ?? 0} post{(day.posts?.length ?? 0) !== 1 ? "s" : ""}</p>
                  </div>
                  {expanded === i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                {expanded === i && (
                  <div className="border-t border-border divide-y divide-border">
                    {(day.posts ?? []).map((post, j) => (
                      <div key={j} className="px-5 py-4 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">{post.time}</Badge>
                          <Badge variant="secondary" className="text-xs">{post.contentType}</Badge>
                        </div>
                        <div className="rounded-lg bg-primary/5 border border-primary/15 px-4 py-3">
                          <p className="text-xs font-semibold text-primary mb-0.5">Hook</p>
                          <p className="text-sm font-medium italic">"{post.hook}"</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-0.5">What to film</p>
                          <p className="text-sm">{post.topic}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-0.5">Script outline</p>
                          <p className="text-sm text-muted-foreground">{post.script}</p>
                        </div>
                        <div className="flex items-start gap-2 flex-wrap text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Hashtags:</span>
                          <span>{post.hashtags}</span>
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400">
                          <span className="font-medium">Expected: </span>{post.expectedOutcome}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            ))}
          </div>

          {result.proTips && result.proTips.length > 0 && (
            <SectionCard>
              <h3 className="text-sm font-semibold mb-3">Pro tips for this product</h3>
              <ul className="space-y-2">
                {result.proTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Ask AI Tab ───────────────────────────────────────────────────────────────

interface Message { role: "user" | "ai"; text: string; result?: AskResult }

const STARTER_QUESTIONS = [
  "How do I find my first winning product?",
  "What's the best way to grow from 0 to 1,000 followers fast?",
  "How do I price products for maximum profit on TikTok Shop?",
  "What type of TikTok videos convert to sales best?",
  "How do I handle returns and refunds in dropshipping?",
  "What niches are least saturated right now?",
];

function AskTab() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { mutate, isPending } = useMutation({
    mutationFn: (message: string) => postAI<AskResult>("/ai/ask", { message }),
    onSuccess: (data, message) => {
      setMessages(prev => [...prev, { role: "user", text: message }, { role: "ai", text: data.answer, result: data }]);
    },
    onError: () => toast({ title: "Error", description: "AI request failed. Try again.", variant: "destructive" }),
  });

  const send = (text: string) => {
    if (!text.trim() || isPending) return;
    setInput("");
    mutate(text.trim());
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  return (
    <div className="space-y-4">
      {messages.length === 0 && (
        <SectionCard>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-1">
            <MessageSquare className="w-5 h-5 text-primary" /> Ask the AI Anything
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            Your personal TikTok dropshipping consultant — products, marketing, pricing, suppliers, growth. Ask anything.
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {STARTER_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="text-left rounded-lg border border-border px-3 py-2.5 text-sm hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </SectionCard>
      )}

      {messages.length > 0 && (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div key={i}>
              {m.role === "user" ? (
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[80%]">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 text-sm max-w-[90%] whitespace-pre-wrap">
                    {m.text}
                  </div>
                  {m.result?.actionItems && m.result.actionItems.length > 0 && (
                    <div className="max-w-[90%] rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3">
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2">Do these today</p>
                      <ul className="space-y-1.5">
                        {m.result.actionItems.map((a, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {m.result?.followUpQuestions && m.result.followUpQuestions.length > 0 && (
                    <div className="max-w-[90%] space-y-1">
                      <p className="text-xs text-muted-foreground pl-1">Follow-up questions:</p>
                      <div className="flex flex-wrap gap-2">
                        {m.result.followUpQuestions.map((q, j) => (
                          <button
                            key={j}
                            onClick={() => send(q)}
                            className="text-xs rounded-full border border-border px-3 py-1 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {isPending && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Thinking…</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      <div className="flex gap-2 sticky bottom-0 bg-background pt-2">
        <Input
          placeholder="Ask anything about TikTok dropshipping…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send(input)}
          disabled={isPending}
          className="flex-1"
        />
        <Button size="icon" onClick={() => send(input)} disabled={isPending || !input.trim()}>
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

// ─── Main Advisor page ────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "discover", label: "Discover", icon: Zap, desc: "What to sell now" },
  { id: "marketing", label: "Marketing", icon: Target, desc: "Full strategy" },
  { id: "calendar", label: "Calendar", icon: CalendarDays, desc: "7-day plan" },
  { id: "ask", label: "Ask AI", icon: MessageSquare, desc: "Free-form chat" },
];

export default function Advisor() {
  const [tab, setTab] = useState<Tab>("discover");

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">AI Advisor</h1>
            <p className="text-xs text-muted-foreground">Your personal TikTok dropshipping consultant</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TABS.map(({ id, label, icon: Icon, desc }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-center transition-all",
              tab === id
                ? "border-primary bg-primary/10 text-primary shadow-sm"
                : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-sm font-semibold">{label}</span>
            <span className="text-xs opacity-70 hidden sm:block">{desc}</span>
          </button>
        ))}
      </div>

      {tab === "discover" && <DiscoverTab />}
      {tab === "marketing" && <MarketingTab />}
      {tab === "calendar" && <CalendarTab />}
      {tab === "ask" && <AskTab />}
    </div>
  );
}
