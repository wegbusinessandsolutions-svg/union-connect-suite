import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, RefreshCw, Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { productSchema, type ProductForm } from "@/lib/comercial-schemas";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

export const Route = createFileRoute("/_authenticated/comercial/produtos")({
  head: () => ({ meta: [{ title: "Produtos — Comercial" }] }),
  component: ProdutosPage,
});

function ProdutosPage() {
  const qc = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Product | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const list = useQuery({
    queryKey: ["products", search],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (search) q = q.or(`name.ilike.%${search}%,sku.ilike.%${search}%,ean.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as Product[];
    },
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produto excluído");
      qc.invalidateQueries({ queryKey: ["products"] });
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
            <p className="text-sm text-muted-foreground">Catálogo, preços por tier e controle de estoque.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => list.refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
            </Button>
            <Button onClick={() => setCreating(true)}>
              <Plus className="mr-2 h-4 w-4" /> Novo produto
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-base">
              {list.isFetching ? "Carregando…" : `${list.data?.length ?? 0} produto(s)`}
            </CardTitle>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, SKU ou EAN…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-80 pl-8"
              />
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Preço venda</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Cashback</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[110px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.isError && (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-red-600">
                    {(list.error as Error).message}
                  </TableCell></TableRow>
                )}
                {!list.isError && list.data?.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    Nenhum produto cadastrado.
                  </TableCell></TableRow>
                )}
                {list.data?.map((p) => {
                  const lowStock = p.stock_min != null && p.stock_qty <= p.stock_min;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {p.image_main_url ? (
                            <img src={p.image_main_url} alt="" className="h-10 w-10 rounded object-cover" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{p.name}</div>
                            <div className="text-xs text-muted-foreground">{p.brand ?? ""}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{p.sku ?? "—"}</TableCell>
                      <TableCell className="font-mono">R$ {Number(p.price_sale).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={lowStock ? "destructive" : "secondary"}>{p.stock_qty}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{Number(p.cashback_pct ?? 0).toFixed(2)}%</TableCell>
                      <TableCell>
                        {p.is_active ? <Badge variant="secondary">Ativo</Badge> : <Badge variant="outline">Inativo</Badge>}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setEditing(p)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setToDelete(p)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {(creating || editing) && (
        <ProductFormDialog
          product={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["products"] });
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Produto: <b>{toDelete?.name}</b>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toDelete && delMut.mutate(toDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProductFormDialog({
  product, onClose, onSaved,
}: {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!product;
  const categoriesQ = useQuery({
    queryKey: ["product_categories", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("product_categories").select("id,name").order("name");
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema) as never,
    defaultValues: product
      ? {
          name: product.name,
          category_id: product.category_id ?? null,
          sku: product.sku ?? "",
          ean: product.ean ?? "",
          brand: product.brand ?? "",
          description_short: product.description_short ?? "",
          description_long: product.description_long ?? "",
          image_main_url: product.image_main_url ?? "",
          unit_measure: product.unit_measure ?? "",
          weight_kg: product.weight_kg ?? undefined,
          cost_last: product.cost_last ?? undefined,
          price_sale: Number(product.price_sale),
          price_min: product.price_min ?? undefined,
          price_bronze: product.price_bronze ?? undefined,
          price_prata: product.price_prata ?? undefined,
          price_ouro: product.price_ouro ?? undefined,
          price_diamante: product.price_diamante ?? undefined,
          cashback_pct: Number(product.cashback_pct ?? 0),
          stock_qty: product.stock_qty,
          stock_min: product.stock_min ?? undefined,
          stock_location: product.stock_location ?? "",
          is_active: product.is_active,
        }
      : {
          name: "",
          category_id: null,
          price_sale: 0,
          cashback_pct: 0,
          stock_qty: 0,
          is_active: true,
        },
  });

  const submit = form.handleSubmit(async (values) => {
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(values)) {
      payload[k] = v === "" || v === undefined ? null : v;
    }
    // Ensure required NOT NULL fields aren't nullified.
    payload.name = values.name;
    payload.price_sale = values.price_sale;
    payload.stock_qty = values.stock_qty;
    payload.is_active = values.is_active;
    payload.cashback_pct = values.cashback_pct ?? 0;

    try {
      if (isEdit) {
        const { error } = await supabase.from("products").update(payload as never).eq("id", product!.id);
        if (error) throw error;
        toast.success("Produto atualizado");
      } else {
        const { error } = await supabase.from("products").insert(payload as never);
        if (error) throw error;
        toast.success("Produto criado");
      }
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    }
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar produto" : "Novo produto"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <Tabs defaultValue="basic">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="prices">Preços</TabsTrigger>
              <TabsTrigger value="stock">Estoque</TabsTrigger>
              <TabsTrigger value="media">Mídia</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-3 pt-3">
              <Field label="Nome *" error={form.formState.errors.name?.message}>
                <Input {...form.register("name")} />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="SKU"><Input {...form.register("sku")} /></Field>
                <Field label="EAN"><Input {...form.register("ean")} /></Field>
                <Field label="Marca"><Input {...form.register("brand")} /></Field>
              </div>
              <Field label="Categoria">
                <Select
                  value={form.watch("category_id") ?? "none"}
                  onValueChange={(v) => form.setValue("category_id", v === "none" ? null : v)}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Nenhuma —</SelectItem>
                    {categoriesQ.data?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Descrição curta">
                <Input {...form.register("description_short")} />
              </Field>
              <Field label="Descrição longa">
                <Textarea rows={4} {...form.register("description_long")} />
              </Field>
              <div className="flex items-center gap-2">
                <Switch checked={form.watch("is_active")} onCheckedChange={(v) => form.setValue("is_active", v)} />
                <Label>Ativo (visível no catálogo)</Label>
              </div>
            </TabsContent>

            <TabsContent value="prices" className="space-y-3 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Custo último"><Input type="number" step="0.01" {...form.register("cost_last")} /></Field>
                <Field label="Preço venda *" error={form.formState.errors.price_sale?.message}>
                  <Input type="number" step="0.01" {...form.register("price_sale")} />
                </Field>
                <Field label="Preço mínimo"><Input type="number" step="0.01" {...form.register("price_min")} /></Field>
                <Field label="Cashback %"><Input type="number" step="0.01" {...form.register("cashback_pct")} /></Field>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <Field label="Bronze"><Input type="number" step="0.01" {...form.register("price_bronze")} /></Field>
                <Field label="Prata"><Input type="number" step="0.01" {...form.register("price_prata")} /></Field>
                <Field label="Ouro"><Input type="number" step="0.01" {...form.register("price_ouro")} /></Field>
                <Field label="Diamante"><Input type="number" step="0.01" {...form.register("price_diamante")} /></Field>
              </div>
            </TabsContent>

            <TabsContent value="stock" className="space-y-3 pt-3">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Qtd atual *"><Input type="number" {...form.register("stock_qty")} /></Field>
                <Field label="Estoque mínimo"><Input type="number" {...form.register("stock_min")} /></Field>
                <Field label="Localização"><Input {...form.register("stock_location")} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Unidade (UN/KG/L)"><Input {...form.register("unit_measure")} /></Field>
                <Field label="Peso (kg)"><Input type="number" step="0.001" {...form.register("weight_kg")} /></Field>
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-3 pt-3">
              <Field label="URL imagem principal" error={form.formState.errors.image_main_url?.message}>
                <Input placeholder="https://…" {...form.register("image_main_url")} />
              </Field>
              {form.watch("image_main_url") && (
                <img
                  src={form.watch("image_main_url") || ""}
                  alt="preview"
                  className="h-40 w-40 rounded border object-cover"
                />
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
