import { createFileRoute } from "@tanstack/react-router";
import { ShoppingCart, Users, Package, Wrench } from "lucide-react";
import { ModuleHub, type HubItem } from "@/components/module-hub";

export const Route = createFileRoute("/_authenticated/comercial/")({
  head: () => ({ meta: [{ title: "Comercial" }] }),
  component: ComercialIndex,
});

const ITEMS: HubItem[] = [
  { to: "/comercial/clientes", icon: Users, title: "Clientes", desc: "Cadastro PF/PJ, endereço, tier e cashback.", tone: "blue" },
  { to: "/comercial/produtos", icon: Package, title: "Produtos", desc: "Catálogo, preços por tier e estoque.", tone: "amber" },
  { to: "/comercial/pedidos", icon: ShoppingCart, title: "Pedidos", desc: "Vendas, descontos, cashback e status.", tone: "violet" },
  { icon: Wrench, title: "Serviços", desc: "Catálogo de serviços (em breve).", tone: "slate", ready: false },
];

function ComercialIndex() {
  return (
    <ModuleHub
      title="Comercial"
      subtitle="Clientes, produtos, serviços e pedidos."
      items={ITEMS}
    />
  );
}
