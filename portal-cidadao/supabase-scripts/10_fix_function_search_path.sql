-- 10_fix_function_search_path.sql — Corrige avisos de Function Search Path Mutable
-- Define search_path seguro para funções públicas usadas por triggers e API
-- Idempotente (usa DO + IF EXISTS)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.update_updated_at_column() SET search_path = ''pg_catalog, public''';
    -- Opcionalmente, reforçar invocador explícito
    EXECUTE 'ALTER FUNCTION public.update_updated_at_column() SECURITY INVOKER';
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_dashboard_stats'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.get_dashboard_stats() SET search_path = ''pg_catalog, public''';
    EXECUTE 'ALTER FUNCTION public.get_dashboard_stats() SECURITY INVOKER';
  END IF;
END$$;

