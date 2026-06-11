-- Leitura pública das categorias (vitrine do site)
GRANT SELECT ON public.product_categories TO anon;
DROP POLICY IF EXISTS "Public can read categories" ON public.product_categories;
CREATE POLICY "Public can read categories"
  ON public.product_categories FOR SELECT
  TO anon, authenticated
  USING (true);

-- Leitura pública dos produtos (catálogo)
GRANT SELECT ON public.products TO anon;
DROP POLICY IF EXISTS "Public can read products" ON public.products;
CREATE POLICY "Public can read products"
  ON public.products FOR SELECT
  TO anon, authenticated
  USING (true);

-- Leitura pública dos dados da empresa (rodapé)
GRANT SELECT ON public.company TO anon;
DROP POLICY IF EXISTS "Public can read company" ON public.company;
CREATE POLICY "Public can read company"
  ON public.company FOR SELECT
  TO anon, authenticated
  USING (true);