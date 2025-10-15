-- Portal do Cidadão – Migração para usar Bairro como texto livre (sem tabela de bairros)
-- Execute este script no Supabase (SQL Editor). Seguro para rodar múltiplas vezes.

-- 1) Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2) Limpeza/compatibilidade com versões antigas (remover dependências de bairros)
ALTER TABLE IF EXISTS user_profiles DROP CONSTRAINT IF EXISTS user_profiles_bairro_id_fkey;
DROP INDEX IF EXISTS idx_user_profiles_bairro_id;
ALTER TABLE IF EXISTS user_profiles DROP COLUMN IF EXISTS bairro_id;
DROP TABLE IF EXISTS bairros CASCADE;

-- 3) Tabelas principais
-- Categorias
CREATE TABLE IF NOT EXISTS categorias (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  icone VARCHAR(50) NOT NULL,
  cor VARCHAR(7) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Perfis de usuário (estende auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  telefone VARCHAR(20),
  endereco TEXT NOT NULL,
  bairro_text TEXT,
  cep VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garantir coluna bairro_text (idempotente)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bairro_text TEXT;

-- Demandas
CREATE TABLE IF NOT EXISTS demandas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  foto_url TEXT,
  categoria VARCHAR(100) NOT NULL,
  descricao TEXT,
  localizacao JSONB NOT NULL,
  endereco TEXT,               -- Endereço legível (geocoding reverso)
  bairro VARCHAR(100),         -- Bairro extraído ou informado
  data_criacao TIMESTAMPTZ DEFAULT NOW(),
  data_resolucao TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'aberta' CHECK (status IN ('aberta','em_andamento','resolvida')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garantir colunas em demandas (idempotente)
ALTER TABLE IF EXISTS demandas ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE IF EXISTS demandas ADD COLUMN IF NOT EXISTS endereco TEXT;
ALTER TABLE IF EXISTS demandas ADD COLUMN IF NOT EXISTS bairro VARCHAR(100);

-- Garantir FK de user_id -> auth.users(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'demandas_user_id_fkey' AND table_name = 'demandas'
  ) THEN
    ALTER TABLE demandas
      ADD CONSTRAINT demandas_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;


-- 4) Índices
CREATE INDEX IF NOT EXISTS idx_demandas_status ON demandas(status);
CREATE INDEX IF NOT EXISTS idx_demandas_categoria ON demandas(categoria);
CREATE INDEX IF NOT EXISTS idx_demandas_data_criacao ON demandas(data_criacao);
CREATE INDEX IF NOT EXISTS idx_demandas_localizacao ON demandas USING GIN(localizacao);
CREATE INDEX IF NOT EXISTS idx_demandas_bairro ON demandas(bairro);
CREATE INDEX IF NOT EXISTS idx_demandas_user_id ON demandas(user_id);

-- 5) Função e triggers de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers (recriar de forma idempotente)
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

-- 6) Seeds de categorias (upsert por nome)
INSERT INTO categorias (nome, icone, cor) VALUES
  ('Lâmpada Queimada', 'lightbulb', '#FFA500'),
  ('Buraco na Rua', 'construction', '#8B4513'),
  ('Lixo Acumulado', 'trash-2', '#228B22'),
  ('Semáforo com Defeito', 'traffic-light', '#FF0000'),
  ('Calçada Danificada', 'road', '#696969'),
  ('Árvore Caída', 'tree-pine', '#006400'),
  ('Vazamento de Água', 'droplets', '#0000FF'),
  ('Ponto de Ônibus Danificado', 'bus', '#800080'),
  ('Grafite/Pichação', 'spray-can', '#FF1493'),
  ('Outros', 'help-circle', '#808080')
ON CONFLICT (nome) DO NOTHING;

-- 7) RLS (Row Level Security)
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandas ENABLE ROW LEVEL SECURITY;

-- Políticas para categorias
DROP POLICY IF EXISTS "Categorias são visíveis para todos" ON categorias;
CREATE POLICY "Categorias são visíveis para todos" ON categorias
  FOR SELECT USING (true);

-- Políticas para perfis de usuários
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON user_profiles;
CREATE POLICY "Usuários podem ver seu próprio perfil" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem criar seu próprio perfil" ON user_profiles;
CREATE POLICY "Usuários podem criar seu próprio perfil" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON user_profiles;
CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para demandas
DROP POLICY IF EXISTS "Demandas são visíveis para todos" ON demandas;
CREATE POLICY "Demandas são visíveis para todos" ON demandas
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuários autenticados podem criar demandas" ON demandas;
CREATE POLICY "Usuários autenticados podem criar demandas" ON demandas
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias demandas" ON demandas;
CREATE POLICY "Usuários podem atualizar suas próprias demandas" ON demandas
  FOR UPDATE USING (auth.uid() = user_id);

-- 8) Função de estatísticas do dashboard
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

-- 9) (Opcional) Storage – bucket de fotos e políticas
-- Descomente esta seção se ainda não executou o arquivo de storage separado.
-- INSERT INTO storage.buckets (id, name, public) VALUES ('fotos','fotos', true)
--   ON CONFLICT (id) DO NOTHING;
--
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
--
-- DROP POLICY IF EXISTS "Leitura pública de fotos" ON storage.objects;
-- CREATE POLICY "Leitura pública de fotos" ON storage.objects
--   FOR SELECT USING (bucket_id = 'fotos');
--
-- DROP POLICY IF EXISTS "Upload por usuários autenticados" ON storage.objects;
-- CREATE POLICY "Upload por usuários autenticados" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'fotos' AND auth.role() = 'authenticated'
--   );
--
-- DROP POLICY IF EXISTS "Atualizar/Excluir o que enviou" ON storage.objects;
-- CREATE POLICY "Atualizar/Excluir o que enviou" ON storage.objects
--   FOR UPDATE USING (
--     bucket_id = 'fotos' AND auth.uid() = owner
--   )
--   WITH CHECK (
--     bucket_id = 'fotos' AND auth.uid() = owner
--   );

