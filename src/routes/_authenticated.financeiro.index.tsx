import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wallet, Banknote, Building2, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/financeiro/")({
  head: () => ({ meta: [{ title: "Financeiro" }] }),
  component: FinanceiroIndex,
});

const ITEMS = [
  { to: "/financeiro/pagar", icon: Banknote, title: "Contas a Pagar", desc: "Lançamentos, vencimentos e baixas." },
  { to: "/financeiro/receber", icon: Banknote, title: "Contas a Receber", desc: "Recebíveis dos pedidos e cobranças." },
  { to: "/financeiro/bancos", icon: Building2, title: "Contas Bancárias", desc: "Saldos e contas correntes." },
  { to: "/financeiro/centros-custo", icon: Wallet, title: "Centros de Custo", desc: "Classificação financeira." },
  { to: "/financeiro/fornecedores", icon: Users, title: "Fornecedores", desc: "Cadastro de fornecedores." },
] as const;

function FinanceiroIndex() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
        <p className="text-sm text-muted-foreground">Gestão financeira completa.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map(({ to, icon: Icon, title, desc }) => (
          <Link key={to} to={to}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base">{title}</CardTitle>
                  <CardDescription className="text-xs">{desc}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">Abrir módulo →</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
