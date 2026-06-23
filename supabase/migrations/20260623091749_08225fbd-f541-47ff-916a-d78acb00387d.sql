
-- Grants Data API faltantes em product_categories
GRANT SELECT ON public.product_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_categories TO authenticated;
GRANT ALL ON public.product_categories TO service_role;

-- Permitir leitura pública (anon + authenticated) dos objetos no bucket category-images
-- para que signed URLs sejam emitidas a visitantes anônimos da home.
DROP POLICY IF EXISTS "Public read category-images" ON storage.objects;
CREATE POLICY "Public read category-images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'category-images');
