-- 01_schema.sql — Esquema principal (idempotente)
-- Execute no Supabase SQL Editor

-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categorias (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  icone VARCHAR(50) NOT NULL,
  cor VARCHAR(7) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de perfis de usuários (estende auth.users)
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

-- Garantias idempotentes
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bairro_text TEXT;

-- Tabela de demandas
CREATE TABLE IF NOT EXISTS demandas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  foto_url TEXT,
  categoria VARCHAR(100) NOT NULL,
  descricao TEXT,
  localizacao JSONB NOT NULL,
  endereco TEXT,
  bairro VARCHAR(100),
  data_criacao TIMESTAMPTZ DEFAULT NOW(),
  data_resolucao TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'aberta' CHECK (status IN ('aberta','em_andamento','resolvida')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garantir colunas (executa sem erro se já existirem)
ALTER TABLE IF EXISTS demandas ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE IF EXISTS demandas ADD COLUMN IF NOT EXISTS endereco TEXT;
ALTER TABLE IF EXISTS demandas ADD COLUMN IF NOT EXISTS bairro VARCHAR(100);

-- Índices
CREATE INDEX IF NOT EXISTS idx_demandas_status ON demandas(status);
CREATE INDEX IF NOT EXISTS idx_demandas_categoria ON demandas(categoria);
CREATE INDEX IF NOT EXISTS idx_demandas_data_criacao ON demandas(data_criacao);
CREATE INDEX IF NOT EXISTS idx_demandas_localizacao ON demandas USING GIN(localizacao);
CREATE INDEX IF NOT EXISTS idx_demandas_bairro ON demandas(bairro);
CREATE INDEX IF NOT EXISTS idx_demandas_user_id ON demandas(user_id);

