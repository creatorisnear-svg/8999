import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  getListProductsQueryKey,
} from "@workspace/api-client-react";
import { Plus, Trash2, TrendingUp, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusColors: Record<string, string> = {
  researching: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  paused: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  archived: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function TrendBar({ score }: { score: number | null }) {
  if (score == null) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-medium text-muted-foreground">{score}</span>
    </div>
  );
}

export default function Products() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: products, isLoading } = useListProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    estimatedCost: "",
    estimatedSellingPrice: "",
    trendScore: "",
    status: "researching" as const,
    notes: "",
  });

  function resetForm() {
    setForm({ name: "", description: "", category: "", estimatedCost: "", estimatedSellingPrice: "", trendScore: "", status: "researching", notes: "" });
  }

  function handleSubmit() {
    if (!form.name || !form.description || !form.category) {
      toast({ title: "Name, description and category are required", variant: "destructive" });
      return;
    }
    createProduct.mutate({
      data: {
        name: form.name,
        description: form.description,
        category: form.category,
        estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : null,
        estimatedSellingPrice: form.estimatedSellingPrice ? Number(form.estimatedSellingPrice) : null,
        trendScore: form.trendScore ? Number(form.trendScore) : null,
        status: form.status,
        notes: form.notes || null,
      },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        setShowAdd(false);
        resetForm();
        toast({ title: "Product added" });
      },
    });
  }

  function handleDelete(id: number) {
    deleteProduct.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast({ title: "Product deleted" });
      },
    });
  }

  function handleStatusChange(id: number, status: string) {
    updateProduct.mutate({ id, data: { status: status as "researching" | "active" | "paused" | "archived" } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      },
    });
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your dropshipping product catalog</p>
        </div>
        <Button onClick={() => setShowAdd(true)} data-testid="button-add-product">
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : products?.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No products yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add products manually or use AI Research to discover trending items</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {products?.map((p) => (
            <Card key={p.id} data-testid={`card-product-${p.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {(p as any).imageUrl && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                      <img
                        src={(p as any).imageUrl}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{p.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[p.status]}`}>{p.status}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{p.category}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                    <div className="flex items-center gap-5 mt-2 flex-wrap">
                      {p.estimatedCost && (
                        <span className="text-xs text-muted-foreground">Cost: <span className="font-medium text-foreground">${Number(p.estimatedCost).toFixed(2)}</span></span>
                      )}
                      {p.estimatedSellingPrice && (
                        <span className="text-xs text-muted-foreground">Price: <span className="font-medium text-foreground">${Number(p.estimatedSellingPrice).toFixed(2)}</span></span>
                      )}
                      {p.profitMargin && (
                        <span className="text-xs text-muted-foreground">Margin: <span className="font-semibold text-primary">{Number(p.profitMargin).toFixed(1)}%</span></span>
                      )}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Trend:</span>
                        <TrendBar score={p.trendScore ?? 0} />
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" data-testid={`menu-product-${p.id}`}>
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleStatusChange(p.id, "active")}>Mark Active</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(p.id, "paused")}>Pause</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(p.id, "archived")}>Archive</DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(p.id)}
                        data-testid={`delete-product-${p.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name *</Label>
              <Input data-testid="input-product-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Product name" />
            </div>
            <div>
              <Label>Category *</Label>
              <Input data-testid="input-product-category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Beauty, Tech, Home" />
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea data-testid="input-product-description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cost ($)</Label>
                <Input data-testid="input-product-cost" type="number" value={form.estimatedCost} onChange={e => setForm(f => ({ ...f, estimatedCost: e.target.value }))} placeholder="5.99" />
              </div>
              <div>
                <Label>Selling Price ($)</Label>
                <Input data-testid="input-product-price" type="number" value={form.estimatedSellingPrice} onChange={e => setForm(f => ({ ...f, estimatedSellingPrice: e.target.value }))} placeholder="19.99" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Trend Score (0-100)</Label>
                <Input data-testid="input-product-trend" type="number" min="0" max="100" value={form.trendScore} onChange={e => setForm(f => ({ ...f, trendScore: e.target.value }))} placeholder="75" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as typeof f.status }))}>
                  <SelectTrigger data-testid="select-product-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="researching">Researching</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea data-testid="input-product-notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createProduct.isPending} data-testid="button-submit-product">
              {createProduct.isPending ? "Saving..." : "Save Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
