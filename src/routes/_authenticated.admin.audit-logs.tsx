import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, RefreshCw, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/audit-logs")({
  head: () => ({ meta: [{ title: "Audit Logs — Admin" }] }),
  component: AuditLogsPage,
});

type AuditLog = {
  id: number;
  table_name: string;
  record_id: string | null;
  action: "INSERT" | "UPDATE" | "DELETE";
  user_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_fields: string[] | null;
  created_at: string;
};

type Filters = {
  tableName: string;
  action: string;
  userId: string;
  from: Date | undefined;
  to: Date | undefined;
};

const ACTION_VARIANTS: Record<string, string> = {
  INSERT: "bg-green-100 text-green-800 hover:bg-green-100",
  UPDATE: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  DELETE: "bg-red-100 text-red-800 hover:bg-red-100",
};

function AuditLogsPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState<Filters>({
    tableName: "all", action: "all", userId: "", from: undefined, to: undefined,
  });
  const [selected, setSelected] = useState<AuditLog | null>(null);

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

  const tablesQuery = useQuery({
    queryKey: ["audit-logs", "tables"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs").select("table_name").order("table_name");
      if (error) throw error;
      return Array.from(new Set((data ?? []).map((r) => r.table_name)));
    },
  });

  const logsQuery = useQuery({
    queryKey: ["audit-logs", filters],
    enabled: isAdmin,
    queryFn: async () => {
      let q = supabase.from("audit_logs").select("*")
        .order("created_at", { ascending: false }).limit(500);
      if (filters.tableName !== "all") q = q.eq("table_name", filters.tableName);
      if (filters.action !== "all") q = q.eq("action", filters.action);
      if (filters.userId.trim()) q = q.eq("user_id", filters.userId.trim());
      if (filters.from) q = q.gte("created_at", filters.from.toISOString());
      if (filters.to) {
        const end = new Date(filters.to);
        end.setHours(23, 59, 59, 999);
        q = q.lte("created_at", end.toISOString());
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AuditLog[];
    },
  });

  const claim = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("claim_admin_if_none");
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-roles"] }); },
  });

  const logs = logsQuery.data ?? [];
  const reset = () => setFilters({ tableName: "all", action: "all", userId: "", from: undefined, to: undefined });

  return (
    <div className="bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-sm text-muted-foreground">
              Registro de INSERT, UPDATE e DELETE em todas as tabelas auditadas.
            </p>
          </div>
          <Button variant="outline" onClick={() => logsQuery.refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
          </Button>
        </div>

        {!meRoles.isLoading && !isAdmin && (
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Você não é administrador</AlertTitle>
            <AlertDescription className="flex flex-col gap-3">
              <span>Apenas administradores podem ver o audit log. Se nenhum admin existir ainda, você pode assumir esse papel agora.</span>
              <div>
                <Button size="sm" onClick={() => claim.mutate()} disabled={claim.isPending}>
                  {claim.isPending ? "Solicitando…" : "Tornar-me admin (primeiro usuário)"}
                </Button>
                {claim.data === false && (
                  <p className="mt-2 text-sm text-red-600">Já existe um admin. Peça a ele para te conceder o papel.</p>
                )}
                {claim.error && (
                  <p className="mt-2 text-sm text-red-600">{(claim.error as Error).message}</p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {isAdmin && (
          <>
            <Card>
              <CardHeader><CardTitle className="text-base">Filtros</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-5">
                <div className="space-y-2">
                  <Label>Tabela</Label>
                  <Select value={filters.tableName} onValueChange={(v) => setFilters((f) => ({ ...f, tableName: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {(tablesQuery.data ?? []).map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ação</Label>
                  <Select value={filters.action} onValueChange={(v) => setFilters((f) => ({ ...f, action: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="INSERT">INSERT</SelectItem>
                      <SelectItem value="UPDATE">UPDATE</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Usuário (UUID)</Label>
                  <Input placeholder="user_id" value={filters.userId}
                    onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))} />
                </div>
                <DateField label="De" value={filters.from} onChange={(d) => setFilters((f) => ({ ...f, from: d }))} />
                <DateField label="Até" value={filters.to} onChange={(d) => setFilters((f) => ({ ...f, to: d }))} />
                <div className="md:col-span-5">
                  <Button variant="ghost" size="sm" onClick={reset}>Limpar filtros</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  Resultados {logsQuery.isFetching && <span className="text-xs text-muted-foreground">(carregando…)</span>}
                </CardTitle>
                <span className="text-sm text-muted-foreground">{logs.length} registros</span>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Tabela</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Registro</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Campos alterados</TableHead>
                      <TableHead className="w-20" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsQuery.isError && (
                      <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-red-600">
                        Erro: {(logsQuery.error as Error).message}
                      </TableCell></TableRow>
                    )}
                    {!logsQuery.isError && logs.length === 0 && !logsQuery.isLoading && (
                      <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                        Nenhum registro encontrado.
                      </TableCell></TableRow>
                    )}
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap font-mono text-xs">
                          {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss")}
                        </TableCell>
                        <TableCell className="font-medium">{log.table_name}</TableCell>
                        <TableCell>
                          <Badge className={cn("font-mono", ACTION_VARIANTS[log.action])}>{log.action}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{log.record_id?.slice(0, 8) ?? "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{log.user_id?.slice(0, 8) ?? "—"}</TableCell>
                        <TableCell className="text-xs">
                          {log.changed_fields?.length
                            ? log.changed_fields.slice(0, 3).join(", ") +
                              (log.changed_fields.length > 3 ? ` +${log.changed_fields.length - 3}` : "")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => setSelected(log)}>Detalhes</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      <DetailDialog log={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function DateField({ label, value, onChange }: {
  label: string; value: Date | undefined; onChange: (d: Date | undefined) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "dd/MM/yyyy") : <span>Selecionar</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={value} onSelect={onChange} initialFocus className={cn("p-3 pointer-events-auto")} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function DetailDialog({ log, onClose }: { log: AuditLog | null; onClose: () => void }) {
  const diff = useMemo(() => {
    if (!log) return [];
    const keys = new Set<string>([
      ...Object.keys(log.old_data ?? {}),
      ...Object.keys(log.new_data ?? {}),
    ]);
    return Array.from(keys).map((k) => ({
      key: k,
      old: (log.old_data as Record<string, unknown> | null)?.[k],
      next: (log.new_data as Record<string, unknown> | null)?.[k],
      changed: log.changed_fields?.includes(k) ?? false,
    }));
  }, [log]);

  return (
    <Dialog open={!!log} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {log?.action} em <span className="font-mono">{log?.table_name}</span>
          </DialogTitle>
        </DialogHeader>
        {log && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-muted-foreground">Registro:</span> <span className="font-mono">{log.record_id ?? "—"}</span></div>
              <div><span className="text-muted-foreground">Usuário:</span> <span className="font-mono">{log.user_id ?? "—"}</span></div>
              <div className="col-span-2"><span className="text-muted-foreground">Data:</span> {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss")}</div>
            </div>
            <div className="max-h-[60vh] overflow-auto rounded border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/4">Campo</TableHead>
                    <TableHead>Antes</TableHead>
                    <TableHead>Depois</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diff.map((row) => (
                    <TableRow key={row.key} className={row.changed ? "bg-yellow-50" : undefined}>
                      <TableCell className="font-mono text-xs">{row.key}</TableCell>
                      <TableCell className="font-mono text-xs break-all">{fmt(row.old)}</TableCell>
                      <TableCell className="font-mono text-xs break-all">{fmt(row.next)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function fmt(v: unknown) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
