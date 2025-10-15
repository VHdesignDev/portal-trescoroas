-- 06_security_advisor_fixes.sql — Ajustes sugeridos pelo Security Advisor do Supabase
-- Execute no SQL Editor. Idempotente e seguro de rodar múltiplas vezes.

-- 1) Definir search_path nas funções (evita ambiguidades)
-- Use DO blocks para só alterar se a função existir + valor como string.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.update_updated_at_column() SET search_path = ''pg_catalog, public''';
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_dashboard_stats'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.get_dashboard_stats() SET search_path = ''pg_catalog, public''';
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_dashboard_status'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.get_dashboard_status() SET search_path = ''pg_catalog, public''';
  END IF;
END$$;

-- Observação: SECURITY INVOKER é suficiente aqui.

-- 2) As demais recomendações (Leaked Password Protection, MFA) são ajustes
-- de configuração no painel do Supabase (Authentication). Não há SQL aqui.
