-- ==============================================================================
-- RESET DATABASE (Manter Logins e Produtos)
-- 
-- Este comando apaga TODAS as vendas, entregas, notificações e itens.
-- Mantém: Usuários (auth + profiles), Produtos (definições) e Tags.
-- Reseta: O estoque (quantidade vendida) dos produtos para 0.
-- ==============================================================================

BEGIN;

-- 1. Limpar tabelas transacionais (ordem importa por causa das chaves estrangeiras)
TRUNCATE TABLE public.sale_items, public.sale_tags, public.deliveries, public.notifications, public.sales RESTART IDENTITY CASCADE;

-- 2. Resetar contagem de estoque (vendas) dos produtos para 0
UPDATE public.products SET stock_qty = 0;

COMMIT;
