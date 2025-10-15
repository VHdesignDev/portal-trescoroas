-- Configuração do Storage para o Portal do Cidadão

-- Criar bucket para fotos das demandas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fotos',
  'fotos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir upload público de fotos
CREATE POLICY "Qualquer um pode fazer upload de fotos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'fotos');

-- Política para permitir leitura pública de fotos
CREATE POLICY "Fotos são visíveis para todos" ON storage.objects
  FOR SELECT USING (bucket_id = 'fotos');

-- Política para permitir atualização de fotos (opcional)
CREATE POLICY "Qualquer um pode atualizar fotos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'fotos');

-- Política para permitir exclusão de fotos (opcional)
CREATE POLICY "Qualquer um pode deletar fotos" ON storage.objects
  FOR DELETE USING (bucket_id = 'fotos');
