import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Video, Megaphone, Loader2, Copy, Check, ChevronDown, ChevronUp,
  Camera, Music, Clock, Target, DollarSign, Zap, Sparkles, Play,
  ExternalLink, RefreshCw, Film, BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── API helper ───────────────────────────────────────────────────────────────

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

async function postAI<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  function handle() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <Button variant="outline" size="sm" onClick={handle} className="shrink-0">
      {copied
        ? <><Check className="w-3.5 h-3.5 mr-1.5 text-green-500" />Copied</>
        : <><Copy className="w-3.5 h-3.5 mr-1.5" />{label}</>}
    </Button>
  );
}

// ─── Shared card ─────────────────────────────────────────────────────────────

function SCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4 sm:p-5", className)}>
      {children}
    </div>
  );
}

function SLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{children}</p>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Scene = {
  sceneNumber: number;
  timestamp: string;
  name: string;
  whatToFilm: string;
  whatToSay: string;
  cameraAngle: string;
  textOverlay: string;
  tip: string;
};

type VideoPackage = {
  videoTitle: string;
  concept: string;
  estimatedViews: string;
  thumbnailImageUrl?: string;
  hook: { line: string; action: string; textOverlay: string };
  scenes: Scene[];
  fullScript: string;
  caption: string;
  hashtags: string;
  music: { recommendation: string; tip: string };
  editingInstructions: string[];
  postingStrategy: { bestTime: string; firstCommentToPin: string; replyStrategy: string };
  hookVariants: string[];
};

type AdPackage = {
  campaignName: string;
  objective: string;
  adFormats: Array<{ format: string; whyUseIt: string; specs: string }>;
  targeting: {
    ageRange: string;
    genders: string;
    interests: string[];
    behaviors: string[];
    customAudience: string;
    lookalike: string;
  };
  budget: { dailyBudget: string; testingPhase: string; scalingThreshold: string };
  adVariants: Array<{
    variantName: string;
    hook: string;
    script: string;
    textOverlay: string;
    caption: string;
    cta: string;
  }>;
  landingPage: { recommendation: string; tip: string };
  kpis: { ctr: string; cpc: string; roas: string; cpm: string };
  stepByStep: string[];
  proTips: string[];
};

// ─── Video Studio Tab ─────────────────────────────────────────────────────────

