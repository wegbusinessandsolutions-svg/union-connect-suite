import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, RefreshCw, Loader2 } from "lucide-react";
import { format } from "date-fns";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { clientSchema, type ClientForm } from "@/lib/comercial-schemas";
import type { Tables } from "@/integrations/supabase/types";

type Client = Tables<"clients">;

export const Route = createFileRoute("/_authenticated/comercial/clientes")({
  head: () => ({ meta: [{ title: "Clientes — Comercial" }] }),
  component: ClientesPage,
});

const TIER_BADGE: Record<string, string> = {
  bronze: "bg-amber-100 text-amber-900",
  prata: "bg-slate-200 text-slate-800",
  ouro: "bg-yellow-100 text-yellow-900",
  diamante: "bg-cyan-100 text-cyan-900",
};

function ClientesPage() {
  const qc = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Client | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Client | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const list = useQuery({
    queryKey: ["clients", search],
    queryFn: async () => {
      let q = supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (search) {
        q = q.or(`name.ilike.%${search}%,cpf_cnpj.ilike.%${search}%,email.ilike.%${search}%`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data as Client[];
    },
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cliente excluído");
      qc.invalidateQueries({ queryKey: ["clients"] });
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
            <p className="text-sm text-muted-foreground">Gestão de pessoas físicas e jurídicas.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => list.refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
            </Button>
            <Button onClick={() => setCreating(true)}>
              <Plus className="mr-2 h-4 w-4" /> Novo cliente
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-base">
              {list.isFetching ? "Carregando…" : `${list.data?.length ?? 0} cliente(s)`}
            </CardTitle>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF/CNPJ ou email…"
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
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Cashback</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado</TableHead>
                  <TableHead className="w-[180px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.isError && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-sm text-red-600">
                      {(list.error as Error).message}
                    </TableCell>
                  </TableRow>
                )}
                {!list.isError && list.data?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                      Nenhum cliente cadastrado.
                    </TableCell>
                  </TableRow>
                )}
                {list.data?.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{c.type.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{c.cpf_cnpj ?? "—"}</TableCell>
                    <TableCell className="text-xs">
                      <div>{c.email ?? "—"}</div>
                      <div className="text-muted-foreground">{c.phone ?? "—"}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={TIER_BADGE[c.tier] ?? ""}>{c.tier}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      R$ {Number(c.cashback_balance ?? 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {c.is_active ? (
                        <Badge variant="secondary">Ativo</Badge>
                      ) : (
                        <Badge variant="outline">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {format(new Date(c.created_at), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <ReportActions data={clientReport(c)} filename={`cliente-${c.cpf_cnpj ?? c.id.slice(0, 8)}`} />
                        <Button size="icon" variant="ghost" onClick={() => setEditing(c)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setToDelete(c)}>
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
        <ClientFormDialog
          client={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["clients"] });
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Cliente: <b>{toDelete?.name}</b>
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

function ClientFormDialog({
  client,
  onClose,
  onSaved,
}: {
  client: Client | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!client;
  const form = useForm<ClientForm>({
    resolver: zodResolver(clientSchema) as never,
    defaultValues: client
      ? {
          type: client.type as "pf" | "pj",
          name: client.name,
          cpf_cnpj: client.cpf_cnpj ?? "",
          rg_ie: client.rg_ie ?? "",
          email: client.email ?? "",
          phone: client.phone ?? "",
          whatsapp: client.whatsapp ?? "",
          birth_date: client.birth_date ?? "",
          tier: client.tier as "bronze" | "prata" | "ouro" | "diamante",
          is_active: client.is_active,
          address_street: client.address_street ?? "",
          address_number: client.address_number ?? "",
          address_complement: client.address_complement ?? "",
          address_district: client.address_district ?? "",
          address_city: client.address_city ?? "",
          address_state: client.address_state ?? "",
          address_zip: client.address_zip ?? "",
          resp1_name: client.resp1_name ?? "",
          resp1_cpf: client.resp1_cpf ?? "",
          resp1_phone: client.resp1_phone ?? "",
          resp1_email: client.resp1_email ?? "",
          notes_internal: client.notes_internal ?? "",
        }
      : {
          type: "pf",
          name: "",
          tier: "bronze",
          is_active: true,
        },
  });

  const submit = form.handleSubmit(async (values) => {
    // Strip empty strings → null so DB stores NULL.
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(values)) {
      payload[k] = v === "" ? null : v;
    }
    try {
      if (isEdit) {
        const { error } = await supabase.from("clients").update(payload as never).eq("id", client!.id);
        if (error) throw error;
        toast.success("Cliente atualizado");
      } else {
        const { error } = await supabase.from("clients").insert(payload as never);
        if (error) throw error;
        toast.success("Cliente criado");
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
          <DialogTitle>{isEdit ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          <DialogDescription>
            Preencha os dados. Campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <Tabs defaultValue="basic">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="address">Endereço</TabsTrigger>
              <TabsTrigger value="resp">Responsável</TabsTrigger>
              <TabsTrigger value="notes">Notas</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-3 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tipo *">
                  <Select
                    value={form.watch("type")}
                    onValueChange={(v) => form.setValue("type", v as "pf" | "pj")}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pf">Pessoa Física</SelectItem>
                      <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Tier">
                  <Select
                    value={form.watch("tier")}
                    onValueChange={(v) => form.setValue("tier", v as ClientForm["tier"])}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bronze">Bronze</SelectItem>
                      <SelectItem value="prata">Prata</SelectItem>
                      <SelectItem value="ouro">Ouro</SelectItem>
                      <SelectItem value="diamante">Diamante</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Nome / Razão Social *" error={form.formState.errors.name?.message}>
                <Input {...form.register("name")} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="CPF/CNPJ"><Input {...form.register("cpf_cnpj")} /></Field>
                <Field label="RG / IE"><Input {...form.register("rg_ie")} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email" error={form.formState.errors.email?.message}>
                  <Input type="email" {...form.register("email")} />
                </Field>
                <Field label="Data nascimento">
                  <Input type="date" {...form.register("birth_date")} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Telefone"><Input {...form.register("phone")} /></Field>
                <Field label="WhatsApp"><Input {...form.register("whatsapp")} /></Field>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.watch("is_active")}
                  onCheckedChange={(v) => form.setValue("is_active", v)}
                />
                <Label>Ativo</Label>
              </div>
            </TabsContent>

            <TabsContent value="address" className="space-y-3 pt-3">
              <div className="grid grid-cols-3 gap-3">
                <Field label="CEP"><Input {...form.register("address_zip")} /></Field>
                <div className="col-span-2">
                  <Field label="Logradouro"><Input {...form.register("address_street")} /></Field>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Número"><Input {...form.register("address_number")} /></Field>
                <div className="col-span-2">
                  <Field label="Complemento"><Input {...form.register("address_complement")} /></Field>
                </div>
              </div>
              <Field label="Bairro"><Input {...form.register("address_district")} /></Field>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Field label="Cidade"><Input {...form.register("address_city")} /></Field>
                </div>
                <Field label="UF"><Input maxLength={2} {...form.register("address_state")} /></Field>
              </div>
            </TabsContent>

            <TabsContent value="resp" className="space-y-3 pt-3">
              <Field label="Nome"><Input {...form.register("resp1_name")} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="CPF"><Input {...form.register("resp1_cpf")} /></Field>
                <Field label="Telefone"><Input {...form.register("resp1_phone")} /></Field>
              </div>
              <Field label="Email" error={form.formState.errors.resp1_email?.message}>
                <Input type="email" {...form.register("resp1_email")} />
              </Field>
            </TabsContent>

            <TabsContent value="notes" className="space-y-3 pt-3">
              <Field label="Notas internas">
                <Textarea rows={6} {...form.register("notes_internal")} />
              </Field>
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
