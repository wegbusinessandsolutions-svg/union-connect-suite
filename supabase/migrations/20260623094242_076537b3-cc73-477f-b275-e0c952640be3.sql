
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_meta  jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_name  text  := COALESCE(v_meta->>'name', NEW.email);
  v_phone text  := v_meta->>'phone';
  v_type  text  := LOWER(COALESCE(v_meta->>'type', 'pf'));
  v_cpf_cnpj text := v_meta->>'cpf_cnpj';
  v_addr_zip text := v_meta->>'address_zip';
  v_addr_street text := v_meta->>'address_street';
  v_addr_number text := v_meta->>'address_number';
  v_addr_complement text := v_meta->>'address_complement';
  v_addr_district text := v_meta->>'address_district';
  v_addr_city text := v_meta->>'address_city';
  v_addr_state text := v_meta->>'address_state';
  v_resp_name text := v_meta->>'resp1_name';
  v_resp_cpf  text := v_meta->>'resp1_cpf';
  v_resp_phone text := v_meta->>'resp1_phone';
  v_resp_email text := v_meta->>'resp1_email';
BEGIN
  IF v_type NOT IN ('pf','pj') THEN v_type := 'pf'; END IF;

  INSERT INTO public.user_profiles (id, name, email, phone)
  VALUES (NEW.id, v_name, NEW.email, v_phone)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'cliente')
  ON CONFLICT (user_id, role) DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM public.clients WHERE user_id = NEW.id) THEN
    INSERT INTO public.clients (
      user_id, type, name, email, phone,
      cpf_cnpj,
      address_zip, address_street, address_number, address_complement,
      address_district, address_city, address_state,
      resp1_name, resp1_cpf, resp1_phone, resp1_email
    )
    VALUES (
      NEW.id, v_type::client_type, v_name, NEW.email, v_phone,
      NULLIF(v_cpf_cnpj,''),
      NULLIF(v_addr_zip,''), NULLIF(v_addr_street,''), NULLIF(v_addr_number,''), NULLIF(v_addr_complement,''),
      NULLIF(v_addr_district,''), NULLIF(v_addr_city,''), NULLIF(v_addr_state,''),
      NULLIF(v_resp_name,''), NULLIF(v_resp_cpf,''), NULLIF(v_resp_phone,''), NULLIF(v_resp_email,'')
    );
  END IF;

  RETURN NEW;
END;
$function$;
