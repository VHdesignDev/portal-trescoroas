-- 02_policies.sql — RLS e políticas (idempotente)

-- Habilitar RLS
ALTER TABLE IF EXISTS categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS demandas ENABLE ROW LEVEL SECURITY;

-- Categorias: leitura pública
DROP POLICY IF EXISTS "Categorias são visíveis para todos" ON categorias;
CREATE POLICY "Categorias são visíveis para todos" ON categorias
  FOR SELECT USING (true);

-- Perfis de usuário
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON user_profiles;
CREATE POLICY "Usuários podem ver seu próprio perfil" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem criar seu próprio perfil" ON user_profiles;
CREATE POLICY "Usuários podem criar seu próprio perfil" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON user_profiles;
CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Demandas (visibilidade restrita: próprio autor; admins/devs veem todas)
DROP POLICY IF EXISTS "Demandas são visíveis para todos" ON demandas;
DROP POLICY IF EXISTS "Usuário vê suas próprias demandas" ON demandas;
CREATE POLICY "Usuário vê suas próprias demandas" ON demandas
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins/Devs veem todas as demandas" ON demandas;
CREATE POLICY "Admins/Devs veem todas as demandas" ON demandas
  FOR SELECT USING (public.is_admin((SELECT auth.uid())) OR public.is_dev((SELECT auth.uid())));

DROP POLICY IF EXISTS "Usuários autenticados podem criar demandas" ON demandas;
CREATE POLICY "Usuários autenticados podem criar demandas" ON demandas
  FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias demandas" ON demandas;
CREATE POLICY "Usuários podem atualizar suas próprias demandas" ON demandas
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

