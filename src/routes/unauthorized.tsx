import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/unauthorized")({
  head: () => ({ meta: [{ title: "Sem permissão" }] }),
  component: UnauthorizedPage,
});

function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <ShieldAlert className="h-12 w-12 text-destructive" />
      <h1 className="text-2xl font-bold">Acesso não autorizado</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Você não possui o papel necessário para acessar esta página. Solicite acesso ao administrador.
      </p>
      <Button asChild>
        <Link to="/">Voltar ao início</Link>
      </Button>
    </div>
  );
}
