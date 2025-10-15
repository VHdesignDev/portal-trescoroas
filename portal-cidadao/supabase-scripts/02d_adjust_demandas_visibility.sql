-- 02d_adjust_demandas_visibility.sql — Ajusta visibilidade das demandas
-- Requisito: usuários só veem suas próprias demandas; devs e admins veem todas
-- Execute no SQL Editor do Supabase (idempotente)

-- Garantir RLS habilitado
ALTER TABLE IF EXISTS public.demandas ENABLE ROW LEVEL SECURITY;

-- 1) SELECT policies
-- Remover política antiga de visibilidade pública
DROP POLICY IF EXISTS "Demandas são visíveis para todos" ON public.demandas;

-- Usuário autenticado vê somente as próprias
DROP POLICY IF EXISTS "Usuário vê suas próprias demandas" ON public.demandas;
CREATE POLICY "Usuário vê suas próprias demandas" ON public.demandas
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- Admins/Devs veem todas
DROP POLICY IF EXISTS "Admins/Devs veem todas as demandas" ON public.demandas;
CREATE POLICY "Admins/Devs veem todas as demandas" ON public.demandas
  FOR SELECT USING (
    public.is_admin((SELECT auth.uid())) OR public.is_dev((SELECT auth.uid()))
  );

-- 2) INSERT policy (reforço para gravar o user_id do autor)
DROP POLICY IF EXISTS "Usuários autenticados podem criar demandas" ON public.demandas;
CREATE POLICY "Usuários autenticados podem criar demandas" ON public.demandas
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND user_id = (SELECT auth.uid())
  );

-- 3) Trigger para preencher user_id automaticamente quando nulo
CREATE OR REPLACE FUNCTION public.set_demanda_user_id_default()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public AS
$$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_demanda_user_id_default ON public.demandas;
CREATE TRIGGER set_demanda_user_id_default
  BEFORE INSERT ON public.demandas
  FOR EACH ROW
  EXECUTE FUNCTION public.set_demanda_user_id_default();

