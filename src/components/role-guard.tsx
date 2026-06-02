import { Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { useRoles, hasAnyRole, type AppRole } from "@/hooks/use-roles";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface Props {
  allowed: AppRole[];
  children?: ReactNode;
  redirectOnDeny?: boolean;
}

export function RoleGuard({ allowed, children, redirectOnDeny = false }: Props) {
  const { data: roles, isLoading } = useRoles();
  const allowedAccess = hasAnyRole(roles, allowed);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !allowedAccess && redirectOnDeny) {
      navigate({ to: "/unauthorized", replace: true });
    }
  }, [isLoading, allowedAccess, redirectOnDeny, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        Verificando permissões…
      </div>
    );
  }

  if (!allowedAccess) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Acesso negado</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <span>Você não possui o papel necessário para acessar esta área.</span>
            <div>
              <Button size="sm" variant="outline" onClick={() => navigate({ to: "/" })}>
                Voltar ao início
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children ?? <Outlet />}</>;
}
