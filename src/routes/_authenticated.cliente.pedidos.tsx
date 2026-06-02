import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/cliente/pedidos")({
  head: () => ({ meta: [{ title: "Meus pedidos" }] }),
  component: ClientePedidosPage,
});

const STATUS_LABELS: Record<string, string> = {
  rascunho: "Rascunho",
  confirmado: "Confirmado",
  separacao: "Separação",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

function ClientePedidosPage() {
  const orders = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data: myClients } = await supabase.from("clients").select("id").eq("user_id", u.user.id);
      const clientIds = (myClients ?? []).map((c) => c.id);
      let q = supabase.from("sale_orders").select("*").order("created_at", { ascending: false }).limit(100);
      if (clientIds.length > 0) {
        q = q.or(`user_id.eq.${u.user.id},client_id.in.(${clientIds.join(",")})`);
      } else {
        q = q.eq("user_id", u.user.id);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Meus pedidos</h1>
            <p className="text-sm text-muted-foreground">Histórico de compras e acompanhamento.</p>
          </div>
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">{orders.isLoading ? "Carregando…" : `${orders.data?.length ?? 0} pedido(s)`}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>#</TableHead><TableHead>Data</TableHead><TableHead>Status</TableHead>
                <TableHead>Pagamento</TableHead><TableHead className="text-right">Total</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(orders.data ?? []).length === 0 && !orders.isLoading && (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Nenhum pedido ainda.</TableCell></TableRow>
                )}
                {(orders.data ?? []).map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono">#{o.order_number}</TableCell>
                    <TableCell className="text-xs">{format(new Date(o.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                    <TableCell><Badge variant="secondary">{STATUS_LABELS[o.status] ?? o.status}</Badge></TableCell>
                    <TableCell className="text-xs">{o.payment_method ?? "—"}</TableCell>
                    <TableCell className="text-right font-medium">{brl(Number(o.total))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function brl(n: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n); }
