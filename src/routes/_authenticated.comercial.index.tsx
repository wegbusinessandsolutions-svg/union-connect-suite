import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingCart, Users, Package, Wrench } from "lucide-react";

export const Route = createFileRoute("/_authenticated/comercial/")({
  head: () => ({ meta: [{ title: "Comercial" }] }),
  component: ComercialIndex,
});

const MODULES = [
  { to: "/comercial/clientes", icon: Users, title: "Clientes", desc: "Cadastro PF/PJ, endereço, tier e cashback.", ready: true },
  { to: "/comercial/produtos", icon: Package, title: "Produtos", desc: "Catálogo, preços por tier e estoque.", ready: true },
  { to: "/comercial/pedidos", icon: ShoppingCart, title: "Pedidos", desc: "Vendas, descontos, cashback e status.", ready: true },
  { to: "/comercial", icon: Wrench, title: "Serviços", desc: "Catálogo de serviços (em breve).", ready: false },
] as const;

function ComercialIndex() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Comercial</h1>
        <p className="text-sm text-muted-foreground">Clientes, produtos, serviços e pedidos.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODULES.map((m) => {
          const Icon = m.icon;
          const card = (
            <Card className={m.ready ? "transition-colors hover:bg-muted/50" : "opacity-60"}>
              <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base">{m.title}</CardTitle>
                  <CardDescription className="text-xs">{m.desc}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {m.ready ? "Abrir →" : "Em construção"}
              </CardContent>
            </Card>
          );
          return m.ready ? (
            <Link key={m.title} to={m.to}>{card}</Link>
          ) : (
            <div key={m.title}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}
