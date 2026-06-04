import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ReportActions } from "@/components/report-actions";
import { supplierReport } from "@/lib/report-builders";
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
import { supplierSchema, type SupplierForm } from "@/lib/financeiro-schemas";
import type { Tables } from "@/integrations/supabase/types";

type Supplier = Tables<"suppliers">;

export const Route = createFileRoute("/_authenticated/financeiro/fornecedores")({
  head: () => ({ meta: [{ title: "Fornecedores — Financeiro" }] }),
  component: FornecedoresPage,
});

function FornecedoresPage() {
  const qc = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Supplier | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const list = useQuery({
    queryKey: ["suppliers", search],
    queryFn: async () => {
      let q = supabase.from("suppliers").select("*").order("created_at", { ascending: false }).limit(200);
      if (search) q = q.or(`razao_social.ilike.%${search}%,nome_fantasia.ilike.%${search}%,cnpj.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as Supplier[];
    },
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Fornecedor excluído");
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Fornecedores</h1>
            <p className="text-sm text-muted-foreground">Cadastro de fornecedores e representantes.</p>
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
              {list.isFetching ? "Carregando…" : `${list.data?.length ?? 0} fornecedor(es)`}
            </CardTitle>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por razão social, fantasia ou CNPJ…"
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
                  <TableHead>Razão Social</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Cidade/UF</TableHead>
                  <TableHead>Prazo médio</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[180px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.isError && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-sm text-red-600">
                      {(list.error as Error).message}
                    </TableCell>
                  </TableRow>
                )}
                {!list.isError && list.data?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                      Nenhum fornecedor cadastrado.
                    </TableCell>
                  </TableRow>
                )}
                {list.data?.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <div>{s.razao_social}</div>
                      <div className="text-xs text-muted-foreground">{s.nome_fantasia ?? "—"}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{s.cnpj ?? "—"}</TableCell>
                    <TableCell className="text-xs">
                      <div>{s.email ?? "—"}</div>
                      <div className="text-muted-foreground">{s.phone ?? "—"}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {s.address_city ? `${s.address_city}/${s.address_state ?? "—"}` : "—"}
                    </TableCell>
                    <TableCell className="text-xs">{s.avg_delivery_days ? `${s.avg_delivery_days} dias` : "—"}</TableCell>
                    <TableCell className="text-xs">{s.rating ? `${s.rating}/5` : "—"}</TableCell>
                    <TableCell>
                      {s.is_active ? <Badge variant="secondary">Ativo</Badge> : <Badge variant="outline">Inativo</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <ReportActions data={supplierReport(s)} filename={`fornecedor-${s.cnpj ?? s.id.slice(0, 8)}`} />
                        <Button size="icon" variant="ghost" onClick={() => setEditing(s)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setToDelete(s)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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
        <SupplierFormDialog
          supplier={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["suppliers"] });
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fornecedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Fornecedor: <b>{toDelete?.razao_social}</b>
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

function SupplierFormDialog({
  supplier, onClose, onSaved,
}: { supplier: Supplier | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!supplier;
  const form = useForm<SupplierForm>({
    resolver: zodResolver(supplierSchema) as never,
    defaultValues: supplier ? {
      razao_social: supplier.razao_social,
      nome_fantasia: supplier.nome_fantasia ?? "",
      cnpj: supplier.cnpj ?? "",
      ie: supplier.ie ?? "",
      email: supplier.email ?? "",
      phone: supplier.phone ?? "",
      whatsapp: supplier.whatsapp ?? "",
      site: supplier.site ?? "",
      rep_name: supplier.rep_name ?? "",
      rep_phone: supplier.rep_phone ?? "",
      rep_email: supplier.rep_email ?? "",
      bank_name: supplier.bank_name ?? "",
      bank_agency: supplier.bank_agency ?? "",
      bank_account: supplier.bank_account ?? "",
      bank_pix: supplier.bank_pix ?? "",
      payment_terms: supplier.payment_terms ?? "",
      avg_delivery_days: supplier.avg_delivery_days ?? undefined,
      rating: supplier.rating ?? undefined,
      address_zip: supplier.address_zip ?? "",
      address_street: supplier.address_street ?? "",
      address_number: supplier.address_number ?? "",
      address_complement: supplier.address_complement ?? "",
      address_district: supplier.address_district ?? "",
      address_city: supplier.address_city ?? "",
      address_state: supplier.address_state ?? "",
      notes: supplier.notes ?? "",
      is_active: supplier.is_active,
    } : { razao_social: "", is_active: true },
  });

  const submit = form.handleSubmit(async (values) => {
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(values)) payload[k] = v === "" ? null : v;
    try {
      if (isEdit) {
        const { error } = await supabase.from("suppliers").update(payload as never).eq("id", supplier!.id);
        if (error) throw error;
        toast.success("Fornecedor atualizado");
      } else {
        const { error } = await supabase.from("suppliers").insert(payload as never);
        if (error) throw error;
        toast.success("Fornecedor criado");
      }
      onSaved();
    } catch (e) { toast.error((e as Error).message); }
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar fornecedor" : "Novo fornecedor"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Tabs defaultValue="basic">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="address">Endereço</TabsTrigger>
              <TabsTrigger value="bank">Bancário</TabsTrigger>
              <TabsTrigger value="extra">Extra</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-3 pt-3">
              <Field label="Razão Social *" error={form.formState.errors.razao_social?.message}>
                <Input {...form.register("razao_social")} />
              </Field>
              <Field label="Nome Fantasia"><Input {...form.register("nome_fantasia")} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="CNPJ"><Input {...form.register("cnpj")} /></Field>
                <Field label="IE"><Input {...form.register("ie")} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email" error={form.formState.errors.email?.message}>
                  <Input type="email" {...form.register("email")} />
                </Field>
                <Field label="Site"><Input {...form.register("site")} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Telefone"><Input {...form.register("phone")} /></Field>
                <Field label="WhatsApp"><Input {...form.register("whatsapp")} /></Field>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.watch("is_active")} onCheckedChange={(v) => form.setValue("is_active", v)} />
                <Label>Ativo</Label>
              </div>
            </TabsContent>
            <TabsContent value="address" className="space-y-3 pt-3">
              <div className="grid grid-cols-3 gap-3">
                <Field label="CEP"><Input {...form.register("address_zip")} /></Field>
                <div className="col-span-2"><Field label="Logradouro"><Input {...form.register("address_street")} /></Field></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Número"><Input {...form.register("address_number")} /></Field>
                <div className="col-span-2"><Field label="Complemento"><Input {...form.register("address_complement")} /></Field></div>
              </div>
              <Field label="Bairro"><Input {...form.register("address_district")} /></Field>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2"><Field label="Cidade"><Input {...form.register("address_city")} /></Field></div>
                <Field label="UF"><Input maxLength={2} {...form.register("address_state")} /></Field>
              </div>
            </TabsContent>
            <TabsContent value="bank" className="space-y-3 pt-3">
              <Field label="Banco"><Input {...form.register("bank_name")} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Agência"><Input {...form.register("bank_agency")} /></Field>
                <Field label="Conta"><Input {...form.register("bank_account")} /></Field>
              </div>
              <Field label="Chave PIX"><Input {...form.register("bank_pix")} /></Field>
              <Field label="Condições de pagamento"><Input {...form.register("payment_terms")} placeholder="ex: 30/60/90" /></Field>
            </TabsContent>
            <TabsContent value="extra" className="space-y-3 pt-3">
              <Field label="Representante"><Input {...form.register("rep_name")} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Telefone repr."><Input {...form.register("rep_phone")} /></Field>
                <Field label="Email repr." error={form.formState.errors.rep_email?.message}>
                  <Input type="email" {...form.register("rep_email")} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Prazo médio entrega (dias)"><Input type="number" {...form.register("avg_delivery_days")} /></Field>
                <Field label="Rating (0-5)"><Input type="number" min={0} max={5} {...form.register("rating")} /></Field>
              </div>
              <Field label="Observações"><Textarea rows={4} {...form.register("notes")} /></Field>
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
