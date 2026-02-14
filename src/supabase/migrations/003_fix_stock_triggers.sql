-- ==============================================================================
-- FIX: Stock Triggers RLS Error
-- 
-- Problema: Membros não têm permissão de UPDATE na tabela 'products', então os triggers falham ao tentar ajustar estoque.
-- Solução: Redefinir as funções de trigger como SECURITY DEFINER (bypass RLS).
-- ==============================================================================

-- 1. Incrementar Estoque (Venda Nova)
CREATE OR REPLACE FUNCTION increment_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET stock_qty = stock_qty + NEW.quantity
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Decrementar Estoque (Cancelamento)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
