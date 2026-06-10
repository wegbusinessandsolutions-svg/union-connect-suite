import { createFileRoute } from "@tanstack/react-router";
import { Wallet, Banknote, Building2, Users, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { ModuleHub, type HubItem } from "@/components/module-hub";

export const Route = createFileRoute("/_authenticated/financeiro/")({
  head: () => ({ meta: [{ title: "Financeiro" }] }),
  component: FinanceiroIndex,
});

const ITEMS: HubItem[] = [
  { to: "/financeiro/pagar", icon: ArrowUpCircle, title: "Contas a Pagar", desc: "Lançamentos, vencimentos e baixas.", tone: "rose" },
  { to: "/financeiro/receber", icon: ArrowDownCircle, title: "Contas a Receber", desc: "Recebíveis dos pedidos e cobranças.", tone: "emerald" },
  { to: "/financeiro/bancos", icon: Building2, title: "Contas Bancárias", desc: "Saldos e contas correntes.", tone: "blue" },
  { to: "/financeiro/centros-custo", icon: Wallet, title: "Centros de Custo", desc: "Classificação financeira.", tone: "violet" },
  { to: "/financeiro/fornecedores", icon: Users, title: "Fornecedores", desc: "Cadastro de fornecedores.", tone: "amber" },
  { to: "/financeiro", icon: Banknote, title: "Fluxo de Caixa", desc: "Resumo financeiro do período.", tone: "sky" },
];

function FinanceiroIndex() {
  return (
    <ModuleHub
      title="Financeiro"
      subtitle="Gestão financeira completa do seu negócio."
      items={ITEMS}
    />
  );
}
