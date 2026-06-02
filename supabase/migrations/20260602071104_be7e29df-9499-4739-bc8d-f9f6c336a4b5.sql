
-- ============================================================
-- FUNÇÕES UTILITÁRIAS
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles));
$$;

-- ============================================================
-- ENUMS DE DOMÍNIO
-- ============================================================
CREATE TYPE public.client_type AS ENUM ('pf','pj');
CREATE TYPE public.client_tier AS ENUM ('bronze','prata','ouro','diamante');
CREATE TYPE public.stock_movement_type AS ENUM ('entrada','saida','ajuste','inventario');
CREATE TYPE public.order_type AS ENUM ('pdv','ecommerce','orcamento');
CREATE TYPE public.order_status AS ENUM ('rascunho','confirmado','separando','em_rota','entregue','cancelado');
CREATE TYPE public.delivery_status AS ENUM ('aguardando','em_rota','entregue','falha');
CREATE TYPE public.bank_account_type AS ENUM ('corrente','poupanca','caixa');
CREATE TYPE public.cost_center_category AS ENUM ('fixo','variavel','imobilizado','bancario','pessoal');
CREATE TYPE public.financial_status AS ENUM ('aberto','parcial','pago','vencido','cancelado');
CREATE TYPE public.contract_type AS ENUM ('clt','pj','terceirizado','freelancer');
CREATE TYPE public.cashback_type AS ENUM ('credito','debito','expiracao','transferencia');
CREATE TYPE public.product_origin AS ENUM ('nacional','importado');

-- ============================================================
-- 1. EMPRESA
-- ============================================================
CREATE TABLE public.company (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social TEXT NOT NULL, nome_fantasia TEXT,
  cnpj TEXT UNIQUE, ie TEXT, im TEXT, logo_url TEXT,
  address_street TEXT, address_number TEXT, address_complement TEXT,
  address_district TEXT, address_city TEXT, address_state TEXT, address_zip TEXT,
  phone TEXT, email TEXT, site TEXT,
  regime_tributario TEXT, certificado_digital_url TEXT,
  responsavel_nome TEXT, responsavel_cpf TEXT,
  cashback_pct_padrao NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.company TO authenticated;
GRANT ALL ON public.company TO service_role;
ALTER TABLE public.company ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth reads company" ON public.company FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manages company" ON public.company FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_company_updated_at BEFORE UPDATE ON public.company
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. PERFIS DE USUÁRIO
-- ============================================================
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT, email TEXT, phone TEXT, avatar_url TEXT,
  department TEXT, is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Self or admin read profile" ON public.user_profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Self or admin update profile" ON public.user_profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Self or admin insert profile" ON public.user_profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin deletes profile" ON public.user_profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-criar perfil + papel cliente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name, email, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), NEW.email, NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'cliente')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "Self-assign cliente role" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND role = 'cliente');
CREATE POLICY "Admin reads all roles" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin manages roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============================================================
-- 3. CLIENTES
-- ============================================================
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type client_type NOT NULL DEFAULT 'pf', name TEXT NOT NULL,
  cpf_cnpj TEXT, rg_ie TEXT, birth_date DATE,
  email TEXT, email2 TEXT, phone TEXT, phone2 TEXT, whatsapp TEXT,
  address_street TEXT, address_number TEXT, address_complement TEXT,
  address_district TEXT, address_city TEXT, address_state TEXT, address_zip TEXT,
  lat NUMERIC, lng NUMERIC, fiscal_type TEXT,
  tier client_tier NOT NULL DEFAULT 'bronze',
  cashback_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  resp1_name TEXT, resp1_cpf TEXT, resp1_phone TEXT, resp1_email TEXT,
  resp2_name TEXT, resp2_cpf TEXT, resp2_phone TEXT, resp2_email TEXT,
  notes_internal TEXT, is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_clients_cpf_cnpj ON public.clients(cpf_cnpj);
