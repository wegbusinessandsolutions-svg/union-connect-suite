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
import { costCenterSchema, type CostCenterForm } from "@/lib/financeiro-schemas";
import type { Tables } from "@/integrations/supabase/types";

type CostCenter = Tables<"cost_centers">;

export const Route = createFileRoute("/_authenticated/financeiro/centros-custo")({
  head: () => ({ meta: [{ title: "Centros de Custo — Financeiro" }] }),
  component: CostCentersPage,
});

const CATEGORY_BADGE: Record<string, string> = {
  fixo: "bg-rose-100 text-rose-900",
  variavel: "bg-amber-100 text-amber-900",
  imobilizado: "bg-blue-100 text-blue-900",
  bancario: "bg-slate-200 text-slate-800",
  pessoal: "bg-emerald-100 text-emerald-900",
};

function CostCentersPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<CostCenter | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<CostCenter | null>(null);

  const list = useQuery({
    queryKey: ["cost_centers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cost_centers").select("*").order("name");
      if (error) throw error;
      return data as CostCenter[];
    },
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cost_centers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Centro de custo excluído");
      qc.invalidateQueries({ queryKey: ["cost_centers"] });
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Centros de Custo</h1>
            <p className="text-sm text-muted-foreground">Classificação financeira de receitas e despesas.</p>
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
          <CardHeader>
            <CardTitle className="text-base">
              {list.isFetching ? "Carregando…" : `${list.data?.length ?? 0} centro(s) de custo`}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Pai</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[180px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.data?.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Nenhum centro cadastrado.</TableCell></TableRow>
                )}
                {list.data?.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell><Badge className={CATEGORY_BADGE[c.category] ?? ""}>{c.category}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.parent_id ? list.data?.find((p) => p.id === c.parent_id)?.name ?? "—" : "—"}
                    </TableCell>
                    <TableCell>{c.is_active ? <Badge variant="secondary">Ativo</Badge> : <Badge variant="outline">Inativo</Badge>}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <ReportActions data={costCenterReport(c)} filename={`centro-${c.name}`} />
                        <Button size="icon" variant="ghost" onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setToDelete(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
        <CostCenterFormDialog
          item={editing}
          parents={list.data ?? []}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["cost_centers"] });
            setCreating(false); setEditing(null);
          }}
        />
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir centro de custo?</AlertDialogTitle>
            <AlertDialogDescription><b>{toDelete?.name}</b></AlertDialogDescription>
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

function CostCenterFormDialog({
  item, parents, onClose, onSaved,
}: { item: CostCenter | null; parents: CostCenter[]; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!item;
  const form = useForm<CostCenterForm>({
    resolver: zodResolver(costCenterSchema) as never,
    defaultValues: item ? {
      name: item.name,
      category: item.category as CostCenterForm["category"],
      parent_id: item.parent_id ?? "",
      is_active: item.is_active,
    } : { name: "", category: "fixo", parent_id: "", is_active: true },
  });

  const submit = form.handleSubmit(async (values) => {
    const payload: Record<string, unknown> = { ...values, parent_id: values.parent_id || null };
    try {
      if (isEdit) {
        const { error } = await supabase.from("cost_centers").update(payload as never).eq("id", item!.id);
        if (error) throw error;
        toast.success("Atualizado");
      } else {
        const { error } = await supabase.from("cost_centers").insert(payload as never);
        if (error) throw error;
        toast.success("Criado");
      }
      onSaved();
    } catch (e) { toast.error((e as Error).message); }
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{isEdit ? "Editar centro" : "Novo centro de custo"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Nome *" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} />
          </Field>
          <Field label="Categoria *">
            <Select value={form.watch("category")} onValueChange={(v) => form.setValue("category", v as CostCenterForm["category"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fixo">Fixo</SelectItem>
                <SelectItem value="variavel">Variável</SelectItem>
                <SelectItem value="imobilizado">Imobilizado</SelectItem>
                <SelectItem value="bancario">Bancário</SelectItem>
                <SelectItem value="pessoal">Pessoal</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Centro pai (opcional)">
            <Select value={form.watch("parent_id") || "__none"} onValueChange={(v) => form.setValue("parent_id", v === "__none" ? "" : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">— Sem pai —</SelectItem>
                {parents.filter((p) => p.id !== item?.id).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="flex items-center gap-2">
            <Switch checked={form.watch("is_active")} onCheckedChange={(v) => form.setValue("is_active", v)} />
            <Label>Ativo</Label>
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
