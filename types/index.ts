// ═══════════════════════════════════════════════════════
// FINORA — Types TypeScript
// ═══════════════════════════════════════════════════════

export interface Profile {
  id: string
  clerk_user_id: string
  email: string
  full_name?: string
  avatar_url?: string
  plan: 'free' | 'pro' | 'cabinet'
  stripe_customer_id?: string
  stripe_subscription_id?: string
  subscription_status?: string
  global_cfg: {
    jach: string
    jvte: string
    jbnq: string
    jod: string
  }
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  profile_id: string
  name: string
  siren?: string
  siren_validated?: boolean
  dossier?: string
  exercice: string
  tva_regime?: string
  type?: string
  color: string
  address?: string
  city?: string
  postal_code?: string
  email?: string
  phone?: string
  stats: {
    invoices: number
    releves: number
    bulletins: number
    immobilisations: number
  }
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  company_id: string
  profile_id: string
  filename: string
  file_url?: string
  type: 'achat' | 'vente' | 'avoir_fournisseur' | 'avoir_client'
  supplier?: string
  amount_ht?: number
  tva?: number
  amount_ttc?: number
  date_invoice?: string
  journal: string
  arf_lines?: ARFLine[]
  fec_lines?: FECLine[]
  status: 'pending' | 'processed' | 'error'
  error_msg?: string
  raw_analysis?: Record<string, unknown>
  created_at: string
}

export interface ARFLine {
  date: string
  journal: string
  compte: string
  piece: string
  libelle: string
  sens: 'D' | 'C'
  montant: number
}

export interface FECLine {
  JournalCode: string
  JournalLib: string
  EcritureNum: string
  EcritureDate: string
  CompteNum: string
  CompteLib: string
  CompAuxNum?: string
  CompAuxLib?: string
  PieceRef?: string
  PieceDate?: string
  EcritureLib: string
  Debit: number
  Credit: number
  EcritureLet?: string
  DateLet?: string
  ValidDate?: string
  Montantdevise?: number
  Idevise?: string
}

export interface BankStatement {
  id: string
  company_id: string
  profile_id: string
  filename: string
  file_url?: string
  bank_name?: string
  period?: string
  journal: string
  operations: BankOperation[]
  arf_lines?: ARFLine[]
  total_debit: number
  total_credit: number
  status: 'pending' | 'processed' | 'error'
  created_at: string
}

export interface BankOperation {
  date: string
  libelle: string
  montant: number
  sens: 'D' | 'C'
  contrepartie: string
  libelle_contrepartie: string
}

export interface Employee {
  id: string
  company_id: string
  profile_id: string
  nom: string
  poste?: string
  contrat: 'CDI' | 'CDD' | 'apprenti' | 'stage'
  brut: number
  taux_horaire: number
  jours_mois: number
  heures_semaine: number
  cotis_sal: number
  cotis_pat: number
  pas: number
  tr_val: number
  tr_pct: number
  mutuelle_sal: number
  mutuelle_emp: number
  secu?: string
  iban?: string
  date_entree?: string
  color: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface PayrollBulletin {
  id: string
  employee_id: string
  company_id: string
  profile_id: string
  period: string
  brut: number
  net: number
  cotis_sal: number
  cotis_pat: number
  pas: number
  tickets_restaurant: number
  jours: number
  absences: number
  prime: number
  arf_lines?: ARFLine[]
  pdf_url?: string
  created_at: string
}

export interface Immobilisation {
  id: string
  company_id: string
  profile_id: string
  nom: string
  description?: string
  valeur: number
  date_acquisition: string
  duree: number
  mode: 'lineaire' | 'degressif'
  compte_immo: string
  compte_dotation: string
  compte_amort: string
  current_year: number
  active: boolean
  created_at: string
}

export interface AuditReport {
  id: string
  company_id: string
  profile_id: string
  type: string
  exercice: string
  score?: number
  verdict?: string
  sections: AuditSection[]
  files_analyzed: number
  pdf_url?: string
  created_at: string
}

export interface AuditSection {
  title: string
  severity: 'ok' | 'warning' | 'error'
  items: AuditItem[]
}

export interface AuditItem {
  ok: boolean
  label: string
  detail?: string
}

export interface ChatSession {
  id: string
  profile_id: string
  company_id?: string
  title: string
  messages: ChatMessage[]
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  file?: { name: string; url?: string }
}

export interface ElectronicInvoice {
  id: string
  company_id: string
  profile_id: string
  invoice_number: string
  client_name?: string
  client_siren?: string
  date_emission?: string
  date_echeance?: string
  total_ht: number
  total_tva: number
  total_ttc: number
  categorie: string
  lines: InvoiceLine[]
  xml_content?: string
  pdf_url?: string
  status: 'draft' | 'sent' | 'paid' | 'cancelled'
  created_at: string
}

export interface InvoiceLine {
  desc: string
  qte: number
  pu: number
  tva: number
}

export interface ActivityLogEntry {
  id: string
  profile_id: string
  company_id?: string
  type: 'invoice' | 'bank' | 'payroll' | 'audit' | 'immobilisation' | 'chat'
  label: string
  amount?: string
  metadata?: Record<string, unknown>
  created_at: string
}

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

// Anthropic analysis types
export interface InvoiceAnalysisResult {
  fournisseur: string
  numero_facture: string
  date: string
  montant_ht: number
  tva: number
  montant_ttc: number
  type_facture: string
  journal: string
  compte_fournisseur: string
  ecritures: ARFLine[]
}

export interface BankAnalysisResult {
  operations: BankOperation[]
  banque: string
  periode: string
  solde_debut: number
  solde_fin: number
}
