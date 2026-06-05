import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, RefreshCw, Loader2, Search } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { orderSchema, type OrderForm } from "@/lib/comercial-schemas";
import { ReportActions } from "@/components/report-actions";
import { orderReport } from "@/lib/report-builders";
import type { Tables } from "@/integrations/supabase/types";

type OrderRow = Tables<"sale_orders"> & {
  clients?: Pick<Tables<"clients">, "id" | "name"> | null;
};
type Client = Pick<Tables<"clients">, "id" | "name" | "tier" | "cashback_balance">;
type Product = Pick<Tables<"products">, "id" | "name" | "sku" | "price_sale" | "stock_qty">;

export const Route = createFileRoute("/_authenticated/comercial/pedidos")({
  head: () => ({ meta: [{ title: "Pedidos — Comercial" }] }),
  component: PedidosPage,
});

const STATUS_BADGE: Record<string, string> = {
  rascunho: "bg-slate-100 text-slate-800",
  confirmado: "bg-blue-100 text-blue-800",
  separando: "bg-amber-100 text-amber-800",
  em_rota: "bg-indigo-100 text-indigo-800",
  entregue: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
};
const STATUS_OPTIONS = ["rascunho", "confirmado", "separando", "em_rota", "entregue", "cancelado"] as const;

function PedidosPage() {
  const qc = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const list = useQuery({
    queryKey: ["sale_orders", search],
    queryFn: async () => {
      let q = supabase
        .from("sale_orders")
        .select("*, clients(id,name)")
        .order("created_at", { ascending: false })
        .limit(200);
      const { data, error } = await q;
      if (error) throw error;
      let rows = (data ?? []) as OrderRow[];
      if (search) {
        const s = search.toLowerCase();
        rows = rows.filter(
          (r) =>
            String(r.order_number).includes(s) ||
            (r.clients?.name ?? "").toLowerCase().includes(s),
        );
      }
      return rows;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (vars: { id: string; status: string }) => {
      const { error } = await supabase
        .from("sale_orders")
        .update({ status: vars.status as never })
        .eq("id", vars.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status atualizado");
      qc.invalidateQueries({ queryKey: ["sale_orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pedidos</h1>
            <p className="text-sm text-muted-foreground">
              Vendas, status, descontos e cashback. Ao confirmar um pedido o estoque é baixado automaticamente.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => list.refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
            </Button>
            <Button onClick={() => setCreating(true)}>
              <Plus className="mr-2 h-4 w-4" /> Novo pedido
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-base">
              {list.isFetching ? "Carregando…" : `${list.data?.length ?? 0} pedido(s)`}
            </CardTitle>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar nº ou cliente…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-72 pl-8"
              />
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado</TableHead>
                  <TableHead className="w-[110px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.isError && (
                  <TableRow><TableCell colSpan={8} className="py-8 text-center text-sm text-red-600">
                    {(list.error as Error).message}
                  </TableCell></TableRow>
                )}
                {!list.isError && list.data?.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    Nenhum pedido ainda.
                  </TableCell></TableRow>
                )}
                {list.data?.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono font-medium">#{o.order_number}</TableCell>
                    <TableCell>{o.clients?.name ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline">{o.type}</Badge></TableCell>
                    <TableCell className="font-mono">R$ {Number(o.total).toFixed(2)}</TableCell>
                    <TableCell className="text-xs">
                      {o.payment_method ?? "—"}{" "}
                      {o.installments && o.installments > 1 ? `(${o.installments}x)` : ""}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={o.status}
                        onValueChange={(v) => updateStatus.mutate({ id: o.id, status: v })}
                      >
                        <SelectTrigger className={`h-8 w-[140px] ${STATUS_BADGE[o.status] ?? ""}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs">
                      {format(new Date(o.created_at), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <ReportActions
                          data={orderReport(o)}
                          filename={`pedido-${o.order_number}`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {creating && (
        <OrderFormDialog
          onClose={() => setCreating(false)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["sale_orders"] });
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}

function OrderFormDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const form = useForm<OrderForm>({
    resolver: zodResolver(orderSchema) as never,
    defaultValues: {
      client_id: "",
      type: "pdv",
      payment_method: "",
      installments: 1,
      discount_pct: 0,
      cashback_used: 0,
      notes: "",
      items: [],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

  const clients = useQuery({
    queryKey: ["clients-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id,name,tier,cashback_balance")
        .eq("is_active", true)
        .order("name")
        .limit(500);
      if (error) throw error;
      return data as Client[];
    },
  });

  const products = useQuery({
    queryKey: ["products-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,sku,price_sale,stock_qty")
        .eq("is_active", true)
        .order("name")
        .limit(1000);
      if (error) throw error;
      return data as Product[];
    },
  });

  const items = form.watch("items");
  const discountPct = Number(form.watch("discount_pct") || 0);
  const cashbackUsed = Number(form.watch("cashback_used") || 0);

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, it) => {
      const line = Number(it.qty || 0) * Number(it.unit_price || 0);
      const disc = line * (Number(it.discount_pct || 0) / 100);
      return acc + (line - disc);
    }, 0);
    const orderDiscount = subtotal * (discountPct / 100);
    const total = Math.max(0, subtotal - orderDiscount - cashbackUsed);
    return { subtotal, orderDiscount, total };
  }, [items, discountPct, cashbackUsed]);

  const submit = form.handleSubmit(async (values) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      const { data: order, error: oerr } = await supabase
        .from("sale_orders")
        .insert({
          client_id: values.client_id,
          user_id: userId,
          type: values.type,
          status: "rascunho",
          payment_method: values.payment_method || null,
          installments: values.installments,
          discount_pct: values.discount_pct,
          discount_value: totals.orderDiscount,
          cashback_used: values.cashback_used,
          subtotal: totals.subtotal,
          total: totals.total,
          notes: values.notes || null,
        } as never)
        .select("id")
        .single();
      if (oerr) throw oerr;

      const itemsPayload = values.items.map((it) => {
        const line = it.qty * it.unit_price;
        const disc = line * (it.discount_pct / 100);
        return {
          order_id: (order as { id: string }).id,
          product_id: it.product_id,
          qty: it.qty,
          unit_price: it.unit_price,
          discount_pct: it.discount_pct,
          total: line - disc,
        };
      });
      const { error: ierr } = await supabase.from("sale_order_items").insert(itemsPayload as never);
      if (ierr) throw ierr;

      toast.success(`Pedido criado!`);
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    }
  });

  const addProduct = (p: Product) => {
    append({
      product_id: p.id,
      qty: 1,
      unit_price: Number(p.price_sale),
      discount_pct: 0,
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo pedido</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cliente *" error={form.formState.errors.client_id?.message}>
              <Select
                value={form.watch("client_id")}
                onValueChange={(v) => form.setValue("client_id", v)}
              >
                <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                <SelectContent>
                  {clients.data?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} · {c.tier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Tipo">
              <Select
                value={form.watch("type")}
                onValueChange={(v) => form.setValue("type", v as OrderForm["type"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdv">PDV</SelectItem>
                  <SelectItem value="ecommerce">E-commerce</SelectItem>
                  <SelectItem value="orcamento">Orçamento</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm">Itens *</CardTitle>
              <AddProductPicker products={products.data ?? []} onPick={addProduct} />
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="w-[80px]">Qtd</TableHead>
                    <TableHead className="w-[120px]">Preço</TableHead>
                    <TableHead className="w-[90px]">Desc %</TableHead>
                    <TableHead className="w-[110px]">Subtotal</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                      Nenhum item. Adicione um produto.
                    </TableCell></TableRow>
                  )}
                  {fields.map((f, idx) => {
                    const it = items[idx];
                    const p = products.data?.find((p) => p.id === it?.product_id);
                    const line = Number(it?.qty || 0) * Number(it?.unit_price || 0);
                    const sub = line - line * (Number(it?.discount_pct || 0) / 100);
                    return (
                      <TableRow key={f.id}>
                        <TableCell className="text-sm">{p?.name ?? "—"}<div className="text-xs text-muted-foreground">{p?.sku}</div></TableCell>
                        <TableCell><Input type="number" step="1" {...form.register(`items.${idx}.qty`)} /></TableCell>
                        <TableCell><Input type="number" step="0.01" {...form.register(`items.${idx}.unit_price`)} /></TableCell>
                        <TableCell><Input type="number" step="0.01" {...form.register(`items.${idx}.discount_pct`)} /></TableCell>
                        <TableCell className="font-mono text-sm">R$ {sub.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" type="button" onClick={() => remove(idx)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {form.formState.errors.items?.message && (
                <p className="px-3 py-2 text-xs text-destructive">{form.formState.errors.items.message}</p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Forma de pagamento">
              <Input placeholder="dinheiro, pix, cartão…" {...form.register("payment_method")} />
            </Field>
            <Field label="Parcelas">
              <Input type="number" min={1} max={24} {...form.register("installments")} />
            </Field>
            <Field label="Desconto geral %">
              <Input type="number" step="0.01" {...form.register("discount_pct")} />
            </Field>
            <Field label="Cashback usado (R$)">
              <Input type="number" step="0.01" {...form.register("cashback_used")} />
            </Field>
          </div>

          <Field label="Notas">
            <Textarea rows={2} {...form.register("notes")} />
          </Field>

          <div className="rounded-md border bg-muted/40 p-3">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-mono">R$ {totals.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span>Desconto geral</span><span className="font-mono">- R$ {totals.orderDiscount.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span>Cashback usado</span><span className="font-mono">- R$ {Number(cashbackUsed).toFixed(2)}</span></div>
            <div className="mt-1 flex justify-between border-t pt-1 text-base font-semibold"><span>Total</span><span className="font-mono">R$ {totals.total.toFixed(2)}</span></div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar pedido (rascunho)
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddProductPicker({ products, onPick }: { products: Product[]; onPick: (p: Product) => void }) {
  const [val, setVal] = useState("");
  return (
    <Select
      value={val}
      onValueChange={(v) => {
        const p = products.find((p) => p.id === v);
        if (p) onPick(p);
        setVal("");
      }}
    >
      <SelectTrigger className="h-9 w-[280px]">
        <SelectValue placeholder="+ Adicionar produto" />
      </SelectTrigger>
      <SelectContent>
        {products.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name} — R$ {Number(p.price_sale).toFixed(2)} (est. {p.stock_qty})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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
