-- ==============================================================================
-- MIGRATION 005 — Multi-tenant: Organizations
-- 
-- Adiciona suporte a múltiplas atléticas na plataforma.
-- Cada atlética é uma "organization" com seus próprios dados isolados.
--
-- ⚠️  EXECUTE NO SQL EDITOR DO SUPABASE (Dashboard > SQL Editor)
-- ==============================================================================


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  1. CRIAR TABELA ORGANIZATIONS                                              ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  logo_url TEXT,

  -- Tema visual
  primary_color TEXT NOT NULL DEFAULT '#0ea5e9',
  secondary_color TEXT NOT NULL DEFAULT '#0284c7',
  accent_color TEXT NOT NULL DEFAULT '#38bdf8',
  bg_color TEXT NOT NULL DEFAULT '#0a0e1a',

  -- Redes sociais
  instagram_url TEXT,
  twitter_url TEXT,
  youtube_url TEXT,
  whatsapp TEXT,

  -- Conteúdo da landing
  hero_title TEXT DEFAULT 'BEM-VINDO À',
  hero_subtitle TEXT,
  about_text TEXT,
  gallery_photos JSONB DEFAULT '[]'::jsonb,

  -- Billing / Plano
  plan TEXT NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial', 'basic', 'pro')),
  subscription_status TEXT NOT NULL DEFAULT 'trial'
    CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled', 'expired')),
  trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '14 days'),
  subscription_id TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger updated_at para organizations
CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Índice no slug para buscas rápidas
CREATE INDEX idx_organizations_slug ON public.organizations(slug);


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  2. CRIAR TABELA PLATFORM_ADMINS (super admins da plataforma)               ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

CREATE TABLE public.platform_admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  3. ADICIONAR org_id EM TODAS AS TABELAS EXISTENTES                         ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- profiles
ALTER TABLE public.profiles
  ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- products
ALTER TABLE public.products
  ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- sales
ALTER TABLE public.sales
  ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- tags
ALTER TABLE public.tags
  -- Remover UNIQUE do name (agora pode repetir entre orgs)
  DROP CONSTRAINT IF EXISTS tags_name_key;
ALTER TABLE public.tags
  ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
-- Unique composto: nome + org
ALTER TABLE public.tags
  ADD CONSTRAINT tags_name_org_unique UNIQUE (name, org_id);

-- notifications
ALTER TABLE public.notifications
  ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Índices para org_id
CREATE INDEX idx_profiles_org ON public.profiles(org_id);
CREATE INDEX idx_products_org ON public.products(org_id);
CREATE INDEX idx_sales_org ON public.sales(org_id);
CREATE INDEX idx_tags_org ON public.tags(org_id);
CREATE INDEX idx_notifications_org ON public.notifications(org_id);


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  4. FUNÇÃO HELPER: get_user_org_id()                                        ║
-- ║  Retorna o org_id do usuário logado. Usada em todas as RLS policies.        ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  5. ATUALIZAR RLS POLICIES — Isolar dados por organização                   ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ── Remover policies antigas ──
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'products', 'sales', 'sale_items', 'sale_tags', 'deliveries', 'notifications', 'tags')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ══ ORGANIZATIONS ══
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizations_select_public" ON public.organizations
  FOR SELECT USING (true);

CREATE POLICY "organizations_update_own" ON public.organizations
  FOR UPDATE USING (
    id = get_user_org_id()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'presidente')
  );

-- ══ PLATFORM_ADMINS ══
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_admins_select" ON public.platform_admins
  FOR SELECT USING (id = auth.uid());

-- ══ PROFILES ══ (scoped to org)
CREATE POLICY "profiles_select_same_org" ON public.profiles
  FOR SELECT USING (org_id = get_user_org_id() OR org_id IS NULL);

CREATE POLICY "profiles_insert_presidente" ON public.profiles
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'presidente' AND org_id = org_id)
  );

CREATE POLICY "profiles_update_presidente" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'presidente')
    AND org_id = get_user_org_id()
  );

-- ══ PRODUCTS ══ (scoped to org)
CREATE POLICY "products_select_same_org" ON public.products
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "products_insert_presidente" ON public.products
  FOR INSERT WITH CHECK (
    org_id = get_user_org_id()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'presidente')
  );

