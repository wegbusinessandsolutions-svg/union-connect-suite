import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, Gift, UserCircle, Package, Handshake, Sparkles } from "lucide-react";
import { ModuleHub, type HubItem } from "@/components/module-hub";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/cliente/")({
  head: () => ({ meta: [{ title: "Minha conta" }] }),
  component: ClienteIndex,
});

const ITEMS: HubItem[] = [
  { to: "/cliente/pedidos", title: "Meus pedidos", desc: "Histórico e acompanhamento das suas compras.", icon: ShoppingCart, tone: "blue" },
  { to: "/cliente/cashback", title: "Meu cashback", desc: "Saldo e movimentações do seu cashback.", icon: Gift, tone: "emerald" },
  { to: "/cliente/catalogo", title: "Catálogo", desc: "Produtos disponíveis para compra.", icon: Package, tone: "amber" },
  { to: "/cliente/marcas-parceiras", title: "Marcas Parceiras", desc: "Parceiros com benefícios exclusivos para você.", icon: Handshake, tone: "rose" },
  { to: "/cliente/dados", title: "Meus dados", desc: "Perfil, endereço e dados pessoais.", icon: UserCircle, tone: "violet" },
];

type Tier = "bronze" | "prata" | "ouro" | "diamante";

const TIER_THEME: Record<Tier, { bg: string; label: string }> = {
  bronze:   { bg: "from-amber-700 via-amber-600 to-amber-800",     label: "Bronze" },
  prata:    { bg: "from-slate-400 via-slate-300 to-slate-500",     label: "Prata" },
  ouro:     { bg: "from-yellow-500 via-yellow-400 to-yellow-600",  label: "Ouro" },
  diamante: { bg: "from-cyan-400 via-sky-400 to-indigo-500",       label: "Diamante" },
};

function ClienteIndex() {
  const qc = useQueryClient();

  const client = useQuery({
    queryKey: ["my-client"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase
        .from("clients")
        .select("id, name, tier, cashback_balance, type")
        .eq("user_id", u.user.id)
        .maybeSingle();
      return data;
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Realtime: atualiza o cartão virtual quando o tier muda no CRM.
  useEffect(() => {
    if (!client.data?.id) return;
    const channel = supabase
      .channel(`client-${client.data.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "clients", filter: `id=eq.${client.data.id}` },
        () => { qc.invalidateQueries({ queryKey: ["my-client"] }); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [client.data?.id, qc]);

  const tier = (client.data?.tier ?? "bronze") as Tier;
  const theme = TIER_THEME[tier] ?? TIER_THEME.bronze;
  const balance = Number(client.data?.cashback_balance ?? 0);

  return (
    <div className="space-y-6">
      <div className="mx-auto w-full max-w-5xl px-4 pt-6">
        <Card className={`relative overflow-hidden rounded-2xl border-0 bg-gradient-to-br ${theme.bg} p-6 text-white shadow-lg`}>
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/80">Cartão virtual</p>
              <p className="mt-1 text-2xl font-semibold">{client.data?.name ?? "—"}</p>
              <p className="text-xs text-white/80">
                {client.data?.type === "pj" ? "Pessoa Jurídica" : "Pessoa Física"}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <div className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-sm font-medium backdrop-blur">
                <Sparkles className="h-4 w-4" />
                Tier {theme.label}
              </div>
              <p className="mt-2 text-xs text-white/80">Cashback disponível</p>
              <p className="text-xl font-bold">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(balance)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <ModuleHub
        title="Minha conta"
        subtitle="Seus pedidos, cashback e dados pessoais."
        items={ITEMS}
      />
    </div>
  );
}