CREATE INDEX idx_clients_tier ON public.clients(tier);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Client/staff read clients" ON public.clients FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','comercial','financeiro','expedicao']::app_role[]));
CREATE POLICY "Client/staff update clients" ON public.clients FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','comercial']::app_role[]));
CREATE POLICY "Self/staff insert clients" ON public.clients FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','comercial']::app_role[]));
CREATE POLICY "Staff deletes clients" ON public.clients FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','comercial']::app_role[]));
CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 4. FORNECEDORES
-- ============================================================
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social TEXT NOT NULL, nome_fantasia TEXT,
  cnpj TEXT UNIQUE, ie TEXT,
  address_street TEXT, address_number TEXT, address_complement TEXT,
  address_district TEXT, address_city TEXT, address_state TEXT, address_zip TEXT,
  phone TEXT, email TEXT, site TEXT, whatsapp TEXT,
  rep_name TEXT, rep_phone TEXT, rep_email TEXT,
  bank_name TEXT, bank_agency TEXT, bank_account TEXT, bank_pix TEXT,
  avg_delivery_days INT, payment_terms TEXT, rating SMALLINT, notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff reads suppliers" ON public.suppliers FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','comercial','expedicao']::app_role[]));
CREATE POLICY "Admin/financeiro manages suppliers" ON public.suppliers FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 5. CATEGORIAS DE PRODUTO
-- ============================================================
CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_categories TO authenticated;
GRANT ALL ON public.product_categories TO service_role;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads categories" ON public.product_categories FOR SELECT USING (true);
CREATE POLICY "Staff manages categories" ON public.product_categories FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','comercial','expedicao']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','comercial','expedicao']::app_role[]));

-- ============================================================
-- 6. PRODUTOS
-- ============================================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE, ean TEXT, name TEXT NOT NULL,
  brand TEXT, manufacturer TEXT,
  category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  description_short TEXT, description_long TEXT,
  image_main_url TEXT, images JSONB DEFAULT '[]'::jsonb,
  color TEXT, weight_kg NUMERIC,
  dim_length NUMERIC, dim_width NUMERIC, dim_height NUMERIC,
  unit_measure TEXT, qty_per_pack INT, material TEXT, expiry_days INT,
  cfop_internal TEXT, cfop_external TEXT, ncm TEXT, cest TEXT,
  origin product_origin DEFAULT 'nacional',
  cst_icms TEXT, cst_pis TEXT, cst_cofins TEXT,
  aliquota_icms NUMERIC, aliquota_pis NUMERIC, aliquota_cofins NUMERIC,
  cost_last NUMERIC(12,2), cost_avg NUMERIC(12,2), margin_pct NUMERIC(5,2),
  price_sale NUMERIC(12,2) NOT NULL DEFAULT 0, price_min NUMERIC(12,2),
  price_bronze NUMERIC(12,2), price_prata NUMERIC(12,2),
  price_ouro NUMERIC(12,2), price_diamante NUMERIC(12,2),
  cashback_pct NUMERIC(5,2) DEFAULT 0,
  stock_qty INT NOT NULL DEFAULT 0,
  stock_min INT, stock_max INT, stock_location TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_active ON public.products(is_active) WHERE is_active = true;
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active products" ON public.products FOR SELECT
  USING (is_active = true OR public.has_any_role(auth.uid(), ARRAY['admin','comercial','expedicao','financeiro']::app_role[]));
CREATE POLICY "Staff manages products" ON public.products FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','comercial','expedicao']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','comercial','expedicao']::app_role[]));
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 7. MOVIMENTAÇÕES DE ESTOQUE
-- ============================================================
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type stock_movement_type NOT NULL, qty INT NOT NULL,
  reason TEXT, reference_id UUID,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_stock_mov_product ON public.stock_movements(product_id);
CREATE INDEX idx_stock_mov_created ON public.stock_movements(created_at DESC);
GRANT SELECT, INSERT ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff reads stock" ON public.stock_movements FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','expedicao','comercial','financeiro']::app_role[]));
CREATE POLICY "Staff inserts stock" ON public.stock_movements FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','expedicao']::app_role[]));

-- ============================================================
-- 8. SERVIÇOS
-- ============================================================
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE, name TEXT NOT NULL,
  category TEXT, description TEXT, description_tech TEXT,
  price_base NUMERIC(12,2) NOT NULL DEFAULT 0,
  billing_unit TEXT, duration_min INT,
  coverage_cities TEXT[], cashback_pct NUMERIC(5,2) DEFAULT 0,
  images JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active services" ON public.services FOR SELECT
  USING (is_active = true OR public.has_any_role(auth.uid(), ARRAY['admin','comercial']::app_role[]));
