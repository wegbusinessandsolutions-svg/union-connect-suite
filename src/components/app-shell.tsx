import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LogOut, Menu, X, ShieldCheck, Users, Banknote, Building2, Wallet,
  ShoppingCart, Boxes, Truck, Package, Wrench, UserCircle, Gift,
  BadgeCheck, BarChart3, FolderTree,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, type AppRole } from "@/hooks/use-roles";

type NavItem = {
  to: string;
  label: string;
  icon: typeof ShieldCheck;
  roles: AppRole[];
};

const NAV: NavItem[] = [
  // Admin
  { to: "/admin", label: "Admin", icon: ShieldCheck, roles: ["admin"] },
  { to: "/admin/usuarios", label: "— Usuários", icon: Users, roles: ["admin"] },
  { to: "/admin/funcionarios", label: "— Funcionários", icon: BadgeCheck, roles: ["admin"] },
  { to: "/admin/empresa", label: "— Empresa", icon: Building2, roles: ["admin"] },
  { to: "/admin/relatorios", label: "— Relatórios", icon: BarChart3, roles: ["admin"] },
  { to: "/admin/audit-logs", label: "— Audit Logs", icon: ShieldCheck, roles: ["admin"] },
  // Financeiro
  { to: "/financeiro", label: "Financeiro", icon: Wallet, roles: ["admin", "financeiro"] },
  { to: "/financeiro/pagar", label: "— Contas a Pagar", icon: Banknote, roles: ["admin", "financeiro"] },
  { to: "/financeiro/receber", label: "— Contas a Receber", icon: Banknote, roles: ["admin", "financeiro"] },
  { to: "/financeiro/bancos", label: "— Bancos", icon: Building2, roles: ["admin", "financeiro"] },
  { to: "/financeiro/centros-custo", label: "— Centros de Custo", icon: Wallet, roles: ["admin", "financeiro"] },
  { to: "/financeiro/fornecedores", label: "— Fornecedores", icon: Users, roles: ["admin", "financeiro"] },
  // Comercial
  { to: "/comercial", label: "Comercial", icon: ShoppingCart, roles: ["admin", "comercial"] },
  { to: "/comercial/clientes", label: "— Clientes", icon: Users, roles: ["admin", "comercial"] },
  { to: "/comercial/produtos", label: "— Produtos", icon: Package, roles: ["admin", "comercial"] },
  { to: "/comercial/pedidos", label: "— Pedidos", icon: Boxes, roles: ["admin", "comercial"] },
  // Expedicao
  { to: "/expedicao", label: "Expedição", icon: Truck, roles: ["admin", "expedicao"] },
  { to: "/expedicao/entregas", label: "— Entregas", icon: Truck, roles: ["admin", "expedicao"] },
  { to: "/expedicao/estoque", label: "— Estoque", icon: Boxes, roles: ["admin", "expedicao"] },
  // Cliente
  { to: "/cliente", label: "Minha conta", icon: UserCircle, roles: ["cliente"] },
  { to: "/cliente/pedidos", label: "— Meus pedidos", icon: ShoppingCart, roles: ["cliente"] },
  { to: "/cliente/cashback", label: "— Meu cashback", icon: Gift, roles: ["cliente"] },
  { to: "/cliente/catalogo", label: "— Catálogo", icon: Package, roles: ["cliente"] },
  { to: "/cliente/dados", label: "— Meus dados", icon: UserCircle, roles: ["cliente"] },
];

// Secondary icons used in stub pages (kept here so they're tree-shaken
// only when actually imported).
export const MODULE_ICONS = {
  Banknote, Building2, Boxes, Package, Wrench, Gift, ShoppingCart, Truck,
};

interface Props {
  email: string | undefined;
  roles: AppRole[];
  children: ReactNode;
}

export function AppShell({ email, roles, children }: Props) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const items = NAV.filter((n) => n.roles.some((r) => roles.includes(r)));

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Abrir menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link to="/" className="font-semibold tracking-tight">
              CRM
            </Link>
            <div className="hidden flex-wrap gap-1 md:flex">
              {roles.length === 0 && (
                <Badge variant="outline" className="text-xs">sem papéis</Badge>
              )}
              {roles.map((r) => (
                <Badge key={r} variant="secondary" className="text-xs">
                  {ROLE_LABELS[r]}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">{email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/login", replace: true });
              }}
            >
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 top-[57px] z-20 w-64 border-r bg-card transition-transform md:static md:top-0 md:block md:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          )}
        >
          <nav className="flex flex-col gap-1 p-3">
            {items.length === 0 && (
              <p className="px-3 py-4 text-xs text-muted-foreground">
                Nenhum módulo disponível para seus papéis. Solicite acesso ao administrador.
              </p>
            )}
            {items.map((item) => {
              const Icon = item.icon;
              const active = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
