-- ========================================
-- ATLÉTICS — Schema Inicial
-- PostgreSQL via Supabase
-- ========================================

-- Tabela de perfis de usuários (extensão do auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'membro' CHECK (role IN ('presidente', 'membro')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Produtos
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'outro' CHECK (type IN ('camiseta', 'caneca', 'outro')),
  size TEXT NOT NULL DEFAULT 'Único',
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  stock_qty INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tags
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#3B82F6'
);

-- Vendas
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_name TEXT NOT NULL,
  buyer_contact TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'cartao', 'dinheiro')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'entregue', 'cancelado')),
  notes TEXT,
  seller_id UUID NOT NULL REFERENCES public.profiles(id),
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Itens da venda (muitos-para-muitos: venda ↔ produto)
CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0)
);

-- Tags da venda (muitos-para-muitos)
CREATE TABLE IF NOT EXISTS public.sale_tags (
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (sale_id, tag_id)
);

-- Entregas
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL UNIQUE REFERENCES public.sales(id) ON DELETE CASCADE,
  delivered_by UUID NOT NULL REFERENCES public.profiles(id),
  received_by TEXT NOT NULL,
  notes TEXT,
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notificações
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user UUID NOT NULL REFERENCES public.profiles(id),
  to_user UUID NOT NULL REFERENCES public.profiles(id),
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('erro', 'info', 'cancelamento')),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================
-- ÍNDICES
-- =====================
CREATE INDEX IF NOT EXISTS idx_sales_seller ON public.sales(seller_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_created ON public.sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_sale ON public.deliveries(sale_id);
CREATE INDEX IF NOT EXISTS idx_notifications_to ON public.notifications(to_user, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(type);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active);

-- =====================
-- TRIGGER: updated_at em sales
-- =====================
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

-- =====================
-- TRIGGER: Incrementar estoque ao inserir sale_item (produtos sob demanda)
-- stock_qty = total de unidades vendidas/encomendadas
-- =====================
CREATE OR REPLACE FUNCTION increment_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET stock_qty = stock_qty + NEW.quantity
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sale_item_increment_stock
  AFTER INSERT ON public.sale_items
  FOR EACH ROW EXECUTE FUNCTION increment_stock_on_sale();

-- =====================
-- TRIGGER: Decrementar estoque ao cancelar venda (reverter o incremento)
-- =====================
CREATE OR REPLACE FUNCTION decrement_stock_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelado' AND OLD.status != 'cancelado' THEN
    UPDATE public.products p
    SET stock_qty = GREATEST(0, p.stock_qty - si.quantity)
    FROM public.sale_items si
    WHERE si.sale_id = NEW.id AND si.product_id = p.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sale_cancel_decrement_stock
  BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION decrement_stock_on_cancel();

-- =====================
-- RPC: Incrementar estoque manualmente (fallback)
-- =====================
CREATE OR REPLACE FUNCTION increment_stock(p_product_id UUID, p_qty INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE public.products
  SET stock_qty = stock_qty + p_qty
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================
-- ROW LEVEL SECURITY
-- =====================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'presidente')
  );

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'presidente')
  );

-- PRODUCTS
CREATE POLICY "products_select" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "products_insert" ON public.products
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'presidente')
  );

CREATE POLICY "products_update" ON public.products
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'presidente')
  );

CREATE POLICY "products_delete" ON public.products
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'presidente')
  );

-- SALES
CREATE POLICY "sales_select" ON public.sales
  FOR SELECT USING (true);

CREATE POLICY "sales_insert" ON public.sales
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "sales_update" ON public.sales
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'presidente')
  );

CREATE POLICY "sales_delete" ON public.sales
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'presidente')
  );

-- SALE_ITEMS
CREATE POLICY "sale_items_select" ON public.sale_items
  FOR SELECT USING (true);

CREATE POLICY "sale_items_insert" ON public.sale_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- SALE_TAGS
CREATE POLICY "sale_tags_select" ON public.sale_tags
  FOR SELECT USING (true);

CREATE POLICY "sale_tags_insert" ON public.sale_tags
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "sale_tags_delete" ON public.sale_tags
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'presidente')
  );

-- DELIVERIES
CREATE POLICY "deliveries_select" ON public.deliveries
  FOR SELECT USING (true);

CREATE POLICY "deliveries_insert" ON public.deliveries
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- NOTIFICATIONS
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT USING (to_user = auth.uid() OR from_user = auth.uid());

CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE USING (to_user = auth.uid());

-- TAGS
CREATE POLICY "tags_select" ON public.tags
  FOR SELECT USING (true);

CREATE POLICY "tags_insert" ON public.tags
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'presidente')
  );

CREATE POLICY "tags_update" ON public.tags
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'presidente')
  );

CREATE POLICY "tags_delete" ON public.tags
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'presidente')
  );

-- =====================
-- REALTIME: Habilitar para notificações
-- =====================
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
