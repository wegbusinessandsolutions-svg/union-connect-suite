import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useRoles, ROLE_LABELS } from "@/hooks/use-roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "Painel" }] }),
  component: DashboardRouter,
});

function DashboardRouter() {
  const { data: roles, isLoading } = useRoles();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || !roles) return;
    // Redireciona para a primeira área disponível conforme prioridade dos papéis.
    const order: Array<[string, string]> = [
      ["admin", "/admin/usuarios"],
      ["financeiro", "/financeiro"],
      ["comercial", "/comercial"],
      ["expedicao", "/expedicao"],
      ["cliente", "/cliente"],
    ];
    const target = order.find(([role]) => roles.includes(role as never))?.[1];
    if (target) navigate({ to: target, replace: true });
  }, [roles, isLoading, navigate]);

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {isLoading && <p>Identificando seus acessos…</p>}
          {!isLoading && (roles?.length ?? 0) === 0 && (
            <p>Você ainda não possui papéis atribuídos. Solicite acesso ao administrador.</p>
          )}
          {!isLoading && roles && roles.length > 0 && (
            <p>
              Papéis ativos:{" "}
              {roles.map((r) => ROLE_LABELS[r]).join(", ")}.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
