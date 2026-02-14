-- ==============================================================================
-- FIX: Delivery Confirmation RLS Error + Stock Decrement Logic
-- 
-- Problema: Usuários comuns (membros) não têm permissão para atualizar a tabela 'sales'.
-- Solução: Criar uma função segura (SECURITY DEFINER) para realizar a confirmação.
-- 
-- Update (Novo Requisito): Ao entregar, decrementar o estoque (estoque = pendentes).
-- ==============================================================================

CREATE OR REPLACE FUNCTION confirm_delivery(
  p_sale_id UUID,
  p_delivered_by UUID,
  p_received_by TEXT
)
RETURNS void AS $$
BEGIN
  -- 1. Inserir registro na tabela de entregas
  INSERT INTO public.deliveries (sale_id, delivered_by, received_by, confirmed_at)
  VALUES (p_sale_id, p_delivered_by, p_received_by, now());

  -- 2. Atualizar status da venda (Bypassing RLS via SECURITY DEFINER)
  UPDATE public.sales
  SET status = 'entregue'
  WHERE id = p_sale_id;

  -- 3. Decrementar estoque (estoque representa itens PENDENTES de entrega)
  -- Subtrai apenas a quantidade dos itens desta venda específica
  UPDATE public.products p
  SET stock_qty = GREATEST(0, p.stock_qty - si.quantity)
  FROM public.sale_items si
  WHERE si.sale_id = p_sale_id AND si.product_id = p.id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