CREATE POLICY "Staff manages services" ON public.services FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','comercial']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','comercial']::app_role[]));
CREATE TRIGGER trg_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- COLABORADORES (antes de service_professionals)
-- ============================================================
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL, cpf TEXT, rg TEXT, pis TEXT,
  birth_date DATE, photo_url TEXT,
  role TEXT, department TEXT,
  contract_type contract_type,
  hired_at DATE, fired_at DATE,
  salary NUMERIC(12,2),
  workdays TEXT[], work_start TIME, work_end TIME, break_min INT,
  address_street TEXT, address_number TEXT, address_complement TEXT,
  address_district TEXT, address_city TEXT, address_state TEXT, address_zip TEXT,
  phone TEXT, email TEXT,
  bank_name TEXT, bank_agency TEXT, bank_account TEXT,
  benefits JSONB DEFAULT '{}'::jsonb, docs JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Self/admin reads employees" ON public.employees FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin manages employees" ON public.employees FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_employees_updated_at BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 9. SERVICE_PROFESSIONALS
-- ============================================================
CREATE TABLE public.service_professionals (
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  PRIMARY KEY (service_id, employee_id)
);
GRANT SELECT, INSERT, DELETE ON public.service_professionals TO authenticated;
GRANT ALL ON public.service_professionals TO service_role;
ALTER TABLE public.service_professionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff reads service-professionals" ON public.service_professionals FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','comercial']::app_role[]));
CREATE POLICY "Staff manages service-professionals" ON public.service_professionals FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','comercial']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','comercial']::app_role[]));

-- ============================================================
-- 10. PEDIDOS DE VENDA
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS public.sale_orders_order_number_seq;
CREATE TABLE public.sale_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number BIGINT NOT NULL DEFAULT nextval('public.sale_orders_order_number_seq') UNIQUE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id),
  type order_type NOT NULL DEFAULT 'ecommerce',
  status order_status NOT NULL DEFAULT 'rascunho',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_pct NUMERIC(5,2) DEFAULT 0, discount_value NUMERIC(12,2) DEFAULT 0,
  cashback_used NUMERIC(12,2) DEFAULT 0, total NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT, installments INT DEFAULT 1,
  delivery_address JSONB, notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sale_orders_client ON public.sale_orders(client_id);
CREATE INDEX idx_sale_orders_status ON public.sale_orders(status);
CREATE INDEX idx_sale_orders_created ON public.sale_orders(created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_orders TO authenticated;
GRANT ALL ON public.sale_orders TO service_role;
ALTER TABLE public.sale_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Order parties read" ON public.sale_orders FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','comercial','financeiro','expedicao']::app_role[])
    OR user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = sale_orders.client_id AND c.user_id = auth.uid()));
CREATE POLICY "Client/staff insert orders" ON public.sale_orders FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','comercial']::app_role[])
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = sale_orders.client_id AND c.user_id = auth.uid()));
CREATE POLICY "Staff updates orders" ON public.sale_orders FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','comercial','expedicao','financeiro']::app_role[]));
CREATE POLICY "Admin deletes orders" ON public.sale_orders FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_sale_orders_updated_at BEFORE UPDATE ON public.sale_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 11. ITENS DO PEDIDO
-- ============================================================
CREATE TABLE public.sale_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.sale_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  qty NUMERIC(12,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_pct NUMERIC(5,2) DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  cashback_generated NUMERIC(12,2) DEFAULT 0
);
CREATE INDEX idx_sale_items_order ON public.sale_order_items(order_id);
CREATE INDEX idx_sale_items_product ON public.sale_order_items(product_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_order_items TO authenticated;
GRANT ALL ON public.sale_order_items TO service_role;
ALTER TABLE public.sale_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Items read inherits order" ON public.sale_order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sale_orders o WHERE o.id = order_id));
CREATE POLICY "Items write" ON public.sale_order_items FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','comercial','expedicao']::app_role[])
    OR EXISTS (SELECT 1 FROM public.sale_orders o JOIN public.clients c ON c.id = o.client_id
               WHERE o.id = order_id AND c.user_id = auth.uid() AND o.status = 'rascunho'))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','comercial','expedicao']::app_role[])
    OR EXISTS (SELECT 1 FROM public.sale_orders o JOIN public.clients c ON c.id = o.client_id
               WHERE o.id = order_id AND c.user_id = auth.uid() AND o.status = 'rascunho'));

