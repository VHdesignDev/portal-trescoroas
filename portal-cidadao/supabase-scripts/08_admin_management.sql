-- 08_admin_management.sql — Funções RPC para listar usuários e gerenciar admins
-- Execute no SQL Editor do Supabase. Idempotente.

-- LISTAR USUÁRIOS (com nome do perfil, se existir)
-- Restrito a DEV via checagem is_dev(auth.uid())
CREATE OR REPLACE FUNCTION public.list_users(search text DEFAULT NULL, limit_count int DEFAULT 50)
RETURNS TABLE (id uuid, email text, created_at timestamptz, nome text)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public AS
$$
BEGIN
  IF NOT public.is_dev(auth.uid()) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  RETURN QUERY
  SELECT u.id, u.email, u.created_at, up.nome
  FROM auth.users u
  LEFT JOIN public.user_profiles up ON up.id = u.id
  WHERE (search IS NULL
         OR u.email ILIKE '%' || search || '%'
         OR COALESCE(up.nome,'') ILIKE '%' || search || '%')
  ORDER BY u.created_at DESC
  LIMIT COALESCE(limit_count, 50);
END;
$$;

REVOKE ALL ON FUNCTION public.list_users(text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_users(text, int) TO PUBLIC;

-- LISTAR ADMINS (com e-mail e nome)
CREATE OR REPLACE FUNCTION public.list_admins()
RETURNS TABLE (id uuid, email text, created_at timestamptz, nome text)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public AS
$$
BEGIN
  IF NOT (public.is_admin(auth.uid()) OR public.is_dev(auth.uid())) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  RETURN QUERY
  SELECT u.id, u.email, u.created_at, up.nome
  FROM public.admin_users au
  JOIN auth.users u ON u.id = au.user_id
  LEFT JOIN public.user_profiles up ON up.id = u.id
  ORDER BY u.email ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.list_admins() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_admins() TO PUBLIC;

-- ADICIONAR ADMIN POR E-MAIL (somente DEV)
CREATE OR REPLACE FUNCTION public.add_admin_by_email(email text)
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = pg_catalog, public AS
$$
DECLARE
  uid uuid;
BEGIN
  IF NOT public.is_dev(auth.uid()) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  SELECT id INTO uid FROM auth.users WHERE lower(auth.users.email) = lower(add_admin_by_email.email);
  IF uid IS NULL THEN
    RAISE EXCEPTION 'user not found';
  END IF;

  INSERT INTO public.admin_users(user_id)
  VALUES (uid)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.add_admin_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_admin_by_email(text) TO PUBLIC;

-- REMOVER ADMIN POR E-MAIL (somente DEV)
CREATE OR REPLACE FUNCTION public.remove_admin_by_email(email text)
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = pg_catalog, public AS
$$
DECLARE
  uid uuid;
BEGIN
  IF NOT public.is_dev(auth.uid()) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  SELECT id INTO uid FROM auth.users WHERE lower(auth.users.email) = lower(remove_admin_by_email.email);
  IF uid IS NULL THEN
    RAISE EXCEPTION 'user not found';
  END IF;

  DELETE FROM public.admin_users WHERE user_id = uid;
END;
$$;

REVOKE ALL ON FUNCTION public.remove_admin_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remove_admin_by_email(text) TO PUBLIC;

