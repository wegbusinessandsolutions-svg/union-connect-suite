import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, DollarSign, ShoppingCart, Users, Package, Truck, TrendingUp, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/admin/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — Admin" }] }),
  component: RelatoriosPage,
});

function RelatoriosPage() {
  const stats = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");
      const [orders, clients, products, deliveries, receivablesOpen, payablesOpen, lowStock] = await Promise.all([
        supabase.from("sale_orders").select("total, status, created_at").gte("created_at", monthStart),
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("deliveries").select("id, status", { count: "exact" }),
        supabase.from("receivables").select("total, status").in("status", ["aberto", "vencido", "parcial"]),
        supabase.from("payables").select("total, status").in("status", ["aberto", "vencido", "parcial"]),
        supabase.from("products").select("id, name, stock_qty, stock_min").not("stock_min", "is", null).limit(100),
      ]);

      const sumOrders = (orders.data ?? []).reduce((s, o) => s + Number(o.total ?? 0), 0);
      const sumRec = (receivablesOpen.data ?? []).reduce((s, r) => s + Number(r.total ?? 0), 0);
      const sumPay = (payablesOpen.data ?? []).reduce((s, p) => s + Number(p.total ?? 0), 0);
      const low = (lowStock.data ?? []).filter((p) => (p.stock_qty ?? 0) <= (p.stock_min ?? 0));
      const pendingDeliveries = (deliveries.data ?? []).filter((d) => d.status === "aguardando" || d.status === "em_rota").length;

      return {
        ordersMonth: orders.data?.length ?? 0,
        ordersMonthTotal: sumOrders,
        clientsCount: clients.count ?? 0,
        productsActive: products.count ?? 0,
        deliveriesPending: pendingDeliveries,
        receivablesOpen: sumRec,
        payablesOpen: sumPay,
        cashFlow: sumRec - sumPay,
        lowStock: low,
      };
    },
  });

  const d = stats.data;

  return (
    <div className="bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
            <p className="text-sm text-muted-foreground">Indicadores gerais do CRM no mês corrente.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={ShoppingCart} title="Pedidos no mês" value={d?.ordersMonth ?? "—"} desc={d ? brl(d.ordersMonthTotal) : ""} />
          <Kpi icon={DollarSign} title="A receber (aberto)" value={d ? brl(d.receivablesOpen) : "—"} desc="Inclui vencidos e parciais" />
          <Kpi icon={DollarSign} title="A pagar (aberto)" value={d ? brl(d.payablesOpen) : "—"} desc="Inclui vencidos e parciais" />
          <Kpi
            icon={TrendingUp}
            title="Fluxo de caixa"
            value={d ? brl(d.cashFlow) : "—"}
            desc={d && d.cashFlow >= 0 ? "Saldo positivo" : "Saldo negativo"}
          />
          <Kpi icon={Users} title="Clientes" value={d?.clientsCount ?? "—"} desc="Total cadastrados" />
          <Kpi icon={Package} title="Produtos ativos" value={d?.productsActive ?? "—"} desc="Catálogo" />
          <Kpi icon={Truck} title="Entregas pendentes" value={d?.deliveriesPending ?? "—"} desc="Aguardando + em rota" />
          <Kpi icon={AlertTriangle} title="Estoque baixo" value={d?.lowStock.length ?? "—"} desc="Produtos abaixo do mínimo" />
        </div>

        {d && d.lowStock.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" /> Produtos com estoque baixo
              </CardTitle>
              <CardDescription>Produtos com saldo igual ou abaixo do mínimo configurado.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y text-sm">
                {d.lowStock.slice(0, 10).map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2">
                    <span>{p.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Estoque: <b>{p.stock_qty}</b> / mínimo: {p.stock_min}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, title, value, desc }: { icon: typeof BarChart3; title: string; value: string | number; desc?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </CardContent>
    </Card>
  );
}

function brl(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}
