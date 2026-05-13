import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAiGenerateContent,
  useAiGenerateListing,
  useCreateCampaign,
  getListCampaignsQueryKey,
} from "@workspace/api-client-react";
import { Wand2, Copy, Check, Loader2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <Button variant="outline" size="sm" onClick={handleCopy} data-testid="button-copy">
      {copied ? <><Check className="w-3.5 h-3.5 mr-1.5 text-green-500" />Copied</> : <><Copy className="w-3.5 h-3.5 mr-1.5" />{label}</>}
    </Button>
  );
}

type ContentResult = { content: string; hashtags: string; tips: string } | null;
type ListingResult = { title: string; description: string; bulletPoints: string[]; hashtags: string; callToAction: string } | null;

export default function Generator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const generateContent = useAiGenerateContent();
  const generateListing = useAiGenerateListing();
  const createCampaign = useCreateCampaign();

  const [contentForm, setContentForm] = useState({
    productName: "",
    productDescription: "",
    contentType: "caption" as "caption" | "script" | "hooks" | "full_campaign",
    targetAudience: "",
    tone: "trendy" as "funny" | "trendy" | "educational" | "emotional" | "urgency",
  });
  const [contentResult, setContentResult] = useState<ContentResult>(null);

  const [listingForm, setListingForm] = useState({
    productName: "",
    productDescription: "",
    targetAudience: "",
    keyFeatures: "",
  });
  const [listingResult, setListingResult] = useState<ListingResult>(null);

  function handleGenerateContent() {
    if (!contentForm.productName || !contentForm.productDescription) {
      toast({ title: "Product name and description are required", variant: "destructive" });
      return;
    }
    generateContent.mutate({
      data: {
        productName: contentForm.productName,
        productDescription: contentForm.productDescription,
        contentType: contentForm.contentType,
        targetAudience: contentForm.targetAudience || null,
        tone: contentForm.tone,
      },
    }, {
      onSuccess: (data) => setContentResult(data),
      onError: () => toast({ title: "Generation failed. Try again.", variant: "destructive" }),
    });
  }

  function handleSaveContent() {
    if (!contentResult) return;
    createCampaign.mutate({
      data: {
        title: `${contentForm.productName} — ${contentForm.contentType}`,
        contentType: contentForm.contentType,
        content: contentResult.content,
        hashtags: contentResult.hashtags || null,
        targetAudience: contentForm.targetAudience || null,
        status: "draft",
      },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
        toast({ title: "Saved to Campaigns" });
      },
    });
  }

  function handleGenerateListing() {
    if (!listingForm.productName || !listingForm.productDescription) {
      toast({ title: "Product name and description are required", variant: "destructive" });
      return;
    }
    generateListing.mutate({
      data: {
        productName: listingForm.productName,
        productDescription: listingForm.productDescription,
        targetAudience: listingForm.targetAudience || null,
        keyFeatures: listingForm.keyFeatures || null,
      },
    }, {
      onSuccess: (data) => setListingResult(data),
      onError: () => toast({ title: "Generation failed. Try again.", variant: "destructive" }),
    });
  }

  function handleSaveListing() {
    if (!listingResult) return;
    const content = `Title: ${listingResult.title}\n\n${listingResult.description}\n\nKey Benefits:\n${listingResult.bulletPoints.map(b => `• ${b}`).join("\n")}\n\n${listingResult.callToAction}`;
    createCampaign.mutate({
      data: {
        title: `${listingForm.productName} — Listing`,
        contentType: "listing",
        content,
        hashtags: listingResult.hashtags || null,
        targetAudience: listingForm.targetAudience || null,
        status: "draft",
      },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
        toast({ title: "Saved to Campaigns" });
      },
    });
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold">AI Generator</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Generate TikTok marketing content and product listings with AI</p>
      </div>

      <Tabs defaultValue="content">
        <TabsList className="w-full">
          <TabsTrigger value="content" className="flex-1" data-testid="tab-content-generator">TikTok Content</TabsTrigger>
          <TabsTrigger value="listing" className="flex-1" data-testid="tab-listing-generator">Product Listing</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-5 space-y-5">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Generate TikTok Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Product Name *</Label>
                  <Input
                    data-testid="input-content-product-name"
                    value={contentForm.productName}
                    onChange={e => setContentForm(f => ({ ...f, productName: e.target.value }))}
                    placeholder="e.g. LED Night Light Projector"
                  />
                </div>
                <div>
                  <Label>Target Audience</Label>
                  <Input
                    data-testid="input-content-audience"
                    value={contentForm.targetAudience}
                    onChange={e => setContentForm(f => ({ ...f, targetAudience: e.target.value }))}
                    placeholder="e.g. Teen girls, Home owners"
                  />
                </div>
              </div>
              <div>
                <Label>Product Description *</Label>
                <Textarea
                  data-testid="input-content-description"
                  value={contentForm.productDescription}
                  onChange={e => setContentForm(f => ({ ...f, productDescription: e.target.value }))}
                  rows={3}
                  placeholder="Describe your product and its main benefits..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Content Type</Label>
                  <Select value={contentForm.contentType} onValueChange={v => setContentForm(f => ({ ...f, contentType: v as typeof f.contentType }))}>
                    <SelectTrigger data-testid="select-content-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="caption">Caption</SelectItem>
                      <SelectItem value="script">Video Script</SelectItem>
                      <SelectItem value="hooks">Hook Lines (x5)</SelectItem>
                      <SelectItem value="full_campaign">Full Campaign</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tone</Label>
                  <Select value={contentForm.tone} onValueChange={v => setContentForm(f => ({ ...f, tone: v as typeof f.tone }))}>
                    <SelectTrigger data-testid="select-tone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trendy">Trendy</SelectItem>
                      <SelectItem value="funny">Funny</SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                      <SelectItem value="emotional">Emotional</SelectItem>
                      <SelectItem value="urgency">Urgency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleGenerateContent}
                disabled={generateContent.isPending}
                className="w-full"
                data-testid="button-generate-content"
              >
                {generateContent.isPending
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                  : <><Wand2 className="w-4 h-4 mr-2" />Generate Content</>
                }
              </Button>
            </CardContent>
          </Card>

          {contentResult && (
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Generated Content</CardTitle>
                  <div className="flex gap-2">
                    <CopyButton text={contentResult.content} />
                    <Button size="sm" onClick={handleSaveContent} disabled={createCampaign.isPending} data-testid="button-save-content">
                      <Save className="w-3.5 h-3.5 mr-1.5" />
                      {createCampaign.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Content</p>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap" data-testid="text-generated-content">{contentResult.content}</p>
                  </div>
                </div>
                {contentResult.hashtags && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Hashtags</p>
                    <p className="text-sm text-primary" data-testid="text-generated-hashtags">{contentResult.hashtags}</p>
                  </div>
                )}
                {contentResult.tips && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Pro Tips</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-generated-tips">{contentResult.tips}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="listing" className="mt-5 space-y-5">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Generate Product Listing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Product Name *</Label>
                  <Input
                    data-testid="input-listing-product-name"
                    value={listingForm.productName}
                    onChange={e => setListingForm(f => ({ ...f, productName: e.target.value }))}
                    placeholder="e.g. Wireless Earbuds Pro"
                  />
                </div>
                <div>
                  <Label>Target Audience</Label>
                  <Input
                    data-testid="input-listing-audience"
                    value={listingForm.targetAudience}
                    onChange={e => setListingForm(f => ({ ...f, targetAudience: e.target.value }))}
                    placeholder="e.g. Fitness enthusiasts"
                  />
                </div>
              </div>
              <div>
                <Label>Product Description *</Label>
                <Textarea
                  data-testid="input-listing-description"
                  value={listingForm.productDescription}
                  onChange={e => setListingForm(f => ({ ...f, productDescription: e.target.value }))}
                  rows={3}
                  placeholder="Describe the product in detail..."
                />
              </div>
              <div>
                <Label>Key Features</Label>
                <Textarea
                  data-testid="input-listing-features"
                  value={listingForm.keyFeatures}
                  onChange={e => setListingForm(f => ({ ...f, keyFeatures: e.target.value }))}
                  rows={2}
                  placeholder="List key features separated by commas..."
                />
              </div>
              <Button
                onClick={handleGenerateListing}
                disabled={generateListing.isPending}
                className="w-full"
                data-testid="button-generate-listing"
              >
                {generateListing.isPending
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                  : <><Wand2 className="w-4 h-4 mr-2" />Generate Listing</>
                }
              </Button>
            </CardContent>
          </Card>

          {listingResult && (
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Generated Listing</CardTitle>
                  <Button size="sm" onClick={handleSaveListing} disabled={createCampaign.isPending} data-testid="button-save-listing">
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    {createCampaign.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Title</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold flex-1" data-testid="text-listing-title">{listingResult.title}</p>
                    <CopyButton text={listingResult.title} label="Copy" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Description</p>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm whitespace-pre-wrap" data-testid="text-listing-description">{listingResult.description}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Key Benefits</p>
                  <ul className="space-y-1" data-testid="list-listing-bullets">
                    {listingResult.bulletPoints.map((b, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-primary font-bold mt-0.5">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Call to Action</p>
                  <p className="text-sm font-medium" data-testid="text-listing-cta">{listingResult.callToAction}</p>
                </div>
                {listingResult.hashtags && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Hashtags</p>
                    <p className="text-sm text-primary" data-testid="text-listing-hashtags">{listingResult.hashtags}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
