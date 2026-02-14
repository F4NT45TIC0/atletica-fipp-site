-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  MIGRATION 008 — Add hero_heading column to organizations                  ║
-- ║  Allows customizing the main hero title text (e.g. "VISTA A")              ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS hero_heading TEXT DEFAULT 'VISTA A';
