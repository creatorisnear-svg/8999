import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListCampaigns,
  useCreateCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
  getListCampaignsQueryKey,
} from "@workspace/api-client-react";
import { Plus, Trash2, Megaphone, Copy, Check, MoreHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState as useLocalState } from "react";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  ready: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  posted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

const typeLabels: Record<string, string> = {
  caption: "Caption",
  script: "Script",
  hooks: "Hooks",
  listing: "Listing",
  full_campaign: "Full Campaign",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy} data-testid="button-copy-content">
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </Button>
  );
}

export default function Campaigns() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: campaigns, isLoading } = useListCampaigns();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();

  const [showAdd, setShowAdd] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", contentType: "caption" as const, content: "", hashtags: "", targetAudience: "", status: "draft" as const });

  function handleAdd() {
    if (!form.title || !form.content) {
      toast({ title: "Title and content are required", variant: "destructive" });
      return;
    }
    createCampaign.mutate({
      data: {
        title: form.title,
        contentType: form.contentType,
        content: form.content,
        hashtags: form.hashtags || null,
        targetAudience: form.targetAudience || null,
        status: form.status,
      },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
        setShowAdd(false);
        setForm({ title: "", contentType: "caption", content: "", hashtags: "", targetAudience: "", status: "draft" });
        toast({ title: "Campaign created" });
      },
    });
  }

  function handleStatusChange(id: number, status: "draft" | "ready" | "posted") {
    updateCampaign.mutate({ id, data: { status } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() }),
    });
  }

  function handleDelete(id: number) {
    deleteCampaign.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
        toast({ title: "Campaign deleted" });
      },
    });
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your TikTok marketing content library</p>
        </div>
        <Button onClick={() => setShowAdd(true)} data-testid="button-add-campaign">
          <Plus className="w-4 h-4 mr-2" /> New Campaign
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      ) : campaigns?.length === 0 ? (
        <Card><CardContent className="py-14 text-center text-muted-foreground">
          <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No campaigns yet</p>
          <p className="text-sm mt-1">Create content manually or generate it with AI on the Generator page</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {campaigns?.map((c) => (
            <Card key={c.id} data-testid={`card-campaign-${c.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap cursor-pointer" onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                      <h3 className="font-semibold text-sm">{c.title}</h3>
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{typeLabels[c.contentType] ?? c.contentType}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[c.status]}`}>{c.status}</span>
                    </div>
                    {c.targetAudience && <p className="text-xs text-muted-foreground mt-0.5">Audience: {c.targetAudience}</p>}
                    {expanded === c.id && (
                      <div className="mt-3 space-y-2">
                        <div className="bg-muted/50 rounded-lg p-3 relative">
                          <div className="absolute top-2 right-2">
                            <CopyButton text={c.content} />
                          </div>
                          <p className="text-sm whitespace-pre-wrap pr-8">{c.content}</p>
                        </div>
                        {c.hashtags && (
                          <p className="text-xs text-primary">{c.hashtags}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" data-testid={`menu-campaign-${c.id}`}>
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleStatusChange(c.id, "ready")}>Mark Ready</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(c.id, "posted")}>Mark Posted</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(c.id, "draft")}>Back to Draft</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(c.id)} data-testid={`delete-campaign-${c.id}`}>
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Campaign</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title *</Label>
              <Input data-testid="input-campaign-title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Campaign title" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Content Type</Label>
                <Select value={form.contentType} onValueChange={v => setForm(f => ({ ...f, contentType: v as typeof f.contentType }))}>
                  <SelectTrigger data-testid="select-content-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="caption">Caption</SelectItem>
                    <SelectItem value="script">Script</SelectItem>
                    <SelectItem value="hooks">Hooks</SelectItem>
                    <SelectItem value="listing">Listing</SelectItem>
                    <SelectItem value="full_campaign">Full Campaign</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as typeof f.status }))}>
                  <SelectTrigger data-testid="select-campaign-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="posted">Posted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Content *</Label>
              <Textarea data-testid="input-campaign-content" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} placeholder="Paste or write your content here..." />
            </div>
            <div>
              <Label>Hashtags</Label>
              <Input data-testid="input-campaign-hashtags" value={form.hashtags} onChange={e => setForm(f => ({ ...f, hashtags: e.target.value }))} placeholder="#TikTokShop #Viral" />
            </div>
            <div>
              <Label>Target Audience</Label>
              <Input data-testid="input-campaign-audience" value={form.targetAudience} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))} placeholder="e.g. Women 18-35" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={createCampaign.isPending} data-testid="button-submit-campaign">
              {createCampaign.isPending ? "Creating..." : "Create Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
