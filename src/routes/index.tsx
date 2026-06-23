import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSignedUrlsMap } from "@/components/image-uploader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sistema Administrativo" },
      { name: "description", content: "Painel administrativo com audit logs." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <section className="flex flex-col items-center justify-center gap-6 p-6 pt-16 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">CRM</h1>
          <p className="text-muted-foreground">Acesse o painel conforme seu perfil.</p>
        </div>
        <div className="flex gap-3">
          <Button asChild><Link to="/dashboard">Acessar painel</Link></Button>
          <Button asChild variant="outline"><Link to="/login">Entrar</Link></Button>
        </div>
      </section>

      <CategoriesSection />
    </div>
  );
}

function CategoriesSection() {
  const list = useQuery({
    queryKey: ["home-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_categories")
        .select("id, name, image_url")
        .order("name");
      if (error) throw error;
      return data as Array<{ id: string; name: string; image_url: string | null }>;
    },
  });

  const items = list.data ?? [];
  const signed = useSignedUrlsMap("category-images", items.map((c) => c.image_url));

  if (items.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-6 pb-16">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Compre por categoria</h2>
        <p className="text-sm text-muted-foreground">Explore nossas categorias de produtos.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {items.map((c) => {
          const url = c.image_url ? signed[c.image_url] : null;
          return (
            <Card key={c.id} className="overflow-hidden transition hover:shadow-md">
              <div className="aspect-square w-full bg-muted">
                {url ? (
                  <img src={url} alt={c.name} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <Package className="h-10 w-10" />
                  </div>
                )}
              </div>
              <CardContent className="p-3 text-center">
                <p className="line-clamp-2 text-sm font-medium">{c.name}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
