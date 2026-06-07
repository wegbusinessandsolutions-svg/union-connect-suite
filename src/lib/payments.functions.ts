import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MP_BASE = "https://api.mercadopago.com";

function mpToken() {
  const t = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!t) throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado.");
  return t;
}

async function mpFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${MP_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${mpToken()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (body as { message?: string })?.message ?? `MP error ${res.status}`;
    throw new Error(`[Mercado Pago] ${msg}`);
  }
  return body as Record<string, unknown>;
}

async function assertRole(userId: string, roles: string[]) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", roles as never);
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Permissão insuficiente.");
}

/* ============== CONFIG (admin) ============== */

export const getMpConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertRole(context.userId, ["admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("payment_integrations")
      .select("*")
      .eq("provider", "mercado_pago")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { config: data };
  });

const updateConfigSchema = z.object({
  environment: z.enum(["sandbox", "production"]),
  public_key: z.string().trim().max(255).optional().nullable(),
  statement_descriptor: z.string().trim().max(22).optional().nullable(),
  notification_email: z.string().email().max(255).optional().nullable().or(z.literal("")),
  is_active: z.boolean(),
});

export const updateMpConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => updateConfigSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertRole(context.userId, ["admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      provider: "mercado_pago",
      environment: data.environment,
      public_key: data.public_key || null,
      statement_descriptor: data.statement_descriptor || null,
      notification_email: data.notification_email || null,
      is_active: data.is_active,
    };
    const { error } = await supabaseAdmin
      .from("payment_integrations")
      .upsert(payload as never, { onConflict: "provider" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const testMpConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertRole(context.userId, ["admin"]);
    const res = await mpFetch("/users/me");
    return {
      ok: true,
      user: {
        id: res.id,
        nickname: res.nickname,
        email: res.email,
        site_id: res.site_id,
      },
    };
  });

/* ============== PUBLIC (any auth) ============== */

export const getPublicPaymentConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("payment_integrations")
      .select("provider, environment, public_key, is_active")
      .eq("provider", "mercado_pago")
      .maybeSingle();
    if (!data || !data.is_active) return { config: null };
    void context.userId;
    return { config: data };
  });

/* ============== CHARGE ============== */

const chargeSchema = z.object({
  orderId: z.string().uuid().optional().nullable(),
  receivableId: z.string().uuid().optional().nullable(),
  amount: z.number().positive().max(1_000_000),
  description: z.string().trim().min(1).max(255),
  method: z.enum(["pix", "boleto", "credit_card"]),
  installments: z.number().int().min(1).max(24).default(1),
  payer: z.object({
    email: z.string().email().max(255),
    first_name: z.string().trim().max(120).optional(),
    last_name: z.string().trim().max(120).optional(),
    doc_type: z.enum(["CPF", "CNPJ"]).default("CPF"),
    doc_number: z.string().trim().min(11).max(20),
    zip_code: z.string().trim().max(20).optional(),
    street_name: z.string().trim().max(120).optional(),
    street_number: z.string().trim().max(20).optional(),
    neighborhood: z.string().trim().max(120).optional(),
    city: z.string().trim().max(120).optional(),
    federal_unit: z.string().trim().max(2).optional(),
  }),
  cardToken: z.string().trim().max(255).optional().nullable(),
  paymentMethodId: z.string().trim().max(40).optional().nullable(),
});

