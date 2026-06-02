import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wallet, Banknote, Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/financeiro/")({
  head: () => ({ meta: [{ title: "Financeiro" }] }),
  component: FinanceiroIndex,
});

function FinanceiroIndex() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
        <p className="text-sm text-muted-foreground">Contas a pagar, a receber, bancos e centros de custo.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stub icon={Wallet} title="Contas a Pagar" desc="Lançamentos, vencimentos e baixas." />
        <Stub icon={Banknote} title="Contas a Receber" desc="Recebíveis dos pedidos e cobranças." />
        <Stub icon={Building2} title="Bancos & Centros de Custo" desc="Cadastros financeiros." />
      </div>
    </div>
  );
}

function Stub({ icon: Icon, title, desc }: { icon: typeof Wallet; title: string; desc: string }) {
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
