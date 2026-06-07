import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Copy, RefreshCw, QrCode, FileText, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  createMpCharge, refreshMpCharge, listChargesForOrder, getPublicPaymentConfig,
} from "@/lib/payments.functions";

type Method = "pix" | "boleto" | "credit_card";

export interface PaymentChargeDialogProps {
  open: boolean;
  onClose: () => void;
  amount: number;
  description: string;
  orderId?: string | null;
  receivableId?: string | null;
  defaultEmail?: string;
  defaultDoc?: string;
  defaultName?: string;
}

const MP_SDK_SRC = "https://sdk.mercadopago.com/js/v2";

async function tokenizeCard(publicKey: string, params: {
  cardNumber: string; expMonth: string; expYear: string; cvv: string;
  holderName: string; docType: "CPF"|"CNPJ"; docNumber: string;
}): Promise<{ token: string; paymentMethodId: string }> {
  if (!document.querySelector(`script[src="${MP_SDK_SRC}"]`)) {
    await new Promise<void>((res, rej) => {
      const s = document.createElement("script");
      s.src = MP_SDK_SRC; s.onload = () => res(); s.onerror = () => rej(new Error("Falha ao carregar SDK MP"));
      document.head.appendChild(s);
    });
  }
  // @ts-expect-error injected global
  const MP = new window.MercadoPago(publicKey);
  const bin = params.cardNumber.replace(/\D/g, "").slice(0, 8);
  const pmRes = await MP.getPaymentMethods({ bin });
  const paymentMethodId = pmRes?.results?.[0]?.id ?? "visa";
  const tokenRes = await MP.createCardToken({
    cardNumber: params.cardNumber.replace(/\D/g, ""),
    cardholderName: params.holderName,
    cardExpirationMonth: params.expMonth,
    cardExpirationYear: params.expYear.length === 2 ? "20" + params.expYear : params.expYear,
    securityCode: params.cvv,
    identificationType: params.docType,
    identificationNumber: params.docNumber.replace(/\D/g, ""),
  });
  if (!tokenRes?.id) throw new Error("Não foi possível tokenizar o cartão.");
  return { token: tokenRes.id, paymentMethodId };
}

