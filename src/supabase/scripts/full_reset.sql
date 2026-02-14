-- ==============================================================================
-- FULL RESET — Atlética FIPP
-- 
-- Este script DESTRÓI TUDO e recria do zero:
--   1. Remove todas as policies (RLS)
--   2. Remove todos os triggers
--   3. Remove todas as funções
--   4. Remove todas as tabelas
--   5. Remove usuários do auth (opcional, comentado)
--   6. Recria todas as tabelas
--   7. Recria índices
--   8. Recria triggers e funções
--   9. Recria RPCs (register_sale, confirm_delivery, cancel_sale)
--  10. Recria RLS + policies
--  11. Habilita Realtime
--
-- ⚠️  EXECUTE NO SQL EDITOR DO SUPABASE (Dashboard > SQL Editor)
-- ⚠️  ISSO VAI APAGAR TODOS OS DADOS, VENDAS, PRODUTOS, PERFIS, ETC.
-- ==============================================================================


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  PARTE 1 — DESTRUIR TUDO                                                   ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ── 1.1  Remover Realtime ──
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ── 1.2  Remover todas as policies ──
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ── 1.3  Remover triggers ──
DROP TRIGGER IF EXISTS sales_updated_at ON public.sales;
DROP TRIGGER IF EXISTS sale_item_increment_stock ON public.sale_items;
DROP TRIGGER IF EXISTS sale_cancel_decrement_stock ON public.sales;
DO $$ BEGIN
  DROP TRIGGER IF EXISTS organizations_updated_at ON public.organizations;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ── 1.4  Remover funções ──
DROP FUNCTION IF EXISTS get_user_org_id() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS increment_stock_on_sale() CASCADE;
DROP FUNCTION IF EXISTS decrement_stock_on_cancel() CASCADE;
DROP FUNCTION IF EXISTS increment_stock(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS register_sale(TEXT, TEXT, TEXT, TEXT, UUID, DECIMAL, JSONB, JSONB) CASCADE;
DROP FUNCTION IF EXISTS confirm_delivery(UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS cancel_sale(UUID) CASCADE;

-- ── 1.5  Remover tabelas (ordem respeitando FKs) ──
DROP TABLE IF EXISTS public.platform_admins CASCADE;
DROP TABLE IF EXISTS public.sale_tags CASCADE;
DROP TABLE IF EXISTS public.sale_items CASCADE;
DROP TABLE IF EXISTS public.deliveries CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;

-- ── 1.6  (OPCIONAL) Deletar TODOS os usuários do auth ──
-- ⚠️  Descomente as linhas abaixo se quiser remover TODOS os logins também.
-- ⚠️  Você precisará criar um novo usuário presidente depois.
--
-- DELETE FROM auth.users;


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  PARTE 2 — CRIAR TABELAS                                                   ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ── 2.0  Organizations ──
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#0ea5e9',
  secondary_color TEXT NOT NULL DEFAULT '#0284c7',
  accent_color TEXT NOT NULL DEFAULT '#38bdf8',
  bg_color TEXT NOT NULL DEFAULT '#0a0e1a',
  instagram_url TEXT,
  twitter_url TEXT,
  youtube_url TEXT,
  whatsapp TEXT,
  hero_title TEXT DEFAULT 'BEM-VINDO À',
  hero_heading TEXT DEFAULT 'VISTA A',
  hero_subtitle TEXT,
  about_text TEXT,
  gallery_photos JSONB DEFAULT '[]'::jsonb,
  plan TEXT NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial', 'basic', 'pro')),
  subscription_status TEXT NOT NULL DEFAULT 'trial'
    CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled', 'expired')),
  trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '14 days'),
  subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2.0b  Platform Admins ──
CREATE TABLE public.platform_admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2.1  Profiles ──
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'membro' CHECK (role IN ('presidente', 'membro')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2.2  Products ──
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'outro' CHECK (type IN ('camiseta', 'caneca', 'outro')),
  size TEXT NOT NULL DEFAULT 'Único',
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  stock_qty INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2.3  Tags ──
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  CONSTRAINT tags_name_org_unique UNIQUE (name, org_id)
);

-- ── 2.4  Sales ──
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_name TEXT NOT NULL,
  buyer_contact TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'cartao', 'dinheiro')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'entregue', 'cancelado')),
  notes TEXT,
  seller_id UUID NOT NULL REFERENCES public.profiles(id),
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2.5  Sale Items ──
CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0)
);

-- ── 2.6  Sale Tags ──
CREATE TABLE public.sale_tags (
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (sale_id, tag_id)
);

-- ── 2.7  Deliveries ──
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL UNIQUE REFERENCES public.sales(id) ON DELETE CASCADE,
  delivered_by UUID NOT NULL REFERENCES public.profiles(id),
  received_by TEXT NOT NULL,
  notes TEXT,
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2.8  Notifications ──
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user UUID NOT NULL REFERENCES public.profiles(id),
  to_user UUID NOT NULL REFERENCES public.profiles(id),
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('erro', 'info', 'cancelamento')),
  read BOOLEAN NOT NULL DEFAULT false,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  PARTE 3 — ÍNDICES                                                          ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_sales_seller ON public.sales(seller_id);
