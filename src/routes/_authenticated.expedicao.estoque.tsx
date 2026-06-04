import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw, Search, Loader2, Boxes, ArrowDownCircle, ArrowUpCircle, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ReportActions } from "@/components/report-actions";
import { productReport } from "@/lib/report-builders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { stockMovementSchema, type StockMovementForm } from "@/lib/expedicao-schemas";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;
type StockMovement = Tables<"stock_movements">;

const MOV_LABELS: Record<StockMovementForm["type"], { label: string; tone: string }> = {
  entrada: { label: "Entrada", tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  saida: { label: "Saída", tone: "bg-destructive/15 text-destructive" },
  ajuste: { label: "Ajuste", tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  inventario: { label: "Inventário", tone: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
};

export const Route = createFileRoute("/_authenticated/expedicao/estoque")({
  head: () => ({ meta: [{ title: "Estoque — Expedição" }] }),
  component: EstoquePage,
});

function EstoquePage() {
  const qc = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [movingProduct, setMovingProduct] = useState<Product | null>(null);
  const [creatingMovement, setCreatingMovement] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const products = useQuery({
    queryKey: ["products", "stock", search],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("id,name,sku,ean,stock_qty,stock_min,stock_max,stock_location,is_active")
        .order("name")
        .limit(500);
      if (search) q = q.or(`name.ilike.%${search}%,sku.ilike.%${search}%,ean.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as Product[];
    },
  });

  const movements = useQuery({
    queryKey: ["stock_movements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_movements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as StockMovement[];
    },
  });

  const productMap = new Map((products.data ?? []).map((p) => [p.id, p]));

  const lowStock = (products.data ?? []).filter(
    (p) => p.stock_min != null && p.stock_qty <= (p.stock_min ?? 0),
  );

  return (
    <div className="bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Estoque</h1>
            <p className="text-sm text-muted-foreground">
              {products.data?.length ?? 0} produto(s) · {lowStock.length} abaixo do mínimo
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { products.refetch(); movements.refetch(); }}>
              <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
            </Button>
            <Button onClick={() => { setMovingProduct(null); setCreatingMovement(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Nova movimentação
            </Button>
          </div>
        </div>

        <Tabs defaultValue="saldos">
          <TabsList>
            <TabsTrigger value="saldos"><Boxes className="mr-2 h-4 w-4" /> Saldos</TabsTrigger>
            <TabsTrigger value="movimentos"><ArrowDownCircle className="mr-2 h-4 w-4" /> Movimentações</TabsTrigger>
          </TabsList>

          <TabsContent value="saldos" className="space-y-3">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por nome, SKU ou EAN…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <Card>
              <CardContent className="overflow-x-auto p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead className="text-right">Mín</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                      <TableHead className="text-right">Máx</TableHead>
                      <TableHead className="w-[140px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.data?.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">Nenhum produto.</TableCell></TableRow>
                    )}
                    {products.data?.map((p) => {
                      const low = p.stock_min != null && p.stock_qty <= (p.stock_min ?? 0);
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="font-mono text-xs">{p.sku ?? "—"}</TableCell>
                          <TableCell className="text-xs">{p.stock_location ?? "—"}</TableCell>
                          <TableCell className="text-right font-mono text-xs">{p.stock_min ?? "—"}</TableCell>
                          <TableCell className="text-right font-mono text-sm font-semibold">
                            {low ? <Badge variant="destructive">{p.stock_qty}</Badge> : p.stock_qty}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">{p.stock_max ?? "—"}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <ReportActions data={productReport(p)} filename={`produto-${p.sku ?? p.id.slice(0, 8)}`} />
                              <Button size="sm" variant="outline" onClick={() => { setMovingProduct(p); setCreatingMovement(true); }}>
                                <Settings2 className="mr-1 h-3.5 w-3.5" /> Movimentar
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
          </TabsContent>

          <TabsContent value="movimentos">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Últimas movimentações</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead>Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.data?.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Sem movimentações.</TableCell></TableRow>
                    )}
                    {movements.data?.map((m) => {
                      const p = productMap.get(m.product_id);
                      const cfg = MOV_LABELS[m.type as StockMovementForm["type"]];
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="text-xs">{new Date(m.created_at).toLocaleString("pt-BR")}</TableCell>
                          <TableCell className="text-sm">{p?.name ?? m.product_id.slice(0, 8)}</TableCell>
                          <TableCell><Badge className={cfg?.tone}>{cfg?.label ?? m.type}</Badge></TableCell>
                          <TableCell className="text-right font-mono">
                            {m.type === "saida" ? "-" : m.type === "entrada" ? "+" : "±"}{m.qty}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{m.reason ?? "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {creatingMovement && (
          <MovementDialog
            product={movingProduct}
            products={products.data ?? []}
            onClose={() => { setCreatingMovement(false); setMovingProduct(null); }}
            onSaved={() => {
              qc.invalidateQueries({ queryKey: ["products", "stock"] });
              qc.invalidateQueries({ queryKey: ["stock_movements"] });
              setCreatingMovement(false); setMovingProduct(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

function MovementDialog({
  product, products, onClose, onSaved,
}: { product: Product | null; products: Product[]; onClose: () => void; onSaved: () => void }) {
  const form = useForm<StockMovementForm>({
    resolver: zodResolver(stockMovementSchema) as never,
    defaultValues: {
      product_id: product?.id ?? "",
      type: "entrada",
      qty: 1,
      reason: "",
    },
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id ?? null;
      // Insert movement (RLS requires admin/expedicao)
      const { error: movErr } = await supabase.from("stock_movements").insert({
        product_id: values.product_id,
        type: values.type,
        qty: values.qty,
        reason: values.reason || null,
        user_id: userId,
      } as never);
      if (movErr) throw movErr;
      // Update product stock (entrada=+, saida=-, ajuste=set to qty, inventario=set to qty)
      const target = products.find((p) => p.id === values.product_id);
      let newQty = target?.stock_qty ?? 0;
      if (values.type === "entrada") newQty += values.qty;
      else if (values.type === "saida") newQty -= values.qty;
      else newQty = values.qty;
      const { error: upErr } = await supabase
        .from("products")
        .update({ stock_qty: newQty } as never)
        .eq("id", values.product_id);
      if (upErr) throw upErr;
      toast.success("Movimentação registrada");
      onSaved();
    } catch (e) { toast.error((e as Error).message); }
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {form.watch("type") === "entrada" ? <ArrowDownCircle className="h-4 w-4 text-emerald-600" /> : <ArrowUpCircle className="h-4 w-4 text-destructive" />}
            Nova movimentação
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Produto *" error={form.formState.errors.product_id?.message}>
            <Select value={form.watch("product_id")} onValueChange={(v) => form.setValue("product_id", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} · saldo {p.stock_qty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo *">
              <Select value={form.watch("type")} onValueChange={(v) => form.setValue("type", v as StockMovementForm["type"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="ajuste">Ajuste (define saldo)</SelectItem>
                  <SelectItem value="inventario">Inventário (define saldo)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Quantidade *" error={form.formState.errors.qty?.message}>
              <Input type="number" min={1} {...form.register("qty")} />
            </Field>
          </div>
          <Field label="Motivo"><Textarea rows={2} {...form.register("reason")} placeholder="Compra NF-12345, perda, ajuste de contagem…" /></Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar
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
