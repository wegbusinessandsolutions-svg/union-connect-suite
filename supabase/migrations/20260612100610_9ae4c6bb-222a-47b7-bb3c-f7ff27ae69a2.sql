
DROP POLICY IF EXISTS "Public can read products" ON public.products;
REVOKE SELECT ON public.products FROM anon;

DROP POLICY IF EXISTS "Public can read company" ON public.company;
REVOKE SELECT ON public.company FROM anon;

CREATE OR REPLACE VIEW public.company_public
WITH (security_invoker = on) AS
SELECT
  id,
  razao_social,
  nome_fantasia,
  cnpj,
  email,
  phone,
  site,
  logo_url,
  address_street,
  address_number,
  address_complement,
  address_district,
  address_city,
  address_state,
  address_zip
FROM public.company;

GRANT SELECT ON public.company_public TO anon, authenticated;