CREATE INDEX idx_sales_status ON public.sales(status);
CREATE INDEX idx_sales_created ON public.sales(created_at DESC);
CREATE INDEX idx_sale_items_sale ON public.sale_items(sale_id);
CREATE INDEX idx_deliveries_sale ON public.deliveries(sale_id);
CREATE INDEX idx_notifications_to ON public.notifications(to_user, read);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);
CREATE INDEX idx_products_type ON public.products(type);
CREATE INDEX idx_products_active ON public.products(active);
CREATE INDEX idx_profiles_org ON public.profiles(org_id);
CREATE INDEX idx_products_org ON public.products(org_id);
CREATE INDEX idx_sales_org ON public.sales(org_id);
CREATE INDEX idx_tags_org ON public.tags(org_id);
CREATE INDEX idx_notifications_org ON public.notifications(org_id);


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  PARTE 4 — TRIGGER: updated_at                                              ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  PARTE 5 — RPCs (Funções de Negócio)                                        ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ── 5.1  Registrar Venda ──
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

-- ── 5.2  Confirmar Entrega ──
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

-- ── 5.3  Cancelar Venda ──
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

-- ── 5.4  Incrementar Estoque Manualmente ──
CREATE OR REPLACE FUNCTION increment_stock(p_product_id UUID, p_qty INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE public.products
  SET stock_qty = stock_qty + p_qty
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  PARTE 6 — HELPER FUNCTION + ROW LEVEL SECURITY (RLS)                      ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- Helper: retorna org_id do usuário logado
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── Habilitar RLS ──
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- ══ ORGANIZATIONS ══
CREATE POLICY "organizations_select_public" ON public.organizations
  FOR SELECT USING (true);

CREATE POLICY "organizations_update_own" ON public.organizations
  FOR UPDATE USING (
    id = get_user_org_id()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'presidente')
  );

-- ══ PLATFORM_ADMINS ══
CREATE POLICY "platform_admins_select" ON public.platform_admins
  FOR SELECT USING (id = auth.uid());

-- ══ PROFILES ══
CREATE POLICY "profiles_select_same_org" ON public.profiles
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "profiles_insert_presidente" ON public.profiles
  FOR INSERT WITH CHECK (
    org_id = get_user_org_id()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'presidente')
  );

CREATE POLICY "profiles_update_presidente" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'presidente')
    AND org_id = get_user_org_id()
  );

-- ══ PRODUCTS ══
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

-- ══ SALES ══
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

-- ══ SALE_ITEMS ══
CREATE POLICY "sale_items_select_same_org" ON public.sale_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.sales WHERE sales.id = sale_items.sale_id AND sales.org_id = get_user_org_id())
  );

CREATE POLICY "sale_items_insert_same_org" ON public.sale_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ══ SALE_TAGS ══
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

-- ══ DELIVERIES ══
CREATE POLICY "deliveries_select_same_org" ON public.deliveries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.sales WHERE sales.id = deliveries.sale_id AND sales.org_id = get_user_org_id())
  );

CREATE POLICY "deliveries_insert_same_org" ON public.deliveries
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ══ NOTIFICATIONS ══
CREATE POLICY "notifications_select_same_org" ON public.notifications
  FOR SELECT USING (
    org_id = get_user_org_id()
    AND (to_user = auth.uid() OR from_user = auth.uid())
  );

CREATE POLICY "notifications_insert_same_org" ON public.notifications
  FOR INSERT WITH CHECK (org_id = get_user_org_id() AND auth.uid() IS NOT NULL);

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (to_user = auth.uid() AND org_id = get_user_org_id());

-- ══ TAGS ══
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
-- ║  PARTE 7 — REALTIME                                                         ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  ✅ PRONTO! (Multi-tenant)                                                   ║
-- ║                                                                              ║
-- ║  Próximos passos:                                                            ║
-- ║  1. Crie uma organização:                                                    ║
-- ║     INSERT INTO public.organizations (slug, name)                            ║
-- ║     VALUES ('fipp', 'Atlética FIPP');                                        ║
-- ║                                                                              ║
-- ║  2. Crie um usuário no Supabase Auth (Dashboard > Authentication > Users)    ║
-- ║                                                                              ║
-- ║  3. Insira o profile do presidente COM org_id:                               ║
-- ║     INSERT INTO public.profiles (id, email, name, role, org_id)              ║
-- ║     VALUES (                                                                 ║
-- ║       'SEU-USER-UUID-AQUI',                                                  ║
-- ║       'seu@email.com',                                                       ║
-- ║       'Seu Nome',                                                            ║
-- ║       'presidente',                                                          ║
-- ║       (SELECT id FROM organizations WHERE slug = 'fipp')                     ║
-- ║     );                                                                       ║
-- ║                                                                              ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝
