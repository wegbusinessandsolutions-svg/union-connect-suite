import { createFileRoute } from "@tanstack/react-router";
import { ShoppingCart, Gift, UserCircle, Package } from "lucide-react";
import { ModuleHub, type HubItem } from "@/components/module-hub";

export const Route = createFileRoute("/_authenticated/cliente/")({
  head: () => ({ meta: [{ title: "Minha conta" }] }),
  component: ClienteIndex,
});

const ITEMS: HubItem[] = [
  { to: "/cliente/pedidos", title: "Meus pedidos", desc: "Histórico e acompanhamento das suas compras.", icon: ShoppingCart, tone: "blue" },
  { to: "/cliente/cashback", title: "Meu cashback", desc: "Saldo e movimentações do seu cashback.", icon: Gift, tone: "emerald" },
  { to: "/cliente/catalogo", title: "Catálogo", desc: "Produtos disponíveis para compra.", icon: Package, tone: "amber" },
  { to: "/cliente/dados", title: "Meus dados", desc: "Perfil, endereço e dados pessoais.", icon: UserCircle, tone: "violet" },
];

function ClienteIndex() {
  return (
    <ModuleHub
      title="Minha conta"
      subtitle="Seus pedidos, cashback e dados pessoais."
      items={ITEMS}
    />
  );
}
