import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Gift, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/cliente/cashback")({
  head: () => ({ meta: [{ title: "Meu cashback" }] }),
  component: ClienteCashbackPage,
});

function ClienteCashbackPage() {
  const data = useQuery({
    queryKey: ["my-cashback"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return { balance: 0, txs: [] };
      const { data: clients } = await supabase.from("clients").select("id, cashback_balance").eq("user_id", u.user.id);
      const ids = (clients ?? []).map((c) => c.id);
      const balance = (clients ?? []).reduce((s, c) => s + Number(c.cashback_balance ?? 0), 0);
      if (ids.length === 0) return { balance: 0, txs: [] };
      const { data: txs } = await supabase
        .from("cashback_transactions")
        .select("*")
        .in("client_id", ids)
        .order("created_at", { ascending: false })
        .limit(100);
      return { balance, txs: txs ?? [] };
    },
  });

  const d = data.data;

  return (
    <div className="bg-background p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <Gift className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Meu cashback</h1>
            <p className="text-sm text-muted-foreground">Saldo acumulado e histórico de movimentações.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saldo disponível</CardTitle>
            <CardDescription>Soma dos cadastros vinculados ao seu usuário.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">{brl(d?.balance ?? 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Movimentações</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>Notas</TableHead>
                <TableHead className="text-right">Valor</TableHead><TableHead className="text-right">Saldo</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(!d || d.txs.length === 0) && !data.isLoading && (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">Sem movimentações.</TableCell></TableRow>
                )}
                {(d?.txs ?? []).map((t) => {
                  const credit = t.type === "credito";
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="text-xs">{format(new Date(t.created_at), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <Badge variant={credit ? "secondary" : "outline"} className="gap-1">
                          {credit ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {t.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{t.notes ?? "—"}</TableCell>
                      <TableCell className={`text-right font-medium ${credit ? "text-green-600" : "text-red-600"}`}>
                        {credit ? "+" : "−"}{brl(Number(t.value))}
                      </TableCell>
                      <TableCell className="text-right text-xs">{brl(Number(t.balance_after))}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function brl(n: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n); }
