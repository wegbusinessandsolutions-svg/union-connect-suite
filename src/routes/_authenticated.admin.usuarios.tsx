import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { RefreshCw, Shield, ShieldOff, UserPlus, Loader2, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  listUsersWithRoles,
  grantRole,
  revokeRole,
} from "@/lib/admin-users.functions";
import { ReportActions } from "@/components/report-actions";
import { datetime, type ReportData } from "@/lib/report";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  head: () => ({ meta: [{ title: "Usuários — Admin" }] }),
  component: UsuariosPage,
});

const ROLES = ["admin", "financeiro", "vendedor", "estoque", "entregador", "cliente"] as const;
type Role = (typeof ROLES)[number];

const ROLE_BADGE: Record<Role, string> = {
  admin: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  financeiro: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  vendedor: "bg-green-100 text-green-800 hover:bg-green-100",
  estoque: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  entregador: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  cliente: "bg-gray-100 text-gray-800 hover:bg-gray-100",
};

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

function UsuariosPage() {
  const qc = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [roleByUser, setRoleByUser] = useState<Record<string, Role>>({});

  // Debounce search input → committed search (resets to page 1).
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchUsers = useServerFn(listUsersWithRoles);
  const grant = useServerFn(grantRole);
  const revoke = useServerFn(revokeRole);

  const meRoles = useQuery({
    queryKey: ["my-roles"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data, error } = await supabase
        .from("user_roles").select("role").eq("user_id", u.user.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role);
    },
  });
  const isAdmin = (meRoles.data ?? []).includes("admin");

  const usersQuery = useQuery({
    queryKey: ["admin-users", { page, perPage, search }],
    enabled: isAdmin,
    placeholderData: keepPreviousData,
    queryFn: () => fetchUsers({ data: { page, perPage, search } }),
  });

  const result = usersQuery.data;
  const users = result?.users ?? [];
  const hasMore = result?.hasMore ?? false;
  const total = result?.total ?? -1;

  const grantMut = useMutation({
    mutationFn: (vars: { userId: string; role: Role }) => grant({ data: vars }),
    onSuccess: () => {
      toast.success("Papel concedido");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeMut = useMutation({
    mutationFn: (vars: { userId: string; role: Role }) => revoke({ data: vars }),
    onSuccess: () => {
      toast.success("Papel removido");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rangeStart = users.length === 0 ? 0 : (page - 1) * perPage + 1;
  const rangeEnd = (page - 1) * perPage + users.length;
  const countLabel = users.length === 0
    ? "Nenhum usuário"
    : total >= 0
      ? `${rangeStart}–${rangeEnd} de ${total} usuário(s)`
      : `${rangeStart}–${rangeEnd} (página ${page})`;

  return (
    <div className="bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie papéis dos usuários do sistema.
            </p>
          </div>
          <Button variant="outline" onClick={() => usersQuery.refetch()} disabled={!isAdmin}>
            <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
          </Button>
        </div>

        {!meRoles.isLoading && !isAdmin && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Acesso restrito</AlertTitle>
            <AlertDescription>
              Apenas administradores podem gerenciar usuários.
            </AlertDescription>
          </Alert>
        )}

        {isAdmin && (
          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-base">
                {usersQuery.isFetching ? "Carregando…" : countLabel}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por email ou UUID…"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-72 pl-8"
                  />
                </div>
                <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
                  <SelectTrigger className="h-9 w-[110px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PER_PAGE_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>{n} / pág.</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Último login</TableHead>
                    <TableHead>Papéis</TableHead>
                    <TableHead className="w-[320px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersQuery.isError && (
                    <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-red-600">
                      Erro: {(usersQuery.error as Error).message}
                    </TableCell></TableRow>
                  )}
                  {!usersQuery.isError && users.length === 0 && !usersQuery.isLoading && (
                    <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      Nenhum usuário encontrado.
                    </TableCell></TableRow>
                  )}
                  {users.map((u) => {
                    const userRoles = u.roles as Role[];
                    const isUserAdmin = userRoles.includes("admin");
                    const selectedRole = roleByUser[u.id] ?? "vendedor";
                    const busy =
                      (grantMut.isPending && grantMut.variables?.userId === u.id) ||
                      (revokeMut.isPending && revokeMut.variables?.userId === u.id);
                    return (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="font-medium">{u.email ?? "—"}</div>
                          <div className="font-mono text-xs text-muted-foreground">{u.id.slice(0, 8)}…</div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {format(new Date(u.created_at), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="text-xs">
                          {u.last_sign_in_at ? format(new Date(u.last_sign_in_at), "dd/MM/yyyy HH:mm") : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {userRoles.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                            {userRoles.map((r) => (
                              <Badge key={r} className={ROLE_BADGE[r]}>
                                {r}
                                <button
                                  type="button"
                                  className="ml-1 opacity-70 hover:opacity-100"
                                  title="Remover"
                                  disabled={busy}
                                  onClick={() => revokeMut.mutate({ userId: u.id, role: r })}
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isUserAdmin ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() => revokeMut.mutate({ userId: u.id, role: "admin" })}
                              >
                                <ShieldOff className="mr-2 h-4 w-4" /> Retirar admin
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                disabled={busy}
                                onClick={() => grantMut.mutate({ userId: u.id, role: "admin" })}
                              >
                                <Shield className="mr-2 h-4 w-4" /> Tornar admin
                              </Button>
                            )}
                            <Select
                              value={selectedRole}
                              onValueChange={(v) => setRoleByUser((m) => ({ ...m, [u.id]: v as Role }))}
                            >
                              <SelectTrigger className="h-9 w-[130px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {ROLES.filter((r) => r !== "admin").map((r) => (
                                  <SelectItem key={r} value={r}>{r}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={busy || userRoles.includes(selectedRole)}
                              onClick={() => grantMut.mutate({ userId: u.id, role: selectedRole })}
                            >
                              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                            </Button>
                            <ReportActions
                              data={buildUserReport(u)}
                              filename={`usuario-${(u.email ?? u.id).replace(/[^a-z0-9]+/gi, "_")}`}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
            <div className="flex items-center justify-between border-t p-3">
              <div className="text-xs text-muted-foreground">
                Página {page}
                {total >= 0 && ` de ${Math.max(1, Math.ceil(total / perPage))}`}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1 || usersQuery.isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!hasMore || usersQuery.isFetching}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próxima <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

type UserRow = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
};

function buildUserReport(u: UserRow): ReportData {
  return {
    title: `Ficha do Usuário — ${u.email ?? u.id}`,
    subtitle: u.id,
    sections: [
      {
        title: "Identificação",
        fields: [
          { label: "ID", value: u.id },
          { label: "E-mail", value: u.email },
          { label: "Papéis", value: u.roles.join(", ") || "—" },
        ],
      },
      {
        title: "Atividade",
        fields: [
          { label: "Criado em", value: datetime(u.created_at) },
          { label: "Último login", value: datetime(u.last_sign_in_at) },
        ],
      },
    ],
  };
}
