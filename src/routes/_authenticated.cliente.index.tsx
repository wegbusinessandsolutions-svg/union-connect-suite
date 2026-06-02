import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingCart, Gift, UserCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cliente/")({
  head: () => ({ meta: [{ title: "Minha conta" }] }),
  component: ClienteIndex,
});

function ClienteIndex() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Minha conta</h1>
        <p className="text-sm text-muted-foreground">Seus pedidos, cashback e dados pessoais.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stub icon={ShoppingCart} title="Meus pedidos" desc="Histórico e acompanhamento." />
        <Stub icon={Gift} title="Meu cashback" desc="Saldo e movimentações." />
        <Stub icon={UserCircle} title="Meus dados" desc="Perfil e endereço." />
      </div>
    </div>
  );
}

function Stub({ icon: Icon, title, desc }: { icon: typeof UserCircle; title: string; desc: string }) {
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
