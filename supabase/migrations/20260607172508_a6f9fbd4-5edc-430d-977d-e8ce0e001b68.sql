
-- ============ payment_integrations ============
CREATE TABLE public.payment_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'mercado_pago',
  environment TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox','production')),
  public_key TEXT,
  statement_descriptor TEXT,
  notification_email TEXT,
  webhook_secret TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_integrations TO authenticated;
GRANT ALL ON public.payment_integrations TO service_role;

ALTER TABLE public.payment_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage payment integrations"
  ON public.payment_integrations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow authenticated users to read just the public_key + environment + is_active
-- via a security definer function (used by the client SDK for tokenization).
CREATE OR REPLACE FUNCTION public.get_payment_public_config()
RETURNS TABLE(provider TEXT, environment TEXT, public_key TEXT, is_active BOOLEAN)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT provider, environment, public_key, is_active
  FROM public.payment_integrations
  WHERE provider = 'mercado_pago' AND is_active = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_payment_public_config() TO authenticated, anon;

CREATE TRIGGER update_payment_integrations_updated_at
  BEFORE UPDATE ON public.payment_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ payment_transactions ============
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'mercado_pago',
  mp_payment_id TEXT,
  mp_preference_id TEXT,
  order_id UUID REFERENCES public.sale_orders(id) ON DELETE SET NULL,
  receivable_id UUID REFERENCES public.receivables(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  user_id UUID,
  method TEXT NOT NULL CHECK (method IN ('pix','boleto','credit_card','debit_card')),
  status TEXT NOT NULL DEFAULT 'pending',
  status_detail TEXT,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  description TEXT,
  payer_email TEXT,
  payer_doc TEXT,
  qr_code TEXT,
  qr_code_base64 TEXT,
  ticket_url TEXT,
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  raw_response JSONB,
  raw_webhook JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_tx_order ON public.payment_transactions(order_id);
CREATE INDEX idx_payment_tx_receivable ON public.payment_transactions(receivable_id);
CREATE INDEX idx_payment_tx_client ON public.payment_transactions(client_id);
CREATE INDEX idx_payment_tx_mp ON public.payment_transactions(mp_payment_id);
CREATE INDEX idx_payment_tx_status ON public.payment_transactions(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_transactions TO authenticated;
GRANT ALL ON public.payment_transactions TO service_role;

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage payment transactions"
  ON public.payment_transactions FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','comercial']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','comercial']::app_role[]));

CREATE POLICY "Clients view own payment transactions"
  ON public.payment_transactions FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default empty config row so the admin page always has one to edit
INSERT INTO public.payment_integrations (provider, environment, is_active)
VALUES ('mercado_pago', 'sandbox', false)
ON CONFLICT (provider) DO NOTHING;
