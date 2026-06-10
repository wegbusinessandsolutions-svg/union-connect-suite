
DROP POLICY IF EXISTS "Auth reads active products" ON public.products;

CREATE POLICY "Staff reads products"
  ON public.products FOR SELECT
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','comercial','expedicao','financeiro']::app_role[]));

CREATE OR REPLACE VIEW public.products_public
WITH (security_invoker = on) AS
SELECT
  id,
  name,
  brand,
  sku,
  image_main_url,
  price_sale,
  cashback_pct,
  category_id,
  (COALESCE(stock_qty, 0) > 0) AS in_stock,
  is_active,
  created_at
FROM public.products
WHERE is_active = true;

GRANT SELECT ON public.products_public TO authenticated, anon;

CREATE POLICY "Anyone authed reads active products via view"
  ON public.products FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins read payment integrations"
  ON public.payment_integrations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
