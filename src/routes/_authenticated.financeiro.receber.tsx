import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, RefreshCw, Loader2, CheckCircle2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ReportActions } from "@/components/report-actions";
import { receivableReport } from "@/lib/report-builders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { receivableSchema, type ReceivableForm } from "@/lib/financeiro-schemas";
import type { Tables } from "@/integrations/supabase/types";

type Receivable = Tables<"receivables">;
type Client = Tables<"clients">;
type BankAccount = Tables<"bank_accounts">;
type CostCenter = Tables<"cost_centers">;

export const Route = createFileRoute("/_authenticated/financeiro/receber")({
  head: () => ({ meta: [{ title: "Contas a Receber — Financeiro" }] }),
  component: ReceberPage,
});

const STATUS_BADGE: Record<string, string> = {
  aberto: "bg-slate-200 text-slate-800",
  pago: "bg-emerald-100 text-emerald-900",
  vencido: "bg-rose-100 text-rose-900",
  cancelado: "bg-gray-200 text-gray-700",
  parcial: "bg-amber-100 text-amber-900",
};

function ReceberPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("all");
  const [editing, setEditing] = useState<Receivable | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Receivable | null>(null);

  const list = useQuery({
    queryKey: ["receivables", status],
    queryFn: async () => {
      let q = supabase.from("receivables").select("*").order("due_date", { ascending: true }).limit(500);
      if (status !== "all") q = q.eq("status", status as Receivable["status"]);
      const { data, error } = await q;
      if (error) throw error;
      return data as Receivable[];
    },
  });

  const clients = useQuery({
    queryKey: ["clients-min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id,name").order("name");
      if (error) throw error;
      return data as Pick<Client, "id" | "name">[];
    },
  });
  const accounts = useQuery({
    queryKey: ["bank_accounts-min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bank_accounts").select("id,account,type,bank_id");
      if (error) throw error;
      return data as Pick<BankAccount, "id" | "account" | "type" | "bank_id">[];
    },
  });
  const centers = useQuery({
    queryKey: ["cost_centers-min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cost_centers").select("id,name,category").eq("is_active", true).order("name");
      if (error) throw error;
      return data as Pick<CostCenter, "id" | "name" | "category">[];
    },
  });

  const clientMap = useMemo(() => new Map((clients.data ?? []).map((c) => [c.id, c.name])), [clients.data]);

  const totals = useMemo(() => {
    const open = (list.data ?? []).filter((r) => r.status === "aberto" || r.status === "vencido").reduce((s, r) => s + Number(r.total), 0);
    const received = (list.data ?? []).filter((r) => r.status === "pago").reduce((s, r) => s + Number(r.paid_value ?? r.total), 0);
    return { open, received };
  }, [list.data]);

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("receivables").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lançamento excluído");
      qc.invalidateQueries({ queryKey: ["receivables"] });
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const receiveMut = useMutation({
    mutationFn: async (r: Receivable) => {
      const { error } = await supabase.from("receivables").update({
        status: "pago",
        paid_at: new Date().toISOString(),
        paid_value: r.total,
      } as never).eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Recebimento registrado");
      qc.invalidateQueries({ queryKey: ["receivables"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Contas a Receber</h1>
            <p className="text-sm text-muted-foreground">
              A receber: <b className="text-amber-700">R$ {totals.open.toFixed(2)}</b> · Recebido: <b className="text-emerald-700">R$ {totals.received.toFixed(2)}</b>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => list.refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
            </Button>
            <Button onClick={() => setCreating(true)}>
              <Plus className="mr-2 h-4 w-4" /> Novo
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-base">
              {list.isFetching ? "Carregando…" : `${list.data?.length ?? 0} lançamento(s)`}
            </CardTitle>
            <div className="w-48">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                  <SelectItem value="parcial">Parcial</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Parc.</TableHead>
                  <TableHead>Recebido em</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[200px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.data?.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">Nenhum lançamento.</TableCell></TableRow>
                )}
                {list.data?.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{format(parseISO(r.due_date), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="text-xs">{r.client_id ? clientMap.get(r.client_id) ?? "—" : "—"}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs">{r.description ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold">R$ {Number(r.total).toFixed(2)}</TableCell>
                    <TableCell className="text-xs">{r.installments ?? 1}x</TableCell>
                    <TableCell className="text-xs">{r.paid_at ? format(new Date(r.paid_at), "dd/MM/yyyy") : "—"}</TableCell>
                    <TableCell><Badge className={STATUS_BADGE[r.status] ?? ""}>{r.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <ReportActions data={receivableReport(r)} filename={`receber-${r.id.slice(0, 8)}`} />
                        {r.status !== "pago" && r.status !== "cancelado" && (
                          <Button size="icon" variant="ghost" title="Receber" onClick={() => receiveMut.mutate(r)}>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setToDelete(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {(creating || editing) && (
        <ReceivableFormDialog
          item={editing}
          clients={clients.data ?? []}
          accounts={accounts.data ?? []}
          centers={centers.data ?? []}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["receivables"] });
            setCreating(false); setEditing(null);
          }}
        />
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toDelete && delMut.mutate(toDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ReceivableFormDialog({
  item, clients, accounts, centers, onClose, onSaved,
}: {
  item: Receivable | null;
  clients: Pick<Client, "id" | "name">[];
  accounts: Pick<BankAccount, "id" | "account" | "type" | "bank_id">[];
  centers: Pick<CostCenter, "id" | "name" | "category">[];
  onClose: () => void; onSaved: () => void;
}) {
  const isEdit = !!item;
  const form = useForm<ReceivableForm>({
    resolver: zodResolver(receivableSchema) as never,
    defaultValues: item ? {
      description: item.description ?? "",
      total: Number(item.total),
      due_date: item.due_date,
      installments: item.installments ?? 1,
      paid_value: item.paid_value ? Number(item.paid_value) : undefined,
      paid_at: item.paid_at ? item.paid_at.slice(0, 10) : "",
      status: item.status as ReceivableForm["status"],
      bank_account_id: item.bank_account_id ?? "",
      cost_center_id: item.cost_center_id ?? "",
      client_id: item.client_id ?? "",
    } : {
      description: "", total: 0, due_date: format(new Date(), "yyyy-MM-dd"),
      installments: 1, status: "aberto", bank_account_id: "",
      cost_center_id: "", client_id: "",
    },
  });

  const submit = form.handleSubmit(async (values) => {
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(values)) payload[k] = v === "" ? null : v;
    if (payload.paid_at && typeof payload.paid_at === "string") {
      payload.paid_at = new Date(payload.paid_at as string).toISOString();
    }
    try {
      if (isEdit) {
        const { error } = await supabase.from("receivables").update(payload as never).eq("id", item!.id);
        if (error) throw error;
        toast.success("Atualizado");
      } else {
        const { error } = await supabase.from("receivables").insert(payload as never);
        if (error) throw error;
        toast.success("Criado");
      }
      onSaved();
    } catch (e) { toast.error((e as Error).message); }
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? "Editar lançamento" : "Nova conta a receber"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Descrição"><Input {...form.register("description")} /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Valor *" error={form.formState.errors.total?.message}>
              <Input type="number" step="0.01" {...form.register("total")} />
            </Field>
            <Field label="Vencimento *" error={form.formState.errors.due_date?.message}>
              <Input type="date" {...form.register("due_date")} />
            </Field>
            <Field label="Parcelas">
              <Input type="number" min={1} max={60} {...form.register("installments")} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cliente">
              <Select value={form.watch("client_id") || "__none"} onValueChange={(v) => form.setValue("client_id", v === "__none" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">— Nenhum —</SelectItem>
                  {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as ReceivableForm["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="parcial">Parcial</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Conta bancária">
              <Select value={form.watch("bank_account_id") || "__none"} onValueChange={(v) => form.setValue("bank_account_id", v === "__none" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">— Nenhuma —</SelectItem>
                  {accounts.map((a) => (<SelectItem key={a.id} value={a.id}>{a.account ?? a.type}</SelectItem>))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Centro de custo">
              <Select value={form.watch("cost_center_id") || "__none"} onValueChange={(v) => form.setValue("cost_center_id", v === "__none" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">— Nenhum —</SelectItem>
                  {centers.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name} ({c.category})</SelectItem>))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Recebido em"><Input type="date" {...form.register("paid_at")} /></Field>
            <Field label="Valor recebido"><Input type="number" step="0.01" {...form.register("paid_value")} /></Field>
          </div>
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
