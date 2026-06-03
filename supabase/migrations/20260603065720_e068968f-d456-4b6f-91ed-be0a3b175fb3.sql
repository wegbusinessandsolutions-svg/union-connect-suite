
CREATE POLICY "Authenticated read category-images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'category-images');

CREATE POLICY "Staff upload category-images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'category-images'
  AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'comercial'::app_role, 'expedicao'::app_role])
);

CREATE POLICY "Staff update category-images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'category-images'
  AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'comercial'::app_role, 'expedicao'::app_role])
);

CREATE POLICY "Staff delete category-images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'category-images'
  AND public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'comercial'::app_role, 'expedicao'::app_role])
);