function VideoStudioTab() {
  const { toast } = useToast();
  const [form, setForm] = useState({
    productName: "",
    productDescription: "",
    targetAudience: "",
    videoStyle: "product-demo",
    duration: "15-30",
  });
  const [result, setResult] = useState<VideoPackage | null>(null);
  const [expandedScene, setExpandedScene] = useState<number | null>(0);

  const { mutate, isPending } = useMutation({
    mutationFn: () => postAI<VideoPackage>("/ai/generate-video", {
      productName: form.productName,
      productDescription: form.productDescription,
      targetAudience: form.targetAudience || undefined,
      videoStyle: form.videoStyle,
      duration: `${form.duration} seconds`,
    }),
    onSuccess: (data) => { setResult(data); setExpandedScene(0); },
    onError: () => toast({ title: "Failed to generate video plan. Try again.", variant: "destructive" }),
  });

  const styleLabels: Record<string, string> = {
    "product-demo": "Product Demo",
    "unboxing": "Unboxing / Reaction",
    "transformation": "Before & After",
    "problem-solution": "Problem → Solution",
    "testimonial": "Testimonial Style",
    "trend": "Trending Format / POV",
  };

  return (
    <div className="space-y-5">
      {/* Form */}
      <SCard>
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Film className="w-4 h-4 text-primary" /> Video Production Details
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Product name *</label>
            <Input
              placeholder="e.g. Magnetic Phone Mount"
              value={form.productName}
              onChange={e => setForm(f => ({ ...f, productName: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">What does it do? Who is it for? *</label>
            <Textarea
              rows={2}
              placeholder="e.g. A super-strong magnetic phone mount for cars, perfect for commuters and Uber drivers who need hands-free navigation"
              value={form.productDescription}
              onChange={e => setForm(f => ({ ...f, productDescription: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Target audience (optional)</label>
            <Input
              placeholder="e.g. Women 25-40 who love home decor"
              value={form.targetAudience}
              onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Video length</label>
            <Select value={form.duration} onValueChange={v => setForm(f => ({ ...f, duration: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="9-15">9–15 seconds (highest engagement)</SelectItem>
                <SelectItem value="15-30">15–30 seconds (recommended)</SelectItem>
                <SelectItem value="30-60">30–60 seconds (more detail)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Video style</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(styleLabels).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setForm(f => ({ ...f, videoStyle: val }))}
                  className={cn(
                    "text-xs px-3 py-2 rounded-lg border font-medium transition-all text-left",
                    form.videoStyle === val
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <Button
          className="mt-4 w-full sm:w-auto"
          onClick={() => mutate()}
          disabled={isPending || !form.productName || !form.productDescription}
          size="lg"
        >
          {isPending
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating your video plan…</>
            : <><Video className="w-4 h-4 mr-2" />Generate Video Plan</>}
        </Button>
      </SCard>

      {isPending && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium">AI is writing your complete video production plan…</p>
          <p className="text-xs">Every scene, every word, every camera angle — ready to film</p>
        </div>
      )}

      {result && !isPending && (
        <div className="space-y-5">
          {/* Overview */}
          <div className="grid sm:grid-cols-3 gap-3">
            <SCard className="sm:col-span-2 border-primary/30 bg-primary/5">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">{result.videoTitle}</p>
              <p className="text-sm">{result.concept}</p>
              <div className="mt-2 flex items-center gap-2">
                <BarChart2 className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">{result.estimatedViews} estimated</span>
              </div>
            </SCard>
            <SCard className="flex flex-col gap-2 justify-center">
              <div>
                <p className="text-xs text-muted-foreground">Best post time</p>
                <p className="text-sm font-semibold">{result.postingStrategy?.bestTime}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Music vibe</p>
                <p className="text-sm font-semibold">{result.music?.recommendation}</p>
              </div>
            </SCard>
          </div>

          {/* Hook */}
          <SCard className="border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950/20">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <SLabel>⚡ Your Hook — First 3 Seconds (Most Important)</SLabel>
                <p className="text-base font-bold mb-2">"{result.hook?.line}"</p>
                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">What to do physically:</p>
                    <p>{result.hook?.action}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Text to show on screen:</p>
                    <p className="font-mono bg-background px-2 py-0.5 rounded text-xs inline-block">{result.hook?.textOverlay}</p>
                  </div>
                </div>
              </div>
              <CopyBtn text={result.hook?.line ?? ""} label="Copy hook" />
            </div>

            {/* Hook variants */}
            {result.hookVariants?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-yellow-200 dark:border-yellow-800">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Alternative hooks to A/B test:</p>
                <div className="space-y-1.5">
                  {result.hookVariants.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 bg-background/60 rounded px-2.5 py-1.5">
                      <p className="text-sm italic flex-1">"{h}"</p>
                      <CopyBtn text={h} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SCard>

          {/* Scene-by-scene storyboard */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" /> Scene-by-Scene Storyboard
              <span className="text-xs text-muted-foreground font-normal ml-1">— click each scene to expand</span>
            </h3>
            <div className="space-y-2">
              {result.scenes?.map((scene, i) => (
                <div key={i} className="border border-border rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedScene(expandedScene === i ? null : i)}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-black shrink-0">
                      {scene.sceneNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{scene.name}</span>
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{scene.timestamp}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{scene.whatToSay}</p>
                    </div>
                    {expandedScene === i ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </button>

                  {expandedScene === i && (
                    <div className="border-t border-border px-4 py-4 bg-muted/20 grid sm:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">📸 What to film</p>
                          <p className="text-sm">{scene.whatToFilm}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">🎤 What to say</p>
                          <div className="flex items-start gap-2 bg-background rounded-lg px-3 py-2">
                            <p className="text-sm italic flex-1">"{scene.whatToSay}"</p>
                            <CopyBtn text={scene.whatToSay} />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">📐 Camera angle</p>
                          <p className="text-sm">{scene.cameraAngle}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">📝 Text on screen</p>
                          <p className="text-sm font-mono bg-background px-2 py-1 rounded text-xs">{scene.textOverlay}</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
                          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-0.5">💡 Pro tip</p>
                          <p className="text-xs text-blue-800 dark:text-blue-300">{scene.tip}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Full script */}
          <SCard>
            <div className="flex items-center justify-between mb-3">
              <SLabel>📄 Full Script — Read straight from this</SLabel>
              <CopyBtn text={result.fullScript ?? ""} label="Copy full script" />
            </div>
            <div className="bg-muted/40 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap leading-relaxed">
              {result.fullScript}
            </div>
          </SCard>

          {/* Caption + Hashtags */}
          <div className="grid sm:grid-cols-2 gap-4">
            <SCard>
              <div className="flex items-center justify-between mb-2">
                <SLabel>Caption</SLabel>
                <CopyBtn text={result.caption ?? ""} />
              </div>
              <p className="text-sm">{result.caption}</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-primary">{result.hashtags}</p>
                <CopyBtn text={result.hashtags ?? ""} label="Copy tags" />
              </div>
            </SCard>
            <SCard>
              <SLabel><Music className="inline w-3 h-3 mr-1" />Music & Sound</SLabel>
              <p className="text-sm font-semibold mb-1">{result.music?.recommendation}</p>
              <p className="text-xs text-muted-foreground">{result.music?.tip}</p>
            </SCard>
          </div>

          {/* Editing instructions */}
          <SCard>
            <SLabel>✂️ Editing Instructions (step by step)</SLabel>
            <ol className="space-y-2">
              {result.editingInstructions?.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </SCard>

          {/* Posting strategy */}
          <SCard className="border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/20">
            <SLabel>🚀 Posting Strategy — Do this immediately after uploading</SLabel>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Best time to post:</p>
                <p className="text-sm font-semibold">{result.postingStrategy?.bestTime}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Pin this comment (boosts engagement):</p>
                <div className="flex items-center gap-2 bg-background/60 rounded px-2.5 py-1.5 mt-1">
                  <p className="text-sm italic flex-1">"{result.postingStrategy?.firstCommentToPin}"</p>
                  <CopyBtn text={result.postingStrategy?.firstCommentToPin ?? ""} />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Comment reply strategy:</p>
                <p className="text-sm">{result.postingStrategy?.replyStrategy}</p>
              </div>
            </div>
          </SCard>

          {/* Thumbnail image */}
          {result.thumbnailImageUrl && (
            <SCard>
              <SLabel>🖼️ Product Image Reference</SLabel>
              <div className="flex items-start gap-4">
                <img
                  src={result.thumbnailImageUrl}
                  alt={form.productName}
                  className="w-24 h-24 rounded-lg object-cover border border-border"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div className="space-y-1">
                  <p className="text-sm">Use this as a style reference for your video thumbnail and cover image.</p>
                  <p className="text-xs text-muted-foreground">In TikTok, your cover frame is the first thing people see in your profile — choose the most visually striking frame.</p>
                </div>
              </div>
            </SCard>
          )}

          {/* Reset */}
          <div className="flex justify-center pt-2">
            <Button variant="outline" onClick={() => setResult(null)}>
              <RefreshCw className="w-4 h-4 mr-2" />Create another video plan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TikTok Ads Tab ───────────────────────────────────────────────────────────

function TikTokAdsTab() {
  const { toast } = useToast();
  const [form, setForm] = useState({
    productName: "",
    productDescription: "",
    targetAudience: "",
    budget: "",
    goal: "sales",
  });
  const [result, setResult] = useState<AdPackage | null>(null);
  const [expandedVariant, setExpandedVariant] = useState<number | null>(0);

  const { mutate, isPending } = useMutation({
    mutationFn: () => postAI<AdPackage>("/ai/generate-ad", {
      productName: form.productName,
      productDescription: form.productDescription,
      targetAudience: form.targetAudience || undefined,
      budget: form.budget ? `$${form.budget}/day` : undefined,
      goal: form.goal,
    }),
    onSuccess: (data) => { setResult(data); setExpandedVariant(0); },
    onError: () => toast({ title: "Failed to generate ad package. Try again.", variant: "destructive" }),
  });

  return (
    <div className="space-y-5">
      {/* Explainer */}
      <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4">
        <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">How this works</p>
        <p className="text-xs text-blue-700 dark:text-blue-400">
          The AI writes your complete TikTok ad — targeting settings, ad scripts, captions, and budget. You copy it into{" "}
          <a href="https://ads.tiktok.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">
            TikTok Ads Manager <ExternalLink className="inline w-3 h-3" />
          </a>{" "}
          and run it. No guessing — everything is ready to paste.
        </p>
      </div>

      {/* Form */}
      <SCard>
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-primary" /> Your Product Info
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Product name *</label>
            <Input
              placeholder="e.g. LED Galaxy Projector"
              value={form.productName}
              onChange={e => setForm(f => ({ ...f, productName: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">What is it and who buys it? *</label>
            <Textarea
              rows={2}
              placeholder="e.g. A galaxy star projector for bedrooms — teens and young adults who want aesthetic room lighting for under $40"
              value={form.productDescription}
              onChange={e => setForm(f => ({ ...f, productDescription: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Target audience (optional)</label>
            <Input
              placeholder="e.g. Women 18-30 interested in home decor"
              value={form.targetAudience}
              onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Daily budget ($)</label>
            <Input
              type="number"
              placeholder="e.g. 20"
              value={form.budget}
              onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Campaign goal</label>
            <div className="flex gap-2 flex-wrap">
              {[["sales", "Drive Sales"], ["traffic", "Get Website Traffic"], ["awareness", "Build Brand Awareness"]].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setForm(f => ({ ...f, goal: val }))}
                  className={cn(
                    "text-xs px-3 py-2 rounded-lg border font-medium transition-all",
                    form.goal === val
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <Button
          className="mt-4 w-full sm:w-auto"
          onClick={() => mutate()}
          disabled={isPending || !form.productName || !form.productDescription}
          size="lg"
        >
          {isPending
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Writing your ad…</>
            : <><Sparkles className="w-4 h-4 mr-2" />Generate Ad Package</>}
        </Button>
      </SCard>

      {isPending && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium">AI is writing your complete TikTok ad campaign…</p>
          <p className="text-xs">3 ad variants, targeting settings, and step-by-step launch guide</p>
        </div>
      )}

      {result && !isPending && (
        <div className="space-y-5">
          {/* Campaign overview */}
          <div className="grid sm:grid-cols-3 gap-3">
            <SCard className="sm:col-span-2 border-primary/30 bg-primary/5">
              <SLabel>Campaign</SLabel>
              <p className="text-base font-bold mb-1">{result.campaignName}</p>
              <p className="text-sm text-muted-foreground">{result.objective}</p>
            </SCard>
            <SCard>
              <SLabel>Budget guide</SLabel>
              <div className="space-y-1">
                <div><p className="text-xs text-muted-foreground">Start with</p><p className="text-sm font-bold">{result.budget?.dailyBudget}</p></div>
                <div><p className="text-xs text-muted-foreground">Scale when</p><p className="text-xs">{result.budget?.scalingThreshold}</p></div>
              </div>
            </SCard>
          </div>

          {/* Targeting */}
          <SCard>
            <SLabel><Target className="inline w-3 h-3 mr-1" />Who to target in Ads Manager</SLabel>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div><p className="text-xs text-muted-foreground">Age range</p><p className="text-sm font-semibold">{result.targeting?.ageRange}</p></div>
                <div><p className="text-xs text-muted-foreground">Gender</p><p className="text-sm font-semibold">{result.targeting?.genders}</p></div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Behaviors</p>
                  <div className="flex flex-wrap gap-1">
                    {result.targeting?.behaviors?.map((b, i) => (
                      <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full">{b}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Interest categories to select</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.targeting?.interests?.map((interest, i) => (
                    <span key={i} className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium">
                      {interest}
                    </span>
                  ))}
                </div>
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Retargeting</p>
                  <p className="text-xs">{result.targeting?.customAudience}</p>
                </div>
              </div>
            </div>
          </SCard>

          {/* Expected performance */}
          <SCard>
            <SLabel><BarChart2 className="inline w-3 h-3 mr-1" />Expected Performance Metrics</SLabel>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Click Rate (CTR)", value: result.kpis?.ctr },
                { label: "Cost per Click", value: result.kpis?.cpc },
                { label: "Target ROAS", value: result.kpis?.roas },
                { label: "Cost per 1K Views", value: result.kpis?.cpm },
              ].map(({ label, value }) => (
                <div key={label} className="bg-muted/40 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className="text-sm font-bold">{value}</p>
                </div>
              ))}
            </div>
          </SCard>

          {/* Ad variants */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Play className="w-4 h-4 text-primary" /> 3 Ad Variants — Copy and test all three
            </h3>
            <div className="space-y-2">
              {result.adVariants?.map((v, i) => (
                <div key={i} className="border border-border rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedVariant(expandedVariant === i ? null : i)}
                  >
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + i)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{v.variantName}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">Hook: "{v.hook}"</p>
                    </div>
                    {expandedVariant === i ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </button>
                  {expandedVariant === i && (
                    <div className="border-t border-border px-4 py-4 bg-muted/20 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">🎣 Opening hook (first 3 seconds)</p>
                        <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg px-3 py-2">
                          <p className="text-sm italic font-medium flex-1">"{v.hook}"</p>
                          <CopyBtn text={v.hook} />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">📝 Full ad script</p>
                        <div className="flex items-start gap-2 bg-background rounded-lg px-3 py-2">
                          <p className="text-sm flex-1 whitespace-pre-wrap">{v.script}</p>
                          <CopyBtn text={v.script} />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">📱 Text overlay on screen</p>
                          <p className="text-sm font-mono bg-background px-2 py-1 rounded">{v.textOverlay}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">📣 Ad caption</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm flex-1">{v.caption}</p>
                            <CopyBtn text={v.caption} />
                          </div>
                        </div>
                      </div>
                      <div className="inline-block bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
                        CTA Button: {v.cta}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step-by-step guide */}
          <SCard className="border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/20">
            <SLabel>✅ Step-by-Step: How to Launch This Ad Right Now</SLabel>
            <ol className="space-y-2">
              {result.stepByStep?.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            <div className="mt-4">
              <a
                href="https://ads.tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-black text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Open TikTok Ads Manager <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </SCard>

          {/* Pro tips */}
          <SCard>
            <SLabel>💡 Pro Tips for This Campaign</SLabel>
            <ul className="space-y-2">
              {result.proTips?.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Zap className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  {tip}
                </li>
              ))}
            </ul>
          </SCard>

          {/* Ad formats */}
          <SCard>
            <SLabel>📺 Ad Formats to Use</SLabel>
            <div className="grid sm:grid-cols-2 gap-3">
              {result.adFormats?.map((f, i) => (
                <div key={i} className="bg-muted/40 rounded-lg p-3">
                  <p className="text-sm font-semibold mb-1">{f.format}</p>
                  <p className="text-xs text-muted-foreground mb-1.5">{f.whyUseIt}</p>
                  <p className="text-xs bg-background px-2 py-1 rounded font-mono">{f.specs}</p>
                </div>
              ))}
            </div>
          </SCard>

          {/* Landing page */}
          <SCard>
            <SLabel>🛒 Landing Page Tip</SLabel>
            <p className="text-sm font-semibold mb-1">{result.landingPage?.recommendation}</p>
            <p className="text-sm text-muted-foreground">{result.landingPage?.tip}</p>
          </SCard>

          <div className="flex justify-center pt-2">
            <Button variant="outline" onClick={() => setResult(null)}>
              <RefreshCw className="w-4 h-4 mr-2" />Create another ad
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdsVideos() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Ads & Video Studio</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          AI writes your complete TikTok video plan and ad campaign — ready to film and launch
        </p>
      </div>

      <Tabs defaultValue="video">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="video" className="flex-1 sm:flex-none gap-2">
            <Video className="w-4 h-4" />Video Studio
          </TabsTrigger>
          <TabsTrigger value="ads" className="flex-1 sm:flex-none gap-2">
            <Megaphone className="w-4 h-4" />TikTok Ads
          </TabsTrigger>
        </TabsList>

        <TabsContent value="video" className="mt-5">
          <VideoStudioTab />
        </TabsContent>

        <TabsContent value="ads" className="mt-5">
          <TikTokAdsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
