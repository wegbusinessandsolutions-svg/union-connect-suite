import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, RefreshCw, Loader2, Handshake, ShieldAlert } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Tables } from "@/integrations/supabase/types";

const BUCKET = "admin-assets";
const FOLDER = "marcas";

type Marca = Tables<"marcas_parceiras">;

type MarcaForm = {
  name: string;
  description: string;
  logo_url: string;
  website: string;
  discount_pct: string;
  is_active: boolean;
};

export const Route = createFileRoute("/_authenticated/admin/marcas-parceiras")({
  head: () => ({ meta: [{ title: "Marcas Parceiras — Admin" }] }),
  component: MarcasPage,
});

function MarcasPage() {
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();
  const qc = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Marca | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Marca | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const list = useQuery({
    queryKey: ["marcas_parceiras", search],
    enabled: isAdmin,
    queryFn: async () => {
      let q = supabase.from("marcas_parceiras").select("*").order("created_at", { ascending: false }).limit(200);
      if (search) q = q.ilike("name", `%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as Marca[];
    },
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("marcas_parceiras").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Marca excluída"); qc.invalidateQueries({ queryKey: ["marcas_parceiras"] }); setToDelete(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: async (m: Marca) => {
      const { error } = await supabase.from("marcas_parceiras").update({ is_active: !m.is_active }).eq("id", m.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["marcas_parceiras"] }),
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
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><Handshake className="h-6 w-6" />Marcas Parceiras</h1>
            <p className="text-sm text-muted-foreground">Parceiros estratégicos com benefícios para os clientes.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => list.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Atualizar</Button>
            <Button onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" />Nova Marca</Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{list.isLoading ? "Carregando…" : `${list.data?.length ?? 0} marca(s)`}</CardTitle>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nome…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-72 pl-8" />
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Marca</TableHead><TableHead>Site</TableHead><TableHead>Desconto</TableHead>
                <TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(list.data ?? []).length === 0 && !list.isLoading && (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Nenhuma marca cadastrada.</TableCell></TableRow>
                )}
                {(list.data ?? []).map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {m.logo_url && logoUrls[m.logo_url] ? (
                          <img src={logoUrls[m.logo_url]} alt={m.name} className="h-10 w-10 rounded border object-contain" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded border bg-muted text-xs text-muted-foreground">—</div>
                        )}
                        <div>
                          <div className="font-medium">{m.name}</div>
                          <div className="max-w-xs truncate text-xs text-muted-foreground">{m.description ?? "—"}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{m.website ? <a className="underline" href={m.website} target="_blank" rel="noreferrer">Abrir</a> : "—"}</TableCell>
                    <TableCell className="text-sm">{m.discount_pct ? `${Number(m.discount_pct).toFixed(2)}%` : "—"}</TableCell>
                    <TableCell>
                      <button onClick={() => toggleMut.mutate(m)} className="cursor-pointer">
                        {m.is_active ? <Badge variant="secondary">Ativa</Badge> : <Badge variant="outline">Inativa</Badge>}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditing(m)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setToDelete(m)}><Trash2 className="h-4 w-4" /></Button>
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
        <MarcaDialog
          marca={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["marcas_parceiras"] }); setCreating(false); setEditing(null); }}
        />
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir marca?</AlertDialogTitle>
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

function MarcaDialog({ marca, onClose, onSaved }: { marca: Marca | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!marca;
  const form = useForm<MarcaForm>({
    defaultValues: {
      name: marca?.name ?? "",
      description: marca?.description ?? "",
      logo_url: marca?.logo_url ?? "",
      website: marca?.website ?? "",
      discount_pct: marca?.discount_pct ? String(marca.discount_pct) : "",
      is_active: marca?.is_active ?? true,
    },
  });

  const saveMut = useMutation({
    mutationFn: async (values: MarcaForm) => {
      const payload = {
        name: values.name,
        description: values.description || null,
        logo_url: values.logo_url || null,
        website: values.website || null,
        discount_pct: values.discount_pct ? Number(values.discount_pct) : null,
        is_active: values.is_active,
      };
      if (isEdit && marca) {
        const { error } = await supabase.from("marcas_parceiras").update(payload).eq("id", marca.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("marcas_parceiras").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(isEdit ? "Marca atualizada" : "Marca criada"); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? "Editar marca" : "Nova marca"}</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit((v) => saveMut.mutate(v))} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Nome *"><Input {...form.register("name", { required: true })} /></Field>
            <Field label="Desconto (%)"><Input type="number" step="0.01" {...form.register("discount_pct")} /></Field>
            <Field label="Logo (URL)"><Input {...form.register("logo_url")} /></Field>
            <Field label="Website"><Input {...form.register("website")} /></Field>
            <Field label="Descrição" className="md:col-span-2"><Textarea rows={3} {...form.register("description")} /></Field>
            <div className="flex items-center gap-2">
              <Switch checked={form.watch("is_active")} onCheckedChange={(v) => form.setValue("is_active", v)} />
              <Label className="text-xs">Ativa</Label>
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
