-- Portal do Cidadão – Versão Temporal (histórico) para a tabela "demandas"
-- Este script cria tabela de histórico, funções e triggers idempotentes
-- para manter versões (SCD Type 2) de cada demanda: insert/update/delete.
-- Pode ser executado várias vezes com segurança.

-- 1) Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2) Tabela de histórico
CREATE TABLE IF NOT EXISTS demandas_historico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  demanda_id UUID NOT NULL,
  dados JSONB NOT NULL,                 -- snapshot completo da linha
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to   TIMESTAMPTZ,               -- NULL = versão vigente
  action TEXT NOT NULL CHECK (action IN ('insert','update','delete')),
  actor UUID                            -- quem realizou a ação (auth.uid())
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_demandas_hist_demanda_id ON demandas_historico(demanda_id);
CREATE INDEX IF NOT EXISTS idx_demandas_hist_valid_from ON demandas_historico(valid_from);
CREATE INDEX IF NOT EXISTS idx_demandas_hist_valid_to   ON demandas_historico(valid_to);
CREATE INDEX IF NOT EXISTS idx_demandas_hist_dados_gin  ON demandas_historico USING GIN(dados);

-- 3) RLS (opcional)
ALTER TABLE demandas_historico ENABLE ROW LEVEL SECURITY;

-- Visualização pública do histórico
DROP POLICY IF EXISTS "Histórico de demandas visível para todos" ON demandas_historico;
CREATE POLICY "Histórico de demandas visível para todos" ON demandas_historico
  FOR SELECT USING (true);

-- Inserções no histórico (feitas por triggers) – requer usuário autenticado
DROP POLICY IF EXISTS "Inserir histórico (autenticado)" ON demandas_historico;
CREATE POLICY "Inserir histórico (autenticado)" ON demandas_historico
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 4) Função de trigger (uma para INSERT/UPDATE/DELETE)
CREATE OR REPLACE FUNCTION log_demandas_version()
RETURNS TRIGGER AS $$
DECLARE
  v_actor UUID := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Nova versão vigente
    INSERT INTO demandas_historico (demanda_id, dados, valid_from, valid_to, action, actor)
    VALUES (NEW.id, to_jsonb(NEW), NOW(), NULL, 'insert', v_actor);
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Fechar versão vigente anterior
    UPDATE demandas_historico
      SET valid_to = NOW()
      WHERE demanda_id = OLD.id AND valid_to IS NULL;

    -- Inserir nova versão vigente
    INSERT INTO demandas_historico (demanda_id, dados, valid_from, valid_to, action, actor)
    VALUES (NEW.id, to_jsonb(NEW), NOW(), NULL, 'update', v_actor);
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    -- Fechar versão vigente anterior
    UPDATE demandas_historico
      SET valid_to = NOW()
      WHERE demanda_id = OLD.id AND valid_to IS NULL;

    -- Registrar deleção (versão encerrada imediatamente)
    INSERT INTO demandas_historico (demanda_id, dados, valid_from, valid_to, action, actor)
    VALUES (OLD.id, to_jsonb(OLD), NOW(), NOW(), 'delete', v_actor);
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 5) Triggers idempotentes em "demandas"
-- Observação: exige que a tabela "demandas" já exista
DROP TRIGGER IF EXISTS demandas_hist_ai ON demandas;
CREATE TRIGGER demandas_hist_ai
  AFTER INSERT ON demandas
  FOR EACH ROW
  EXECUTE FUNCTION log_demandas_version();

DROP TRIGGER IF EXISTS demandas_hist_bu ON demandas;
CREATE TRIGGER demandas_hist_bu
  BEFORE UPDATE ON demandas
  FOR EACH ROW
  EXECUTE FUNCTION log_demandas_version();

DROP TRIGGER IF EXISTS demandas_hist_bd ON demandas;
CREATE TRIGGER demandas_hist_bd
  BEFORE DELETE ON demandas
  FOR EACH ROW
  EXECUTE FUNCTION log_demandas_version();

-- 6) Views/Funções auxiliares
-- View: versão vigente atual de cada demanda
CREATE OR REPLACE VIEW demandas_current_versions AS
SELECT DISTINCT ON (demanda_id)
  demanda_id,
  dados,
  valid_from,
  valid_to,
  action,
  actor
FROM demandas_historico
WHERE valid_to IS NULL
ORDER BY demanda_id, valid_from DESC;

-- Função: snapshot de uma demanda em um instante específico (corrigida para PL/pgSQL)
CREATE OR REPLACE FUNCTION get_demanda_at(p_demanda_id UUID, p_at TIMESTAMPTZ)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT dados
  INTO v_result
  FROM demandas_historico
  WHERE demanda_id = p_demanda_id
    AND valid_from <= p_at
    AND (valid_to IS NULL OR p_at < valid_to)
  ORDER BY valid_from DESC
  LIMIT 1;

  RETURN v_result;
END;
$$;

-- Exemplo de uso (referência):
-- SELECT get_demanda_at('00000000-0000-0000-0000-000000000000', NOW());
-- SELECT * FROM demandas_current_versions;

