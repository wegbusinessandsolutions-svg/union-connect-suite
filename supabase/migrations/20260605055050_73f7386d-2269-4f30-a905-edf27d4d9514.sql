CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_name  text := COALESCE(NEW.raw_user_meta_data->>'name', NEW.email);
  v_phone text := NEW.raw_user_meta_data->>'phone';
  v_type  text := LOWER(COALESCE(NEW.raw_user_meta_data->>'type', 'pf'));
BEGIN
  IF v_type NOT IN ('pf','pj') THEN
    v_type := 'pf';
  END IF;

  INSERT INTO public.user_profiles (id, name, email, phone)
  VALUES (NEW.id, v_name, NEW.email, v_phone)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'cliente')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Cria o cliente no CRM com o tipo escolhido na tela de cadastro.
  IF NOT EXISTS (SELECT 1 FROM public.clients WHERE user_id = NEW.id) THEN
    INSERT INTO public.clients (user_id, type, name, email, phone)
    VALUES (NEW.id, v_type::client_type, v_name, NEW.email, v_phone);
  END IF;

  RETURN NEW;
END;
$function$;