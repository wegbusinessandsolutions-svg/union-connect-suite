
-- 1) Restrict client INSERT to staff only (cliente row creation goes through handle_new_user trigger or staff)
DROP POLICY IF EXISTS "Self/staff insert clients" ON public.clients;
CREATE POLICY "Staff inserts clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'comercial'::app_role]));

-- 2) product_categories: require authentication
DROP POLICY IF EXISTS "Public reads categories" ON public.product_categories;
CREATE POLICY "Auth reads categories"
ON public.product_categories
FOR SELECT
TO authenticated
USING (true);

-- 3) services: require authentication
DROP POLICY IF EXISTS "Public reads active services" ON public.services;
CREATE POLICY "Auth reads active services"
ON public.services
FOR SELECT
TO authenticated
USING ((is_active = true) OR public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'comercial'::app_role]));
