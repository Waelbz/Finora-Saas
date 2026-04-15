-- ═══════════════════════════════════════════════════════════
-- FINORA — Schema Supabase
-- Migration: 001_initial_schema.sql
-- ═══════════════════════════════════════════════════════════

-- ── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── PROFILES (lié à Clerk users) ────────────────────────────
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','cabinet')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  anthropic_api_key_encrypted TEXT, -- clé chiffrée côté serveur
  global_cfg JSONB DEFAULT '{"jach":"HA","jvte":"VT","jbnq":"BNQ","jod":"OD"}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── COMPANIES (sociétés) ─────────────────────────────────────
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  siren TEXT,
  siren_validated BOOLEAN DEFAULT FALSE,
  dossier TEXT,
  exercice TEXT DEFAULT '2026',
  tva_regime TEXT DEFAULT 'reel_normal',
  type TEXT DEFAULT 'sarl',
  color TEXT DEFAULT '#6c47ff',
  address TEXT,
  city TEXT,
  postal_code TEXT,
  email TEXT,
  phone TEXT,
  stats JSONB DEFAULT '{"invoices":0,"releves":0,"bulletins":0,"immobilisations":0}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── INVOICES (factures traitées) ─────────────────────────────
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_url TEXT, -- Supabase Storage URL
  type TEXT DEFAULT 'achat' CHECK (type IN ('achat','vente','avoir_fournisseur','avoir_client')),
  supplier TEXT,
  amount_ht DECIMAL(12,2),
  tva DECIMAL(12,2),
  amount_ttc DECIMAL(12,2),
  date_invoice DATE,
  journal TEXT DEFAULT 'HA',
  arf_lines JSONB, -- écritures ARF générées
  fec_lines JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processed','error')),
  error_msg TEXT,
  raw_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── BANK_STATEMENTS (relevés bancaires) ──────────────────────
CREATE TABLE public.bank_statements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_url TEXT,
  bank_name TEXT,
  period TEXT,
  journal TEXT DEFAULT 'BNQ',
  operations JSONB DEFAULT '[]', -- tableau des opérations analysées
  arf_lines JSONB,
  total_debit DECIMAL(12,2) DEFAULT 0,
  total_credit DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── EMPLOYEES (salariés) ────────────────────────────────────
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  poste TEXT,
  contrat TEXT DEFAULT 'CDI' CHECK (contrat IN ('CDI','CDD','apprenti','stage')),
  brut DECIMAL(10,2) DEFAULT 0,
  taux_horaire DECIMAL(8,4) DEFAULT 0,
  jours_mois INTEGER DEFAULT 22,
  heures_semaine DECIMAL(5,2) DEFAULT 35,
  cotis_sal DECIMAL(5,2) DEFAULT 22,
  cotis_pat DECIMAL(5,2) DEFAULT 42,
  pas DECIMAL(5,2) DEFAULT 0,
  tr_val DECIMAL(6,2) DEFAULT 9,
  tr_pct INTEGER DEFAULT 50,
  mutuelle_sal DECIMAL(8,2) DEFAULT 0,
  mutuelle_emp DECIMAL(8,2) DEFAULT 0,
  secu TEXT,
  iban TEXT,
  date_entree DATE,
  color TEXT DEFAULT '#6c47ff',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── PAYROLL_BULLETINS (bulletins de paie) ───────────────────
CREATE TABLE public.payroll_bulletins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period TEXT NOT NULL, -- "2026-03"
  brut DECIMAL(10,2),
  net DECIMAL(10,2),
  cotis_sal DECIMAL(10,2),
  cotis_pat DECIMAL(10,2),
  pas DECIMAL(10,2),
  tickets_restaurant DECIMAL(10,2),
  jours INTEGER DEFAULT 22,
  absences INTEGER DEFAULT 0,
  prime DECIMAL(10,2) DEFAULT 0,
  arf_lines JSONB,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── IMMOBILISATIONS ─────────────────────────────────────────
