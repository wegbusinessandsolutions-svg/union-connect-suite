import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { bankAccountSchema, type BankAccountForm } from "@/lib/financeiro-schemas";
import type { Tables } from "@/integrations/supabase/types";

type BankAccount = Tables<"bank_accounts">;
type Bank = Tables<"banks">;

export const Route = createFileRoute("/_authenticated/financeiro/bancos")({
  head: () => ({ meta: [{ title: "Contas Bancárias — Financeiro" }] }),
  component: BankAccountsPage,
});

function BankAccountsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<BankAccount | null>(null);

  const accounts = useQuery({
    queryKey: ["bank_accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bank_accounts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as BankAccount[];
    },
  });

  const banks = useQuery({
    queryKey: ["banks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("banks").select("*").order("name");
      if (error) throw error;
      return data as Bank[];
    },
  });

  const bankMap = new Map((banks.data ?? []).map((b) => [b.id, b]));

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Conta excluída");
      qc.invalidateQueries({ queryKey: ["bank_accounts"] });
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const totalBalance = (accounts.data ?? []).reduce((sum, a) => sum + Number(a.balance_current ?? 0), 0);

  return (
    <div className="bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Contas Bancárias</h1>
            <p className="text-sm text-muted-foreground">Saldo total: <b>R$ {totalBalance.toFixed(2)}</b></p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => accounts.refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
            </Button>
            <Button onClick={() => setCreating(true)}>
              <Plus className="mr-2 h-4 w-4" /> Nova conta
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {accounts.isFetching ? "Carregando…" : `${accounts.data?.length ?? 0} conta(s)`}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Banco</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ag/Conta</TableHead>
                  <TableHead>PIX</TableHead>
                  <TableHead>Saldo inicial</TableHead>
                  <TableHead>Saldo atual</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[180px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.data?.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">Nenhuma conta cadastrada.</TableCell></TableRow>
                )}
                {accounts.data?.map((a) => {
                  const bank = a.bank_id ? bankMap.get(a.bank_id) : null;
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{bank?.name ?? "—"}</TableCell>
                      <TableCell><Badge variant="outline">{a.type}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{a.agency ?? "—"} / {a.account ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{a.pix_key ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">R$ {Number(a.balance_initial ?? 0).toFixed(2)}</TableCell>
                      <TableCell className="font-mono text-xs font-semibold">R$ {Number(a.balance_current ?? 0).toFixed(2)}</TableCell>
                      <TableCell>{a.is_active ? <Badge variant="secondary">Ativa</Badge> : <Badge variant="outline">Inativa</Badge>}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <ReportActions data={bankAccountReport(a, bank?.name)} filename={`conta-${a.id.slice(0, 8)}`} />
                          <Button size="icon" variant="ghost" onClick={() => setEditing(a)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setToDelete(a)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
        <BankAccountFormDialog
          item={editing}
          banks={banks.data ?? []}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["bank_accounts"] });
            setCreating(false); setEditing(null);
          }}
        />
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta bancária?</AlertDialogTitle>
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

function BankAccountFormDialog({
  item, banks, onClose, onSaved,
}: { item: BankAccount | null; banks: Bank[]; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!item;
  const initialBankName = item?.bank_id ? (banks.find((b) => b.id === item.bank_id)?.name ?? "") : "";
  const [bankName, setBankName] = useState(initialBankName);

  const form = useForm<BankAccountForm>({
    resolver: zodResolver(bankAccountSchema) as never,
    defaultValues: item ? {
      bank_id: item.bank_id ?? "",
      type: item.type as BankAccountForm["type"],
      agency: item.agency ?? "",
      account: item.account ?? "",
      pix_key: item.pix_key ?? "",
      balance_initial: Number(item.balance_initial ?? 0),
      balance_current: Number(item.balance_current ?? 0),
      is_active: item.is_active,
    } : {
      bank_id: "", type: "corrente", balance_initial: 0, balance_current: 0, is_active: true,
    },
  });

  async function resolveBankId(name: string): Promise<string | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const existing = banks.find((b) => b.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing.id;
    const { data, error } = await supabase.from("banks").insert({ name: trimmed }).select("id").single();
    if (error) throw error;
    return data.id;
  }

  const submit = form.handleSubmit(async (values) => {
    try {
      const bank_id = await resolveBankId(bankName);
      const merged: Record<string, unknown> = { ...values, bank_id };
      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(merged)) payload[k] = v === "" ? null : v;
      if (isEdit) {
        const { error } = await supabase.from("bank_accounts").update(payload as never).eq("id", item!.id);
        if (error) throw error;
        toast.success("Atualizado");
      } else {
        const { error } = await supabase.from("bank_accounts").insert(payload as never);
        if (error) throw error;
        toast.success("Criado");
      }
      onSaved();
    } catch (e) { toast.error((e as Error).message); }
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{isEdit ? "Editar conta" : "Nova conta bancária"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Banco">
            <Input
              list="bank-suggestions"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Digite o nome do banco (ex.: Itaú, Bradesco)"
            />
            <datalist id="bank-suggestions">
              {banks.map((b) => <option key={b.id} value={b.name} />)}
            </datalist>
            <p className="text-xs text-muted-foreground">Se o banco ainda não existir, será criado automaticamente.</p>
          </Field>
          <Field label="Tipo *">
            <Select value={form.watch("type")} onValueChange={(v) => form.setValue("type", v as BankAccountForm["type"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="corrente">Corrente</SelectItem>
                <SelectItem value="poupanca">Poupança</SelectItem>
                <SelectItem value="pagamento">Pagamento</SelectItem>
                <SelectItem value="investimento">Investimento</SelectItem>
                <SelectItem value="caixa">Caixa</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Agência"><Input {...form.register("agency")} /></Field>
            <Field label="Conta"><Input {...form.register("account")} /></Field>
          </div>
          <Field label="Chave PIX"><Input {...form.register("pix_key")} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Saldo inicial"><Input type="number" step="0.01" {...form.register("balance_initial")} /></Field>
            <Field label="Saldo atual"><Input type="number" step="0.01" {...form.register("balance_current")} /></Field>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.watch("is_active")} onCheckedChange={(v) => form.setValue("is_active", v)} />
            <Label>Ativa</Label>
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
