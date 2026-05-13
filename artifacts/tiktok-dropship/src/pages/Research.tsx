import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAiResearchProducts, useCreateProduct, getListProductsQueryKey } from "@workspace/api-client-react";
import { Sparkles, Plus, TrendingUp, DollarSign, Users, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

function TrendBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-primary" : score >= 60 ? "bg-yellow-500" : "bg-muted-foreground";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-sm font-bold" style={{ minWidth: "2.5rem" }}>{score}/100</span>
    </div>
  );
}

type ProductIdea = {
  name: string;
  description: string;
  category: string;
  estimatedCost: number;
  estimatedSellingPrice: number;
  profitMargin: number;
  trendScore: number;
  whyItWorks: string;
  targetAudience: string;
};

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

  function handleResearch() {
    if (!niche.trim()) {
      toast({ title: "Enter a niche to research", variant: "destructive" });
      return;
    }
    researchMutation.mutate({
      data: {
        niche: niche.trim(),
        budget: budget ? Number(budget) : null,
        count: Number(count),
      },
    }, {
      onSuccess: (data) => {
        setIdeas(data.ideas ?? []);
        setSaved(new Set());
        if (!data.ideas?.length) toast({ title: "No ideas returned. Try a different niche." });
      },
      onError: () => toast({ title: "Research failed. Try again.", variant: "destructive" }),
    });
  }

  function handleSave(idea: ProductIdea, idx: number) {
    createProduct.mutate({
      data: {
        name: idea.name,
        description: idea.description,
        category: idea.category,
        estimatedCost: idea.estimatedCost,
        estimatedSellingPrice: idea.estimatedSellingPrice,
        trendScore: idea.trendScore,
        status: "researching",
        notes: `Why it works: ${idea.whyItWorks}\nTarget audience: ${idea.targetAudience}`,
      },
    }, {
      onSuccess: () => {
        setSaved(s => new Set([...s, idx]));
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast({ title: `"${idea.name}" saved to products` });
      },
    });
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Product Research</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Discover trending products for your TikTok Shop</p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
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
              <Label>Max Budget per Unit ($)</Label>
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
            onClick={handleResearch}
            disabled={researchMutation.isPending}
            className="w-full md:w-auto"
            data-testid="button-research"
          >
            {researchMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Researching...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Research Products</>
            )}
          </Button>
        </CardContent>
      </Card>

      {ideas.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{ideas.length} Product Ideas Found</h2>
          {ideas.map((idea, idx) => (
            <Card key={idx} data-testid={`card-idea-${idx}`} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold">{idea.name}</h3>
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{idea.category}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{idea.description}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5 font-medium">Trend Score</p>
                      <TrendBar score={idea.trendScore} />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <DollarSign className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">Cost</p>
                        <p className="font-bold text-sm">${idea.estimatedCost}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <TrendingUp className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">Price</p>
                        <p className="font-bold text-sm">${idea.estimatedSellingPrice}</p>
                      </div>
                      <div className="bg-primary/10 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Margin</p>
                        <p className="font-bold text-primary text-sm">{idea.profitMargin}%</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Why It Works</p>
                        <p className="text-sm">{idea.whyItWorks}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Target Audience</p>
                        <p className="text-sm">{idea.targetAudience}</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant={saved.has(idx) ? "outline" : "default"}
                    size="sm"
                    disabled={saved.has(idx) || createProduct.isPending}
                    onClick={() => handleSave(idea, idx)}
                    className="flex-shrink-0"
                    data-testid={`button-save-idea-${idx}`}
                  >
                    {saved.has(idx) ? "Saved" : <><Plus className="w-3.5 h-3.5 mr-1.5" /> Save</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!researchMutation.isPending && ideas.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Enter a niche to discover trending products</p>
          <p className="text-sm mt-1">AI will analyze TikTok trends and find profitable opportunities</p>
        </div>
      )}
    </div>
  );
}
