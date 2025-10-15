-- 07_admin_roles.sql — Infra para aprovar administradores com segurança
-- Cria tabela de admins + função is_admin(uid) para checagens no app e nas RLS
-- Execute no SQL Editor do Supabase (idempotente)

-- 1) Tabela de administradores (somente lista de user_ids)
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 2) Funções primeiro (para evitar erro de referência nas policies)
-- Função utilitária para checar se um usuário é admin
-- SECURITY DEFINER para contornar RLS de admin_users durante a checagem
-- search_path seguro evita hijacking
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public AS
$$
  SELECT EXISTS(
    SELECT 1 FROM public.admin_users au WHERE au.user_id = uid
  );
$$;

-- Overload sem argumentos para compatibilidade com RPC do Supabase
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public AS
$$
  SELECT public.is_admin(auth.uid());
$$;

-- Permissões: permitir que todos executem as funções de checagem
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO PUBLIC;

-- 3) Policies (agora que as funções existem)
DROP POLICY IF EXISTS "Admins podem ver admin_users" ON public.admin_users;
CREATE POLICY "Admins podem ver admin_users" ON public.admin_users
  FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins podem inserir admin_users" ON public.admin_users;
CREATE POLICY "Admins podem inserir admin_users" ON public.admin_users
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins podem apagar admin_users" ON public.admin_users;
CREATE POLICY "Admins podem apagar admin_users" ON public.admin_users
  FOR DELETE USING (is_admin(auth.uid()));

-- Dica de uso (SQL, manual no painel) para aprovar um admin por e-mail:
-- INSERT INTO public.admin_users(user_id)
--   SELECT id FROM auth.users WHERE email = 'email-do-admin@exemplo.com';
-- Para revogar:
-- DELETE FROM public.admin_users
--   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'email-do-admin@exemplo.com');
