-- 03_functions_triggers.sql — Funções e gatilhos (idempotente)

-- Função para manter updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar triggers (idempotente)
DROP TRIGGER IF EXISTS update_demandas_updated_at ON demandas;
CREATE TRIGGER update_demandas_updated_at
  BEFORE UPDATE ON demandas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função de estatísticas do dashboard
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_demandas', (SELECT COUNT(*) FROM demandas),
    'demandas_abertas', (SELECT COUNT(*) FROM demandas WHERE status = 'aberta'),
    'demandas_em_andamento', (SELECT COUNT(*) FROM demandas WHERE status = 'em_andamento'),
    'demandas_resolvidas', (SELECT COUNT(*) FROM demandas WHERE status = 'resolvida'),
    'tempo_medio_resolucao', (
      SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (data_resolucao - data_criacao)) / 86400), 0)
      FROM demandas
      WHERE status = 'resolvida' AND data_resolucao IS NOT NULL
    ),
    'demandas_por_categoria', (
      SELECT json_agg(json_build_object('categoria', categoria, 'count', count))
      FROM (
        SELECT categoria, COUNT(*) AS count
        FROM demandas
        GROUP BY categoria
        ORDER BY count DESC
      ) t
    ),
    'evolucao_mensal', (
      SELECT json_agg(json_build_object(
        'mes', to_char(mes, 'YYYY-MM'),
        'abertas', abertas,
        'resolvidas', resolvidas
      ))
      FROM (
        SELECT
          date_trunc('month', data_criacao) AS mes,
          COUNT(*) AS abertas,
          COUNT(CASE WHEN status = 'resolvida' THEN 1 END) AS resolvidas
        FROM demandas
        WHERE data_criacao >= NOW() - INTERVAL '12 months'
        GROUP BY date_trunc('month', data_criacao)
        ORDER BY mes
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

