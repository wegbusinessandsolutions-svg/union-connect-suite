import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingCart, Users, Package, Wrench } from "lucide-react";

export const Route = createFileRoute("/_authenticated/comercial/")({
  head: () => ({ meta: [{ title: "Comercial" }] }),
  component: ComercialIndex,
});

function ComercialIndex() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Comercial</h1>
        <p className="text-sm text-muted-foreground">Clientes, produtos, serviços e pedidos.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stub icon={Users} title="Clientes" desc="Cadastro PF/PJ e tier." />
        <Stub icon={Package} title="Produtos" desc="Catálogo, estoque e preços." />
        <Stub icon={Wrench} title="Serviços" desc="Catálogo de serviços." />
        <Stub icon={ShoppingCart} title="Pedidos" desc="Vendas e orçamentos." />
      </div>
    </div>
  );
}

function Stub({ icon: Icon, title, desc }: { icon: typeof Users; title: string; desc: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription className="text-xs">{desc}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">Módulo em construção.</CardContent>
    </Card>
  );
}
