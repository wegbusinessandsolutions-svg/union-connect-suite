import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrador",
  financeiro: "Financeiro",
  comercial: "Comercial",
  expedicao: "Expedição",
  cliente: "Cliente",
  // Papéis legados ainda existentes no enum
  vendedor: "Vendedor",
  estoque: "Estoque",
  entregador: "Entregador",
};

export function useRoles() {
  return useQuery({
    queryKey: ["my-roles"],
    staleTime: 60_000,
    queryFn: async (): Promise<AppRole[]> => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as AppRole);
    },
  });
}

export function hasAnyRole(roles: AppRole[] | undefined, allowed: AppRole[]) {
  if (!roles) return false;
  return roles.some((r) => allowed.includes(r));
}
