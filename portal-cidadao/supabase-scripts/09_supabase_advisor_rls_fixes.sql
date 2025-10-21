-- 09_supabase_advisor_rls_fixes.sql — Resolve avisos do Supabase Security Advisor
-- Objetivo: (1) eliminar "Auth RLS Initialization Plan" trocando auth.uid() por (SELECT auth.uid()) em policies
--           (2) reduzir "Multiple Permissive Policies" consolidando policies redundantes em demandas
-- Seguro para executar várias vezes (idempotente)

-- =========================
-- user_profiles
-- =========================
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.user_profiles;
CREATE POLICY "Usuários podem ver seu próprio perfil" ON public.user_profiles
  FOR SELECT USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Usuários podem criar seu próprio perfil" ON public.user_profiles;
CREATE POLICY "Usuários podem criar seu próprio perfil" ON public.user_profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.user_profiles;
CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON public.user_profiles
  FOR UPDATE USING ((SELECT auth.uid()) = id);

-- =========================
-- admin_users (admins/devs)
-- =========================
DROP POLICY IF EXISTS "Admins podem ver admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins/Devs podem ver admin_users" ON public.admin_users;
CREATE POLICY "Admins/Devs podem ver admin_users" ON public.admin_users
  FOR SELECT USING (
    public.is_admin((SELECT auth.uid())) OR public.is_dev((SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Admins podem inserir admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Devs podem inserir admin_users" ON public.admin_users;
CREATE POLICY "Devs podem inserir admin_users" ON public.admin_users
  FOR INSERT WITH CHECK (public.is_dev((SELECT auth.uid())));

DROP POLICY IF EXISTS "Admins podem apagar admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Devs podem apagar admin_users" ON public.admin_users;
CREATE POLICY "Devs podem apagar admin_users" ON public.admin_users
  FOR DELETE USING (public.is_dev((SELECT auth.uid())));

-- =========================
-- dev_users (somente dev gerencia)
-- =========================
DROP POLICY IF EXISTS "Devs podem ver dev_users" ON public.dev_users;
CREATE POLICY "Devs podem ver dev_users" ON public.dev_users
  FOR SELECT USING (public.is_dev((SELECT auth.uid())));

DROP POLICY IF EXISTS "Devs podem inserir dev_users" ON public.dev_users;
CREATE POLICY "Devs podem inserir dev_users" ON public.dev_users
  FOR INSERT WITH CHECK (public.is_dev((SELECT auth.uid())));

DROP POLICY IF EXISTS "Devs podem apagar dev_users" ON public.dev_users;
CREATE POLICY "Devs podem apagar dev_users" ON public.dev_users
  FOR DELETE USING (public.is_dev((SELECT auth.uid())));

-- =========================
-- demandas (consolidar SELECT/UPDATE e otimizar auth.uid())
-- =========================
-- Remover possíveis versões antigas para evitar múltiplas permissive policies
DROP POLICY IF EXISTS "Demandas são visíveis para todos" ON public.demandas;
DROP POLICY IF EXISTS "Usuário vê suas próprias demandas" ON public.demandas;
DROP POLICY IF EXISTS "Admins/Devs veem todas as demandas" ON public.demandas;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias demandas" ON public.demandas;
DROP POLICY IF EXISTS "Admins/Devs podem atualizar quaisquer demandas" ON public.demandas;

-- SELECT: dono ou admin/dev
DROP POLICY IF EXISTS "Demandas: selecionar (dono ou admin/dev)" ON public.demandas;
CREATE POLICY "Demandas: selecionar (dono ou admin/dev)" ON public.demandas
  FOR SELECT USING (
    user_id = (SELECT auth.uid())
    OR public.is_admin((SELECT auth.uid()))
    OR public.is_dev((SELECT auth.uid()))
  );

-- UPDATE: dono ou admin/dev
DROP POLICY IF EXISTS "Demandas: atualizar (dono ou admin/dev)" ON public.demandas;
CREATE POLICY "Demandas: atualizar (dono ou admin/dev)" ON public.demandas
  FOR UPDATE USING (
    user_id = (SELECT auth.uid())
    OR public.is_admin((SELECT auth.uid()))
    OR public.is_dev((SELECT auth.uid()))
  );

-- INSERT: reforçar checagem (mantém a política existente mas garante igualdade do autor)
DROP POLICY IF EXISTS "Usuários autenticados podem criar demandas" ON public.demandas;
CREATE POLICY "Usuários autenticados podem criar demandas" ON public.demandas
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND user_id = (SELECT auth.uid())
  );

-- Fim

