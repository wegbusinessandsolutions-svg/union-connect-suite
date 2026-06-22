import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Handshake, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSignedUrlsMap } from "@/components/image-uploader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/integrations/supabase/types";

const BUCKET = "admin-assets";

type Marca = Tables<"marcas_parceiras">;

export const Route = createFileRoute("/_authenticated/cliente/marcas-parceiras")({
  head: () => ({ meta: [{ title: "Marcas Parceiras" }] }),
  component: ClienteMarcasPage,
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-destructive">Erro: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-6">Página não encontrada.</div>,
});

function ClienteMarcasPage() {
  const list = useQuery({
    queryKey: ["marcas_parceiras", "cliente"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marcas_parceiras")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Marca[];
    },
  });

  const logoUrls = useSignedUrlsMap(BUCKET, (list.data ?? []).map((m) => m.logo_url));

  return (
    <div className="bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Handshake className="h-6 w-6" />
            Marcas Parceiras
          </h1>
          <p className="text-sm text-muted-foreground">
            Conheça nossos parceiros e aproveite benefícios exclusivos.
          </p>
        </div>

        {list.isLoading && <div className="text-sm text-muted-foreground">Carregando…</div>}

        {!list.isLoading && (list.data ?? []).length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Nenhuma marca parceira disponível no momento.
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(list.data ?? []).map((m) => (
            <Card key={m.id} className="overflow-hidden">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center gap-3">
                  {m.logo_url && logoUrls[m.logo_url] ? (
                    <img
                      src={logoUrls[m.logo_url]}
                      alt={m.name}
                      className="h-14 w-14 rounded border object-contain"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded border bg-muted text-xs text-muted-foreground">
                      —
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{m.name}</div>
                    {m.discount_pct ? (
                      <Badge variant="secondary" className="mt-1">
                        {Number(m.discount_pct).toFixed(2)}% de desconto
                      </Badge>
                    ) : null}
                  </div>
                </div>
                {m.description && (
                  <p className="text-sm text-muted-foreground">{m.description}</p>
                )}
                {m.website && (
                  <a
                    href={m.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    Visitar site <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
