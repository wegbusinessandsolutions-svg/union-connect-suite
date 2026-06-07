import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

export const Route = createFileRoute("/api/public/mp-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const bodyText = await request.text();
        let payload: Record<string, unknown> = {};
        try { payload = JSON.parse(bodyText); } catch { /* ignore */ }

        // Mercado Pago signature: x-signature: "ts=...,v1=hmac"
        // Template: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
        const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
        if (secret) {
          const sigHeader = request.headers.get("x-signature") ?? "";
          const reqId = request.headers.get("x-request-id") ?? "";
          const parts = Object.fromEntries(
            sigHeader.split(",").map((s) => {
              const [k, ...rest] = s.trim().split("=");
              return [k, rest.join("=")];
            }),
          );
          const ts = parts["ts"];
          const v1 = parts["v1"];
          const dataId = String(
            (payload.data as { id?: string | number } | undefined)?.id
              ?? url.searchParams.get("data.id")
              ?? "",
          );
          if (ts && v1 && dataId) {
            const manifest = `id:${dataId};request-id:${reqId};ts:${ts};`;
            const expected = createHmac("sha256", secret).update(manifest).digest("hex");
            try {
              const a = Buffer.from(v1, "hex");
              const b = Buffer.from(expected, "hex");
              if (a.length !== b.length || !timingSafeEqual(a, b)) {
                return new Response("Invalid signature", { status: 401 });
              }
            } catch {
              return new Response("Invalid signature", { status: 401 });
            }
          }
        }

        // Only process payment events
        const topic = String(payload.type ?? payload.topic ?? "");
        const dataId = String(
          (payload.data as { id?: string | number } | undefined)?.id
            ?? url.searchParams.get("data.id")
            ?? "",
        );
        if (!topic.includes("payment") || !dataId) {
          return new Response("ignored", { status: 200 });
        }

        const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
        if (!accessToken) return new Response("missing token", { status: 500 });

        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!mpRes.ok) return new Response("mp fetch failed", { status: 200 });
        const mp = (await mpRes.json()) as Record<string, unknown>;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const status = String(mp.status ?? "pending");
        const paidAt = status === "approved" ? new Date().toISOString() : null;

        const { data: existing } = await supabaseAdmin
          .from("payment_transactions")
          .select("id, receivable_id, paid_at")
          .eq("mp_payment_id", String(dataId))
          .maybeSingle();

        if (existing) {
          const patch: Record<string, unknown> = {
            status,
            status_detail: String(mp.status_detail ?? ""),
            raw_webhook: payload,
            raw_response: mp,
          };
          if (paidAt && !existing.paid_at) patch.paid_at = paidAt;
          await supabaseAdmin.from("payment_transactions")
            .update(patch as never).eq("id", existing.id);
          if (status === "approved" && existing.receivable_id) {
            await supabaseAdmin.from("receivables").update({
              status: "pago", paid_at: paidAt, paid_value: mp.transaction_amount,
            } as never).eq("id", existing.receivable_id);
          }
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