CREATE TABLE public.immobilisations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  description TEXT,
  valeur DECIMAL(12,2) NOT NULL,
  date_acquisition DATE NOT NULL,
  duree INTEGER NOT NULL DEFAULT 5,
  mode TEXT DEFAULT 'lineaire' CHECK (mode IN ('lineaire','degressif')),
  compte_immo TEXT DEFAULT '218100',
  compte_dotation TEXT DEFAULT '681100',
  compte_amort TEXT DEFAULT '281100',
  current_year INTEGER DEFAULT 2026,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── AUDIT_REPORTS ───────────────────────────────────────────
CREATE TABLE public.audit_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'general',
  exercice TEXT DEFAULT '2026',
  score INTEGER,
  verdict TEXT,
  sections JSONB DEFAULT '[]',
  files_analyzed INTEGER DEFAULT 0,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CHAT_SESSIONS (conversations Expert IA) ─────────────────
CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  title TEXT DEFAULT 'Nouvelle conversation',
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ELECTRONIC_INVOICES (factures émises Factur-X) ──────────
CREATE TABLE public.electronic_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  client_name TEXT,
  client_siren TEXT,
  date_emission DATE,
  date_echeance DATE,
  total_ht DECIMAL(12,2),
  total_tva DECIMAL(12,2),
  total_ttc DECIMAL(12,2),
  categorie TEXT DEFAULT 'service',
  lines JSONB DEFAULT '[]',
  xml_content TEXT, -- XML Factur-X
  pdf_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ACTIVITY_LOG ────────────────────────────────────────────
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'invoice','bank','payroll','audit','immobilisation','chat'
  label TEXT,
  amount TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ROW LEVEL SECURITY ──────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_bulletins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immobilisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electronic_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Policies : chaque utilisateur voit seulement ses données
-- (via clerk_user_id passé comme JWT claim)

CREATE POLICY "Users see own profile" ON public.profiles
  FOR ALL USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users see own companies" ON public.companies
  FOR ALL USING (profile_id IN (
    SELECT id FROM public.profiles WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- (Même pattern pour toutes les tables liées à profile_id)
CREATE POLICY "Users see own invoices" ON public.invoices
  FOR ALL USING (profile_id IN (SELECT id FROM public.profiles WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users see own bank" ON public.bank_statements
  FOR ALL USING (profile_id IN (SELECT id FROM public.profiles WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users see own employees" ON public.employees
  FOR ALL USING (profile_id IN (SELECT id FROM public.profiles WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users see own bulletins" ON public.payroll_bulletins
  FOR ALL USING (profile_id IN (SELECT id FROM public.profiles WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users see own immo" ON public.immobilisations
  FOR ALL USING (profile_id IN (SELECT id FROM public.profiles WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users see own audits" ON public.audit_reports
  FOR ALL USING (profile_id IN (SELECT id FROM public.profiles WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users see own chats" ON public.chat_sessions
  FOR ALL USING (profile_id IN (SELECT id FROM public.profiles WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users see own e-invoices" ON public.electronic_invoices
  FOR ALL USING (profile_id IN (SELECT id FROM public.profiles WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users see own activity" ON public.activity_log
  FOR ALL USING (profile_id IN (SELECT id FROM public.profiles WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'));

-- ── INDEXES ─────────────────────────────────────────────────
CREATE INDEX idx_companies_profile ON public.companies(profile_id);
CREATE INDEX idx_invoices_company ON public.invoices(company_id);
CREATE INDEX idx_invoices_profile ON public.invoices(profile_id);
CREATE INDEX idx_bank_company ON public.bank_statements(company_id);
CREATE INDEX idx_employees_company ON public.employees(company_id);
CREATE INDEX idx_bulletins_employee ON public.payroll_bulletins(employee_id);
CREATE INDEX idx_bulletins_company ON public.payroll_bulletins(company_id);
CREATE INDEX idx_immo_company ON public.immobilisations(company_id);
CREATE INDEX idx_activity_profile ON public.activity_log(profile_id);
CREATE INDEX idx_activity_company ON public.activity_log(company_id);
CREATE INDEX idx_chat_profile ON public.chat_sessions(profile_id);

-- ── UPDATED_AT TRIGGER ──────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_employees_updated BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_chat_updated BEFORE UPDATE ON public.chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── STORAGE BUCKETS ─────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES
  ('invoices', 'invoices', false),
  ('bank-statements', 'bank-statements', false),
  ('payroll', 'payroll', false),
  ('audit', 'audit', false),
  ('exports', 'exports', false);
