import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { employeeSchema, type EmployeeForm } from "@/lib/admin-schemas";
import type { Tables } from "@/integrations/supabase/types";

type Employee = Tables<"employees">;

export const Route = createFileRoute("/_authenticated/admin/funcionarios")({
  head: () => ({ meta: [{ title: "Funcionários — Admin" }] }),
  component: FuncionariosPage,
});

function FuncionariosPage() {
  const qc = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Employee | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Employee | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const list = useQuery({
    queryKey: ["employees", search],
    queryFn: async () => {
      let q = supabase.from("employees").select("*").order("created_at", { ascending: false }).limit(200);
      if (search) q = q.or(`name.ilike.%${search}%,cpf.ilike.%${search}%,role.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as Employee[];
    },
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Funcionário excluído"); qc.invalidateQueries({ queryKey: ["employees"] }); setToDelete(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Funcionários</h1>
            <p className="text-sm text-muted-foreground">Cadastro de colaboradores, jornada, salário e dados bancários.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => list.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Atualizar</Button>
            <Button onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" />Novo</Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{list.isLoading ? "Carregando…" : `${list.data?.length ?? 0} funcionário(s)`}</CardTitle>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Nome, CPF ou cargo…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-72 pl-8" />
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Nome</TableHead><TableHead>Cargo</TableHead><TableHead>Departamento</TableHead>
                <TableHead>Contrato</TableHead><TableHead>Admissão</TableHead><TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(list.data ?? []).length === 0 && !list.isLoading && (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">Nenhum funcionário.</TableCell></TableRow>
                )}
                {(list.data ?? []).map((e) => (
                  <TableRow key={e.id}>
                    <TableCell><div className="font-medium">{e.name}</div><div className="text-xs text-muted-foreground">{e.email ?? e.phone ?? "—"}</div></TableCell>
                    <TableCell className="text-sm">{e.role ?? "—"}</TableCell>
                    <TableCell className="text-sm">{e.department ?? "—"}</TableCell>
                    <TableCell className="text-xs uppercase">{e.contract_type ?? "—"}</TableCell>
                    <TableCell className="text-xs">{e.hired_at ?? "—"}</TableCell>
                    <TableCell>{e.is_active ? <Badge variant="secondary">Ativo</Badge> : <Badge variant="outline">Inativo</Badge>}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => setEditing(e)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setToDelete(e)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {(creating || editing) && (
        <EmployeeFormDialog
          employee={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["employees"] }); setCreating(false); setEditing(null); }}
        />
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir funcionário?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => toDelete && delMut.mutate(toDelete.id)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EmployeeFormDialog({ employee, onClose, onSaved }: { employee: Employee | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!employee;
  const form = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: employee?.name ?? "",
      cpf: employee?.cpf ?? "",
      rg: employee?.rg ?? "",
      pis: employee?.pis ?? "",
      birth_date: employee?.birth_date ?? "",
      photo_url: employee?.photo_url ?? "",
      email: employee?.email ?? "",
      phone: employee?.phone ?? "",
      role: employee?.role ?? "",
      department: employee?.department ?? "",
      contract_type: (employee?.contract_type as EmployeeForm["contract_type"]) ?? undefined,
      hired_at: employee?.hired_at ?? "",
      fired_at: employee?.fired_at ?? "",
      salary: employee?.salary ? Number(employee.salary) : undefined,
      work_start: employee?.work_start ?? "",
      work_end: employee?.work_end ?? "",
      break_min: employee?.break_min ?? undefined,
      bank_name: employee?.bank_name ?? "",
      bank_agency: employee?.bank_agency ?? "",
      bank_account: employee?.bank_account ?? "",
      address_zip: employee?.address_zip ?? "",
      address_street: employee?.address_street ?? "",
      address_number: employee?.address_number ?? "",
      address_complement: employee?.address_complement ?? "",
      address_district: employee?.address_district ?? "",
      address_city: employee?.address_city ?? "",
      address_state: employee?.address_state ?? "",
      is_active: employee?.is_active ?? true,
    } as EmployeeForm,
  });

  const saveMut = useMutation({
    mutationFn: async (values: EmployeeForm) => {
      const payload = Object.fromEntries(
        Object.entries(values).map(([k, v]) => [k, v === "" ? null : v]),
      ) as never;
      if (isEdit && employee) {
        const { error } = await supabase.from("employees").update(payload).eq("id", employee.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("employees").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(isEdit ? "Funcionário atualizado" : "Funcionário cadastrado"); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? "Editar funcionário" : "Novo funcionário"}</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit((v) => saveMut.mutate(v))} className="space-y-4">
          <Tabs defaultValue="pessoal">
            <TabsList>
              <TabsTrigger value="pessoal">Pessoal</TabsTrigger>
              <TabsTrigger value="contrato">Contrato</TabsTrigger>
              <TabsTrigger value="endereco">Endereço</TabsTrigger>
              <TabsTrigger value="banco">Banco</TabsTrigger>
            </TabsList>

            <TabsContent value="pessoal" className="grid gap-3 pt-4 md:grid-cols-2">
              <Field label="Nome *"><Input {...form.register("name")} />{form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}</Field>
              <Field label="Foto (URL)"><Input {...form.register("photo_url")} /></Field>
              <Field label="CPF"><Input {...form.register("cpf")} /></Field>
              <Field label="RG"><Input {...form.register("rg")} /></Field>
              <Field label="PIS"><Input {...form.register("pis")} /></Field>
              <Field label="Nascimento"><Input type="date" {...form.register("birth_date")} /></Field>
              <Field label="Email"><Input {...form.register("email")} /></Field>
              <Field label="Telefone"><Input {...form.register("phone")} /></Field>
              <div className="flex items-center gap-2 pt-2">
                <Switch checked={form.watch("is_active")} onCheckedChange={(v) => form.setValue("is_active", v)} />
                <Label className="text-xs">Ativo</Label>
              </div>
            </TabsContent>

            <TabsContent value="contrato" className="grid gap-3 pt-4 md:grid-cols-2">
              <Field label="Cargo"><Input {...form.register("role")} /></Field>
              <Field label="Departamento"><Input {...form.register("department")} /></Field>
              <Field label="Tipo de contrato">
                <Select value={form.watch("contract_type") ?? ""} onValueChange={(v) => form.setValue("contract_type", v as EmployeeForm["contract_type"])}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clt">CLT</SelectItem>
                    <SelectItem value="pj">PJ</SelectItem>
                    <SelectItem value="estagio">Estágio</SelectItem>
                    <SelectItem value="temporario">Temporário</SelectItem>
                    <SelectItem value="autonomo">Autônomo</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Salário"><Input type="number" step="0.01" {...form.register("salary")} /></Field>
              <Field label="Admissão"><Input type="date" {...form.register("hired_at")} /></Field>
              <Field label="Demissão"><Input type="date" {...form.register("fired_at")} /></Field>
              <Field label="Início jornada"><Input type="time" {...form.register("work_start")} /></Field>
              <Field label="Fim jornada"><Input type="time" {...form.register("work_end")} /></Field>
              <Field label="Intervalo (min)"><Input type="number" {...form.register("break_min")} /></Field>
            </TabsContent>

            <TabsContent value="endereco" className="grid gap-3 pt-4 md:grid-cols-3">
              <Field label="CEP"><Input {...form.register("address_zip")} /></Field>
              <Field label="Rua" className="md:col-span-2"><Input {...form.register("address_street")} /></Field>
              <Field label="Número"><Input {...form.register("address_number")} /></Field>
              <Field label="Complemento"><Input {...form.register("address_complement")} /></Field>
              <Field label="Bairro"><Input {...form.register("address_district")} /></Field>
              <Field label="Cidade"><Input {...form.register("address_city")} /></Field>
              <Field label="UF"><Input maxLength={2} {...form.register("address_state")} /></Field>
            </TabsContent>

            <TabsContent value="banco" className="grid gap-3 pt-4 md:grid-cols-3">
              <Field label="Banco"><Input {...form.register("bank_name")} /></Field>
              <Field label="Agência"><Input {...form.register("bank_agency")} /></Field>
              <Field label="Conta"><Input {...form.register("bank_account")} /></Field>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saveMut.isPending}>
              {saveMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
