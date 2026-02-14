-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  MIGRATION 007 — Fix RLS: Remove cross-org leaking policies                ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- PROBLEMA: A policy "products_select_public" permite que qualquer produto ativo
-- seja visível por qualquer usuário logado, independente da org.
-- No PostgreSQL, policies de SELECT são combinadas com OR, então:
--   products_select_same_org (org_id = get_user_org_id())  OR
--   products_select_public   (active = true)
-- = TODOS os produtos ativos ficam visíveis para todos.

-- ══ FIX PRODUCTS ══
-- Remove a policy que vaza dados entre orgs
DROP POLICY IF EXISTS "products_select_public" ON public.products;

-- Garante que a policy correta existe (idempotente)
DROP POLICY IF EXISTS "products_select_same_org" ON public.products;
CREATE POLICY "products_select_same_org" ON public.products
  FOR SELECT USING (org_id = get_user_org_id());

-- ══ FIX PROFILES ══
-- Remove o "OR org_id IS NULL" que pode vazar perfis órfãos
DROP POLICY IF EXISTS "profiles_select_same_org" ON public.profiles;
CREATE POLICY "profiles_select_same_org" ON public.profiles
  FOR SELECT USING (org_id = get_user_org_id());

-- ══ FIX PROFILES INSERT ══
-- A policy de INSERT de profiles precisa permitir o primeiro insert
-- (quando o usuário ainda não tem profile, get_user_org_id() retorna NULL)
-- Mas só via service_role (signup API). Para presidente criando membros,
-- deve verificar que está inserindo na mesma org.
DROP POLICY IF EXISTS "profiles_insert_presidente" ON public.profiles;
CREATE POLICY "profiles_insert_presidente" ON public.profiles
  FOR INSERT WITH CHECK (
    org_id = get_user_org_id()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'presidente')
  );

-- ══ DONE ══
-- Agora:
--   - products: só visíveis para membros da mesma org
--   - profiles: só visíveis para membros da mesma org
--   - sales: já estava correto (org_id = get_user_org_id())
--   - tags: já estava correto (org_id = get_user_org_id())
