import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, ShieldCheck, Building2, BadgeCheck, BarChart3, CreditCard } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin" }] }),
  component: AdminIndex,
});

const ITEMS = [
  { to: "/admin/usuarios", title: "Usuários", desc: "Papéis e permissões.", icon: Users },
  { to: "/admin/funcionarios", title: "Funcionários", desc: "Cadastro de colaboradores.", icon: BadgeCheck },
  { to: "/admin/empresa", title: "Empresa", desc: "Dados fiscais e endereço.", icon: Building2 },
  { to: "/admin/integracoes-pagamentos", title: "Integração Pagamentos", desc: "Mercado Pago: PIX, boleto e cartão.", icon: CreditCard },
  { to: "/admin/relatorios", title: "Relatórios", desc: "Indicadores gerais.", icon: BarChart3 },
  { to: "/admin/audit-logs", title: "Audit Logs", desc: "Trilha de auditoria.", icon: ShieldCheck },
] as const;

function AdminIndex() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Administração</h1>
        <p className="text-sm text-muted-foreground">Configurações gerais, usuários e relatórios.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map(({ to, title, desc, icon: Icon }) => (
          <Link key={to} to={to}>
            <Card className="h-full transition-colors hover:bg-muted/50">
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