CREATE POLICY "products_update_presidente" ON public.products
  FOR UPDATE USING (
    org_id = get_user_org_id()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'presidente')
  );

CREATE POLICY "products_delete_presidente" ON public.products
  FOR DELETE USING (
    org_id = get_user_org_id()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'presidente')
  );

-- Permitir SELECT público para landing das atléticas (sem auth)
CREATE POLICY "products_select_public" ON public.products
  FOR SELECT USING (active = true);

-- ══ SALES ══ (scoped to org)
CREATE POLICY "sales_select_same_org" ON public.sales
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "sales_insert_same_org" ON public.sales
  FOR INSERT WITH CHECK (org_id = get_user_org_id() AND auth.uid() IS NOT NULL);

CREATE POLICY "sales_update_presidente" ON public.sales
  FOR UPDATE USING (
    org_id = get_user_org_id()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'presidente')
  );

CREATE POLICY "sales_delete_presidente" ON public.sales
  FOR DELETE USING (
    org_id = get_user_org_id()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'presidente')
  );

-- ══ SALE_ITEMS ══ (herda org via sale)
CREATE POLICY "sale_items_select_same_org" ON public.sale_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.sales WHERE sales.id = sale_items.sale_id AND sales.org_id = get_user_org_id())
  );

CREATE POLICY "sale_items_insert_same_org" ON public.sale_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ══ SALE_TAGS ══ (herda org via sale)
CREATE POLICY "sale_tags_select_same_org" ON public.sale_tags
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.sales WHERE sales.id = sale_tags.sale_id AND sales.org_id = get_user_org_id())
  );

CREATE POLICY "sale_tags_insert_same_org" ON public.sale_tags
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "sale_tags_delete_presidente" ON public.sale_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.sales s
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE s.id = sale_tags.sale_id AND s.org_id = p.org_id AND p.role = 'presidente'
    )
  );

-- ══ DELIVERIES ══ (herda org via sale)
CREATE POLICY "deliveries_select_same_org" ON public.deliveries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.sales WHERE sales.id = deliveries.sale_id AND sales.org_id = get_user_org_id())
  );

CREATE POLICY "deliveries_insert_same_org" ON public.deliveries
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ══ NOTIFICATIONS ══ (scoped to org)
CREATE POLICY "notifications_select_same_org" ON public.notifications
  FOR SELECT USING (
    org_id = get_user_org_id()
    AND (to_user = auth.uid() OR from_user = auth.uid())
  );

CREATE POLICY "notifications_insert_same_org" ON public.notifications
  FOR INSERT WITH CHECK (org_id = get_user_org_id() AND auth.uid() IS NOT NULL);

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (to_user = auth.uid() AND org_id = get_user_org_id());

-- ══ TAGS ══ (scoped to org)
CREATE POLICY "tags_select_same_org" ON public.tags
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "tags_insert_presidente" ON public.tags
  FOR INSERT WITH CHECK (
    org_id = get_user_org_id()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'presidente')
  );

CREATE POLICY "tags_update_presidente" ON public.tags
  FOR UPDATE USING (
    org_id = get_user_org_id()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'presidente')
  );

