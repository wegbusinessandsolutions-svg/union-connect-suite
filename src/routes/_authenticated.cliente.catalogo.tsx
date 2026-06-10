import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/cliente/catalogo")({
  head: () => ({ meta: [{ title: "Catálogo" }] }),
  component: CatalogoPage,
});

function CatalogoPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const products = useQuery({
    queryKey: ["catalog", search],
    queryFn: async () => {
      let q = supabase
        .from("products_public" as never)
        .select("*")
        .order("name")
        .limit(120);
      if (search) q = q.or(`name.ilike.%${search}%,sku.ilike.%${search}%,brand.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as Array<{
        id: string; name: string; brand: string | null; sku: string | null;
        image_main_url: string | null; price_sale: number;
        cashback_pct: number | null; in_stock: boolean;
      }>;
    },
  });

  return (
    <div className="bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-muted-foreground" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Catálogo</h1>
              <p className="text-sm text-muted-foreground">Confira nossos produtos disponíveis.</p>
            </div>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-72 pl-8" />
          </div>
        </div>

        {products.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {!products.isLoading && (products.data ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum produto encontrado.</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {(products.data ?? []).map((p) => (
            <Card key={p.id} className="flex flex-col overflow-hidden">
              <div className="aspect-square w-full bg-muted">
                {p.image_main_url ? (
                  <img src={p.image_main_url} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <Package className="h-12 w-12" />
                  </div>
                )}
              </div>
              <CardHeader className="space-y-1 pb-2">
                <CardTitle className="line-clamp-2 text-sm">{p.name}</CardTitle>
                {p.brand && <CardDescription className="text-xs">{p.brand}</CardDescription>}
              </CardHeader>
              <CardContent className="mt-auto space-y-2">
                <div className="text-lg font-bold text-primary">{brl(Number(p.price_sale))}</div>
                <div className="flex flex-wrap gap-1">
                  {Number(p.cashback_pct ?? 0) > 0 && (
                    <Badge variant="secondary" className="text-xs">{Number(p.cashback_pct).toFixed(1)}% cashback</Badge>
                  )}
                  {p.in_stock ? (
                    <Badge variant="outline" className="text-xs">Em estoque</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-destructive">Indisponível</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function brl(n: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n); }
