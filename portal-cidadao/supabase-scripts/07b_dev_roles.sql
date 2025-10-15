-- 07b_dev_roles.sql — Cria papel de desenvolvedor (dev) e ajusta policies
-- Execute no SQL Editor do Supabase (idempotente)

-- Tabela de desenvolvedores
CREATE TABLE IF NOT EXISTS public.dev_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.dev_users ENABLE ROW LEVEL SECURITY;

-- Funções is_dev
CREATE OR REPLACE FUNCTION public.is_dev(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public AS
$$ SELECT EXISTS(SELECT 1 FROM public.dev_users du WHERE du.user_id = uid); $$;

CREATE OR REPLACE FUNCTION public.is_dev()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public AS
$$ SELECT public.is_dev(auth.uid()); $$;

REVOKE ALL ON FUNCTION public.is_dev(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_dev() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_dev(uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_dev() TO PUBLIC;

-- Policies de dev_users (somente dev pode gerenciar)
DROP POLICY IF EXISTS "Devs podem ver dev_users" ON public.dev_users;
CREATE POLICY "Devs podem ver dev_users" ON public.dev_users
  FOR SELECT USING (is_dev(auth.uid()));

DROP POLICY IF EXISTS "Devs podem inserir dev_users" ON public.dev_users;
CREATE POLICY "Devs podem inserir dev_users" ON public.dev_users
  FOR INSERT WITH CHECK (is_dev(auth.uid()));

DROP POLICY IF EXISTS "Devs podem apagar dev_users" ON public.dev_users;
CREATE POLICY "Devs podem apagar dev_users" ON public.dev_users
  FOR DELETE USING (is_dev(auth.uid()));

-- Ajustes nas policies de admin_users: somente dev insere/apaga; admin pode visualizar
-- Tornar idempotente: derruba tanto as antigas quanto as atuais
DROP POLICY IF EXISTS "Admins podem ver admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins/Devs podem ver admin_users" ON public.admin_users;
CREATE POLICY "Admins/Devs podem ver admin_users" ON public.admin_users
  FOR SELECT USING (is_admin(auth.uid()) OR is_dev(auth.uid()));

DROP POLICY IF EXISTS "Admins podem inserir admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Devs podem inserir admin_users" ON public.admin_users;
CREATE POLICY "Devs podem inserir admin_users" ON public.admin_users
  FOR INSERT WITH CHECK (is_dev(auth.uid()));

DROP POLICY IF EXISTS "Admins podem apagar admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Devs podem apagar admin_users" ON public.admin_users;
CREATE POLICY "Devs podem apagar admin_users" ON public.admin_users
  FOR DELETE USING (is_dev(auth.uid()));

-- Demandas: permitir que admins e devs atualizem qualquer demanda (além do dono)
DROP POLICY IF EXISTS "Admins/Devs podem atualizar quaisquer demandas" ON public.demandas;
CREATE POLICY "Admins/Devs podem atualizar quaisquer demandas" ON public.demandas
  FOR UPDATE USING (is_admin(auth.uid()) OR is_dev(auth.uid()));