CREATE POLICY "tags_delete_presidente" ON public.tags
  FOR DELETE USING (
    org_id = get_user_org_id()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'presidente')
  );


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  6. ATUALIZAR RPCs — Incluir org_id                                         ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- Dropar RPCs antigas
DROP FUNCTION IF EXISTS register_sale(TEXT, TEXT, TEXT, TEXT, UUID, DECIMAL, JSONB, JSONB);
DROP FUNCTION IF EXISTS confirm_delivery(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS cancel_sale(UUID);

-- ── 6.1  Registrar Venda (com org_id) ──
CREATE OR REPLACE FUNCTION register_sale(
  p_buyer_name TEXT,
  p_buyer_contact TEXT,
  p_payment_method TEXT,
  p_notes TEXT,
  p_seller_id UUID,
  p_total_amount DECIMAL,
  p_items JSONB,
  p_tags JSONB
)
RETURNS UUID AS $$
DECLARE
  v_sale_id UUID;
  v_item JSONB;
  v_tag_id TEXT;
  v_org_id UUID;
BEGIN
  -- Buscar org_id do vendedor
  SELECT org_id INTO v_org_id FROM public.profiles WHERE id = p_seller_id;
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Vendedor não pertence a nenhuma organização';
  END IF;

  INSERT INTO public.sales (buyer_name, buyer_contact, payment_method, notes, seller_id, total_amount, status, org_id)
  VALUES (p_buyer_name, p_buyer_contact, p_payment_method, p_notes, p_seller_id, p_total_amount, 'pendente', v_org_id)
  RETURNING id INTO v_sale_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price)
    VALUES (v_sale_id, (v_item->>'product_id')::UUID, (v_item->>'quantity')::INT, (v_item->>'unit_price')::DECIMAL);

    UPDATE public.products
    SET stock_qty = stock_qty + (v_item->>'quantity')::INT
    WHERE id = (v_item->>'product_id')::UUID AND org_id = v_org_id;
  END LOOP;

  IF p_tags IS NOT NULL THEN
    FOR v_tag_id IN SELECT * FROM jsonb_array_elements_text(p_tags)
    LOOP
      INSERT INTO public.sale_tags (sale_id, tag_id)
      VALUES (v_sale_id, v_tag_id::UUID);
    END LOOP;
  END IF;

  RETURN v_sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 6.2  Confirmar Entrega ──
CREATE OR REPLACE FUNCTION confirm_delivery(
  p_sale_id UUID,
  p_delivered_by UUID,
  p_received_by TEXT
)
RETURNS void AS $$
DECLARE
  v_org_id UUID;
BEGIN
  SELECT org_id INTO v_org_id FROM public.sales WHERE id = p_sale_id;

  INSERT INTO public.deliveries (sale_id, delivered_by, received_by, confirmed_at)
  VALUES (p_sale_id, p_delivered_by, p_received_by, now());

  UPDATE public.sales
  SET status = 'entregue'
  WHERE id = p_sale_id AND org_id = v_org_id;

  UPDATE public.products p
  SET stock_qty = GREATEST(0, p.stock_qty - si.quantity)
  FROM public.sale_items si
  WHERE si.sale_id = p_sale_id AND si.product_id = p.id AND p.org_id = v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 6.3  Cancelar Venda ──
CREATE OR REPLACE FUNCTION cancel_sale(p_sale_id UUID)
RETURNS void AS $$
DECLARE
  v_org_id UUID;
BEGIN
  SELECT org_id INTO v_org_id FROM public.sales WHERE id = p_sale_id;

  UPDATE public.sales
  SET status = 'cancelado'
  WHERE id = p_sale_id AND org_id = v_org_id;

  UPDATE public.products p
  SET stock_qty = GREATEST(0, p.stock_qty - si.quantity)
  FROM public.sale_items si
  WHERE si.sale_id = p_sale_id AND si.product_id = p.id AND p.org_id = v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 6.4  Incrementar Estoque ──
CREATE OR REPLACE FUNCTION increment_stock(p_product_id UUID, p_qty INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE public.products
  SET stock_qty = stock_qty + p_qty
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  ✅ PRONTO!                                                                  ║
-- ║                                                                              ║
-- ║  Próximos passos:                                                            ║
-- ║  1. Crie uma organização:                                                    ║
-- ║     INSERT INTO public.organizations (slug, name)                            ║
-- ║     VALUES ('fipp', 'Atlética FIPP');                                        ║
-- ║                                                                              ║
-- ║  2. Atualize o profile do presidente com o org_id:                           ║
-- ║     UPDATE public.profiles                                                   ║
-- ║     SET org_id = (SELECT id FROM organizations WHERE slug = 'fipp')          ║
-- ║     WHERE email = 'seu@email.com';                                           ║
-- ║                                                                              ║
-- ║  3. Atualize produtos/sales/tags existentes (se houver):                     ║
-- ║     UPDATE public.products SET org_id = (SELECT id FROM organizations        ║
-- ║     WHERE slug = 'fipp');                                                    ║
-- ║     (Repita para sales, tags, notifications)                                 ║
-- ║                                                                              ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝
