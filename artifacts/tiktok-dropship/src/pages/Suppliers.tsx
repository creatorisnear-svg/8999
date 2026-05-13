import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListSuppliers,
  useCreateSupplier,
  useDeleteSupplier,
  useAiFindSuppliers,
  getListSuppliersQueryKey,
} from "@workspace/api-client-react";
import { Plus, Trash2, Truck, ExternalLink, Sparkles, Loader2, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type SupplierIdea = {
  name: string;
  platform: string;
  url?: string;
  productCategory: string;
  rating?: number;
  minOrderQuantity?: number;
  shippingTime?: string;
  notes?: string;
  whyRecommended: string;
};

export default function Suppliers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: suppliers, isLoading } = useListSuppliers();
  const createSupplier = useCreateSupplier();
  const deleteSupplier = useDeleteSupplier();
  const findSuppliers = useAiFindSuppliers();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", platform: "", url: "", productCategory: "", rating: "", minOrderQuantity: "", shippingTime: "", notes: "" });
  const [aiProduct, setAiProduct] = useState("");
  const [aiCategory, setAiCategory] = useState("");
  const [aiIdeas, setAiIdeas] = useState<SupplierIdea[]>([]);
  const [aiSaved, setAiSaved] = useState<Set<number>>(new Set());

  function handleAdd() {
    if (!form.name || !form.platform || !form.productCategory) {
      toast({ title: "Name, platform, and category are required", variant: "destructive" });
      return;
    }
    createSupplier.mutate({
      data: {
        name: form.name,
        platform: form.platform,
        url: form.url || null,
        productCategory: form.productCategory,
        rating: form.rating ? Number(form.rating) : null,
        minOrderQuantity: form.minOrderQuantity ? Number(form.minOrderQuantity) : null,
        shippingTime: form.shippingTime || null,
        notes: form.notes || null,
      },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSuppliersQueryKey() });
        setShowAdd(false);
        setForm({ name: "", platform: "", url: "", productCategory: "", rating: "", minOrderQuantity: "", shippingTime: "", notes: "" });
        toast({ title: "Supplier saved" });
      },
    });
  }

  function handleDelete(id: number) {
    deleteSupplier.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSuppliersQueryKey() });
        toast({ title: "Supplier removed" });
      },
    });
  }

  function handleAiFind() {
    if (!aiProduct || !aiCategory) {
      toast({ title: "Enter product name and category", variant: "destructive" });
      return;
    }
    findSuppliers.mutate({
      data: { productName: aiProduct, productCategory: aiCategory, count: 5 },
    }, {
      onSuccess: (data) => {
        setAiIdeas(data.suppliers ?? []);
        setAiSaved(new Set());
      },
      onError: () => toast({ title: "AI search failed. Try again.", variant: "destructive" }),
    });
  }

  function handleSaveIdea(idea: SupplierIdea, idx: number) {
    createSupplier.mutate({
      data: {
        name: idea.name,
        platform: idea.platform,
        url: idea.url || null,
        productCategory: idea.productCategory,
        rating: idea.rating ?? null,
        minOrderQuantity: idea.minOrderQuantity ?? null,
        shippingTime: idea.shippingTime || null,
        notes: idea.whyRecommended || idea.notes || null,
      },
    }, {
      onSuccess: () => {
        setAiSaved(s => new Set([...s, idx]));
        queryClient.invalidateQueries({ queryKey: getListSuppliersQueryKey() });
        toast({ title: `"${idea.name}" saved` });
      },
    });
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Suppliers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your dropshipping supplier network</p>
        </div>
        <Button onClick={() => setShowAdd(true)} data-testid="button-add-supplier">
          <Plus className="w-4 h-4 mr-2" /> Add Supplier
        </Button>
      </div>

      <Tabs defaultValue="saved">
        <TabsList>
          <TabsTrigger value="saved" data-testid="tab-saved-suppliers">Saved Suppliers</TabsTrigger>
          <TabsTrigger value="find" data-testid="tab-find-suppliers">AI Supplier Finder</TabsTrigger>
        </TabsList>

        <TabsContent value="saved" className="mt-4 space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
          ) : suppliers?.length === 0 ? (
            <Card><CardContent className="py-14 text-center text-muted-foreground">
              <Truck className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No suppliers saved yet</p>
              <p className="text-sm mt-1">Add manually or use AI Supplier Finder</p>
            </CardContent></Card>
          ) : (
            suppliers?.map((s) => (
              <Card key={s.id} data-testid={`card-supplier-${s.id}`}>
                <CardContent className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{s.name}</h3>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{s.platform}</span>
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{s.productCategory}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                      {s.rating && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {Number(s.rating).toFixed(1)}
                        </span>
                      )}
                      {s.minOrderQuantity && <span className="text-xs text-muted-foreground">MOQ: {s.minOrderQuantity}</span>}
                      {s.shippingTime && <span className="text-xs text-muted-foreground">Ships: {s.shippingTime}</span>}
                      {s.url && (
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline" data-testid={`link-supplier-${s.id}`}>
                          Visit <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    {s.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.notes}</p>}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(s.id)} data-testid={`delete-supplier-${s.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="find" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Product Name *</Label>
                  <Input data-testid="input-ai-product" value={aiProduct} onChange={e => setAiProduct(e.target.value)} placeholder="e.g. LED strip lights" />
                </div>
                <div>
                  <Label>Product Category *</Label>
                  <Input data-testid="input-ai-category" value={aiCategory} onChange={e => setAiCategory(e.target.value)} placeholder="e.g. Home Decor" />
                </div>
              </div>
              <Button onClick={handleAiFind} disabled={findSuppliers.isPending} data-testid="button-find-suppliers">
                {findSuppliers.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Finding...</> : <><Sparkles className="w-4 h-4 mr-2" /> Find Suppliers</>}
              </Button>
            </CardContent>
          </Card>

          {aiIdeas.length > 0 && (
            <div className="space-y-3">
              {aiIdeas.map((idea, idx) => (
                <Card key={idx} data-testid={`card-supplier-idea-${idx}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm">{idea.name}</h3>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{idea.platform}</span>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                          {idea.rating && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{idea.rating}</span>}
                          {idea.minOrderQuantity && <span className="text-xs text-muted-foreground">MOQ: {idea.minOrderQuantity}</span>}
                          {idea.shippingTime && <span className="text-xs text-muted-foreground">Ships: {idea.shippingTime}</span>}
                          {idea.url && <a href={idea.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline"><ExternalLink className="w-3 h-3" />Visit</a>}
                        </div>
                        <p className="text-xs text-muted-foreground">{idea.whyRecommended}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={aiSaved.has(idx) ? "outline" : "default"}
                        disabled={aiSaved.has(idx)}
                        onClick={() => handleSaveIdea(idea, idx)}
                        data-testid={`button-save-supplier-${idx}`}
                      >
                        {aiSaved.has(idx) ? "Saved" : <><Plus className="w-3.5 h-3.5 mr-1.5" />Save</>}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Supplier</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name *</Label>
                <Input data-testid="input-supplier-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Store name" />
              </div>
              <div>
                <Label>Platform *</Label>
                <Input data-testid="input-supplier-platform" value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))} placeholder="AliExpress, CJDropshipping..." />
              </div>
            </div>
            <div>
              <Label>Product Category *</Label>
              <Input data-testid="input-supplier-category" value={form.productCategory} onChange={e => setForm(f => ({ ...f, productCategory: e.target.value }))} placeholder="e.g. Electronics" />
            </div>
            <div>
              <Label>URL</Label>
              <Input data-testid="input-supplier-url" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Rating</Label>
                <Input data-testid="input-supplier-rating" type="number" min="0" max="5" step="0.1" value={form.rating} onChange={e => setForm(f => ({ ...f, rating: e.target.value }))} placeholder="4.8" />
              </div>
              <div>
                <Label>MOQ</Label>
                <Input data-testid="input-supplier-moq" type="number" value={form.minOrderQuantity} onChange={e => setForm(f => ({ ...f, minOrderQuantity: e.target.value }))} placeholder="1" />
              </div>
              <div>
                <Label>Ships In</Label>
                <Input data-testid="input-supplier-shipping" value={form.shippingTime} onChange={e => setForm(f => ({ ...f, shippingTime: e.target.value }))} placeholder="7-14 days" />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea data-testid="input-supplier-notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Optional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={createSupplier.isPending} data-testid="button-submit-supplier">
              {createSupplier.isPending ? "Saving..." : "Save Supplier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
