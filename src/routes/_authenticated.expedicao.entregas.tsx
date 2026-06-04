import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, RefreshCw, Loader2, Truck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ReportActions } from "@/components/report-actions";
import { deliveryReport } from "@/lib/report-builders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { deliverySchema, type DeliveryForm } from "@/lib/expedicao-schemas";
import type { Tables } from "@/integrations/supabase/types";

type Delivery = Tables<"deliveries">;
type SaleOrder = Tables<"sale_orders">;
type Client = Tables<"clients">;
type Employee = Tables<"employees">;

const STATUSES: { value: DeliveryForm["status"]; label: string; tone: string }[] = [
  { value: "aguardando", label: "Aguardando", tone: "bg-muted text-foreground" },
  { value: "em_rota", label: "Em rota", tone: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  { value: "entregue", label: "Entregue", tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  { value: "falha", label: "Falha", tone: "bg-destructive/15 text-destructive" },
];

export const Route = createFileRoute("/_authenticated/expedicao/entregas")({
  head: () => ({ meta: [{ title: "Entregas — Expedição" }] }),
  component: EntregasPage,
});

function EntregasPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Delivery | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Delivery | null>(null);

  const list = useQuery({
    queryKey: ["deliveries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliveries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as Delivery[];
    },
  });

  const orders = useQuery({
    queryKey: ["sale_orders", "for-delivery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sale_orders")
        .select("*")
        .in("status", ["confirmado", "separando", "em_rota", "entregue"])
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as SaleOrder[];
    },
  });

  const clients = useQuery({
    queryKey: ["clients", "lookup"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id,name").order("name").limit(500);
      if (error) throw error;
      return data as Pick<Client, "id" | "name">[];
    },
  });

  const employees = useQuery({
    queryKey: ["employees", "lookup"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id,name,is_active")
        .eq("is_active", true)
        .order("name")
        .limit(500);
      if (error) throw error;
      return data as Pick<Employee, "id" | "name" | "is_active">[];
    },
  });

  const orderMap = new Map((orders.data ?? []).map((o) => [o.id, o]));
  const clientMap = new Map((clients.data ?? []).map((c) => [c.id, c.name]));
  const employeeMap = new Map((employees.data ?? []).map((e) => [e.id, e.name]));

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deliveries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Entrega removida");
      qc.invalidateQueries({ queryKey: ["deliveries"] });
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const byStatus = STATUSES.map((s) => ({
    ...s,
    items: (list.data ?? []).filter((d) => d.status === s.value),
  }));

  return (
    <div className="bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Entregas</h1>
            <p className="text-sm text-muted-foreground">{list.data?.length ?? 0} entrega(s) cadastrada(s)</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => list.refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
            </Button>
            <Button onClick={() => setCreating(true)}>
              <Plus className="mr-2 h-4 w-4" /> Nova entrega
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {byStatus.map((col) => (
            <Card key={col.value} className="min-h-[200px]">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>{col.label}</span>
                  <Badge variant="outline">{col.items.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {col.items.length === 0 && (
                  <p className="text-xs text-muted-foreground">Nenhuma entrega.</p>
                )}
                {col.items.map((d) => {
                  const ord = d.order_id ? orderMap.get(d.order_id) : null;
                  const cli = ord?.client_id ? clientMap.get(ord.client_id) : null;
                  const empl = d.deliverer_id ? employeeMap.get(d.deliverer_id) : null;
                  return (
                    <div
                      key={d.id}
                      className="rounded-md border bg-card p-3 text-xs"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="font-semibold">#{ord?.order_number ?? "—"}</span>
                        <div className="flex gap-1">
                          <ReportActions data={deliveryReport(d)} filename={`entrega-${d.id.slice(0, 8)}`} />
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditing(d)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setToDelete(d)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-muted-foreground">Cliente: {cli ?? "—"}</p>
                      {empl && <p className="text-muted-foreground">Entregador: {empl}</p>}
                      {d.receiver_name && <p className="text-muted-foreground">Recebido por: {d.receiver_name}</p>}
                      {d.delivered_at && (
                        <p className="text-muted-foreground">
                          Entregue em: {new Date(d.delivered_at).toLocaleString("pt-BR")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>

        {(creating || editing) && (
          <DeliveryFormDialog
            item={editing}
            orders={orders.data ?? []}
            clientMap={clientMap}
            employees={employees.data ?? []}
            onClose={() => { setCreating(false); setEditing(null); }}
            onSaved={() => {
              qc.invalidateQueries({ queryKey: ["deliveries"] });
              setCreating(false); setEditing(null);
            }}
          />
        )}

        <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover entrega?</AlertDialogTitle>
              <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => toDelete && delMut.mutate(toDelete.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >Remover</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function DeliveryFormDialog({
  item, orders, clientMap, employees, onClose, onSaved,
}: {
  item: Delivery | null;
  orders: SaleOrder[];
  clientMap: Map<string, string>;
  employees: Pick<Employee, "id" | "name" | "is_active">[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!item;
  const form = useForm<DeliveryForm>({
    resolver: zodResolver(deliverySchema) as never,
    defaultValues: item ? {
      order_id: item.order_id,
      status: item.status as DeliveryForm["status"],
      deliverer_id: item.deliverer_id ?? "",
      pickup_at: item.pickup_at ? item.pickup_at.slice(0, 16) : "",
      delivered_at: item.delivered_at ? item.delivered_at.slice(0, 16) : "",
      receiver_name: item.receiver_name ?? "",
      receiver_role: item.receiver_role ?? "",
      receiver_phone: item.receiver_phone ?? "",
      proof_photo_url: item.proof_photo_url ?? "",
      route_map_url: item.route_map_url ?? "",
      notes: item.notes ?? "",
    } : {
      order_id: "", status: "aguardando", deliverer_id: "",
      pickup_at: "", delivered_at: "",
      receiver_name: "", receiver_role: "", receiver_phone: "",
      proof_photo_url: "", route_map_url: "", notes: "",
    },
  });

  const submit = form.handleSubmit(async (values) => {
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(values)) payload[k] = v === "" ? null : v;
    // Convert datetime-local to ISO when present
    if (payload.pickup_at) payload.pickup_at = new Date(payload.pickup_at as string).toISOString();
    if (payload.delivered_at) payload.delivered_at = new Date(payload.delivered_at as string).toISOString();
    try {
      if (isEdit) {
        const { error } = await supabase.from("deliveries").update(payload as never).eq("id", item!.id);
        if (error) throw error;
        toast.success("Entrega atualizada");
      } else {
        const { error } = await supabase.from("deliveries").insert(payload as never);
        if (error) throw error;
        toast.success("Entrega criada");
      }
      onSaved();
    } catch (e) { toast.error((e as Error).message); }
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            {isEdit ? "Editar entrega" : "Nova entrega"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Pedido *" error={form.formState.errors.order_id?.message}>
            <Select value={form.watch("order_id")} onValueChange={(v) => form.setValue("order_id", v)} disabled={isEdit}>
              <SelectTrigger><SelectValue placeholder="Selecione um pedido confirmado…" /></SelectTrigger>
              <SelectContent>
                {orders.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    #{o.order_number} — {o.client_id ? clientMap.get(o.client_id) ?? "—" : "—"} — R$ {Number(o.total).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Status *">
              <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as DeliveryForm["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Entregador">
              <Select value={form.watch("deliverer_id") || "__none"} onValueChange={(v) => form.setValue("deliverer_id", v === "__none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">— Sem entregador —</SelectItem>
                  {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Coleta em"><Input type="datetime-local" {...form.register("pickup_at")} /></Field>
            <Field label="Entregue em"><Input type="datetime-local" {...form.register("delivered_at")} /></Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Recebido por"><Input {...form.register("receiver_name")} /></Field>
            <Field label="Cargo/relação"><Input {...form.register("receiver_role")} /></Field>
            <Field label="Telefone"><Input {...form.register("receiver_phone")} /></Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="URL foto comprovante" error={form.formState.errors.proof_photo_url?.message}>
              <Input {...form.register("proof_photo_url")} placeholder="https://…" />
            </Field>
            <Field label="URL mapa da rota" error={form.formState.errors.route_map_url?.message}>
              <Input {...form.register("route_map_url")} placeholder="https://…" />
            </Field>
          </div>

          <Field label="Observações"><Textarea rows={3} {...form.register("notes")} /></Field>

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
