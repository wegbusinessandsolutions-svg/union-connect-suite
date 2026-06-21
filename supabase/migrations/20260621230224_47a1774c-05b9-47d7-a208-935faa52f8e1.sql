-- RLS policies for admin-assets bucket (bucket created via storage tool)
-- Authenticated users can read; only admins can write/update/delete
DROP POLICY IF EXISTS "admin_assets_read" ON storage.objects;
CREATE POLICY "admin_assets_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'admin-assets');

DROP POLICY IF EXISTS "admin_assets_insert" ON storage.objects;
CREATE POLICY "admin_assets_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'admin-assets' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admin_assets_update" ON storage.objects;
CREATE POLICY "admin_assets_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'admin-assets' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'admin-assets' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admin_assets_delete" ON storage.objects;
CREATE POLICY "admin_assets_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'admin-assets' AND public.has_role(auth.uid(), 'admin'));