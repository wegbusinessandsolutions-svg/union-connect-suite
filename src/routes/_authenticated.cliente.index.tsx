import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingCart, Gift, UserCircle, Package } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cliente/")({
  head: () => ({ meta: [{ title: "Minha conta" }] }),
  component: ClienteIndex,
});

const ITEMS = [
  { to: "/cliente/pedidos", title: "Meus pedidos", desc: "Histórico e acompanhamento.", icon: ShoppingCart },
  { to: "/cliente/cashback", title: "Meu cashback", desc: "Saldo e movimentações.", icon: Gift },
  { to: "/cliente/catalogo", title: "Catálogo", desc: "Produtos disponíveis.", icon: Package },
  { to: "/cliente/dados", title: "Meus dados", desc: "Perfil e endereço.", icon: UserCircle },
] as const;

function ClienteIndex() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Minha conta</h1>
        <p className="text-sm text-muted-foreground">Seus pedidos, cashback e dados pessoais.</p>
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
              <CardContent className="text-xs text-muted-foreground">Abrir →</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