-- Trigger de estoque ao mudar status
CREATE OR REPLACE FUNCTION public.handle_order_stock()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_item RECORD;
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status <> 'confirmado' AND NEW.status = 'confirmado') THEN
    FOR v_item IN SELECT product_id, qty FROM public.sale_order_items WHERE order_id = NEW.id AND product_id IS NOT NULL LOOP
      UPDATE public.products SET stock_qty = stock_qty - v_item.qty::int WHERE id = v_item.product_id;
      INSERT INTO public.stock_movements (product_id, type, qty, reason, reference_id, user_id)
      VALUES (v_item.product_id, 'saida', v_item.qty::int, 'Venda pedido #' || NEW.order_number, NEW.id, NEW.user_id);
    END LOOP;
  ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'confirmado' AND NEW.status = 'cancelado') THEN
    FOR v_item IN SELECT product_id, qty FROM public.sale_order_items WHERE order_id = NEW.id AND product_id IS NOT NULL LOOP
      UPDATE public.products SET stock_qty = stock_qty + v_item.qty::int WHERE id = v_item.product_id;
      INSERT INTO public.stock_movements (product_id, type, qty, reason, reference_id, user_id)
      VALUES (v_item.product_id, 'entrada', v_item.qty::int, 'Cancelamento pedido #' || NEW.order_number, NEW.id, NEW.user_id);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_order_stock AFTER UPDATE ON public.sale_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_stock();

-- ============================================================
-- 12. ENTREGAS
-- ============================================================
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.sale_orders(id) ON DELETE CASCADE,
  deliverer_id UUID REFERENCES auth.users(id),
  pickup_at TIMESTAMPTZ, delivered_at TIMESTAMPTZ,
  receiver_name TEXT, receiver_role TEXT, receiver_phone TEXT,
  proof_photo_url TEXT, route_map_url TEXT,
  lat_delivery NUMERIC, lng_delivery NUMERIC,
  status delivery_status NOT NULL DEFAULT 'aguardando',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_deliveries_order ON public.deliveries(order_id);
CREATE INDEX idx_deliveries_deliverer ON public.deliveries(deliverer_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deliveries TO authenticated;
GRANT ALL ON public.deliveries TO service_role;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deliveries parties read" ON public.deliveries FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','expedicao','comercial','financeiro']::app_role[])
    OR deliverer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.sale_orders o JOIN public.clients c ON c.id = o.client_id
               WHERE o.id = deliveries.order_id AND c.user_id = auth.uid()));
CREATE POLICY "Staff/deliverer updates delivery" ON public.deliveries FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','expedicao']::app_role[]) OR deliverer_id = auth.uid());
CREATE POLICY "Staff inserts delivery" ON public.deliveries FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','expedicao','comercial']::app_role[]));
CREATE POLICY "Admin deletes delivery" ON public.deliveries FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- ============================================================
-- 13. BANCOS / CONTAS
-- ============================================================
CREATE TABLE public.banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bacen_code TEXT UNIQUE, name TEXT NOT NULL, logo_url TEXT
);
GRANT SELECT ON public.banks TO authenticated;
GRANT ALL ON public.banks TO service_role;
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth reads banks" ON public.banks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manages banks" ON public.banks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_id UUID REFERENCES public.banks(id),
  agency TEXT, account TEXT,
  type bank_account_type NOT NULL DEFAULT 'corrente',
  pix_key TEXT,
  balance_initial NUMERIC(14,2) DEFAULT 0,
  balance_current NUMERIC(14,2) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_accounts TO authenticated;
GRANT ALL ON public.bank_accounts TO service_role;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Financeiro reads bank_accounts" ON public.bank_accounts FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "Financeiro manages bank_accounts" ON public.bank_accounts FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

