-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  Migration 006 — Invites + Signup Support                                   ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ── Tabela de Convites ──
CREATE TABLE IF NOT EXISTS public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'membro' CHECK (role IN ('presidente', 'membro')),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  used_by UUID REFERENCES public.profiles(id),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  max_uses INTEGER NOT NULL DEFAULT 1,
  use_count INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invites_code ON public.invites(code);
CREATE INDEX idx_invites_org ON public.invites(org_id);

-- ── RLS para Invites ──
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ler um convite pelo code (para aceitar)
CREATE POLICY "invites_select_by_code" ON public.invites
  FOR SELECT USING (true);

-- Presidente da org pode criar convites
CREATE POLICY "invites_insert_presidente" ON public.invites
  FOR INSERT WITH CHECK (
    org_id = get_user_org_id()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'presidente')
  );

-- Presidente pode atualizar (desativar) convites da própria org
CREATE POLICY "invites_update_presidente" ON public.invites
  FOR UPDATE USING (
    org_id = get_user_org_id()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'presidente')
  );

-- Presidente pode deletar convites
CREATE POLICY "invites_delete_presidente" ON public.invites
  FOR DELETE USING (
    org_id = get_user_org_id()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'presidente')
  );

-- ── Permitir INSERT na organizations para signup (usuário anônimo cria org) ──
-- Isso será feito via Service Role na API, então não precisa de policy pública.

-- ── Permitir INSERT no profiles para o próprio user ──
-- Adicionar policy para que um novo user possa criar seu próprio profile
CREATE POLICY "profiles_insert_self" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());
