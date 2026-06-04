import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, RefreshCw, Loader2, Package, Upload, X, Image as ImageIcon } from "lucide-react";
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { productSchema, type ProductForm } from "@/lib/comercial-schemas";
import { ReportActions } from "@/components/report-actions";
import { productReport } from "@/lib/report-builders";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

const BUCKET = "product-images";
const MAX_GALLERY = 3;

export const Route = createFileRoute("/_authenticated/comercial/produtos")({
  head: () => ({ meta: [{ title: "Produtos — Comercial" }] }),
  component: ProdutosPage,
});

async function signPath(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  // backward-compat: if it's already an http URL, just return it
  if (/^https?:\/\//i.test(path)) return path;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

function useSignedThumbnails(paths: (string | null | undefined)[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = paths.filter(Boolean).join("|");
  useEffect(() => {
    const clean = paths.filter((p): p is string => !!p && !/^https?:\/\//i.test(p));
    if (clean.length === 0) { setUrls({}); return; }
    let cancel = false;
    (async () => {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrls(clean, 3600);
      if (cancel || !data) return;
      const map: Record<string, string> = {};
      data.forEach((d) => { if (d.path && d.signedUrl) map[d.path] = d.signedUrl; });
      setUrls(map);
    })();
    return () => { cancel = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return urls;
}

function ProdutosPage() {
  const qc = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Product | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const list = useQuery({
    queryKey: ["products", search],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (search) q = q.or(`name.ilike.%${search}%,sku.ilike.%${search}%,ean.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as Product[];
    },
  });

  const thumbs = useSignedThumbnails((list.data ?? []).map((p) => p.image_main_url));

  const delMut = useMutation({
    mutationFn: async (p: Product) => {
      const paths: string[] = [];
      if (p.image_main_url && !/^https?:\/\//i.test(p.image_main_url)) paths.push(p.image_main_url);
      const gallery = Array.isArray(p.images) ? (p.images as unknown[]).filter((x): x is string => typeof x === "string" && !/^https?:\/\//i.test(x)) : [];
      paths.push(...gallery);
      if (paths.length) await supabase.storage.from(BUCKET).remove(paths).catch(() => {});
      const { error } = await supabase.from("products").delete().eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produto excluído");
      qc.invalidateQueries({ queryKey: ["products"] });
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
            <p className="text-sm text-muted-foreground">Catálogo, preços por tier e controle de estoque.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => list.refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
            </Button>
            <Button onClick={() => setCreating(true)}>
              <Plus className="mr-2 h-4 w-4" /> Novo produto
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-base">
              {list.isFetching ? "Carregando…" : `${list.data?.length ?? 0} produto(s)`}
            </CardTitle>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, SKU ou EAN…"
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
                  <TableHead>Produto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Preço venda</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Cashback</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[180px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.isError && (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-red-600">
                    {(list.error as Error).message}
                  </TableCell></TableRow>
                )}
                {!list.isError && list.data?.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    Nenhum produto cadastrado.
                  </TableCell></TableRow>
                )}
                {list.data?.map((p) => {
                  const lowStock = p.stock_min != null && p.stock_qty <= p.stock_min;
                  const thumb = p.image_main_url
                    ? (/^https?:\/\//i.test(p.image_main_url) ? p.image_main_url : thumbs[p.image_main_url])
                    : null;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {thumb ? (
                            <img src={thumb} alt="" className="h-10 w-10 rounded object-cover" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{p.name}</div>
                            <div className="text-xs text-muted-foreground">{p.brand ?? ""}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{p.sku ?? "—"}</TableCell>
                      <TableCell className="font-mono">R$ {Number(p.price_sale).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={lowStock ? "destructive" : "secondary"}>{p.stock_qty}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{Number(p.cashback_pct ?? 0).toFixed(2)}%</TableCell>
                      <TableCell>
                        {p.is_active ? <Badge variant="secondary">Ativo</Badge> : <Badge variant="outline">Inativo</Badge>}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <ReportActions data={productReport(p)} filename={`produto-${p.sku ?? p.id.slice(0, 8)}`} />
                          <Button size="icon" variant="ghost" onClick={() => setEditing(p)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setToDelete(p)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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
        <ProductFormDialog
          product={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["products"] });
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Produto: <b>{toDelete?.name}</b>
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

function ProductFormDialog({
  product, onClose, onSaved,
}: {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!product;
  const mainInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [mainPreview, setMainPreview] = useState<string | null>(null);

  const categoriesQ = useQuery({
    queryKey: ["product_categories", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("product_categories").select("id,name").order("name");
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  const initialGallery: string[] = Array.isArray(product?.images)
    ? (product!.images as unknown[]).filter((x): x is string => typeof x === "string")
    : [];

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema) as never,
    defaultValues: product
      ? {
          name: product.name,
          category_id: product.category_id ?? null,
          sku: product.sku ?? "",
          ean: product.ean ?? "",
          brand: product.brand ?? "",
          description_short: product.description_short ?? "",
          description_long: product.description_long ?? "",
          image_main_url: product.image_main_url ?? "",
          images: initialGallery,
          unit_measure: product.unit_measure ?? "",
          weight_kg: product.weight_kg ?? undefined,
          cost_last: product.cost_last ?? undefined,
          price_sale: Number(product.price_sale),
          price_min: product.price_min ?? undefined,
          price_bronze: product.price_bronze ?? undefined,
          price_prata: product.price_prata ?? undefined,
          price_ouro: product.price_ouro ?? undefined,
          price_diamante: product.price_diamante ?? undefined,
          cashback_pct: Number(product.cashback_pct ?? 0),
          stock_qty: product.stock_qty,
          stock_min: product.stock_min ?? undefined,
          stock_location: product.stock_location ?? "",
          is_active: product.is_active,
          ncm: product.ncm ?? "",
          cest: product.cest ?? "",
          cfop: product.cfop ?? "",
          origem: product.origem ?? "",
          unidade_tributavel: product.unidade_tributavel ?? "",
          ean_tributavel: product.ean_tributavel ?? "",
          fator_conversao_tributavel: product.fator_conversao_tributavel ?? undefined,
          cst_icms: product.cst_icms ?? "",
          csosn: product.csosn ?? "",
          aliquota_icms: product.aliquota_icms ?? undefined,
          aliquota_icms_st: product.aliquota_icms_st ?? undefined,
          cst_ipi: product.cst_ipi ?? "",
          aliquota_ipi: product.aliquota_ipi ?? undefined,
          cst_pis: product.cst_pis ?? "",
          aliquota_pis: product.aliquota_pis ?? undefined,
          cst_cofins: product.cst_cofins ?? "",
          aliquota_cofins: product.aliquota_cofins ?? undefined,
          codigo_beneficio_fiscal: product.codigo_beneficio_fiscal ?? "",
          peso_bruto_kg: product.peso_bruto_kg ?? undefined,
          peso_liquido_kg: product.peso_liquido_kg ?? undefined,
          valor_aproximado_tributos: product.valor_aproximado_tributos ?? undefined,
          codigo_anp: product.codigo_anp ?? "",
          escala_relevante: product.escala_relevante ?? "",
          cnpj_fabricante: product.cnpj_fabricante ?? "",
          gtin_embalagem: product.gtin_embalagem ?? "",
          informacoes_adicionais: product.informacoes_adicionais ?? "",
        }
      : {
          name: "",
          category_id: null,
          image_main_url: "",
          images: [],
          price_sale: 0,
          cashback_pct: 0,
          stock_qty: 0,
          is_active: true,
        },
  });

  const mainPath = form.watch("image_main_url");
  const gallery = form.watch("images") ?? [];
  const galleryThumbs = useSignedThumbnails(gallery);

  // Sign main image
  useEffect(() => {
    let cancel = false;
    (async () => {
      const url = await signPath(mainPath || null);
      if (!cancel) setMainPreview(url);
    })();
    return () => { cancel = true; };
  }, [mainPath]);

  const uploadFile = async (file: File): Promise<string> => {
    if (file.size > 5 * 1024 * 1024) throw new Error("Imagem deve ter no máximo 5 MB");
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600", upsert: false, contentType: file.type,
    });
    if (error) throw error;
    return path;
  };

  const handleMainUpload = async (file: File) => {
    setUploadingMain(true);
    try {
      const path = await uploadFile(file);
      const old = form.getValues("image_main_url");
      if (old && !/^https?:\/\//i.test(old)) {
        await supabase.storage.from(BUCKET).remove([old]).catch(() => {});
      }
      form.setValue("image_main_url", path);
      toast.success("Imagem principal enviada");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploadingMain(false);
    }
  };

  const handleGalleryUpload = async (files: FileList) => {
    const remaining = MAX_GALLERY - gallery.length;
    if (remaining <= 0) { toast.error(`Máximo ${MAX_GALLERY} imagens na galeria`); return; }
    const toUpload = Array.from(files).slice(0, remaining);
    setUploadingGallery(true);
    try {
      const paths: string[] = [];
      for (const f of toUpload) {
        paths.push(await uploadFile(f));
      }
      form.setValue("images", [...gallery, ...paths]);
      toast.success(`${paths.length} imagem(ns) enviada(s)`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploadingGallery(false);
    }
  };

  const removeGalleryAt = async (idx: number) => {
    const path = gallery[idx];
    if (path && !/^https?:\/\//i.test(path)) {
      await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
    }
    form.setValue("images", gallery.filter((_, i) => i !== idx));
  };

  const removeMain = async () => {
    const old = form.getValues("image_main_url");
    if (old && !/^https?:\/\//i.test(old)) {
      await supabase.storage.from(BUCKET).remove([old]).catch(() => {});
    }
    form.setValue("image_main_url", "");
  };

  const submit = form.handleSubmit(async (values) => {
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(values)) {
      if (k === "images") { payload[k] = v ?? []; continue; }
      payload[k] = v === "" || v === undefined ? null : v;
    }
    payload.name = values.name;
    payload.price_sale = values.price_sale;
    payload.stock_qty = values.stock_qty;
    payload.is_active = values.is_active;
    payload.cashback_pct = values.cashback_pct ?? 0;
    payload.images = values.images ?? [];

    try {
      if (isEdit) {
        const { error } = await supabase.from("products").update(payload as never).eq("id", product!.id);
        if (error) throw error;
        toast.success("Produto atualizado");
      } else {
        const { error } = await supabase.from("products").insert(payload as never);
        if (error) throw error;
        toast.success("Produto criado");
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
          <DialogTitle>{isEdit ? "Editar produto" : "Novo produto"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <Tabs defaultValue="basic">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="prices">Preços</TabsTrigger>
              <TabsTrigger value="stock">Estoque</TabsTrigger>
              <TabsTrigger value="media">Mídia</TabsTrigger>
              <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-3 pt-3">
              <Field label="Nome *" error={form.formState.errors.name?.message}>
                <Input {...form.register("name")} />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="SKU"><Input {...form.register("sku")} /></Field>
                <Field label="EAN"><Input {...form.register("ean")} /></Field>
                <Field label="Marca"><Input {...form.register("brand")} /></Field>
              </div>
              <Field label="Categoria">
                <Select
                  value={form.watch("category_id") ?? "none"}
                  onValueChange={(v) => form.setValue("category_id", v === "none" ? null : v)}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Nenhuma —</SelectItem>
                    {categoriesQ.data?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Descrição curta">
                <Input {...form.register("description_short")} />
              </Field>
              <Field label="Descrição longa">
                <Textarea rows={4} {...form.register("description_long")} />
              </Field>
              <div className="flex items-center gap-2">
                <Switch checked={form.watch("is_active")} onCheckedChange={(v) => form.setValue("is_active", v)} />
                <Label>Ativo (visível no catálogo)</Label>
              </div>
            </TabsContent>

            <TabsContent value="prices" className="space-y-3 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Custo último"><Input type="number" step="0.01" {...form.register("cost_last")} /></Field>
                <Field label="Preço venda *" error={form.formState.errors.price_sale?.message}>
                  <Input type="number" step="0.01" {...form.register("price_sale")} />
                </Field>
                <Field label="Preço mínimo"><Input type="number" step="0.01" {...form.register("price_min")} /></Field>
                <Field label="Cashback %"><Input type="number" step="0.01" {...form.register("cashback_pct")} /></Field>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <Field label="Bronze"><Input type="number" step="0.01" {...form.register("price_bronze")} /></Field>
                <Field label="Prata"><Input type="number" step="0.01" {...form.register("price_prata")} /></Field>
                <Field label="Ouro"><Input type="number" step="0.01" {...form.register("price_ouro")} /></Field>
                <Field label="Diamante"><Input type="number" step="0.01" {...form.register("price_diamante")} /></Field>
              </div>
            </TabsContent>

            <TabsContent value="stock" className="space-y-3 pt-3">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Qtd atual *"><Input type="number" {...form.register("stock_qty")} /></Field>
                <Field label="Estoque mínimo"><Input type="number" {...form.register("stock_min")} /></Field>
                <Field label="Localização"><Input {...form.register("stock_location")} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Unidade (UN/KG/L)"><Input {...form.register("unit_measure")} /></Field>
                <Field label="Peso (kg)"><Input type="number" step="0.001" {...form.register("weight_kg")} /></Field>
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-4 pt-3">
              <div className="space-y-2">
                <Label className="text-xs">Imagem principal</Label>
                <div className="flex items-center gap-3">
                  {mainPreview ? (
                    <img src={mainPreview} alt="principal" className="h-28 w-28 rounded border object-cover" />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded border bg-muted">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <input
                      ref={mainInput}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleMainUpload(f);
                        e.target.value = "";
                      }}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => mainInput.current?.click()} disabled={uploadingMain}>
                      {uploadingMain ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      {mainPath ? "Trocar" : "Enviar"}
                    </Button>
                    {mainPath && (
                      <Button type="button" variant="ghost" size="sm" onClick={removeMain}>Remover</Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Galeria (até {MAX_GALLERY} imagens)</Label>
                  <span className="text-xs text-muted-foreground">{gallery.length}/{MAX_GALLERY}</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {gallery.map((path, idx) => {
                    const url = /^https?:\/\//i.test(path) ? path : galleryThumbs[path];
                    return (
                      <div key={path + idx} className="relative">
                        {url ? (
                          <img src={url} alt={`img ${idx + 1}`} className="h-28 w-full rounded border object-cover" />
                        ) : (
                          <div className="flex h-28 w-full items-center justify-center rounded border bg-muted">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeGalleryAt(idx)}
                          className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground shadow"
                          aria-label="Remover"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                  {gallery.length < MAX_GALLERY && (
                    <button
                      type="button"
                      onClick={() => galleryInput.current?.click()}
                      className="flex h-28 w-full flex-col items-center justify-center gap-1 rounded border border-dashed text-xs text-muted-foreground hover:bg-muted"
                      disabled={uploadingGallery}
                    >
                      {uploadingGallery ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Adicionar
                    </button>
                  )}
                </div>
                <input
                  ref={galleryInput}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) handleGalleryUpload(e.target.files);
                    e.target.value = "";
                  }}
                />
                <p className="text-xs text-muted-foreground">JPG, PNG ou WebP até 5 MB cada.</p>
              </div>
            </TabsContent>

            <TabsContent value="fiscal" className="space-y-3 pt-3">
              <p className="text-xs text-muted-foreground">
                Campos para emissão de NF-e conforme layout SEFAZ-GO.
              </p>
              <div className="grid grid-cols-3 gap-3">
                <Field label="NCM"><Input maxLength={10} placeholder="00000000" {...form.register("ncm")} /></Field>
                <Field label="CEST"><Input maxLength={10} placeholder="0000000" {...form.register("cest")} /></Field>
                <Field label="CFOP"><Input maxLength={10} placeholder="5102" {...form.register("cfop")} /></Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Origem (0-8)"><Input maxLength={2} {...form.register("origem")} /></Field>
                <Field label="Unidade tributável"><Input maxLength={10} {...form.register("unidade_tributavel")} /></Field>
                <Field label="Fator conversão tributável"><Input type="number" step="0.0001" {...form.register("fator_conversao_tributavel")} /></Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="EAN tributável"><Input {...form.register("ean_tributavel")} /></Field>
                <Field label="GTIN embalagem"><Input {...form.register("gtin_embalagem")} /></Field>
                <Field label="CNPJ fabricante"><Input {...form.register("cnpj_fabricante")} /></Field>
              </div>

              <div className="rounded border p-3">
                <Label className="text-xs font-semibold">ICMS</Label>
                <div className="mt-2 grid grid-cols-4 gap-3">
                  <Field label="CST ICMS (Reg. Normal)"><Input maxLength={5} {...form.register("cst_icms")} /></Field>
                  <Field label="CSOSN (Simples)"><Input maxLength={5} {...form.register("csosn")} /></Field>
                  <Field label="Alíquota ICMS %"><Input type="number" step="0.01" {...form.register("aliquota_icms")} /></Field>
                  <Field label="Alíquota ICMS-ST %"><Input type="number" step="0.01" {...form.register("aliquota_icms_st")} /></Field>
                </div>
              </div>

              <div className="rounded border p-3">
                <Label className="text-xs font-semibold">IPI / PIS / COFINS</Label>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  <Field label="CST IPI"><Input maxLength={5} {...form.register("cst_ipi")} /></Field>
                  <Field label="Alíquota IPI %"><Input type="number" step="0.01" {...form.register("aliquota_ipi")} /></Field>
                  <Field label="Cód. Benefício Fiscal"><Input {...form.register("codigo_beneficio_fiscal")} /></Field>
                  <Field label="CST PIS"><Input maxLength={5} {...form.register("cst_pis")} /></Field>
                  <Field label="Alíquota PIS %"><Input type="number" step="0.01" {...form.register("aliquota_pis")} /></Field>
                  <Field label="CST COFINS"><Input maxLength={5} {...form.register("cst_cofins")} /></Field>
                  <Field label="Alíquota COFINS %"><Input type="number" step="0.01" {...form.register("aliquota_cofins")} /></Field>
                  <Field label="Valor aprox. tributos R$"><Input type="number" step="0.01" {...form.register("valor_aproximado_tributos")} /></Field>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Peso bruto (kg)"><Input type="number" step="0.001" {...form.register("peso_bruto_kg")} /></Field>
                <Field label="Peso líquido (kg)"><Input type="number" step="0.001" {...form.register("peso_liquido_kg")} /></Field>
                <Field label="Código ANP"><Input {...form.register("codigo_anp")} /></Field>
                <Field label="Escala relevante (S/N)"><Input maxLength={5} {...form.register("escala_relevante")} /></Field>
              </div>
              <Field label="Informações adicionais (NF-e)">
                <Textarea rows={3} {...form.register("informacoes_adicionais")} />
              </Field>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={form.formState.isSubmitting || uploadingMain || uploadingGallery}>
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
