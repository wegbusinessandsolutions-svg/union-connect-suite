import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, RefreshCw, Loader2, Package } from "lucide-react";
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
import { ShieldAlert } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const BUCKET = "admin-assets";
const FOLDER = "kits";

type Kit = Tables<"kits_essenciais">;

type KitForm = {
  name: string;
  description: string;
  image_url: string;
  price: string;
  items: string;
  is_active: boolean;
};

export const Route = createFileRoute("/_authenticated/admin/kits-essenciais")({
  head: () => ({ meta: [{ title: "Kits Essenciais — Admin" }] }),
  component: KitsPage,
});

function KitsPage() {
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();
  const qc = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Kit | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Kit | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const list = useQuery({
    queryKey: ["kits_essenciais", search],
    enabled: isAdmin,
    queryFn: async () => {
      let q = supabase.from("kits_essenciais").select("*").order("created_at", { ascending: false }).limit(200);
      if (search) q = q.ilike("name", `%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as Kit[];
    },
  });

  const imgUrls = useSignedUrlsMap(BUCKET, (list.data ?? []).map((k) => k.image_url));

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kits_essenciais").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Kit excluído"); qc.invalidateQueries({ queryKey: ["kits_essenciais"] }); setToDelete(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: async (kit: Kit) => {
      const { error } = await supabase.from("kits_essenciais").update({ is_active: !kit.is_active }).eq("id", kit.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kits_essenciais"] }),
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
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><Package className="h-6 w-6" />Kits Essenciais</h1>
            <p className="text-sm text-muted-foreground">Combos de produtos pré-montados para o catálogo.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => list.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Atualizar</Button>
            <Button onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" />Novo Kit</Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{list.isLoading ? "Carregando…" : `${list.data?.length ?? 0} kit(s)`}</CardTitle>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nome…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-72 pl-8" />
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="w-[70px]">Imagem</TableHead>
                <TableHead>Nome</TableHead><TableHead>Descrição</TableHead><TableHead>Preço</TableHead>
                <TableHead>Itens</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(list.data ?? []).length === 0 && !list.isLoading && (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">Nenhum kit cadastrado.</TableCell></TableRow>
                )}
                {(list.data ?? []).map((k) => (
                  <TableRow key={k.id}>
                    <TableCell>
                      {k.image_url && imgUrls[k.image_url] ? (
                        <img src={imgUrls[k.image_url]} alt={k.name} className="h-12 w-12 rounded border object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded border bg-muted text-xs text-muted-foreground">—</div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{k.name}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{k.description ?? "—"}</TableCell>
                    <TableCell className="text-sm">{k.price ? `R$ ${Number(k.price).toFixed(2)}` : "—"}</TableCell>
                    <TableCell className="text-sm">{Array.isArray(k.items) ? k.items.length : 0}</TableCell>
                    <TableCell>
                      <button onClick={() => toggleMut.mutate(k)} className="cursor-pointer">
                        {k.is_active ? <Badge variant="secondary">Ativo</Badge> : <Badge variant="outline">Inativo</Badge>}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditing(k)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setToDelete(k)}><Trash2 className="h-4 w-4" /></Button>
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
        <KitDialog
          kit={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["kits_essenciais"] }); setCreating(false); setEditing(null); }}
        />
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir kit?</AlertDialogTitle>
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

function KitDialog({ kit, onClose, onSaved }: { kit: Kit | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!kit;
  const form = useForm<KitForm>({
    defaultValues: {
      name: kit?.name ?? "",
      description: kit?.description ?? "",
      image_url: kit?.image_url ?? "",
      price: kit?.price ? String(kit.price) : "",
      items: kit?.items ? JSON.stringify(kit.items, null, 2) : "[]",
      is_active: kit?.is_active ?? true,
    },
  });

  const saveMut = useMutation({
    mutationFn: async (values: KitForm) => {
      let items: unknown = [];
      try { items = JSON.parse(values.items || "[]"); }
      catch { throw new Error("Itens (JSON) inválido"); }
      const payload = {
        name: values.name,
        description: values.description || null,
        image_url: values.image_url || null,
        price: values.price ? Number(values.price) : null,
        items: items as never,
        is_active: values.is_active,
      };
      if (isEdit && kit) {
        const { error } = await supabase.from("kits_essenciais").update(payload).eq("id", kit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("kits_essenciais").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success(isEdit ? "Kit atualizado" : "Kit criado"); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? "Editar kit" : "Novo kit"}</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit((v) => saveMut.mutate(v))} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Nome *"><Input {...form.register("name", { required: true })} /></Field>
            <Field label="Preço (R$)"><Input type="number" step="0.01" {...form.register("price")} /></Field>
            <div className="md:col-span-2">
              <ImageUploader
                bucket={BUCKET}
                folder={FOLDER}
                label="Imagem do kit"
                value={form.watch("image_url") || null}
                onChange={(p) => form.setValue("image_url", p ?? "")}
              />
            </div>
            <Field label="Descrição" className="md:col-span-2"><Textarea rows={3} {...form.register("description")} /></Field>
            <Field label="Itens (JSON)" className="md:col-span-2">
              <Textarea rows={5} className="font-mono text-xs" {...form.register("items")} />
              <p className="text-xs text-muted-foreground">Ex.: [{`{"sku":"ABC","qty":2}`}]</p>
            </Field>
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
