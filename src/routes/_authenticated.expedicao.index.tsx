import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Truck, Boxes, Package } from "lucide-react";

export const Route = createFileRoute("/_authenticated/expedicao/")({
  head: () => ({ meta: [{ title: "Expedição" }] }),
  component: ExpedicaoIndex,
});

function ExpedicaoIndex() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Expedição</h1>
        <p className="text-sm text-muted-foreground">Estoque, separação e entregas.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stub icon={Package} title="Produtos" desc="Consulta e ajustes." />
        <Stub icon={Boxes} title="Estoque" desc="Movimentações e saldos." />
        <Stub icon={Truck} title="Entregas" desc="Rotas e comprovantes." />
      </div>
    </div>
  );
}

function Stub({ icon: Icon, title, desc }: { icon: typeof Truck; title: string; desc: string }) {
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