export function PaymentChargeDialog(props: PaymentChargeDialogProps) {
  const qc = useQueryClient();
  const [method, setMethod] = useState<Method>("pix");
  const [email, setEmail] = useState(props.defaultEmail ?? "");
  const [name, setName] = useState(props.defaultName ?? "");
  const [docType, setDocType] = useState<"CPF" | "CNPJ">("CPF");
  const [doc, setDoc] = useState(props.defaultDoc ?? "");
  const [installments, setInstallments] = useState(1);
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvv, setCvv] = useState("");

  const fetchPublic = useServerFn(getPublicPaymentConfig);
  const createFn = useServerFn(createMpCharge);
  const refreshFn = useServerFn(refreshMpCharge);
  const listFn = useServerFn(listChargesForOrder);

  const publicCfg = useQuery({
    queryKey: ["mp-public-config"],
    queryFn: () => fetchPublic({}),
  });

  const list = useQuery({
    queryKey: ["mp-charges", props.orderId, props.receivableId],
    queryFn: async () => {
      if (!props.orderId) return { transactions: [] };
      return listFn({ data: { orderId: props.orderId } });
    },
    enabled: props.open && !!props.orderId,
  });

  const create = useMutation({
    mutationFn: async () => {
      let cardToken: string | undefined;
      let paymentMethodId: string | undefined;
      if (method === "credit_card") {
        const pk = publicCfg.data?.config?.public_key;
        if (!pk) throw new Error("Chave pública do MP não configurada. Avise o administrador.");
        const tok = await tokenizeCard(pk, {
          cardNumber, expMonth, expYear, cvv,
          holderName: cardName || name, docType, docNumber: doc,
        });
        cardToken = tok.token;
        paymentMethodId = tok.paymentMethodId;
      }
      return createFn({
        data: {
          orderId: props.orderId ?? null,
          receivableId: props.receivableId ?? null,
          amount: Number(props.amount.toFixed(2)),
          description: props.description,
          method,
          installments,
          payer: {
            email, first_name: name.split(" ")[0], last_name: name.split(" ").slice(1).join(" "),
            doc_type: docType, doc_number: doc,
          },
          cardToken, paymentMethodId,
        },
      });
    },
    onSuccess: () => {
      toast.success("Cobrança criada!");
      qc.invalidateQueries({ queryKey: ["mp-charges"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const refresh = useMutation({
    mutationFn: (txId: string) => refreshFn({ data: { transactionId: txId } }),
    onSuccess: (r) => {
      toast.success(`Status: ${r.status}`);
      qc.invalidateQueries({ queryKey: ["mp-charges"] });
      qc.invalidateQueries({ queryKey: ["receivables"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => { if (!props.open) create.reset(); /* eslint-disable-line */ }, [props.open]);

  const txs = list.data?.transactions ?? [];
  const cfgInactive = publicCfg.data && !publicCfg.data.config;

  return (
    <Dialog open={props.open} onOpenChange={(o) => !o && props.onClose()}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cobrar via Mercado Pago</DialogTitle>
          <DialogDescription>
            {props.description} — <b>R$ {props.amount.toFixed(2)}</b>
          </DialogDescription>
        </DialogHeader>

        {cfgInactive ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Integração Mercado Pago inativa. Configure em <b>Admin → Integração de Pagamentos</b>.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome do pagador"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
              <Field label="E-mail *"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
              <Field label="Tipo doc.">
                <select className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={docType} onChange={(e) => setDocType(e.target.value as "CPF" | "CNPJ")}>
                  <option value="CPF">CPF</option>
                  <option value="CNPJ">CNPJ</option>
                </select>
              </Field>
              <Field label="Documento *"><Input value={doc} onChange={(e) => setDoc(e.target.value)} placeholder="Apenas números" /></Field>
            </div>

            <Tabs value={method} onValueChange={(v) => setMethod(v as Method)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pix"><QrCode className="mr-1 h-4 w-4" /> PIX</TabsTrigger>
                <TabsTrigger value="boleto"><FileText className="mr-1 h-4 w-4" /> Boleto</TabsTrigger>
                <TabsTrigger value="credit_card"><CreditCard className="mr-1 h-4 w-4" /> Cartão</TabsTrigger>
              </TabsList>
              <TabsContent value="pix" className="text-xs text-muted-foreground">
                Gera um QR Code PIX com expiração padrão de 30 minutos.
              </TabsContent>
              <TabsContent value="boleto" className="text-xs text-muted-foreground">
                Gera um boleto bancário Bradesco com link para impressão.
              </TabsContent>
              <TabsContent value="credit_card" className="space-y-3 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Número do cartão"><Input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} maxLength={19} /></Field>
                  <Field label="Nome impresso"><Input value={cardName} onChange={(e) => setCardName(e.target.value)} /></Field>
                  <Field label="Mês (MM)"><Input value={expMonth} onChange={(e) => setExpMonth(e.target.value)} maxLength={2} /></Field>
                  <Field label="Ano (AA/AAAA)"><Input value={expYear} onChange={(e) => setExpYear(e.target.value)} maxLength={4} /></Field>
                  <Field label="CVV"><Input value={cvv} onChange={(e) => setCvv(e.target.value)} maxLength={4} /></Field>
                  <Field label="Parcelas">
                    <Input type="number" min={1} max={12} value={installments}
                      onChange={(e) => setInstallments(Math.max(1, Number(e.target.value) || 1))} />
                  </Field>
                </div>
              </TabsContent>
            </Tabs>

            {txs.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase text-muted-foreground">Cobranças anteriores</div>
                {txs.map((t) => (
                  <div key={t.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{t.method}</Badge>
                        <Badge className={
                          t.status === "approved" ? "bg-emerald-100 text-emerald-900"
                          : t.status === "pending" ? "bg-amber-100 text-amber-900"
                          : "bg-slate-100 text-slate-700"}>
                          {t.status}
                        </Badge>
                        <span className="font-mono text-xs">R$ {Number(t.amount).toFixed(2)}</span>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => refresh.mutate(t.id)} disabled={refresh.isPending}>
                        {refresh.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      </Button>
                    </div>
                    {t.qr_code_base64 && (
                      <div className="mt-2 flex flex-col items-center gap-2">
                        <img alt="QR PIX" src={`data:image/png;base64,${t.qr_code_base64}`} className="h-40 w-40" />
                        {t.qr_code && (
                          <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(t.qr_code!); toast.success("Copiado!"); }}>
                            <Copy className="mr-1 h-3 w-3" /> Copiar código PIX
                          </Button>
                        )}
                      </div>
                    )}
                    {t.ticket_url && (
                      <a href={t.ticket_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-blue-600 underline">
                        Abrir boleto ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={props.onClose}>Fechar</Button>
          <Button onClick={() => create.mutate()} disabled={create.isPending || cfgInactive || !email || !doc}>
            {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gerar cobrança
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
