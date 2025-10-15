-- 04_storage.sql — Bucket e políticas do Storage (idempotente)

-- Criar bucket público para fotos (ignorar erro se já existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fotos',
  'fotos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Leitura pública de fotos" ON storage.objects;
CREATE POLICY "Leitura pública de fotos" ON storage.objects
  FOR SELECT USING (bucket_id = 'fotos');

-- Caso queira permitir upload direto do cliente autenticado:
DROP POLICY IF EXISTS "Upload por autenticados" ON storage.objects;
CREATE POLICY "Upload por autenticados" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'fotos' AND auth.role() = 'authenticated'
  );

-- Observação: O app já faz upload via rota /api/upload-foto usando service role,
-- então estas políticas são complementares (não obrigatórias para o fluxo atual).