-- ============================================================
-- 14. CENTROS DE CUSTO
-- ============================================================
CREATE TABLE public.cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category cost_center_category NOT NULL,
  parent_id UUID REFERENCES public.cost_centers(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cost_centers TO authenticated;
GRANT ALL ON public.cost_centers TO service_role;
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Financeiro reads cost_centers" ON public.cost_centers FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "Financeiro manages cost_centers" ON public.cost_centers FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));

-- ============================================================
-- 15. CONTAS A RECEBER
-- ============================================================
CREATE TABLE public.receivables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.sale_orders(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  description TEXT, total NUMERIC(12,2) NOT NULL,
  installments INT DEFAULT 1, due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ, paid_value NUMERIC(12,2),
  status financial_status NOT NULL DEFAULT 'aberto',
  bank_account_id UUID REFERENCES public.bank_accounts(id),
  cost_center_id UUID REFERENCES public.cost_centers(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_receivables_client ON public.receivables(client_id);
CREATE INDEX idx_receivables_due ON public.receivables(due_date);
CREATE INDEX idx_receivables_status ON public.receivables(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.receivables TO authenticated;
GRANT ALL ON public.receivables TO service_role;
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Receivables parties read" ON public.receivables FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[])
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = receivables.client_id AND c.user_id = auth.uid()));
CREATE POLICY "Financeiro manages receivables" ON public.receivables FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE TRIGGER trg_receivables_updated_at BEFORE UPDATE ON public.receivables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 16. CONTAS A PAGAR
-- ============================================================
CREATE TABLE public.payables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  description TEXT,
  cost_center_id UUID REFERENCES public.cost_centers(id),
  total NUMERIC(12,2) NOT NULL,
  installments INT DEFAULT 1, due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ, paid_value NUMERIC(12,2),
  status financial_status NOT NULL DEFAULT 'aberto',
  bank_account_id UUID REFERENCES public.bank_accounts(id),
  is_recurring BOOLEAN DEFAULT false, recurrence_day INT,
  nf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payables_supplier ON public.payables(supplier_id);
CREATE INDEX idx_payables_due ON public.payables(due_date);
CREATE INDEX idx_payables_status ON public.payables(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payables TO authenticated;
GRANT ALL ON public.payables TO service_role;
ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Financeiro reads payables" ON public.payables FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE POLICY "Financeiro manages payables" ON public.payables FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro']::app_role[]));
CREATE TRIGGER trg_payables_updated_at BEFORE UPDATE ON public.payables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 18. CASHBACK
-- ============================================================
CREATE TABLE public.cashback_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.sale_orders(id) ON DELETE SET NULL,
  type cashback_type NOT NULL,
  value NUMERIC(12,2) NOT NULL,
  balance_after NUMERIC(12,2) NOT NULL DEFAULT 0,
  expires_at DATE, notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cashback_client ON public.cashback_transactions(client_id);
CREATE INDEX idx_cashback_created ON public.cashback_transactions(created_at DESC);
GRANT SELECT, INSERT ON public.cashback_transactions TO authenticated;
GRANT ALL ON public.cashback_transactions TO service_role;
ALTER TABLE public.cashback_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cashback parties read" ON public.cashback_transactions FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','comercial']::app_role[])
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = cashback_transactions.client_id AND c.user_id = auth.uid()));
CREATE POLICY "Staff inserts cashback" ON public.cashback_transactions FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','financeiro','comercial']::app_role[]));

CREATE OR REPLACE FUNCTION public.handle_cashback_balance()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_new_balance NUMERIC(12,2);
BEGIN
  SELECT COALESCE(cashback_balance, 0) INTO v_new_balance FROM public.clients WHERE id = NEW.client_id;
  IF NEW.type = 'credito' THEN v_new_balance := v_new_balance + NEW.value;
  ELSIF NEW.type IN ('debito','expiracao','transferencia') THEN v_new_balance := v_new_balance - NEW.value;
  END IF;
  UPDATE public.clients SET cashback_balance = v_new_balance WHERE id = NEW.client_id;
  NEW.balance_after := v_new_balance;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_cashback_balance BEFORE INSERT ON public.cashback_transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_cashback_balance();

-- ============================================================
-- AUDITORIA — habilita nas tabelas principais
-- ============================================================
SELECT public.enable_audit('clients');
SELECT public.enable_audit('products');
SELECT public.enable_audit('sale_orders');
SELECT public.enable_audit('sale_order_items');
SELECT public.enable_audit('deliveries');
SELECT public.enable_audit('receivables');
SELECT public.enable_audit('payables');
SELECT public.enable_audit('cashback_transactions');
SELECT public.enable_audit('employees');
SELECT public.enable_audit('suppliers');
SELECT public.enable_audit('user_profiles');
SELECT public.enable_audit('user_roles');
SELECT public.enable_audit('bank_accounts');
SELECT public.enable_audit('services');
