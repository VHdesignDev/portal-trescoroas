-- Configuração do Storage para uploads de fotos da demanda
-- - Cria (se não existir) o bucket 'fotos' como público para leitura
-- - Políticas RLS: leitura pública, upload por usuários autenticados

-- 1) Criar bucket se não existir (público)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'fotos') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('fotos', 'fotos', true);
  ELSE
    -- garantir que continua público
    UPDATE storage.buckets SET public = true WHERE id = 'fotos' AND public IS DISTINCT FROM true;
  END IF;
END$$;

-- 2) Habilitar RLS (já é habilitado por padrão em storage.objects, mas garantimos)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3) Políticas (idempotentes)
--   3.1 Leitura pública do bucket 'fotos'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'fotos select public'
  ) THEN
    CREATE POLICY "fotos select public" ON storage.objects
      FOR SELECT USING (bucket_id = 'fotos');
  END IF;
END $$;

--   3.2 Upload por usuários autenticados no bucket 'fotos'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'fotos insert authenticated'
  ) THEN
    CREATE POLICY "fotos insert authenticated" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'fotos');
  END IF;
END $$;

-- (Opcional) permitir atualização/exclusão somente para administradores ou manter bloqueado
-- Caso precise, crie políticas adicionais para UPDATE/DELETE.

-- 4) Índice útil (já existe por padrão, mas não custa garantir busca por bucket)
CREATE INDEX IF NOT EXISTS objects_bucket_id_idx ON storage.objects (bucket_id);

