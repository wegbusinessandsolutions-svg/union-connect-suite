import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CreditCard, Copy, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { getMpConfig, updateMpConfig, testMpConnection } from "@/lib/payments.functions";

export const Route = createFileRoute("/_authenticated/admin/integracoes-pagamentos")({
  head: () => ({ meta: [{ title: "Integração de Pagamentos — Admin" }] }),
  component: IntegracoesPagamentosPage,
});

function IntegracoesPagamentosPage() {
  const qc = useQueryClient();
  const getCfg = useServerFn(getMpConfig);
  const updCfg = useServerFn(updateMpConfig);
  const testFn = useServerFn(testMpConnection);

  const cfgQ = useQuery({ queryKey: ["mp-config"], queryFn: () => getCfg({}) });

  const [environment, setEnvironment] = useState<"sandbox" | "production">("sandbox");
  const [publicKey, setPublicKey] = useState("");
  const [statementDescriptor, setStatementDescriptor] = useState("");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const c = cfgQ.data?.config;
    if (!c) return;
    setEnvironment((c.environment as "sandbox" | "production") ?? "sandbox");
    setPublicKey(c.public_key ?? "");
    setStatementDescriptor(c.statement_descriptor ?? "");
    setNotificationEmail(c.notification_email ?? "");
    setIsActive(!!c.is_active);
  }, [cfgQ.data]);

  const save = useMutation({
    mutationFn: () => updCfg({
      data: {
        environment, public_key: publicKey, statement_descriptor: statementDescriptor,
        notification_email: notificationEmail, is_active: isActive,
      },
    }),
    onSuccess: () => {
      toast.success("Configuração salva!");
      qc.invalidateQueries({ queryKey: ["mp-config"] });
      qc.invalidateQueries({ queryKey: ["mp-public-config"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const test = useMutation({
    mutationFn: () => testFn({}),
    onSuccess: (r) => toast.success(`Conectado como ${r.user.nickname ?? r.user.email}`),
    onError: (e: Error) => toast.error(e.message),
  });

  const origin = typeof window !== "undefined" ? window.location.origin : "https://union-connect-suite.lovable.app";
  const webhookUrl = `${origin.replace("id-preview--", "").replace(/-preview/, "")}/api/public/mp-webhook`;
  const prodWebhook = "https://union-connect-suite.lovable.app/api/public/mp-webhook";

  return (
    <div className="bg-background p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <CreditCard className="h-7 w-7 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Integração de Pagamentos</h1>
            <p className="text-sm text-muted-foreground">
              Configure a integração com o Mercado Pago para receber pagamentos via PIX, boleto e cartão de crédito.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  Mercado Pago
                  {isActive
                    ? <Badge className="bg-emerald-100 text-emerald-900"><CheckCircle2 className="mr-1 h-3 w-3" /> Ativo</Badge>
                    : <Badge variant="outline"><AlertCircle className="mr-1 h-3 w-3" /> Inativo</Badge>}
                </CardTitle>
                <CardDescription>Credenciais e ambiente da integração.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Ativar</Label>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Ambiente</Label>
                <select className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={environment} onChange={(e) => setEnvironment(e.target.value as "sandbox" | "production")}>
                  <option value="sandbox">Sandbox (testes)</option>
                  <option value="production">Produção</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Identificador na fatura (statement descriptor)</Label>
                <Input value={statementDescriptor} onChange={(e) => setStatementDescriptor(e.target.value)} maxLength={22} placeholder="UNIAOCOND" />
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-xs">Public Key (usada no checkout transparente)</Label>
                <Input value={publicKey} onChange={(e) => setPublicKey(e.target.value)} placeholder="APP_USR-xxxxx ou TEST-xxxxx" />
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-xs">E-mail para notificações</Label>
                <Input type="email" value={notificationEmail} onChange={(e) => setNotificationEmail(e.target.value)} placeholder="financeiro@empresa.com" />
              </div>
            </div>

            <div className="rounded-md border bg-muted/40 p-3 text-xs space-y-2">
              <div className="font-semibold">Credenciais secretas (Access Token e Webhook Secret)</div>
              <p className="text-muted-foreground">
                As credenciais sensíveis ficam armazenadas em variáveis seguras no servidor
                (<code className="rounded bg-background px-1">MERCADO_PAGO_ACCESS_TOKEN</code> e{" "}
                <code className="rounded bg-background px-1">MERCADO_PAGO_WEBHOOK_SECRET</code>).
                Para atualizá-las, use o gerenciador de Segredos do projeto.
              </p>
            </div>

            <div className="rounded-md border bg-muted/40 p-3 text-xs space-y-2">
              <div className="font-semibold">URL de Webhook (notificações do MP)</div>
              <p className="text-muted-foreground">Cadastre uma destas URLs no painel do Mercado Pago em <b>Suas integrações → Webhooks</b>:</p>
              <div className="flex items-center gap-2 rounded bg-background p-2">
                <code className="flex-1 break-all">{prodWebhook}</code>
                <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(prodWebhook); toast.success("Copiado!"); }}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-muted-foreground">Tópico: <b>payment</b>. A assinatura é validada com o segredo configurado.</p>
              {webhookUrl !== prodWebhook && (
                <p className="text-muted-foreground">URL atual da janela: <code className="rounded bg-background px-1 break-all">{webhookUrl}</code></p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => test.mutate()} disabled={test.isPending}>
            {test.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Testar conexão
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}
