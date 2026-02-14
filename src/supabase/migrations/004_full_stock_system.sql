-- ==============================================================================
-- ROBUST STOCK SYSTEM (RPC-BASED)
-- 
-- Problema: Triggers falham por permissão (RLS). Updates parciais podem ocorrer.
-- Solução: Mover TODA a lógica de transação para funções RPC (Security Definer).
-- ==============================================================================

-- 1. Remover Triggers antigos (para evitar conflito/duplicação)
DROP TRIGGER IF EXISTS sale_item_increment_stock ON public.sale_items;
DROP TRIGGER IF EXISTS sale_cancel_decrement_stock ON public.sales;
DROP FUNCTION IF EXISTS increment_stock_on_sale;
DROP FUNCTION IF EXISTS decrement_stock_on_cancel;

-- 2. RPC: Registrar Venda (Creates Sale + Items + Increments Stock + Tags)
CREATE OR REPLACE FUNCTION register_sale(
  p_buyer_name TEXT,
  p_buyer_contact TEXT,
  p_payment_method TEXT,
  p_notes TEXT,
  p_seller_id UUID,
  p_total_amount DECIMAL,
  p_items JSONB, -- Array of objects: {product_id, quantity, unit_price}
  p_tags JSONB   -- Array of strings: tag_id
)
RETURNS UUID AS $$
DECLARE
  v_sale_id UUID;
  v_item JSONB;
  v_tag_id TEXT;
BEGIN
  -- Insert Sale
  INSERT INTO public.sales (buyer_name, buyer_contact, payment_method, notes, seller_id, total_amount, status)
  VALUES (p_buyer_name, p_buyer_contact, p_payment_method, p_notes, p_seller_id, p_total_amount, 'pendente')
  RETURNING id INTO v_sale_id;

  -- Insert Items & Update Stock (Increment)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price)
    VALUES (v_sale_id, (v_item->>'product_id')::UUID, (v_item->>'quantity')::INT, (v_item->>'unit_price')::DECIMAL);

    -- Increment stock (Pendentes sobe)
    UPDATE public.products
    SET stock_qty = stock_qty + (v_item->>'quantity')::INT
    WHERE id = (v_item->>'product_id')::UUID;
  END LOOP;

  -- Insert Tags
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


-- 3. RPC: Confirmar Entrega (Update Status + Decrement Stock)
CREATE OR REPLACE FUNCTION confirm_delivery(
  p_sale_id UUID,
  p_delivered_by UUID,
  p_received_by TEXT
)
RETURNS void AS $$
BEGIN
  -- Insert Delivery Record
  INSERT INTO public.deliveries (sale_id, delivered_by, received_by, confirmed_at)
  VALUES (p_sale_id, p_delivered_by, p_received_by, now());

  -- Update Sale Status
  UPDATE public.sales
  SET status = 'entregue'
  WHERE id = p_sale_id;

  -- Decrement Stock (Pendentes desce)
  UPDATE public.products p
  SET stock_qty = GREATEST(0, p.stock_qty - si.quantity)
  FROM public.sale_items si
  WHERE si.sale_id = p_sale_id AND si.product_id = p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. RPC: Cancelar Venda (Update Status + Decrement Stock)
CREATE OR REPLACE FUNCTION cancel_sale(p_sale_id UUID)
RETURNS void AS $$
BEGIN
  -- Update Sale Status
  UPDATE public.sales
  SET status = 'cancelado'
  WHERE id = p_sale_id;

  -- Decrement Stock (Pendentes desce, pois foi cancelado)
  UPDATE public.products p
  SET stock_qty = GREATEST(0, p.stock_qty - si.quantity)
  FROM public.sale_items si
  WHERE si.sale_id = p_sale_id AND si.product_id = p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
