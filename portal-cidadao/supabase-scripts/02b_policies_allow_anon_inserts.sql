-- 02b_policies_allow_anon_inserts.sql — Permitir criação de demandas por usuários anônimos (opcional)

-- Mantém as políticas existentes e adiciona uma nova para papel 'anon'.
-- As políticas em Supabase são combinadas por OR, então qualquer uma que
-- satisfizer o WITH CHECK permitirá o INSERT.

DROP POLICY IF EXISTS "Anônimos podem criar demandas" ON demandas;
CREATE POLICY "Anônimos podem criar demandas" ON demandas
  FOR INSERT WITH CHECK (auth.role() = 'anon');

