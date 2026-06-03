
-- RLS policies for product-images bucket (private)
CREATE POLICY "Auth read product-images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Staff upload product-images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'comercial'::app_role, 'expedicao'::app_role])
);

CREATE POLICY "Staff update product-images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'comercial'::app_role, 'expedicao'::app_role])
);

CREATE POLICY "Staff delete product-images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'comercial'::app_role, 'expedicao'::app_role])
);
