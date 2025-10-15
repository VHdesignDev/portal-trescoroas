-- 05_seeds.sql — Dados iniciais (idempotente)

-- Categorias padrão (upsert por nome)
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

