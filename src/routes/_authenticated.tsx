import { createFileRoute, Outlet, useNavigate, useRouter, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const navigate = useNavigate();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSession(data.session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      router.invalidate();
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, [router]);

  useEffect(() => {
    if (session === null) {
      navigate({
        to: "/login",
        search: { redirect: window.location.pathname },
        replace: true,
      });
    }
  }, [session, navigate]);

  if (session === undefined) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Carregando…</div>;
  }
  if (session === null) return null;

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link to="/admin/audit-logs" className="font-semibold">Admin</Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{session.user.email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => { await supabase.auth.signOut(); }}
            >
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
