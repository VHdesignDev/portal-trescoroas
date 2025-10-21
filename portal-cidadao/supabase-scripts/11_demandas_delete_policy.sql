-- Demandas: permitir exclusão para administradores e desenvolvedores
-- Idempotente: remove a policy se existir e recria

DROP POLICY IF EXISTS "Demandas: deletar (admin/dev)" ON public.demandas;
CREATE POLICY "Demandas: deletar (admin/dev)"
ON public.demandas
FOR DELETE
USING (
  public.is_admin((SELECT auth.uid()))
  OR public.is_dev((SELECT auth.uid()))
);

