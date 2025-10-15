-- Criação das tabelas para o Portal do Cidadão

-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de categorias
CREATE TABLE categorias (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  icone VARCHAR(50) NOT NULL,
  cor VARCHAR(7) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de bairros
CREATE TABLE bairros (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  cidade VARCHAR(100) DEFAULT 'Três Coroas',
  estado VARCHAR(2) DEFAULT 'RS',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de perfis de usuários (estende auth.users)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  telefone VARCHAR(20),
  endereco TEXT NOT NULL,
  bairro_id UUID REFERENCES bairros(id),
  cep VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

-- Adicionar coluna de bairro em texto livre para perfis de usuários
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bairro_text TEXT;

);

-- Tabela de demandas
CREATE TABLE demandas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  foto_url TEXT,
  categoria VARCHAR(100) NOT NULL,
  descricao TEXT,
  localizacao JSONB NOT NULL,
  endereco TEXT, -- Endereço legível obtido via geocoding reverso
  bairro VARCHAR(100), -- Bairro extraído do endereço
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_resolucao TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_andamento', 'resolvida')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_demandas_status ON demandas(status);
CREATE INDEX idx_demandas_categoria ON demandas(categoria);
CREATE INDEX idx_demandas_data_criacao ON demandas(data_criacao);
CREATE INDEX idx_demandas_localizacao ON demandas USING GIN(localizacao);
CREATE INDEX idx_demandas_bairro ON demandas(bairro);
CREATE INDEX idx_demandas_user_id ON demandas(user_id);
CREATE INDEX idx_user_profiles_bairro_id ON user_profiles(bairro_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_demandas_updated_at
    BEFORE UPDATE ON demandas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir bairros padrão (Três Coroas - RS)
INSERT INTO bairros (nome) VALUES
('Centro'),
('Bairro Aliança'),
('Bairro Bela Vista'),
('Bairro Boa Vista'),
('Bairro Canudos'),
('Bairro Esperança'),
('Bairro Figueira'),
('Bairro Industrial'),
('Bairro Jardim'),
('Bairro Morada do Vale'),
('Bairro Navegantes'),
('Bairro Novo'),
('Bairro Operário'),
('Bairro Parque das Hortênsias'),
('Bairro Planalto'),
('Bairro Progresso'),
('Bairro Recanto'),
('Bairro Residencial'),
('Bairro Rio Branco'),
('Bairro Santa Catarina'),
('Bairro Santa Rita'),
('Bairro São José'),
('Bairro São Luiz'),
('Bairro União'),
('Bairro Vila Nova'),
('Loteamento Alpes de Três Coroas'),
('Loteamento Bosque das Hortênsias'),
('Loteamento Colinas'),
('Loteamento Morada dos Pássaros'),
('Loteamento Parque dos Eucaliptos'),
('Loteamento Recanto Verde'),
('Loteamento Residencial Gramado'),
('Loteamento Vale das Hortênsias'),
('Loteamento Vila Germânica'),
('Distrito de Linha Nova'),
('Distrito de Morro Calçado'),
('Localidade de Arroio do Ouro'),
('Localidade de Fazenda Fialho'),
('Localidade de Linha Araripe'),
('Localidade de Linha Bonita'),
('Localidade de Linha Brasil'),
('Localidade de Linha Comprida'),
('Localidade de Linha Eugênia'),
('Localidade de Linha Formosa'),
('Localidade de Linha Glória'),
('Localidade de Linha Palmeira'),
('Localidade de Linha Pinhal'),
('Localidade de Linha São João'),
('Localidade de Morro da Cruz'),
('Localidade de Picada Scherer'),
('Localidade de Rincão dos Kroeff'),
('Localidade de Vila Muller');

-- Inserir categorias padrão
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
('Outros', 'help-circle', '#808080');

-- RLS (Row Level Security) - controle de acesso
ALTER TABLE demandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bairros ENABLE ROW LEVEL SECURITY;

-- Políticas para demandas
CREATE POLICY "Demandas são visíveis para todos" ON demandas
    FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem criar demandas" ON demandas
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem atualizar suas próprias demandas" ON demandas
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para categorias
CREATE POLICY "Categorias são visíveis para todos" ON categorias
    FOR SELECT USING (true);

-- Políticas para bairros
CREATE POLICY "Bairros são visíveis para todos" ON bairros
    FOR SELECT USING (true);

-- Políticas para perfis de usuários
CREATE POLICY "Usuários podem ver seu próprio perfil" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários podem criar seu próprio perfil" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Função para calcular estatísticas do dashboard
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
            SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (data_resolucao - data_criacao))/86400), 0)
            FROM demandas
            WHERE status = 'resolvida' AND data_resolucao IS NOT NULL
        ),
        'demandas_por_categoria', (
            SELECT json_agg(json_build_object('categoria', categoria, 'count', count))
            FROM (
                SELECT categoria, COUNT(*) as count
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
                    date_trunc('month', data_criacao) as mes,
                    COUNT(*) as abertas,
                    COUNT(CASE WHEN status = 'resolvida' THEN 1 END) as resolvidas
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
