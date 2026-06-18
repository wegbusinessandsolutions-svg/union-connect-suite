import { createFileRoute } from "@tanstack/react-router";
import { Users, ShieldCheck, Building2, BadgeCheck, BarChart3, CreditCard, Package, Handshake, Gift } from "lucide-react";
import { ModuleHub, type HubItem } from "@/components/module-hub";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin" }] }),
  component: AdminIndex,
});

const ITEMS: HubItem[] = [
  { to: "/admin/usuarios", title: "Usuários", desc: "Papéis e permissões dos acessos do sistema.", icon: Users, tone: "blue" },
  { to: "/admin/funcionarios", title: "Funcionários", desc: "Cadastro e dados dos colaboradores.", icon: BadgeCheck, tone: "emerald" },
  { to: "/admin/empresa", title: "Empresa", desc: "Dados fiscais, endereço e identidade.", icon: Building2, tone: "amber" },
  { to: "/admin/integracoes-pagamentos", title: "Integração Pagamentos", desc: "Mercado Pago: PIX, boleto e cartão.", icon: CreditCard, tone: "violet" },
  { to: "/admin/kits-essenciais", title: "Kits Essenciais", desc: "Combos pré-montados de produtos.", icon: Package, tone: "orange" },
  { to: "/admin/marcas-parceiras", title: "Marcas Parceiras", desc: "Marcas com acordos e benefícios.", icon: Handshake, tone: "violet" },
  { to: "/admin/clube-beneficios", title: "Clube de Benefícios", desc: "Vantagens e descontos para clientes.", icon: Gift, tone: "rose" },
  { to: "/admin/relatorios", title: "Relatórios", desc: "Indicadores gerais do negócio.", icon: BarChart3, tone: "sky" },
  { to: "/admin/audit-logs", title: "Audit Logs", desc: "Trilha de auditoria das ações do sistema.", icon: ShieldCheck, tone: "rose" },
];

function AdminIndex() {
  return (
    <ModuleHub
      title="Administração"
      subtitle="Configurações gerais, usuários, integrações e relatórios."
      items={ITEMS}
    />
  );
}
