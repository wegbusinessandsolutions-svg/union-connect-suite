import { createFileRoute } from "@tanstack/react-router";
import { Truck, Boxes } from "lucide-react";
import { ModuleHub, type HubItem } from "@/components/module-hub";

export const Route = createFileRoute("/_authenticated/expedicao/")({
  head: () => ({ meta: [{ title: "Expedição" }] }),
  component: ExpedicaoIndex,
});

const ITEMS: HubItem[] = [
  { to: "/expedicao/entregas", icon: Truck, title: "Entregas", desc: "Kanban por status, atribuir entregador e comprovantes.", tone: "blue" },
  { to: "/expedicao/estoque", icon: Boxes, title: "Estoque", desc: "Saldos, mínimo/máximo e movimentações.", tone: "amber" },
];

function ExpedicaoIndex() {
  return (
    <ModuleHub
      title="Expedição"
      subtitle="Estoque, separação e entregas."
      items={ITEMS}
    />
  );
}