export const createMpCharge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => chargeSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let clientId: string | null = null;
    if (data.orderId) {
      const { data: o } = await supabaseAdmin
        .from("sale_orders")
        .select("id, client_id, user_id, total")
        .eq("id", data.orderId)
        .maybeSingle();
      if (!o) throw new Error("Pedido não encontrado.");
      clientId = o.client_id;
    } else if (data.receivableId) {
      const { data: r } = await supabaseAdmin
        .from("receivables")
        .select("id, client_id")
        .eq("id", data.receivableId)
        .maybeSingle();
      if (!r) throw new Error("Lançamento não encontrado.");
      clientId = r.client_id;
    }

    const baseBody: Record<string, unknown> = {
      transaction_amount: Number(data.amount.toFixed(2)),
      description: data.description,
      payer: {
        email: data.payer.email,
        first_name: data.payer.first_name,
        last_name: data.payer.last_name,
        identification: {
          type: data.payer.doc_type,
          number: data.payer.doc_number.replace(/\D/g, ""),
        },
        address:
          data.payer.zip_code
            ? {
                zip_code: data.payer.zip_code,
                street_name: data.payer.street_name,
                street_number: data.payer.street_number,
                neighborhood: data.payer.neighborhood,
                city: data.payer.city,
                federal_unit: data.payer.federal_unit,
              }
            : undefined,
      },
      external_reference: data.orderId ?? data.receivableId ?? undefined,
      notification_url: undefined as string | undefined,
    };

    // Build notification URL using publish or preview URL — best effort.
    try {
      const origin = process.env.PUBLIC_SITE_URL
        ?? "https://union-connect-suite.lovable.app";
      baseBody.notification_url = `${origin}/api/public/mp-webhook`;
    } catch { /* ignore */ }

    let body: Record<string, unknown> = baseBody;
    if (data.method === "pix") {
      body = { ...baseBody, payment_method_id: "pix" };
    } else if (data.method === "boleto") {
      body = { ...baseBody, payment_method_id: "bolbradesco" };
    } else if (data.method === "credit_card") {
      if (!data.cardToken) throw new Error("Token do cartão é obrigatório.");
      if (!data.paymentMethodId) throw new Error("Bandeira do cartão é obrigatória.");
      body = {
        ...baseBody,
        token: data.cardToken,
        installments: data.installments,
        payment_method_id: data.paymentMethodId,
        capture: true,
      };
    }

    const idemKey = `${context.userId}-${data.orderId ?? data.receivableId ?? "x"}-${Date.now()}`;
    const mp = await mpFetch("/v1/payments", {
      method: "POST",
      headers: { "X-Idempotency-Key": idemKey },
      body: JSON.stringify(body),
    });

    const poi = (mp.point_of_interaction ?? {}) as Record<string, unknown>;
    const td = (poi.transaction_data ?? {}) as Record<string, unknown>;
    const trDetails = (mp.transaction_details ?? {}) as Record<string, unknown>;

    const tx = {
      provider: "mercado_pago" as const,
      mp_payment_id: String(mp.id ?? ""),
      order_id: data.orderId ?? null,
      receivable_id: data.receivableId ?? null,
      client_id: clientId,
      user_id: context.userId,
      method: data.method,
      status: String(mp.status ?? "pending"),
      status_detail: String(mp.status_detail ?? ""),
      amount: Number(data.amount.toFixed(2)),
      currency: "BRL",
      description: data.description,
      payer_email: data.payer.email,
      payer_doc: data.payer.doc_number,
      qr_code: (td.qr_code as string | undefined) ?? null,
      qr_code_base64: (td.qr_code_base64 as string | undefined) ?? null,
      ticket_url: (trDetails.external_resource_url as string | undefined) ?? null,
      expires_at: (mp.date_of_expiration as string | undefined) ?? null,
      paid_at: mp.status === "approved" ? new Date().toISOString() : null,
      raw_response: mp as never,
    };

    const { data: inserted, error } = await supabaseAdmin
      .from("payment_transactions")
      .insert(tx as never)
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    return { transaction: inserted };
  });

export const refreshMpCharge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ transactionId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: tx } = await supabaseAdmin
      .from("payment_transactions").select("*").eq("id", data.transactionId).maybeSingle();
    if (!tx) throw new Error("Cobrança não encontrada.");
    if (!tx.mp_payment_id) throw new Error("Cobrança sem ID MP.");
    const mp = await mpFetch(`/v1/payments/${tx.mp_payment_id}`);
    const status = String(mp.status ?? tx.status);
    const updates: Record<string, unknown> = {
      status,
      status_detail: String(mp.status_detail ?? ""),
      raw_response: mp,
    };
    if (status === "approved" && !tx.paid_at) {
      updates.paid_at = new Date().toISOString();
      if (tx.receivable_id) {
        await supabaseAdmin.from("receivables").update({
          status: "pago", paid_at: updates.paid_at, paid_value: tx.amount,
        } as never).eq("id", tx.receivable_id);
      }
    }
    await supabaseAdmin.from("payment_transactions").update(updates as never).eq("id", tx.id);
    return { status, status_detail: updates.status_detail };
  });

export const listChargesForOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: txs, error } = await supabaseAdmin
      .from("payment_transactions")
      .select("*")
      .eq("order_id", data.orderId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { transactions: txs ?? [] };
  });
