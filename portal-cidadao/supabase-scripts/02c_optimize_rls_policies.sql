-- 02c_optimize_rls_policies.sql — Otimização das policies para reduzir reavaliações por linha
-- Estratégia: usar subselects para hoistar chamadas a auth.uid() para fora do scan por linha
-- Seguro (idempotente): DROP POLICY IF EXISTS + CREATE POLICY

-- user_profiles
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON user_profiles;
CREATE POLICY "Usuários podem ver seu próprio perfil" ON user_profiles
  FOR SELECT USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Usuários podem criar seu próprio perfil" ON user_profiles;
CREATE POLICY "Usuários podem criar seu próprio perfil" ON user_profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON user_profiles;
CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON user_profiles
  FOR UPDATE USING ((SELECT auth.uid()) = id);

-- demandas
DROP POLICY IF EXISTS "Usuários autenticados podem criar demandas" ON demandas;
CREATE POLICY "Usuários autenticados podem criar demandas" ON demandas
  FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias demandas" ON demandas;
CREATE POLICY "Usuários podem atualizar suas próprias demandas" ON demandas
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

-- Observação:
-- O uso de (SELECT auth.uid()) força o planejador a calcular o valor uma única vez por comando,
-- reduzindo reavaliações por linha durante RLS (security barrier). Isso costuma eliminar o aviso
-- "Auth RLS Initialization Plan" do Security Advisor.

