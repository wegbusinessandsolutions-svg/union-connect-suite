import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, RefreshCw, Loader2, Gift, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { ImageUploader, useSignedUrlsMap } from "@/components/image-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Tables } from "@/integrations/supabase/types";

const BUCKET = "admin-assets";
const FOLDER = "clube";

type Beneficio = Tables<"clube_beneficios">;

type BeneficioForm = {
  name: string;
  description: string;
  image_url: string;
  benefit_type: string;
  discount_value: string;
  terms: string;
  is_active: boolean;
};

export const Route = createFileRoute("/_authenticated/admin/clube-beneficios")({
  head: () => ({ meta: [{ title: "Clube de Benefícios — Admin" }] }),
  component: ClubePage,
});

function ClubePage() {
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();
  const qc = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Beneficio | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Beneficio | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const list = useQuery({
    queryKey: ["clube_beneficios", search],
    enabled: isAdmin,
    queryFn: async () => {
      let q = supabase.from("clube_beneficios").select("*").order("created_at", { ascending: false }).limit(200);
      if (search) q = q.ilike("name", `%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as Beneficio[];
    },
  });

  const imgUrls = useSignedUrlsMap(BUCKET, (list.data ?? []).map((b) => b.image_url));

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clube_beneficios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Benefício excluído"); qc.invalidateQueries({ queryKey: ["clube_beneficios"] }); setToDelete(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: async (b: Beneficio) => {
      const { error } = await supabase.from("clube_beneficios").update({ is_active: !b.is_active }).eq("id", b.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clube_beneficios"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  if (roleLoading) return <div className="p-6 text-sm text-muted-foreground">Verificando permissões…</div>;
  if (!isAdmin) return (
    <div className="p-6">
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Acesso negado</AlertTitle>
        <AlertDescription>Apenas administradores podem acessar esta área.</AlertDescription>
      </Alert>
    </div>
  );

  return (
    <div className="bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><Gift className="h-6 w-6" />Clube de Benefícios</h1>
            <p className="text-sm text-muted-foreground">Vantagens, descontos e brindes oferecidos aos clientes.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => list.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Atualizar</Button>
            <Button onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" />Novo Benefício</Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{list.isLoading ? "Carregando…" : `${list.data?.length ?? 0} benefício(s)`}</CardTitle>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nome…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-72 pl-8" />
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="w-[70px]">Imagem</TableHead>
                <TableHead>Benefício</TableHead><TableHead>Tipo</TableHead><TableHead>Valor</TableHead>
                <TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(list.data ?? []).length === 0 && !list.isLoading && (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">Nenhum benefício cadastrado.</TableCell></TableRow>
                )}
                {(list.data ?? []).map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      {b.image_url && imgUrls[b.image_url] ? (
                        <img src={imgUrls[b.image_url]} alt={b.name} className="h-12 w-12 rounded border object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded border bg-muted text-xs text-muted-foreground">—</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{b.name}</div>
                      <div className="max-w-xs truncate text-xs text-muted-foreground">{b.description ?? "—"}</div>
                    </TableCell>
                    <TableCell className="text-sm">{b.benefit_type ?? "—"}</TableCell>
                    <TableCell className="text-sm">{b.discount_value ? Number(b.discount_value).toFixed(2) : "—"}</TableCell>
                    <TableCell>
                      <button onClick={() => toggleMut.mutate(b)} className="cursor-pointer">
                        {b.is_active ? <Badge variant="secondary">Ativo</Badge> : <Badge variant="outline">Inativo</Badge>}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditing(b)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setToDelete(b)}><Trash2 className="h-4 w-4" /></Button>
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
        <BeneficioDialog
          beneficio={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["clube_beneficios"] }); setCreating(false); setEditing(null); }}
        />
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir benefício?</AlertDialogTitle>
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

function BeneficioDialog({ beneficio, onClose, onSaved }: { beneficio: Beneficio | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!beneficio;
  const form = useForm<BeneficioForm>({
    defaultValues: {
      name: beneficio?.name ?? "",
      description: beneficio?.description ?? "",
      image_url: beneficio?.image_url ?? "",
      benefit_type: beneficio?.benefit_type ?? "",
      discount_value: beneficio?.discount_value ? String(beneficio.discount_value) : "",
      terms: beneficio?.terms ?? "",
      is_active: beneficio?.is_active ?? true,
    },
  });

  const saveMut = useMutation({
    mutationFn: async (values: BeneficioForm) => {
      const payload = {
        name: values.name,
        description: values.description || null,
        image_url: values.image_url || null,
        benefit_type: values.benefit_type || null,
        discount_value: values.discount_value ? Number(values.discount_value) : null,
        terms: values.terms || null,
        is_active: values.is_active,
      };
      if (isEdit && beneficio) {
        const { error } = await supabase.from("clube_beneficios").update(payload).eq("id", beneficio.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clube_beneficios").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(isEdit ? "Benefício atualizado" : "Benefício criado"); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? "Editar benefício" : "Novo benefício"}</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit((v) => saveMut.mutate(v))} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Nome *"><Input {...form.register("name", { required: true })} /></Field>
            <Field label="Tipo">
              <Select value={form.watch("benefit_type")} onValueChange={(v) => form.setValue("benefit_type", v)}>
                <SelectTrigger><SelectValue placeholder="Selecionar…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="desconto_pct">Desconto (%)</SelectItem>
                  <SelectItem value="desconto_valor">Desconto (R$)</SelectItem>
                  <SelectItem value="cashback">Cashback</SelectItem>
                  <SelectItem value="brinde">Brinde</SelectItem>
                  <SelectItem value="frete_gratis">Frete grátis</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Valor"><Input type="number" step="0.01" {...form.register("discount_value")} /></Field>
            <div className="md:col-span-2">
              <ImageUploader
                bucket={BUCKET}
                folder={FOLDER}
                label="Imagem do benefício"
                value={form.watch("image_url") || null}
                onChange={(p) => form.setValue("image_url", p ?? "")}
              />
            </div>
            <Field label="Descrição" className="md:col-span-2"><Textarea rows={3} {...form.register("description")} /></Field>
            <Field label="Regras / termos" className="md:col-span-2"><Textarea rows={3} {...form.register("terms")} /></Field>
            <div className="flex items-center gap-2">
              <Switch checked={form.watch("is_active")} onCheckedChange={(v) => form.setValue("is_active", v)} />
              <Label className="text-xs">Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saveMut.isPending}>
              {saveMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Salvar" : "Criar"}
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
