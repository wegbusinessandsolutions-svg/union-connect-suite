
-- 1) company: restringir leitura a admin/financeiro
DROP POLICY IF EXISTS "Auth reads company" ON public.company;
CREATE POLICY "Staff reads company"
ON public.company FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]));

-- 2) products: remover acesso anônimo, manter ativos para autenticados
DROP POLICY IF EXISTS "Public reads active products" ON public.products;
CREATE POLICY "Auth reads active products"
ON public.products FOR SELECT TO authenticated
USING (
  is_active = true
  OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'comercial'::app_role, 'expedicao'::app_role, 'financeiro'::app_role])
);

-- 3) sale_order_items: escopar leitura como sale_orders
DROP POLICY IF EXISTS "Items read inherits order" ON public.sale_order_items;
CREATE POLICY "Order parties read items"
ON public.sale_order_items FOR SELECT TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'comercial'::app_role, 'financeiro'::app_role, 'expedicao'::app_role])
  OR EXISTS (
    SELECT 1 FROM public.sale_orders o
    WHERE o.id = sale_order_items.order_id
      AND (
        o.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.clients c
          WHERE c.id = o.client_id AND c.user_id = auth.uid()
        )
      )
  )
);

-- 4) user_roles: remover self-assign de 'cliente'
DROP POLICY IF EXISTS "Self-assign cliente role" ON public.user_roles;
