
-- kits_essenciais
CREATE TABLE public.kits_essenciais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price NUMERIC(12,2),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kits_essenciais TO authenticated;
GRANT ALL ON public.kits_essenciais TO service_role;
ALTER TABLE public.kits_essenciais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kits_read_auth" ON public.kits_essenciais FOR SELECT TO authenticated USING (true);
CREATE POLICY "kits_admin_write" ON public.kits_essenciais FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_kits_essenciais_updated_at BEFORE UPDATE ON public.kits_essenciais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- marcas_parceiras
CREATE TABLE public.marcas_parceiras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  discount_pct NUMERIC(5,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marcas_parceiras TO authenticated;
GRANT ALL ON public.marcas_parceiras TO service_role;
ALTER TABLE public.marcas_parceiras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marcas_read_auth" ON public.marcas_parceiras FOR SELECT TO authenticated USING (true);
CREATE POLICY "marcas_admin_write" ON public.marcas_parceiras FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_marcas_parceiras_updated_at BEFORE UPDATE ON public.marcas_parceiras FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- clube_beneficios
CREATE TABLE public.clube_beneficios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  benefit_type TEXT,
  discount_value NUMERIC(12,2),
  terms TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clube_beneficios TO authenticated;
GRANT ALL ON public.clube_beneficios TO service_role;
ALTER TABLE public.clube_beneficios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clube_read_auth" ON public.clube_beneficios FOR SELECT TO authenticated USING (true);
CREATE POLICY "clube_admin_write" ON public.clube_beneficios FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_clube_beneficios_updated_at BEFORE UPDATE ON public.clube_beneficios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
