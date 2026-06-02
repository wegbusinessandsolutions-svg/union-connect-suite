
ALTER FUNCTION public.enable_audit(TEXT) SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.enable_audit(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_trigger_func() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
