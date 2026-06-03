import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sistema Administrativo" },
      { name: "description", content: "Painel administrativo com audit logs." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">CRM</h1>
        <p className="text-muted-foreground">Acesse o painel conforme seu perfil.</p>
      </div>
      <div className="flex gap-3">
        <Button asChild><Link to="/dashboard">Acessar painel</Link></Button>
        <Button asChild variant="outline"><Link to="/login">Entrar</Link></Button>
      </div>
    </div>
  );
}
