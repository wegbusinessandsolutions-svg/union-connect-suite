import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, RefreshCw, Loader2, FolderTree, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tables } from "@/integrations/supabase/types";

type Category = Tables<"product_categories"> & { image_url?: string | null };

const BUCKET = "category-images";

const categorySchema = z.object({
  name: z.string().trim().min(2, "Nome obrigatório").max(120),
  parent_id: z.string().uuid().nullable().optional(),
  image_url: z.string().optional().nullable(),
});
type CategoryForm = z.infer<typeof categorySchema>;

export const Route = createFileRoute("/_authenticated/comercial/categorias")({
  head: () => ({ meta: [{ title: "Categorias — Comercial" }] }),
  component: CategoriasPage,
});

function CategoriasPage() {
  const qc = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Category | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const list = useQuery({
    queryKey: ["product_categories", search],
    queryFn: async () => {
      let q = supabase.from("product_categories").select("*").order("name");
      if (search) q = q.ilike("name", `%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as Category[];
    },
  });

  const signedUrls = useSignedUrls(list.data ?? []);

  const delMut = useMutation({
    mutationFn: async (cat: Category) => {
      // Try delete image first (ignore failure)
      if (cat.image_url) {
        await supabase.storage.from(BUCKET).remove([cat.image_url]).catch(() => {});
      }
      const { error } = await supabase.from("product_categories").delete().eq("id", cat.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Categoria excluída");
      qc.invalidateQueries({ queryKey: ["product_categories"] });
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const parentName = (id: string | null) => list.data?.find((c) => c.id === id)?.name ?? "—";

  return (
    <div className="bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Categorias de produtos</h1>
            <p className="text-sm text-muted-foreground">Organize o catálogo em categorias com imagem.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => list.refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
            </Button>
            <Button onClick={() => setCreating(true)}>
              <Plus className="mr-2 h-4 w-4" /> Nova categoria
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-base">
              {list.isFetching ? "Carregando…" : `${list.data?.length ?? 0} categoria(s)`}
            </CardTitle>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome…"
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
                  <TableHead className="w-[80px]">Imagem</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria pai</TableHead>
                  <TableHead className="w-[180px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.isError && (
                  <TableRow><TableCell colSpan={4} className="py-8 text-center text-sm text-red-600">
                    {(list.error as Error).message}
                  </TableCell></TableRow>
                )}
                {!list.isError && list.data?.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    Nenhuma categoria cadastrada.
                  </TableCell></TableRow>
                )}
                {list.data?.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      {c.image_url && signedUrls[c.image_url] ? (
                        <img src={signedUrls[c.image_url]} alt="" className="h-12 w-12 rounded object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
                          <FolderTree className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{parentName(c.parent_id)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <ReportActions data={categoryReport(c)} filename={`categoria-${c.name}`} />
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
        <CategoryFormDialog
          category={editing}
          categories={list.data ?? []}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["product_categories"] });
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Categoria: <b>{toDelete?.name}</b>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toDelete && delMut.mutate(toDelete)}
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

function useSignedUrls(items: Category[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    const paths = items.map((i) => i.image_url).filter((p): p is string => !!p);
    if (paths.length === 0) { setUrls({}); return; }
    let cancel = false;
    (async () => {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600);
      if (cancel || !data) return;
      const map: Record<string, string> = {};
      data.forEach((d) => { if (d.path && d.signedUrl) map[d.path] = d.signedUrl; });
      setUrls(map);
    })();
    return () => { cancel = true; };
  }, [items]);
  return urls;
}

function CategoryFormDialog({
  category, categories, onClose, onSaved,
}: {
  category: Category | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!category;
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema) as never,
    defaultValues: category
      ? { name: category.name, parent_id: category.parent_id, image_url: category.image_url ?? null }
      : { name: "", parent_id: null, image_url: null },
  });

  const currentImage = form.watch("image_url");

  useEffect(() => {
    if (!currentImage) { setPreviewUrl(null); return; }
    let cancel = false;
    (async () => {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(currentImage, 3600);
      if (!cancel) setPreviewUrl(data?.signedUrl ?? null);
    })();
    return () => { cancel = true; };
  }, [currentImage]);

  const handleUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 5 MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (error) throw error;
      // Remove old image if editing
      const old = form.getValues("image_url");
      if (old) await supabase.storage.from(BUCKET).remove([old]).catch(() => {});
      form.setValue("image_url", path);
      toast.success("Imagem enviada");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const submit = form.handleSubmit(async (values) => {
    const payload = {
      name: values.name,
      parent_id: values.parent_id || null,
      image_url: values.image_url || null,
    };
    try {
      if (isEdit) {
        const { error } = await supabase.from("product_categories").update(payload as never).eq("id", category!.id);
        if (error) throw error;
        toast.success("Categoria atualizada");
      } else {
        const { error } = await supabase.from("product_categories").insert(payload as never);
        if (error) throw error;
        toast.success("Categoria criada");
      }
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    }
  });

  const parentOptions = categories.filter((c) => c.id !== category?.id);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar categoria" : "Nova categoria"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Nome *</Label>
            <Input {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Categoria pai</Label>
            <Select
              value={form.watch("parent_id") ?? "none"}
              onValueChange={(v) => form.setValue("parent_id", v === "none" ? null : v)}
            >
              <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Nenhuma —</SelectItem>
                {parentOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Imagem da categoria</Label>
            <div className="flex items-center gap-3">
              {previewUrl ? (
                <img src={previewUrl} alt="preview" className="h-24 w-24 rounded border object-cover" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded border bg-muted">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                    e.target.value = "";
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {currentImage ? "Trocar imagem" : "Enviar imagem"}
                </Button>
                {currentImage && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await supabase.storage.from(BUCKET).remove([currentImage]).catch(() => {});
                      form.setValue("image_url", null);
                    }}
                  >
                    Remover
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">JPG, PNG ou WebP até 5 MB.</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={form.formState.isSubmitting || uploading}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
