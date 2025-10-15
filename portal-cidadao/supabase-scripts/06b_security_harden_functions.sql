-- 06b_security_harden_functions.sql — Endurecimento de funções
-- Corrige os avisos do Security Advisor: "role mutable search_path"
-- Estratégia: fixar search_path e explicitar SECURITY INVOKER
-- Seguro para rodar múltiplas vezes (usa DO ... IF EXISTS)

-- update_updated_at_column()
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.update_updated_at_column() SET search_path = ''pg_catalog, public''';
    EXECUTE 'ALTER FUNCTION public.update_updated_at_column() SECURITY INVOKER';
  END IF;
END$$;

-- get_dashboard_stats()
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_dashboard_stats'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.get_dashboard_stats() SET search_path = ''pg_catalog, public''';
    EXECUTE 'ALTER FUNCTION public.get_dashboard_stats() SECURITY INVOKER';
  END IF;
END$$;

-- Caso exista a variação get_dashboard_status()
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_dashboard_status'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.get_dashboard_status() SET search_path = ''pg_catalog, public''';
    EXECUTE 'ALTER FUNCTION public.get_dashboard_status() SECURITY INVOKER';
  END IF;
END$$;

-- Observações
-- 1) search_path como string: ''pg_catalog, public''. pg_catalog primeiro evita hijacking de funções do sistema.
-- 2) SECURITY INVOKER é suficiente aqui.
-- 3) Mantenha objetos referenciados com schema se não estiverem em public.
